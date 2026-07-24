import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * PDF Page Number API
 *
 * Adds page numbers to every page of the PDF.
 *
 * Limits:
 *   - Max input size: 50 MB
 *   - Max pages: 200
 *   - In-memory rate limit: 20 requests / 10 min / IP
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_INPUT_BYTES = 50 * 1024 * 1024;
const MAX_PAGES = 200;
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

type Position =
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "top-left"
  | "top-right";

const VALID_POSITIONS = new Set<Position>([
  "bottom-center",
  "bottom-left",
  "bottom-right",
  "top-center",
  "top-left",
  "top-right",
]);

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 0.2, g: 0.2, b: 0.2 };
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
  const position = ((form.get("position") as string) || "bottom-center") as Position;
  const fontSize = parseFloat((form.get("fontSize") as string) || "12");
  const colorHex = ((form.get("color") as string) || "#333333").trim();
  const format = (form.get("format") as string) || "{n}";
  const startAt = parseInt((form.get("startAt") as string) || "1", 10);
  const margin = parseFloat((form.get("margin") as string) || "30");

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
  if (!VALID_POSITIONS.has(position)) {
    return NextResponse.json(
      { ok: false, error: `Invalid position. Use one of: ${Array.from(VALID_POSITIONS).join(", ")}.` },
      { status: 400 },
    );
  }
  if (!Number.isFinite(fontSize) || fontSize < 6 || fontSize > 72) {
    return NextResponse.json({ ok: false, error: "Font size must be between 6 and 72." }, { status: 400 });
  }
  if (!Number.isFinite(startAt) || startAt < 0 || startAt > 9999) {
    return NextResponse.json({ ok: false, error: "Start page must be between 0 and 9999." }, { status: 400 });
  }
  // Validate margin — without this, NaN (e.g. from margin="abc") produces
  // NaN x/y coordinates in page.drawText, throwing or corrupting the PDF.
  if (!Number.isFinite(margin) || margin < 0 || margin > 200) {
    return NextResponse.json(
      { ok: false, error: "Margin must be a number between 0 and 200 (points)." },
      { status: 400 },
    );
  }
  if (!format.includes("{n")) {
    return NextResponse.json(
      { ok: false, error: "Format string must contain '{n}', '{n+total}', or similar." },
      { status: 400 },
    );
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

    const font = await doc.embedFont(StandardFonts.Helvetica);
    const color = hexToRgb(colorHex);
    const pages = doc.getPages();
    const total = pages.length;

    pages.forEach((page, idx) => {
      const { width, height } = page.getSize();
      const n = startAt + idx;
      const label = format
        .replace(/\{n\}/g, String(n))
        .replace(/\{total\}/g, String(total))
        .replace(/\{n\/total\}/g, `${n}/${total}`);

      const textWidth = font.widthOfTextAtSize(label, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      let x: number;
      let y: number;

      if (position.includes("left")) {
        x = margin;
      } else if (position.includes("right")) {
        x = width - textWidth - margin;
      } else {
        x = (width - textWidth) / 2;
      }

      if (position.startsWith("top")) {
        y = height - margin - textHeight;
      } else {
        y = margin;
      }

      page.drawText(label, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
      });
    });

    const pdfBytes = await doc.save();
    const baseName = file.name.replace(/\.pdf$/i, "");

    return new NextResponse(pdfBytes as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(baseName)}-numbered.pdf"`,
        "Cache-Control": "no-store",
        "X-Page-Count": String(total),
      },
    });
  } catch (err) {
    console.error("[pdf-number] failed", err);
    const msg = err instanceof Error ? err.message : "PDF numbering failed.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "pdf-number",
    maxBytes: MAX_INPUT_BYTES,
    maxPages: MAX_PAGES,
    positions: Array.from(VALID_POSITIONS),
    formatTokens: ["{n}", "{total}", "{n/total}"],
  });
}
