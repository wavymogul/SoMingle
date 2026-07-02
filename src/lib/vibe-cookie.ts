import type { VibeProfile } from "./vibe";

// The vibe profile travels in an httpOnly cookie shared by the Spotify and
// Apple Music flows, and is snapshotted into RSVPs for compatibility matching.

export const VIBE_COOKIE = "somingle_vibe";

export const VIBE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export function encodeProfile(p: VibeProfile): string {
  return Buffer.from(JSON.stringify(p)).toString("base64url");
}

/**
 * Decode AND sanitize. The cookie is client-controlled, so every field is
 * re-validated: a hand-crafted cookie (e.g. topGenres set to a string) must
 * never produce a profile that crashes downstream scoring — especially since
 * RSVP snapshots persist these profiles and other visitors' match counts are
 * computed against them.
 */
export function decodeProfile(raw: string | undefined): VibeProfile | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as Partial<VibeProfile> | null;
    if (!p || typeof p !== "object") return null;

    const unit = (v: unknown, fallback: number) =>
      typeof v === "number" && Number.isFinite(v)
        ? Math.min(1, Math.max(0, v))
        : fallback;
    const strArr = (v: unknown) =>
      Array.isArray(v)
        ? v.filter((x): x is string => typeof x === "string").slice(0, 12)
        : [];

    return {
      connectedAt: typeof p.connectedAt === "string" ? p.connectedAt : "",
      source: p.source === "apple" ? "apple" : "spotify",
      topGenres: strArr(p.topGenres),
      topArtists: strArr(p.topArtists),
      energy: unit(p.energy, 0.5),
      danceability: unit(p.danceability, 0.5),
      valence: unit(p.valence, 0.5),
    };
  } catch {
    return null;
  }
}
