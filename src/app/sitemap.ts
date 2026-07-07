import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools-data";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://toolverse.com";

export default function sitemap(): MetadataRoute.Sitemap {
  // Homepage
  const homePage = {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 1.0,
  };

  // Individual tool pages (real crawlable URLs)
  const toolPages = tools.map((tool) => ({
    url: `${BASE_URL}/tools/${tool.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];

  return [homePage, ...toolPages, ...staticPages];
}