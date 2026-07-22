"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * Central registry of tool components.
 *
 * Both `tool-view.tsx` (the in-page renderer used on `/`) and
 * `tool-page-client.tsx` (the standalone page renderer used on `/{slug}`)
 * import the `toolComponents` map from here, so the dynamic-import boilerplate
 * lives in exactly one place.
 *
 * To add a new tool:
 *   1. Add a `ToolDef` entry in `src/lib/tools-data.ts`.
 *   2. Create the component at `src/components/tools/{id}.tsx`.
 *   3. Add a dynamic-import line + map entry below.
 *   4. (Optional) Add cross-category links in `src/lib/cross-category-links.ts`.
 *
 * All tool components are loaded with `ssr: false` because they're
 * interactive client-only widgets and we don't want to ship their JS in the
 * initial server-rendered HTML.
 */

const WordCounter = dynamic(
  () => import("@/components/tools/word-counter").then((m) => ({ default: m.WordCounter })),
  { ssr: false },
);
const CharacterCounter = dynamic(
  () => import("@/components/tools/character-counter").then((m) => ({ default: m.CharacterCounter })),
  { ssr: false },
);
const PasswordGenerator = dynamic(
  () => import("@/components/tools/password-generator").then((m) => ({ default: m.PasswordGenerator })),
  { ssr: false },
);
const BMICalculator = dynamic(
  () => import("@/components/tools/bmi-calculator").then((m) => ({ default: m.BMICalculator })),
  { ssr: false },
);
const PercentageCalculator = dynamic(
  () => import("@/components/tools/percentage-calculator").then((m) => ({ default: m.PercentageCalculator })),
  { ssr: false },
);
const AgeCalculator = dynamic(
  () => import("@/components/tools/age-calculator").then((m) => ({ default: m.AgeCalculator })),
  { ssr: false },
);
const LoanCalculator = dynamic(
  () => import("@/components/tools/loan-calculator").then((m) => ({ default: m.LoanCalculator })),
  { ssr: false },
);
const UnitConverter = dynamic(
  () => import("@/components/tools/unit-converter").then((m) => ({ default: m.UnitConverter })),
  { ssr: false },
);
const CaseConverter = dynamic(
  () => import("@/components/tools/case-converter").then((m) => ({ default: m.CaseConverter })),
  { ssr: false },
);
const ColorPicker = dynamic(
  () => import("@/components/tools/color-picker").then((m) => ({ default: m.ColorPicker })),
  { ssr: false },
);
const JSONFormatter = dynamic(
  () => import("@/components/tools/json-formatter").then((m) => ({ default: m.JSONFormatter })),
  { ssr: false },
);
const ImageCompressor = dynamic(
  () => import("@/components/tools/image-compressor").then((m) => ({ default: m.ImageCompressor })),
  { ssr: false },
);
const QRCodeGenerator = dynamic(
  () => import("@/components/tools/qr-code-generator").then((m) => ({ default: m.QRCodeGenerator })),
  { ssr: false },
);
const Base64Encoder = dynamic(
  () => import("@/components/tools/base64-encoder").then((m) => ({ default: m.Base64Encoder })),
  { ssr: false },
);
const URLEncoder = dynamic(
  () => import("@/components/tools/url-encoder").then((m) => ({ default: m.URLEncoder })),
  { ssr: false },
);
const LoremIpsumGenerator = dynamic(
  () => import("@/components/tools/lorem-ipsum-generator").then((m) => ({ default: m.LoremIpsumGenerator })),
  { ssr: false },
);
const MarkdownPreviewer = dynamic(
  () => import("@/components/tools/markdown-previewer").then((m) => ({ default: m.MarkdownPreviewer })),
  { ssr: false },
);
const HashGenerator = dynamic(
  () => import("@/components/tools/hash-generator").then((m) => ({ default: m.HashGenerator })),
  { ssr: false },
);
const NumberBaseConverter = dynamic(
  () => import("@/components/tools/number-base-converter").then((m) => ({ default: m.NumberBaseConverter })),
  { ssr: false },
);
const TextDiffChecker = dynamic(
  () => import("@/components/tools/text-diff-checker").then((m) => ({ default: m.TextDiffChecker })),
  { ssr: false },
);
const PdfCompressor = dynamic(
  () => import("@/components/tools/pdf-compressor").then((m) => ({ default: m.PdfCompressor })),
  { ssr: false },
);

export const toolComponents: Record<string, ComponentType> = {
  "word-counter": WordCounter,
  "character-counter": CharacterCounter,
  "password-generator": PasswordGenerator,
  "bmi-calculator": BMICalculator,
  "percentage-calculator": PercentageCalculator,
  "age-calculator": AgeCalculator,
  "loan-calculator": LoanCalculator,
  "unit-converter": UnitConverter,
  "case-converter": CaseConverter,
  "color-picker": ColorPicker,
  "json-formatter": JSONFormatter,
  "image-compressor": ImageCompressor,
  "qr-code-generator": QRCodeGenerator,
  "base64-encoder": Base64Encoder,
  "url-encoder": URLEncoder,
  "lorem-ipsum-generator": LoremIpsumGenerator,
  "markdown-previewer": MarkdownPreviewer,
  "hash-generator": HashGenerator,
  "number-base-converter": NumberBaseConverter,
  "text-diff-checker": TextDiffChecker,
  "pdf-compressor": PdfCompressor,
};

/** Convenience helper: returns the component for a tool id (or undefined). */
export function getToolComponent(toolId: string): ComponentType | undefined {
  return toolComponents[toolId];
}
