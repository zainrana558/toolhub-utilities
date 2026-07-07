"use client";

import { useEffect, useState } from "react";
import { tools, toolCategories } from "@/lib/tools-data";
import { AdSlot } from "@/components/ad-slot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ThumbsUp, Share2, Link2, Copy, Check, ChevronRight, Home } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic imports for code splitting
const WordCounter = dynamic(() => import("@/components/tools/word-counter").then((m) => ({ default: m.WordCounter })), { ssr: false });
const PasswordGenerator = dynamic(() => import("@/components/tools/password-generator").then((m) => ({ default: m.PasswordGenerator })), { ssr: false });
const BMICalculator = dynamic(() => import("@/components/tools/bmi-calculator").then((m) => ({ default: m.BMICalculator })), { ssr: false });
const PercentageCalculator = dynamic(() => import("@/components/tools/percentage-calculator").then((m) => ({ default: m.PercentageCalculator })), { ssr: false });
const AgeCalculator = dynamic(() => import("@/components/tools/age-calculator").then((m) => ({ default: m.AgeCalculator })), { ssr: false });
const LoanCalculator = dynamic(() => import("@/components/tools/loan-calculator").then((m) => ({ default: m.LoanCalculator })), { ssr: false });
const UnitConverter = dynamic(() => import("@/components/tools/unit-converter").then((m) => ({ default: m.UnitConverter })), { ssr: false });
const CaseConverter = dynamic(() => import("@/components/tools/case-converter").then((m) => ({ default: m.CaseConverter })), { ssr: false });
const ColorPicker = dynamic(() => import("@/components/tools/color-picker").then((m) => ({ default: m.ColorPicker })), { ssr: false });
const JSONFormatter = dynamic(() => import("@/components/tools/json-formatter").then((m) => ({ default: m.JSONFormatter })), { ssr: false });

const toolComponents: Record<string, React.ComponentType> = {
  "word-counter": WordCounter,
  "password-generator": PasswordGenerator,
  "bmi-calculator": BMICalculator,
  "percentage-calculator": PercentageCalculator,
  "age-calculator": AgeCalculator,
  "loan-calculator": LoanCalculator,
  "unit-converter": UnitConverter,
  "case-converter": CaseConverter,
  "color-picker": ColorPicker,
  "json-formatter": JSONFormatter,
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://toolverse.com";

interface ToolViewProps {
  toolId: string;
  onBack: () => void;
}

export function ToolView({ toolId, onBack }: ToolViewProps) {
  const tool = tools.find((t) => t.id === toolId);
  const ToolComponent = toolComponents[toolId];
  const [linkCopied, setLinkCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Inject per-tool structured data into the page head
  useEffect(() => {
    if (!tool) return;

    const toolUrl = `${BASE_URL}/#tool-${tool.id}`;
    const categoryLabel = toolCategories.find((c) => c.id === tool.category)?.name || tool.category;

    // WebPage + SoftwareApplication schema
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
          { "@type": "ListItem", position: 2, name: categoryLabel, item: `${BASE_URL}/#${tool.category}-tools` },
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
      },
    };

    // Per-tool FAQPage schema
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: tool.faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    };

    // HowTo schema
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

    // Remove old scripts
    document.querySelectorAll("script[data-tool-schema]").forEach((el) => el.remove());

    // Inject new schemas
    [webPageSchema, faqSchema, howToSchema].forEach((schema, i) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-tool-schema", tool.id);
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", tool.metaDescription);

    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement("meta");
      metaKeywords.setAttribute("name", "keywords");
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute("content", tool.keywords.join(", "));

    return () => {
      document.querySelectorAll("script[data-tool-schema]").forEach((el) => el.remove());
    };
  }, [tool]);

  if (!tool || !ToolComponent) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Tool not found.</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tools
        </Button>
      </div>
    );
  }

  const relatedTools = tools.filter((t) => t.category === tool.category && t.id !== tool.id).slice(0, 3);
  const categoryLabel = toolCategories.find((c) => c.id === tool.category)?.name || tool.category;
  const toolUrl = `${BASE_URL}/#tool-${tool.id}`;
  const embedCode = `<a href="${toolUrl}" title="${tool.name} - Free Online Tool">${tool.name}</a> - Free online ${tool.name.toLowerCase()} by ToolVerse`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(toolUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const copyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <button onClick={onBack} className="hover:text-foreground transition-colors flex items-center gap-1">
          <Home className="h-3.5 w-3.5" /> Home
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button onClick={onBack} className="hover:text-foreground transition-colors">
          {categoryLabel}
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{tool.name}</span>
      </nav>

      {/* Tool header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{categoryLabel}</Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">{tool.name}</h1>
        <p className="text-muted-foreground max-w-3xl">{tool.longDescription}</p>
      </div>

      <AdSlot variant="horizontal" />

      {/* How to Use */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Use {tool.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {tool.howToUse.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-muted-foreground pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Main tool content */}
      <div className="max-w-4xl">
        <ToolComponent />
      </div>

      <AdSlot variant="horizontal" />

      {/* Per-tool FAQ */}
      {tool.faq.length > 0 && (
        <section className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions about {tool.name}</h2>
          <div className="space-y-3">
            {tool.faq.map((item, i) => (
              <div key={i} className="border rounded-lg">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-4 flex justify-between items-center hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-sm pr-4">{item.question}</span>
                  <span className="text-muted-foreground text-lg leading-none shrink-0">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Link to This Tool - Backlink Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Link to This Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share this tool on your website or blog. A link back helps others discover these free tools.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Direct Link</label>
              <div className="flex gap-2">
                <Input readOnly value={toolUrl} className="text-sm font-mono" />
                <Button variant="outline" size="sm" onClick={copyLink}>
                  {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Embed Code</label>
              <div className="flex gap-2">
                <Input readOnly value={embedCode} className="text-sm font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={copyEmbed}>
                  {embedCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdSlot variant="square" />

      {/* Related tools */}
      {relatedTools.length > 0 && (
        <section className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Related Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedTools.map((rt) => {
              const Icon = rt.icon;
              return (
                <Card
                  key={rt.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    window.scrollTo(0, 0);
                    window.dispatchEvent(new CustomEvent("tool-change", { detail: rt.id }));
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{rt.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{rt.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Tool footer CTA */}
      <Card className="bg-primary/5">
        <CardContent className="p-6 text-center space-y-3">
          <h3 className="font-semibold">Found this tool helpful?</h3>
          <p className="text-sm text-muted-foreground">
            Share it with others who might need it. All tools are free and work on any device.
          </p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: tool.name, text: tool.description, url: toolUrl });
                } else {
                  copyLink();
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-1" /> Share
            </Button>
            <Button variant="outline" size="sm" onClick={onBack}>
              <ThumbsUp className="h-4 w-4 mr-1" /> Browse More Tools
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}