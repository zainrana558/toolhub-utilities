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
  AlignLeft,
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

const MAX_BYTES = 15 * 1024 * 1024;

function validatePdf(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Please upload a PDF file.";
  if (file.size > MAX_BYTES)
    return `File is too large. Max ${formatBytes(MAX_BYTES)}.`;
  return null;
}

export function PdfToText() {
  const [status, setStatus] = useState<
    "idle" | "loaded" | "processing" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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
    setProgress(10);
    setError(null);
    setResult(null);
    setPreview(null);

    try {
      const fd = new FormData();
      fd.append("file", upload.files[0].file);

      const timer = setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.random() * 6 : p));
      }, 500);

      const res = await fetch("/api/pdf-to-text", {
        method: "POST",
        body: fd,
      });

      clearInterval(timer);
      setProgress(100);

      if (!res.ok) {
        let msg = `Extraction failed (HTTP ${res.status}).`;
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      const baseName = upload.files[0].name.replace(/\.pdf$/i, "");

      // Read a preview of the text
      const text = await blob.text();
      setPreview(text.length > 2000 ? text.slice(0, 2000) + "\n\n[…truncated preview…]" : text);

      setResult({
        blob,
        fileName: `${baseName}.txt`,
        size: blob.size,
        contentType: "text/plain",
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed.");
      setStatus("error");
    }
  }, [upload.files]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    upload.clear();
    setResult(null);
    setError(null);
    setProgress(0);
    setPreview(null);
  }, [upload]);

  const handleDownload = useCallback(() => {
    if (result) triggerDownload(result.blob, result.fileName);
  }, [result]);

  const handleCopy = useCallback(async () => {
    if (!preview) return;
    try {
      // Fetch the full text from the blob for copying
      if (result) {
        const text = await result.blob.text();
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Clipboard may not be available
    }
  }, [preview, result]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlignLeft className="h-5 w-5" />
            PDF to Text
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "idle" && (
            <DropZone
              {...upload}
              accept=".pdf,application/pdf"
              title="Drop your PDF here or click to browse"
              subtitle={`PDF up to ${formatBytes(MAX_BYTES)}`}
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
                    <AlignLeft className="mr-2 h-4 w-4" />
                    Extract Text
                  </Button>
                )}

                {status === "processing" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Extracting text…
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
                      <p className="font-medium">Extraction failed</p>
                      <p className="text-sm opacity-80">{error}</p>
                    </div>
                  </div>
                )}

                {status === "done" && result && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/5 p-4 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">Text extracted!</p>
                        <p className="text-sm opacity-80">
                          Output: {result.fileName} ({formatBytes(result.size)})
                        </p>
                      </div>
                    </div>

                    {preview && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Preview:</p>
                        <pre className="max-h-64 overflow-auto rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-wrap font-mono">
                          {preview}
                        </pre>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        className="flex-1"
                        size="lg"
                        onClick={handleDownload}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download .txt
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleCopy}
                      >
                        Copy to Clipboard
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleReset}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Another
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
          <CardTitle className="text-base">Use cases</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Search indexing</strong> — Generate a plain-text version of
            a PDF so search engines and full-text search tools can index it.
          </p>
          <p>
            <strong>Copy-paste</strong> — Extract quotes from PDFs for research
            papers, blog posts, or documentation without manually selecting
            text.
          </p>
          <p>
            <strong>LLM / NLP input</strong> — Feed PDF content into large
            language models, translation services, plagiarism checkers, or text
            analysis tools that expect plain text.
          </p>
          <p>
            <strong>Accessibility</strong> — Plain text is more accessible to
            screen readers, text-to-speech tools, and users with visual
            impairments.
          </p>
          <p className="pt-2">
            <strong>Scanned PDFs</strong> that contain images of text require
            OCR (Optical Character Recognition), which this tool does not
            perform. The tool will detect when no text can be extracted and
            return an informative error.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
