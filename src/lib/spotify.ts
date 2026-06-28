import { buildVibeProfile, type VibeProfile } from "./vibe";

const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";
const SCOPES = "user-top-read";

export const VIBE_COOKIE = "somingle_vibe";
export const STATE_COOKIE = "somingle_spotify_state";

export function spotifyConfigured(): boolean {
  return Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

// The redirect URI must exactly match one registered in the Spotify dashboard
// AND be identical between the authorize and token-exchange steps. Prefer an
// explicit value, then the canonical site URL, then the request origin — so it
// stays deterministic on hosts where the request origin may be an internal host.
export function getRedirectUri(origin: string): string {
  const base =
    process.env.SPOTIFY_REDIRECT_URI ||
    (process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/api/spotify/callback`
      : `${origin}/api/spotify/callback`);
  return base;
}

export function buildAuthorizeUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID || "",
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<string> {
  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("No access token returned");
  return data.access_token;
}

async function api<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Spotify API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchVibeProfile(token: string): Promise<VibeProfile> {
  const artistsRes = await api<{
    items: { name: string; genres: string[] }[];
  }>(token, "/me/top/artists?limit=30&time_range=medium_term");

  const tracksRes = await api<{ items: { id: string }[] }>(
    token,
    "/me/top/tracks?limit=50&time_range=medium_term"
  );

  let audioFeatures: { energy: number; danceability: number; valence: number }[] = [];
  const ids = tracksRes.items.map((t) => t.id).filter(Boolean).slice(0, 100);
  if (ids.length > 0) {
    const feat = await api<{
      audio_features: ({ energy: number; danceability: number; valence: number } | null)[];
    }>(token, `/audio-features?ids=${ids.join(",")}`);
    audioFeatures = feat.audio_features.filter(
      (f): f is { energy: number; danceability: number; valence: number } => f != null
    );
  }

  return buildVibeProfile({ artists: artistsRes.items, audioFeatures });
}

// Cookie (de)serialization — base64 JSON keeps the profile compact + opaque.
export function encodeProfile(p: VibeProfile): string {
  return Buffer.from(JSON.stringify(p)).toString("base64url");
}

export function decodeProfile(raw: string | undefined): VibeProfile | null {
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as VibeProfile;
  } catch {
    return null;
  }
}
