import { tools, toolCategories } from "@/lib/tools-data";
import { ToolPageClient } from "./tool-page-client";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://toolhub-utilities.vercel.app";

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

  const toolUrl = `${BASE_URL}/${tool.id}`;

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
      images: [{ url: `${BASE_URL}/og-${tool.id}.png`, width: 1200, height: 630, alt: tool.metaTitle }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: tool.metaTitle,
      description: tool.metaDescription,
      images: [`${BASE_URL}/og-${tool.id}.png`],
    },
    alternates: {
      canonical: `/${tool.id}`,
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

// Classify tool type for schema differentiation
function getToolType(category: string, id: string): "tool" | "calculator" | "converter" {
  if (category === "math") return "calculator";
  const converterIds = [
    "unit-converter", "number-base-converter", "case-converter",
    "base64-encoder", "url-encoder", "color-picker",
  ];
  if (converterIds.includes(id)) return "converter";
  return "tool";
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

  const toolUrl = `${BASE_URL}/${tool.id}`;
  const categoryLabel = toolCategories.find((c) => c.id === tool.category)?.name || tool.category;
  const toolType = getToolType(tool.category, tool.id);

  // Related tools for internal linking in structured data
  const relatedTools = tools.filter((t) => t.category === tool.category && t.id !== tool.id).slice(0, 3);

  // ── Schema 1: WebApplication (all tools + calculators) ──
  const webAppSchema = (toolType === "converter") ? null : {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.metaTitle,
    description: tool.metaDescription,
    url: toolUrl,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  // ── Schema 2: SoftwareApplication (all) ──
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    applicationCategory: toolType === "calculator" ? "CalculatorApplication" : "UtilitiesApplication",
    applicationSubCategory: categoryLabel,
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: tool.longDescription,
    featureList: tool.features.join(", "),
    screenshot: toolUrl,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
      bestRating: "5",
      worstRating: "1",
    },
  };

  // ── Schema 3: FAQPage (all) ──
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  // ── Schema 4: BreadcrumbList (all) ──
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "All Tools", item: `${BASE_URL}/#all-tools` },
      { "@type": "ListItem", position: 3, name: categoryLabel, item: `${BASE_URL}/#${tool.category}-tools` },
      { "@type": "ListItem", position: 4, name: tool.name, item: toolUrl },
    ],
  };

  // ── Schema 5: Organization (all) ──
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ToolVerse",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: "Free online tools for text, math, development, and image processing. 100% private — all tools run in your browser.",
    foundingDate: "2025",
    founder: {
      "@type": "Person",
      name: "Zain Rana",
      url: `${BASE_URL}/about`,
    },
    sameAs: [],
  };

  // ── Schema 6: SearchAction (tools only) ──
  const searchActionSchema = (toolType === "tool") ? {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ToolVerse",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  } : null;

  // ── Schema 7: HowTo (all) ──
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

  const schemas = [
    webAppSchema,
    softwareAppSchema,
    faqSchema,
    breadcrumbSchema,
    organizationSchema,
    searchActionSchema,
    howToSchema,
  ].filter(Boolean);

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <ToolPageClient toolId={tool.id} />
    </>
  );
}