"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Download,
  Image as ImageIcon,
  X,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

interface CompressedResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  size: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function ImageCompressor() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [quality, setQuality] = useState<number[]>([80]);
  const [maxWidth, setMaxWidth] = useState<string>("1920");
  const [maxHeight, setMaxHeight] = useState<string>("1080");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");
  const [compressedResult, setCompressedResult] =
    useState<CompressedResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Refs that mirror the latest object URLs so the unmount cleanup (which
  // otherwise captures stale state due to empty deps) can revoke them.
  const originalUrlRef = useRef<string>("");
  const compressedUrlRef = useRef<string>("");
  // Token to cancel in-flight compressions when the user changes file or
  // settings mid-render. Without this, a stale render can overwrite newer
  // results OR hang the isCompressing spinner if the source URL was revoked.
  const compressTokenRef = useRef<number>(0);

  // Keep refs in sync with state via effect — assigning refs during render
  // is forbidden by react-hooks/refs.
  useEffect(() => {
    originalUrlRef.current = originalUrl;
  }, [originalUrl]);
  useEffect(() => {
    compressedUrlRef.current = compressedResult?.url ?? "";
  }, [compressedResult]);

  // Cleanup object URLs on unmount — use refs (not stale closures) so we
  // always revoke the most recent URLs.
  useEffect(() => {
    return () => {
      if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
      if (compressedUrlRef.current) URL.revokeObjectURL(compressedUrlRef.current);
    };
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    // Validate it's an image
    if (!file.type.startsWith("image/")) {
      setError(`"${file.name}" is not an image file.`);
      return;
    }
    // Cap at 25 MB to avoid crashing the tab on huge uploads.
    if (file.size > 25 * 1024 * 1024) {
      setError(`"${file.name}" is too large. Max 25 MB.`);
      return;
    }

    setError(null);

    // Revoke previous URLs
    setOriginalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setCompressedResult((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });

    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);

    // Get dimensions — also handle onerror so corrupt images don't leave
    // the UI in an indeterminate state where the Compress button silently
    // does nothing.
    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      setError(`Could not load "${file.name}" — the file may be corrupt or not a real image.`);
      setOriginalFile(null);
      setOriginalUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });
    };
    img.src = url;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const clearFile = useCallback(() => {
    setOriginalFile(null);
    setOriginalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setOriginalDimensions(null);
    setCompressedResult((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const compressImage = useCallback(async () => {
    if (!originalFile || !originalDimensions || !canvasRef.current) return;

    // Each compression gets a unique token. If the user uploads a new file
    // while we're mid-render, the newer call bumps the token; when this
    // render resolves we check and discard the stale result.
    const myToken = ++compressTokenRef.current;
    setIsCompressing(true);
    setError(null);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load the image. It may be corrupt."));
        img.src = originalUrl;
      });

      // Bail if a newer compression has started.
      if (compressTokenRef.current !== myToken) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Cannot get canvas context");

      // Calculate new dimensions maintaining aspect ratio.
      // Treat 0 / NaN / negative max as "no constraint" — previously
      // parseInt("0") || Infinity silently converted 0 to Infinity.
      const parsedW = parseInt(maxWidth, 10);
      const parsedH = parseInt(maxHeight, 10);
      const maxW = Number.isFinite(parsedW) && parsedW > 0 ? parsedW : Infinity;
      const maxH = Number.isFinite(parsedH) && parsedH > 0 ? parsedH : Infinity;
      let { naturalWidth: w, naturalHeight: h } = img;

      if (w > maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }
      if (h > maxH) {
        w = Math.round((w * maxH) / h);
        h = maxH;
      }

      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);

      // For PNG, preserve transparency by not filling background
      if (outputFormat !== "image/png") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
      }

      ctx.drawImage(img, 0, 0, w, h);

      const qualityValue = quality[0] / 100;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Failed to create blob"));
          },
          outputFormat,
          outputFormat === "image/png" ? undefined : qualityValue
        );
      });

      // Bail again — the await above may have taken a while.
      if (compressTokenRef.current !== myToken) {
        URL.revokeObjectURL(URL.createObjectURL(blob)); // discard
        return;
      }

      const url = URL.createObjectURL(blob);

      setCompressedResult((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return {
          blob,
          url,
          width: w,
          height: h,
          size: blob.size,
        };
      });
    } catch (err) {
      // Don't show the error if a newer compression has taken over.
      if (compressTokenRef.current !== myToken) return;
      const msg = err instanceof Error ? err.message : "Compression failed unexpectedly.";
      setError(msg);
    } finally {
      if (compressTokenRef.current === myToken) {
        setIsCompressing(false);
      }
    }
  }, [
    originalFile,
    originalUrl,
    originalDimensions,
    quality,
    maxWidth,
    maxHeight,
    outputFormat,
  ]);

  const handleDownload = useCallback(() => {
    if (!compressedResult) return;

    const ext = outputFormat.split("/")[1]; // jpeg, png, webp
    const baseName = originalFile?.name.replace(/\.[^.]+$/, "") || "image";
    const fileName = `${baseName}-compressed.${ext}`;

    const link = document.createElement("a");
    link.href = compressedResult.url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [compressedResult, outputFormat, originalFile]);

  const reductionPercent =
    originalFile && compressedResult
      ? Math.max(
          0,
          ((originalFile.size - compressedResult.size) / originalFile.size) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="size-5 text-primary" />
            Image Compressor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!originalFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative flex cursor-pointer flex-col items-center justify-center
                rounded-lg border-2 border-dashed p-10 transition-colors
                ${
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
                <Upload className="size-7 text-primary" />
              </div>
              <p className="text-sm font-medium">
                Drag &amp; drop an image here, or{" "}
                <span className="text-primary underline underline-offset-2">
                  browse
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supports JPEG, PNG, WebP, GIF, BMP, and more
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {originalFile.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {originalDimensions
                      ? `${originalDimensions.width} × ${originalDimensions.height} · `
                      : ""}
                    {formatBytes(originalFile.size)} · {originalFile.type}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  className="ml-2 shrink-0"
                >
                  <X className="size-4" />
                  <span className="sr-only">Remove image</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compression Settings */}
      {originalFile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compression Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Output Format */}
            <div className="space-y-2">
              <Label htmlFor="output-format">Output Format</Label>
              <Select
                value={outputFormat}
                onValueChange={(val) => setOutputFormat(val as OutputFormat)}
              >
                <SelectTrigger id="output-format" className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image/jpeg">JPEG</SelectItem>
                  <SelectItem value="image/png">PNG</SelectItem>
                  <SelectItem value="image/webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quality Slider */}
            {outputFormat !== "image/png" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quality-slider">Quality</Label>
                  <span className="text-sm font-semibold tabular-nums text-primary">
                    {quality[0]}%
                  </span>
                </div>
                <Slider
                  id="quality-slider"
                  min={1}
                  max={100}
                  step={1}
                  value={quality}
                  onValueChange={setQuality}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Smallest file</span>
                  <span>Best quality</span>
                </div>
              </div>
            )}

            {outputFormat === "image/png" && (
              <p className="text-sm text-muted-foreground">
                PNG uses lossless compression — the quality slider is not
                applicable. File size is determined by the image content and
                dimensions.
              </p>
            )}

            {/* Max Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-width">Max Width (px)</Label>
                <Input
                  id="max-width"
                  type="number"
                  min={1}
                  placeholder="1920"
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-height">Max Height (px)</Label>
                <Input
                  id="max-height"
                  type="number"
                  min={1}
                  placeholder="1080"
                  value={maxHeight}
                  onChange={(e) => setMaxHeight(e.target.value)}
                />
              </div>
            </div>

            {/* Compress Button */}
            <Button
              onClick={compressImage}
              disabled={isCompressing}
              className="w-full sm:w-auto"
              size="lg"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Compressing…
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 size-4" />
                  Compress Image
                </>
              )}
            </Button>

            {/* Error message — previously errors were only console.logged
                and the user had no idea why the Compress button did nothing. */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-destructive">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium">Compression failed</p>
                  <p className="text-sm opacity-80">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {compressedResult && originalFile && (
        <>
          {/* Size Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Original
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {formatBytes(originalFile.size)}
                  </p>
                  {originalDimensions && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {originalDimensions.width} × {originalDimensions.height}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <ArrowRight className="size-5 text-muted-foreground sm:block hidden" />
                    <div className="text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          reductionPercent > 0
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        }`}
                      >
                        {reductionPercent > 0 ? "−" : "+"}
                        {reductionPercent.toFixed(1)}%
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatBytes(originalFile.size - compressedResult.size)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Compressed
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    {formatBytes(compressedResult.size)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {compressedResult.width} × {compressedResult.height}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={handleDownload}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 size-4" />
                  Download{" "}
                  {outputFormat.split("/")[1].toUpperCase()}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Side-by-side Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Original Preview */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Original
                  </p>
                  <div className="overflow-hidden rounded-lg border bg-muted/20">
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="h-auto w-full object-contain max-h-80"
                    />
                  </div>
                </div>

                {/* Compressed Preview */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Compressed
                  </p>
                  <div className="overflow-hidden rounded-lg border bg-muted/20">
                    <img
                      src={compressedResult.url}
                      alt="Compressed"
                      className="h-auto w-full object-contain max-h-80"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}