"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { GitCompare, RotateCcw, Diff } from "lucide-react";

type LineType = "added" | "removed" | "unchanged";

interface DiffLine {
  type: LineType;
  content: string;
  lineNumber: {
    original?: number;
    modified?: number;
  };
}

interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

function computeDiff(originalText: string, modifiedText: string): {
  lines: DiffLine[];
  stats: DiffStats;
} {
  const originalLines = originalText.split("\n");
  const modifiedLines = modifiedText.split("\n");

  const maxLen = Math.max(originalLines.length, modifiedLines.length);
  const lines: DiffLine[] = [];
  const stats: DiffStats = { added: 0, removed: 0, unchanged: 0 };

  for (let i = 0; i < maxLen; i++) {
    const origLine = i < originalLines.length ? originalLines[i] : null;
    const modLine = i < modifiedLines.length ? modifiedLines[i] : null;

    if (origLine !== null && modLine !== null) {
      if (origLine === modLine) {
        lines.push({
          type: "unchanged",
          content: modLine,
          lineNumber: { original: i + 1, modified: i + 1 },
        });
        stats.unchanged++;
      } else {
        // Line changed: show removed original and added modified
        lines.push({
          type: "removed",
          content: origLine,
          lineNumber: { original: i + 1 },
        });
        stats.removed++;
        lines.push({
          type: "added",
          content: modLine,
          lineNumber: { modified: i + 1 },
        });
        stats.added++;
      }
    } else if (origLine !== null) {
      lines.push({
        type: "removed",
        content: origLine,
        lineNumber: { original: i + 1 },
      });
      stats.removed++;
    } else if (modLine !== null) {
      lines.push({
        type: "added",
        content: modLine,
        lineNumber: { modified: i + 1 },
      });
      stats.added++;
    }
  }

  return { lines, stats };
}

const LINE_STYLES: Record<LineType, string> = {
  added: "bg-emerald-500/10 border-l-2 border-l-emerald-500",
  removed: "bg-red-500/10 border-l-2 border-l-red-500",
  unchanged: "bg-muted/30 border-l-2 border-l-transparent",
};

const LINE_TEXT_STYLES: Record<LineType, string> = {
  added: "text-emerald-600 dark:text-emerald-400",
  removed: "text-red-600 dark:text-red-400",
  unchanged: "text-muted-foreground",
};

const PREFIX_SYMBOLS: Record<LineType, string> = {
  added: "+",
  removed: "−",
  unchanged: " ",
};

export function TextDiffChecker() {
  const [originalText, setOriginalText] = useState("");
  const [modifiedText, setModifiedText] = useState("");
  const [showDiff, setShowDiff] = useState(false);

  const { diffLines, stats } = useMemo<{ diffLines: DiffLine[]; stats: DiffStats }>(() => {
    if (!showDiff) return { diffLines: [], stats: { added: 0, removed: 0, unchanged: 0 } };
    return { diffLines: computeDiff(originalText, modifiedText).lines, stats: computeDiff(originalText, modifiedText).stats };
  }, [showDiff, originalText, modifiedText]);

  const handleCompare = () => {
    setShowDiff(true);
  };

  const handleClear = () => {
    setOriginalText("");
    setModifiedText("");
    setShowDiff(false);
  };

  const hasContent = originalText.length > 0 || modifiedText.length > 0;

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              Original Text
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste the original text here..."
              value={originalText}
              onChange={(e) => {
                setOriginalText(e.target.value);
                if (showDiff) setShowDiff(false);
              }}
              className="font-mono text-xs min-h-[180px] resize-y"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Modified Text
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Paste the modified text here..."
              value={modifiedText}
              onChange={(e) => {
                setModifiedText(e.target.value);
                if (showDiff) setShowDiff(false);
              }}
              className="font-mono text-xs min-h-[180px] resize-y"
            />
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button onClick={handleCompare} disabled={!hasContent} className="gap-2">
          <GitCompare className="h-4 w-4" />
          Compare Texts
        </Button>
        <Button variant="outline" onClick={handleClear} disabled={!hasContent} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Clear
        </Button>
      </div>

      {/* Diff Results */}
      {showDiff && (
        <div className="space-y-4">
          {/* Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Stats:</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  +{stats.added} added
                </Badge>
                <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                  −{stats.removed} removed
                </Badge>
                <Badge variant="secondary">
                  {stats.unchanged} unchanged
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {diffLines.length} total line{diffLines.length !== 1 ? "s" : ""}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Diff Output */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Diff className="h-4 w-4" />
                Differences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {diffLines.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Both texts are identical
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <div className="font-mono text-xs">
                    {diffLines.map((line, index) => (
                      <div
                        key={index}
                        className={`flex ${LINE_STYLES[line.type]} hover:brightness-110 transition-all`}
                      >
                        {/* Line numbers */}
                        <div className="shrink-0 w-16 sm:w-24 flex select-none border-r border-border/50">
                          <span className="w-1/2 text-right pr-2 py-1 text-muted-foreground/50">
                            {line.lineNumber.original ?? ""}
                          </span>
                          <span className="w-1/2 text-right pr-2 py-1 text-muted-foreground/50">
                            {line.lineNumber.modified ?? ""}
                          </span>
                        </div>
                        {/* Prefix */}
                        <span
                          className={`shrink-0 w-6 text-center py-1 font-bold select-none ${LINE_TEXT_STYLES[line.type]}`}
                        >
                          {PREFIX_SYMBOLS[line.type]}
                        </span>
                        {/* Content */}
                        <pre
                          className={`flex-1 py-1 px-2 whitespace-pre-wrap break-all ${LINE_TEXT_STYLES[line.type]}`}
                        >
                          {line.content || " "}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!showDiff && !hasContent && (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground">
              <GitCompare className="h-10 w-10 opacity-30" />
              <p className="text-sm">
                Paste your original and modified texts above, then click &quot;Compare Texts&quot; to see the differences.
              </p>
              <p className="text-xs opacity-60">
                Line-by-line comparison with added, removed, and unchanged highlighting
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}