import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

/**
 * Watermark PDF API
 *
 * Adds a text watermark (diagonal, semi-transparent) across every page of the PDF.
 *
 * Limits:
 *   - Max input size: 25 MB
 *   - Max pages: 200
 *   - Watermark text length: 200 chars
 *   - In-memory rate limit: 20 requests / 10 min / IP
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_PAGES = 200;
const MAX_TEXT_LEN = 200;
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

// Parse "#RRGGBB" → [r, g, b] in 0..1
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 0.5, g: 0.5, b: 0.5 };
  const n = parseInt(m[1], 16);
  return {
    r: ((n >> 16) & 0xff) / 255,
    g: ((n >> 8) & 0xff) / 255,
    b: (n & 0xff) / 255,
  };
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
  const text = ((form.get("text") as string) || "WATERMARK").trim();
  const fontSize = parseFloat((form.get("fontSize") as string) || "60");
  const opacity = parseFloat((form.get("opacity") as string) || "0.2");
  const colorHex = ((form.get("color") as string) || "#888888").trim();
  const rotation = parseFloat((form.get("rotation") as string) || "45");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing 'file'." }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ ok: false, error: "Input must be a PDF." }, { status: 400 });
  }
  if (file.size > MAX_INPUT_BYTES) {
    return NextResponse.json(
      { ok: false, error: `File too large. Max ${MAX_INPUT_BYTES / (1024 * 1024)} MB.` },
      { status: 413 },
    );
  }
  if (!text) {
    return NextResponse.json({ ok: false, error: "Watermark text cannot be empty." }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LEN) {
    return NextResponse.json(
      { ok: false, error: `Watermark text too long. Max ${MAX_TEXT_LEN} chars.` },
      { status: 400 },
    );
  }
  if (!Number.isFinite(fontSize) || fontSize < 6 || fontSize > 400) {
    return NextResponse.json(
      { ok: false, error: "Font size must be between 6 and 400." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
    return NextResponse.json({ ok: false, error: "Opacity must be between 0 and 1." }, { status: 400 });
  }

  try {
    const buf = await file.arrayBuffer();
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    if (doc.getPageCount() > MAX_PAGES) {
      return NextResponse.json(
        { ok: false, error: `Too many pages. Max ${MAX_PAGES}.` },
        { status: 413 },
      );
    }

    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const color = hexToRgb(colorHex);
    const pages = doc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      // Center the text diagonally
      const x = (width - textWidth * Math.cos((rotation * Math.PI) / 180)) / 2;
      const y = (height - fontSize * Math.sin((rotation * Math.PI) / 180)) / 2;

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity,
        rotate: degrees(rotation),
      });
    }

    const pdfBytes = await doc.save();
    const baseName = file.name.replace(/\.pdf$/i, "");

    return new NextResponse(pdfBytes as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(baseName)}-watermarked.pdf"`,
        "Cache-Control": "no-store",
        "X-Page-Count": String(pages.length),
      },
    });
  } catch (err) {
    console.error("[watermark-pdf] failed", err);
    const msg = err instanceof Error ? err.message : "PDF watermark failed.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "watermark-pdf",
    maxBytes: MAX_INPUT_BYTES,
    maxPages: MAX_PAGES,
    params: {
      text: "string (default 'WATERMARK')",
      fontSize: "number 6..400 (default 60)",
      opacity: "number 0..1 (default 0.2)",
      color: "#RRGGBB (default #888888)",
      rotation: "number degrees (default 45)",
    },
  });
}
