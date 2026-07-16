import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, BookOpen, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://toolhub-utilities.vercel.app";

export const metadata: Metadata = {
  title: "Blog - ToolVerse Guides, Tips & Tutorials",
  description:
    "Free guides, tips, and tutorials on using online tools, web development, productivity, and more from the ToolVerse team.",
  keywords: [
    "toolverse blog",
    "online tools tips",
    "web development guides",
    "productivity tutorials",
    "word counter guide",
    "image compression tips",
    "password security",
    "qr code marketing",
    "bmi calculator guide",
  ],
  openGraph: {
    title: "Blog - ToolVerse Guides, Tips & Tutorials",
    description:
      "Free guides, tips, and tutorials on using online tools, web development, productivity, and more from the ToolVerse team.",
    url: `${BASE_URL}/blog`,
  },
  alternates: {
    canonical: "/blog",
  },
};

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "ToolVerse Blog",
  description:
    "Free guides, tips, and tutorials on using online tools, web development, productivity, and more from the ToolVerse team.",
  url: `${BASE_URL}/blog`,
  isPartOf: {
    "@type": "WebSite",
    name: "ToolVerse",
    url: BASE_URL,
  },
};

const blogPosts = [
  {
    title: "How to Use Our Word Counter for SEO",
    description:
      "Learn how to leverage the word counter tool to optimize your blog posts and articles for search engines.",
    category: "Text Tools",
  },
  {
    title: "5 Ways to Compress Images for Faster Websites",
    description:
      "Discover proven techniques to reduce image file sizes without sacrificing visual quality.",
    category: "Image Tools",
  },
  {
    title: "Understanding SHA-256 Hashes: A Beginner's Guide",
    description:
      "A clear introduction to cryptographic hashing and why it matters for data integrity and security.",
    category: "Developer Tools",
  },
  {
    title: "The Complete Guide to QR Code Marketing",
    description:
      "How businesses are using QR codes to bridge offline and online experiences effectively.",
    category: "Developer Tools",
  },
  {
    title: "How to Calculate Your BMI Accurately",
    description:
      "Understand the BMI formula, its limitations, and how to interpret your results correctly.",
    category: "Math & Finance",
  },
  {
    title: "Password Security Best Practices for 2026",
    description:
      "Stay ahead of threats with the latest password security strategies and tools.",
    category: "Developer Tools",
  },
];

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
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
            <span className="text-foreground font-medium">Blog</span>
          </nav>

          {/* Page Heading */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">
                ToolVerse Blog
              </h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Free guides, tips, and tutorials on using online tools, web
              development, productivity, and more. Our blog is coming soon —
              stay tuned for expert insights from the ToolVerse team.
            </p>
            <Link
              href="/about"
              className="inline-block mt-4 text-sm text-primary hover:underline"
            >
              Learn more about us &rarr;
            </Link>
          </section>

          {/* Blog Post Grid */}
          <section className="mb-12">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post) => (
                <Card key={post.title} className="gap-0 py-0">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {post.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        Coming Soon
                      </Badge>
                    </div>
                    <CardTitle className="text-base leading-snug">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {post.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Coming Soon Notice */}
          <section className="mb-12 rounded-xl border bg-muted/50 p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Blog Coming Soon</h2>
            <p className="text-muted-foreground">
              We&apos;re working on in-depth guides and tutorials for every
              ToolVerse tool. Check back soon or follow us on GitHub for
              updates.
            </p>
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