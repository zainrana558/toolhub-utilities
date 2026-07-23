import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms of Service - ToolVerse",
  description: "Terms of service for ToolVerse free online tools. Read the terms for using our 32 browser-based utilities.",
  keywords: [
    "toolverse terms of service",
    "terms of service",
    "free tools terms",
    "browser tools terms",
    "usage terms",
  ],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service - ToolVerse",
    description: "Terms of service for ToolVerse free online tools.",
    url: `${SITE_URL}/terms`,
    siteName: "ToolVerse",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service - ToolVerse",
    description: "Terms of service for ToolVerse free online tools.",
  },
};

const termsJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Terms of Service - ToolVerse",
  "description": "Terms of service for ToolVerse free online tools.",
  "url": `${SITE_URL}/terms`,
  "isPartOf": { "@type": "WebSite", "name": "ToolVerse", "url": SITE_URL },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Terms of Service", item: `${SITE_URL}/terms` },
  ],
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(termsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground font-medium">Terms of Service</span>
        </nav>
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground">
          <p><strong className="text-foreground">Last updated:</strong> July 2025</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">1. Acceptance of Terms</h2>
          <p>By accessing and using ToolVerse, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our website.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">2. Description of Service</h2>
          <p>ToolVerse provides free online tools including, but not limited to, word counter, password generator, BMI calculator, percentage calculator, age calculator, loan calculator, unit converter, case converter, color picker, and JSON formatter. All tools are provided as-is for personal and commercial use.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">3. Use of Tools</h2>
          <p>You may use our tools for any lawful purpose. You agree not to use the tools in any way that could damage, disable, or impair the website. All tool results are provided for informational purposes and should not be considered professional advice (medical, financial, legal, or otherwise).</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">4. Accuracy</h2>
          <p>While we strive for accuracy, we do not guarantee that the results produced by our tools are error-free. Users should verify important calculations independently. We are not liable for any decisions made based on tool results.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">5. Intellectual Property</h2>
          <p>The content, design, and code of ToolVerse are protected by intellectual property laws. You may not copy, modify, or redistribute our tools or website content without prior written permission.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">6. Limitation of Liability</h2>
          <p>ToolVerse is provided &quot;as is&quot; without warranties of any kind. We shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our tools or website.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">7. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the website after changes constitutes acceptance of the new terms.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">8. Contact</h2>
          <p>If you have questions about these terms, please contact us through our website.</p>
        </div>
      </div>
    </div>
  );
}