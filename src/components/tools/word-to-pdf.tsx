"use client";

import { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileOutput,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  useFileUpload,
  DropZone,
  FileChip,
  triggerDownload,
  formatBytes,
  type ConvertResult,
} from "./_pdf-helpers";
import {
  MAX_CLIENT_BYTES,
  fileToBytes,
  yieldToMain,
} from "./_pdf-client";

// Client-side DOCX → PDF. mammoth's browser build (`mammoth/mammoth.browser.js`)
// extracts HTML from the .docx — the package's `browser` field in package.json
// re-maps the Node-only unzip module to a browser-compatible one, so a normal
// `import mammoth from "mammoth"` would also work, but pointing at the
// prebuilt bundle avoids Turbopack having to walk mammoth's CJS graph.
//
// The HTML is then parsed into structured lines (headings / lists / paragraphs)
// and rendered into a PDF with pdf-lib — same logic as the old server route,
// lifted verbatim. Runs 100% in the browser, no upload limit.
const MAX_BYTES = MAX_CLIENT_BYTES;

function validateDocx(file: File): string | null {
  const isDocx =
    file.type.includes("wordprocessing") ||
    file.name.toLowerCase().endsWith(".docx");
  if (!isDocx)
    return "Please upload a .docx file. Legacy .doc format is not supported.";
  if (file.size > MAX_BYTES)
    return `File is too large. Max ${formatBytes(MAX_BYTES)}.`;
  return null;
}

// ---------------------------------------------------------------------------
// HTML → structured lines (heading levels + list markers preserved)
// ---------------------------------------------------------------------------
// Lifted unchanged from the old /api/word-to-pdf route. Pure string ops, runs
// identically in Node and the browser.

interface Line {
  text: string;
  level: 0 | 1 | 2 | 3; // 0 = body, 1 = h1, 2 = h2, 3 = h3
}

function strip(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

function pushLine(arr: Line[], text: string, level: Line["level"]): string {
  arr.push({ text: text.trim(), level });
  return "";
}

function htmlToLines(html: string): Line[] {
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");

  const lines: Line[] = [];

  s = s.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => pushLine(lines, strip(t), 1) + "");
  s = s.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => pushLine(lines, strip(t), 2) + "");
  s = s.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => pushLine(lines, strip(t), 3) + "");
  s = s.replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, (_, t) => pushLine(lines, strip(t), 3) + "");
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => pushLine(lines, `• ${strip(c)}`, 0) + "");

  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/p>/gi, "\n\n");
  s = s.replace(/<\/div>/gi, "\n");

  s = strip(s);
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  const paras = s.split(/\n{2,}/);
  for (const p of paras) {
    const sublines = p.split(/\n/).map((l) => l.trim()).filter(Boolean);
    for (const sl of sublines) {
      lines.push({ text: sl, level: 0 });
    }
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Lines → PDF (pdf-lib, A4, Helvetica + Helvetica-Bold)
// ---------------------------------------------------------------------------

async function linesToPdfBlob(lines: Line[]): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const doc = await PDFDocument.create();
  doc.setProducer("ToolHub Word to PDF");
  doc.setCreator("ToolHub Word to PDF");

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 56; // ~0.78 inch
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 16;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const wrapText = (text: string, font: typeof fontRegular, fontSize: number): string[] => {
    const words = text.split(/\s+/);
    const out: string[] = [];
    let cur = "";
    for (const w of words) {
      const candidate = cur ? `${cur} ${w}` : w;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width > maxWidth && cur) {
        out.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    if (cur) out.push(cur);
    return out;
  };

  for (const line of lines) {
    if (line.text === "") {
      y -= lineHeight / 2;
      if (y < margin) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      continue;
    }

    let fontSize: number;
    let colorRgb: { r: number; g: number; b: number };
    let bold = false;
    switch (line.level) {
      case 1:
        fontSize = 20;
        colorRgb = { r: 0.1, g: 0.1, b: 0.15 };
        bold = true;
        break;
      case 2:
        fontSize = 16;
        colorRgb = { r: 0.15, g: 0.15, b: 0.2 };
        bold = true;
        break;
      case 3:
        fontSize = 13;
        colorRgb = { r: 0.2, g: 0.2, b: 0.25 };
        bold = true;
        break;
      default:
        fontSize = 11;
        colorRgb = { r: 0.1, g: 0.1, b: 0.1 };
    }
    const font = bold ? fontBold : fontRegular;

    const wrapped = wrapText(line.text, font, fontSize);
    const lineH = line.level === 0 ? lineHeight : fontSize * 1.4;

    for (const wl of wrapped) {
      if (y < margin) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(wl, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
      });
      y -= lineH;
    }

    if (line.level > 0) y -= 4;
  }

  const bytes = await doc.save();
  // Copy into a fresh ArrayBuffer-backed Uint8Array so the Blob constructor
  // accepts it across all browsers (pdf-lib returns a shared-ArrayBuffer-backed
  // view in some configurations which Blob rejects on Safari).
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}

export function WordToPdf() {
  const [status, setStatus] = useState<
    "idle" | "loaded" | "processing" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useFileUpload({
    accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    maxSizeBytes: MAX_BYTES,
    validate: validateDocx,
    onError: (msg) => {
      setError(msg);
      setStatus("error");
    },
    onFiles: () => {
      setStatus("loaded");
      setError(null);
      setResult(null);
    },
  });

  const handleConvert = useCallback(async () => {
    if (upload.files.length === 0) return;
    setStatus("processing");
    setProgress(5);
    setError(null);
    setResult(null);

    try {
      const blob = await yieldToMain(async () => {
        // mammoth.browser is the prebuilt browser bundle. Dynamic import keeps
        // its ~600 KB out of the initial chunk.
        const mammoth = await import("mammoth/mammoth.browser.js");

        // Stage 1: parse .docx → HTML (5 → 50%)
        setProgress(10);
        const arrayBuffer = await upload.files[0].file.arrayBuffer();
        setProgress(25);
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        setProgress(50);

        if (!html || !html.trim()) {
          throw new Error("Could not extract any text from this Word document.");
        }

        // Stage 2: HTML → structured lines (50 → 60%)
        const lines = htmlToLines(html);
        if (lines.length === 0) {
          throw new Error("Could not extract any text from this Word document.");
        }
        setProgress(60);

        // Stage 3: lines → PDF (60 → 100%)
        const pdfBlob = await linesToPdfBlob(lines);
        setProgress(100);
        return pdfBlob;
      });

      const baseName = upload.files[0].name.replace(/\.docx$/i, "");
      setResult({
        blob,
        fileName: `${baseName}.pdf`,
        size: blob.size,
        contentType: "application/pdf",
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed.");
      setStatus("error");
    }
  }, [upload.files]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    upload.clear();
    setResult(null);
    setError(null);
    setProgress(0);
  }, [upload]);

  const handleDownload = useCallback(() => {
    if (result) triggerDownload(result.blob, result.fileName);
  }, [result]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileOutput className="h-5 w-5" />
            Word to PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "idle" && (
            <DropZone
              {...upload}
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              title="Drop your .docx file here or click to browse"
              subtitle={`Word (.docx) up to ${formatBytes(MAX_BYTES)} — converted entirely in your browser. Legacy .doc not supported`}
            />
          )}

          {(status === "loaded" ||
            status === "processing" ||
            status === "done" ||
            status === "error") &&
            upload.files.length > 0 && (
              <div className="space-y-6">
                <FileChip
                  file={upload.files[0]}
                  onRemove={status === "loaded" ? () => handleReset() : undefined}
                  disabled={status === "processing"}
                />

                {status === "loaded" && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConvert}
                  >
                    <FileOutput className="mr-2 h-4 w-4" />
                    Convert to PDF
                  </Button>
                )}

                {status === "processing" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Rendering PDF…
                      </span>
                      <span className="font-medium">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}

                {status === "error" && error && (
                  <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-destructive">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-medium">Conversion failed</p>
                      <p className="text-sm opacity-80">{error}</p>
                    </div>
                  </div>
                )}

                {status === "done" && result && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/5 p-4 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">Conversion complete!</p>
                        <p className="text-sm opacity-80">
                          Output: {result.fileName} ({formatBytes(result.size)})
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        className="flex-1"
                        size="lg"
                        onClick={handleDownload}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleReset}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Convert Another
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Important notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Only .docx is supported.</strong> The legacy .doc format
            (used by Microsoft Word 97-2003) uses a proprietary binary format
            that requires a different parser. To convert a .doc file, open it in
            Microsoft Word or LibreOffice and save it as .docx, then upload the
            .docx here.
          </p>
          <p>
            <strong>Structure is preserved.</strong> Headings get larger fonts,
            lists get bullet prefixes, and paragraphs wrap to fit A4 pages.
            However, custom fonts are replaced with standard PDF fonts
            (Helvetica), and embedded images are not currently rendered.
          </p>
          <p>
            <strong>For full-fidelity conversion</strong> (including custom
            fonts, embedded images, and complex tables), use a desktop tool
            like LibreOffice or Microsoft Word&apos;s built-in &quot;Save as
            PDF&quot;.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
