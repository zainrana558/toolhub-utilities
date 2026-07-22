import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com; frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self';",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Build fails fast on type errors instead of silently shipping them.
  // If errors appear after this change, fix them — don't re-enable this flag.
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // Force trailing slashes for cleaner URLs
  trailingSlash: false,
  // Redirect www to non-www (handles at edge, but add as fallback)
  async redirects() {
    return [
      // Redirect old /tools/* URLs to new top-level /* URLs
      {
        source: "/tools/:slug",
        destination: "/:slug",
        permanent: true, // 301 redirect
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Cache static assets aggressively
      {
        source: "/(.*)\\.(ico|svg|png|jpg|jpeg|webp|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache JS/CSS with content hash
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache static info pages at CDN edge
      {
        source: "/(about|privacy|terms)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
        ],
      },
      // Tool pages: aggressive CDN caching with stale-while-revalidate
      {
        source: "/(word-counter|character-counter|password-generator|bmi-calculator|percentage-calculator|age-calculator|loan-calculator|unit-converter|case-converter|color-picker|json-formatter|image-compressor|qr-code-generator|base64-encoder|url-encoder|lorem-ipsum-generator|markdown-previewer|hash-generator|number-base-converter|text-diff-checker|pdf-compressor)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
          { key: "Vary", value: "Accept-Encoding" },
        ],
      },
      // Hint for Brotli/compression on HTML
      {
        source: "/(.*)",
        headers: [
          { key: "Vary", value: "Accept-Encoding" },
        ],
      },
    ];
  },
  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;