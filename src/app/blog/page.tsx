import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { blogPosts } from "@/lib/blog-data";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Blog - ToolVerse Guides, Tips & Tutorials",
  description:
    "In-depth guides on password security, JSON formatting, image compression, color formats, Markdown, QR codes, loan interest, BMI, and more.",
  keywords: [
    "toolverse blog",
    "online tools guides",
    "password security guide",
    "json formatting tips",
    "image compression tutorial",
    "color picker guide",
    "markdown tutorial",
    "qr code guide",
    "loan calculator guide",
    "bmi calculator tutorial",
    "free tools blog",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    title: "Blog - ToolVerse Guides, Tips & Tutorials",
    description:
      "In-depth guides on password security, JSON formatting, image compression, color formats, Markdown, QR codes, loan interest, BMI, and more.",
    url: `${SITE_URL}/blog`,
    siteName: "ToolVerse",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog - ToolVerse Guides, Tips & Tutorials",
    description: "In-depth guides on password security, JSON formatting, image compression, color formats, Markdown, QR codes, loan interest, BMI, and more.",
  },
  alternates: { canonical: "/blog" },
};

const blogPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "ToolVerse Blog",
  description: "In-depth guides, tutorials, and tips for ToolVerse free online tools.",
  url: `${SITE_URL}/blog`,
  isPartOf: { "@type": "WebSite", name: "ToolVerse", url: SITE_URL },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
  ],
};

export default function BlogPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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
          <nav className="mb-8 text-sm text-muted-foreground" itemScope itemType="https://schema.org/BreadcrumbList">
            <Link href="/" className="hover:text-foreground transition-colors" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name">Home</span>
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">Blog</span>
          </nav>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Blog</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              In-depth guides, tutorials, and explanations to help you get the most from our tools and understand the concepts behind them.
            </p>
          </section>

          {/* Blog Post List */}
          <section>
            <div className="space-y-4">
              {blogPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center gap-2 mb-2.5">
                        <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                        <time dateTime={post.date} className="text-xs text-muted-foreground">
                          {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </time>
                      </div>
                      <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors leading-snug">
                        {post.title}
                        <ArrowRight className="inline h-4 w-4 ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {post.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>by {post.author}</span>
                        <span>·</span>
                        <span>{post.tools.length} tool{post.tools.length > 1 ? "s" : ""} mentioned</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <div className="pt-8 mt-8 border-t">
            <Link href="/" className="text-primary hover:underline text-sm">
              &larr; Back to all tools
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}