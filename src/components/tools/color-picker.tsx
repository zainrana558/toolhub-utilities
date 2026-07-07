"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export function ColorPicker() {
  const [hex, setHex] = useState("#6366f1");
  const [copied, setCopied] = useState<string | null>(null);

  const hexToRgb = (h: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : null;
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  };

  const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    h /= 360; s /= 100; l /= 100;
    let r: number, g: number, b: number;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  };

  const rgb = hexToRgb(hex) || { r: 99, g: 102, b: 241 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const handleHexChange = (val: string) => {
    if (/^#[0-9a-fA-F]{6}$/.test(val)) setHex(val);
  };

  const handleRgbChange = (channel: "r" | "g" | "b", val: number) => {
    const newRgb = { ...rgb, [channel]: val };
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleHslChange = (channel: "h" | "s" | "l", val: number) => {
    const newHsl = { ...hsl, [channel]: val };
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const complementary = rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
  const lighterRgb = hslToRgb(hsl.h, hsl.s, Math.min(95, hsl.l + 20));
  const darkerRgb = hslToRgb(hsl.h, hsl.s, Math.max(5, hsl.l - 20));

  return (
    <div className="space-y-6">
      {/* Color preview */}
      <Card>
        <CardContent className="p-0">
          <div className="h-32 md:h-48 rounded-t-lg" style={{ backgroundColor: hex }} />
          <div className="p-4 flex flex-wrap gap-2">
            <button
              onClick={() => copy(hex.toUpperCase(), "hex")}
              className="flex items-center justify-between flex-1 min-w-[100px] p-2 bg-muted/50 rounded text-sm hover:bg-muted transition-colors"
            >
              <span className="font-mono">{hex.toUpperCase()}</span>
              {copied === "hex" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
            </button>
            <button
              onClick={() => copy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, "rgb")}
              className="flex items-center justify-between flex-1 min-w-[100px] p-2 bg-muted/50 rounded text-sm hover:bg-muted transition-colors"
            >
              <span className="font-mono">rgb({rgb.r}, {rgb.g}, {rgb.b})</span>
              {copied === "rgb" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
            </button>
            <button
              onClick={() => copy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, "hsl")}
              className="flex items-center justify-between flex-1 min-w-[100px] p-2 bg-muted/50 rounded text-sm hover:bg-muted transition-colors"
            >
              <span className="font-mono">hsl({hsl.h}, {hsl.s}%, {hsl.l}%)</span>
              {copied === "hsl" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HEX input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">HEX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input value={hex} onChange={(e) => handleHexChange(e.target.value)} maxLength={7} className="font-mono" />
          </CardContent>
        </Card>

        {/* RGB sliders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">RGB</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["r", "g", "b"] as const).map((ch) => (
              <div key={ch} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <Label className="uppercase">{ch === "r" ? "Red" : ch === "g" ? "Green" : "Blue"}</Label>
                  <span className="font-mono text-muted-foreground">{rgb[ch]}</span>
                </div>
                <Slider value={[rgb[ch]]} onValueChange={([v]) => handleRgbChange(ch, v)} min={0} max={255} step={1} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* HSL sliders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">HSL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["h", "s", "l"] as const).map((ch) => (
              <div key={ch} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <Label>{ch === "h" ? "Hue" : ch === "s" ? "Saturation" : "Lightness"}</Label>
                  <span className="font-mono text-muted-foreground">{hsl[ch]}{ch !== "h" ? "%" : "deg"}</span>
                </div>
                <Slider
                  value={[hsl[ch]]}
                  onValueChange={([v]) => handleHslChange(ch, v)}
                  min={ch === "h" ? 0 : 0}
                  max={ch === "h" ? 360 : 100}
                  step={1}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Color variations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Color Variations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "Original", color: hex },
                { label: "Lighter", color: rgbToHex(lighterRgb.r, lighterRgb.g, lighterRgb.b) },
                { label: "Darker", color: rgbToHex(darkerRgb.r, darkerRgb.g, darkerRgb.b) },
                { label: "Complementary", color: complementary },
              ].map((v) => (
                <button
                  key={v.label}
                  onClick={() => copy(v.color, v.label)}
                  className="flex items-center gap-3 p-2 bg-muted/50 rounded hover:bg-muted transition-colors text-sm text-left"
                >
                  <div className="w-8 h-8 rounded border shrink-0" style={{ backgroundColor: v.color }} />
                  <div>
                    <p className="font-medium">{v.label}</p>
                    <p className="font-mono text-xs text-muted-foreground">{v.color.toUpperCase()}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Palette */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generated Palette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => {
              const lightness = 10 + i * 8;
              const c = hslToRgb(hsl.h, hsl.s, lightness);
              const cHex = rgbToHex(c.r, c.g, c.b);
              return (
                <button
                  key={i}
                  onClick={() => copy(cHex, `shade-${i}`)}
                  className="aspect-square rounded border border-border/50 hover:scale-110 transition-transform"
                  style={{ backgroundColor: cHex }}
                  title={cHex.toUpperCase()}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Dark</span>
            <span>Light</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}