import type { Metadata } from "next";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { tools, toolCategories } from "@/lib/tools-data";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "ToolVerse - 32 Free Online Tools | No Sign-Up, 100% Private",
  description:
    "32 free online tools: word counter, password generator, BMI calculator, image compressor, QR code generator, PDF tools, JSON formatter, and more. No sign-up, no data collection. All tools run in your browser.",
  keywords: [
    "free online tools", "word counter", "password generator", "BMI calculator",
    "percentage calculator", "age calculator", "loan calculator", "unit converter",
    "case converter", "color picker", "JSON formatter", "online utilities",
    "free web tools", "browser tools", "no signup tools", "PDF tools",
    "image compressor", "QR code generator", "hash generator", "text diff checker",
    "base64 encoder", "URL encoder", "markdown previewer", "file converter",
  ],
  authors: [{ name: "ToolVerse" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ToolVerse",
    title: "ToolVerse - 32 Free Online Tools | No Sign-Up, 100% Private",
    description: "32 free online tools: word counter, password generator, image compressor, QR code generator, PDF tools, and more. No sign-up, no data collection.",
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: "ToolVerse - 32 Free Online Tools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolVerse - 32 Free Online Tools | No Sign-Up, 100% Private",
    description: "32 free online tools: word counter, password generator, image compressor, QR code generator, PDF tools, and more. No sign-up, no data collection.",
    site: "@toolverse",
    images: [`${SITE_URL}/og-default.png`],
  },
  alternates: {
    canonical: "/",
  },
};

// ItemList structured data — helps Google show site links in search results
const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Free Online Tools by ToolVerse",
  description: "A comprehensive collection of 32 free online tools across text, math, developer, image, and PDF categories. No sign-up required.",
  numberOfItems: tools.length,
  itemListElement: toolCategories.map((cat, catIndex) => ({
    "@type": "ListItem",
    position: catIndex + 1,
    name: cat.name,
    url: `${SITE_URL}/#${cat.id}-tools`,
  })),
};

const categorizedTools = toolCategories.map((cat) => ({
  ...cat,
  tools: tools.filter((t) => t.category === cat.id),
}));

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link
                href="/"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                aria-label="ToolVerse - Home"
              >
                <Wrench className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg">ToolVerse</span>
              </Link>

              <nav className="hidden md:flex items-center gap-4 text-sm">
                <Link href="/" className="text-primary font-medium">
                  All Tools
                </Link>
                {tools.slice(0, 5).map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/${tool.id}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tool.shortName}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-3">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main content — fully server-rendered for Googlebot */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
            <div className="max-w-6xl mx-auto">
              {/* Hero Section */}
              <section className="text-center space-y-4 py-4 md:py-8">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
                  Free Online Tools
                </h1>
                <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                  Fast, free, and privacy-focused online tools. No sign-up, no data collection — just useful utilities that work instantly in your browser.
                </p>
                <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" aria-hidden="true" />
              </section>

              {/* Tool Categories */}
              <div className="space-y-10">
                {categorizedTools.map((category) => (
                  <section key={category.id} id={`${category.id}-tools`}>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-xl md:text-2xl font-semibold">{category.name}</h2>
                      <Badge variant="secondary" className="text-xs">
                        {category.tools.length} tools
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {category.tools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <Link key={tool.id} href={`/${tool.id}`}>
                            <Card className="cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200 group h-full overflow-hidden">
                              <CardContent className="p-5 relative">
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-primary/5" aria-hidden="true" />
                                <div className="relative flex items-start gap-4">
                                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                                    <Icon className="h-5 w-5" aria-hidden="true" />
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                      {tool.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {tool.description}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>

              {/* FAQ Section — fully visible for Googlebot using <details> */}
              <section className="space-y-6 py-8" aria-labelledby="homepage-faq-heading">
                <h2 id="homepage-faq-heading" className="text-2xl font-semibold text-center">
                  Frequently Asked Questions
                </h2>
                <div className="max-w-3xl mx-auto space-y-4">
                  <details className="border rounded-lg group">
                    <summary className="p-4 cursor-pointer font-medium text-sm hover:bg-muted/50 transition-colors list-none flex justify-between items-center">
                      Are these tools free to use?
                      <span className="text-muted-foreground group-open:rotate-45 transition-transform text-lg leading-none" aria-hidden="true">+</span>
                    </summary>
                    <div className="px-4 pb-4 text-sm text-muted-foreground">
                      Yes, all tools on this website are completely free to use with no registration, sign-up, or hidden fees. You can use them as many times as you want without any limitations.
                    </div>
                  </details>
                  <details className="border rounded-lg group">
                    <summary className="p-4 cursor-pointer font-medium text-sm hover:bg-muted/50 transition-colors list-none flex justify-between items-center">
                      Is my data safe and private?
                      <span className="text-muted-foreground group-open:rotate-45 transition-transform text-lg leading-none" aria-hidden="true">+</span>
                    </summary>
                    <div className="px-4 pb-4 text-sm text-muted-foreground">
                      Absolutely. All tools run entirely in your browser — no data is sent to any server. Your text, passwords, calculations, and files never leave your device. We don&apos;t track, store, or collect any of the data you process through our tools.
                    </div>
                  </details>
                  <details className="border rounded-lg group">
                    <summary className="p-4 cursor-pointer font-medium text-sm hover:bg-muted/50 transition-colors list-none flex justify-between items-center">
                      Do I need to create an account?
                      <span className="text-muted-foreground group-open:rotate-45 transition-transform text-lg leading-none" aria-hidden="true">+</span>
                    </summary>
                    <div className="px-4 pb-4 text-sm text-muted-foreground">
                      No. There is no account creation, sign-up, or login required. Simply visit the tool you need and start using it immediately.
                    </div>
                  </details>
                  <details className="border rounded-lg group">
                    <summary className="p-4 cursor-pointer font-medium text-sm hover:bg-muted/50 transition-colors list-none flex justify-between items-center">
                      Can I use these tools on my phone?
                      <span className="text-muted-foreground group-open:rotate-45 transition-transform text-lg leading-none" aria-hidden="true">+</span>
                    </summary>
                    <div className="px-4 pb-4 text-sm text-muted-foreground">
                      Yes! All tools are fully responsive and work on any device — smartphones, tablets, laptops, and desktops. The interface adapts to your screen size for the best experience.
                    </div>
                  </details>
                </div>
              </section>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="h-5 w-5 text-primary" />
                  <span className="font-bold">ToolVerse</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Free online tools that work instantly in your browser. No sign-up, no data collection — just useful utilities for everyone.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">Popular Tools</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {tools.slice(0, 5).map((tool) => (
                    <li key={tool.id}>
                      <Link href={`/${tool.id}`} className="hover:text-foreground transition-colors">
                        {tool.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">Resources</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                  <li><Link href="/tutorials" className="hover:text-foreground transition-colors">Tutorials</Link></li>
                  <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                  <li><Link href="/api-docs" className="hover:text-foreground transition-colors">API Docs</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3">Company</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                  <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                  <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
              <p>Copyright 2025 ToolVerse. All rights reserved. All tools run locally in your browser.</p>
              <div className="flex items-center gap-4">
                <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
                <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
                <Link href="mailto:toolshubbb@gmail.com" className="hover:text-foreground transition-colors">Contact</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
