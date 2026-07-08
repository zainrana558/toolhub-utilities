"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, ArrowRight, Globe, Link, FileText, Search } from "lucide-react";

interface URLParts {
  scheme: string;
  host: string;
  port: string;
  path: string;
  query: { key: string; value: string }[];
  fragment: string;
  fullUrl: string;
}

function parseUrl(urlString: string): URLParts | null {
  try {
    const url = new URL(urlString);
    const query: { key: string; value: string }[] = [];
    url.searchParams.forEach((value, key) => {
      query.push({ key, value });
    });
    return {
      scheme: url.protocol.replace(":", ""),
      host: url.hostname,
      port: url.port,
      path: url.pathname,
      query,
      fragment: url.hash.replace("#", ""),
      fullUrl: url.href,
    };
  } catch {
    return null;
  }
}

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

function BreakdownSection({ parts }: { parts: URLParts }) {
  return (
    <div className="space-y-3 mt-4 rounded-lg border bg-muted/30 p-4">
      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Link className="h-4 w-4" />
        URL Breakdown
      </h4>
      <Separator />
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Scheme */}
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">Scheme</p>
            <p className="font-mono text-sm break-all">{parts.scheme}</p>
          </div>
        </div>

        {/* Host */}
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">Host</p>
            <p className="font-mono text-sm break-all">{parts.host}</p>
          </div>
        </div>

        {/* Port */}
        {parts.port && (
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Port</p>
              <p className="font-mono text-sm">{parts.port}</p>
            </div>
          </div>
        )}

        {/* Path */}
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">Path</p>
            <p className="font-mono text-sm break-all">
              {parts.path || <span className="text-muted-foreground italic">/</span>}
            </p>
          </div>
        </div>

        {/* Fragment */}
        {parts.fragment && (
          <div className="flex items-start gap-3 sm:col-span-2">
            <div className="rounded-md bg-primary/10 p-2">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Fragment</p>
              <p className="font-mono text-sm break-all">#{parts.fragment}</p>
            </div>
          </div>
        )}
      </div>

      {/* Query Params */}
      {parts.query.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Search className="h-3 w-3" />
            Query Parameters ({parts.query.length})
          </p>
          <div className="max-h-48 overflow-y-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    Key
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {parts.query.map((param, index) => (
                  <tr
                    key={index}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-3 py-2 font-mono text-xs break-all">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {param.key}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs break-all">
                      {param.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function URLEncoder() {
  const [encodeInput, setEncodeInput] = useState("");
  const [encodeOutput, setEncodeOutput] = useState("");
  const [decodeInput, setDecodeInput] = useState("");
  const [decodeOutput, setDecodeOutput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedUrl = useMemo(() => parseUrl(decodeOutput || encodeOutput), [
    decodeOutput,
    encodeOutput,
  ]);

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

  const handleEncode = useCallback(() => {
    setError(null);
    try {
      const encoded = encodeURIComponent(encodeInput);
      setEncodeOutput(encoded);
    } catch {
      setError("Failed to encode. Please check your input.");
    }
  }, [encodeInput]);

  const handleDecode = useCallback(() => {
    setError(null);
    try {
      const decoded = decodeURIComponent(decodeInput);
      setDecodeOutput(decoded);
    } catch {
      setError(
        "Failed to decode. The input contains invalid percent-encoded sequences."
      );
    }
  }, [decodeInput]);

  const clearEncode = useCallback(() => {
    setEncodeInput("");
    setEncodeOutput("");
    setError(null);
  }, []);

  const clearDecode = useCallback(() => {
    setDecodeInput("");
    setDecodeOutput("");
    setError(null);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <span className="text-primary">URL</span> Encoder / Decoder
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
              <label className="text-sm font-medium text-muted-foreground">
                Input String
              </label>
              <Input
                placeholder="Enter text or URL component to encode..."
                value={encodeInput}
                onChange={(e) => setEncodeInput(e.target.value)}
                className="font-mono text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEncode();
                }}
              />
            </div>

            <div className="flex items-center justify-center">
              <Button onClick={handleEncode} disabled={!encodeInput}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Encode
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Encoded Output
                </label>
                <CopyButton
                  text={encodeOutput}
                  id="encode"
                  copiedId={copied}
                  onCopy={copyToClipboard}
                />
              </div>
              <Textarea
                placeholder="Encoded output will appear here..."
                value={encodeOutput}
                onChange={(e) => setEncodeOutput(e.target.value)}
                className="min-h-[80px] resize-y font-mono text-sm"
                readOnly
              />
              <p className="text-xs text-muted-foreground text-right">
                {encodeOutput ? `${encodeOutput.length} characters` : ""}
              </p>
            </div>

            {parsedUrl && <BreakdownSection parts={parsedUrl} />}

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearEncode}>
                Clear
              </Button>
            </div>
          </TabsContent>

          {/* Decode Tab */}
          <TabsContent value="decode" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Encoded Input
              </label>
              <Input
                placeholder="Enter percent-encoded string to decode..."
                value={decodeInput}
                onChange={(e) => setDecodeInput(e.target.value)}
                className="font-mono text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDecode();
                }}
              />
            </div>

            <div className="flex items-center justify-center">
              <Button onClick={handleDecode} disabled={!decodeInput}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Decode
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Decoded Output
                </label>
                <CopyButton
                  text={decodeOutput}
                  id="decode"
                  copiedId={copied}
                  onCopy={copyToClipboard}
                />
              </div>
              <Textarea
                placeholder="Decoded output will appear here..."
                value={decodeOutput}
                onChange={(e) => setDecodeOutput(e.target.value)}
                className="min-h-[80px] resize-y font-mono text-sm"
                readOnly
              />
              <p className="text-xs text-muted-foreground text-right">
                {decodeOutput ? `${decodeOutput.length} characters` : ""}
              </p>
            </div>

            {parsedUrl && <BreakdownSection parts={parsedUrl} />}

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