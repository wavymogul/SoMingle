import { NextResponse } from "next/server";
import { VIBE_COOKIE } from "@/lib/vibe-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(VIBE_COOKIE);
  return res;
}
