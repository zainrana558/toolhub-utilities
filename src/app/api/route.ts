import { NextResponse } from "next/server";

/**
 * Lightweight health check for uptime monitors and container orchestrators.
 *
 * GET /api  -> 200 { ok, name, version, time }
 *
 * Add deeper checks (DB ping, external API reachability, etc.) only when
 * you actually wire up those dependencies — don't lie to monitors.
 */
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      name: "toolverse",
      version: "0.2.0",
      time: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
