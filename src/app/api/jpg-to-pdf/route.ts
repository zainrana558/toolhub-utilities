import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

/**
 * JPG / PNG → PDF API
 *
 * Accepts up to 30 image files (JPG/PNG/WEBP/GIF) and combines them into a
 * single PDF. Images are pre-processed with sharp (rotated per EXIF, decoded)
 * and embedded as JPG to keep file size reasonable.
 *
 * Limits:
 *   - Max files: 30
 *   - Max per-file size: 15 MB
 *   - Max total size: 100 MB
 *   - In-memory rate limit: 15 requests / 10 min / IP
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_FILES = 30;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
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

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function isImage(file: File): boolean {
  const mt = file.type.toLowerCase();
  if (ACCEPTED.includes(mt)) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
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

  // Collect image files (form can have multiple "files" or "file" entries)
  const allEntries = Array.from(form.entries());
  const files: File[] = [];
  for (const [key, value] of allEntries) {
    if (value instanceof File && (key === "file" || key === "files")) {
      if (isImage(value)) files.push(value);
    }
  }

  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: "No image files provided." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { ok: false, error: `Too many files. Max ${MAX_FILES} images per request.` },
      { status: 400 },
    );
  }

  let totalBytes = 0;
  for (const f of files) {
    if (f.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { ok: false, error: `File "${f.name}" is too large. Max ${MAX_FILE_BYTES / (1024 * 1024)} MB per image.` },
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

  const orientation =
    ((form.get("orientation") as string) || "auto").toLowerCase() as "auto" | "portrait" | "landscape";
  const pageSize = ((form.get("pageSize") as string) || "fit").toLowerCase(); // "fit" | "a4" | "letter"
  const margin = parseInt((form.get("margin") as string) || "0", 10);

  try {
    const doc = await PDFDocument.create();
    doc.setProducer("ToolHub JPG to PDF");
    doc.setCreator("ToolHub JPG to PDF");

    for (const file of files) {
      const buf = await file.arrayBuffer();
      // Pre-process with sharp: rotate per EXIF, convert to JPG, flatten onto white
      const jpgBuf = await sharp(Buffer.from(buf))
        .rotate() // EXIF
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();

      const img = await doc.embedJpg(jpgBuf);
      const imgW = img.width;
      const imgH = img.height;

      let pageW: number;
      let pageH: number;

      if (pageSize === "a4") {
        pageW = 595.28;
        pageH = 841.89;
      } else if (pageSize === "letter") {
        pageW = 612;
        pageH = 792;
      } else {
        // fit: page matches image dimensions
        pageW = imgW;
        pageH = imgH;
      }

      // Override orientation if specified explicitly
      if (orientation === "portrait" && pageW > pageH) {
        [pageW, pageH] = [pageH, pageW];
      } else if (orientation === "landscape" && pageH > pageW) {
        [pageW, pageH] = [pageH, pageW];
      }

      const page = doc.addPage([pageW, pageH]);

      // Compute image placement with optional margin and aspect-ratio preservation
      const availW = pageW - margin * 2;
      const availH = pageH - margin * 2;
      const scale = Math.min(availW / imgW, availH / imgH, 1);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const x = (pageW - drawW) / 2;
      const y = (pageH - drawH) / 2;

      page.drawImage(img, { x, y, width: drawW, height: drawH });
    }

    const pdfBytes = await doc.save();
    const downloadName =
      files.length === 1
        ? `${files[0].name.replace(/\.[^.]+$/, "")}.pdf`
        : "combined-images.pdf";

    return new NextResponse(pdfBytes as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadName)}"`,
        "Cache-Control": "no-store",
        "X-Page-Count": String(files.length),
      },
    });
  } catch (err) {
    console.error("[jpg-to-pdf] failed", err);
    const msg = err instanceof Error ? err.message : "JPG to PDF conversion failed.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "jpg-to-pdf",
    maxFiles: MAX_FILES,
    maxFileBytes: MAX_FILE_BYTES,
    maxTotalBytes: MAX_TOTAL_BYTES,
    accepted: ACCEPTED,
  });
}
