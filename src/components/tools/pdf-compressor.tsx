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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CompressionLevel = "low" | "medium" | "high";

interface FileState {
  file: File;
  bytes: ArrayBuffer;
  size: number;
  name: string;
}

interface CompressionResult {
  originalSize: number;
  compressedSize: number;
  reduction: number;
  blob: Blob;
  fileName: string;
}

type Status = "idle" | "loaded" | "compressing" | "done" | "error";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ---------------------------------------------------------------------------
// JPEG re-encoding via Canvas
// ---------------------------------------------------------------------------

function reencodeJpeg(
  jpegBytes: Uint8Array,
  quality: number
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([jpegBytes], { type: "image/jpeg" });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    const cleanup = () => URL.revokeObjectURL(url);

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Image load timeout"));
    }, 10_000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          reject(new Error("Canvas 2D not available"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        cleanup();

        canvas.toBlob(
          (result) => {
            if (result) {
              result
                .arrayBuffer()
                .then((buf) => resolve(new Uint8Array(buf)))
                .catch(reject);
            } else {
              reject(new Error("Blob conversion failed"));
            }
          },
          "image/jpeg",
          quality
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error("Failed to decode JPEG"));
    };

    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// Embedded JPEG compression (binary scan of PDF bytes)
// ---------------------------------------------------------------------------

interface Region {
  start: number;
  end: number; // exclusive
}

function findJpegRegions(data: Uint8Array): Region[] {
  const regions: Region[] = [];
  let i = 0;

  while (i < data.length - 2) {
    // JPEG SOI: FF D8 FF
    if (
      data[i] === 0xff &&
      data[i + 1] === 0xd8 &&
      data[i + 2] === 0xff
    ) {
      const start = i;
      i += 3;
      let lastEoi = -1;

      // Scan forward for EOI markers (FF D9).
      // In entropy-coded data, 0xFF followed by 0x00 is byte-stuffing, not a marker.
      // A real marker has 0xFF followed by a non-zero, non-00 byte.
      while (i < data.length - 1) {
        if (data[i] === 0xff && data[i + 1] !== 0x00) {
          if (data[i + 1] === 0xd9) {
            lastEoi = i;
            i += 2;
            // If the next byte isn't 0xFF this is very likely the final EOI
            if (i >= data.length || data[i] !== 0xff) break;
          } else {
            // Skip marker segment (skip the length bytes)
            if (i + 3 < data.length) {
              const segLen = (data[i + 2] << 8) | data[i + 3];
              i += 2 + segLen;
            } else {
              i += 2;
            }
          }
        } else {
          i++;
        }
      }

      if (lastEoi > start + 10) {
        regions.push({ start, end: lastEoi + 2 });
      }
    } else {
      i++;
    }
  }

  // Only keep JPEGs >= 1 KB to avoid false positives
  return regions.filter((r) => r.end - r.start >= 1024);
}

async function compressEmbeddedJpegs(
  pdfBytes: Uint8Array,
  quality: number
): Promise<Uint8Array> {
  const regions = findJpegRegions(pdfBytes);
  if (regions.length === 0) return pdfBytes;

  const parts: Uint8Array[] = [];
  let prev = 0;

  for (const { start, end } of regions) {
    // Non-image data between regions
    if (start > prev) parts.push(pdfBytes.slice(prev, start));

    try {
      const original = pdfBytes.slice(start, end);
      const compressed = await reencodeJpeg(original, quality);
      parts.push(compressed.length < original.length ? compressed : original);
    } catch {
      // If re-encoding fails, keep original bytes
      parts.push(pdfBytes.slice(start, end));
    }

    prev = end;
  }

  if (prev < pdfBytes.length) parts.push(pdfBytes.slice(prev));

  const total = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    result.set(p, off);
    off += p.length;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Core compression logic
// ---------------------------------------------------------------------------

async function compressPdf(
  fileBytes: ArrayBuffer,
  level: CompressionLevel,
  onProgress: (pct: number) => void
): Promise<CompressionResult> {
  const original = new Uint8Array(fileBytes);
  onProgress(10);

  // Load with pdf-lib (ignoring encryption where possible)
  const pdfDoc = await PDFDocument.load(original, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  onProgress(25);

  // Medium / High: strip metadata
  if (level === "medium" || level === "high") {
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("PDF Compressor");
    pdfDoc.setCreator("");
  }
  onProgress(40);

  // pdf-lib save() already performs structural optimization
  let optimized = await pdfDoc.save();
  onProgress(60);

  // High: additionally re-encode embedded JPEG images
  if (level === "high") {
    optimized = await compressEmbeddedJpegs(optimized, 0.45);
    onProgress(90);
  }

  onProgress(100);

  const originalSize = original.length;
  const compressedSize = optimized.length;
  const reduction = ((1 - compressedSize / originalSize) * 100);

  return {
    originalSize,
    compressedSize,
    reduction,
    blob: new Blob([optimized], { type: "application/pdf" }),
    fileName: "compressed.pdf",
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
      "Strip metadata + reduce embedded image quality + optimization (best compression)",
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

  const acceptFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setError("Please select a valid PDF file.");
      setStatus("error");
      return;
    }
    try {
      const bytes = await file.arrayBuffer();
      setFileState({ file, bytes, size: bytes.byteLength, name: file.name });
      setResult(null);
      setError(null);
      setStatus("loaded");
      setProgress(0);
    } catch {
      setError("Failed to read the file. Please try again.");
      setStatus("error");
    }
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) acceptFile(file);
    },
    [acceptFile]
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
    [acceptFile]
  );

  // -- Compress -------------------------------------------------------------

  const handleCompress = useCallback(async () => {
    if (!fileState) return;
    setStatus("compressing");
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const res = await compressPdf(fileState.bytes, level, setProgress);
      setResult(res);
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
    if (!result || !fileState) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = fileState.name.replace(/\.pdf$/i, "");
    a.download = `${baseName}-compressed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result, fileState]);

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
          {/* Drop zone */}
          {status === "idle" && (
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
                  Supports .pdf files
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
                      )
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
                              100 - result.reduction
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
            <strong className="text-foreground">High</strong> &mdash; Everything
            in Medium plus re-encodes embedded JPEG images at reduced quality
            (≈45%) via the Canvas API for maximum file-size savings.
          </p>
          <p className="pt-1">
            All processing happens <strong className="text-foreground">locally in
            your browser</strong> &mdash; no files are uploaded to any server.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}