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
  FilePlus2,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  useFileUpload,
  DropZone,
  FileChip,
  triggerDownload,
  formatBytes,
  type ConvertResult,
} from "./_pdf-helpers";

const MAX_FILES = 20;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_BYTES = 250 * 1024 * 1024;

function validatePdf(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Please upload PDF files only.";
  if (file.size > MAX_FILE_BYTES)
    return `File "${file.name}" is too large. Max ${formatBytes(MAX_FILE_BYTES)} per PDF.`;
  return null;
}

export function MergePdf() {
  const [status, setStatus] = useState<
    "idle" | "loaded" | "processing" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useFileUpload({
    accept: ".pdf,application/pdf",
    multiple: true,
    maxFiles: MAX_FILES,
    maxSizeBytes: MAX_FILE_BYTES,
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

  const totalBytes = upload.files.reduce((sum, f) => sum + f.size, 0);

  const move = useCallback(
    (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= upload.files.length) return;
      upload.reorder(idx, target);
    },
    [upload],
  );

  const handleConvert = useCallback(async () => {
    if (upload.files.length < 2) {
      setError("Select at least 2 PDF files to merge.");
      setStatus("error");
      return;
    }
    if (totalBytes > MAX_TOTAL_BYTES) {
      setError(`Total size too large. Max ${formatBytes(MAX_TOTAL_BYTES)}.`);
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

      const timer = setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.random() * 6 : p));
      }, 500);

      const res = await fetch("/api/merge-pdf", {
        method: "POST",
        body: fd,
      });

      clearInterval(timer);
      setProgress(100);

      if (!res.ok) {
        let msg = `Merge failed (HTTP ${res.status}).`;
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      setResult({
        blob,
        fileName: "merged.pdf",
        size: blob.size,
        contentType: "application/pdf",
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Merge failed.");
      setStatus("error");
    }
  }, [upload.files, totalBytes]);

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
            <FilePlus2 className="h-5 w-5" />
            Merge PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "idle" && (
            <DropZone
              {...upload}
              accept=".pdf,application/pdf"
              multiple
              title="Drop your PDFs here or click to browse"
              subtitle={`2 to ${MAX_FILES} PDFs — ${formatBytes(
                MAX_FILE_BYTES,
              )} each, ${formatBytes(MAX_TOTAL_BYTES)} total`}
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
                    <div
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-2"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <FileChip
                          file={f}
                          onRemove={
                            status === "loaded"
                              ? () => upload.removeAt(i)
                              : undefined
                          }
                          disabled={status === "processing"}
                        />
                      </div>
                      {status === "loaded" && (
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => move(i, -1)}
                            disabled={i === 0}
                            aria-label="Move up"
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(i, 1)}
                            disabled={i === upload.files.length - 1}
                            aria-label="Move down"
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    {upload.files.length} PDF
                    {upload.files.length === 1 ? "" : "s"} ·{" "}
                    {formatBytes(totalBytes)} total · merged in the order shown
                  </p>
                </div>

                {status === "loaded" && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConvert}
                    disabled={upload.files.length < 2}
                  >
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Merge {upload.files.length} PDFs
                  </Button>
                )}

                {status === "processing" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Merging PDFs…
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
                      <p className="font-medium">Merge failed</p>
                      <p className="text-sm opacity-80">{error}</p>
                    </div>
                  </div>
                )}

                {status === "done" && result && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/5 p-4 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">PDFs merged!</p>
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
            Each PDF is parsed server-side using pdf-lib, and the pages are
            appended to a new output PDF in the order you provide them. All
            text, images, fonts, and links from the original PDFs are preserved
            exactly — no watermarks, no re-encoding, no quality loss.
          </p>
          <p>
            Use the up/down arrows next to each file to reorder before merging.
            The PDF at the top of the list becomes the first pages of the
            merged document.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
