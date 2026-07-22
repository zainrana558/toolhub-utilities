import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, HelpCircle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://toolhub-utilities.vercel.app";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions About ToolVerse",
  description:
    "Answers to common questions about ToolVerse free online tools. Learn about privacy, features, supported formats, and how our tools work.",
  keywords: [
    "toolverse faq",
    "frequently asked questions",
    "toolverse privacy",
    "are toolverse tools free",
    "how do toolverse tools work",
    "offline tools",
    "browser-based tools faq",
  ],
  openGraph: {
    title: "FAQ - Frequently Asked Questions About ToolVerse",
    description:
      "Answers to common questions about ToolVerse free online tools. Learn about privacy, features, supported formats, and how our tools work.",
    url: `${BASE_URL}/faq`,
  },
  alternates: {
    canonical: "/faq",
  },
};

const faqData = {
  general: {
    title: "General",
    icon: HelpCircle,
    questions: [
      {
        question: "What is ToolVerse?",
        answer:
          "ToolVerse is a free collection of 21 online tools covering text analysis, math and finance, developer utilities, and file conversion. Every tool runs entirely in your browser — no data is ever sent to a server, and no account is required.",
      },
      {
        question: "Are all tools really free?",
        answer:
          "Yes, 100% free with no premium tiers, no feature gating, and no hidden costs. Every tool is fully functional with zero limitations. We believe essential online utilities should be accessible to everyone.",
      },
      {
        question: "Do I need to create an account?",
        answer:
          "No sign-up required. Simply visit the tool you need and start using it immediately. There are no accounts, logins, or registration forms anywhere on the site.",
      },
      {
        question: "How many tools does ToolVerse have?",
        answer:
          "21 tools across 4 categories: Text Tools (Word Counter, Character Counter, Case Converter, Lorem Ipsum Generator, Markdown Previewer, Text Diff Checker), Math Calculators (BMI Calculator, Percentage Calculator, Age Calculator, Loan Calculator, Unit Converter), Developer Tools (Password Generator, JSON Formatter, Color Picker, QR Code Generator, Base64 Encoder/Decoder, URL Encoder/Decoder, Hash Generator, Number Base Converter), and Image Tools (Image Compressor, PDF Compressor, File Converter).",
      },
    ],
  },
  privacy: {
    title: "Privacy & Security",
    icon: Shield,
    questions: [
      {
        question: "Is my data safe?",
        answer:
          "All tools run in your browser using client-side JavaScript. Your text, passwords, calculations, and files never leave your device. You can verify this by disconnecting from the internet — every tool still works. We do not track, store, or collect any of the data you process through our tools.",
      },
      {
        question: "Are passwords generated securely?",
        answer:
          "Yes. Our Password Generator uses the Web Crypto API (window.crypto.getRandomValues), which provides cryptographically secure random numbers. This is the same standard used by professional security tools and meets OWASP recommendations.",
      },
      {
        question: "Do you track users?",
        answer:
          "We use basic analytics only (page views and tool usage counts) to understand which tools are most popular and improve the experience. We do not track individual users, store IP addresses, or use any third-party tracking cookies. Your tool usage data is never recorded.",
      },
    ],
  },
  tools: {
    title: "Tools & Features",
    icon: Wrench,
    questions: [
      {
        question: "What tools are available?",
        answer:
          "ToolVerse offers 21 tools across 4 categories:\n\nText Tools: Word Counter, Character Counter, Case Converter, Lorem Ipsum Generator, Markdown Previewer, Text Diff Checker.\n\nMath Calculators: BMI Calculator, Percentage Calculator, Age Calculator, Loan Calculator, Unit Converter.\n\nDeveloper Tools: Password Generator, JSON Formatter, Color Picker, QR Code Generator, Base64 Encoder/Decoder, URL Encoder/Decoder, Hash Generator, Number Base Converter.\n\nImage Tools: Image Compressor, PDF Compressor, File Converter.",
      },
      {
        question: "Can I use tools on my phone?",
        answer:
          "Yes, fully responsive. All 21 tools are designed to work on any device — smartphones, tablets, laptops, and desktops. The interface adapts to your screen size for the best experience. Mobile users can also add ToolVerse to their home screen for quick access.",
      },
      {
        question: "Do tools work offline?",
        answer:
          "Once loaded, most tools work offline. Because all processing happens in your browser, you only need an internet connection for the initial page load. After that, tools like the Word Counter, Case Converter, Password Generator, JSON Formatter, and all calculators work without any network connection.",
      },
    ],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: Object.values(faqData).flatMap((category) =>
    category.questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    }))
  ),
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Frequently Asked Questions - ToolVerse",
  description:
    "Answers to common questions about ToolVerse free online tools.",
  url: `${BASE_URL}/faq`,
  isPartOf: {
    "@type": "WebSite",
    name: "ToolVerse",
    url: BASE_URL,
  },
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
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
            <span className="text-foreground font-medium">FAQ</span>
          </nav>

          {/* Page Heading */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">
                Frequently Asked Questions
              </h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Everything you need to know about ToolVerse — from how our tools
              work to your privacy and security.
            </p>
          </section>

          {/* FAQ Categories */}
          {Object.entries(faqData).map(([key, category]) => {
            const IconComponent = category.icon;
            return (
              <section key={key} className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <IconComponent className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold">{category.title}</h2>
                </div>
                <div className="space-y-4">
                  {category.questions.map((item) => (
                    <Card key={item.question} className="gap-0 py-0">
                      <CardHeader>
                        <CardTitle className="text-base leading-snug">
                          {item.question}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {item.answer.includes("\n\n") ? (
                          item.answer.split("\n\n").map((paragraph, i) => (
                            <p
                              key={i}
                              className="text-sm text-muted-foreground leading-relaxed"
                            >
                              {paragraph}
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.answer}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}

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