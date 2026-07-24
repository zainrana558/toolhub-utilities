import { NextResponse } from "next/server";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFPage,
} from "pdf-lib";
import mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import path from "node:path";
import { marked } from "marked";

/**
 * File Converter API
 *
 * Supported conversions (input → output):
 *   - pdf  → txt, html, markdown
 *   - docx → txt, html, markdown, pdf
 *   - md   → html, pdf, txt, docx
 *   - txt  → html, pdf, md, docx
 *   - html → txt, pdf, md, docx
 *
 * Conversions are performed server-side because the libraries
 * (mammoth, docx, pdf-lib, marked) are Node-only or much heavier
 * to ship to the browser.
 *
 * Limits:
 *   - Max input size: 4.5 MB (Vercel edge limit)
 *   - In-memory rate limit: 20 req / 10 min / IP
 *     ⚠️ NOTE: does NOT work on Vercel serverless — each invocation is a
 *     fresh instance. Replace with Vercel KV / Upstash for real rate limiting.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_INPUT_BYTES = 4_500_000; // 4.5 MB — Vercel's actual edge limit
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

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
    const retryAfterSec = Math.ceil(
      (rec.firstAt + RATE_LIMIT_WINDOW_MS - now) / 1000,
    );
    return { ok: false, retryAfterSec };
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

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

type InputFormat = "pdf" | "docx" | "md" | "txt" | "html";
type OutputFormat = "txt" | "html" | "markdown" | "pdf" | "docx";

const INPUT_EXT: Record<string, InputFormat> = {
  pdf: "pdf",
  docx: "docx",
  md: "md",
  markdown: "md",
  txt: "txt",
  text: "txt",
  html: "html",
  htm: "html",
};

const OUTPUT_EXT: Record<OutputFormat, string> = {
  txt: "txt",
  html: "html",
  markdown: "md",
  pdf: "pdf",
  docx: "docx",
};

const MIME: Record<OutputFormat, string> = {
  txt: "text/plain; charset=utf-8",
  html: "text/html; charset=utf-8",
  markdown: "text/markdown; charset=utf-8",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function detectInput(filename: string, fallback?: string): InputFormat {
  const ext = (filename.split(".").pop() || fallback || "").toLowerCase();
  const fmt = INPUT_EXT[ext];
  if (!fmt) throw new Error(`Unsupported input format: .${ext}`);
  return fmt;
}

// ---------------------------------------------------------------------------
// Markdown ↔ HTML
// ---------------------------------------------------------------------------

async function mdToHtml(md: string): Promise<string> {
  return await marked.parse(md);
}

function htmlToText(html: string): string {
  // Strip script/style blocks
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  // Convert common block elements to newlines
  s = s.replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  // Drop remaining tags
  s = s.replace(/<[^>]+>/g, "");
  // Decode common entities
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Collapse extra whitespace
  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

function htmlToMarkdown(html: string): string {
  let s = html;
  // Headings
  s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `# ${t}\n\n`);
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `## ${t}\n\n`);
  s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `### ${t}\n\n`);
  s = s.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, t) => `#### ${t}\n\n`);
  s = s.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_, t) => `##### ${t}\n\n`);
  s = s.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_, t) => `###### ${t}\n\n`);
  // Bold / italic
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, c) => `**${c}**`);
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, c) => `*${c}*`);
  // Links
  s = s.replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, c) => `[${c}](${href})`);
  // Lists
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `- ${c}\n`);
  // Paragraphs / line breaks
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/p>/gi, "\n\n");
  s = s.replace(/<\/div>/gi, "\n");
  // Strip remaining tags
  s = s.replace(/<[^>]+>/g, "");
  // Decode entities
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

// ---------------------------------------------------------------------------
// PDF text extraction (lightweight, no native deps)
//
// We use pdf-parse for text extraction. If it fails (encrypted / malformed),
// we fall back to a regex scan of plain-text operators in the PDF bytes.
// ---------------------------------------------------------------------------

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  // Use pdfjs-dist directly for text extraction. Same engine as pdf-to-jpg
  // and pdf-to-text, which are already proven to work server-side.
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

    const doc = await pdfjs.getDocument({
      data: bytes as unknown as ArrayBuffer,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    const out: string[] = [];
    const count = Math.min(doc.numPages, 200);
    for (let i = 1; i <= count; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
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
    await doc.destroy();
    const text = out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (text) return text;
  } catch (e) {
    console.error("[convert] pdfjs text extraction failed:", e instanceof Error ? e.message : e);
  }
  return scanPdfText(bytes);
}

function scanPdfText(bytes: Uint8Array): string {
  // Decode as latin1 to preserve byte-for-byte values, then scan for
  // text-showing operators: (...) Tj, [(...) ...] TJ.
  // Build the string with TextDecoder (latin1) in one shot — the previous
  // char-by-char concat was O(n²) on 15 MB PDFs.
  const s = new TextDecoder("latin1").decode(bytes);
  const out: string[] = [];
  const tjRe = /\(((?:[^()\\]|\\.)*)\)\s*Tj/g;
  const tjArrRe = /\[([^\]]*)\]\s*TJ/g;
  let m: RegExpExecArray | null;
  while ((m = tjRe.exec(s)) !== null) {
    out.push(decodePdfString(m[1]));
  }
  while ((m = tjArrRe.exec(s)) !== null) {
    const inner = m[1];
    const parts = inner.match(/\(((?:[^()\\]|\\.)*)\)/g) || [];
    for (const p of parts) out.push(decodePdfString(p.slice(1, -1)));
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function decodePdfString(raw: string): string {
  // Escape sequences per PDF spec
  const s = raw
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
  // UTF-16BE BOM detection
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

// ---------------------------------------------------------------------------
// HTML → simple PDF (text-only)
// ---------------------------------------------------------------------------

async function textToPdf(text: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setProducer("ToolVerse File Converter");
  doc.setCreator("ToolVerse File Converter");

  // Embed the font ON the same doc that we will save — previously the font
  // was embedded on an outer throwaway doc, producing an empty/corrupt PDF.
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const margin = 50;
  const pageWidth = 595.28; // A4 portrait in points
  const pageHeight = 841.89;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 14;
  const fontSize = 11;
  const linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

  // Split text into paragraphs, then wrap each paragraph at the available width.
  const paragraphs = text.split(/\n/);
  const wrappedLines: string[] = [];
  for (const para of paragraphs) {
    if (para.trim() === "") {
      wrappedLines.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let cur = "";
    for (const w of words) {
      const candidate = cur ? `${cur} ${w}` : w;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width > maxWidth && cur) {
        wrappedLines.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    if (cur) wrappedLines.push(cur);
  }

  let page: PDFPage = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  let lineIdx = 0;

  for (const line of wrappedLines) {
    if (lineIdx >= linesPerPage) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      lineIdx = 0;
    }
    page.drawText(line, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= lineHeight;
    lineIdx += 1;
  }

  return await doc.save();
}

// ---------------------------------------------------------------------------
// Text → DOCX
// ---------------------------------------------------------------------------

async function textToDocx(text: string, title?: string): Promise<Uint8Array> {
  const paragraphs: Paragraph[] = [];
  if (title) {
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
      }),
    );
  }
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
    creator: "ToolVerse File Converter",
    title: title || "Converted Document",
    sections: [{ children: paragraphs }],
  });
  const blob = await Packer.toBlob(doc);
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}

// ---------------------------------------------------------------------------
// Main conversion dispatcher
// ---------------------------------------------------------------------------

interface ConvertResult {
  bytes: Uint8Array;
  mime: string;
  ext: string;
}

async function convert(
  inputBytes: Uint8Array,
  inputFmt: InputFormat,
  outputFmt: OutputFormat,
  originalName: string,
): Promise<ConvertResult> {
  // Fast path: identical text-only transforms
  // First, normalize source to text + html where possible
  let text: string | null = null;
  let html: string | null = null;

  // Lazy loaders — only compute what we need for the requested output
  const getText = async () => {
    if (text !== null) return text;
    switch (inputFmt) {
      case "txt":
        text = new TextDecoder().decode(inputBytes);
        break;
      case "md":
        text = new TextDecoder().decode(inputBytes);
        break;
      case "html":
        html = new TextDecoder().decode(inputBytes);
        text = htmlToText(html);
        break;
      case "pdf":
        text = await extractPdfText(inputBytes);
        break;
      case "docx": {
        // mammoth v1 in Node expects { buffer: Buffer } — { arrayBuffer }
        // throws "Could not find file in options".
        const buffer = Buffer.from(inputBytes);
        const res = await mammoth.extractRawText({ buffer });
        text = res.value;
        break;
      }
    }
    return text;
  };

  const getHtml = async () => {
    if (html !== null) return html;
    switch (inputFmt) {
      case "html":
        html = new TextDecoder().decode(inputBytes);
        break;
      case "md": {
        const md = new TextDecoder().decode(inputBytes);
        html = await mdToHtml(md);
        break;
      }
      case "txt":
        html = `<pre>${escapeHtml(new TextDecoder().decode(inputBytes))}</pre>`;
        break;
      case "docx": {
        const res = await mammoth.convertToHtml({ arrayBuffer: inputBytes.slice().buffer });
        html = res.value;
        break;
      }
      case "pdf": {
        const t = await getText();
        html = `<pre>${escapeHtml(t)}</pre>`;
        break;
      }
    }
    return html;
  };

  switch (outputFmt) {
    case "txt": {
      const t = await getText();
      return {
        bytes: new TextEncoder().encode(t),
        mime: MIME.txt,
        ext: OUTPUT_EXT.txt,
      };
    }
    case "html": {
      const h = await getHtml();
      const wrapped = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(stripExt(originalName))}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 760px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
  pre { background: #f5f5f5; padding: 1rem; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #ddd; padding: 0.4rem 0.6rem; }
</style>
</head>
<body>
${h}
</body>
</html>`;
      return {
        bytes: new TextEncoder().encode(wrapped),
        mime: MIME.html,
        ext: OUTPUT_EXT.html,
      };
    }
    case "markdown": {
      let md: string;
      if (inputFmt === "md") {
        md = new TextDecoder().decode(inputBytes);
      } else if (inputFmt === "html") {
        md = htmlToMarkdown(new TextDecoder().decode(inputBytes));
      } else if (inputFmt === "txt") {
        md = new TextDecoder().decode(inputBytes);
      } else {
        const t = await getText();
        md = t;
      }
      return {
        bytes: new TextEncoder().encode(md),
        mime: MIME.markdown,
        ext: OUTPUT_EXT.markdown,
      };
    }
    case "pdf": {
      const t = await getText();
      if (!t.trim()) {
        // Can't build a PDF from empty text — throw so the POST handler
        // returns a 422 rather than emitting an empty/corrupt PDF.
        throw new Error("No text could be extracted from the input to build a PDF.");
      }
      const pdfBytes = await textToPdf(t);
      return {
        bytes: pdfBytes,
        mime: MIME.pdf,
        ext: OUTPUT_EXT.pdf,
      };
    }
    case "docx": {
      let t: string;
      if (inputFmt === "md") {
        // Strip MD syntax lightly for cleaner DOCX
        const raw = new TextDecoder().decode(inputBytes);
        const h = await mdToHtml(raw);
        t = htmlToText(h);
      } else {
        t = await getText();
      }
      const docxBytes = await textToDocx(t, stripExt(originalName));
      return {
        bytes: docxBytes,
        mime: MIME.docx,
        ext: OUTPUT_EXT.docx,
      };
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripExt(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i > 0 ? filename.slice(0, i) : filename;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

const SUPPORTED_OUTPUTS: OutputFormat[] = ["txt", "html", "markdown", "pdf", "docx"];

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many conversions. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } },
    );
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { ok: false, error: "Expected multipart/form-data request." },
      { status: 400 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid form data." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  const target = (form.get("target") as string | null)?.toLowerCase() as OutputFormat | null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "Missing 'file' field." },
      { status: 400 },
    );
  }
  if (!target || !SUPPORTED_OUTPUTS.includes(target)) {
    return NextResponse.json(
      { ok: false, error: `Missing or invalid 'target'. Must be one of: ${SUPPORTED_OUTPUTS.join(", ")}` },
      { status: 400 },
    );
  }
  if (file.size > MAX_INPUT_BYTES) {
    return NextResponse.json(
      { ok: false, error: `File too large. Max 4.5 MB on Vercel.` },
      { status: 413 },
    );
  }

  let inputFmt: InputFormat;
  try {
    inputFmt = detectInput(file.name, file.type.split("/").pop());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unsupported input." },
      { status: 400 },
    );
  }

  const arrayBuf = await file.arrayBuffer();
  const inputBytes = new Uint8Array(arrayBuf);

  try {
    const result = await convert(inputBytes, inputFmt, target, file.name);
    const baseName = stripExt(file.name);
    const downloadName = `${baseName}-converted.${result.ext}`;
    return new NextResponse(result.bytes as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "Content-Type": result.mime,
        "Content-Length": String(result.bytes.byteLength),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadName)}"`,
        "Cache-Control": "no-store",
        "X-Converted-From": inputFmt,
        "X-Converted-To": target,
      },
    });
  } catch (err) {
    console.error("[convert] failed", err);
    const msg = err instanceof Error ? err.message : "Conversion failed unexpectedly.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "file-converter",
    inputs: ["pdf", "docx", "md", "txt", "html"],
    outputs: SUPPORTED_OUTPUTS,
    maxBytes: MAX_INPUT_BYTES,
  });
}
