"use client";

import { useCallback, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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
  Hash,
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
import {
  MAX_CLIENT_BYTES,
  MAX_PAGES,
  hexToRgb,
  fileToBytes,
  yieldToMain,
} from "./_pdf-client";

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

const POSITIONS = [
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "top-center", label: "Top center" },
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
];

const FORMATS = [
  { value: "{n}", label: "1, 2, 3, …" },
  { value: "{n}/{total}", label: "1/24, 2/24, …" },
  { value: "Page {n}", label: "Page 1, Page 2, …" },
  { value: "Page {n} of {total}", label: "Page 1 of 24, …" },
  { value: "- {n} -", label: "- 1 -, - 2 -, …" },
];

export function PdfNumber() {
  const [status, setStatus] = useState<
    "idle" | "loaded" | "processing" | "done" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState("bottom-center");
  const [format, setFormat] = useState("{n}/{total}");
  const [fontSize, setFontSize] = useState("12");
  const [color, setColor] = useState("#333333");
  const [startAt, setStartAt] = useState("1");
  const [margin, setMargin] = useState("30");

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
    const fontSizeNum = parseFloat(fontSize);
    const startAtNum = parseInt(startAt, 10);
    const marginNum = parseFloat(margin);
    if (!Number.isFinite(fontSizeNum) || fontSizeNum < 6 || fontSizeNum > 72) {
      setError("Font size must be between 6 and 72.");
      setStatus("error");
      return;
    }
    if (!Number.isFinite(startAtNum) || startAtNum < 0 || startAtNum > 9999) {
      setError("Start page must be between 0 and 9999.");
      setStatus("error");
      return;
    }
    if (!Number.isFinite(marginNum) || marginNum < 0 || marginNum > 200) {
      setError("Margin must be a number between 0 and 200 (points).");
      setStatus("error");
      return;
    }
    if (!format.includes("{n")) {
      setError("Format string must contain '{n}', '{n+total}', or similar.");
      setStatus("error");
      return;
    }
    setStatus("processing");
    setProgress(10);
    setError(null);
    setResult(null);

    try {
      const out = await yieldToMain(async () => {
        const src = await fileToBytes(upload.files[0].file);
        const doc = await PDFDocument.load(src, { ignoreEncryption: true });
        if (doc.getPageCount() > MAX_PAGES) {
          throw new Error(`Too many pages. Max ${MAX_PAGES}.`);
        }
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const c = hexToRgb(color, { r: 0.2, g: 0.2, b: 0.2 });
        const pages = doc.getPages();
        const total = pages.length;
        pages.forEach((page, idx) => {
          const { width, height } = page.getSize();
          const n = startAtNum + idx;
          const label = format
            .replace(/\{n\}/g, String(n))
            .replace(/\{total\}/g, String(total))
            .replace(/\{n\/total\}/g, `${n}/${total}`);
          const textWidth = font.widthOfTextAtSize(label, fontSizeNum);
          const textHeight = font.heightAtSize(fontSizeNum);
          let x: number;
          let y: number;
          if (position.includes("left")) {
            x = marginNum;
          } else if (position.includes("right")) {
            x = width - textWidth - marginNum;
          } else {
            x = (width - textWidth) / 2;
          }
          if (position.startsWith("top")) {
            y = height - marginNum - textHeight;
          } else {
            y = marginNum;
          }
          page.drawText(label, {
            x,
            y,
            size: fontSizeNum,
            font,
            color: rgb(c.r, c.g, c.b),
          });
        });
        const bytes = await doc.save();
        setProgress(90);
        return bytes;
      });

      setProgress(100);
      const blob = new Blob([out as BlobPart], { type: "application/pdf" });
      const baseName = upload.files[0].name.replace(/\.pdf$/i, "");
      setResult({
        blob,
        fileName: `${baseName}-numbered.pdf`,
        size: blob.size,
        contentType: "application/pdf",
      });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Numbering failed.");
      setStatus("error");
    }
  }, [
    upload.files,
    position,
    format,
    fontSize,
    color,
    startAt,
    margin,
  ]);

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

  // Preview label for the chosen format
  const previewLabel = format
    .replace(/\{n\}/g, startAt || "1")
    .replace(/\{total\}/g, "24");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            PDF Page Number
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pn-position">Position</Label>
                    <Select
                      value={position}
                      onValueChange={setPosition}
                      disabled={status !== "loaded"}
                    >
                      <SelectTrigger id="pn-position" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pn-format">Format</Label>
                    <Select
                      value={format}
                      onValueChange={setFormat}
                      disabled={status !== "loaded"}
                    >
                      <SelectTrigger id="pn-format" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMATS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pn-size">Font size</Label>
                    <input
                      id="pn-size"
                      type="number"
                      min="6"
                      max="72"
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      disabled={status !== "loaded"}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pn-color">Color</Label>
                    <div className="flex gap-2">
                      <input
                        id="pn-color"
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
                  <div className="space-y-2">
                    <Label htmlFor="pn-start">Start at</Label>
                    <input
                      id="pn-start"
                      type="number"
                      min="0"
                      max="9999"
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      disabled={status !== "loaded"}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pn-margin">Margin (pt)</Label>
                    <input
                      id="pn-margin"
                      type="number"
                      min="0"
                      max="200"
                      value={margin}
                      onChange={(e) => setMargin(e.target.value)}
                      disabled={status !== "loaded"}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Preview chip */}
                <div className="rounded-md border bg-muted/30 p-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Preview label:
                  </span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: `${fontSize}px`,
                      color,
                    }}
                  >
                    {previewLabel}
                  </span>
                </div>

                {status === "loaded" && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleConvert}
                  >
                    <Hash className="mr-2 h-4 w-4" />
                    Add Page Numbers
                  </Button>
                )}

                {status === "processing" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding page numbers…
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
                      <p className="font-medium">Numbering failed</p>
                      <p className="text-sm opacity-80">{error}</p>
                    </div>
                  </div>
                )}

                {status === "done" && result && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/5 p-4 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">Page numbers added!</p>
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
                        Number Another
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
          <CardTitle className="text-base">Format tokens</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <code className="bg-muted px-1.5 py-0.5 rounded">{"{n}"}</code> —
            current page number (e.g. 3)
          </p>
          <p>
            <code className="bg-muted px-1.5 py-0.5 rounded">{"{total}"}</code>{" "}
            — total page count (e.g. 24)
          </p>
          <p>
            Combine them in any text, e.g.{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded">
              {"Page {n} of {total}"}
            </code>{" "}
            produces &quot;Page 3 of 24&quot;.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
