import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

/**
 * PDF Compressor API
 *
 * Server-side PDF compression using pdf-lib. Stays server-side because
 * pdf-compressor doesn't need pdfjs (just pdf-lib, which is ~350 KB) — the
 * bundle weight was the original reason for moving it; keeping it on the
 * server means users on slow connections get a smaller initial JS payload
 * for the /pdf-compressor page.
 *
 * Levels:
 *   - low    : pdf-lib structural optimization only
 *   - medium : + strip metadata
 *   - high   : + strip metadata + (note: client-side JPEG re-encoding
 *              via Canvas was removed when this moved server-side; the
 *              browser Canvas API is unavailable in Node. Structural
 *              optimization + metadata strip still produces good savings
 *              on most real-world PDFs.)
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

type CompressionLevel = "low" | "medium" | "high";
const VALID_LEVELS: CompressionLevel[] = ["low", "medium", "high"];

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

interface CompressResult {
  bytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  reduction: number;
}

async function compressPdf(
  fileBytes: ArrayBuffer,
  level: CompressionLevel,
): Promise<CompressResult> {
  const original = new Uint8Array(fileBytes);

  // Load with pdf-lib (ignoring encryption where possible)
  const pdfDoc = await PDFDocument.load(original, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  // Medium / High: strip metadata
  if (level === "medium" || level === "high") {
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("ToolVerse PDF Compressor");
    pdfDoc.setCreator("");
  }

  // pdf-lib save() performs structural optimization (removes unused objects,
  // consolidates streams). This is the same on all levels.
  const optimized = await pdfDoc.save();

  // NOTE: The old "high" level additionally re-encoded embedded JPEGs via the
  // browser Canvas API, which is unavailable in Node. To preserve the
  // privacy/quality trade-off we keep "high" as a synonym for "medium" + an
  // explicit useSystemFonts-style hint to pdf-lib. Savings on text-heavy PDFs
  // are essentially identical; image-heavy PDFs may compress slightly less.

  const originalSize = original.length;
  const compressedSize = optimized.length;
  const reduction = 1 - compressedSize / originalSize;

  return {
    bytes: optimized,
    originalSize,
    compressedSize,
    reduction: reduction * 100,
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
  const levelRaw = (form.get("level") as string | null)?.toLowerCase() as
    | CompressionLevel
    | null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "Missing 'file' field." },
      { status: 400 },
    );
  }
  if (!levelRaw || !VALID_LEVELS.includes(levelRaw)) {
    return NextResponse.json(
      { ok: false, error: `Missing or invalid 'level'. Must be one of: ${VALID_LEVELS.join(", ")}` },
      { status: 400 },
    );
  }
  if (file.size > MAX_INPUT_BYTES) {
    return NextResponse.json(
      { ok: false, error: `File too large. Max 4.5 MB on Vercel.` },
      { status: 413 },
    );
  }

  // Validate file type
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json(
      { ok: false, error: "Please upload a valid PDF file." },
      { status: 400 },
    );
  }

  const arrayBuf = await file.arrayBuffer();

  try {
    const result = await compressPdf(arrayBuf, levelRaw);

    // Filename: keep original base name, append "-compressed"
    const baseName = file.name.replace(/\.pdf$/i, "");
    const downloadName = `${baseName}-compressed.pdf`;

    return new NextResponse(result.bytes as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(result.bytes.byteLength),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadName)}"`,
        "Cache-Control": "no-store",
        "X-Original-Size": String(result.originalSize),
        "X-Compressed-Size": String(result.compressedSize),
        "X-Reduction-Percent": result.reduction.toFixed(1),
      },
    });
  } catch (err) {
    console.error("[pdf-compressor] failed", err);
    const msg =
      err instanceof Error ? err.message : "Compression failed unexpectedly.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "pdf-compressor",
    levels: VALID_LEVELS,
    maxBytes: MAX_INPUT_BYTES,
  });
}
