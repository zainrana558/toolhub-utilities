"use client";

import { useState } from "react";
import { tools, toolCategories } from "@/lib/tools-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdSlot } from "@/components/ad-slot";
import { motion } from "framer-motion";

interface ToolGridProps {
  onToolClick: (toolId: string) => void;
}

export function ToolGrid({ onToolClick }: ToolGridProps) {
  const categorizedTools = toolCategories.map((cat) => ({
    ...cat,
    tools: tools.filter((t) => t.category === cat.id),
  }));

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center space-y-4 py-4 md:py-8">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
          Free Online Tools
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          Fast, free, and privacy-focused online tools. No sign-up, no data collection — just useful utilities that work instantly in your browser.
        </p>
      </section>

      <AdSlot variant="horizontal" />

      {categorizedTools.map((category) => (
        <section key={category.id} id={`${category.id}-tools`}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl md:text-2xl font-semibold">{category.name}</h2>
            <Badge variant="secondary" className="text-xs">
              {category.tools.length} tools
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {category.tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 group h-full"
                    onClick={() => onToolClick(tool.id)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>
      ))}

      <AdSlot variant="horizontal" />

      {/* FAQ Section for SEO */}
      <section className="space-y-6 py-8">
        <h2 className="text-2xl font-semibold text-center">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          <FAQItem
            question="Are these tools free to use?"
            answer="Yes, all tools on this website are completely free to use with no registration, sign-up, or hidden fees. You can use them as many times as you want without any limitations."
          />
          <FAQItem
            question="Is my data safe and private?"
            answer="Absolutely. All tools run entirely in your browser — no data is sent to any server. Your text, passwords, calculations, and files never leave your device. We don't track, store, or collect any of the data you process through our tools."
          />
          <FAQItem
            question="Do I need to create an account?"
            answer="No. There is no account creation, sign-up, or login required. Simply visit the tool you need and start using it immediately."
          />
          <FAQItem
            question="Can I use these tools on my phone?"
            answer="Yes! All tools are fully responsive and work on any device — smartphones, tablets, laptops, and desktops. The interface adapts to your screen size for the best experience."
          />
        </div>
      </section>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 flex justify-between items-center hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-sm">{question}</span>
        <span className="text-muted-foreground text-lg leading-none">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-muted-foreground">
          {answer}
        </div>
      )}
    </div>
  );
}