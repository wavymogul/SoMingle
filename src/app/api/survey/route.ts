import { NextRequest, NextResponse } from "next/server";
import { insertSurvey } from "@/lib/db";
import { isEmail, str, strArr, clampScale } from "@/lib/validate";
import type { SurveyPayload } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    vibeWords: strArr(b.vibeWords).slice(0, 5),
    hopingToGain: strArr(b.hopingToGain),
    meetingPreference: str(b.meetingPreference),
    affordabilityImportance: clampScale(b.affordabilityImportance),
    likeMindedImportance: clampScale(b.likeMindedImportance),
    musicGenres: strArr(b.musicGenres),
    preferredEventMusic: str(b.preferredEventMusic),
    musicImportance: clampScale(b.musicImportance),
    attendForDj: str(b.attendForDj),
    discoverDjs: str(b.discoverDjs),
    hostsEvents: str(b.hostsEvents),
    eventType: str(b.eventType),
    creatorChallenges: strArr(b.creatorChallenges),
    howSomingleHelps: str(b.howSomingleHelps),
    dreamEvent: str(b.dreamEvent),
    wantsEarlyAccess: str(b.wantsEarlyAccess),
    rolesInterested: strArr(b.rolesInterested),
    belongingFeeling: str(b.belongingFeeling),
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
