import { blogPosts } from "@/lib/blog-data";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site-config";

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

  const faqEntities: { "@type": string; name: string; acceptedAnswer: { "@type": string; text: string } }[] = [];
  // Extract Q&A pairs from content for FAQ schema
  const h2Matches = post.content.matchAll(/<h2>([^<]+)<\/h2>\s*<p>([^<]+)<\/p>/g);
  for (const match of h2Matches) {
    faqEntities.push({
      "@type": "Question",
      name: match[1],
      acceptedAnswer: { "@type": "Answer", text: match[2] },
    });
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: "2026-07-16",
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
    mainEntity: faqEntities,
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