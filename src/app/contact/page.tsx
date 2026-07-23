import type { Metadata } from "next";
import Link from "next/link";
import { Wrench } from "lucide-react";
import ContactForm from "@/components/contact-form";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://toolhub-utilities.vercel.app";

export const metadata: Metadata = {
  title: "Contact Us - ToolVerse",
  description:
    "Get in touch with the ToolVerse team. Report bugs, suggest new tools, or ask questions about our free online utilities.",
  keywords: [
    "contact toolverse",
    "toolverse support",
    "report bug",
    "suggest tool",
    "toolverse email",
    "feedback",
  ],
 robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    title: "Contact Us - ToolVerse",
    description:
      "Get in touch with the ToolVerse team. Report bugs, suggest new tools, or ask questions about our free online utilities.",
    url: `${BASE_URL}/contact`,
    siteName: "ToolVerse",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us - ToolVerse",
    description: "Get in touch with the ToolVerse team. Report bugs, suggest new tools, or ask questions about our free online utilities.",
  },
  alternates: {
    canonical: "/contact",
  },
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Contact ToolVerse",
  description:
    "Get in touch with the ToolVerse team. Report bugs, suggest new tools, or ask questions about our free online utilities.",
  url: `${BASE_URL}/contact`,
  isPartOf: {
    "@type": "WebSite",
    name: "ToolVerse",
    url: BASE_URL,
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
    { "@type": "ListItem", position: 2, name: "Contact", item: `${BASE_URL}/contact` },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
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
            <span className="text-foreground font-medium">Contact Us</span>
          </nav>

          {/* Page Heading */}
          <section className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Have a suggestion for a new tool? Found a bug? Want to
              collaborate? We&apos;d love to hear from you. Reach out using any
              of the methods below.
            </p>
          </section>

          {/* Client-side form and contact methods */}
          <ContactForm />

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