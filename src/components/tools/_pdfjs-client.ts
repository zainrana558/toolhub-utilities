"use client";

/**
 * Browser-side pdfjs-dist setup.
 *
 * Used by pdf-to-text (and could be used by future client-side pdfjs tools).
 * The matching server-side route lives at /api/pdf-to-text but only as a
 * fallback — normal operation is 100% in the browser.
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
