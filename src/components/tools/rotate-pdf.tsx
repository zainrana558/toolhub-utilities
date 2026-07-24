"use client";

import { useCallback, useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
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
  RotateCw,
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
import { MAX_CLIENT_BYTES, MAX_PAGES, fileToBytes, yieldToMain } from "./_pdf-client";

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

export function RotatePdf() {
  const [status, setStatus] = useState<
    "idle" | "loaded" | "processing" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [angle, setAngle] = useState("90");

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

    try {
      // Yield to the main thread so React can paint the "processing…" spinner
      // before pdf-lib starts doing sync work on the main thread.
      const out = await yieldToMain(async () => {
        const src = await fileToBytes(upload.files[0].file);
        const doc = await PDFDocument.load(src, { ignoreEncryption: true });
        if (doc.getPageCount() > MAX_PAGES) {
          throw new Error(`Too many pages. Max ${MAX_PAGES}.`);
        }
        const angleNum = parseInt(angle, 10);
        for (const page of doc.getPages()) {
          // Compose with any existing rotation on the page — a page already
          // at 90° rotated by 90° more should end up at 180°.
          const current = page.getRotation().angle;
          page.setRotation(degrees((current + angleNum) % 360));
        }
        const bytes = await doc.save();
        setProgress(80);
        return bytes;
      });

      setProgress(100);
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const baseName = upload.files[0].name.replace(/\.pdf$/i, "");
      setResult({
        blob,
        fileName: `${baseName}-rotated-${angle}.pdf`,
        size: blob.size,
        contentType: "application/pdf",
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rotation failed.");
      setStatus("error");
    }
  }, [upload.files, angle]);

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
            <RotateCw className="h-5 w-5" />
            Rotate PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "idle" && (
            <DropZone
              {...upload}
              accept=".pdf,application/pdf"
              title="Drop your PDF here or click to browse"
              subtitle="PDF up to 50 MB, 200 pages max — processed entirely in your browser"
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
                  <Label>Rotation angle</Label>
                  <RadioGroup
                    value={angle}
                    onValueChange={setAngle}
                    disabled={status !== "loaded"}
                    className="grid grid-cols-3 gap-2"
                  >
                    <label
                      htmlFor="rot-90"
                      className="flex flex-col items-center gap-2 rounded-md border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem id="rot-90" value="90" />
                      <RotateCw className="h-8 w-8" />
                      <div className="text-center">
                        <p className="font-medium">90°</p>
                        <p className="text-xs text-muted-foreground">Clockwise</p>
                      </div>
                    </label>
                    <label
                      htmlFor="rot-180"
                      className="flex flex-col items-center gap-2 rounded-md border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem id="rot-180" value="180" />
                      <RotateCw className="h-8 w-8" style={{ transform: "scaleX(-1)" }} />
                      <div className="text-center">
                        <p className="font-medium">180°</p>
                        <p className="text-xs text-muted-foreground">Upside down</p>
                      </div>
                    </label>
                    <label
                      htmlFor="rot-270"
                      className="flex flex-col items-center gap-2 rounded-md border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem id="rot-270" value="270" />
                      <RotateCw className="h-8 w-8" style={{ transform: "scaleX(-1)" }} />
                      <div className="text-center">
                        <p className="font-medium">270°</p>
                        <p className="text-xs text-muted-foreground">Counter-CW</p>
                      </div>
                    </label>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground">
                    Rotation is applied on top of any existing rotation: a page
                    already at 90° that you rotate by 90° ends up at 180°.
                  </p>
                </div>

                {status === "loaded" && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConvert}
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Rotate all pages by {angle}°
                  </Button>
                )}

                {status === "processing" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Rotating pages…
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
                      <p className="font-medium">Rotation failed</p>
                      <p className="text-sm opacity-80">{error}</p>
                    </div>
                  </div>
                )}

                {status === "done" && result && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/5 p-4 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">Rotation complete!</p>
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
                        Rotate Another
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
            The rotation is applied using pdf-lib, which sets each page&apos;s
            /Rotate attribute. This is the standard PDF mechanism for page
            rotation — the actual page content is not re-rendered or re-encoded,
            so there is zero quality loss.
          </p>
          <p>
            All text remains fully selectable, searchable, and copyable after
            rotation. Only the visual orientation changes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
