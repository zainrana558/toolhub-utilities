import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import path from "node:path";

/**
 * PDF → Word (DOCX) API
 *
 * Extracts text from a PDF using pdfjs-dist and packages it into a DOCX file.
 * Each PDF paragraph becomes a DOCX paragraph. Headings are not inferred —
 * everything is body text — because text extraction from PDFs is fundamentally
 * heuristic (PDFs don't store paragraph/heading structure).
 *
 * Stays server-side because the `docx` library is heavy (~1 MB) and we don't
 * want to ship it in the client bundle. Could be moved client-side in the
 * future if needed — `docx` is isomorphic.
 *
 * Vercel caps request bodies at 4.5 MB on all tiers. For larger PDFs, the
 * user should use the client-side pdf-to-text tool (which has no upload
 * limit) and paste into Word manually, OR run pdf-to-word locally.
 *
 * Limits:
 *   - Max input size: 4.5 MB (Vercel edge limit)
 *   - In-memory rate limit: 15 req / 10 min / IP
 *     ⚠️ NOTE: does NOT work on Vercel serverless — each invocation is a
 *     fresh instance. Replace with Vercel KV / Upstash for real rate limiting.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_INPUT_BYTES = 4_500_000; // 4.5 MB — Vercel's actual edge limit
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 15;

type SubmissionRecord = { count: number; firstAt: number };
const ipHits = new Map<string, SubmissionRecord>();

function cleanupRateLimit(now: number) {
  for (const [ip, rec] of ipHits) {
    if (now - rec.firstAt > RATE_LIMIT_WINDOW_MS) ipHits.delete(ip);
  }
}

function rateLimit(ip: string): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  cleanupRateLimit(now);
  const rec = ipHits.get(ip);
  if (!rec) {
    ipHits.set(ip, { count: 1, firstAt: now });
    return { ok: true };
  }
  if (now - rec.firstAt > RATE_LIMIT_WINDOW_MS) {
    ipHits.set(ip, { count: 1, firstAt: now });
    return { ok: true };
  }
  rec.count += 1;
  if (rec.count > RATE_LIMIT_MAX) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((rec.firstAt + RATE_LIMIT_WINDOW_MS - now) / 1000),
    };
  }
  return { ok: true };
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  // Use pdfjs-dist directly for text extraction. Same engine as pdf-to-jpg,
  // which is already proven to work server-side under Turbopack.
  let doc: { destroy: () => Promise<void>; numPages: number; getPage: (n: number) => Promise<any> } | null = null;
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = path.join(
      process.cwd(),
      "node_modules",
      "pdfjs-dist",
      "legacy",
      "build",
      "pdf.worker.mjs",
    );

    doc = await pdfjs.getDocument({
      data: bytes as unknown as ArrayBuffer,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    const out: string[] = [];
    const count = Math.min(doc.numPages, 200);
    for (let i = 1; i <= count; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      // Group items by their Y position to reconstruct lines.
      const lines = new Map<number, string[]>();
      for (const item of content.items) {
        if (!("str" in item) || typeof item.str !== "string") continue;
        const ty = item.transform[5];
        const key = Math.round(ty);
        if (!lines.has(key)) lines.set(key, []);
        lines.get(key)!.push(item.str);
      }
      const sortedKeys = Array.from(lines.keys()).sort((a, b) => b - a);
      for (const k of sortedKeys) {
        const parts = lines.get(k)!;
        const line = parts.join(" ").replace(/\s+/g, " ").trim();
        if (line) out.push(line);
      }
      out.push(""); // page break
      page.cleanup();
    }
    const text = out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (text) return text;
  } catch (e) {
    console.error("[pdf-to-word] pdfjs text extraction failed:", e instanceof Error ? e.message : e);
  } finally {
    if (doc) {
      try { await doc.destroy(); } catch { /* already tearing down */ }
    }
  }
  return scanPdfText(bytes);
}

function scanPdfText(bytes: Uint8Array): string {
  // Decode as latin1 in one shot — the previous char-by-char concat was O(n²).
  const s = new TextDecoder("latin1").decode(bytes);
  const out: string[] = [];
  const tjRe = /\(((?:[^()\\]|\\.)*)\)\s*Tj/g;
  const tjArrRe = /\[([^\]]*)\]\s*TJ/g;
  let m: RegExpExecArray | null;
  while ((m = tjRe.exec(s)) !== null) out.push(decodePdfString(m[1]));
  while ((m = tjArrRe.exec(s)) !== null) {
    const inner = m[1];
    const parts = inner.match(/\(((?:[^()\\]|\\.)*)\)/g) || [];
    for (const p of parts) out.push(decodePdfString(p.slice(1, -1)));
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function decodePdfString(raw: string): string {
  const s = raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
  if (/^\xfe\xff/.test(s)) {
    const stripped = s.slice(2);
    let out = "";
    for (let i = 0; i < stripped.length; i += 2) {
      out += String.fromCharCode((stripped.charCodeAt(i) << 8) | stripped.charCodeAt(i + 1));
    }
    return out;
  }
  return s;
}

async function textToDocx(text: string, title: string): Promise<Uint8Array> {
  const paragraphs: Paragraph[] = [
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
  ];

  const blocks = text.split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split(/\n/);
    if (lines.length === 1) {
      paragraphs.push(new Paragraph({ children: [new TextRun(lines[0])] }));
    } else {
      paragraphs.push(
        new Paragraph({
          children: lines.flatMap((l, i) =>
            i === 0
              ? [new TextRun(l)]
              : [new TextRun({ text: "", break: 1 }), new TextRun(l)],
          ),
        }),
      );
    }
  }

  const doc = new Document({
    creator: "ToolHub PDF to Word",
    title,
    sections: [{ children: paragraphs }],
  });
  const blob = await Packer.toBlob(doc);
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } },
    );
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ ok: false, error: "Expected multipart/form-data." }, { status: 400 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing 'file'." }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ ok: false, error: "Input must be a PDF." }, { status: 400 });
  }
  if (file.size > MAX_INPUT_BYTES) {
    return NextResponse.json(
      { ok: false, error: `File too large. Max 4.5 MB on Vercel. For larger PDFs, use the client-side pdf-to-text tool and paste into Word.` },
      { status: 413 },
    );
  }

  try {
    const buf = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(buf);
    const text = await extractPdfText(pdfBytes);
    if (!text.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No extractable text found in this PDF. It may be a scanned image (would need OCR) or have text encoded as images.",
        },
        { status: 422 },
      );
    }

    const baseName = file.name.replace(/\.pdf$/i, "");
    const docxBytes = await textToDocx(text, baseName);

    return new NextResponse(docxBytes as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(baseName)}.docx"`,
        "Cache-Control": "no-store",
        "X-Text-Length": String(text.length),
      },
    });
  } catch (err) {
    console.error("[pdf-to-word] failed", err);
    const msg = err instanceof Error ? err.message : "PDF to Word conversion failed.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "pdf-to-word",
    maxBytes: MAX_INPUT_BYTES,
    note: "Scanned PDFs require OCR — text-only PDFs supported.",
  });
}
