import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

import { SITE_URL } from "@/lib/site-config";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ToolVerse - 32 Free Online Tools | No Sign-Up, 100% Private",
    template: "%s | ToolVerse",
  },
  description:
    "32 free online tools: word counter, password generator, BMI calculator, image compressor, QR code generator, PDF tools, JSON formatter, and more. No sign-up, no data collection. All tools run in your browser.",
  keywords: [
    "free online tools", "word counter", "character counter", "password generator",
    "BMI calculator", "percentage calculator", "age calculator", "loan calculator",
    "unit converter", "case converter", "color picker", "JSON formatter",
    "online utilities", "free web tools", "browser tools", "no signup tools",
    "PDF tools", "image compressor", "QR code generator", "hash generator",
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
    images: [{ url: `${SITE_URL}/api/og`, width: 1200, height: 630, alt: "ToolVerse - 32 Free Online Tools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolVerse - 32 Free Online Tools | No Sign-Up, 100% Private",
    description: "32 free online tools: word counter, password generator, image compressor, QR code generator, PDF tools, and more. No sign-up, no data collection.",
    site: "@toolverse",
    images: [`${SITE_URL}/api/og`],
  },
  alternates: {
    canonical: "/",
  },
  category: "technology",
  verification: {
    google: "GdNdcEZibJZdN6jmTnJqM3lEcFznkOvi5kayRqfMkiw",
  },
};

// WebSite schema
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ToolVerse",
  description: "Free online tools that work instantly in your browser. No sign-up required.",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

// FAQPage schema for homepage FAQ
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Are these tools free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, all tools on this website are completely free to use with no registration, sign-up, or hidden fees. You can use them as many times as you want without any limitations.",
      },
    },
    {
      "@type": "Question",
      name: "Is my data safe and private?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. All tools run entirely in your browser — no data is sent to any server. Your text, passwords, calculations, and files never leave your device. We don't track, store, or collect any of the data you process through our tools.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to create an account?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. There is no account creation, sign-up, or login required. Simply visit the tool you need and start using it immediately.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use these tools on my phone?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! All tools are fully responsive and work on any device — smartphones, tablets, laptops, and desktops. The interface adapts to your screen size for the best experience.",
      },
    },
  ],
};

// Organization schema
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ToolVerse",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  description: "Free online tools that work instantly in your browser. 32 utilities across text, math, developer tools, PDF, and image tools. No sign-up required.",
  foundingDate: "2025",
  founder: {
    "@type": "Person",
    name: "Zain Rana",
    jobTitle: "Founder & Lead Developer",
    description: "Full-stack developer with 5+ years of experience building web applications.",
  },
  sameAs: [
    "https://github.com/zainrana558/toolhub-utilities",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "toolshubbb@gmail.com",
    contactType: "customer support",
  },
};

// Person schema (E-E-A-T)
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Zain Rana",
  url: SITE_URL,
  jobTitle: "Full-Stack Developer & Founder",
  worksFor: {
    "@type": "Organization",
    name: "ToolVerse",
  },
  knowsAbout: ["Web Development", "JavaScript", "TypeScript", "React", "Next.js", "SEO", "Online Tools"],
  sameAs: ["https://github.com/zainrana558"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="google-site-verification" content="GdNdcEZibJZdN6jmTnJqM3lEcFznkOvi5kayRqfMkiw" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
        {/* Google AdSense library — loaded once globally only when configured. */}
        {ADSENSE_CLIENT && (
          <Script
            id="adsbygoogle-lib"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}