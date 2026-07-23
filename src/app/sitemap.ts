import type { MetadataRoute } from "next";
import { tools, toolCategories } from "@/lib/tools-data";
import { blogPosts } from "@/lib/blog-data";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://toolhub-utilities.vercel.app";

const TODAY = "2026-07-23";

// Priority map based on tool category importance
const categoryPriority: Record<string, number> = {
  text: 0.9,
  dev: 0.9,
  math: 0.8,
  pdf: 0.9,
  image: 0.9,
};

// Map tools to their actual categories from the data source
const toolsByCategory = toolCategories.map((cat) => ({
  category: cat,
  tools: tools.filter((t) => t.category === cat.id),
}));

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: TODAY,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: TODAY,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: TODAY,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/tutorials`,
      lastModified: TODAY,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/api-docs`,
      lastModified: TODAY,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: TODAY,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: TODAY,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: TODAY,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: TODAY,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Tool pages — dynamically generated from tools-data.ts
  const toolPages: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${BASE_URL}/${tool.id}`,
    lastModified: TODAY,
    changeFrequency: "monthly" as const,
    priority: categoryPriority[tool.category] || 0.8,
  }));

  // Blog pages — dynamically generated from blog-data.ts
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...toolPages, ...blogPages];
}

// Also export per-category sitemaps for GSC
export async function sitemapIndex(): Promise<string> {
  const categorySitemaps = toolCategories.map(
    (cat) => `${BASE_URL}/sitemaps/tools-${cat.id}.xml`
  );

  const allSitemaps = [
    `${BASE_URL}/sitemap.xml`,
    `${BASE_URL}/sitemaps/pages.xml`,
    ...categorySitemaps,
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allSitemaps
  .map(
    (url, i) => `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;
}

// Generate individual category sitemap XML strings for static files
export function getCategorySitemaps(): Record<string, string> {
  const result: Record<string, string> = {};

  for (const cat of toolCategories) {
    const catTools = tools.filter((t) => t.category === cat.id);
    result[`tools-${cat.id}`] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${catTools
  .map(
    (tool) => `  <url>
    <loc>${BASE_URL}/${tool.id}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${categoryPriority[tool.category] || 0.8}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
  }

  // Pages sitemap
  const pages = [
    { url: BASE_URL, priority: "1.0", freq: "daily" },
    { url: `${BASE_URL}/about`, priority: "0.6", freq: "monthly" },
    { url: `${BASE_URL}/blog`, priority: "0.7", freq: "weekly" },
    { url: `${BASE_URL}/tutorials`, priority: "0.6", freq: "weekly" },
    { url: `${BASE_URL}/api-docs`, priority: "0.5", freq: "monthly" },
    { url: `${BASE_URL}/faq`, priority: "0.7", freq: "monthly" },
    { url: `${BASE_URL}/contact`, priority: "0.4", freq: "yearly" },
    { url: `${BASE_URL}/privacy`, priority: "0.3", freq: "yearly" },
    { url: `${BASE_URL}/terms`, priority: "0.3", freq: "yearly" },
    ...blogPosts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      priority: "0.7",
      freq: "monthly",
    })),
  ];

  result["pages"] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return result;
}
