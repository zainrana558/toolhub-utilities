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
  FileType,
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
  MAX_PAGES,
  fileToBytes,
  yieldToMain,
} from "./_pdf-client";
import { extractPdfTextClient } from "./_pdfjs-client";

// Client-side PDF → DOCX. pdfjs-dist extracts text (same path as pdf-to-text),
// then the `docx` npm package builds a .docx with Packer.toBlob() — both run
// natively in the browser, so we bypass Vercel's 4.5 MB upload cap entirely.
// Bundle cost: `docx` adds ~1 MB to this tool's lazy chunk, but it's only
// downloaded when the user actually opens pdf-to-word.
const MAX_BYTES = MAX_CLIENT_BYTES;

function validatePdf(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Please upload a PDF file.";
  if (file.size > MAX_BYTES)
    return `File is too large. Max ${formatBytes(MAX_BYTES)}.`;
  return null;
}

async function buildDocxFromText(text: string, title: string): Promise<Blob> {
  // Dynamic import keeps the heavy `docx` package out of the initial chunk
  // and out of every other tool's chunk. The browser caches it after first
  // load — subsequent visits hit the browser cache, not the network.
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import(
    "docx"
  );

  const paragraphs: InstanceType<typeof Paragraph>[] = [
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
  ];

  // Mirror the server route's paragraph reconstruction: split on blank-line
  // gaps (paragraph boundaries), then join single newlines as soft breaks
  // inside the same paragraph.
  const blocks = text.split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split(/\n/).filter((l) => l.length > 0);
    if (lines.length === 0) continue;
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
    creator: "ToolHub PDF to Word",
    title,
    sections: [{ children: paragraphs }],
  });

  return Packer.toBlob(doc);
}

export function PdfToWord() {
  const [status, setStatus] = useState<
    "idle" | "loaded" | "processing" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useFileUpload({
    accept: ".pdf,application/pdf",
    maxSizeBytes: MAX_BYTES,
    validate: validatePdf,
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
        const src = await fileToBytes(upload.files[0].file);

        // Stage 1: extract text with pdfjs (10 → 80% of progress bar)
        const text = await extractPdfTextClient(src, {
          maxPages: MAX_PAGES,
          onProgress: (done, total) => {
            const pct = total > 0 ? 10 + Math.round((done / total) * 70) : 10;
            setProgress(pct);
          },
        });

        if (!text.trim()) {
          throw new Error(
            "No extractable text found. The PDF may be a scanned image (requires OCR) or may use embedded fonts that prevent text extraction.",
          );
        }

        // Stage 2: build .docx (80 → 100%)
        setProgress(85);
        const baseName = upload.files[0].name.replace(/\.pdf$/i, "");
        const docxBlob = await buildDocxFromText(text, baseName);
        setProgress(100);
        return docxBlob;
      });

      const baseName = upload.files[0].name.replace(/\.pdf$/i, "");
      setResult({
        blob,
        fileName: `${baseName}.docx`,
        size: blob.size,
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
            <FileType className="h-5 w-5" />
            PDF to Word
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "idle" && (
            <DropZone
              {...upload}
              accept=".pdf,application/pdf"
              title="Drop your PDF here or click to browse"
              subtitle={`PDF up to ${formatBytes(MAX_BYTES)}, 200 pages max — converted entirely in your browser`}
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
                    <FileType className="mr-2 h-4 w-4" />
                    Convert to Word
                  </Button>
                )}

                {status === "processing" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Extracting text &amp; building .docx…
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
            <strong>Formatting is not preserved.</strong> PDF is a layout format
            — text is stored as positioned characters, not as structured
            paragraphs. The conversion extracts the text content and
            reconstructs paragraphs based on line breaks, but original fonts,
            colors, bold/italic, tables, and images are not preserved.
          </p>
          <p>
            <strong>Scanned PDFs are not supported.</strong> PDFs that contain
            images of text (rather than actual text) require OCR (Optical
            Character Recognition), which this tool does not perform. The tool
            will detect when no text can be extracted and return an informative
            error.
          </p>
          <p>
            <strong>For full-fidelity conversion</strong> (including layout,
            images, and fonts), use a commercial OCR-based tool like Adobe
            Acrobat.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
