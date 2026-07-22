import Script from "next/script";
import { cn } from "@/lib/utils";

/**
 * AdSlot — renders a real Google AdSense unit when NEXT_PUBLIC_ADSENSE_CLIENT
 * is set (e.g. "ca-pub-1234567890123456"), otherwise renders a labelled
 * placeholder so the layout doesn't shift between dev and production.
 *
 * Usage:
 *   <AdSlot variant="horizontal" />
 *   <AdSlot variant="square" slot="1234567890" className="mt-4" />
 *
 * Env:
 *   NEXT_PUBLIC_ADSENSE_CLIENT   — full client id, e.g. "ca-pub-..."
 *   NEXT_PUBLIC_ADSENSE_*_SLOT   — optional named slots, e.g.
 *                                  NEXT_PUBLIC_ADSENSE_HORIZONTAL_SLOT=111...
 *
 * When AdSense is disabled, the placeholder reserves the same dimensions so
 * CLS stays near zero.
 */

type AdVariant = "horizontal" | "vertical" | "square" | "banner";

const SIZE_MAP: Record<AdVariant, { className: string; slotName: string }> = {
  horizontal: {
    className: "w-full min-h-[90px] md:h-[90px]",
    slotName: "HORIZONTAL",
  },
  vertical: {
    className: "w-full h-[250px] md:h-[600px] md:w-[160px]",
    slotName: "VERTICAL",
  },
  square: {
    className: "w-full h-[250px]",
    slotName: "SQUARE",
  },
  banner: {
    className: "w-full h-[60px]",
    slotName: "BANNER",
  },
};

interface AdSlotProps {
  variant?: AdVariant;
  /** Override the AdSense slot id for this placement. */
  slot?: string;
  className?: string;
}

export function AdSlot({
  variant = "horizontal",
  slot,
  className = "",
}: AdSlotProps) {
  const size = SIZE_MAP[variant];
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  // Resolve slot id from prop, then from per-variant env, then fallback to ""
  const envSlot = process.env[`NEXT_PUBLIC_ADSENSE_${size.slotName}_SLOT`];
  const slotId = slot ?? envSlot ?? "";

  // No AdSense configured — show a stable placeholder so layout doesn't shift.
  if (!client || !slotId) {
    return (
      <div
        className={cn(
          "border border-dashed border-muted-foreground/20 rounded-lg bg-muted/30 flex items-center justify-center",
          size.className,
          className,
        )}
        aria-hidden="true"
      >
        <span className="text-xs text-muted-foreground/50 select-none">
          Advertisement
        </span>
      </div>
    );
  }

  // Real AdSense unit
  return (
    <div className={cn("overflow-hidden", size.className, className)}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "100%" }}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <Script id={`ads-${slotId}-${variant}`} strategy="afterInteractive">
        {`(window.adsbygoogle = window.adsbygoogle || []).push({});`}
      </Script>
    </div>
  );
}
