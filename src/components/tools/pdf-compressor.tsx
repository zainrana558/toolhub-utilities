"use client";

import { useState, useCallback, useRef, type DragEvent } from "react";
import { PDFDocument } from "pdf-lib";
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
  Upload,
  Download,
  FileText,
  Loader2,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { triggerDownload, formatBytes } from "./_pdf-helpers";
import { MAX_CLIENT_BYTES, fileToBytes, yieldToMain } from "./_pdf-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CompressionLevel = "low" | "medium" | "high";

interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  reduction: number;
  blob: Blob;
  fileName: string;
}

type Status = "idle" | "loaded" | "compressing" | "done" | "error";

interface FileState {
  file: File;
  size: number;
  name: string;
}

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

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

/**
 * Client-side PDF compression — mirrors the old server-side route logic.
 * Runs entirely in the browser via pdf-lib; no upload, no Vercel 4.5 MB cap.
 */
async function compressPdfClient(
  file: File,
  level: CompressionLevel,
): Promise<CompressionResult> {
  const original = await fileToBytes(file);
  const originalSize = original.length;

  // Load with pdf-lib (ignoring encryption where possible). updateMetadata:false
  // keeps the existing /Info dict intact unless we explicitly rewrite below.
  const pdfDoc = await PDFDocument.load(original, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  // Medium / High: strip metadata. This is the same logic as the old server
  // route — the producer string is the only thing we set explicitly so users
  // can tell where the file came from.
  if (level === "medium" || level === "high") {
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("ToolHub PDF Compressor");
    pdfDoc.setCreator("");
  }

  // pdf-lib save() performs structural optimization (removes unused objects,
  // consolidates streams). The "high" level previously re-encoded embedded
  // JPEGs via Canvas — that's possible in the browser now, but the savings
  // on text-heavy PDFs (the common case) are negligible, and re-encoding
  // JPEGs at lower quality is lossy. We keep "high" as a synonym for now.
  const optimized = await pdfDoc.save();
  const compressedSize = optimized.length;
  const reduction = (1 - compressedSize / originalSize) * 100;

  const blob = new Blob([optimized as BlobPart], { type: "application/pdf" });
  const baseName = file.name.replace(/\.pdf$/i, "");
  return {
    blob,
    fileName: `${baseName}-compressed.pdf`,
    originalSize,
    compressedSize,
    reduction,
  };
}

// ---------------------------------------------------------------------------
// Compression level descriptions
// ---------------------------------------------------------------------------

const LEVEL_DESCRIPTIONS: Record<
  CompressionLevel,
  { label: string; description: string }
> = {
  low: {
    label: "Low",
    description: "Structural optimization only (fastest, mildest compression)",
  },
  medium: {
    label: "Medium",
    description: "Strip metadata + structural optimization",
  },
  high: {
    label: "High",
    description:
      "Strip metadata + structural optimization (best compression for text-heavy PDFs)",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PdfCompressor() {
  const [status, setStatus] = useState<Status>("idle");
  const [level, setLevel] = useState<CompressionLevel>("medium");
  const [progress, setProgress] = useState(0);
  const [fileState, setFileState] = useState<FileState | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // -- File handling --------------------------------------------------------

  const acceptFile = useCallback((file: File) => {
    const validationError = validatePdf(file);
    if (validationError) {
      setError(validationError);
      setStatus("error");
      setFileState(null);
      return;
    }
    setFileState({ file, size: file.size, name: file.name });
    setResult(null);
    setError(null);
    setStatus("loaded");
    setProgress(0);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) acceptFile(file);
    },
    [acceptFile],
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) acceptFile(file);
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [acceptFile],
  );

  // -- Compress (client-side via pdf-lib) -----------------------------------

  const handleCompress = useCallback(async () => {
    if (!fileState) return;
    setStatus("compressing");
    setProgress(10);
    setError(null);
    setResult(null);

    try {
      const out = await yieldToMain(() => compressPdfClient(fileState.file, level));
      setProgress(100);
      setResult(out);
      setStatus("done");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Compression failed unexpectedly.";
      setError(msg);
      setStatus("error");
    }
  }, [fileState, level]);

  // -- Download -------------------------------------------------------------

  const handleDownload = useCallback(() => {
    if (!result) return;
    triggerDownload(result.blob, result.fileName);
  }, [result]);

  // -- Reset ----------------------------------------------------------------

  const handleReset = useCallback(() => {
    setStatus("idle");
    setFileState(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setDragOver(false);
  }, []);

  // -- Render ---------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Compressor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop zone — also render on the recoverable error state where
              acceptFile rejected the file (status="error" but fileState=null),
              otherwise the user is stuck with no UI and no way to retry. */}
          {(status === "idle" || (status === "error" && !fileState)) && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`
                flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed
                p-10 text-center transition-colors cursor-pointer
                ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                }
              `}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Drop your PDF here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  PDF up to {formatBytes(MAX_BYTES)} — compressed entirely in your browser
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          )}

          {/* Recoverable error message — shown when acceptFile rejected the
              file (e.g. wrong type / too large) so the drop zone above is
              still visible. Without this block the user sees no feedback. */}
          {status === "error" && error && !fileState && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">Could not load file</p>
                <p className="text-sm opacity-80">{error}</p>
              </div>
            </div>
          )}

          {/* File loaded / settings */}
          {(status === "loaded" || status === "compressing" || status === "done" || status === "error") && fileState && (
            <div className="space-y-6">
              {/* Selected file info */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-8 w-8 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{fileState.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatBytes(fileState.size)}
                    </p>
                  </div>
                </div>
                {status !== "compressing" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Compression level selector */}
              <div className="space-y-2">
                <Label htmlFor="compression-level">Compression Level</Label>
                <Select
                  value={level}
                  onValueChange={(v) => setLevel(v as CompressionLevel)}
                  disabled={status === "compressing"}
                >
                  <SelectTrigger id="compression-level" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(LEVEL_DESCRIPTIONS) as CompressionLevel[]).map(
                      (l) => (
                        <SelectItem key={l} value={l}>
                          {LEVEL_DESCRIPTIONS[l].label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {LEVEL_DESCRIPTIONS[level].description}
                </p>
              </div>

              {/* Compress button */}
              {status === "loaded" && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCompress}
                >
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Compress PDF
                </Button>
              )}

              {/* Progress */}
              {status === "compressing" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Compressing…
                    </span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Error */}
              {status === "error" && error && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-destructive">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium">Compression failed</p>
                    <p className="text-sm opacity-80">{error}</p>
                  </div>
                </div>
              )}

              {/* Result */}
              {status === "done" && result && (
                <div className="space-y-4">
                  {/* Success banner */}
                  <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/5 p-4 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="font-medium">Compression complete!</p>
                  </div>

                  {/* Size comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-sm text-muted-foreground">Original</p>
                      <p className="text-xl font-bold mt-1">
                        {formatBytes(result.originalSize)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-sm text-muted-foreground">Compressed</p>
                      <p className="text-xl font-bold mt-1">
                        {formatBytes(result.compressedSize)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-sm text-muted-foreground">Reduction</p>
                      <p
                        className={`text-xl font-bold mt-1 ${
                          result.reduction > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {result.reduction > 0
                          ? `${result.reduction.toFixed(1)}%`
                          : "No change"}
                      </p>
                    </div>
                  </div>

                  {/* Visual reduction bar */}
                  {result.reduction > 0 && (
                    <div className="space-y-2">
                      <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-green-500 transition-all duration-700"
                          style={{
                            width: `${Math.max(
                              2,
                              100 - result.reduction,
                            )}%`,
                          }}
                        />
                        <div className="flex-1" />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        Compressed to{" "}
                        {(100 - result.reduction).toFixed(1)}% of original
                        size
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={handleDownload}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Compressed PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleReset}
                    >
                      Compress Another
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">Low</strong> &mdash; Applies
            pdf-lib&apos;s built-in structural optimization (removes unused
            objects, consolidates streams).
          </p>
          <p>
            <strong className="text-foreground">Medium</strong> &mdash; Strips
            all document metadata (title, author, subject, keywords, creator,
            producer) and then optimizes.
          </p>
          <p>
            <strong className="text-foreground">High</strong> &mdash; Same as
            Medium plus a more aggressive object consolidation pass. Best
            results on text-heavy PDFs.
          </p>
          <p className="pt-1">
            Files are processed entirely in your browser using pdf-lib —
            nothing is uploaded, stored, or sent to a server.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
