// Run: bun run scripts/generate-sitemaps.ts
// This regenerates all static sitemap XML files from the tools-data source.

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SITEMAPS_DIR = join(ROOT, "public", "sitemaps");

// We need to import the data, but it uses lucide-react icons which need JSX.
// Instead, parse the tool IDs and categories directly from the TypeScript source.
// For reliability, we duplicate the minimal data needed.

const toolCategories = [
  { id: "text", name: "Text Tools" },
  { id: "math", name: "Math Calculators" },
  { id: "dev", name: "Developer Tools" },
  { id: "image", name: "Image Tools" },
  { id: "pdf", name: "PDF Tools" },
];

// Exact category mapping from tools-data.ts
const toolsByCategory: Record<string, { id: string; priority: number }[]> = {
  text: [
    { id: "word-counter", priority: 0.9 },
    { id: "character-counter", priority: 0.9 },
    { id: "case-converter", priority: 0.8 },
    { id: "lorem-ipsum-generator", priority: 0.8 },
    { id: "markdown-previewer", priority: 0.8 },
    { id: "text-diff-checker", priority: 0.8 },
  ],
  math: [
    { id: "bmi-calculator", priority: 0.8 },
    { id: "percentage-calculator", priority: 0.8 },
    { id: "age-calculator", priority: 0.8 },
    { id: "loan-calculator", priority: 0.8 },
    { id: "unit-converter", priority: 0.8 },
  ],
  dev: [
    { id: "password-generator", priority: 0.9 },
    { id: "json-formatter", priority: 0.9 },
    { id: "hash-generator", priority: 0.9 },
    { id: "qr-code-generator", priority: 0.9 },
    { id: "base64-encoder", priority: 0.8 },
    { id: "url-encoder", priority: 0.8 },
    { id: "color-picker", priority: 0.8 },
    { id: "number-base-converter", priority: 0.7 },
  ],
  image: [
    { id: "image-compressor", priority: 0.9 },
  ],
  pdf: [
    { id: "pdf-compressor", priority: 0.9 },
    { id: "file-converter", priority: 0.9 },
    { id: "pdf-to-jpg", priority: 0.9 },
    { id: "jpg-to-pdf", priority: 0.9 },
    { id: "merge-pdf", priority: 0.9 },
    { id: "split-pdf", priority: 0.9 },
    { id: "rotate-pdf", priority: 0.9 },
    { id: "watermark-pdf", priority: 0.9 },
    { id: "pdf-number", priority: 0.9 },
    { id: "pdf-to-word", priority: 0.9 },
    { id: "word-to-pdf", priority: 0.9 },
    { id: "pdf-to-text", priority: 0.9 },
  ],
};

const BASE_URL = "https://toolhub-utilities.vercel.app";
const TODAY = new Date().toISOString().split("T")[0];

const blogSlugs = [
  "how-strong-should-a-password-be",
  "sha-256-explained",
  "json-formatting-guide",
  "what-is-base64",
  "hex-vs-rgb-color-formats",
  "markdown-cheat-sheet",
  "best-qr-code-practices",
  "how-image-compression-works",
  "difference-between-png-and-jpeg",
  "how-loan-interest-is-calculated",
  "how-bmi-is-calculated",
  "understanding-percentage-change",
  "how-to-convert-pdf-to-word",
  "markdown-vs-html-vs-docx",
  "extract-text-from-pdf",
];

const blogDates: Record<string, string> = {
  "how-strong-should-a-password-be": "2026-07-10",
  "sha-256-explained": "2026-07-08",
  "json-formatting-guide": "2026-07-06",
  "what-is-base64": "2026-07-04",
  "hex-vs-rgb-color-formats": "2026-07-02",
  "markdown-cheat-sheet": "2026-06-30",
  "best-qr-code-practices": "2026-06-28",
  "how-image-compression-works": "2026-06-26",
  "difference-between-png-and-jpeg": "2026-06-24",
  "how-loan-interest-is-calculated": "2026-06-22",
  "how-bmi-is-calculated": "2026-06-20",
  "understanding-percentage-change": "2026-06-18",
  "how-to-convert-pdf-to-word": "2026-07-20",
  "markdown-vs-html-vs-docx": "2026-07-18",
  "extract-text-from-pdf": "2026-07-15",
};

mkdirSync(SITEMAPS_DIR, { recursive: true });

// Generate category sitemaps
for (const cat of toolCategories) {
  const catTools = toolsByCategory[cat.id] || [];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${catTools
  .map(
    (t) => `  <url>
    <loc>${BASE_URL}/${t.id}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${t.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  writeFileSync(join(SITEMAPS_DIR, `tools-${cat.id}.xml`), xml);
  console.log(`✓ Generated sitemaps/tools-${cat.id}.xml (${catTools.length} tools)`);
}

// Generate pages sitemap
const pages = [
  { url: `${BASE_URL}/`, priority: "1.0", freq: "daily" },
  { url: `${BASE_URL}/about`, priority: "0.6", freq: "monthly" },
  { url: `${BASE_URL}/blog`, priority: "0.7", freq: "weekly" },
  { url: `${BASE_URL}/tutorials`, priority: "0.6", freq: "weekly" },
  { url: `${BASE_URL}/api-docs`, priority: "0.5", freq: "monthly" },
  { url: `${BASE_URL}/faq`, priority: "0.7", freq: "monthly" },
  { url: `${BASE_URL}/contact`, priority: "0.4", freq: "yearly" },
  { url: `${BASE_URL}/privacy`, priority: "0.3", freq: "yearly" },
  { url: `${BASE_URL}/terms`, priority: "0.3", freq: "yearly" },
  ...blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    priority: "0.7",
    freq: "monthly",
  })),
];

const pagesXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${blogDates[p.url.split("/").pop() || ""] || TODAY}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

writeFileSync(join(SITEMAPS_DIR, "pages.xml"), pagesXml);
console.log(`✓ Generated sitemaps/pages.xml (${pages.length} URLs)`);

// Generate sitemap index
const allSitemaps = [
  `${BASE_URL}/sitemaps/pages.xml`,
  ...toolCategories.map((cat) => `${BASE_URL}/sitemaps/tools-${cat.id}.xml`),
];

const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allSitemaps
  .map(
    (url) => `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

writeFileSync(join(ROOT, "public", "sitemap.xml"), sitemapIndex);
console.log(`✓ Generated sitemap.xml (index with ${allSitemaps.length} sitemaps)`);

// Verify no duplicates
const allUrls = new Set<string>();
let duplicateCount = 0;
for (const cat of toolCategories) {
  for (const t of toolsByCategory[cat.id] || []) {
    const url = `${BASE_URL}/${t.id}`;
    if (allUrls.has(url)) {
      console.error(`  ✗ DUPLICATE: ${url}`);
      duplicateCount++;
    }
    allUrls.add(url);
  }
}
if (duplicateCount === 0) {
  console.log(`✓ No duplicate URLs across sitemaps`);
}
console.log(`\nTotal tool URLs: ${allUrls.size}`);
console.log(`Done!`);
