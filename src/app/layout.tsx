import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolVerse - Free Online Tools",
    description: "Free online tools that work instantly in your browser. No sign-up required.",
  },
  alternates: {
    canonical: "/",
  },
};

// JSON-LD structured data for the website
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ToolVerse",
  description: "Free online tools that work instantly in your browser. No sign-up required.",
  url: "/",
  potentialAction: {
    "@type": "SearchAction",
    target: "/?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}