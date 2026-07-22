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
      "Learn about ToolVerse, a free collection of 21 browser-based tools built by developers for everyone.",
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
    "ToolVerse is a free collection of 21 browser-based utility tools. Built by developers who believe online tools should be fast, private, and accessible to everyone.",
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
              ToolVerse provides <strong className="text-foreground">21 free online tools</strong> across
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
                  Image Compressor, PDF Compressor, File Converter
                </p>
              </div>
            </div>
          </section>

          {/* History & Timeline */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">How ToolVerse Started</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              ToolVerse began in early 2025 as a personal scratchpad of utility
              scripts. The original need was mundane: a quick way to count words
              in a draft, generate a strong password for a new account, and
              compress an image for an email attachment. Existing tools required
              sign-ups, showed full-screen ads, or quietly uploaded files to
              servers with unclear retention policies. So we built our own.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The initial release in March 2025 had six tools. By June we had
              added calculators, color and QR utilities, and the JSON formatter.
              The PDF Compressor launched in late 2025 as our first tool that
              operates on a binary file format entirely in the browser. The
              File Converter, which performs server-side conversion between
              PDF, Word, Markdown, HTML, and plain text, joined in mid-2026 as
              tool #21 and our first tool that requires server-side processing.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Every tool we add solves a problem we personally hit. We never
              build tools to pad the count or chase search traffic. If we
              wouldn&apos;t use it ourselves, it doesn&apos;t ship.
            </p>
          </section>

          {/* Tech Stack */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Built With</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              ToolVerse runs on a modern, fully-typed TypeScript stack. The
              frontend is <strong className="text-foreground">Next.js 16</strong> with
              the App Router and React 19, styled with{" "}
              <strong className="text-foreground">Tailwind CSS v4</strong> and{" "}
              <strong className="text-foreground">shadcn/ui</strong> components. State
              management is handled by{" "}
              <strong className="text-foreground">Zustand</strong>, and forms by{" "}
              <strong className="text-foreground">React Hook Form</strong> with Zod schemas.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Most tools process data entirely in the browser using Web APIs:
              the Password Generator uses{" "}
              <strong className="text-foreground">Web Crypto</strong> for
              cryptographically secure randomness, the Image Compressor uses the
              Canvas API, the PDF Compressor uses{" "}
              <strong className="text-foreground">pdf-lib</strong> for structural
              optimization, and the Hash Generator uses the SubtleCrypto
              interface. The File Converter is the exception — it uses
              server-side libraries ({""}
              <strong className="text-foreground">mammoth</strong>,{" "}
              <strong className="text-foreground">docx</strong>,{" "}
              <strong className="text-foreground">pdf-parse</strong>, and{" "}
              <strong className="text-foreground">marked</strong>) because those
              libraries are too heavy to ship to the browser.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The entire codebase is open-source on{" "}
              <a
                href="https://github.com/zainrana558/toolhub-utilities"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>{" "}
              and deploys to Vercel as a standalone Node server. Pages are
              statically prerendered where possible, with dynamic server routes
              only for the contact form and file conversion endpoints.
            </p>
          </section>

          {/* Roadmap */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">What&apos;s Next</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We add tools when we identify a genuine need that isn&apos;t
              well-served by existing free options. Here&apos;s what&apos;s on the
              shortlist for the next few releases:
            </p>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">Q3 2026</span>
                <span>
                  <strong className="text-foreground">Color Palette Generator</strong> —
                  generate accessible 5-color palettes from a single seed color,
                  with WCAG contrast ratios and exportable CSS/Tailwind config.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">Q3 2026</span>
                <span>
                  <strong className="text-foreground">CSV Viewer &amp; Inspector</strong> —
                  paste or upload a CSV, get a sortable, filterable table view
                  with column statistics and quick visualizations.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">Q4 2026</span>
                <span>
                  <strong className="text-foreground">OCR for scanned PDFs</strong> —
                  extend the File Converter to handle scanned PDFs by running
                  Tesseract.js in the browser, no server round-trip required.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">Q4 2026</span>
                <span>
                  <strong className="text-foreground">Regex Tester</strong> — live regex
                  evaluation with capture groups, flags, and a library of common
                  patterns (emails, URLs, phone numbers, IP addresses).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold shrink-0">2027</span>
                <span>
                  <strong className="text-foreground">Theme &amp; locale expansion</strong> —
                  add Spanish, French, and German translations; introduce a
                  high-contrast accessibility theme.
                </span>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Have a tool you&apos;d like to see? Open an issue on GitHub or email
              us — every suggestion gets read.
            </p>
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