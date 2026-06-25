import fs from "fs";
import path from "path";
import { getStore } from "@netlify/blobs";
import type {
  SurveyPayload,
  SurveyRecord,
  WaitlistPayload,
  WaitlistRecord,
} from "./types";

/**
 * Storage layer for survey + waitlist data.
 *
 * On Netlify (serverless, ephemeral filesystem) we persist to Netlify Blobs.
 * For local `next dev` we fall back to JSON files under ./data so the app works
 * with zero configuration. `netlify dev` sets NETLIFY=true and provides the
 * Blobs context, so it exercises the same path as production.
 */

const SURVEY_STORE = "somingle-surveys";
const WAITLIST_STORE = "somingle-waitlist";

function blobsEnabled(): boolean {
  return (
    process.env.NETLIFY === "true" || !!process.env.NETLIFY_BLOBS_CONTEXT
  );
}

// Numeric, sortable, collision-resistant id (safe integer for low volume).
function nextId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

// Zero-padded so lexical key order matches numeric order.
const surveyKey = (id: number) => String(id).padStart(20, "0");

// Reversible, unique-per-email key for idempotent waitlist upserts.
const emailKey = (email: string) =>
  Buffer.from(email.trim().toLowerCase()).toString("base64url");

// ---------------------------------------------------------------- file backend

function dataDir(): string {
  const dir = process.env.SOMINGLE_DB_PATH
    ? path.dirname(process.env.SOMINGLE_DB_PATH)
    : path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function readFile<T>(name: string): T[] {
  try {
    const p = path.join(dataDir(), name);
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, "utf8")) as T[];
  } catch {
    return [];
  }
}

function writeFile<T>(name: string, rows: T[]): void {
  fs.writeFileSync(path.join(dataDir(), name), JSON.stringify(rows, null, 2));
}

// --------------------------------------------------------------- blobs backend

async function blobAll<T>(storeName: string): Promise<T[]> {
  const store = getStore(storeName);
  const { blobs } = await store.list();
  const items = await Promise.all(
    blobs.map((b) => store.get(b.key, { type: "json" }))
  );
  return items.filter((x): x is T => x != null);
}

// -------------------------------------------------------------------- surveys

export async function insertSurvey(p: SurveyPayload): Promise<SurveyRecord> {
  const record: SurveyRecord = {
    id: nextId(),
    createdAt: new Date().toISOString(),
    ...p,
  };

  if (blobsEnabled()) {
    await getStore(SURVEY_STORE).setJSON(surveyKey(record.id), record);
  } else {
    const rows = readFile<SurveyRecord>("surveys.json");
    rows.push(record);
    writeFile("surveys.json", rows);
  }
  return record;
}

// Backfill any missing fields so records written by older versions of the app
// (before new survey questions existed) are always complete. Without this,
// consumers that iterate array fields (e.g. the admin analytics) would crash on
// `undefined`.
function normalizeSurvey(r: Partial<SurveyRecord>): SurveyRecord {
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;
  return {
    id: num(r.id, 0),
    createdAt: s(r.createdAt) || new Date(0).toISOString(),
    fullName: s(r.fullName),
    email: s(r.email),
    phone: r.phone,
    instagram: r.instagram,
    ageRange: s(r.ageRange),
    city: s(r.city),
    occupation: s(r.occupation),
    status: s(r.status),
    eventFrustrations: s(r.eventFrustrations),
    goingOutLess: s(r.goingOutLess),
    worthAttending: s(r.worthAttending),
    spentAndDisappointed: s(r.spentAndDisappointed),
    disappointedWhy: s(r.disappointedWhy),
    experienceInterests: arr(r.experienceInterests),
    motivation: s(r.motivation),
    missingInCity: s(r.missingInCity),
    vibeWords: arr(r.vibeWords),
    hopingToGain: arr(r.hopingToGain),
    meetingPreference: s(r.meetingPreference),
    affordabilityImportance: num(r.affordabilityImportance, 5),
    likeMindedImportance: num(r.likeMindedImportance, 5),
    musicGenres: arr(r.musicGenres),
    preferredEventMusic: s(r.preferredEventMusic),
    musicImportance: num(r.musicImportance, 5),
    attendForDj: s(r.attendForDj),
    discoverDjs: s(r.discoverDjs),
    hostsEvents: s(r.hostsEvents),
    eventType: s(r.eventType),
    creatorChallenges: arr(r.creatorChallenges),
    howSomingleHelps: s(r.howSomingleHelps),
    dreamEvent: s(r.dreamEvent),
    wantsEarlyAccess: s(r.wantsEarlyAccess),
    rolesInterested: arr(r.rolesInterested),
    belongingFeeling: s(r.belongingFeeling),
  };
}

export async function getSurveys(): Promise<SurveyRecord[]> {
  const rows = blobsEnabled()
    ? await blobAll<Partial<SurveyRecord>>(SURVEY_STORE)
    : readFile<Partial<SurveyRecord>>("surveys.json");
  return rows.map(normalizeSurvey).sort((a, b) => b.id - a.id);
}

// ------------------------------------------------------------------ waitlist

export async function insertWaitlist(
  p: WaitlistPayload
): Promise<WaitlistRecord> {
  if (blobsEnabled()) {
    const store = getStore(WAITLIST_STORE);
    const key = emailKey(p.email);
    const existing = (await store.get(key, {
      type: "json",
    })) as WaitlistRecord | null;
    const record: WaitlistRecord = existing
      ? { ...existing, name: p.name }
      : {
          id: nextId(),
          createdAt: new Date().toISOString(),
          name: p.name,
          email: p.email,
        };
    await store.setJSON(key, record);
    return record;
  }

  const rows = readFile<WaitlistRecord>("waitlist.json");
  const idx = rows.findIndex(
    (r) => r.email.toLowerCase() === p.email.toLowerCase()
  );
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], name: p.name };
    writeFile("waitlist.json", rows);
    return rows[idx];
  }
  const record: WaitlistRecord = {
    id: nextId(),
    createdAt: new Date().toISOString(),
    name: p.name,
    email: p.email,
  };
  rows.push(record);
  writeFile("waitlist.json", rows);
  return record;
}

export async function getWaitlist(): Promise<WaitlistRecord[]> {
  const rows = blobsEnabled()
    ? await blobAll<WaitlistRecord>(WAITLIST_STORE)
    : readFile<WaitlistRecord>("waitlist.json");
  return rows.sort((a, b) => b.id - a.id);
}
