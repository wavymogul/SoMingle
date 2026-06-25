import { NextRequest, NextResponse } from "next/server";
import { insertSurvey } from "@/lib/db";
import type { SurveyPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isEmail = (v: unknown) =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const clampScale = (v: unknown): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 5;
  return Math.min(10, Math.max(1, Math.round(n)));
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  if (!str(b.fullName)) {
    return NextResponse.json(
      { error: "Your name is required." },
      { status: 400 }
    );
  }
  if (!isEmail(b.email)) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 }
    );
  }

  const payload: SurveyPayload = {
    fullName: str(b.fullName),
    email: str(b.email).toLowerCase(),
    phone: str(b.phone) || undefined,
    instagram: str(b.instagram) || undefined,
    ageRange: str(b.ageRange),
    city: str(b.city),
    occupation: str(b.occupation),
    status: str(b.status),
    eventFrustrations: str(b.eventFrustrations),
    goingOutLess: str(b.goingOutLess),
    worthAttending: str(b.worthAttending),
    spentAndDisappointed: str(b.spentAndDisappointed),
    disappointedWhy: str(b.disappointedWhy),
    experienceInterests: strArr(b.experienceInterests),
    motivation: str(b.motivation),
    missingInCity: str(b.missingInCity),
    hopingToGain: strArr(b.hopingToGain),
    meetingPreference: str(b.meetingPreference),
    affordabilityImportance: clampScale(b.affordabilityImportance),
    likeMindedImportance: clampScale(b.likeMindedImportance),
    hostsEvents: str(b.hostsEvents),
    eventType: str(b.eventType),
    creatorChallenges: strArr(b.creatorChallenges),
    howSomingleHelps: str(b.howSomingleHelps),
    dreamEvent: str(b.dreamEvent),
    wantsEarlyAccess: str(b.wantsEarlyAccess),
    rolesInterested: strArr(b.rolesInterested),
  };

  try {
    const record = await insertSurvey(payload);
    return NextResponse.json({ ok: true, id: record.id }, { status: 201 });
  } catch (err) {
    console.error("Failed to store survey:", err);
    return NextResponse.json(
      { error: "Something went wrong saving your response." },
      { status: 500 }
    );
  }
}
