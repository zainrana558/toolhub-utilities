import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools-data";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://toolhub-utilities.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date().toISOString().split("T")[0];

  const homePage = {
    url: BASE_URL,
    lastModified: today,
    changeFrequency: "daily" as const,
    priority: 1.0,
  };

  const toolPages = tools.map((tool) => ({
    url: `${BASE_URL}/tools/${tool.id}`,
    lastModified: today,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/about`,
      lastModified: today,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: today,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: today,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];

  return [homePage, ...toolPages, ...staticPages];
}