"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

type Base = 2 | 8 | 10 | 16;

interface BaseOption {
  base: Base;
  label: string;
  prefix: string;
  description: string;
  color: string;
  placeholder: string;
  regex: RegExp;
}

const BASES: BaseOption[] = [
  {
    base: 2,
    label: "Binary",
    prefix: "0b",
    description: "Base 2",
    color: "text-sky-500",
    placeholder: "e.g. 10101010",
    regex: /^[01]+$/,
  },
  {
    base: 8,
    label: "Octal",
    prefix: "0o",
    description: "Base 8",
    color: "text-amber-500",
    placeholder: "e.g. 377",
    regex: /^[0-7]+$/,
  },
  {
    base: 10,
    label: "Decimal",
    prefix: "",
    description: "Base 10",
    color: "text-emerald-500",
    placeholder: "e.g. 255",
    regex: /^[0-9]+$/,
  },
  {
    base: 16,
    label: "Hexadecimal",
    prefix: "0x",
    description: "Base 16",
    color: "text-violet-500",
    placeholder: "e.g. FF",
    regex: /^[0-9a-fA-F]+$/,
  },
];

function getBaseOption(base: Base): BaseOption {
  return BASES.find((b) => b.base === base)!;
}

function convertValue(input: string, fromBase: Base): Record<Base, string> {
  const result: Record<Base, string> = { 2: "", 8: "", 10: "", 16: "" };

  if (!input.trim()) return result;

  const cleaned = input.trim();
  const fromOption = getBaseOption(fromBase);

  // Validate input
  if (!fromOption.regex.test(cleaned)) {
    return result;
  }

  try {
    let value: bigint;

    if (fromBase === 16) {
      value = BigInt("0x" + cleaned);
    } else if (fromBase === 10) {
      value = BigInt(cleaned);
    } else if (fromBase === 8) {
      // Parse octal via hex conversion
      value = BigInt("0o" + cleaned);
    } else if (fromBase === 2) {
      // Parse binary
      value = BigInt("0b" + cleaned);
    } else {
      return result;
    }

    result[2] = value.toString(2);
    result[8] = value.toString(8);
    result[10] = value.toString(10);
    result[16] = value.toString(16).toUpperCase();
  } catch {
    return result;
  }

  return result;
}

export function NumberBaseConverter() {
  const [inputValue, setInputValue] = useState("");
  const [selectedBase, setSelectedBase] = useState<Base>(10);
  const [copiedBase, setCopiedBase] = useState<Base | null>(null);

  const conversions = useMemo(() => {
    return convertValue(inputValue, selectedBase);
  }, [inputValue, selectedBase]);

  const isValid = useMemo(() => {
    if (!inputValue.trim()) return true; // Empty is valid (no error)
    const option = getBaseOption(selectedBase);
    return option.regex.test(inputValue.trim());
  }, [inputValue, selectedBase]);

  const handleInputChange = (value: string) => {
    const option = getBaseOption(selectedBase);
    // Allow empty input or valid characters
    if (!value || option.regex.test(value)) {
      setInputValue(value);
    }
  };

  const handleCopy = async (value: string, base: Base) => {
    if (!value) return;
    try {
      const option = getBaseOption(base);
      await navigator.clipboard.writeText(value);
      setCopiedBase(base);
      toast.success(`${option.label} value copied to clipboard`);
      setTimeout(() => setCopiedBase(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleSwapToBase = (targetBase: Base) => {
    const value = conversions[targetBase];
    if (value) {
      setSelectedBase(targetBase);
      setInputValue(value);
    }
  };

  const handleClear = () => {
    setInputValue("");
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Number Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="number-input">Enter a number</Label>
            <Input
              id="number-input"
              placeholder={getBaseOption(selectedBase).placeholder}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className={`font-mono text-sm ${!isValid ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {!isValid && (
              <p className="text-xs text-destructive">
                Invalid character for {getBaseOption(selectedBase).label} (Base {selectedBase})
              </p>
            )}
          </div>

          {/* Base Selector */}
          <div className="space-y-2">
            <Label>Input Base</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BASES.map((option) => (
                <Button
                  key={option.base}
                  variant={selectedBase === option.base ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedBase(option.base);
                    setInputValue("");
                  }}
                  className="text-xs"
                >
                  <span className="flex flex-col items-center">
                    <span className="font-semibold">{option.label}</span>
                    <span className="text-[10px] opacity-70">{option.description}</span>
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="text-xs"
          >
            Clear
          </Button>
        </CardContent>
      </Card>

      {/* Conversion Results */}
      {inputValue.trim() && isValid && conversions[10] !== "" && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Conversions
          </h3>
          {BASES.map((option) => {
            const value = conversions[option.base];
            const isSource = option.base === selectedBase;

            return (
              <Card key={option.base} className={isSource ? "ring-1 ring-primary/20" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="shrink-0 w-28">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${option.color}`}>
                          {option.label}
                        </span>
                        {isSource && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                            Source
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{option.description}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <code className="block text-xs break-all font-mono leading-relaxed text-foreground/90 bg-muted/50 rounded-md px-3 py-2">
                        {option.prefix}
                        {value}
                      </code>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!isSource && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSwapToBase(option.base)}
                          className="h-8 w-8"
                          title={`Use as ${option.label} input`}
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(option.prefix + value, option.base)}
                        className="h-8 w-8"
                        title="Copy value"
                        disabled={!value}
                      >
                        {copiedBase === option.base ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!inputValue.trim() && (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground">
              <ArrowLeftRight className="h-10 w-10 opacity-30" />
              <p className="text-sm">
                Enter a number in any base to see conversions across Binary, Octal, Decimal, and Hexadecimal.
              </p>
              <p className="text-xs opacity-60">
                Supports large numbers using BigInt for arbitrary precision
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}