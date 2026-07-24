"use client";

/**
 * Browser-side pdfjs-dist setup.
 *
 * Used by pdf-to-text (text extraction) and pdf-to-jpg (page rendering).
 * All PDF processing happens in the browser — no upload, no Vercel 4.5 MB cap.
 *
 * Worker setup: pdfjs needs the worker source as a separate script. We copy
 * the prebuilt worker bundle from node_modules/pdfjs-dist/build/ into
 * /public/pdf.worker.min.mjs via the `prebuild` npm script, then point
 * pdfjs at it. The file is same-origin, so our CSP (`script-src 'self' ...`)
 * allows it without changes.
 *
 * Why not `?url` imports: Turbopack doesn't support `?url` for `.mjs` files
 * inside node_modules (it tries to parse them as modules and fails with
 * "export default doesn't exist"). Why not a CDN URL: would add an external
 * dependency and require a CSP change. Copying to /public is the most
 * portable approach across bundlers.
 *
 * The worker is initialized lazily on first use — if a user never opens
 * pdf-to-text, the ~1 MB worker is still downloaded (it's in /public so it
 * gets cached) but never executed.
 */

import * as pdfjs from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

const WORKER_PATH = "/pdf.worker.min.mjs";
let initialized = false;

function ensureWorker() {
  if (initialized) return;
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_PATH;
  initialized = true;
}

/**
 * Extract text from a PDF in the browser. Mirrors the layout heuristic used
 * by the old server-side route: group text runs by their Y coordinate, sort
 * top-to-bottom, join with spaces.
 *
 * Returns the plain text. Throws on parse failure. Returns an empty string
 * if no text was extracted (caller decides how to surface that — typically
 * as a "this PDF is probably scanned, OCR is needed" message).
 */
export async function extractPdfTextClient(
  bytes: Uint8Array,
  opts?: { maxPages?: number; onProgress?: (done: number, total: number) => void },
): Promise<string> {
  ensureWorker();

  const maxPages = opts?.maxPages ?? 200;
  const onProgress = opts?.onProgress;

  // pdfjs mutates the input buffer in some code paths; copy it so the caller's
  // Uint8Array (often backed by a File's ArrayBuffer) isn't corrupted. The
  // copy also detaches cleanly if pdfjs transfers it to the worker.
  const data = bytes.slice();

  const loadingTask = pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: false,
  });

  let doc: PDFDocumentProxy | null = null;
  try {
    doc = await loadingTask.promise;
    const total = Math.min(doc.numPages, maxPages);
    if (onProgress) onProgress(0, total);

    const out: string[] = [];
    for (let i = 1; i <= total; i++) {
      const page = await doc.getPage(i);
      try {
        const content = await page.getTextContent();
        // Group items by rounded Y so multi-column layouts don't interleave.
        const lines = new Map<number, string[]>();
        for (const item of content.items) {
          if (!("str" in item) || typeof item.str !== "string") continue;
          if (item.str === "") continue;
          const ty = item.transform[5];
          const key = Math.round(ty);
          if (!lines.has(key)) lines.set(key, []);
          lines.get(key)!.push(item.str);
        }
        const sortedKeys = Array.from(lines.keys()).sort((a, b) => b - a);
        for (const k of sortedKeys) {
          const parts = lines.get(k)!;
          const line = parts.join(" ").replace(/\s+/g, " ").trim();
          if (line) out.push(line);
        }
        out.push(""); // page break
      } finally {
        page.cleanup();
      }
      if (onProgress) onProgress(i, total);
    }

    return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  } finally {
    if (doc) {
      try {
        await doc.destroy();
      } catch {
        /* already tearing down */
      }
    }
  }
}

/**
 * Render each page of a PDF to a JPEG in the browser.
 *
 * Mirrors the old server-side /api/pdf-to-jpg route: pdfjs renders each page
 * onto a <canvas> at the requested scale, then `canvas.toBlob("image/jpeg")`
 * produces the JPEG bytes. Returns an array of {pageNumber, bytes} for the
 * caller to either bundle into a ZIP (multi-page) or return as a single JPG.
 *
 * Browser equivalent of the Node path that used `node-canvas`. Runs 100%
 * client-side, so file size is bounded only by the user's tab RAM (we cap at
 * MAX_CLIENT_BYTES = 50 MB in _pdf-client.ts).
 *
 * The canvas is filled with white before rendering so transparent PDF
 * backgrounds (rare but possible) don't end up black in the JPEG — JPEG has
 * no alpha channel.
 *
 * Memory: each rendered page allocates a canvas of (viewport.width *
 * viewport.height * 4) bytes. At scale=1.5 an A4 page is ~890×1260 = ~4.5 MB
 * of canvas memory per page. We free the canvas immediately after toBlob by
 * setting width=0 (Safari-friendly teardown).
 */
export async function renderPdfPagesToJpegs(
  bytes: Uint8Array,
  opts: {
    scale?: number;
    quality?: number;
    maxPages?: number;
    onProgress?: (done: number, total: number) => void;
  } = {},
): Promise<{ pageNumber: number; bytes: Uint8Array }[]> {
  ensureWorker();

  const scale = opts.scale ?? 1.5;
  const quality = opts.quality ?? 0.85;
  const maxPages = opts.maxPages ?? 200;
  const onProgress = opts.onProgress;

  // Copy the input buffer — pdfjs may transfer it to the worker (detaching it)
  // and we don't want to mutate the caller's Uint8Array.
  const data = bytes.slice();

  const loadingTask = pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true,
    disableFontFace: false,
  });

  let doc: PDFDocumentProxy | null = null;
  try {
    doc = await loadingTask.promise;
    const total = Math.min(doc.numPages, maxPages);
    if (onProgress) onProgress(0, total);

    const out: { pageNumber: number; bytes: Uint8Array }[] = [];

    for (let i = 1; i <= total; i++) {
      const page = await doc.getPage(i);
      try {
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get 2D canvas context for PDF rendering.");

        // Flatten transparency onto white (matches the old node-canvas path).
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: ctx,
          viewport,
          // `intent: "display"` is the default; explicit for clarity.
          intent: "display",
        } as Parameters<typeof page.render>[0]).promise;

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", quality),
        );
        if (!blob) throw new Error(`Failed to encode page ${i} as JPEG.`);

        const buf = await blob.arrayBuffer();
        out.push({ pageNumber: i, bytes: new Uint8Array(buf) });

        // Tear down the canvas — setting width=0 frees the backing store
        // immediately in all major browsers. Without this, a 50-page render
        // holds 50 canvases (~225 MB) in memory until GC sweeps them.
        canvas.width = 0;
        canvas.height = 0;
      } finally {
        page.cleanup();
      }
      if (onProgress) onProgress(i, total);
    }

    return out;
  } finally {
    if (doc) {
      try {
        await doc.destroy();
      } catch {
        /* already tearing down */
      }
    }
  }
}
