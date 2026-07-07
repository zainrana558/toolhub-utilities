"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";

type CaseType = "upper" | "lower" | "title" | "sentence" | "camel" | "pascal" | "snake" | "kebab" | "dot" | "constant";

const caseTypes: { id: CaseType; label: string; example: string }[] = [
  { id: "upper", label: "UPPERCASE", example: "HELLO WORLD" },
  { id: "lower", label: "lowercase", example: "hello world" },
  { id: "title", label: "Title Case", example: "Hello World" },
  { id: "sentence", label: "Sentence case", example: "Hello world" },
  { id: "camel", label: "camelCase", example: "helloWorld" },
  { id: "pascal", label: "PascalCase", example: "HelloWorld" },
  { id: "snake", label: "snake_case", example: "hello_world" },
  { id: "kebab", label: "kebab-case", example: "hello-world" },
  { id: "constant", label: "CONSTANT_CASE", example: "HELLO_WORLD" },
  { id: "dot", label: "dot.case", example: "hello.world" },
];

function toWords(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_\-.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
}

function convertCase(text: string, type: CaseType): string {
  if (!text) return "";
  const words = toWords(text);
  if (words.length === 0) return "";

  switch (type) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    case "sentence":
      return words.map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()).join(" ");
    case "camel":
      return words.map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
    case "pascal":
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("");
    case "snake":
      return words.map((w) => w.toLowerCase()).join("_");
    case "kebab":
      return words.map((w) => w.toLowerCase()).join("-");
    case "constant":
      return words.map((w) => w.toUpperCase()).join("_");
    case "dot":
      return words.map((w) => w.toLowerCase()).join(".");
    default:
      return text;
  }
}

export function CaseConverter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [activeCase, setActiveCase] = useState<CaseType | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = (type: CaseType) => {
    setActiveCase(type);
    setOutput(convertCase(input, type));
  };

  const copyOutput = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stats = {
    chars: input.length,
    words: input.trim() ? input.trim().split(/\s+/).length : 0,
    lines: input ? input.split("\n").length : 0,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste your text here..."
            className="min-h-[150px] resize-y"
          />
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{stats.chars} characters</span>
            <span>{stats.words} words</span>
            <span>{stats.lines} lines</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Conversion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {caseTypes.map((ct) => (
              <Button
                key={ct.id}
                variant={activeCase === ct.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleConvert(ct.id)}
                className="text-xs"
              >
                {ct.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {output && (
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {activeCase && caseTypes.find((c) => c.id === activeCase)?.label} Result
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={copyOutput}>
              {copied ? <Check className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg font-mono text-sm break-all whitespace-pre-wrap">
              {output}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Case Conversion Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {caseTypes.map((ct) => (
              <div key={ct.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                <Badge variant="outline" className="text-xs font-mono">{ct.label}</Badge>
                <span className="text-muted-foreground font-mono text-xs">{ct.example}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}