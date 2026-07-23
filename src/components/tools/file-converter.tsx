"use client";

import { useState, useCallback, useRef, type DragEvent, useMemo } from "react";
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
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InputFormat = "pdf" | "docx" | "md" | "txt" | "html";
type OutputFormat = "txt" | "html" | "markdown" | "pdf" | "docx";

type Status = "idle" | "loaded" | "converting" | "done" | "error";

interface ResultState {
  blob: Blob;
  fileName: string;
  size: number;
}

// ---------------------------------------------------------------------------
// Static conversion matrix — which output formats are valid per input format.
// PDF is a "render" target, not a parseable source for rich DOCX output, so
// PDF → DOCX produces a DOCX containing the extracted plain text.
// ---------------------------------------------------------------------------

const VALID_OUTPUTS: Record<InputFormat, OutputFormat[]> = {
  pdf: ["txt", "html", "markdown"],
  docx: ["txt", "html", "markdown", "pdf"],
  md: ["html", "pdf", "txt", "docx"],
  txt: ["html", "pdf", "markdown", "docx"],
  html: ["txt", "pdf", "markdown", "docx"],
};

const INPUT_ACCEPT: Record<InputFormat, string> = {
  pdf: ".pdf,application/pdf",
  docx: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  md: ".md,.markdown,text/markdown",
  txt: ".txt,text/plain",
  html: ".html,.htm,text/html",
};

const INPUT_LABEL: Record<InputFormat, string> = {
  pdf: "PDF (.pdf)",
  docx: "Word (.docx)",
  md: "Markdown (.md)",
  txt: "Plain Text (.txt)",
  html: "HTML (.html)",
};

const OUTPUT_LABEL: Record<OutputFormat, string> = {
  txt: "Plain Text (.txt)",
  html: "HTML (.html)",
  markdown: "Markdown (.md)",
  pdf: "PDF (.pdf)",
  docx: "Word (.docx)",
};

// Map file extension to InputFormat
function detectInputFormat(file: File): InputFormat | null {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "md" || ext === "markdown") return "md";
  if (ext === "txt") return "txt";
  if (ext === "html" || ext === "htm") return "html";
  // Fall back to MIME
  const mt = file.type.toLowerCase();
  if (mt === "application/pdf") return "pdf";
  if (mt.includes("wordprocessing")) return "docx";
  if (mt === "text/markdown") return "md";
  if (mt === "text/plain") return "txt";
  if (mt === "text/html") return "html";
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function stripExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FileConverter() {
  const [status, setStatus] = useState<Status>("idle");
  const [inputFmt, setInputFmt] = useState<InputFormat | null>(null);
  const [target, setTarget] = useState<OutputFormat | null>(null);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const availableOutputs = useMemo<OutputFormat[]>(
    () => (inputFmt ? VALID_OUTPUTS[inputFmt] : []),
    [inputFmt],
  );

  // -- File handling --------------------------------------------------------

  const acceptFile = useCallback((f: File) => {
    const detected = detectInputFormat(f);
    if (!detected) {
      setError(`Unsupported file type: ${f.name}. Supported: PDF, DOCX, MD, TXT, HTML.`);
      setStatus("error");
      setFile(null);
      setInputFmt(null);
      setTarget(null);
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError("File is larger than 15 MB. Please choose a smaller file.");
      setStatus("error");
      setFile(null);
      setInputFmt(null);
      setTarget(null);
      return;
    }
    setFile(f);
    setInputFmt(detected);
    // Reset target if it's no longer valid for the new input
    setTarget((prev) => (prev && VALID_OUTPUTS[detected].includes(prev) ? prev : null));
    setResult(null);
    setError(null);
    setStatus("loaded");
    setProgress(0);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) acceptFile(f);
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
      const f = e.target.files?.[0];
      if (f) acceptFile(f);
      e.target.value = "";
    },
    [acceptFile],
  );

  // -- Convert --------------------------------------------------------------

  const handleConvert = useCallback(async () => {
    if (!file || !target) return;
    setStatus("converting");
    setProgress(10);
    setError(null);
    setResult(null);

    // Declare timer outside the try block so the catch path can clear it —
    // previously a network/CORS throw skipped `clearInterval`, leaking the
    // interval and forcing setProgress on a possibly-reset component forever.
    let timer: ReturnType<typeof setInterval> | null = null;
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("target", target);

      // Fake progress while the request is in-flight, so the UI feels alive.
      timer = setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.random() * 6 : p));
      }, 400);

      const res = await fetch("/api/convert", {
        method: "POST",
        body: fd,
      });

      if (timer) { clearInterval(timer); timer = null; }
      setProgress(100);

      if (!res.ok) {
        let msg = `Conversion failed (HTTP ${res.status}).`;
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          // ignore parse error
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const baseName = stripExt(file.name);
      const downloadName = `${baseName}-converted.${target === "markdown" ? "md" : target}`;
      setResult({ blob, fileName: downloadName, size: blob.size });
      setStatus("done");
    } catch (err) {
      if (timer) clearInterval(timer);
      const msg =
        err instanceof Error ? err.message : "Conversion failed unexpectedly.";
      setError(msg);
      setStatus("error");
    }
  }, [file, target]);

  // -- Download -------------------------------------------------------------

  const handleDownload = useCallback(() => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  // -- Reset ----------------------------------------------------------------

  const handleReset = useCallback(() => {
    setStatus("idle");
    setFile(null);
    setInputFmt(null);
    setTarget(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setDragOver(false);
  }, []);

  // -- Render ---------------------------------------------------------------

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File Converter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop zone — also render on the recoverable error state where
              acceptFile rejected the file (status="error" but file=null),
              otherwise the user is stuck with no UI and no way to retry. */}
          {(status === "idle" || (status === "error" && !file)) && (
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
                <p className="font-medium">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports .pdf, .docx, .md, .txt, .html (max 15 MB)
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx,.md,.markdown,.txt,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain,text/html"
                className="hidden"
                onChange={onFileChange}
              />
            </div>
          )}

          {/* Recoverable error message — shown when acceptFile rejected the
              file (e.g. wrong type / too large) so the drop zone above is
              still visible. Without this block the user sees no feedback. */}
          {status === "error" && error && !file && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">Could not load file</p>
                <p className="text-sm opacity-80">{error}</p>
              </div>
            </div>
          )}

          {/* File loaded / settings */}
          {(status === "loaded" ||
            status === "converting" ||
            status === "done" ||
            status === "error") &&
            file && (
              <div className="space-y-6">
                {/* Selected file info */}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-8 w-8 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatBytes(file.size)} · {inputFmt ? INPUT_LABEL[inputFmt] : ""}
                      </p>
                    </div>
                  </div>
                  {status !== "converting" && (
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

                {/* Conversion flow visualizer */}
                <div className="flex items-center justify-center gap-3 text-sm">
                  <span className="rounded-md bg-muted px-3 py-1.5 font-medium">
                    {inputFmt ? INPUT_LABEL[inputFmt] : "Input"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="rounded-md bg-primary/10 px-3 py-1.5 font-medium text-primary">
                    {target ? OUTPUT_LABEL[target] : "Pick target ↓"}
                  </span>
                </div>

                {/* Target selector */}
                <div className="space-y-2">
                  <Label htmlFor="convert-target">Convert to</Label>
                  <Select
                    value={target ?? undefined}
                    onValueChange={(v) => setTarget(v as OutputFormat)}
                    disabled={status === "converting" || availableOutputs.length === 0}
                  >
                    <SelectTrigger id="convert-target" className="w-full">
                      <SelectValue placeholder="Select output format" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOutputs.map((o) => (
                        <SelectItem key={o} value={o}>
                          {OUTPUT_LABEL[o]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only formats that preserve the most content from your input are offered.
                  </p>
                </div>

                {/* Convert button */}
                {status === "loaded" && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConvert}
                    disabled={!target}
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Convert to {target ? OUTPUT_LABEL[target] : "..."}
                  </Button>
                )}

                {/* Progress */}
                {status === "converting" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Converting…
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
                      <p className="font-medium">Conversion failed</p>
                      <p className="text-sm opacity-80">{error}</p>
                    </div>
                  </div>
                )}

                {/* Result */}
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

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supported conversions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-md border p-3">
              <p className="font-medium text-foreground mb-1">PDF →</p>
              <p>TXT, HTML, Markdown (text extracted)</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium text-foreground mb-1">Word (DOCX) →</p>
              <p>TXT, HTML, Markdown, PDF</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium text-foreground mb-1">Markdown →</p>
              <p>HTML, PDF, TXT, DOCX</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium text-foreground mb-1">Plain Text →</p>
              <p>HTML, PDF, Markdown, DOCX</p>
            </div>
            <div className="rounded-md border p-3 sm:col-span-2">
              <p className="font-medium text-foreground mb-1">HTML →</p>
              <p>TXT, PDF, Markdown, DOCX</p>
            </div>
          </div>
          <p className="pt-1">
            Files are processed on the server and immediately discarded after
            conversion &mdash; nothing is stored. Maximum file size: 15 MB.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
