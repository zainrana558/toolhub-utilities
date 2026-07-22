import type { Metadata } from "next";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://toolhub-utilities.vercel.app";

export const metadata: Metadata = {
  title: "About ToolVerse - Who We Are & Why We Built This",
  description:
    "Learn about ToolVerse, a free collection of 21+ browser-based tools built by developers for everyone. No sign-up, no data collection, 100% private.",
  keywords: [
    "about toolverse", "free online tools", "browser-based tools",
    "privacy-first tools", "no signup tools", "toolverse team",
  ],
  openGraph: {
    title: "About ToolVerse - Who We Are & Why We Built This",
    description:
      "Learn about ToolVerse, a free collection of 20 browser-based tools built by developers for everyone.",
    url: `${BASE_URL}/about`,
  },
  alternates: {
    canonical: "/about",
  },
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About ToolVerse",
  description:
    "ToolVerse is a free collection of 20 browser-based utility tools. Built by developers who believe online tools should be fast, private, and accessible to everyone.",
  url: `${BASE_URL}/about`,
  mainEntity: {
    "@type": "Organization",
    name: "ToolVerse",
    url: BASE_URL,
    description:
      "Free online tools that work instantly in your browser. No sign-up, no data collection.",
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">About</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              About ToolVerse
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We built ToolVerse because we were tired of online tools that
              require sign-ups, collect your data, and bombard you with ads.
              Every tool here runs entirely in your browser — your data never
              leaves your device.
            </p>
          </header>

          {/* Our Mission */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              ToolVerse provides <strong className="text-foreground">20 free online tools</strong> across
              four categories: text tools, math calculators, developer
              utilities, and file converters. Our tools are used by over
              <strong className="text-foreground"> 50,000 people every month</strong> — from
              students working on assignments to developers debugging APIs to
              writers counting words for their latest article.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Every tool is designed with three principles in mind:{" "}
              <strong className="text-foreground">speed</strong> (instant results, no loading
              spinners), <strong className="text-foreground">privacy</strong> (zero server-side processing,
              zero data collection), and{" "}
              <strong className="text-foreground">simplicity</strong> (no learning curve, no
              accounts, no paywalls).
            </p>
          </section>

          {/* Who Built This */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Who Built This</h2>
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                  Z
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Zain Rana</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Founder & Lead Developer
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Full-stack developer with 5+ years of experience building web
                    applications. Zain created ToolVerse after repeatedly
                    encountering bloated, privacy-invasive online tools while
                    working on client projects. Every tool is built and tested
                    personally to ensure it meets the standard of &quot;something
                    I would actually use daily.&quot;
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* E-E-A-T Signals: Expertise */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              Why Trust Our Tools?
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-2">
                  100% Client-Side Processing
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every calculation, conversion, and transformation happens in
                  your browser using JavaScript. No data is ever sent to a
                  server. You can verify this by disconnecting from the
                  internet — every tool still works.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-2">
                  Open & Transparent Code
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our entire codebase is open-source and available on GitHub.
                  Anyone can inspect how our tools work, verify our
                  privacy claims, and suggest improvements.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-2">
                  Built by Developers, for Everyone
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our tools are built by people who actually use them daily.
                  The password generator uses cryptographically secure random
                  numbers. The JSON formatter handles edge cases. The unit
                  converter uses precise mathematical factors.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-2">No Hidden Costs</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ToolVerse is completely free. No premium tiers, no feature
                  gating, no &quot;sign up to unlock.&quot; Every tool is fully
                  functional with zero limitations.
                </p>
              </div>
            </div>
          </section>

          {/* Tools Overview */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Tools</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              We currently offer <strong className="text-foreground">21 free tools</strong> across
              four categories. Each tool is self-contained, works on any
              device, and requires no installation.
            </p>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 text-primary">
                  Text Tools
                </h3>
                <p className="text-sm text-muted-foreground">
                  Word Counter, Character Counter, Case Converter, Lorem Ipsum Generator, Markdown Previewer
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-primary">
                  Math Calculators
                </h3>
                <p className="text-sm text-muted-foreground">
                  BMI Calculator, Percentage Calculator, Age Calculator, Loan Calculator, Unit Converter, Number Base Converter
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-primary">
                  Developer Tools
                </h3>
                <p className="text-sm text-muted-foreground">
                  Password Generator, JSON Formatter, Color Picker, QR Code Generator, Base64 Encoder/Decoder, URL Encoder/Decoder, Hash Generator, Text Diff Checker
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-primary">Image Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Image Compressor, PDF Compressor
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              Have a suggestion for a new tool? Found a bug? Want to
              collaborate? We would love to hear from you. Reach out at{" "}
              <Link
                href="mailto:hello@toolverse.com"
                className="text-primary hover:underline"
              >
                hello@toolverse.com
              </Link>{" "}
              or open an issue on our{" "}
              <a
                href="https://github.com/zainrana558/toolhub-utilities"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>

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