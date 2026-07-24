import { ImageResponse } from "next/og";
import { tools } from "@/lib/tools-data";
import { SITE_URL } from "@/lib/site-config";

/**
 * Dynamic Open Graph image generator.
 *
 * Route: /api/og?slug=<tool-id>
 *
 * Returns a 1200×630 PNG branded for the requested tool (or a default
 * ToolVerse branded image when no slug is supplied / slug is unknown).
 *
 * This replaces the previous approach of 33 static `og-*.png` files in
 * /public (which were referenced in metadata but never actually created).
 * Generating on-demand means:
 *   - one source of truth for the OG design (this file)
 *   - no build-time asset generation step
 *   - new tools automatically get a branded OG image
 *
 * Runtime: nodejs (ImageResponse uses @vercel/og under the hood, which
 * needs the wasm font renderer). Edge runtime also works but nodejs is
 * what the rest of the API routes use, so we keep it consistent.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Allow ISR caching at the CDN for a day. Tool names rarely change.
export const revalidate = 86400;

const WIDTH = 1200;
const HEIGHT = 630;

// Brand palette — kept in sync with the Tailwind theme (see globals.css).
const BRAND = {
  bg: "#0b0f17",       // deep slate
  bgAccent: "#1e293b", // slate-800
  primary: "#3b82f6",  // blue-500
  primaryDim: "#1d4ed8",
  text: "#f8fafc",     // slate-50
  textMuted: "#94a3b8",// slate-400
  ring: "#334155",     // slate-700
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  const tool = slug ? tools.find((t) => t.id === slug) : undefined;

  const title = tool?.name ?? "ToolVerse";
  const subtitle = tool
    ? tool.category === "pdf"
      ? "Free Online PDF Tool"
      : tool.category === "image"
        ? "Free Online Image Tool"
        : tool.category === "math"
          ? "Free Online Calculator"
          : tool.category === "dev"
            ? "Free Developer Tool"
            : "Free Online Tool"
    : "32 Free Online Tools · No Sign-Up · 100% Private";

  const tagline =
    tool?.description ??
    "Word counter, password generator, BMI calculator, PDF tools, image compressor, QR code generator, and more. All tools run in your browser.";

  // Truncate tagline to fit on two lines max
  const maxTaglineLen = 110;
  const taglineText =
    tagline.length > maxTaglineLen
      ? tagline.slice(0, maxTaglineLen - 1).trimEnd() + "…"
      : tagline;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BRAND.bg,
          backgroundImage: `radial-gradient(circle at 85% 15%, ${BRAND.primaryDim}33 0%, transparent 45%), radial-gradient(circle at 10% 90%, ${BRAND.primary}22 0%, transparent 50%)`,
          padding: "72px 80px",
          fontFamily: "sans-serif",
          color: BRAND.text,
        }}
      >
        {/* Top row: brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryDim})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 700,
              color: "white",
              boxShadow: `0 10px 30px ${BRAND.primary}40`,
            }}
          >
            T
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1 }}>
              ToolVerse
            </div>
            <div style={{ fontSize: "16px", color: BRAND.textMuted, marginTop: "4px" }}>
              toolhub-utilities.vercel.app
            </div>
          </div>
        </div>

        {/* Middle: title + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 18px",
              borderRadius: "999px",
              backgroundColor: `${BRAND.primary}1f`,
              border: `1px solid ${BRAND.primary}40`,
              color: BRAND.primary,
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {subtitle}
          </div>
          <div
            style={{
              fontSize: title.length > 24 ? "76px" : "92px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: "1040px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "26px",
              color: BRAND.textMuted,
              lineHeight: 1.4,
              maxWidth: "980px",
            }}
          >
            {taglineText}
          </div>
        </div>

        {/* Bottom row: feature pills */}
        <div
          style={{
            display: "flex",
            gap: "14px",
            alignItems: "center",
            fontSize: "20px",
            color: BRAND.textMuted,
          }}
        >
          {["No Sign-Up", "100% Private", "Works in Browser", "Free Forever"].map(
            (pill) => (
              <div
                key={pill}
                style={{
                  display: "flex",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  backgroundColor: BRAND.bgAccent,
                  border: `1px solid ${BRAND.ring}`,
                  color: BRAND.text,
                  fontSize: "18px",
                  fontWeight: 500,
                }}
              >
                {pill}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        // Cache the generated image at the CDN for a day; once a tool's
        // metadata changes we still re-render on stale-while-revalidate.
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Type": "image/png",
      },
    },
  );
}

// Tell Next.js this route is associated with the site URL (used by metadata
// helpers when generating OG image URLs from the layout).
export const GET_URL = (slug?: string) =>
  `${SITE_URL}/api/og${slug ? `?slug=${encodeURIComponent(slug)}` : ""}`;
