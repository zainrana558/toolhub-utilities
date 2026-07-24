import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

/**
 * Split PDF API
 *
 * Accepts a single PDF and a "mode" parameter:
 *   - mode=every:       returns ZIP with one PDF per page
 *   - mode=range:       returns ZIP with PDFs split by ranges (e.g. "1-3,5,7-9")
 *   - mode=extract:     returns a single PDF containing only the requested pages
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

// --- ZIP store-only writer (same as pdf-to-jpg, kept here for self-containedness) ---

const crcTable: number[] = (() => {
  const t: number[] = new Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
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

/** Strip path separators, drive letters, `..` segments, and control chars. */
function sanitizeFileName(name: string): string {
  const leaf = name.split(/[/\\]/).pop() || "";
  const cleaned = leaf
    .replace(/^\.+/, "")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .trim();
  if (!cleaned || /^\.+$/.test(cleaned)) return "";
  return cleaned;
}

function buildZip(entries: { name: string; data: Uint8Array }[]): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const e of entries) {
    const nameBytes = new TextEncoder().encode(e.name);
    const crc = crc32(e.data);
    const local: number[] = [
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(crc), ...u32(e.data.length),
      ...u32(e.data.length), ...u16(nameBytes.length), ...u16(0),
      ...Array.from(nameBytes), ...Array.from(e.data),
    ];
    const localBytes = new Uint8Array(local);
    localParts.push(localBytes);

    const central: number[] = [
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(crc), ...u32(e.data.length),
      ...u32(e.data.length), ...u16(nameBytes.length), ...u16(0),
      ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset),
      ...Array.from(nameBytes),
    ];
    centralParts.push(new Uint8Array(central));
    offset += localBytes.length;
  }

  const centralBytes = centralParts.reduce(mergeUint8, new Uint8Array(0));
  const end: number[] = [
    ...u32(0x06054b50), ...u16(0), ...u16(0),
    ...u16(entries.length), ...u16(entries.length),
    ...u32(centralBytes.length), ...u32(offset), ...u16(0),
  ];

  return [localParts.reduce(mergeUint8, new Uint8Array(0)), centralBytes, new Uint8Array(end)].reduce(
    mergeUint8,
    new Uint8Array(0),
  );
}

// Parse ranges like "1-3,5,7-9" → list of 1-based page numbers
function parseRanges(input: string, maxPage: number): number[] {
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
  const out: number[] = [];
  for (const part of parts) {
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      if (a < 1 || b > maxPage || a > b) throw new Error(`Invalid range: ${part}`);
      for (let i = a; i <= b; i++) out.push(i);
    } else if (/^\d+$/.test(part)) {
      const n = parseInt(part, 10);
      if (n < 1 || n > maxPage) throw new Error(`Page out of range: ${n}`);
      out.push(n);
    } else {
      throw new Error(`Could not parse range token: "${part}"`);
    }
  }
  return out;
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
  const mode = ((form.get("mode") as string) || "every").toLowerCase();
  const ranges = (form.get("ranges") as string) || "";

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
  if (mode !== "every" && mode !== "range" && mode !== "extract") {
    return NextResponse.json(
      { ok: false, error: "Mode must be 'every', 'range', or 'extract'." },
      { status: 400 },
    );
  }

  try {
    const buf = await file.arrayBuffer();
    const src = await PDFDocument.load(buf, { ignoreEncryption: true });
    const totalPages = src.getPageCount();
    if (totalPages > MAX_PAGES) {
      return NextResponse.json(
        { ok: false, error: `Too many pages. Max ${MAX_PAGES}.` },
        { status: 413 },
      );
    }

    // Sanitize the base name — strip path separators and `..` so a
    // maliciously-named upload cannot produce ZIP entries that escape the
    // destination directory on extraction (ZIP path traversal).
    const rawBase = file.name.replace(/\.pdf$/i, "");
    const baseName = sanitizeFileName(rawBase) || "pdf";

    if (mode === "every") {
      // One PDF per page → ZIP
      const entries: { name: string; data: Uint8Array }[] = [];
      for (let i = 0; i < totalPages; i++) {
        const out = await PDFDocument.create();
        const [p] = await out.copyPages(src, [i]);
        out.addPage(p);
        const bytes = await out.save();
        entries.push({
          name: `${baseName}-page-${String(i + 1).padStart(3, "0")}.pdf`,
          data: bytes,
        });
      }
      const zip = buildZip(entries);
      return new NextResponse(zip as Uint8Array<ArrayBuffer>, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(baseName)}-split.zip"`,
          "Cache-Control": "no-store",
          "X-Output-Count": String(entries.length),
        },
      });
    }

    if (mode === "range") {
      if (!ranges.trim()) {
        return NextResponse.json({ ok: false, error: "Missing 'ranges' parameter." }, { status: 400 });
      }
      const tokens = ranges.split(";").map((s) => s.trim()).filter(Boolean);
      const entries: { name: string; data: Uint8Array }[] = [];

      for (let ti = 0; ti < tokens.length; ti++) {
        const token = tokens[ti];
        const pageNumbers = parseRanges(token, totalPages);
        const indices = pageNumbers.map((n) => n - 1);
        const out = await PDFDocument.create();
        const pages = await out.copyPages(src, indices);
        for (const p of pages) out.addPage(p);
        const bytes = await out.save();
        entries.push({
          name: `${baseName}-part-${ti + 1}.pdf`,
          data: bytes,
        });
      }

      if (entries.length === 1) {
        return new NextResponse(entries[0].data as Uint8Array<ArrayBuffer>, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(entries[0].name)}"`,
            "Cache-Control": "no-store",
            "X-Output-Count": "1",
          },
        });
      }

      const zip = buildZip(entries);
      return new NextResponse(zip as Uint8Array<ArrayBuffer>, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(baseName)}-split.zip"`,
          "Cache-Control": "no-store",
          "X-Output-Count": String(entries.length),
        },
      });
    }

    if (mode === "extract") {
      if (!ranges.trim()) {
        return NextResponse.json({ ok: false, error: "Missing 'ranges' parameter." }, { status: 400 });
      }
      const pageNumbers = parseRanges(ranges, totalPages);
      const indices = pageNumbers.map((n) => n - 1);
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, indices);
      for (const p of pages) out.addPage(p);
      const bytes = await out.save();
      return new NextResponse(bytes as Uint8Array<ArrayBuffer>, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(baseName)}-extracted.pdf"`,
          "Cache-Control": "no-store",
          "X-Output-Count": "1",
        },
      });
    }

    return NextResponse.json(
      { ok: false, error: `Unknown mode: ${mode}. Use 'every', 'range', or 'extract'.` },
      { status: 400 },
    );
  } catch (err) {
    console.error("[split-pdf] failed", err);
    const msg = err instanceof Error ? err.message : "PDF split failed.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "split-pdf",
    maxBytes: MAX_INPUT_BYTES,
    maxPages: MAX_PAGES,
    modes: ["every", "range", "extract"],
  });
}
