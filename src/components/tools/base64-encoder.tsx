"use client";

import { useState, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Upload, Download, ArrowRight } from "lucide-react";

/**
 * Hard ceiling for the encode-file path.
 *
 * `FileReader.readAsDataURL` returns the entire file as a base64 string in
 * memory — a 25 MB binary becomes a ~33 MB string, which then gets stored in
 * React state and re-rendered on every keystroke. Past ~25 MB this pegs the
 * main thread, inflates the heap by 3-4x, and on mid-range phones crashes the
 * tab. 25 MB covers the legitimate use cases (icons, fonts, short audio,
 * medium images) and rejects the "encode my 200 MB video" footgun.
 */
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function CopyButton({
  text,
  id,
  copiedId,
  onCopy,
}: {
  text: string;
  id: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onCopy(text, id)}
      disabled={!text}
      className="shrink-0"
    >
      {copiedId === id ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      <span className="ml-2 hidden sm:inline">
        {copiedId === id ? "Copied" : "Copy"}
      </span>
    </Button>
  );
}

export function Base64Encoder() {
  const [encodeInput, setEncodeInput] = useState("");
  const [encodeOutput, setEncodeOutput] = useState("");
  const [decodeInput, setDecodeInput] = useState("");
  const [decodeOutput, setDecodeOutput] = useState("");
  const [encodeFileName, setEncodeFileName] = useState("");
  const [decodeFileName, setDecodeFileName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const decodeFileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  const handleEncodeText = useCallback(() => {
    setError(null);
    try {
      const encoded = btoa(
        encodeURIComponent(encodeInput).replace(/%([0-9A-F]{2})/g, (_, p1) =>
          String.fromCharCode(parseInt(p1, 16))
        )
      );
      setEncodeOutput(encoded);
    } catch {
      setError("Failed to encode text. Please check your input.");
    }
  }, [encodeInput]);

  const handleDecodeText = useCallback(() => {
    setError(null);
    try {
      const decoded = decodeURIComponent(
        Array.from(atob(decodeInput), (c) =>
          "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
        ).join("")
      );
      setDecodeOutput(decoded);
    } catch {
      setError(
        "Failed to decode text. The input is not valid Base64."
      );
    }
  }, [decodeInput]);

  const handleEncodeFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_FILE_BYTES) {
        setError(
          `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). ` +
            `The browser-based Base64 encoder is capped at 25 MB to avoid crashing the tab — ` +
            `base64 inflates the file ~33% and holds the whole string in memory. ` +
            `For larger files, use a desktop tool or split the file first.`
        );
        return;
      }

      setEncodeFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1] || "";
        setEncodeInput("");
        setEncodeOutput(base64);
      };
      reader.onerror = () => {
        setError("Failed to read file.");
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleDecodeFile = useCallback(() => {
    setError(null);
    if (!decodeInput.trim()) {
      setError("Please enter a Base64 string to decode.");
      return;
    }

    // Cap decoded output at the same 25 MB ceiling as the encode path. `atob`
    // returns a binary string, then we materialize a second Uint8Array of the
    // same length, then a Blob — that's ~3x the decoded size on the heap
    // before the download link is even clicked. A 30 MB base64 paste would
    // allocate ~90 MB and stall low-memory devices.
    const trimmed = decodeInput.trim();
    const payloadLength = trimmed.startsWith("data:")
      ? trimmed.length - trimmed.indexOf(",") - 1
      : trimmed.length;
    // base64 → bytes is ~4/3 ratio; bail if the *encoded* length already
    // implies a decoded payload over the cap.
    const decodedEstimateBytes = (payloadLength * 3) / 4;
    if (decodedEstimateBytes > MAX_FILE_BYTES) {
      setError(
        `Input is too large (~${(decodedEstimateBytes / (1024 * 1024)).toFixed(1)} MB decoded). ` +
          `The browser-based decoder is capped at 25 MB to avoid crashing the tab.`
      );
      return;
    }

    try {
      let base64Data = trimmed;
      let mimeType = "application/octet-stream";
      const fileName = "decoded-file";

      if (base64Data.startsWith("data:")) {
        const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDecodeFileName(fileName);
    } catch {
      setError(
        "Failed to decode file. The input is not valid Base64."
      );
    }
  }, [decodeInput]);

  const clearEncode = useCallback(() => {
    setEncodeInput("");
    setEncodeOutput("");
    setEncodeFileName("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const clearDecode = useCallback(() => {
    setDecodeInput("");
    setDecodeOutput("");
    setDecodeFileName("");
    setError(null);
    if (decodeFileInputRef.current) decodeFileInputRef.current.value = "";
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <span className="text-primary">Base64</span> Encoder / Decoder
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Tabs defaultValue="encode" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="encode">Encode</TabsTrigger>
            <TabsTrigger value="decode">Decode</TabsTrigger>
          </TabsList>

          {/* Encode Tab */}
          <TabsContent value="encode" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Plain Text
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="ml-2">Upload File</span>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleEncodeFile}
                  />
                </div>
              </div>
              {encodeFileName && (
                <p className="text-xs text-muted-foreground">
                  File: {encodeFileName}
                </p>
              )}
              <Textarea
                placeholder="Enter text to encode to Base64..."
                value={encodeInput}
                onChange={(e) => setEncodeInput(e.target.value)}
                className="min-h-[120px] resize-y font-mono text-sm"
                disabled={!!encodeFileName}
              />
            </div>

            <div className="flex items-center justify-center">
              <Button onClick={handleEncodeText} disabled={!encodeInput && !encodeOutput}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Encode to Base64
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Base64 Output
                </label>
                <CopyButton
                  text={encodeOutput}
                  id="encode"
                  copiedId={copied}
                  onCopy={copyToClipboard}
                />
              </div>
              <Textarea
                placeholder="Base64 encoded output will appear here..."
                value={encodeOutput}
                onChange={(e) => setEncodeOutput(e.target.value)}
                className="min-h-[120px] resize-y font-mono text-sm"
                readOnly
              />
              <p className="text-xs text-muted-foreground text-right">
                {encodeOutput ? `${encodeOutput.length} characters` : ""}
              </p>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearEncode}>
                Clear
              </Button>
            </div>
          </TabsContent>

          {/* Decode Tab */}
          <TabsContent value="decode" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Base64 String
                </label>
              </div>
              <Textarea
                placeholder="Enter Base64 string to decode (text or data URI)..."
                value={decodeInput}
                onChange={(e) => setDecodeInput(e.target.value)}
                className="min-h-[120px] resize-y font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground text-right">
                {decodeInput ? `${decodeInput.length} characters` : ""}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button onClick={handleDecodeText} disabled={!decodeInput}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Decode to Text
              </Button>
              <Button
                variant="outline"
                onClick={handleDecodeFile}
                disabled={!decodeInput}
              >
                <Download className="h-4 w-4 mr-2" />
                Decode to File
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Decoded Text
                </label>
                <CopyButton
                  text={decodeOutput}
                  id="decode"
                  copiedId={copied}
                  onCopy={copyToClipboard}
                />
              </div>
              <Textarea
                placeholder="Decoded text will appear here..."
                value={decodeOutput}
                onChange={(e) => setDecodeOutput(e.target.value)}
                className="min-h-[120px] resize-y font-mono text-sm"
                readOnly
              />
              {decodeFileName && (
                <p className="text-xs text-muted-foreground">
                  File downloaded: {decodeFileName}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearDecode}>
                Clear
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}