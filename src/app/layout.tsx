import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ToolVerse - Free Online Tools | Word Counter, Password Generator, BMI Calculator & More",
    template: "%s | ToolVerse",
  },
  description:
    "Free online tools: word counter, password generator, BMI calculator, percentage calculator, age calculator, loan calculator, unit converter, case converter, color picker, and JSON formatter. No sign-up required.",
  keywords: [
    "free online tools", "word counter", "password generator", "BMI calculator",
    "percentage calculator", "age calculator", "loan calculator", "unit converter",
    "case converter", "color picker", "JSON formatter", "online utilities",
    "free web tools", "browser tools", "no signup tools",
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
    title: "ToolVerse - Free Online Tools",
    description: "Free online tools that work instantly in your browser. Word counter, password generator, BMI calculator, and 7 more useful utilities.",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolVerse - Free Online Tools",
    description: "Free online tools that work instantly in your browser. No sign-up required.",
    site: "@toolverse",
  },
  alternates: {
    canonical: "/",
  },
  category: "technology",
  verification: {
    google: "IZ_kgkZCobezDHfENC4rcTL_eNcV1i71jvcEVmTRrlc",
  },
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://toolverse.com";

// WebSite schema
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ToolVerse",
  description: "Free online tools that work instantly in your browser. No sign-up required.",
  url: BASE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${BASE_URL}/?q={search_term_string}`,
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
  url: BASE_URL,
  logo: `${BASE_URL}/logo.svg`,
  sameAs: [],
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
        <meta name="google-site-verification" content="IZ_kgkZCobezDHfENC4rcTL_eNcV1i71jvcEVmTRrlc" />
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}