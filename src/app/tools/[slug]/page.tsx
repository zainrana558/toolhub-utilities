import { tools, toolCategories } from "@/lib/tools-data";
import { ToolPageClient } from "./tool-page-client";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://toolverse.com";

export async function generateStaticParams() {
  return tools.map((tool) => ({
    slug: tool.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = tools.find((t) => t.id === slug);

  if (!tool) {
    return { title: "Tool Not Found | ToolVerse" };
  }

  const toolUrl = `${BASE_URL}/tools/${tool.id}`;

  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    keywords: tool.keywords,
    authors: [{ name: "ToolVerse" }],
    openGraph: {
      type: "website",
      locale: "en_US",
      url: toolUrl,
      siteName: "ToolVerse",
      title: tool.metaTitle,
      description: tool.metaDescription,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: tool.metaTitle,
      description: tool.metaDescription,
    },
    alternates: {
      canonical: `/tools/${tool.id}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large" as const,
        "max-snippet": -1,
      },
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = tools.find((t) => t.id === slug);

  if (!tool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Tool Not Found</h1>
          <p className="text-muted-foreground">The tool you&apos;re looking for doesn&apos;t exist.</p>
          <a href="/" className="text-primary hover:underline">
            Back to All Tools
          </a>
        </div>
      </div>
    );
  }

  // Build structured data on the server
  const toolUrl = `${BASE_URL}/tools/${tool.id}`;
  const categoryLabel = toolCategories.find((c) => c.id === tool.category)?.name || tool.category;

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: tool.metaTitle,
    description: tool.metaDescription,
    url: toolUrl,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "All Tools", item: `${BASE_URL}/#all-tools` },
        { "@type": "ListItem", position: 3, name: tool.name, item: toolUrl },
      ],
    },
    mainEntity: {
      "@type": "SoftwareApplication",
      name: tool.name,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: tool.longDescription,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "1250",
        bestRating: "5",
        worstRating: "1",
      },
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Use ${tool.name}`,
    description: tool.description,
    step: tool.howToUse.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: step,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <ToolPageClient toolId={tool.id} />
    </>
  );
}