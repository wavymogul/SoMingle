import fs from "fs";
import path from "path";
import { getStore } from "@netlify/blobs";
import type {
  SurveyPayload,
  SurveyRecord,
  WaitlistPayload,
  WaitlistRecord,
  EventPayload,
  EventRecord,
  RsvpPayload,
  RsvpRecord,
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
const EVENT_STORE = "somingle-events";
const RSVP_STORE = "somingle-rsvps";

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

// ------------------------------------------------------------ hot-path cache

// Events and RSVPs are read on every /events page view, and the blob backend
// pays a list + per-key fetch each time. A short per-instance TTL cache keeps
// that off the hot path; writes bust it immediately (other instances converge
// within the TTL, which is fine for counts).
const READ_TTL_MS = 30_000;
const readCache = new Map<string, { at: number; data: unknown }>();

function cacheGet<T>(key: string): T | null {
  const hit = readCache.get(key);
  return hit && Date.now() - hit.at < READ_TTL_MS ? (hit.data as T) : null;
}
const cacheSet = (key: string, data: unknown) =>
  readCache.set(key, { at: Date.now(), data });
const cacheBust = (key: string) => readCache.delete(key);

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

// -------------------------------------------------------------------- events

export async function insertEvent(p: EventPayload): Promise<EventRecord> {
  const record: EventRecord = {
    id: nextId(),
    createdAt: new Date().toISOString(),
    ...p,
  };
  if (blobsEnabled()) {
    await getStore(EVENT_STORE).setJSON(surveyKey(record.id), record);
  } else {
    const rows = readFile<EventRecord>("events.json");
    rows.push(record);
    writeFile("events.json", rows);
  }
  cacheBust("events");
  return record;
}

// Sort upcoming-first: trending events float to the top, then by event date.
function sortEvents(rows: EventRecord[]): EventRecord[] {
  return rows.sort((a, b) => {
    if (a.trending !== b.trending) return a.trending ? -1 : 1;
    return a.date.localeCompare(b.date);
  });
}

export async function getStoredEvents(): Promise<EventRecord[]> {
  const hit = cacheGet<EventRecord[]>("events");
  if (hit) return hit;
  const rows = blobsEnabled()
    ? await blobAll<EventRecord>(EVENT_STORE)
    : readFile<EventRecord>("events.json");
  const sorted = sortEvents(rows);
  cacheSet("events", sorted);
  return sorted;
}

export async function updateEvent(
  id: number,
  payload: EventPayload
): Promise<EventRecord | null> {
  if (blobsEnabled()) {
    const store = getStore(EVENT_STORE);
    const key = surveyKey(id);
    const existing = (await store.get(key, {
      type: "json",
    })) as EventRecord | null;
    if (!existing) return null;
    const updated: EventRecord = { ...existing, ...payload, id, createdAt: existing.createdAt };
    await store.setJSON(key, updated);
    cacheBust("events");
    return updated;
  }
  const rows = readFile<EventRecord>("events.json");
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  rows[idx] = { ...rows[idx], ...payload, id, createdAt: rows[idx].createdAt };
  writeFile("events.json", rows);
  cacheBust("events");
  return rows[idx];
}

export async function deleteEvent(id: number): Promise<void> {
  if (blobsEnabled()) {
    await getStore(EVENT_STORE).delete(surveyKey(id));
  } else {
    const rows = readFile<EventRecord>("events.json").filter((r) => r.id !== id);
    writeFile("events.json", rows);
  }
  cacheBust("events");
}

// --------------------------------------------------------------------- rsvps

// Idempotent per (event, email): re-RSVPing updates the name and refreshes the
// vibe snapshot instead of duplicating.
export async function upsertRsvp(p: RsvpPayload): Promise<RsvpRecord> {
  const email = p.email.toLowerCase();
  try {
    if (blobsEnabled()) {
      const store = getStore(RSVP_STORE);
      const key = `${surveyKey(p.eventId)}-${emailKey(email)}`;
      const existing = (await store.get(key, {
        type: "json",
      })) as RsvpRecord | null;
      const record: RsvpRecord = existing
        ? { ...existing, name: p.name, vibe: p.vibe ?? existing.vibe }
        : {
            id: nextId(),
            createdAt: new Date().toISOString(),
            ...p,
            email,
          };
      await store.setJSON(key, record);
      return record;
    }

    const rows = readFile<RsvpRecord>("rsvps.json");
    const idx = rows.findIndex(
      (r) => r.eventId === p.eventId && r.email.toLowerCase() === email
    );
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], name: p.name, vibe: p.vibe ?? rows[idx].vibe };
      writeFile("rsvps.json", rows);
      return rows[idx];
    }
    const record: RsvpRecord = {
      id: nextId(),
      createdAt: new Date().toISOString(),
      ...p,
      email,
    };
    rows.push(record);
    writeFile("rsvps.json", rows);
    return record;
  } finally {
    // Bust after the write so a concurrent read can't re-cache stale data.
    cacheBust("rsvps");
  }
}

export async function getRsvps(): Promise<RsvpRecord[]> {
  const hit = cacheGet<RsvpRecord[]>("rsvps");
  if (hit) return hit;
  const rows = blobsEnabled()
    ? await blobAll<RsvpRecord>(RSVP_STORE)
    : readFile<RsvpRecord>("rsvps.json");
  const sorted = rows.sort((a, b) => b.id - a.id);
  cacheSet("rsvps", sorted);
  return sorted;
}
