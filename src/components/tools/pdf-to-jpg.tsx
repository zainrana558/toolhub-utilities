"use client";

import { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  FileImage,
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
  buildZip,
  fileToBytes,
  sanitizeFileName,
  yieldToMain,
} from "./_pdf-client";
import { renderPdfPagesToJpegs } from "./_pdfjs-client";

// Client-side PDF → JPG. pdfjs renders each page onto a <canvas>, then we
// encode each canvas as a JPEG via `canvas.toBlob`. Single page → single JPG;
// multi-page → ZIP (built with the store-only buildZip helper in _pdf-client).
//
// All work happens in the browser: no upload, no Vercel 4.5 MB cap, no
// serverless function timeout. The only constraint is the user's tab RAM,
// which is why we cap input at 50 MB and page count at 200.
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

export function PdfToJpg() {
  const [status, setStatus] = useState<
    "idle" | "loaded" | "processing" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState("1.5");
  const [quality, setQuality] = useState("0.85");

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
        const scaleNum = parseFloat(scale);
        const qualityNum = parseFloat(quality);

        const pages = await renderPdfPagesToJpegs(src, {
          scale: scaleNum,
          quality: qualityNum,
          maxPages: MAX_PAGES,
          onProgress: (done, total) => {
            // Map [0..total] → [10..95] leaving headroom for the final
            // ZIP / Blob construction.
            const pct = total > 0 ? 10 + Math.round((done / total) * 85) : 10;
            setProgress(pct);
          },
        });

        if (pages.length === 0) {
          throw new Error("No pages rendered.");
        }

        setProgress(98);

        // Sanitize the base name — strip path separators and `..` segments so
        // a maliciously-named upload like `../../etc/cron.d/evil.pdf` cannot
        // produce ZIP entries that escape the destination directory on
        // extraction (CVE-class ZIP path traversal).
        const rawBase = upload.files[0].name.replace(/\.pdf$/i, "");
        const baseName = sanitizeFileName(rawBase) || "pdf";

        if (pages.length === 1) {
          // Single page → return one JPG directly. Copy into a fresh
          // ArrayBuffer-backed Uint8Array so Blob accepts it across browsers
          // (pdfjs sometimes returns a SharedArrayBuffer-backed view).
          const jpgBytes = pages[0].bytes;
          const copy = new Uint8Array(jpgBytes.byteLength);
          copy.set(jpgBytes);
          return new Blob([copy], { type: "image/jpeg" });
        }

        // Multi-page → bundle into a store-only ZIP
        const entries = pages.map((p, i) => ({
          name: `${baseName}-page-${String(i + 1).padStart(3, "0")}.jpg`,
          data: p.bytes,
        }));
        const zipBytes = buildZip(entries);
        // Copy into a fresh ArrayBuffer-backed Uint8Array — see note above.
        const zipCopy = new Uint8Array(zipBytes.byteLength);
        zipCopy.set(zipBytes);
        return new Blob([zipCopy], { type: "application/zip" });
      });

      setProgress(100);

      const isZip = blob.type === "application/zip";
      const baseName = upload.files[0].name.replace(/\.pdf$/i, "");
      const fileName = isZip ? `${baseName}-images.zip` : `${baseName}.jpg`;
      setResult({
        blob,
        fileName,
        size: blob.size,
        contentType: blob.type,
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed.");
      setStatus("error");
    }
  }, [upload.files, scale, quality]);

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
            <FileImage className="h-5 w-5" />
            PDF to JPG
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "idle" && (
            <DropZone
              {...upload}
              accept=".pdf,application/pdf"
              title="Drop your PDF here or click to browse"
              subtitle={`PDF up to ${formatBytes(MAX_BYTES)}, ${MAX_PAGES} pages max — rendered entirely in your browser`}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pdf-jpg-scale">Image scale</Label>
                    <Select
                      value={scale}
                      onValueChange={setScale}
                      disabled={status !== "loaded"}
                    >
                      <SelectTrigger id="pdf-jpg-scale" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1x (faster, smaller)</SelectItem>
                        <SelectItem value="1.5">1.5x (recommended)</SelectItem>
                        <SelectItem value="2">2x (higher quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pdf-jpg-quality">Quality</Label>
                    <Select
                      value={quality}
                      onValueChange={setQuality}
                      disabled={status !== "loaded"}
                    >
                      <SelectTrigger id="pdf-jpg-quality" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.6">Low (smallest file)</SelectItem>
                        <SelectItem value="0.85">Medium (balanced)</SelectItem>
                        <SelectItem value="0.95">High (best quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {status === "loaded" && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConvert}
                  >
                    <FileImage className="mr-2 h-4 w-4" />
                    Convert to JPG
                  </Button>
                )}

                {status === "processing" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Rendering pages…
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
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Each page of your PDF is rendered in your browser using pdfjs-dist
            (the same engine that powers Firefox&apos;s PDF viewer) at the
            scale you choose, then encoded as a JPG image. Files never leave
            your device.
          </p>
          <p>
            Single-page PDFs download as one JPG. Multi-page PDFs arrive as a
            ZIP archive with one JPG per page (page-001.jpg, page-002.jpg, …).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
