"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Eye, Code } from "lucide-react";
import { marked } from "marked";

// ── Configure marked ───────────────────────────────────────────────────
marked.setOptions({
  breaks: true,
  gfm: true,
});

// ── Minimal HTML sanitizer ─────────────────────────────────────────────
// marked v4+ no longer sanitizes HTML, so a raw input like
// `<img src=x onerror=alert(1)>` or `<script>...</script>` would be rendered
// as-is via dangerouslySetInnerHTML, allowing stored/reflected XSS.
// We strip <script>/<style>/<iframe>/<object>/<embed>, all on* event handler
// attributes, javascript: URLs, and data: URLs on anchors/images.
const FORBIDDEN_TAGS = new Set([
  "script", "style", "iframe", "object", "embed", "form",
  "input", "button", "textarea", "select", "option",
]);

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html; // SSR — skip
  const doc = new DOMParser().parseFromString(html, "text/html");
  cleanNode(doc.body);
  return doc.body.innerHTML;
}

function cleanNode(node: Node): void {
  // Walk in reverse so mutation during iteration is safe.
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();
      if (FORBIDDEN_TAGS.has(tag)) {
        // Replace forbidden tag with its children (don't render the tag itself
        // but keep any nested text content). For <script>/<style> we drop the
        // children too because their text is active code/CSS.
        if (tag === "script" || tag === "style") {
          el.remove();
        } else {
          const parent = el.parentNode;
          if (parent) {
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            parent.removeChild(el);
          }
        }
        continue;
      }
      // Strip event-handler attributes and dangerous URLs.
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();
        if (name.startsWith("on")) {
          el.removeAttribute(attr.name);
          continue;
        }
        if ((name === "href" || name === "src" || name === "xlink:href") &&
            (value.startsWith("javascript:") || value.startsWith("data:text/html") || value.startsWith("vbscript:"))) {
          el.removeAttribute(attr.name);
        }
      }
      cleanNode(el);
    } else if (child.nodeType === Node.COMMENT_NODE) {
      // Comments can hide IE conditional-comment payloads — drop them.
      child.parentNode?.removeChild(child);
    }
  }
}

// ── Default sample markdown ────────────────────────────────────────────
const DEFAULT_MARKDOWN = `# Markdown Previewer

Welcome to the **Markdown Previewer**! Start typing on the left and see a live preview on the right.

## Features

- Real-time preview as you type
- Full **GitHub Flavored Markdown** support
- One-click copy for HTML output
- Clean, readable typography

## Code

Inline \`code\` looks like this.

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
console.log(greet("World"));
\`\`\`

## Tables

| Feature      | Status |
|-------------|--------|
| Headings    | ✅     |
| Lists       | ✅     |
| Code Blocks | ✅     |
| Tables      | ✅     |

## Blockquotes

> "The best way to predict the future is to invent it."
> — Alan Kay

## Links & Images

Visit [GitHub](https://github.com) for more info.

---

*Start editing to see the magic happen!*
`;

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
export function MarkdownPreviewer() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [view, setView] = useState<"split" | "preview" | "source">("split");

  const { copied, copy } = useCopyFeedback();

  // ── Convert markdown → HTML ─────────────────────────────────────────
  const htmlOutput = useMemo(() => {
    const raw = marked.parse(markdown);
    const str = typeof raw === "string" ? raw : "";
    // Sanitize BEFORE injecting via dangerouslySetInnerHTML — marked v4+
    // does not sanitize, so without this step a malicious input like
    // `<img src=x onerror=alert(1)>` would execute in the user's browser.
    return sanitizeHtml(str);
  }, [markdown]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Code className="h-5 w-5 text-muted-foreground" />
            Markdown Previewer
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* View toggles */}
            <div className="mr-2 hidden items-center rounded-md border bg-muted p-0.5 sm:flex">
              <Button
                variant={view === "split" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setView("split")}
              >
                Split
              </Button>
              <Button
                variant={view === "preview" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setView("preview")}
              >
                <Eye className="mr-1 h-3.5 w-3.5" />
                Preview
              </Button>
              <Button
                variant={view === "source" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setView("source")}
              >
                <Code className="mr-1 h-3.5 w-3.5" />
                HTML
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => copy(htmlOutput)}
            >
              {copied ? (
                <Check className="mr-1.5 h-4 w-4" />
              ) : (
                <Copy className="mr-1.5 h-4 w-4" />
              )}
              Copy HTML
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* ── Editor + Preview ──────────────────────────────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: getGridTemplate(view) }}>
        {/* ── Editor pane ────────────────────────────────────────────── */}
        {view !== "preview" && (
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="border-b px-4 py-2.5">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Markdown
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <Textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="h-full min-h-[500px] resize-none rounded-none border-0 bg-transparent font-mono text-sm shadow-none focus-visible:ring-0 md:min-h-[600px]"
                placeholder="Type your markdown here…"
                spellCheck={false}
              />
            </CardContent>
          </Card>
        )}

        {/* ── Preview pane ───────────────────────────────────────────── */}
        {view !== "source" && (
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="border-b px-4 py-2.5">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <div
                className="prose-custom min-h-[500px] max-w-none p-6 md:min-h-[600px]"
                dangerouslySetInnerHTML={{ __html: htmlOutput }}
              />
            </CardContent>
          </Card>
        )}

        {/* ── HTML source pane ───────────────────────────────────────── */}
        {view === "source" && (
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="border-b px-4 py-2.5">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                HTML Output
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <pre className="h-full min-h-[500px] overflow-auto bg-transparent p-6 font-mono text-xs leading-relaxed text-muted-foreground md:min-h-[600px]">
                <code>{htmlOutput}</code>
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────
function getGridTemplate(view: "split" | "preview" | "source"): string {
  switch (view) {
    case "split":
      return "repeat(auto-fit, minmax(min(100%, 360px), 1fr))";
    case "preview":
      return "1fr";
    case "source":
      return "1fr";
  }
}