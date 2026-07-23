"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Copy, Trash2, Type, Hash, AlignLeft, Pilcrow, Space, ShieldCheck } from "lucide-react";

function computeStats(text: string) {
  const totalChars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.trim()
    ? text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
    : 0;
  const paragraphs = text.trim()
    ? text.split(/\n\n+/).filter((p) => p.trim().length > 0).length
    : 0;

  // Character frequency (case-insensitive, ignore whitespace)
  const freq: Record<string, number> = {};
  for (const ch of text) {
    if (/\s/.test(ch)) continue;
    const key = ch.toLowerCase();
    freq[key] = (freq[key] || 0) + 1;
  }
  const totalVisible = charsNoSpaces || 1;
  const charFrequency = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([char, count]) => ({
      char,
      count,
      percent: ((count / totalVisible) * 100).toFixed(1),
    }));

  // Density breakdown
  let letters = 0;
  let numbers = 0;
  let spaces = 0;
  let special = 0;

  for (const ch of text) {
    if (/[a-zA-Z]/.test(ch)) letters++;
    else if (/[0-9]/.test(ch)) numbers++;
    else if (/\s/.test(ch)) spaces++;
    else special++;
  }

  const safeTotal = totalChars || 1;

  return {
    totalChars,
    charsNoSpaces,
    words,
    sentences,
    paragraphs,
    charFrequency,
    density: {
      letters,
      lettersPercent: ((letters / safeTotal) * 100).toFixed(1),
      numbers,
      numbersPercent: ((numbers / safeTotal) * 100).toFixed(1),
      spaces,
      spacesPercent: ((spaces / safeTotal) * 100).toFixed(1),
      special,
      specialPercent: ((special / safeTotal) * 100).toFixed(1),
    },
  };
}

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 },
  },
};

export function CharacterCounter() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => computeStats(text), [text]);

  const handleCopy = useCallback(async () => {
    if (!text.trim()) return;
    const lines = [
      "Character Counter — Analysis Results",
      "=====================================",
      `Total Characters:        ${stats.totalChars}`,
      `Characters (no spaces):  ${stats.charsNoSpaces}`,
      `Words:                   ${stats.words}`,
      `Sentences:               ${stats.sentences}`,
      `Paragraphs:              ${stats.paragraphs}`,
      "",
      "Character Density:",
      `  Letters:          ${stats.density.letters} (${stats.density.lettersPercent}%)`,
      `  Numbers:          ${stats.density.numbers} (${stats.density.numbersPercent}%)`,
      `  Spaces:           ${stats.density.spaces} (${stats.density.spacesPercent}%)`,
      `  Special Chars:    ${stats.density.special} (${stats.density.specialPercent}%)`,
      "",
      "Top 10 Characters:",
      ...stats.charFrequency.map(
        (c) => `  "${c.char}" — ${c.count} (${c.percent}%)`
      ),
    ];
    // Await the clipboard write and surface failures — previously the call
    // was fire-and-forget, so "Copied!" flashed even when the write rejected
    // (e.g. clipboard denied, non-secure context).
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts / older browsers.
      try {
        const ta = document.createElement("textarea");
        ta.value = lines.join("\n");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Last resort — give up silently; the button simply doesn't toggle.
      }
    }
  }, [text, stats]);

  const handleClear = useCallback(() => {
    setText("");
    setCopied(false);
  }, []);

  const hasText = text.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Input area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="size-5 text-primary" />
            Enter or Paste Your Text
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here to analyze character-level statistics..."
            className="min-h-[200px] text-base resize-y font-mono"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!hasText}
            >
              <Copy className="size-4" />
              {copied ? "Copied!" : "Copy Stats"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={!hasText}
            >
              <Trash2 className="size-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats grid */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary tabular-nums">
                {stats.totalChars}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Type className="size-3" />
                Total Characters
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary tabular-nums">
                {stats.charsNoSpaces}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Space className="size-3" />
                Characters (no spaces)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary tabular-nums">
                {stats.words}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <AlignLeft className="size-3" />
                Words
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary tabular-nums">
                {stats.sentences}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <ShieldCheck className="size-3" />
                Sentences
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary tabular-nums">
                {stats.paragraphs}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Pilcrow className="size-3" />
                Paragraphs
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary tabular-nums">
                {stats.charFrequency.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Hash className="size-3" />
                Unique Characters
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Character density breakdown */}
      {hasText && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Character Density Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <DensityBar
                  label="Letters"
                  count={stats.density.letters}
                  percent={stats.density.lettersPercent}
                  color="bg-blue-500"
                  textColor="text-blue-600 dark:text-blue-400"
                />
                <DensityBar
                  label="Numbers"
                  count={stats.density.numbers}
                  percent={stats.density.numbersPercent}
                  color="bg-green-500"
                  textColor="text-green-600 dark:text-green-400"
                />
                <DensityBar
                  label="Spaces"
                  count={stats.density.spaces}
                  percent={stats.density.spacesPercent}
                  color="bg-gray-400 dark:bg-gray-500"
                  textColor="text-gray-600 dark:text-gray-400"
                />
                <DensityBar
                  label="Special Characters"
                  count={stats.density.special}
                  percent={stats.density.specialPercent}
                  color="bg-orange-500"
                  textColor="text-orange-600 dark:text-orange-400"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Character frequency analysis */}
      {hasText && stats.charFrequency.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Most Used Characters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.charFrequency.map((item, i) => (
                  <motion.div
                    key={item.char}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.28 + i * 0.04 }}
                  >
                    <span className="text-xs text-muted-foreground w-4 text-right tabular-nums">
                      {i + 1}
                    </span>
                    <span className="w-8 text-center font-mono font-bold text-sm bg-muted rounded-md py-0.5">
                      {item.char === " " ? "␣" : item.char}
                    </span>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                      <motion.div
                        className={`h-full rounded-full ${
                          i === 0
                            ? "bg-primary"
                            : i < 3
                              ? "bg-primary/70"
                              : "bg-primary/40"
                        }`}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.max(Number(item.percent), 1)}%`,
                        }}
                        transition={{
                          duration: 0.5,
                          delay: 0.3 + i * 0.04,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right tabular-nums">
                      {item.count} ({item.percent}%)
                    </span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function DensityBar({
  label,
  count,
  percent,
  color,
  textColor,
}: {
  label: string;
  count: number;
  percent: string;
  color: string;
  textColor: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-sm font-medium w-36 shrink-0 ${textColor}`}>
        {label}
      </span>
      <div className="flex-1 h-7 bg-muted rounded-full overflow-hidden relative">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(Number(percent), 0.5)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-28 text-right tabular-nums shrink-0">
        {count} ({percent}%)
      </span>
    </div>
  );
}