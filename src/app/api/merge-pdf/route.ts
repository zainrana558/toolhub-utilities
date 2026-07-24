import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

/**
 * Merge PDF API
 *
 * Accepts multiple PDF files and merges them into a single PDF in the order
 * received.
 *
 * Limits:
 *   - Max files: 20
 *   - Max per-file size: 50 MB
 *   - Max total size: 250 MB
 *   - In-memory rate limit: 20 requests / 10 min / IP
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_FILES = 20;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_BYTES = 250 * 1024 * 1024;
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
    return NextResponse.json({ ok: false, error: "Invalid form data." }, { status: 400 });
  }

  const allEntries = Array.from(form.entries());
  const files: File[] = [];
  for (const [key, value] of allEntries) {
    if (value instanceof File && (key === "file" || key === "files")) {
      const isPdf =
        value.type === "application/pdf" || value.name.toLowerCase().endsWith(".pdf");
      if (isPdf) files.push(value);
    }
  }

  if (files.length < 2) {
    return NextResponse.json(
      { ok: false, error: "Select at least 2 PDF files to merge." },
      { status: 400 },
    );
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { ok: false, error: `Too many files. Max ${MAX_FILES} PDFs per request.` },
      { status: 400 },
    );
  }

  let totalBytes = 0;
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { ok: false, error: `File "${f.name}" is too large. Max ${MAX_FILE_BYTES / (1024 * 1024)} MB per PDF.` },
        { status: 413 },
      );
    }
    totalBytes += f.size;
  }
  if (totalBytes > MAX_TOTAL_BYTES) {
    return NextResponse.json(
      { ok: false, error: `Total size too large. Max ${MAX_TOTAL_BYTES / (1024 * 1024)} MB.` },
      { status: 413 },
    );
  }

  try {
    const out = await PDFDocument.create();
    out.setProducer("ToolHub Merge PDF");
    out.setCreator("ToolHub Merge PDF");

    for (const file of files) {
      const buf = await file.arrayBuffer();
      const src = await PDFDocument.load(buf, { ignoreEncryption: true });
      const pages = await out.copyPages(src, src.getPageIndices());
      for (const p of pages) out.addPage(p);
    }

    const pdfBytes = await out.save();

    return new NextResponse(pdfBytes as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="merged.pdf"`,
        "Cache-Control": "no-store",
        "X-Source-Count": String(files.length),
        "X-Page-Count": String(out.getPageCount()),
      },
    });
  } catch (err) {
    console.error("[merge-pdf] failed", err);
    const msg = err instanceof Error ? err.message : "PDF merge failed.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "merge-pdf",
    maxFiles: MAX_FILES,
    maxFileBytes: MAX_FILE_BYTES,
    maxTotalBytes: MAX_TOTAL_BYTES,
  });
}
