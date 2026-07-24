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
import { Progress } from "@/components/ui/progress";
import {
  Stamp,
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

const MAX_BYTES = 25 * 1024 * 1024;

function validatePdf(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Please upload a PDF file.";
  if (file.size > MAX_BYTES)
    return `File is too large. Max ${formatBytes(MAX_BYTES)}.`;
  return null;
}

export function WatermarkPdf() {
  const [status, setStatus] = useState<
    "idle" | "loaded" | "processing" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState("60");
  const [opacity, setOpacity] = useState("0.2");
  const [color, setColor] = useState("#888888");
  const [rotation, setRotation] = useState("45");

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
    if (!text.trim()) {
      setError("Watermark text cannot be empty.");
      setStatus("error");
      return;
    }
    setStatus("processing");
    setProgress(10);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", upload.files[0].file);
      fd.append("text", text);
      fd.append("fontSize", fontSize);
      fd.append("opacity", opacity);
      fd.append("color", color);
      fd.append("rotation", rotation);

      const timer = setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.random() * 6 : p));
      }, 500);

      const res = await fetch("/api/watermark-pdf", {
        method: "POST",
        body: fd,
      });

      clearInterval(timer);
      setProgress(100);

      if (!res.ok) {
        let msg = `Watermark failed (HTTP ${res.status}).`;
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      const baseName = upload.files[0].name.replace(/\.pdf$/i, "");
      setResult({
        blob,
        fileName: `${baseName}-watermarked.pdf`,
        size: blob.size,
        contentType: "application/pdf",
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Watermark failed.");
      setStatus("error");
    }
  }, [upload.files, text, fontSize, opacity, color, rotation]);

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

  const previewStyle: React.CSSProperties = {
    fontSize: `${Math.min(parseInt(fontSize, 10) / 2, 36)}px`,
    opacity: parseFloat(opacity),
    color,
    transform: `rotate(${-parseInt(rotation, 10)}deg)`,
    fontWeight: 700,
    fontFamily: "Helvetica, Arial, sans-serif",
    pointerEvents: "none",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stamp className="h-5 w-5" />
            Watermark PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "idle" && (
            <DropZone
              {...upload}
              accept=".pdf,application/pdf"
              title="Drop your PDF here or click to browse"
              subtitle="PDF up to 50 MB, 200 pages max"
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

                {/* Live preview */}
                <div className="relative h-32 rounded-md border bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                  <span style={previewStyle}>{text || "WATERMARK"}</span>
                  <span className="absolute bottom-1.5 right-2 text-[10px] text-muted-foreground">
                    Preview (approximate)
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wm-text">Watermark text</Label>
                  <input
                    id="wm-text"
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={status !== "loaded"}
                    maxLength={200}
                    placeholder="DRAFT, CONFIDENTIAL, SAMPLE…"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wm-size">Font size</Label>
                    <input
                      id="wm-size"
                      type="number"
                      min="6"
                      max="400"
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      disabled={status !== "loaded"}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wm-opacity">Opacity (0-1)</Label>
                    <input
                      id="wm-opacity"
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={opacity}
                      onChange={(e) => setOpacity(e.target.value)}
                      disabled={status !== "loaded"}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wm-rotation">Rotation (°)</Label>
                    <input
                      id="wm-rotation"
                      type="number"
                      min="-180"
                      max="360"
                      value={rotation}
                      onChange={(e) => setRotation(e.target.value)}
                      disabled={status !== "loaded"}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wm-color">Color</Label>
                    <div className="flex gap-2">
                      <input
                        id="wm-color"
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        disabled={status !== "loaded"}
                        className="h-10 w-12 rounded-md border border-input bg-background cursor-pointer"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        disabled={status !== "loaded"}
                        className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {status === "loaded" && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConvert}
                  >
                    <Stamp className="mr-2 h-4 w-4" />
                    Add Watermark
                  </Button>
                )}

                {status === "processing" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Stamping watermark…
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
                      <p className="font-medium">Watermark failed</p>
                      <p className="text-sm opacity-80">{error}</p>
                    </div>
                  </div>
                )}

                {status === "done" && result && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/5 p-4 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">Watermark added!</p>
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
                        Watermark Another
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
          <CardTitle className="text-base">Common use cases</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>DRAFT</strong> — Mark unfinished documents before sharing
            with collaborators.
          </p>
          <p>
            <strong>CONFIDENTIAL</strong> — Label sensitive internal reports to
            discourage casual sharing.
          </p>
          <p>
            <strong>SAMPLE</strong> — Brand demo documents to prevent them from
            being mistaken for the real thing.
          </p>
          <p>
            <strong>DO NOT COPY</strong> — Discourage reproduction of copyrighted
            or restricted material.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
