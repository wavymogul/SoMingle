import type { NextRequest } from "next/server";

/**
 * Lightweight fixed-window rate limiter, keyed per client IP + route.
 *
 * Best-effort by design: state is in-memory, so on serverless hosts each warm
 * function instance keeps its own counters. That still throttles the realistic
 * abuse case (one client hammering an endpoint) without adding an external
 * store. If launch traffic ever justifies it, swap this for a shared store
 * (e.g. Upstash Redis) behind the same interface.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-nf-client-connection-ip") || // Netlify
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** Returns true when the request is allowed, false when over the limit. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();

  // Opportunistic cleanup so the map can't grow unbounded.
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.resetAt < now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

const MINUTE = 60_000;

/** Route-specific limits, kept in one place so they're easy to tune. */
export const LIMITS = {
  survey: { limit: 5, windowMs: 10 * MINUTE },
  waitlist: { limit: 5, windowMs: 10 * MINUTE },
  appleVibe: { limit: 10, windowMs: 10 * MINUTE },
  rsvp: { limit: 8, windowMs: 10 * MINUTE },
  admin: { limit: 60, windowMs: MINUTE }, // slows credential brute-forcing
} as const;

export function checkLimit(
  req: NextRequest,
  name: keyof typeof LIMITS
): boolean {
  const { limit, windowMs } = LIMITS[name];
  return rateLimit(`${name}:${clientIp(req)}`, limit, windowMs);
}
