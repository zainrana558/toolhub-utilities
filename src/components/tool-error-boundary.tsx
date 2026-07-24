"use client";

/**
 * Error boundary for tool components.
 *
 * Why: every tool component is lazy-loaded via `next/dynamic`, but if a chunk
 * fails to load (network blip, deploy mismatch) or a tool throws at render
 * time (bad prop shape, library quirk on an edge-case file), React unmounts
 * the *entire* page tree — including the header, footer, SEO content, and
 * related-tool cards. Users see a blank page or a Next.js error overlay.
 *
 * Wrapping each `<ToolComponent />` in this boundary confines the blast radius
 * to the tool card itself. The surrounding page (and the rest of the site)
 * keeps working, and the user gets a "Try again" button that re-mounts the
 * tool from scratch.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Tool name to show in the error message (more friendly than the slug). */
  toolName?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ToolErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? "Unknown error" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console — server-side logging would require an API call which
    // we deliberately avoid for privacy reasons (no telemetry on user files).
    console.error("[ToolErrorBoundary] tool crashed", {
      tool: this.props.toolName,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  reset = () => this.setState({ hasError: false, message: "" });

  render() {
    if (!this.state.hasError) return this.props.children;

    const label = this.props.toolName ?? "This tool";

    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 space-y-3"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-destructive">
              {label} hit an unexpected error.
            </p>
            <p className="text-sm text-muted-foreground">
              Your file wasn&apos;t damaged and nothing was uploaded. Reload the
              tool to try again — if the error keeps happening, try a different
              file or refresh the page.
            </p>
            {this.state.message && (
              <p className="text-xs font-mono text-muted-foreground/80 break-all">
                {this.state.message}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="default" onClick={this.reset}>
            <RotateCcw className="h-4 w-4 mr-1" /> Try again
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Reload page
          </Button>
        </div>
      </div>
    );
  }
}
