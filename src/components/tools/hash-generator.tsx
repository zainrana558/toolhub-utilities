"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Hash, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-512";

interface HashResult {
  algorithm: HashAlgorithm;
  hash: string;
  color: string;
}

const ALGORITHMS: { algorithm: HashAlgorithm; color: string; label: string }[] = [
  { algorithm: "SHA-1", color: "text-amber-500", label: "SHA-1 (160-bit)" },
  { algorithm: "SHA-256", color: "text-emerald-500", label: "SHA-256 (256-bit)" },
  { algorithm: "SHA-512", color: "text-violet-500", label: "SHA-512 (512-bit)" },
];

async function computeHash(text: string, algorithm: HashAlgorithm): Promise<string> {
  if (!text) return "";
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function HashGenerator() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<HashResult[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);

  const computeAllHashes = useCallback(async (text: string) => {
    if (!text) {
      setResults([]);
      return;
    }

    const hashPromises = ALGORITHMS.map(async ({ algorithm, color }) => {
      const hash = await computeHash(text, algorithm);
      return { algorithm, hash, color } as HashResult;
    });

    const hashResults = await Promise.all(hashPromises);
    setResults(hashResults);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      computeAllHashes(input);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [input, computeAllHashes]);

  const handleCopy = async (hash: string, index: number) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedIndex(index);
      toast.success("Hash copied to clipboard");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleClear = () => {
    setInput("");
    setResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hash className="h-5 w-5 text-primary" />
            Input Text
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hash-input">Enter text to hash</Label>
            <div className="flex gap-2">
              <Input
                id="hash-input"
                placeholder="Type or paste your text here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleClear}
                title="Clear input"
                className="shrink-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Hashes are computed in real-time as you type (debounced 300ms)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Generated Hashes
          </h3>
          {results.map((result, index) => (
            <Card key={result.algorithm}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="shrink-0 w-36">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${result.color}`}>
                      {ALGORITHMS[index].label}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <code className="block text-xs break-all font-mono leading-relaxed text-foreground/90 bg-muted/50 rounded-md px-3 py-2">
                      {result.hash}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(result.hash, index)}
                    className="shrink-0 h-8 w-8"
                    title="Copy hash"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && input.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground">
              <Hash className="h-10 w-10 opacity-30" />
              <p className="text-sm">
                Enter some text above to generate cryptographic hashes using the Web Crypto API.
              </p>
              <p className="text-xs opacity-60">
                Supports SHA-1, SHA-256, and SHA-512 algorithms
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}