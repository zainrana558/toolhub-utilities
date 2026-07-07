"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function WordCounter() {
  const [text, setText] = useState("");

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length : 0;
  const paragraphs = text.trim() ? text.split(/\n\n+/).filter((p) => p.trim().length > 0).length : 0;
  const readingTime = Math.max(1, Math.ceil(words / 200));
  const speakingTime = Math.max(1, Math.ceil(words / 130));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enter or Paste Your Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here to count words, characters, sentences, and more..."
            className="min-h-[200px] text-base resize-y"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Words" value={words.toString()} />
        <StatCard label="Characters" value={chars.toString()} />
        <StatCard label="Characters (no spaces)" value={charsNoSpaces.toString()} />
        <StatCard label="Sentences" value={sentences.toString()} />
        <StatCard label="Paragraphs" value={paragraphs.toString()} />
        <StatCard label="Reading Time" value={`${readingTime} min`} />
        <StatCard label="Speaking Time" value={`${speakingTime} min`} />
        <StatCard
          label="Top Keyword"
          value={getTopKeyword(text)}
        />
      </div>

      {text.trim() && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">Keyword Density</h3>
            <div className="flex flex-wrap gap-2">
              {getKeywordDensity(text).map((kw) => (
                <Badge key={kw.word} variant="secondary" className="text-xs">
                  {kw.word}: {kw.count} ({kw.percent}%)
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-2xl md:text-3xl font-bold text-primary">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function getTopKeyword(text: string): string {
  if (!text.trim()) return "-";
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return "-";
  const freq: Record<string, number> = {};
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

function getKeywordDensity(text: string): { word: string; count: number; percent: string }[] {
  if (!text.trim()) return [];
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return [];
  const freq: Record<string, number> = {};
  words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({
      word,
      count,
      percent: ((count / words.length) * 100).toFixed(1),
    }));
}