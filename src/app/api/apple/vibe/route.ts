import { NextRequest, NextResponse } from "next/server";
import { buildGenreProfile } from "@/lib/vibe";
import { encodeProfile, VIBE_COOKIE } from "@/lib/spotify";
import { strArr } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Receives the genres/artists MusicKit fetched on the client and stores a
// vibe profile in the same cookie the Spotify flow uses.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const genres = strArr(b.genres);
  const artists = strArr(b.artists);

  if (genres.length === 0 && artists.length === 0) {
    return NextResponse.json(
      { error: "No listening data provided." },
      { status: 400 }
    );
  }

  const profile = buildGenreProfile({ genres, artists, source: "apple" });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(VIBE_COOKIE, encodeProfile(profile), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
