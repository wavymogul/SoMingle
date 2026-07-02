import type { EventRecord } from "./types";

// A user's "vibe" derived from their Spotify listening (or, later, other
// signals). Small enough to live in a cookie.
export type VibeProfile = {
  connectedAt: string;
  source: "spotify" | "apple";
  topGenres: string[];
  topArtists: string[];
  energy: number; // 0-1 average audio features
  danceability: number; // 0-1
  valence: number; // 0-1 (mood/positivity)
};

// Each event category maps to a target energy and a set of genre keywords.
// Used to score how well a user's taste matches an event.
const CATEGORY_VIBE: Record<string, { energy: number; genres: string[] }> = {
  Nightlife: {
    energy: 0.85,
    genres: [
      "house", "techno", "edm", "dance", "afrobeats", "amapiano", "hip hop",
      "rap", "reggaeton", "trap", "dancehall", "electronic", "club", "bass",
    ],
  },
  Rooftop: {
    energy: 0.7,
    genres: ["house", "disco", "afrobeats", "pop", "funk", "soul", "deep house", "r&b", "amapiano", "nu disco"],
  },
  "Live Music": {
    energy: 0.55,
    genres: ["rock", "indie", "jazz", "soul", "r&b", "blues", "folk", "singer-songwriter", "alternative", "funk"],
  },
  Wellness: {
    energy: 0.25,
    genres: ["ambient", "acoustic", "chill", "lo-fi", "meditation", "classical", "new age", "downtempo"],
  },
  "Food & Drink": {
    energy: 0.5,
    genres: ["jazz", "soul", "bossa nova", "funk", "r&b", "pop", "lounge"],
  },
  Networking: {
    energy: 0.5,
    genres: ["pop", "house", "r&b", "funk", "lounge", "nu disco"],
  },
  Creative: {
    energy: 0.55,
    genres: ["indie", "alternative", "electronic", "hip hop", "lo-fi", "experimental", "art pop"],
  },
  Culture: {
    energy: 0.5,
    genres: ["world", "jazz", "classical", "afrobeats", "latin", "reggae", "soul"],
  },
};

const DEFAULT_VIBE = { energy: 0.5, genres: [] as string[] };

/**
 * Score how well an event matches a vibe profile, 0-100.
 * 60% genre overlap, 40% energy proximity.
 */
export function scoreEvent(profile: VibeProfile, event: EventRecord): number {
  const cat = CATEGORY_VIBE[event.category] ?? DEFAULT_VIBE;

  // Genre overlap: how many of the user's top genres relate to this category.
  let matches = 0;
  for (const g of profile.topGenres) {
    const gl = g.toLowerCase();
    if (cat.genres.some((k) => gl.includes(k) || k.includes(gl))) matches++;
  }
  const genreScore = cat.genres.length === 0 ? 0.5 : Math.min(1, matches / 3);

  // Energy proximity.
  const energyScore = 1 - Math.abs(profile.energy - cat.energy);

  const combined = 0.6 * genreScore + 0.4 * energyScore;
  return Math.round(Math.max(0, Math.min(1, combined)) * 100);
}

export function rankEvents(
  profile: VibeProfile,
  events: EventRecord[]
): { event: EventRecord; score: number }[] {
  return events
    .map((event) => ({ event, score: scoreEvent(profile, event) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Build a VibeProfile from Spotify top-artists + averaged audio features.
 * Pure so it can be unit-tested without hitting the network.
 */
export function buildVibeProfile(input: {
  artists: { name: string; genres: string[] }[];
  audioFeatures: { energy: number; danceability: number; valence: number }[];
}): VibeProfile {
  const genreCounts = new Map<string, number>();
  for (const a of input.artists) {
    for (const g of a.genres) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
  }
  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([g]) => g);

  const avg = (key: "energy" | "danceability" | "valence") => {
    const vals = input.audioFeatures.map((f) => f[key]).filter((v) => typeof v === "number");
    if (vals.length === 0) return 0.5;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  return {
    connectedAt: new Date().toISOString(),
    source: "spotify",
    topGenres,
    topArtists: input.artists.slice(0, 5).map((a) => a.name),
    energy: avg("energy"),
    danceability: avg("danceability"),
    valence: avg("valence"),
  };
}

/**
 * Build a VibeProfile from genre names + artist names only (Apple Music doesn't
 * expose audio features). Audio-feature fields default to neutral, so matching
 * leans on genre overlap.
 */
export function buildGenreProfile(input: {
  genres: string[];
  artists: string[];
  source: "spotify" | "apple";
}): VibeProfile {
  const counts = new Map<string, number>();
  for (const g of input.genres) {
    const t = g?.trim();
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const topGenres = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([g]) => g);

  return {
    connectedAt: new Date().toISOString(),
    source: input.source,
    topGenres,
    topArtists: [...new Set(input.artists.filter(Boolean))].slice(0, 5),
    energy: 0.5,
    danceability: 0.5,
    valence: 0.5,
  };
}
