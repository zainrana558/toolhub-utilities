import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "ToolVerse privacy policy. Learn how we handle your data — spoiler: we don't collect any.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/" className="text-sm text-primary hover:underline mb-8 inline-block">Back to All Tools</Link>
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground">
          <p><strong className="text-foreground">Last updated:</strong> July 2025</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">1. Overview</h2>
          <p>ToolVerse provides free online tools that run entirely in your web browser. We are committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">2. Data We Collect</h2>
          <p><strong className="text-foreground">We do not collect, store, or transmit any of the data you process through our tools.</strong> All calculations, text processing, password generation, and file handling happen locally on your device. No data is sent to any server.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">3. Analytics</h2>
          <p>We may use Google Analytics to understand how visitors use our website. This collects anonymous data such as page views, browser type, and general location. We do not track individual users or link analytics data to any personal information.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">4. Advertising</h2>
          <p>We use Google AdSense to display advertisements. AdSense may use cookies to serve personalized ads based on your browsing history. You can opt out of personalized advertising at <a href="https://www.google.com/settings/ads" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">5. Cookies</h2>
          <p>We use minimal cookies necessary for the functioning of our website, such as remembering your dark mode preference. Third-party services (Google Analytics, Google AdSense) may set their own cookies as described above.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">6. Third-Party Links</h2>
          <p>Our website may contain links to third-party sites. We are not responsible for the privacy practices of those websites. We encourage you to read their privacy policies.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">7. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. Any changes will be posted on this page with an updated revision date.</p>

          <h2 className="text-xl font-semibold text-foreground mt-8">8. Contact</h2>
          <p>If you have questions about this privacy policy, please contact us through our website.</p>
        </div>
      </div>
    </div>
  );
}