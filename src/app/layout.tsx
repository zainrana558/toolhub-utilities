import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://toolhub-utilities.vercel.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "ToolVerse - 20 Free Online Tools | No Sign-Up",
    template: "%s | ToolVerse",
  },
  description:
    "20 free online tools: word counter, password generator, BMI calculator, image compressor, QR code generator, PDF compressor, unit converter, JSON formatter and more. No sign-up, 100% private.",
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
    title: "ToolVerse - 20 Free Online Tools | No Sign-Up",
    description: "20 free online tools: word counter, password generator, image compressor, QR code generator, PDF compressor and more. No sign-up, 100% private.",
    url: BASE_URL,
    images: [{ url: `${BASE_URL}/og-default.png`, width: 1200, height: 630, alt: "ToolVerse - 20 Free Online Tools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolVerse - 20 Free Online Tools | No Sign-Up",
    description: "20 free online tools: word counter, password generator, image compressor, QR code generator, PDF compressor and more. No sign-up, 100% private.",
    site: "@toolverse",
    images: [`${BASE_URL}/og-default.png`],
  },
  alternates: {
    canonical: "/",
  },
  category: "technology",
  verification: {
    google: "IZ_kgkZCobezDHfENC4rcTL_eNcV1i71jvcEVmTRrlc",
  },
};

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
  description: "Free online tools that work instantly in your browser. 20+ utilities across text, math, developer tools, and converters. No sign-up required.",
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
    email: "hello@toolverse.com",
    contactType: "customer support",
  },
};

// Person schema (E-E-A-T)
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Zain Rana",
  url: BASE_URL,
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
      </body>
    </html>
  );
}