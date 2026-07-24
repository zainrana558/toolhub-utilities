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
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  Scissors,
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

type Mode = "every" | "range" | "extract";

export function SplitPdf() {
  const [status, setStatus] = useState<
    "idle" | "loaded" | "processing" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("every");
  const [ranges, setRanges] = useState("");

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
    if ((mode === "range" || mode === "extract") && !ranges.trim()) {
      setError("Please enter page ranges.");
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
      fd.append("mode", mode);
      if (mode === "range" || mode === "extract") fd.append("ranges", ranges);

      const timer = setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.random() * 6 : p));
      }, 500);

      const res = await fetch("/api/split-pdf", {
        method: "POST",
        body: fd,
      });

      clearInterval(timer);
      setProgress(100);

      if (!res.ok) {
        let msg = `Split failed (HTTP ${res.status}).`;
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      const baseName = upload.files[0].name.replace(/\.pdf$/i, "");
      const isZip = blob.type === "application/zip";
      let fileName: string;
      if (isZip) {
        fileName = `${baseName}-split.zip`;
      } else if (mode === "extract") {
        fileName = `${baseName}-extracted.pdf`;
      } else {
        fileName = `${baseName}-part-1.pdf`;
      }
      setResult({
        blob,
        fileName,
        size: blob.size,
        contentType: blob.type,
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Split failed.");
      setStatus("error");
    }
  }, [upload.files, mode, ranges]);

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
            <Scissors className="h-5 w-5" />
            Split PDF
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

                <div className="space-y-3">
                  <Label>Split mode</Label>
                  <RadioGroup
                    value={mode}
                    onValueChange={(v) => setMode(v as Mode)}
                    disabled={status !== "loaded"}
                    className="grid gap-2"
                  >
                    <label
                      htmlFor="split-every"
                      className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem id="split-every" value="every" className="mt-1" />
                      <div>
                        <p className="font-medium">Extract every page</p>
                        <p className="text-sm text-muted-foreground">
                          One PDF per page, delivered as a ZIP archive.
                        </p>
                      </div>
                    </label>
                    <label
                      htmlFor="split-range"
                      className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem id="split-range" value="range" className="mt-1" />
                      <div>
                        <p className="font-medium">Split by ranges</p>
                        <p className="text-sm text-muted-foreground">
                          Multiple PDFs based on page ranges (e.g.
                          &quot;1-3;5,7-9;10&quot; produces 3 PDFs). Use
                          semicolons to separate output PDFs.
                        </p>
                      </div>
                    </label>
                    <label
                      htmlFor="split-extract"
                      className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem id="split-extract" value="extract" className="mt-1" />
                      <div>
                        <p className="font-medium">Extract pages</p>
                        <p className="text-sm text-muted-foreground">
                          A single PDF containing only the pages you specify
                          (e.g. &quot;1-3,5,7-9&quot;).
                        </p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {(mode === "range" || mode === "extract") && (
                  <div className="space-y-2">
                    <Label htmlFor="split-ranges">
                      Page ranges
                      {mode === "range" && " (semicolon-separated for multiple PDFs)"}
                    </Label>
                    <input
                      id="split-ranges"
                      type="text"
                      value={ranges}
                      onChange={(e) => setRanges(e.target.value)}
                      disabled={status !== "loaded"}
                      placeholder={
                        mode === "range"
                          ? "1-3;5,7-9;10"
                          : "1-3,5,7-9"
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use hyphens for ranges and commas for individual pages.
                      Page numbers are 1-indexed.
                    </p>
                  </div>
                )}

                {status === "loaded" && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConvert}
                  >
                    <Scissors className="mr-2 h-4 w-4" />
                    Split PDF
                  </Button>
                )}

                {status === "processing" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Splitting PDF…
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
                      <p className="font-medium">Split failed</p>
                      <p className="text-sm opacity-80">{error}</p>
                    </div>
                  </div>
                )}

                {status === "done" && result && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/5 p-4 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">Split complete!</p>
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
                        Split Another
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
          <CardTitle className="text-base">Range examples</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <code className="bg-muted px-1.5 py-0.5 rounded">1-3,5,7-9</code>{" "}
            — pages 1, 2, 3, 5, 7, 8, 9
          </p>
          <p>
            <code className="bg-muted px-1.5 py-0.5 rounded">1-10;11-50;51-100</code>{" "}
            — three separate PDFs (split-by-range mode)
          </p>
          <p>
            <code className="bg-muted px-1.5 py-0.5 rounded">3</code> — just
            page 3
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
