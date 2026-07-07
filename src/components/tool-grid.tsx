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

// Stagger container for tool cards
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

// Individual card animation
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// Category section animation
const sectionVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

export function ToolGrid({ onToolClick }: ToolGridProps) {
  const categorizedTools = toolCategories.map((cat) => ({
    ...cat,
    tools: tools.filter((t) => t.category === cat.id),
  }));

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.section
        className="text-center space-y-4 py-4 md:py-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.h1
          className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          Free Online Tools
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Fast, free, and privacy-focused online tools. No sign-up, no data collection — just useful utilities that work instantly in your browser.
        </motion.p>
        {/* Decorative gradient line */}
        <motion.div
          className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/60"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 96, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeInOut" }}
        />
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <AdSlot variant="horizontal" />
      </motion.div>

      {categorizedTools.map((category, catIndex) => (
        <motion.section
          key={category.id}
          id={`${category.id}-tools`}
          variants={sectionVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div
            className="flex items-center gap-3 mb-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h2 className="text-xl md:text-2xl font-semibold">{category.name}</h2>
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.2 }}
            >
              <Badge variant="secondary" className="text-xs">
                {category.tools.length} tools
              </Badge>
            </motion.div>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-30px" }}
          >
            {category.tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  variants={cardVariants}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200 group h-full overflow-hidden"
                    onClick={() => onToolClick(tool.id)}
                  >
                    <CardContent className="p-5 relative">
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
                      <div className="relative flex items-start gap-4">
                        <motion.div
                          className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors"
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <Icon className="h-5 w-5" />
                        </motion.div>
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
          </motion.div>
        </motion.section>
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <AdSlot variant="horizontal" />
      </motion.div>

      {/* FAQ Section for SEO */}
      <motion.section
        className="space-y-6 py-8"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
      >
        <motion.h2
          className="text-2xl font-semibold text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          Frequently Asked Questions
        </motion.h2>
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
      </motion.section>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className="border rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 flex justify-between items-center hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-sm">{question}</span>
        <motion.span
          className="text-muted-foreground text-lg leading-none"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          +
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: open ? "auto" : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4 text-sm text-muted-foreground">
          {answer}
        </div>
      </motion.div>
    </motion.div>
  );
}