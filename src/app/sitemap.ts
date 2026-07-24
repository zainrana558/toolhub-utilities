import type { MetadataRoute } from "next";
import { tools } from "@/lib/tools-data";
import { blogPosts } from "@/lib/blog-data";
import { SITE_URL } from "@/lib/site-config";

// Strip trailing slash so SITE_URL inconsistencies never produce double slashes
const base = SITE_URL.replace(/\/$/, "");

// Priority by tool category
const categoryPriority: Record<string, number> = {
  text:  0.9,
  dev:   0.9,
  pdf:   0.9,
  image: 0.9,
  math:  0.8,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base,                  lastModified: today,  changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/about`,       lastModified: today,  changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/blog`,        lastModified: today,  changeFrequency: "weekly",  priority: 0.7 },
    { url: `${base}/tutorials`,   lastModified: today,  changeFrequency: "weekly",  priority: 0.6 },
    { url: `${base}/api-docs`,    lastModified: today,  changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/faq`,         lastModified: today,  changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`,     lastModified: today,  changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/privacy`,     lastModified: today,  changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/terms`,       lastModified: today,  changeFrequency: "yearly",  priority: 0.3 },
  ];

  const toolPages: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${base}/${tool.id}`,
    lastModified: today,
    changeFrequency: "monthly" as const,
    priority: categoryPriority[tool.category] ?? 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...toolPages, ...blogPages];
}
