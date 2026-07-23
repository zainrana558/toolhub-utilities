"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, FileText, AlignLeft, Type } from "lucide-react";

// ── Lorem Ipsum word pool ──────────────────────────────────────────────
const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum", "perspiciatis", "unde",
  "omnis", "iste", "natus", "error", "voluptatem", "accusantium", "doloremque",
  "laudantium", "totam", "rem", "aperiam", "eaque", "ipsa", "quae", "ab", "illo",
  "inventore", "veritatis", "quasi", "architecto", "beatae", "vitae", "dicta",
  "explicabo", "nemo", "ipsam", "quia", "voluptas", "aspernatur", "aut", "odit",
  "fugit", "consequuntur", "magni", "dolores", "eos", "ratione", "sequi",
  "nesciunt", "neque", "porro", "quisquam", "nihil", "impedit", "quo", "minus",
  "placeat", "facere", "possimus", "assumenda", "repellendus", "temporibus",
  "quibusdam", "illum", "fuga", "distinctio", "nam", "libero", "tempore",
  "cum", "soluta", "nobis", "eligendi", "optio", "cumque", "recusandae",
  "blanditiis", "praesentium", "voluptatum", "deleniti", "atque", "corrupti",
  "quos", "quas", "molestias", "excepturi", "occaecati", "cupiditate", "provident",
  "similique", "mollitia", "animi", "harum", "rerum", "necesssitatibus",
];

// ── Classic opening sentences for paragraph mode ───────────────────────
const OPENING_SENTENCE =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

// ── Helpers ────────────────────────────────────────────────────────────
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pickWords(count: number): string[] {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(LOREM_WORDS[randomInt(0, LOREM_WORDS.length - 1)]);
  }
  return words;
}

function buildSentence(minWords = 6, maxWords = 15): string {
  const count = randomInt(minWords, maxWords);
  const words = pickWords(count);
  return capitalize(words.join(" ")) + ".";
}

function buildParagraph(sentenceCount: number, startWithLorem = false): string {
  const sentences: string[] = [];

  if (startWithLorem) {
    sentences.push(OPENING_SENTENCE);
  } else {
    sentences.push(buildSentence());
  }

  const remaining = startWithLorem ? sentenceCount - 1 : sentenceCount;
  for (let i = 0; i < remaining; i++) {
    sentences.push(buildSentence());
  }

  return sentences.join(" ");
}

// ── Copy feedback hook ─────────────────────────────────────────────────
function useCopyFeedback(resetMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), resetMs);
    },
    [resetMs],
  );

  return { copied, copy };
}

// ── Component ──────────────────────────────────────────────────────────
export function LoremIpsumGenerator() {
  const [paragraphCount, setParagraphCount] = useState(3);
  const [sentenceCount, setSentenceCount] = useState(5);
  const [wordCount, setWordCount] = useState(50);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [type, setType] = useState<"paragraphs" | "sentences" | "words">("paragraphs");

  const { copied, copy } = useCopyFeedback();

  // ── Generate output in real-time ─────────────────────────────────────
  const generated = useMemo(() => {
    if (type === "paragraphs") {
      const paragraphs: string[] = [];
      const count = Math.max(1, Math.min(20, paragraphCount));
      for (let i = 0; i < count; i++) {
        paragraphs.push(buildParagraph(sentenceCount, startWithLorem && i === 0));
      }
      return { text: paragraphs.join("\n\n"), segments: paragraphs };
    }

    if (type === "sentences") {
      const sentences: string[] = [];
      const count = Math.max(1, Math.min(100, wordCount));
      for (let i = 0; i < count; i++) {
        sentences.push(
          i === 0 && startWithLorem ? OPENING_SENTENCE : buildSentence(),
        );
      }
      return { text: sentences.join(" "), segments: sentences };
    }

    // words
    const count = Math.max(1, Math.min(500, wordCount));
    const words = pickWords(count);
    if (startWithLorem) {
      words[0] = "lorem";
      if (words.length > 1) words[1] = "ipsum";
    }
    words[0] = capitalize(words[0]);
    return { text: words.join(" "), segments: [words.join(" ")] };
  }, [type, paragraphCount, sentenceCount, wordCount, startWithLorem]);

  const wordLength = generated.text.split(/\s+/).filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* ── Options card ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={type}
            onValueChange={(v) => setType(v as typeof type)}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="paragraphs" className="gap-1.5">
                <AlignLeft className="h-4 w-4" />
                Paragraphs
              </TabsTrigger>
              <TabsTrigger value="sentences" className="gap-1.5">
                <Type className="h-4 w-4" />
                Sentences
              </TabsTrigger>
              <TabsTrigger value="words" className="gap-1.5">
                <Type className="h-4 w-4" />
                Words
              </TabsTrigger>
            </TabsList>

            {/* ── Paragraphs options ─────────────────────────────────── */}
            <TabsContent value="paragraphs" className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="para-count">
                    Paragraphs{" "}
                    <span className="text-muted-foreground">
                      (1–20)
                    </span>
                  </Label>
                  <Input
                    id="para-count"
                    type="number"
                    min={1}
                    max={20}
                    value={paragraphCount}
                    onChange={(e) =>
                      setParagraphCount(
                        Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                      )
                    }
                    className="w-28"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sent-count">
                    Sentences / paragraph
                  </Label>
                  <Input
                    id="sent-count"
                    type="number"
                    min={1}
                    max={20}
                    value={sentenceCount}
                    onChange={(e) =>
                      setSentenceCount(
                        Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                      )
                    }
                    className="w-36"
                  />
                </div>
                <div className="flex items-center gap-2 pb-0.5">
                  <Checkbox
                    id="lorem-start-p"
                    checked={startWithLorem}
                    onCheckedChange={(v) => setStartWithLorem(!!v)}
                  />
                  <Label htmlFor="lorem-start-p" className="cursor-pointer">
                    Start with &quot;Lorem ipsum…&quot;
                  </Label>
                </div>
              </div>
            </TabsContent>

            {/* ── Sentences options ──────────────────────────────────── */}
            <TabsContent value="sentences" className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sent-count-s">
                    Number of sentences
                  </Label>
                  <Input
                    id="sent-count-s"
                    type="number"
                    min={1}
                    max={100}
                    value={wordCount}
                    onChange={(e) =>
                      setWordCount(
                        Math.max(1, Math.min(100, Number(e.target.value) || 1)),
                      )
                    }
                    className="w-36"
                  />
                </div>
                <div className="flex items-center gap-2 pb-0.5">
                  <Checkbox
                    id="lorem-start-s"
                    checked={startWithLorem}
                    onCheckedChange={(v) => setStartWithLorem(!!v)}
                  />
                  <Label htmlFor="lorem-start-s" className="cursor-pointer">
                    Start with &quot;Lorem ipsum…&quot;
                  </Label>
                </div>
              </div>
            </TabsContent>

            {/* ── Words options ──────────────────────────────────────── */}
            <TabsContent value="words" className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="word-count">
                    Number of words
                  </Label>
                  <Input
                    id="word-count"
                    type="number"
                    min={1}
                    max={500}
                    value={wordCount}
                    onChange={(e) =>
                      setWordCount(
                        Math.max(1, Math.min(500, Number(e.target.value) || 1)),
                      )
                    }
                    className="w-36"
                  />
                </div>
                <div className="flex items-center gap-2 pb-0.5">
                  <Checkbox
                    id="lorem-start-w"
                    checked={startWithLorem}
                    onCheckedChange={(v) => setStartWithLorem(!!v)}
                  />
                  <Label htmlFor="lorem-start-w" className="cursor-pointer">
                    Start with &quot;Lorem ipsum…&quot;
                  </Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ── Output card ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Generated Text
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              ({wordLength} words)
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Always show "Copy All" — previously this was gated on
                segments.length > 1, which meant the "words" mode (exactly
                1 segment) had NO copy button at all and the user couldn't
                copy the generated text. */}
            {generated.segments.length >= 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(generated.text)}
              >
                {copied ? (
                  <Check className="mr-1.5 h-4 w-4" />
                ) : (
                  <Copy className="mr-1.5 h-4 w-4" />
                )}
                Copy All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
            {generated.segments.map((segment, idx) => (
              <div
                key={idx}
                className="group relative rounded-md border bg-muted/40 p-4 text-sm leading-relaxed text-foreground transition-colors hover:bg-muted/70"
              >
                <p className="whitespace-pre-wrap">{segment}</p>
                {generated.segments.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-7 gap-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => copy(segment)}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span className="text-xs">Copy</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}