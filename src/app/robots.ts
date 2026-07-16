import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://toolhub-utilities.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Google Search
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/_next/", "/*/embed"],
      },
      // Bing Search
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      // OpenAI / ChatGPT — allow full access for AI training & live search
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      // ChatGPT-User (when users paste URLs in ChatGPT)
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      // Perplexity AI — allow full access
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      // Anthropic Claude — allow full access
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      // Google Gemini / AI Overviews
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      // Apple Bot (Apple Intelligence / Siri suggestions)
      {
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      // Facebook/Meta AI
      {
        userAgent: "FacebookBot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      // Common crawl bots (CCBot, DataForSeo, etc.)
      {
        userAgent: "CCBot",
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
      `${BASE_URL}/sitemaps/tools-text.xml`,
      `${BASE_URL}/sitemaps/tools-math.xml`,
      `${BASE_URL}/sitemaps/tools-dev.xml`,
      `${BASE_URL}/sitemaps/tools-converters.xml`,
      `${BASE_URL}/sitemaps/pages.xml`,
    ],
  };
}