import { NextResponse } from "next/server";

/**
 * PDF → JPG API
 *
 * Renders each page of a PDF as a JPG image using pdfjs-dist + node-canvas.
 * Returns a ZIP archive when multiple pages, or a single JPG when one page.
 *
 * Limits:
 *   - Max input size: 25 MB
 *   - Max pages: 50 (to bound render time)
 *   - In-memory rate limit: 15 requests / 10 min / IP
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_INPUT_BYTES = 25 * 1024 * 1024;
const MAX_PAGES = 50;
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

// Minimal ZIP writer (store-only, no compression — JPGs are already compressed)
const crcTable: number[] = (() => {
  const t: number[] = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function u16(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff];
}
function u32(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
}

function mergeUint8(a: Uint8Array, b: Uint8Array): Uint8Array {
  const m = new Uint8Array(a.length + b.length);
  m.set(a);
  m.set(b, a.length);
  return m;
}

function buildZip(entries: { name: string; data: Uint8Array }[]): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const e of entries) {
    const nameBytes = new TextEncoder().encode(e.name);
    const crc = crc32(e.data);
    const local: number[] = [
      ...u32(0x04034b50),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(crc),
      ...u32(e.data.length),
      ...u32(e.data.length),
      ...u16(nameBytes.length),
      ...u16(0),
      ...Array.from(nameBytes),
      ...Array.from(e.data),
    ];
    const localBytes = new Uint8Array(local);
    localParts.push(localBytes);

    const central: number[] = [
      ...u32(0x02014b50),
      ...u16(20),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(crc),
      ...u32(e.data.length),
      ...u32(e.data.length),
      ...u16(nameBytes.length),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(offset),
      ...Array.from(nameBytes),
    ];
    centralParts.push(new Uint8Array(central));
    offset += localBytes.length;
  }

  const centralBytes = centralParts.reduce(mergeUint8, new Uint8Array(0));

  const end: number[] = [
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(entries.length),
    ...u16(entries.length),
    ...u32(centralBytes.length),
    ...u32(offset),
    ...u16(0),
  ];

  const all = [
    localParts.reduce(mergeUint8, new Uint8Array(0)),
    centralBytes,
    new Uint8Array(end),
  ];
  return all.reduce(mergeUint8, new Uint8Array(0));
}

// ---------------------------------------------------------------------------

async function renderPdfToJpegs(
  pdfBytes: Uint8Array,
  scale: number,
  quality: number,
): Promise<Uint8Array[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const data = pdfBytes as unknown as ArrayBuffer;
  const doc = await pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const pages: Uint8Array[] = [];
  const count = Math.min(doc.numPages, MAX_PAGES);

  const { createCanvas } = await import("canvas");

  for (let i = 1; i <= count; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
    } as Parameters<typeof page.render>[0]).promise;

    const jpegBuf = canvas.toBuffer("image/jpeg", { quality });
    pages.push(new Uint8Array(jpegBuf));

    page.cleanup();
  }

  await doc.destroy();
  return pages;
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

  const file = form.get("file");
  const scale = parseFloat((form.get("scale") as string) || "1.5");
  const quality = parseFloat((form.get("quality") as string) || "0.85");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing 'file' field." }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ ok: false, error: "Input must be a PDF file." }, { status: 400 });
  }
  if (file.size > MAX_INPUT_BYTES) {
    return NextResponse.json(
      { ok: false, error: `File too large. Max ${MAX_INPUT_BYTES / (1024 * 1024)} MB.` },
      { status: 413 },
    );
  }

  try {
    const arrayBuf = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuf);

    const jpegs = await renderPdfToJpegs(pdfBytes, scale, quality);

    if (jpegs.length === 0) {
      return NextResponse.json({ ok: false, error: "No pages rendered." }, { status: 500 });
    }

    const baseName = file.name.replace(/\.pdf$/i, "");

    if (jpegs.length === 1) {
      return new NextResponse(jpegs[0] as Uint8Array<ArrayBuffer>, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(baseName)}.jpg"`,
          "Cache-Control": "no-store",
          "X-Page-Count": "1",
        },
      });
    }

    const entries = jpegs.map((jpg, i) => ({
      name: `${baseName}-page-${String(i + 1).padStart(3, "0")}.jpg`,
      data: jpg,
    }));
    const zip = buildZip(entries);

    return new NextResponse(zip as Uint8Array<ArrayBuffer>, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(baseName)}-images.zip"`,
        "Cache-Control": "no-store",
        "X-Page-Count": String(jpegs.length),
      },
    });
  } catch (err) {
    console.error("[pdf-to-jpg] failed", err);
    const msg = err instanceof Error ? err.message : "PDF to JPG conversion failed.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "pdf-to-jpg",
    maxBytes: MAX_INPUT_BYTES,
    maxPages: MAX_PAGES,
    params: { scale: "number (default 1.5)", quality: "number 0..1 (default 0.85)" },
  });
}
