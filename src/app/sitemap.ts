import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools-data";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://toolverse.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolPages = tools.map((tool) => ({
    url: `${BASE_URL}/#tool-${tool.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...toolPages,
  ];
}