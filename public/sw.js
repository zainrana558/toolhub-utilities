/**
 * ToolVerse service worker — App Shell + offline fallback.
 *
 * Scope: this SW only intercepts same-origin GET requests. It deliberately
 * does NOT cache:
 *   - /_next/static/chunks/*  (content-hashed per build; caching them across
 *     deploys would serve stale JS that doesn't match the new HTML → broken app)
 *   - /api/*                  (every API route is dynamic; caching would
 *     return stale conversion results, which is wrong for a file-conversion site)
 *   - third-party (AdSense, fonts)  — those have their own caching policies
 *
 * Strategy:
 *   - Navigation requests (HTML page loads) → network-first, fall back to
 *     cached app shell if offline. This means users get fresh content when
 *     online but still see *something* (the homepage) when their connection
 *     drops mid-session.
 *   - Static assets that we explicitly precache (logo, manifest) →
 *     cache-first, since they basically never change.
 *
 * The SW self-registers from `ServiceWorkerRegister` (a tiny client component
 * mounted in the root layout). It activates via `skipWaiting` +
 * `clients.claim` so the first install takes effect immediately rather than
 * waiting for all tabs to close.
 */

const VERSION = "toolverse-sw-v1";
const APP_SHELL_CACHE = `${VERSION}-app-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

// Minimal set of URLs to precache on install. Keep this short — every entry
// is downloaded on every SW install, so bloating this list slows down the
// first paint for first-time visitors.
const PRECACHE_URLS = [
  "/",
  "/logo.svg",
  "/manifest.json",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      // `addAll` is atomic — if any URL fails, none are cached. We use
      // individual `put` calls instead so a single failed fetch (e.g.
      // favicon 404 in dev) doesn't kill the whole precache.
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "no-cache" });
            if (res.ok) cache.put(url, res);
          } catch {
            /* swallow — precache is best-effort */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Delete caches from any previous SW version. This is the standard
      // migration pattern: bump VERSION → old caches get evicted on activate.
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle same-origin GET. POST/PUT (file uploads, contact form) and
  // cross-origin requests (AdSense, fonts) bypass the SW entirely.
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API responses — they're dynamic and frequently return
  // binary file downloads that would be wrong if served stale.
  if (url.pathname.startsWith("/api/")) return;

  // Never cache Next.js chunk files — they're content-hashed per build, so a
  // cached chunk from deploy N would mismatch the HTML from deploy N+1 and
  // crash the app with "ChunkLoadError".
  if (url.pathname.startsWith("/_next/static/chunks/")) return;

  // Navigation requests (HTML page loads): network-first, fall back to
  // cached app shell. This gives users fresh content when online but a
  // working homepage when their connection drops mid-session.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          // Cache a copy of the latest HTML so it's available next time
          // we're offline.
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        } catch {
          // Network failed — try the exact URL first, then fall back to
          // the cached homepage (app shell) for any path.
          const cached =
            (await caches.match(req)) || (await caches.match("/"));
          if (cached) return cached;
          return new Response(
            "<h1>Offline</h1><p>You're offline and this page isn't cached. Try the homepage.</p>",
            { status: 503, headers: { "Content-Type": "text/html" } }
          );
        }
      })()
    );
    return;
  }

  // Other same-origin GETs (logo, manifest, static images, etc.):
  // cache-first with network fallback. If it's in the cache, serve it
  // instantly; otherwise fetch, cache a copy, and return.
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const fresh = await fetch(req);
        // Only cache successful, basic (non-opaque) responses to avoid
        // caching error pages.
        if (fresh.ok && fresh.type === "basic") {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(req, fresh.clone()).catch(() => {});
        }
        return fresh;
      } catch {
        // Offline and not cached — there's nothing useful to return.
        return new Response("Offline", { status: 503 });
      }
    })()
  );
});
