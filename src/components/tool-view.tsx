"use client";

import { tools } from "@/lib/tools-data";
import { AdSlot } from "@/components/ad-slot";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ThumbsUp, Share2 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic imports for code splitting
const WordCounter = dynamic(() => import("@/components/tools/word-counter").then((m) => ({ default: m.WordCounter })), { ssr: false });
const PasswordGenerator = dynamic(() => import("@/components/tools/password-generator").then((m) => ({ default: m.PasswordGenerator })), { ssr: false });
const BMICalculator = dynamic(() => import("@/components/tools/bmi-calculator").then((m) => ({ default: m.BMICalculator })), { ssr: false });
const PercentageCalculator = dynamic(() => import("@/components/tools/percentage-calculator").then((m) => ({ default: m.PercentageCalculator })), { ssr: false });
const AgeCalculator = dynamic(() => import("@/components/tools/age-calculator").then((m) => ({ default: m.AgeCalculator })), { ssr: false });
const LoanCalculator = dynamic(() => import("@/components/tools/loan-calculator").then((m) => ({ default: m.LoanCalculator })), { ssr: false });
const UnitConverter = dynamic(() => import("@/components/tools/unit-converter").then((m) => ({ default: m.UnitConverter })), { ssr: false });
const CaseConverter = dynamic(() => import("@/components/tools/case-converter").then((m) => ({ default: m.CaseConverter })), { ssr: false });
const ColorPicker = dynamic(() => import("@/components/tools/color-picker").then((m) => ({ default: m.ColorPicker })), { ssr: false });
const JSONFormatter = dynamic(() => import("@/components/tools/json-formatter").then((m) => ({ default: m.JSONFormatter })), { ssr: false });

const toolComponents: Record<string, React.ComponentType> = {
  "word-counter": WordCounter,
  "password-generator": PasswordGenerator,
  "bmi-calculator": BMICalculator,
  "percentage-calculator": PercentageCalculator,
  "age-calculator": AgeCalculator,
  "loan-calculator": LoanCalculator,
  "unit-converter": UnitConverter,
  "case-converter": CaseConverter,
  "color-picker": ColorPicker,
  "json-formatter": JSONFormatter,
};

interface ToolViewProps {
  toolId: string;
  onBack: () => void;
}

export function ToolView({ toolId, onBack }: ToolViewProps) {
  const tool = tools.find((t) => t.id === toolId);
  const ToolComponent = toolComponents[toolId];

  if (!tool || !ToolComponent) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Tool not found.</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Tools
        </Button>
      </div>
    );
  }

  const relatedTools = tools.filter((t) => t.category === tool.category && t.id !== tool.id).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Tool header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{tool.category}</Badge>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">{tool.name}</h1>
        <p className="text-muted-foreground max-w-3xl">{tool.longDescription}</p>
      </div>

      <AdSlot variant="horizontal" />

      {/* Main tool content */}
      <div className="max-w-4xl">
        <ToolComponent />
      </div>

      <AdSlot variant="horizontal" />

      {/* Related tools */}
      {relatedTools.length > 0 && (
        <section className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Related Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedTools.map((rt) => {
              const Icon = rt.icon;
              return (
                <Card
                  key={rt.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    window.scrollTo(0, 0);
                    // Trigger tool change via a custom event
                    window.dispatchEvent(new CustomEvent("tool-change", { detail: rt.id }));
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{rt.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{rt.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Tool footer CTA */}
      <Card className="bg-primary/5">
        <CardContent className="p-6 text-center space-y-3">
          <h3 className="font-semibold">Found this tool helpful?</h3>
          <p className="text-sm text-muted-foreground">
            Share it with others who might need it. All tools are free and work on any device.
          </p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: tool.name, text: tool.description, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-1" /> Share
            </Button>
            <Button variant="outline" size="sm" onClick={onBack}>
              <ThumbsUp className="h-4 w-4 mr-1" /> Browse More Tools
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}