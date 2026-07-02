import crypto from "crypto";
import type { NextRequest } from "next/server";

// Constant-time string comparison to avoid leaking credential content via timing.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Single source of truth for admin authentication. Credentials come from
 * ADMIN_USERNAME / ADMIN_PASSWORD (with dev defaults) and may be provided via
 * headers or query params.
 */
export function isAdmin(req: NextRequest): boolean {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "Miller31!";
  const url = new URL(req.url);
  const user =
    req.headers.get("x-admin-username") || url.searchParams.get("username") || "";
  const pass =
    req.headers.get("x-admin-password") || url.searchParams.get("password") || "";
  return safeEqual(user, expectedUser) && safeEqual(pass, expectedPass);
}
