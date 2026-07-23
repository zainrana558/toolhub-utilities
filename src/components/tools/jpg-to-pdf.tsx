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
  Images,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Maximize,
} from "lucide-react";
import {
  useFileUpload,
  DropZone,
  FileChip,
  triggerDownload,
  formatBytes,
  type ConvertResult,
} from "./_pdf-helpers";

const MAX_FILES = 30;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;

function validateImage(file: File): string | null {
  const mt = file.type.toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isImage =
    ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mt) ||
    ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
  if (!isImage) return "Please upload JPG, PNG, WEBP, or GIF images.";
  if (file.size > MAX_FILE_BYTES)
    return `File "${file.name}" is too large. Max ${formatBytes(MAX_FILE_BYTES)} per image.`;
  return null;
}

export function JpgToPdf() {
  const [status, setStatus] = useState<
    "idle" | "loaded" | "processing" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState("fit");
  const [orientation, setOrientation] = useState("auto");
  const [margin, setMargin] = useState("0");

  const upload = useFileUpload({
    accept: ".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif",
    multiple: true,
    maxFiles: MAX_FILES,
    maxSizeBytes: MAX_FILE_BYTES,
    validate: validateImage,
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

  const totalBytes = upload.files.reduce((sum, f) => sum + f.size, 0);

  const handleConvert = useCallback(async () => {
    if (upload.files.length === 0) return;
    if (totalBytes > MAX_TOTAL_BYTES) {
      setError(
        `Total size too large. Max ${formatBytes(MAX_TOTAL_BYTES)}.`,
      );
      setStatus("error");
      return;
    }
    setStatus("processing");
    setProgress(10);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      for (const f of upload.files) fd.append("files", f.file);
      fd.append("pageSize", pageSize);
      fd.append("orientation", orientation);
      fd.append("margin", margin);

      const timer = setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.random() * 6 : p));
      }, 500);

      const res = await fetch("/api/jpg-to-pdf", {
        method: "POST",
        body: fd,
      });

      clearInterval(timer);
      setProgress(100);

      if (!res.ok) {
        let msg = `Conversion failed (HTTP ${res.status}).`;
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      const fileName =
        upload.files.length === 1
          ? `${upload.files[0].name.replace(/\.[^.]+$/, "")}.pdf`
          : "combined-images.pdf";
      setResult({
        blob,
        fileName,
        size: blob.size,
        contentType: "application/pdf",
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed.");
      setStatus("error");
    }
  }, [upload.files, totalBytes, pageSize, orientation, margin]);

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
            <Images className="h-5 w-5" />
            JPG to PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "idle" && (
            <DropZone
              {...upload}
              accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
              multiple
              title="Drop your images here or click to browse"
              subtitle={`JPG / PNG / WEBP / GIF — up to ${MAX_FILES} images, ${formatBytes(
                MAX_FILE_BYTES,
              )} each`}
            />
          )}

          {(status === "loaded" ||
            status === "processing" ||
            status === "done" ||
            status === "error") &&
            upload.files.length > 0 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  {upload.files.map((f, i) => (
                    <FileChip
                      key={`${f.name}-${i}`}
                      file={f}
                      onRemove={
                        status === "loaded" ? () => upload.removeAt(i) : undefined
                      }
                      disabled={status === "processing"}
                    />
                  ))}
                  <p className="text-xs text-muted-foreground">
                    {upload.files.length} file
                    {upload.files.length === 1 ? "" : "s"} ·{" "}
                    {formatBytes(totalBytes)} total
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jpg-pdf-size">Page size</Label>
                    <Select
                      value={pageSize}
                      onValueChange={setPageSize}
                      disabled={status !== "loaded"}
                    >
                      <SelectTrigger id="jpg-pdf-size" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Fit to image</SelectItem>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="letter">US Letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jpg-pdf-orient">Orientation</Label>
                    <Select
                      value={orientation}
                      onValueChange={setOrientation}
                      disabled={status !== "loaded"}
                    >
                      <SelectTrigger id="jpg-pdf-orient" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jpg-pdf-margin">Margin (pt)</Label>
                    <div className="relative">
                      <Maximize className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        id="jpg-pdf-margin"
                        type="number"
                        min="0"
                        max="200"
                        value={margin}
                        onChange={(e) => setMargin(e.target.value)}
                        disabled={status !== "loaded"}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm"
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
                    <Images className="mr-2 h-4 w-4" />
                    Create PDF ({upload.files.length}{" "}
                    {upload.files.length === 1 ? "page" : "pages"})
                  </Button>
                )}

                {status === "processing" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Combining images…
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
                        <p className="font-medium">PDF created!</p>
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
                        Start Over
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
            Each image is auto-rotated based on EXIF metadata (so portrait
            photos appear correctly), flattened onto a white background (so
            transparent PNGs don&apos;t break), and re-encoded as JPG at 85%
            quality to keep the final PDF size reasonable.
          </p>
          <p>
            Images are added to the PDF in the order you upload them. To control
            the order, name your files with sortable prefixes (01-photo.jpg,
            02-photo.jpg, …) before uploading.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
