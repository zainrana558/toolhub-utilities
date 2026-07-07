import type { MetadataRoute } from "next";
import { tools, toolCategories } from "@/lib/tools-data";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://toolverse.com";

export default function sitemap(): MetadataRoute.Sitemap {
  // Homepage
  const homePage = {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 1.0,
  };

  // Individual tool pages (REAL URLs - Google can crawl these)
  const toolPages = tools.map((tool) => ({
    url: `${BASE_URL}/tools/${tool.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  // Category landing pages
  const categoryPages = toolCategories.map((cat) => ({
    url: `${BASE_URL}/#${cat.id}-tools`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/#all-tools`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ];

  return [homePage, ...toolPages, ...categoryPages, ...staticPages];
}