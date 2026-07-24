"use client";

/**
 * Shared client-side file-conversion logic for the File Converter tool.
 *
 * Mirrors the old /api/convert route's `convert()` dispatcher: same input
 * formats (pdf, docx, md, txt, html), same output formats (txt, html,
 * markdown, pdf, docx), same conversion matrix, same helpers (md→html via
 * marked, html→text, html→markdown, text→pdf via pdf-lib, text→docx via docx).
 *
 * Why client-side: Vercel's 4.5 MB request body cap made the server route
 * unusable for any real document. mammoth ships a browser bundle
 * (`mammoth/mammoth.browser.js`), pdf-lib is isomorphic, marked is
 * isomorphic, and `docx` is isomorphic — so the entire pipeline runs in the
 * browser with no upload and no size limit beyond tab RAM (we cap at 50 MB).
 *
 * Heavy deps (mammoth, docx, pdf-lib, marked) are dynamically imported inside
 * the functions that need them, so they only land in the browser when the
 * user actually picks a conversion that requires them.
 */

// ---------------------------------------------------------------------------
// Types — mirror the route's InputFormat / OutputFormat
// ---------------------------------------------------------------------------

export type InputFormat = "pdf" | "docx" | "md" | "txt" | "html";
export type OutputFormat = "txt" | "html" | "markdown" | "pdf" | "docx";

export const VALID_OUTPUTS: Record<InputFormat, OutputFormat[]> = {
  pdf: ["txt", "html", "markdown"],
  docx: ["txt", "html", "markdown", "pdf"],
  md: ["html", "pdf", "txt", "docx"],
  txt: ["html", "pdf", "markdown", "docx"],
  html: ["txt", "pdf", "markdown", "docx"],
};

const MIME: Record<OutputFormat, string> = {
  txt: "text/plain; charset=utf-8",
  html: "text/html; charset=utf-8",
  markdown: "text/markdown; charset=utf-8",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const OUTPUT_EXT: Record<OutputFormat, string> = {
  txt: "txt",
  html: "html",
  markdown: "md",
  pdf: "pdf",
  docx: "docx",
};

export interface ConvertClientResult {
  blob: Blob;
  mime: string;
  ext: string;
}

// ---------------------------------------------------------------------------
// Format-detection — same logic as the route
// ---------------------------------------------------------------------------

const INPUT_EXT_MAP: Record<string, InputFormat> = {
  pdf: "pdf",
  docx: "docx",
  md: "md",
  markdown: "md",
  txt: "txt",
  text: "txt",
  html: "html",
  htm: "html",
};

export function detectInputFormat(filename: string, fallbackMime?: string): InputFormat | null {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  if (INPUT_EXT_MAP[ext]) return INPUT_EXT_MAP[ext];
  if (fallbackMime) {
    const mt = fallbackMime.toLowerCase();
    if (mt === "application/pdf") return "pdf";
    if (mt.includes("wordprocessing")) return "docx";
    if (mt === "text/markdown") return "md";
    if (mt === "text/plain") return "txt";
    if (mt === "text/html") return "html";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Markdown / HTML / Text helpers — pure string ops, no deps
// ---------------------------------------------------------------------------

async function mdToHtml(md: string): Promise<string> {
  const { marked } = await import("marked");
  return await marked.parse(md);
}

function htmlToText(html: string): string {
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

function htmlToMarkdown(html: string): string {
  let s = html;
  s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `# ${t}\n\n`);
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `## ${t}\n\n`);
  s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `### ${t}\n\n`);
  s = s.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, t) => `#### ${t}\n\n`);
  s = s.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, (_, t) => `##### ${t}\n\n`);
  s = s.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, (_, t) => `###### ${t}\n\n`);
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, c) => `**${c}**`);
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, _t, c) => `*${c}*`);
  s = s.replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, c) => `[${c}](${href})`);
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => `- ${c}\n`);
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/p>/gi, "\n\n");
  s = s.replace(/<\/div>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return s;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripExt(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i > 0 ? filename.slice(0, i) : filename;
}

// ---------------------------------------------------------------------------
// PDF text extraction — reuses the shared _pdfjs-client module
// ---------------------------------------------------------------------------

async function extractPdfTextFromBytes(
  bytes: Uint8Array,
): Promise<{ text: string }> {
  // Dynamic import — keeps _pdfjs-client (~1 MB worker) out of the initial
  // chunk for users who never touch PDF→X conversions.
  const { extractPdfTextClient } = await import("./_pdfjs-client");
  const text = await extractPdfTextClient(bytes, { maxPages: 200 });
  return { text };
}

// ---------------------------------------------------------------------------
// Text → PDF (pdf-lib, A4, Helvetica)
// ---------------------------------------------------------------------------

async function textToPdfBlob(text: string): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const doc = await PDFDocument.create();
  doc.setProducer("ToolHub File Converter");
  doc.setCreator("ToolHub File Converter");
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const margin = 50;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 14;
  const fontSize = 11;
  const linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

  const paragraphs = text.split(/\n/);
  const wrappedLines: string[] = [];
  for (const para of paragraphs) {
    if (para.trim() === "") {
      wrappedLines.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let cur = "";
    for (const w of words) {
      const candidate = cur ? `${cur} ${w}` : w;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width > maxWidth && cur) {
        wrappedLines.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    if (cur) wrappedLines.push(cur);
  }

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  let lineIdx = 0;
  for (const line of wrappedLines) {
    if (lineIdx >= linesPerPage) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      lineIdx = 0;
    }
    page.drawText(line, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= lineHeight;
    lineIdx += 1;
  }

  const bytes = await doc.save();
  // Copy into a fresh ArrayBuffer-backed Uint8Array so the Blob constructor
  // accepts it across all browsers (pdf-lib sometimes returns a
  // shared-ArrayBuffer-backed view that Blob rejects on Safari).
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}

// ---------------------------------------------------------------------------
// Text → DOCX (docx package, browser-compatible)
// ---------------------------------------------------------------------------

async function textToDocxBlob(text: string, title?: string): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

  const paragraphs: InstanceType<typeof Paragraph>[] = [];
  if (title) {
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
      }),
    );
  }
  const blocks = text.split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split(/\n/);
    if (lines.length === 1) {
      paragraphs.push(new Paragraph({ children: [new TextRun(lines[0])] }));
    } else {
      paragraphs.push(
        new Paragraph({
          children: lines.flatMap((l, i) =>
            i === 0
              ? [new TextRun(l)]
              : [new TextRun({ text: "", break: 1 }), new TextRun(l)],
          ),
        }),
      );
    }
  }
  const doc = new Document({
    creator: "ToolHub File Converter",
    title: title || "Converted Document",
    sections: [{ children: paragraphs }],
  });
  return Packer.toBlob(doc);
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------

export async function convertClient(
  file: File,
  inputFmt: InputFormat,
  outputFmt: OutputFormat,
): Promise<ConvertClientResult> {
  const inputBytes = new Uint8Array(await file.arrayBuffer());

  // Lazy caches — only compute what the requested output needs
  let text: string | null = null;
  let html: string | null = null;

  const getText = async (): Promise<string> => {
    if (text !== null) return text;
    let result = "";
    switch (inputFmt) {
      case "txt":
        result = new TextDecoder().decode(inputBytes);
        break;
      case "md":
        result = new TextDecoder().decode(inputBytes);
        break;
      case "html":
        html = new TextDecoder().decode(inputBytes);
        result = htmlToText(html);
        break;
      case "pdf": {
        const extracted = await extractPdfTextFromBytes(inputBytes);
        result = extracted.text;
        break;
      }
      case "docx": {
        // mammoth.browser.js accepts { arrayBuffer } in the browser
        const mammoth = await import("mammoth/mammoth.browser.js");
        const res = await mammoth.extractRawText({
          arrayBuffer: inputBytes.slice().buffer,
        });
        result = res.value;
        break;
      }
    }
    text = result;
    return result;
  };

  const getHtml = async (): Promise<string> => {
    if (html !== null) return html;
    let result = "";
    switch (inputFmt) {
      case "html":
        result = new TextDecoder().decode(inputBytes);
        break;
      case "md": {
        const md = new TextDecoder().decode(inputBytes);
        result = await mdToHtml(md);
        break;
      }
      case "txt":
        result = `<pre>${escapeHtml(new TextDecoder().decode(inputBytes))}</pre>`;
        break;
      case "docx": {
        const mammoth = await import("mammoth/mammoth.browser.js");
        const res = await mammoth.convertToHtml({
          arrayBuffer: inputBytes.slice().buffer,
        });
        result = res.value;
        break;
      }
      case "pdf": {
        const t = await getText();
        result = `<pre>${escapeHtml(t)}</pre>`;
        break;
      }
    }
    html = result;
    return result;
  };

  switch (outputFmt) {
    case "txt": {
      const t = await getText();
      return {
        blob: new Blob([t], { type: MIME.txt }),
        mime: MIME.txt,
        ext: OUTPUT_EXT.txt,
      };
    }
    case "html": {
      const h = await getHtml();
      const wrapped = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(stripExt(file.name))}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 760px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
  pre { background: #f5f5f5; padding: 1rem; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid #ddd; padding: 0.4rem 0.6rem; }
</style>
</head>
<body>
${h}
</body>
</html>`;
      return {
        blob: new Blob([wrapped], { type: MIME.html }),
        mime: MIME.html,
        ext: OUTPUT_EXT.html,
      };
    }
    case "markdown": {
      let md: string;
      if (inputFmt === "md") {
        md = new TextDecoder().decode(inputBytes);
      } else if (inputFmt === "html") {
        md = htmlToMarkdown(new TextDecoder().decode(inputBytes));
      } else if (inputFmt === "txt") {
        md = new TextDecoder().decode(inputBytes);
      } else {
        const t = await getText();
        md = t;
      }
      return {
        blob: new Blob([md], { type: MIME.markdown }),
        mime: MIME.markdown,
        ext: OUTPUT_EXT.markdown,
      };
    }
    case "pdf": {
      const t = await getText();
      if (!t.trim()) {
        throw new Error("No text could be extracted from the input to build a PDF.");
      }
      const blob = await textToPdfBlob(t);
      return { blob, mime: MIME.pdf, ext: OUTPUT_EXT.pdf };
    }
    case "docx": {
      let t: string;
      if (inputFmt === "md") {
        const raw = new TextDecoder().decode(inputBytes);
        const h = await mdToHtml(raw);
        t = htmlToText(h);
      } else {
        t = await getText();
      }
      const blob = await textToDocxBlob(t, stripExt(file.name));
      return { blob, mime: MIME.docx, ext: OUTPUT_EXT.docx };
    }
  }
}
