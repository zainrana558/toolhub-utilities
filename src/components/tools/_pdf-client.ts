/**
 * Shared client-side helpers for the 6 pdf-lib-based PDF tools.
 *
 * All 6 (rotate, watermark, merge, split, pdf-number, jpg-to-pdf) used to
 * POST to a server API route that ran pdf-lib in Node. On Vercel's free tier
 * the 4.5 MB request body cap made those routes unusable for any real PDF,
 * so we moved everything client-side. pdf-lib runs fine in the browser and
 * has no upload limit — the only constraint is the user's tab RAM, which we
 * cap at 50 MB per file below.
 *
 * This module bundles the helpers that more than one of those components
 * needs: color parsing, page-range parsing, an inline store-only ZIP writer
 * (for split-pdf's multi-file output), and a canvas-based image normalizer
 * (replaces sharp on the server side — handles EXIF rotation, flattens
 * transparent PNGs onto white, re-encodes as JPG).
 */

/** Hard ceiling for any single input file processed client-side. */
export const MAX_CLIENT_BYTES = 50 * 1024 * 1024;

/** Hard ceiling on PDF page count — keeps the UI responsive. */
export const MAX_PAGES = 200;

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

export function hexToRgb(hex: string, fallback = { r: 0.5, g: 0.5, b: 0.5 }) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return {
    r: ((n >> 16) & 0xff) / 255,
    g: ((n >> 8) & 0xff) / 255,
    b: (n & 0xff) / 255,
  };
}

// ---------------------------------------------------------------------------
// Page-range parsing — "1-3,5,7-9" → [1,2,3,5,7,8,9]
// ---------------------------------------------------------------------------

export function parseRanges(input: string, maxPage: number): number[] {
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

// ---------------------------------------------------------------------------
// Store-only ZIP writer (no compression — PDFs are already compressed)
// ---------------------------------------------------------------------------
// Used by split-pdf when mode=every or mode=range produces multiple files.
// Same implementation as the old server-side route; lifted here verbatim.

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

/** Strip path separators, drive letters, `..` segments, control chars. */
export function sanitizeFileName(name: string): string {
  const leaf = name.split(/[/\\]/).pop() || "";
  const cleaned = leaf
    .replace(/^\.+/, "")
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .trim();
  if (!cleaned || /^\.+$/.test(cleaned)) return "";
  return cleaned;
}

export function buildZip(entries: { name: string; data: Uint8Array }[]): Uint8Array {
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

// ---------------------------------------------------------------------------
// Image normalization — replaces sharp on the client.
// ---------------------------------------------------------------------------
// Browser equivalent of:
//   sharp(buf).rotate().flatten({ background: "#ffffff" }).jpeg({ quality: 85 }).toBuffer()
//
// We use createImageBitmap (handles EXIF orientation natively when given
// `{ imageOrientation: "from-image" }`) → draw onto a canvas with a white
// background → canvas.toBlob("image/jpeg", 0.85).
//
// Returns a Uint8Array suitable for PDFDocument.embedJpg().

export async function normalizeImageToJpegBytes(
  file: File,
  quality = 0.85,
): Promise<Uint8Array> {
  // createImageBitmap with from-image orientation reads EXIF and pre-rotates
  // the bitmap so we don't have to. Supported in all modern browsers since
  // ~2020. Safari got it in 14.5.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  // Some browsers (older Safari) don't support the option and silently ignore
  // it. The bitmap will be in its encoded orientation in that case — we
  // accept the minor UX regression rather than pulling in a full EXIF parser.

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context for image normalization.");

  // Flatten transparency onto white (matches sharp's .flatten({ background }))
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);

  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("Failed to encode image as JPEG.");

  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/** Read a File into a Uint8Array. */
export async function fileToBytes(file: File): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

/** Wrap a long-running client-side task in a setTimeout(0) so the UI thread
 *  gets a chance to paint a "processing…" spinner before we start crunching.
 *  Without this, React state updates for status="processing" batch with the
 *  sync work that follows and the spinner never appears. */
export function yieldToMain<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => fn().then(resolve, reject), 0);
  });
}
