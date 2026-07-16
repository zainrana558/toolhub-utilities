import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, Code, Zap, Mail, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://toolhub-utilities.vercel.app";

export const metadata: Metadata = {
  title: "API - ToolVerse Developer API Reference",
  description:
    "ToolVerse API reference and documentation. Integrate our free online tools into your applications with simple API endpoints.",
  keywords: [
    "toolverse api",
    "developer api",
    "word count api",
    "hash generator api",
    "unit converter api",
    "image compression api",
    "free api endpoints",
    "rest api tools",
  ],
  openGraph: {
    title: "API - ToolVerse Developer API Reference",
    description:
      "ToolVerse API reference and documentation. Integrate our free online tools into your applications with simple API endpoints.",
    url: `${BASE_URL}/api-docs`,
  },
  alternates: {
    canonical: "/api-docs",
  },
};

const apiJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "ToolVerse Developer API",
  description:
    "ToolVerse API reference and documentation. Integrate our free online tools into your applications with simple API endpoints.",
  url: `${BASE_URL}/api-docs`,
  isPartOf: {
    "@type": "WebSite",
    name: "ToolVerse",
    url: BASE_URL,
  },
};

const endpoints = [
  {
    method: "POST" as const,
    path: "/api/v1/text/word-count",
    description: "Count words, characters, and sentences",
  },
  {
    method: "POST" as const,
    path: "/api/v1/security/hash",
    description: "Generate SHA-256/512 hashes",
  },
  {
    method: "POST" as const,
    path: "/api/v1/conversion/unit",
    description: "Convert between measurement units",
  },
  {
    method: "POST" as const,
    path: "/api/v1/images/compress",
    description: "Compress and resize images",
  },
];

export default function ApiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(apiJsonLd) }}
      />
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <Wrench className="h-5 w-5" />
              <span className="font-medium">ToolVerse</span>
            </Link>
          </header>

          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-muted-foreground">
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">API Docs</span>
          </nav>

          {/* Page Heading */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Code className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">
                Developer API
              </h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Integrate ToolVerse tools directly into your applications. Our
              upcoming REST API will give you programmatic access to word
              counting, hashing, unit conversion, image compression, and more.
            </p>
          </section>

          {/* How It Works */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                All ToolVerse tools currently run entirely in your browser using
                client-side JavaScript. Our planned API will mirror this
                functionality on the server, letting you send HTTP requests and
                receive results in JSON format.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The API is <strong className="text-foreground">coming soon</strong>.
                Sign up below to get early access when we launch.
              </p>
            </div>
          </section>

          {/* Planned Endpoints */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Planned Endpoints</h2>
            <div className="space-y-4">
              {endpoints.map((endpoint) => (
                <Card key={endpoint.path} className="gap-0 py-0">
                  <CardHeader>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono text-foreground">
                        {endpoint.path}
                      </code>
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground"
                      >
                        Coming Soon
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {endpoint.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Rate Limits */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              <Zap className="inline h-6 w-6 mr-2 text-primary" />
              Rate Limits
            </h2>
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We want the API to be accessible to everyone. Here&apos;s what
                we&apos;re planning:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Free tier:</strong> 1,000
                  requests per month at no cost
                </li>
                <li>
                  <strong className="text-foreground">No API key required</strong>{" "}
                  for the free tier — just send requests
                </li>
                <li>
                  <strong className="text-foreground">Fair usage policy:</strong>{" "}
                  Rate-limited to prevent abuse while keeping it accessible
                </li>
                <li>
                  <strong className="text-foreground">
                    Future paid tiers:
                  </strong>{" "}
                  Higher limits for power users and teams (TBD)
                </li>
              </ul>
            </div>
          </section>

          {/* Early Access CTA */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Get Early Access</h2>
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-primary" />
                <p className="font-medium">Sign up for early API access</p>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to know when our API launches. We&apos;ll send you
                documentation and an API key.
              </p>
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="max-w-sm"
                  readOnly
                />
                <Button disabled>
                  Sign Up
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>

          {/* Back link */}
          <div className="pt-8 border-t">
            <Link
              href="/"
              className="text-primary hover:underline text-sm"
            >
              &larr; Back to all tools
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}