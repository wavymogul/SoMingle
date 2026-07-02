import type { VibeSnapshot } from "./types";

/**
 * Person-to-person vibe compatibility, 0-100.
 * 70% shared music genres (fuzzy overlap, 3+ shared = full score),
 * 30% listening-energy proximity.
 */
export function profileSimilarity(a: VibeSnapshot, b: VibeSnapshot): number {
  const genresA = a.topGenres.map((g) => g.toLowerCase());
  const genresB = b.topGenres.map((g) => g.toLowerCase());

  let shared = 0;
  for (const g of genresA) {
    if (genresB.some((h) => g === h || g.includes(h) || h.includes(g))) {
      shared++;
    }
  }
  // Full genre score at 3 shared genres, or everything a small profile has.
  const denom = Math.max(1, Math.min(3, genresA.length, genresB.length));
  const genreScore = Math.min(1, shared / denom);

  const energyScore = 1 - Math.abs(a.energy - b.energy);

  return Math.round((0.7 * genreScore + 0.3 * energyScore) * 100);
}

/** Similarity at or above this counts as "shares your vibe". */
export const MATCH_THRESHOLD = 60;
