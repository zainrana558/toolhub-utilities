import { NextResponse } from "next/server";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFFont,
  PDFPage,
} from "pdf-lib";
import mammoth from "mammoth";

/**
 * Word (DOCX) → PDF API
 *
 * Extracts text + structure from a DOCX using mammoth (which produces HTML
 * preserving headings, paragraphs, lists) then renders that text into a PDF
 * using pdf-lib. Headings get larger fonts; lists get bullet prefixes.
 *
 * Limits:
 *   - Max input size: 15 MB
 *   - In-memory rate limit: 15 requests / 10 min / IP
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
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

// ---------------------------------------------------------------------------
// HTML → structured lines (with heading levels + list markers)
// ---------------------------------------------------------------------------

interface Line {
  text: string;
  level: 0 | 1 | 2 | 3; // 0 = body, 1 = h1, 2 = h2, 3 = h3
}

function htmlToLines(html: string): Line[] {
  // Drop script/style
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");

  const lines: Line[] = [];

  // Headings
  s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => push(lines, strip(t), 1) + "");
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => push(lines, strip(t), 2) + "");
  s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => push(lines, strip(t), 3) + "");
  s = s.replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, (_, t) => push(lines, strip(t), 3) + "");

  // Lists
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => push(lines, `• ${strip(c)}`, 0) + "");

  // Paragraphs / line breaks
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/p>/gi, "\n\n");
  s = s.replace(/<\/div>/gi, "\n");

  // Strip remaining tags
  s = strip(s);
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Split into paragraphs and lines
  const paras = s.split(/\n{2,}/);
  for (const p of paras) {
    const sublines = p.split(/\n/).map((l) => l.trim()).filter(Boolean);
    for (const sl of sublines) {
      lines.push({ text: sl, level: 0 });
    }
  }

  return lines;
}

function push(arr: Line[], text: string, level: Line["level"]): string {
  arr.push({ text: text.trim(), level });
  return "";
}

function strip(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

// ---------------------------------------------------------------------------
// Lines → PDF
// ---------------------------------------------------------------------------

async function linesToPdf(lines: Line[], font: PDFFont): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setProducer("ToolHub Word to PDF");
  doc.setCreator("ToolHub Word to PDF");

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 56; // ~0.78 inch
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 16;

  let page: PDFPage = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  for (const line of lines) {
    if (line.text === "") {
      y -= lineHeight / 2;
      if (y < margin) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      continue;
    }

    let fontSize: number;
    let colorRgb: { r: number; g: number; b: number };
    let bold = false;
    switch (line.level) {
      case 1:
        fontSize = 20;
        colorRgb = { r: 0.1, g: 0.1, b: 0.15 };
        bold = true;
        break;
      case 2:
        fontSize = 16;
        colorRgb = { r: 0.15, g: 0.15, b: 0.2 };
        bold = true;
        break;
      case 3:
        fontSize = 13;
        colorRgb = { r: 0.2, g: 0.2, b: 0.25 };
        bold = true;
        break;
      default:
        fontSize = 11;
        colorRgb = { r: 0.1, g: 0.1, b: 0.1 };
    }

    const wrapped = wrapText(line.text, font, fontSize, maxWidth);
    const lineH = line.level === 0 ? lineHeight : fontSize * 1.4;

    for (const wl of wrapped) {
      if (y < margin) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(wl, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
      });
      y -= lineH;
    }

    // Spacing after heading
    if (line.level > 0) y -= 4;
  }

  return await doc.save();
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const candidate = cur ? `${cur} ${w}` : w;
    const width = font.widthOfTextAtSize(candidate, fontSize);
    if (width > maxWidth && cur) {
      out.push(cur);
      cur = w;
    } else {
      cur = candidate;
    }
  }
  if (cur) out.push(cur);
  return out;
}

// ---------------------------------------------------------------------------

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
  const isDocx =
    file.type.includes("wordprocessing") ||
    file.name.toLowerCase().endsWith(".docx");
  if (!isDocx) {
    return NextResponse.json(
      { ok: false, error: "Input must be a .docx file (legacy .doc is not supported)." },
      { status: 400 },
    );
  }
  if (file.size > MAX_INPUT_BYTES) {
    return NextResponse.json(
      { ok: false, error: `File too large. Max ${MAX_INPUT_BYTES / (1024 * 1024)} MB.` },
      { status: 413 },
    );
  }

  try {
    const arrayBuf = await file.arrayBuffer();
    // mammoth v1 expects { buffer: Buffer } — passing arrayBuffer throws
    // "Could not find file in options". Wrap the bytes in a Node Buffer.
    const buffer = Buffer.from(arrayBuf);

    // Use mammoth to get HTML (preserves headings, lists, bold/italic structure)
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;

    const lines = htmlToLines(html);
    if (lines.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Could not extract any text from this Word document." },
        { status: 422 },
      );
    }

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pdfBytes = await linesToPdf(lines, font);

    const baseName = file.name.replace(/\.docx$/i, "");

    return new NextResponse(pdfBytes as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(baseName)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[word-to-pdf] failed", err);
    const msg = err instanceof Error ? err.message : "Word to PDF conversion failed.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "word-to-pdf",
    maxBytes: MAX_INPUT_BYTES,
    accepted: [".docx"],
    note: "Legacy .doc format is not supported. Convert to .docx first.",
  });
}
