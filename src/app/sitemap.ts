import type { MetadataRoute } from "next";
import { tools, toolCategories } from "@/lib/tools-data";
import { blogPosts } from "@/lib/blog-data";
import { SITE_URL } from "@/lib/site-config";

// Priority map based on tool category importance
const categoryPriority: Record<string, number> = {
  text: 0.9,
  dev: 0.9,
  math: 0.8,
  pdf: 0.9,
  image: 0.9,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/tutorials`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/api-docs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Tool pages
  const toolPages: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${SITE_URL}/${tool.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: categoryPriority[tool.category] || 0.8,
  }));

  // Blog pages
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...toolPages, ...blogPages];
}
