import { NextResponse } from "next/server";
import { PDFDocument, degrees } from "pdf-lib";

/**
 * Rotate PDF API
 *
 * Accepts a PDF and rotates every page by the specified angle (90, 180, 270).
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

const VALID_ANGLES = new Set([90, 180, 270]);

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
  const angle = parseInt((form.get("angle") as string) || "90", 10);

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
  if (!VALID_ANGLES.has(angle)) {
    return NextResponse.json(
      { ok: false, error: "Angle must be one of 90, 180, or 270." },
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

    const pages = doc.getPages();
    for (const page of pages) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + angle) % 360));
    }

    const pdfBytes = await doc.save();
    const baseName = file.name.replace(/\.pdf$/i, "");

    return new NextResponse(pdfBytes as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(baseName)}-rotated-${angle}.pdf"`,
        "Cache-Control": "no-store",
        "X-Page-Count": String(pages.length),
      },
    });
  } catch (err) {
    console.error("[rotate-pdf] failed", err);
    const msg = err instanceof Error ? err.message : "PDF rotate failed.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "rotate-pdf",
    maxBytes: MAX_INPUT_BYTES,
    maxPages: MAX_PAGES,
    angles: [90, 180, 270],
  });
}
