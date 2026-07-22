import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Contact form submission endpoint.
 *
 * Storage strategy (no DB by default):
 *   1. Messages are written to the server log (captured by Vercel / any host).
 *   2. If CONTACT_FORM_WEBHOOK_URL is set (e.g. a Slack/Discord/Resend/Forms.io
 *      incoming webhook), the payload is POSTed there as JSON.
 *   3. If neither is configured, we still accept the submission and log it,
 *      so the form never appears broken to the user.
 *
 * Spam protection:
 *   - Honeypot field `company` (must remain empty)
 *   - Rate limit: max 5 submissions per IP per 10 minutes (in-memory)
 *   - Server-side validation with zod
 */

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  subject: z.enum([
    "Bug Report",
    "Feature Request",
    "General Question",
    "Partnership",
  ]),
  message: z.string().min(1).max(5000),
  // Honeypot — must be empty
  company: z.string().max(0).optional(),
});

type SubmissionRecord = { count: number; firstAt: number };
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 min
const RATE_LIMIT_MAX = 5;
const ipHits = new Map<string, SubmissionRecord>();

// Periodic cleanup so the map doesn't grow unbounded
function cleanupRateLimit(now: number) {
  for (const [ip, rec] of ipHits) {
    if (now - rec.firstAt > RATE_LIMIT_WINDOW_MS) ipHits.delete(ip);
  }
}

function rateLimit(ip: string): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  cleanupRateLimit(now);
  const rec = ipHits.get(ip);
  if (!rec) {
    ipHits.set(ip, { count: 1, firstAt: now });
    return { ok: true };
  }
  if (now - rec.firstAt > RATE_LIMIT_WINDOW_MS) {
    ipHits.set(ip, { count: 1, firstAt: now });
    return { ok: true };
  }
  rec.count += 1;
  if (rec.count > RATE_LIMIT_MAX) {
    const retryAfterSec = Math.ceil(
      (rec.firstAt + RATE_LIMIT_WINDOW_MS - now) / 1000,
    );
    return { ok: false, retryAfterSec };
  }
  return { ok: true };
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  ip: string;
  ts: string;
};

async function notifyWebhook(payload: ContactPayload) {
  const url = process.env.CONTACT_FORM_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `New ToolVerse contact form submission`,
        ...payload,
      }),
    });
  } catch (err) {
    // Don't fail the request if the webhook is misconfigured
    console.error("[contact] webhook failed:", err);
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  const rl = rateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec ?? 60) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Validation failed.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const { name, email, subject, message } = parsed.data;

  // Always log — hosting platform captures stdout/stderr
  console.log("[contact] new submission", {
    name,
    email,
    subject,
    messageLength: message.length,
    ip,
    ts: new Date().toISOString(),
  });

  // Forward to external webhook if configured
  await notifyWebhook({ name, email, subject, message, ip, ts: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
