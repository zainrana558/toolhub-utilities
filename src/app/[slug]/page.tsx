import { tools, toolCategories } from "@/lib/tools-data";
import { ToolPageClient } from "./tool-page-client";
import { SITE_URL } from "@/lib/site-config";
import { getMetaTitle, getMetaDescription, getEnhancedFaq } from "@/lib/tool-seo";

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

  const toolUrl = `${SITE_URL}/${tool.id}`;

  return {
    title: getMetaTitle(tool),
    description: getMetaDescription(tool),
    keywords: tool.keywords,
    authors: [{ name: "Zain Rana" }],
    openGraph: {
      type: "website",
      locale: "en_US",
      url: toolUrl,
      siteName: "ToolVerse",
      title: getMetaTitle(tool),
      description: getMetaDescription(tool),
      images: [{ url: `${SITE_URL}/api/og?slug=${encodeURIComponent(tool.id)}`, width: 1200, height: 630, alt: getMetaTitle(tool) }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: getMetaTitle(tool),
      description: getMetaDescription(tool),
      images: [`${SITE_URL}/api/og?slug=${encodeURIComponent(tool.id)}`],
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

  const toolUrl = `${SITE_URL}/${tool.id}`;
  const categoryLabel = toolCategories.find((c) => c.id === tool.category)?.name || tool.category;
  const toolType = getToolType(tool.category, tool.id);

  // ── Schema 1: WebApplication (non-converters) ──
  const webAppSchema = toolType === "converter" ? null : {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: getMetaTitle(tool),
    description: getMetaDescription(tool),
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

  // ── Schema 2: SoftwareApplication (NO fake AggregateRating) ──
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
  };

  // ── Schema 3: FAQPage (uses enhanced FAQ to match what's rendered) ──
  const enhancedFaq = getEnhancedFaq(tool);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: enhancedFaq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  // ── Schema 4: BreadcrumbList ──
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: categoryLabel, item: `${SITE_URL}/#${tool.category}-tools` },
      { "@type": "ListItem", position: 3, name: tool.name, item: toolUrl },
    ],
  };

  // ── Schema 5: HowTo ──
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

  // NOTE: Organization schema removed — it's already in layout.tsx globally.
  // Duplicate Organization schemas cause GSC warnings.
  // NOTE: SearchAction schema removed — it's already in layout.tsx globally.

  const schemas = [
    webAppSchema,
    softwareAppSchema,
    faqSchema,
    breadcrumbSchema,
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
