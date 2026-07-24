import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Traditional search engines ──────────────────────────────────────
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },

      // ── AI live-retrieval / answer bots (ALLOWED — drives referral traffic)
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: "Claude-Web",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },

      // ── Heavy AI training scrapers (BLOCKED — bandwidth cost, zero traffic)
      { userAgent: "GPTBot",             disallow: "/" },
      { userAgent: "CCBot",              disallow: "/" },
      { userAgent: "ClaudeBot",          disallow: "/" },
      { userAgent: "Meta-ExternalAgent", disallow: "/" },
      { userAgent: "Bytespider",         disallow: "/" },

      // ── Catch-all for all other bots ────────────────────────────────────
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    // AI context file — helps LLMs understand what this site offers
    // See: ${SITE_URL}/llms.txt
  };
}
