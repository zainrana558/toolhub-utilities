import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://toolhub-utilities.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Google Search
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      // Bing Search
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      // Default: allow all others
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: [
      `${BASE_URL}/sitemap.xml`,
      `${BASE_URL}/sitemaps/pages.xml`,
      `${BASE_URL}/sitemaps/tools-text.xml`,
      `${BASE_URL}/sitemaps/tools-math.xml`,
      `${BASE_URL}/sitemaps/tools-dev.xml`,
      `${BASE_URL}/sitemaps/tools-image.xml`,
      `${BASE_URL}/sitemaps/tools-pdf.xml`,
    ],
  };
}
