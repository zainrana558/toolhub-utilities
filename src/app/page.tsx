"use client";

import { useEffect } from "react";
import { useToolStore } from "@/store/tool-store";
import { ToolGrid } from "@/components/tool-grid";
import { ToolView } from "@/components/tool-view";
import { tools } from "@/lib/tools-data";
import { Wrench } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { AdSlot } from "@/components/ad-slot";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function Home() {
  const { activeToolId, setActiveTool } = useToolStore();

  // Listen for custom tool-change events from related tools
  useEffect(() => {
    const handler = (e: Event) => {
      const toolId = (e as CustomEvent).detail;
      if (toolId) setActiveTool(toolId);
    };
    window.addEventListener("tool-change", handler);
    return () => window.removeEventListener("tool-change", handler);
  }, [setActiveTool]);

  // Update document title, meta, and URL hash when tool changes
  useEffect(() => {
    if (activeToolId) {
      const tool = tools.find((t) => t.id === activeToolId);
      if (tool) {
        document.title = tool.metaTitle;
        window.history.replaceState(null, "", `#tool-${tool.id}`);
      }
    } else {
      document.title = "ToolVerse - Free Online Tools | Word Counter, Password Generator, BMI Calculator & More";
      window.history.replaceState(null, "", "/");
    }
  }, [activeToolId]);

  // Read hash on mount to restore tool from URL
  useEffect(() => {
    const hash = window.location.hash.replace("#tool-", "");
    if (hash && tools.find((t) => t.id === hash)) {
      setActiveTool(hash);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <motion.button
              onClick={() => { setActiveTool(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              aria-label="ToolVerse - Home"
            >
              <motion.div
                animate={{ rotate: activeToolId ? 360 : 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <Wrench className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="font-bold text-lg">ToolVerse</span>
            </motion.button>

            {activeToolId && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 md:hidden"
              >
                <button
                  onClick={() => { setActiveTool(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="text-sm text-primary hover:underline"
                >
                  All Tools
                </button>
              </motion.div>
            )}

            <div className="flex items-center gap-3">
              <nav className="hidden md:flex items-center gap-4 text-sm">
                <button
                  onClick={() => { setActiveTool(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className={`transition-colors ${!activeToolId ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  All Tools
                </button>
                {tools.slice(0, 5).map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveTool(tool.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`transition-colors ${activeToolId === tool.id ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {tool.shortName}
                  </button>
                ))}
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {activeToolId ? (
                <motion.div
                  key={activeToolId}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <ToolView toolId={activeToolId} onBack={() => setActiveTool(null)} />
                </motion.div>
              ) : (
                <motion.div
                  key="tool-grid"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <ToolGrid onToolClick={(id) => {
                    setActiveTool(id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="border-t mt-auto"
      >
        <AdSlot variant="horizontal" className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="h-5 w-5 text-primary" />
                <span className="font-bold">ToolVerse</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Free online tools that work instantly in your browser. No sign-up, no data collection — just useful utilities for everyone.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-3">Popular Tools</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {tools.slice(0, 5).map((tool) => (
                  <li key={tool.id}>
                    <Link href={`/tools/${tool.id}`} className="hover:text-foreground transition-colors">
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="/tutorials" className="hover:text-foreground transition-colors">Tutorials</Link></li>
                <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
                <li><Link href="/api-docs" className="hover:text-foreground transition-colors">API Docs</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>Copyright 2025 ToolVerse. All rights reserved. All tools run locally in your browser.</p>
            <div className="flex items-center gap-4">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="mailto:hello@toolverse.com" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}