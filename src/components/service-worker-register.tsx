"use client";

/**
 * Registers /sw.js on the client only.
 *
 * Why a separate component instead of a <script> in layout.tsx:
 *   - We only want to register in production (`next dev` rebuilds chunks on
 *     every request, so caching them would serve stale code constantly).
 *   - We need access to `navigator.serviceWorker`, which doesn't exist during
 *     SSR — a client component is the cleanest way to guard that.
 *   - Mounting it as a sibling of `{children}` in <body> means it loads
 *     after first paint, so it never blocks the initial render.
 *
 * Returns null — this component renders no UI.
 */

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Defer registration until the page is idle so it doesn't compete with
    // first-paint network requests.
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          // Swallow — SW failure is non-fatal. The site still works online.
          console.warn("[sw] registration failed", err);
        });
    };

    if ("requestIdleCallback" in window) {
      (window as Window).requestIdleCallback(register, { timeout: 3000 });
    } else {
      setTimeout(register, 1500);
    }
  }, []);

  return null;
}
