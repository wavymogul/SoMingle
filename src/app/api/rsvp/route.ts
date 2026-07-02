import { NextRequest, NextResponse } from "next/server";
import { upsertRsvp, getRsvps } from "@/lib/db";
import { decodeProfile, VIBE_COOKIE } from "@/lib/spotify";
import { profileSimilarity, MATCH_THRESHOLD } from "@/lib/compat";
import { isAdmin } from "@/lib/auth";
import { isEmail, str } from "@/lib/validate";
import { checkLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public: RSVP to an event. Snapshots the requester's vibe profile (if they've
// connected music) so future attendees can be matched against the room.
export async function POST(req: NextRequest) {
  if (!checkLimit(req, "rsvp")) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const eventId = Number(b.eventId);
  const name = str(b.name);
  const email = str(b.email).toLowerCase();

  if (!Number.isFinite(eventId) || eventId === 0) {
    return NextResponse.json({ error: "Valid event required." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 }
    );
  }

  const vibe = decodeProfile(req.cookies.get(VIBE_COOKIE)?.value) ?? undefined;

  try {
    const record = await upsertRsvp({ eventId, name, email, vibe });
    return NextResponse.json(
      { ok: true, id: record.id, hasVibe: Boolean(vibe) },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to store RSVP:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET:
//  - default: privacy-safe aggregates per event — how many are interested, and
//    how many of those share the requester's vibe (computed server-side from
//    their cookie; names/emails are never exposed publicly).
//  - ?admin=1 with admin credentials: full RSVP records for the dashboard.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  try {
    const rsvps = await getRsvps();

    if (url.searchParams.get("admin") === "1") {
      if (!isAdmin(req)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.json({ ok: true, rsvps });
    }

    const profile = decodeProfile(req.cookies.get(VIBE_COOKIE)?.value);
    const summary: Record<string, { going: number; matches: number }> = {};
    for (const r of rsvps) {
      const s = (summary[String(r.eventId)] ??= { going: 0, matches: 0 });
      s.going++;
      if (
        profile &&
        r.vibe &&
        profileSimilarity(profile, r.vibe) >= MATCH_THRESHOLD
      ) {
        s.matches++;
      }
    }

    return NextResponse.json({
      ok: true,
      hasProfile: Boolean(profile),
      summary,
    });
  } catch (err) {
    console.error("Failed to load RSVPs:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
