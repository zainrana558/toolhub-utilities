/**
 * SEO helpers for tool pages.
 *
 * These functions take the existing `ToolDef` data and produce the
 * SEO-optimized strings required by the on-page checklist:
 *   - Title tag:   "<primary keyword> — Free Online, No Sign-Up"
 *                  (Next.js layout.tsx appends " | ToolVerse" via template)
 *   - Meta desc:   existing description + privacy angle (when missing)
 *   - H1:          "Free <primary keyword phrase> Online"
 *   - Intro:       primary keyword + long-tail variations + privacy sentence
 *   - FAQ:         3 universal questions + existing FAQs
 *
 * Centralising the logic here keeps `tools-data.ts` clean and lets us
 * tweak the SEO template in one place.
 */
import type { ToolDef } from "./tools-data";

const PRIVACY_SUFFIX =
  " No signup, no data upload — all processing happens in your browser. Fast, private, and secure.";

/**
 * Build the <title> tag content (without brand — Next.js layout.tsx
 * has `template: "%s | ToolVerse"` which appends brand automatically).
 *
 * Pattern: existing metaTitle verbatim — it's already keyword-rich.
 */
export function getMetaTitle(tool: ToolDef): string {
  return tool.metaTitle || tool.name;
}

/**
 * Build the meta description. If the existing description already
 * mentions a STRONG privacy signal ("browser" / "device" / "server"),
 * leave it alone. Otherwise append the standard privacy suffix so
 * every tool page reinforces the same privacy angle.
 *
 * Weak signals like "no sign-up" alone are not enough — Google
 * rewards descriptions that mention in-browser processing explicitly.
 */
export function getMetaDescription(tool: ToolDef): string {
  const existing = tool.metaDescription || tool.longDescription || tool.description;
  const lower = existing.toLowerCase();
  const hasStrongPrivacySignal =
    lower.includes("browser") ||
    lower.includes("device") ||
    lower.includes("never uploaded") ||
    lower.includes("never sent") ||
    lower.includes("runs locally") ||
    lower.includes("server");
  if (hasStrongPrivacySignal) {
    return existing;
  }
  return `${existing}${PRIVACY_SUFFIX}`;
}

/**
 * H1 tag — the primary keyword front-and-centre.
 *
 * Derives from the first segment of `metaTitle` (before em-dash / pipe),
 * which is already keyword-optimised. Ensures "Free" prefix and "Online"
 * suffix so it matches the example H1 pattern:
 *   "Free PDF to Word Converter Online"
 */
export function getH1(tool: ToolDef): string {
  const firstSegment = (tool.metaTitle || tool.name)
    .split(/[–—|]/)[0]
    .trim();
  let h1 = firstSegment;
  if (!h1.toLowerCase().startsWith("free ")) {
    h1 = `Free ${h1}`;
  }
  if (!h1.toLowerCase().endsWith("online")) {
    h1 = `${h1} Online`;
  }
  return h1;
}

/**
 * First paragraph under the H1. Must contain the primary keyword and
 * long-tail variations naturally, plus the privacy angle.
 *
 * We craft this from `primaryKeyword`, `keywords`, and `longDescription`
 * so each tool gets a unique, keyword-rich intro without us having to
 * hand-write 32 paragraphs.
 */
export function getIntroParagraph(tool: ToolDef): string {
  const primary = tool.primaryKeyword;
  const longTail = (tool.keywords || [])
    .filter((k) => k.toLowerCase() !== primary.toLowerCase())
    .slice(0, 2)
    .map((k) => k.toLowerCase());

  // Build the long-tail phrase: "word counter, character counter, and reading time calculator"
  let longTailPhrase = "";
  if (longTail.length === 1) {
    longTailPhrase = ` and ${longTail[0]}`;
  } else if (longTail.length >= 2) {
    longTailPhrase = `, ${longTail[0]}, and ${longTail[1]}`;
  }

  const longDesc = (tool.longDescription || tool.description || "").trim();
  // Use the first 1–2 sentences of longDescription for richness, then
  // tie back to the privacy angle.
  const firstSentences = longDesc.split(/(?<=\.)\s+/).slice(0, 2).join(" ");

  return `Use this free online ${primary}${longTailPhrase} directly in your browser — no installation, no sign-up, no file upload. ${firstSentences} Every calculation runs locally on your device, so your data never leaves your browser.`;
}

/**
 * Universal FAQ entries that should appear on EVERY tool page.
 * These target the "People Also Ask" questions Google loves to surface.
 *
 * We always prepend them — even if the tool's existing FAQ has similar
 * questions — because the exact-match wording is what triggers PAA
 * snippet inclusion. The existing FAQs are kept too, since they cover
 * tool-specific concerns.
 */
const UNIVERSAL_FAQ: { question: string; answer: string }[] = [
  {
    question: "Is this tool free to use?",
    answer:
      "Yes — 100% free, with no hidden limits, no premium tier, and no daily usage cap. Use it as many times as you want, on as many files or inputs as you need. ToolVerse is supported by ads, never by selling your data or locking features behind a paywall.",
  },
  {
    question: "Does my data leave my device?",
    answer:
      "No. All processing happens entirely inside your browser using JavaScript. Your text, files, and inputs are never uploaded to a server, never stored, and never transmitted anywhere. You can verify this yourself by opening your browser's developer tools (Network tab) and confirming zero outbound requests while the tool runs.",
  },
  {
    question: "Can I use this tool without signing up?",
    answer:
      "Yes — no account, no email, and no sign-up required. Just open the page and start using the tool immediately. We don't track who uses which tool or store any identifiers. Bookmark the page and come back any time.",
  },
];

/**
 * Returns the tool's FAQ list with the 3 universal questions prepended.
 * Existing tool-specific FAQs are preserved.
 */
export function getEnhancedFaq(tool: ToolDef): { question: string; answer: string }[] {
  return [...UNIVERSAL_FAQ, ...(tool.faq || [])];
}
