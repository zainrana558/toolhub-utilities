"use client";

export function AdSlot({ variant = "horizontal", className = "" }: { variant?: "horizontal" | "vertical" | "square" | "banner"; className?: string }) {
  const sizeMap = {
    horizontal: "w-full h-[90px] md:h-[90px]",
    vertical: "w-full h-[250px] md:h-[600px] md:w-[160px]",
    square: "w-full h-[250px]",
    banner: "w-full h-[60px]",
  };

  return (
    <div className={`${sizeMap[variant]} border border-dashed border-muted-foreground/20 rounded-lg bg-muted/30 flex items-center justify-center ${className}`}>
      <span className="text-xs text-muted-foreground/50 select-none">Advertisement</span>
    </div>
  );
}