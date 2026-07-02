import { NextResponse } from "next/server";
import { appleConfigured, buildDeveloperToken } from "@/lib/apple";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns a MusicKit developer token for the browser (safe to expose).
export async function GET() {
  if (!appleConfigured()) {
    return NextResponse.json({ configured: false });
  }
  try {
    return NextResponse.json({ configured: true, token: buildDeveloperToken() });
  } catch (err) {
    console.error("Failed to build Apple developer token:", err);
    return NextResponse.json(
      { configured: false, error: "token" },
      { status: 500 }
    );
  }
}
