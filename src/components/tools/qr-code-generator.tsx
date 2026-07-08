"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Download, Copy, Check, QrCode } from "lucide-react";

const MIN_SIZE = 128;
const MAX_SIZE = 512;
const DEFAULT_SIZE = 256;
const DEFAULT_FG = "#000000";
const DEFAULT_BG = "#ffffff";
const DEBOUNCE_MS = 300;

export function QRCodeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [text, setText] = useState("https://example.com");
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [fgColor, setFgColor] = useState(DEFAULT_FG);
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQR = useCallback(async (value: string, width: number, dark: string, light: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!value.trim()) {
      setError(null);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = width;
        canvas.height = width;
        ctx.clearRect(0, 0, width, width);
      }
      return;
    }

    try {
      setError(null);
      await QRCode.toCanvas(canvas, value, {
        width,
        margin: 2,
        color: {
          dark,
          light,
        },
      });
    } catch {
      setError("Failed to generate QR code. Text may be too long.");
    }
  }, []);

  // Debounced QR generation whenever text, size, or colors change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      generateQR(text, size, fgColor, bgColor);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [text, size, fgColor, bgColor, generateQR]);

  // Generate immediately on first mount
  useEffect(() => {
    generateQR(text, size, fgColor, bgColor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;

    const link = document.createElement("a");
    link.download = `qr-code-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
      if (!blob) return;

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy as data URL text
      try {
        await navigator.clipboard.writeText(canvas.toDataURL("image/png"));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // silently fail
      }
    }
  };

  const hasContent = text.trim().length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div
              className="relative flex items-center justify-center rounded-xl border bg-muted/30 p-4"
              style={{ minWidth: MIN_SIZE + 32, minHeight: MIN_SIZE + 32 }}
            >
              <canvas
                ref={canvasRef}
                className="rounded-md"
                style={{
                  width: Math.min(size, MAX_SIZE),
                  height: Math.min(size, MAX_SIZE),
                  imageRendering: "pixelated",
                }}
              />
              {!hasContent && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Enter text or URL below
                  </p>
                </div>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex w-full max-w-xs gap-2">
              <Button
                onClick={handleDownload}
                disabled={!hasContent}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </Button>
              <Button
                onClick={handleCopyToClipboard}
                disabled={!hasContent}
                variant="outline"
                className="flex-1"
              >
                {copied ? (
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Text / URL input */}
          <div className="space-y-2">
            <Label htmlFor="qr-text">Text or URL</Label>
            <Input
              id="qr-text"
              type="text"
              placeholder="Enter text or URL to encode..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* Size slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Size: {size}px</Label>
            </div>
            <Slider
              value={[size]}
              onValueChange={([v]) => setSize(v)}
              min={MIN_SIZE}
              max={MAX_SIZE}
              step={16}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{MIN_SIZE}px</span>
              <span>{MAX_SIZE}px</span>
            </div>
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qr-fg">Foreground Color</Label>
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                <input
                  id="qr-fg"
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer appearance-none rounded-md border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border [&::-webkit-color-swatch]:border-border"
                />
                <span className="text-sm font-mono text-muted-foreground">
                  {fgColor}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr-bg">Background Color</Label>
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                <input
                  id="qr-bg"
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer appearance-none rounded-md border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border [&::-webkit-color-swatch]:border-border"
                />
                <span className="text-sm font-mono text-muted-foreground">
                  {bgColor}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}