import { blogPosts } from "@/lib/blog-data";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site-config";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: "Post Not Found | ToolVerse" };

  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: [`${post.category.toLowerCase()} guide`, "toolverse blog", "free online tools", ...post.tools.map((t) => `${t.replace(/-/g, ' ')} tool`)],
    authors: [{ name: post.author }],
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
    },
    openGraph: {
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      url,
      siteName: "ToolVerse",
      title: post.title,
      description: post.description,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) return notFound();

  const faqEntities = post.faq ?? [];

  // Related posts — score every other post by shared tool links + shared
  // category, then take the top 3. This is what populates the "Related
  // guides" block at the bottom of each post. Internal linking between
  // blog posts distributes PageRank through the blog cluster and helps
  // Google understand topical relationships.
  const related = blogPosts
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      let score = 0;
      for (const t of p.tools) if (post.tools.includes(t)) score += 3;
      if (p.category === post.category) score += 1;
      // Newer posts get a tiny tiebreaker boost so the related list stays
      // fresh as the blog grows.
      score += Math.max(0, 30 - Math.floor((Date.parse("2026-07-24") - Date.parse(p.date)) / 86400000)) * 0.01;
      return { post: p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.post);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    // Only emit dateModified if the post was actually updated. Previously
    // this was hardcoded to a single date across every post, which created
    // impossible states (dateModified earlier than datePublished) that Google
    // flags as inconsistent structured data.
    ...(post.dateModified ? { dateModified: post.dateModified } : {}),
    author: {
      "@type": "Person",
      name: post.author,
      url: `${SITE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "ToolVerse",
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
    ],
  };

  const faqSchema = faqEntities.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqEntities.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  } : null;

  return (
    <>
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="font-bold text-lg">ToolVerse</span>
            </a>
            <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              &larr; All Posts
            </a>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <article>
            <div className="mb-8">
              <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {post.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-3">{post.title}</h1>
              <p className="text-lg text-muted-foreground mb-4">{post.description}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                  Z
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{post.author}</p>
                  <time dateTime={post.date} className="text-xs">
                    {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                </div>
              </div>
            </div>
            <div
              className="prose-custom"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            <div className="mt-12 pt-8 border-t">
              <h2 className="text-xl font-semibold mb-4">Try the Tools Mentioned</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {post.tools.map((toolSlug) => {
                  const toolNames: Record<string, string> = {
                    "word-counter": "Word Counter",
                    "character-counter": "Character Counter",
                    "password-generator": "Password Generator",
                    "bmi-calculator": "BMI Calculator",
                    "percentage-calculator": "Percentage Calculator",
                    "age-calculator": "Age Calculator",
                    "loan-calculator": "Loan Calculator",
                    "unit-converter": "Unit Converter",
                    "case-converter": "Case Converter",
                    "color-picker": "Color Picker",
                    "json-formatter": "JSON Formatter",
                    "image-compressor": "Image Compressor",
                    "qr-code-generator": "QR Code Generator",
                    "base64-encoder": "Base64 Encoder",
                    "url-encoder": "URL Encoder",
                    "lorem-ipsum-generator": "Lorem Ipsum Generator",
                    "markdown-previewer": "Markdown Previewer",
                    "hash-generator": "Hash Generator",
                    "number-base-converter": "Number Base Converter",
                    "text-diff-checker": "Text Diff Checker",
                    "pdf-compressor": "PDF Compressor",
                    "file-converter": "File Converter",
                    "merge-pdf": "Merge PDF",
                    "split-pdf": "Split PDF",
                    "rotate-pdf": "Rotate PDF",
                    "watermark-pdf": "Watermark PDF",
                    "pdf-number": "PDF Page Number",
                    "pdf-to-jpg": "PDF to JPG",
                    "pdf-to-word": "PDF to Word",
                    "word-to-pdf": "Word to PDF",
                    "pdf-to-text": "PDF to Text",
                    "jpg-to-pdf": "JPG to PDF",
                  };
                  return (
                    <a
                      key={toolSlug}
                      href={`/${toolSlug}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-muted/50 group"
                    >
                      <span className="text-green-500 shrink-0">→</span>
                      <span className="truncate">{toolNames[toolSlug] || toolSlug}</span>
                    </a>
                  );
                })}
              </div>
            </div>

            {related.length > 0 && (
              <div className="mt-12 pt-8 border-t">
                <h2 className="text-xl font-semibold mb-4">Related guides</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {related.map((rp) => (
                    <Link
                      key={rp.slug}
                      href={`/blog/${rp.slug}`}
                      className="group block rounded-lg border p-4 hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {rp.category}
                      </span>
                      <h3 className="mt-2 font-medium text-sm leading-snug group-hover:text-primary transition-colors">
                        {rp.title}
                      </h3>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        Read more <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        </main>
        <footer className="border-t mt-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-xs text-muted-foreground">
            Copyright 2025 ToolVerse. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}