import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, GraduationCap, Clock, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toolCategories } from "@/lib/tools-data";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Tutorials - Learn How to Use ToolVerse Tools",
  description:
    "Step-by-step tutorials for all ToolVerse tools. Learn how to use our free online utilities for text, math, development, and file conversion.",
  keywords: [
    "toolverse tutorials",
    "how to use word counter",
    "json formatter tutorial",
    "password generator guide",
    "bmi calculator tutorial",
    "image compressor guide",
    "online tools tutorial",
    "step by step guide",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    title: "Tutorials - Learn How to Use ToolVerse Tools",
    description:
      "Step-by-step tutorials for all ToolVerse tools. Learn how to use our free online utilities for text, math, development, and file conversion.",
    url: `${SITE_URL}/tutorials`,
    siteName: "ToolVerse",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tutorials - Learn How to Use ToolVerse Tools",
    description: "Step-by-step tutorials for all ToolVerse tools. Learn how to use our free online utilities for text, math, development, and file conversion.",
  },
  alternates: {
    canonical: "/tutorials",
  },
};

const tutorialsJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "ToolVerse Tutorials",
  description:
    "Step-by-step tutorials for all ToolVerse tools. Learn how to use our free online utilities for text, math, development, and file conversion.",
  url: `${SITE_URL}/tutorials`,
  isPartOf: {
    "@type": "WebSite",
    name: "ToolVerse",
    url: SITE_URL,
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Tutorials", item: `${SITE_URL}/tutorials` },
  ],
};

interface Tutorial {
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate";
  readTime: string;
  letter: string;
}

interface TutorialCategory {
  categoryId: string;
  tutorials: Tutorial[];
}

const tutorialGroups: TutorialCategory[] = [
  {
    categoryId: "text",
    tutorials: [
      {
        title: "Word Counter Tutorial",
        description:
          "Learn to count words, characters, sentences, and paragraphs with our instant text analysis tool.",
        difficulty: "Beginner",
        readTime: "2 min read",
        letter: "W",
      },
      {
        title: "Case Converter Tutorial",
        description:
          "Convert text between uppercase, lowercase, title case, and sentence case in one click.",
        difficulty: "Beginner",
        readTime: "2 min read",
        letter: "C",
      },
      {
        title: "Markdown Previewer Tutorial",
        description:
          "Write and preview Markdown content in real time with live rendering.",
        difficulty: "Beginner",
        readTime: "3 min read",
        letter: "M",
      },
    ],
  },
  {
    categoryId: "math",
    tutorials: [
      {
        title: "BMI Calculator Tutorial",
        description:
          "Calculate your Body Mass Index accurately and understand what the numbers mean.",
        difficulty: "Beginner",
        readTime: "2 min read",
        letter: "B",
      },
      {
        title: "Loan Calculator Tutorial",
        description:
          "Estimate monthly payments, total interest, and amortization schedules for any loan.",
        difficulty: "Intermediate",
        readTime: "3 min read",
        letter: "L",
      },
      {
        title: "Percentage Calculator Tutorial",
        description:
          "Solve any percentage problem — find percentages, percentage change, and more.",
        difficulty: "Beginner",
        readTime: "2 min read",
        letter: "P",
      },
    ],
  },
  {
    categoryId: "dev",
    tutorials: [
      {
        title: "JSON Formatter Tutorial",
        description:
          "Format, validate, and beautify JSON data with syntax highlighting and error detection.",
        difficulty: "Beginner",
        readTime: "2 min read",
        letter: "J",
      },
      {
        title: "Password Generator Tutorial",
        description:
          "Generate cryptographically secure passwords with customizable length and character sets.",
        difficulty: "Beginner",
        readTime: "2 min read",
        letter: "P",
      },
      {
        title: "Hash Generator Tutorial",
        description:
          "Create SHA-256, SHA-512, and other cryptographic hashes from any text input.",
        difficulty: "Intermediate",
        readTime: "3 min read",
        letter: "H",
      },
    ],
  },
  {
    categoryId: "converter",
    tutorials: [
      {
        title: "Image Compressor Tutorial",
        description:
          "Reduce image file sizes while maintaining quality using client-side compression.",
        difficulty: "Beginner",
        readTime: "2 min read",
        letter: "I",
      },
      {
        title: "PDF Compressor Tutorial",
        description:
          "Compress PDF files directly in your browser without uploading to any server.",
        difficulty: "Beginner",
        readTime: "2 min read",
        letter: "P",
      },
    ],
  },
];

function getCategoryById(id: string) {
  return toolCategories.find((c) => c.id === id);
}

export default function TutorialsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tutorialsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
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
            <span className="text-foreground font-medium">Tutorials</span>
          </nav>

          {/* Page Heading */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">Tutorials</h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Step-by-step guides for every ToolVerse tool. Whether you&apos;re a
              first-time user or a power user, our tutorials will help you get
              the most out of our free online utilities.
            </p>
          </section>

          {/* Tutorial Groups */}
          <section className="mb-12 space-y-12">
            {tutorialGroups.map((group) => {
              const category = getCategoryById(group.categoryId);
              if (!category) return null;

              return (
                <div key={group.categoryId}>
                  <h2 className="text-2xl font-semibold mb-4">{category.name}</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {group.tutorials.map((tutorial) => (
                      <Card key={tutorial.title} className="gap-0 py-0">
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${category.color}`}
                            >
                              {tutorial.letter}
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-base leading-snug">
                                {tutorial.title}
                              </CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {tutorial.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              <BookOpen className="h-3 w-3 mr-1" />
                              {tutorial.difficulty}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {tutorial.readTime}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Coming Soon Notice */}
          <section className="mb-12 rounded-xl border bg-muted/50 p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">
              Tutorials Coming Soon
            </h2>
            <p className="text-muted-foreground">
              We&apos;re creating detailed, illustrated walkthroughs for every
              tool. In the meantime, each tool has built-in instructions you can
              follow right on the tool page.
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