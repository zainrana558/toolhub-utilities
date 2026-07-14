"use client";

import { useState } from "react";
import { tools, toolCategories } from "@/lib/tools-data";
import { AdSlot } from "@/components/ad-slot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThumbsUp, Share2, Link2, Copy, Check, ChevronRight, Home, Wrench } from "lucide-react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";

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
const ImageCompressor = dynamic(() => import("@/components/tools/image-compressor").then((m) => ({ default: m.ImageCompressor })), { ssr: false });
const QRCodeGenerator = dynamic(() => import("@/components/tools/qr-code-generator").then((m) => ({ default: m.QRCodeGenerator })), { ssr: false });
const Base64Encoder = dynamic(() => import("@/components/tools/base64-encoder").then((m) => ({ default: m.Base64Encoder })), { ssr: false });
const URLEncoder = dynamic(() => import("@/components/tools/url-encoder").then((m) => ({ default: m.URLEncoder })), { ssr: false });
const LoremIpsumGenerator = dynamic(() => import("@/components/tools/lorem-ipsum-generator").then((m) => ({ default: m.LoremIpsumGenerator })), { ssr: false });
const MarkdownPreviewer = dynamic(() => import("@/components/tools/markdown-previewer").then((m) => ({ default: m.MarkdownPreviewer })), { ssr: false });
const HashGenerator = dynamic(() => import("@/components/tools/hash-generator").then((m) => ({ default: m.HashGenerator })), { ssr: false });
const NumberBaseConverter = dynamic(() => import("@/components/tools/number-base-converter").then((m) => ({ default: m.NumberBaseConverter })), { ssr: false });
const TextDiffChecker = dynamic(() => import("@/components/tools/text-diff-checker").then((m) => ({ default: m.TextDiffChecker })), { ssr: false });
const PdfCompressor = dynamic(() => import("@/components/tools/pdf-compressor").then((m) => ({ default: m.PdfCompressor })), { ssr: false });

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
  "image-compressor": ImageCompressor,
  "qr-code-generator": QRCodeGenerator,
  "base64-encoder": Base64Encoder,
  "url-encoder": URLEncoder,
  "lorem-ipsum-generator": LoremIpsumGenerator,
  "markdown-previewer": MarkdownPreviewer,
  "hash-generator": HashGenerator,
  "number-base-converter": NumberBaseConverter,
  "text-diff-checker": TextDiffChecker,
  "pdf-compressor": PdfCompressor,
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://toolhub-utilities.vercel.app";

const stagger = {
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function ToolPageClient({ toolId }: { toolId: string }) {
  const tool = tools.find((t) => t.id === toolId);
  const ToolComponent = toolComponents[toolId];
  const [linkCopied, setLinkCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (!tool || !ToolComponent) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Tool not found.</p>
        <Link href="/" className="inline-block mt-4 text-primary hover:underline">
          Back to All Tools
        </Link>
      </div>
    );
  }

  const relatedTools = tools.filter((t) => t.category === tool.category && t.id !== tool.id).slice(0, 3);
  const categoryLabel = toolCategories.find((c) => c.id === tool.category)?.name || tool.category;
  const toolUrl = `${BASE_URL}/tools/${tool.id}`;
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

  const Icon = tool.icon;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="ToolVerse - Back to all free online tools">
              <Wrench className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="font-bold text-lg">ToolVerse</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="space-y-6"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              {/* Breadcrumb — Change C: Added category link */}
              <motion.nav
                className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap"
                aria-label="Breadcrumb"
                variants={fadeUp}
                itemScope
                itemType="https://schema.org/BreadcrumbList"
              >
                <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <Home className="h-3.5 w-3.5" /> <span itemProp="name">Home</span>
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link href={`/#${tool.category}-tools`} className="hover:text-foreground transition-colors" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <span itemProp="name">{categoryLabel}</span>
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                  <span itemProp="name" className="text-foreground font-medium">{tool.name}</span>
                </span>
              </motion.nav>

              {/* Tool header */}
              <motion.div className="space-y-3" variants={fadeUp}>
                <div className="flex items-center gap-3">
                  <motion.div
                    className="p-3 rounded-xl bg-primary/10 text-primary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.05 }}
                    >
                      <Badge variant="secondary">{categoryLabel}</Badge>
                    </motion.div>
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">{tool.name}</h1>
                <p className="text-muted-foreground text-base">{tool.longDescription}</p>
              </motion.div>

              <AdSlot variant="horizontal" />

              {/* How to Use — Change A: wrapped in section with aria-labelledby, added id to CardTitle */}
              <section aria-labelledby="howto-heading">
                <motion.div variants={fadeUp}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base" id="howto-heading">How to Use {tool.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-2" itemScope itemType="https://schema.org/HowTo">
                        {tool.howToUse.map((step, i) => (
                          <motion.li
                            key={i}
                            className="flex gap-3 text-sm"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.08, duration: 0.3 }}
                            itemProp="step"
                            itemScope
                            itemType="https://schema.org/HowToStep"
                          >
                            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                              {i + 1}
                            </span>
                            <span className="text-muted-foreground pt-0.5" itemProp="text">{step}</span>
                          </motion.li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                </motion.div>
              </section>

              {/* Main tool */}
              <motion.div variants={fadeUp}>
                <ToolComponent />
              </motion.div>

              <AdSlot variant="horizontal" />

              {/* SEO Content: Change A — <article> instead of <section>, added <time> freshness signal */}
              <motion.article className="border-t pt-8 space-y-8" variants={fadeUp}>
                <p className="text-xs text-muted-foreground mb-4">Last updated: <time dateTime="2026-07-15">July 15, 2026</time></p>

                <h2 className="text-xl font-semibold">
                  What is {tool.name} and How Does It Work?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">{tool.name}</strong> is a{" "}
                  <strong className="text-foreground">free online {tool.primaryKeyword}</strong> that
                  works directly in your browser. {tool.longDescription.split(". ").slice(0, 3).join(". ") + "."}
                  {" "}Unlike most online tools, ToolVerse processes everything{" "}
                  <strong className="text-foreground">100% on your device</strong> — no data is ever uploaded to a server.
                </p>

                <h2 className="text-xl font-semibold">
                  Why Use {tool.name} Instead of Alternatives?
                </h2>
                <ul className="space-y-2 text-muted-foreground text-sm list-disc list-inside">
                  <li>
                    <strong className="text-foreground"><data value="free">Completely free</data></strong> — no sign-up, no premium tier, no feature limits. Use it as many times as you want.
                  </li>
                  <li>
                    <strong className="text-foreground"><data value="private">100% private</data></strong> — all processing happens in your browser. Your data never leaves your device.
                  </li>
                  <li>
                    <strong className="text-foreground"><data value="cross-device">Works on any device</data></strong> — fully responsive design that works on phones, tablets, laptops, and desktops.
                  </li>
                  <li>
                    <strong className="text-foreground"><data value="no-install">No installation needed</data></strong> — just open the page and start using it immediately.
                  </li>
                  <li>
                    <strong className="text-foreground"><data value="developer-built">Built by developers</data></strong> — created by people who actually use these tools daily in professional work.
                  </li>
                </ul>

                <h2 className="text-xl font-semibold">
                  Who Uses {tool.name}?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {tool.name} is used by a wide range of people every day.{" "}
                  {tool.category === "text" && (
                    <>Writers and bloggers use it to prepare content for publishing. Students use it for assignments and research papers. Content marketers rely on it for optimizing their articles for specific word counts and formatting requirements.</>
                  )}
                  {tool.category === "math" && (
                    <>Students use it for homework and exam preparation. Professionals use it for quick calculations in meetings and presentations. Financial advisors use it to help clients understand loans, percentages, and health metrics.</>
                  )}
                  {tool.category === "dev" && (
                    <>Software developers use it daily during coding and debugging. DevOps engineers use it for configuration and data formatting. Security professionals use it for generating secure passwords and verifying data integrity.</>
                  )}
                  {tool.category === "converter" && (
                    <>Designers use it to optimize images for web and social media. Professionals use it to compress PDFs before emailing. Students and engineers use it to convert between measurement units for assignments and projects.</>
                  )}
                </p>

                <h2 className="text-xl font-semibold">
                  Is {tool.name} Safe to Use?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Yes, {tool.name} is completely safe. All processing runs in your browser using standard web technologies like JavaScript and the HTML5 Canvas API. We use{" "}
                  <strong className="text-foreground">cryptographically secure methods</strong> where applicable (such as the Web Crypto API for password generation and hash computation). No plugins, extensions, or downloads are required. You can verify this by opening your browser&apos;s developer tools and confirming that no network requests are made during tool operation.
                </p>
              </motion.article>

              {/* FAQ — Change A: added id="faq-heading" */}
              {tool.faq.length > 0 && (
                <motion.section className="border-t pt-8" variants={fadeUp}>
                  <h2 className="text-xl font-semibold mb-4" id="faq-heading">Frequently Asked Questions about {tool.name}</h2>
                  <div className="space-y-3">
                    {tool.faq.map((item, i) => (
                      <motion.div
                        key={i}
                        className="border rounded-lg overflow-hidden"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.06 }}
                      >
                        <button
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          className="w-full text-left p-4 flex justify-between items-center hover:bg-muted/50 transition-colors"
                        >
                          <span className="font-medium text-sm pr-4">{item.question}</span>
                          <motion.span
                            className="text-muted-foreground text-lg leading-none shrink-0"
                            animate={{ rotate: openFaq === i ? 180 : 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            +
                          </motion.span>
                        </button>
                        <motion.div
                          initial={false}
                          animate={{
                            height: openFaq === i ? "auto" : 0,
                            opacity: openFaq === i ? 1 : 0,
                          }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 text-sm text-muted-foreground">
                            {item.answer}
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* E-E-A-T: Author Info — Change G */}
              <motion.aside className="border-t pt-8" variants={fadeUp}>
                <div className="flex items-start gap-4 rounded-xl border bg-card/50 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-base">
                    Z
                  </div>
                  <div>
                    <p className="text-sm">
                      <strong className="text-foreground">Written by Zain Rana</strong> — Full-stack developer and founder of ToolVerse. 
                      With over 5 years of experience building web applications, Zain creates and tests every tool personally to ensure 
                      accuracy, speed, and privacy.{" "}
                      <Link href="/about" className="text-primary hover:underline">Learn more about us</Link>.
                    </p>
                  </div>
                </div>
              </motion.aside>

              {/* Link to This Tool */}
              <motion.div variants={fadeUp}>
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
                          <motion.div whileTap={{ scale: 0.9 }}>
                            <Button variant="outline" size="sm" onClick={copyLink}>
                              {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Embed Code</label>
                        <div className="flex gap-2">
                          <Input readOnly value={embedCode} className="text-sm font-mono text-xs" />
                          <motion.div whileTap={{ scale: 0.9 }}>
                            <Button variant="outline" size="sm" onClick={copyEmbed}>
                              {embedCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <AdSlot variant="square" />

              {/* Related tools — Change A: added id="related-heading" */}
              {relatedTools.length > 0 && (
                <motion.section className="border-t pt-8" variants={fadeUp}>
                  <h2 className="text-xl font-semibold mb-4" id="related-heading">Related Tools</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {relatedTools.map((rt, i) => {
                      const RtIcon = rt.icon;
                      return (
                        <motion.div
                          key={rt.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
                          whileHover={{ y: -3, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Link href={`/tools/${rt.id}`} className="block">
                            <Card className="hover:shadow-lg transition-shadow h-full">
                              <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                                  <RtIcon className="h-4 w-4" aria-hidden="true" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{rt.name}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">{rt.description}</p>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.section>
              )}

              {/* Explore All Free Online Tools by Category — Change B: Topic Cluster structure */}
              <motion.section className="border-t pt-8" variants={fadeUp} id="all-tools" aria-labelledby="all-tools-heading">
                <h2 className="text-xl font-semibold mb-6" id="all-tools-heading">
                  Explore All Free Online Tools by Category
                </h2>
                <div className="space-y-6">
                  {toolCategories.map((cat) => {
                    const catTools = tools.filter((t) => t.category === cat.id && t.id !== tool.id);
                    if (catTools.length === 0) return null;
                    return (
                      <div key={cat.id}>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <span className={cat.color}>{cat.name}</span>
                          <Badge variant="outline" className="text-xs font-normal">{catTools.length} tools</Badge>
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {catTools.map((t) => {
                            const TIcon = t.icon;
                            return (
                              <Link
                                key={t.id}
                                href={`/tools/${t.id}`}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-1.5 px-2 rounded hover:bg-muted/50 group"
                              >
                                <TIcon className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                                <span className="truncate">{t.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.section>

              {/* CTA */}
              <motion.div
                variants={fadeUp}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card className="bg-primary/5">
                  <CardContent className="p-6 text-center space-y-3">
                    <h3 className="font-semibold">Found this tool helpful?</h3>
                    <p className="text-sm text-muted-foreground">
                      Share it with others who might need it. All tools are free and work on any device.
                    </p>
                    <div className="flex justify-center gap-2">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link href="/">
                          <Button variant="outline" size="sm">
                            <ThumbsUp className="h-4 w-4 mr-1" /> Browse More Tools
                          </Button>
                        </Link>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer — Change D: Added About, Privacy, Terms links */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="border-t mt-auto"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Separator className="mb-6" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>Copyright 2025 ToolVerse. All rights reserved. All tools run locally in your browser.</p>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link href="/#all-tools" className="hover:text-foreground transition-colors">All Tools</Link>
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}