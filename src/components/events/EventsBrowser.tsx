"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  Loader2,
  CalendarX,
  LocateFixed,
  Music2,
  Sparkles,
  X,
} from "lucide-react";
import { EventCard } from "./EventCard";
import { AppleMusicButton } from "./AppleMusicButton";
import { nearestCity } from "@/lib/geo";
import { rankEvents, type VibeProfile } from "@/lib/vibe";
import type { EventRecord } from "@/lib/types";

export function EventsBrowser() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("All");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [locatedCity, setLocatedCity] = useState<string | null>(null);
  const [geoTried, setGeoTried] = useState(false);

  // Music vibe state
  const [spotifyConfigured, setSpotifyConfigured] = useState(false);
  const [appleConfigured, setAppleConfigured] = useState(false);
  const [profile, setProfile] = useState<VibeProfile | null>(null);
  const [vibeSort, setVibeSort] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");

  // RSVP state
  const [rsvpSummary, setRsvpSummary] = useState<
    Record<string, { going: number; matches: number }>
  >({});
  const [rsvpTarget, setRsvpTarget] = useState<EventRecord | null>(null);

  const loadRsvpSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/rsvp");
      const data = await res.json();
      if (data.ok) setRsvpSummary(data.summary ?? {});
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadRsvpSummary();
  }, [loadRsvpSummary]);

  const loadVibe = useCallback(async () => {
    try {
      const [meRes, appleRes] = await Promise.all([
        fetch("/api/spotify/me"),
        fetch("/api/apple/token"),
      ]);
      const me = await meRes.json();
      const apple = await appleRes.json();
      setSpotifyConfigured(Boolean(me.configured));
      setProfile(me.profile ?? null);
      setAppleConfigured(Boolean(apple.configured));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadVibe();
  }, [loadVibe]);

  // Surface the outcome of the OAuth round-trip (?spotify=...).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("spotify");
    if (!p) return;
    const messages: Record<string, string> = {
      connected: "🎶 Spotify connected — events are now matched to your vibe.",
      denied: "Spotify connection was cancelled.",
      error: "Couldn't connect Spotify. Please try again.",
      unconfigured: "Spotify connect isn't enabled on this site yet.",
    };
    setStatusMsg(messages[p] ?? "");
    window.history.replaceState({}, "", "/events");
  }, []);

  async function disconnectVibe() {
    await fetch("/api/spotify/logout", { method: "POST" });
    setProfile(null);
    setStatusMsg("");
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (active && data.ok) setEvents(data.events as EventRecord[]);
      } catch {
        /* leave empty */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const cities = useMemo(
    () => ["All", ...Array.from(new Set(events.map((e) => e.city).filter(Boolean))).sort()],
    [events]
  );

  const detectLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const avail = cities.filter((c) => c !== "All");
        const match = nearestCity(
          pos.coords.latitude,
          pos.coords.longitude,
          avail
        );
        if (match) {
          setCity(match);
          setLocatedCity(match);
        } else {
          setLocatedCity("__none__");
        }
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 600000 }
    );
  }, [cities]);

  // Auto-detect once, after events (and therefore the available cities) load.
  useEffect(() => {
    if (geoTried || events.length === 0) return;
    setGeoTried(true);
    detectLocation();
  }, [events, geoTried, detectLocation]);
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(events.map((e) => e.category).filter(Boolean))).sort()],
    [events]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (city !== "All" && e.city !== city) return false;
      if (category !== "All" && e.category !== category) return false;
      if (
        q &&
        !`${e.title} ${e.venue} ${e.organizer} ${e.description}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [events, city, category, query]);

  // When a vibe profile is connected and "Top picks" is on, rank by match score.
  const displayList = useMemo<{ event: EventRecord; score?: number }[]>(() => {
    if (profile && vibeSort) return rankEvents(profile, filtered);
    return filtered.map((event) => ({ event, score: undefined }));
  }, [profile, vibeSort, filtered]);

  return (
    <div>
      {statusMsg && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-brand-purple/15 px-4 py-3 text-sm text-white/85">
          <span>{statusMsg}</span>
          <button
            onClick={() => setStatusMsg("")}
            className="text-white/50 hover:text-white"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Vibe / Spotify banner */}
      {profile ? (
        <div className="mb-6 rounded-3xl gradient-border glass-strong p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="font-display text-sm font-semibold">
                  Matched to your vibe
                </p>
                <p className="text-xs text-white/55">
                  {profile.topGenres.length > 0
                    ? `Your top vibes: ${profile.topGenres.slice(0, 3).join(", ")}`
                    : `Based on your ${
                        profile.source === "apple" ? "Apple Music" : "Spotify"
                      } listening`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVibeSort((v) => !v)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  vibeSort
                    ? "bg-brand-gradient text-white"
                    : "glass text-white/65 hover:text-white"
                }`}
              >
                Top picks for you
              </button>
              <button
                onClick={disconnectVibe}
                className="rounded-full glass px-3 py-2 text-xs text-white/55 hover:text-white"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      ) : spotifyConfigured || appleConfigured ? (
        <div className="mb-6 flex flex-col gap-4 rounded-3xl gradient-border glass-strong p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient">
              <Music2 size={18} />
            </div>
            <div>
              <p className="font-display text-sm font-semibold">
                Connect your music to find your vibe
              </p>
              <p className="text-xs text-white/55">
                We&apos;ll match events to your actual taste. Opt-in, never
                shared.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {spotifyConfigured && (
              <a
                href="/api/spotify/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-4 py-2 text-xs font-semibold text-black transition-transform hover:scale-105"
              >
                <Music2 size={14} /> Spotify
              </a>
            )}
            {appleConfigured && <AppleMusicButton onConnected={loadVibe} />}
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-3 rounded-3xl glass p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <Music2 size={18} className="text-brand-pink" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold">
              Vibe matching is coming soon
            </p>
            <p className="text-xs text-white/55">
              Connect your music to get events matched to your taste.
            </p>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, venues, organizers…"
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:border-brand-purple/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/25"
            />
          </div>
          <div className="relative sm:w-52">
            <MapPin
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-9 text-sm text-white focus:border-brand-purple/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/25"
            >
              {cities.map((c) => (
                <option key={c} value={c} className="bg-ink-800">
                  {c === "All" ? "All locations" : c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={detectLocation}
            disabled={locating}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl glass-strong px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:text-white disabled:opacity-60"
            title="Use my location"
          >
            {locating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LocateFixed size={16} className="text-brand-pink" />
            )}
            Near me
          </button>
        </div>

        {locatedCity && locatedCity !== "__none__" && (
          <p className="flex items-center gap-1.5 text-sm text-white/55">
            <LocateFixed size={14} className="text-brand-pink" />
            Showing events near{" "}
            <span className="font-semibold text-white">{locatedCity}</span>
          </p>
        )}
        {locatedCity === "__none__" && (
          <p className="text-sm text-white/45">
            We couldn&apos;t find events right near you — browse all locations
            below.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-gradient text-white"
                    : "glass text-white/65 hover:text-white"
                }`}
              >
                {c === "All" ? "All categories" : c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-24 text-white/50">
          <Loader2 className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl glass py-20 text-center">
          <CalendarX className="text-white/40" size={32} />
          <p className="text-white/60">No events match your filters yet.</p>
          <button
            onClick={() => {
              setCity("All");
              setCategory("All");
              setQuery("");
            }}
            className="text-sm font-semibold text-brand-pink hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm text-white/50">
            {profile && vibeSort ? "Top picks for you · " : ""}
            {filtered.length} event{filtered.length === 1 ? "" : "s"}
            {city !== "All" ? ` in ${city}` : ""}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayList.map(({ event, score }) => {
              const s = rsvpSummary[String(event.id)];
              return (
                <EventCard
                  key={event.id}
                  event={event}
                  matchScore={score}
                  going={s?.going ?? 0}
                  vibeMatches={profile ? s?.matches ?? 0 : 0}
                  onRsvp={() => setRsvpTarget(event)}
                />
              );
            })}
          </div>
        </>
      )}

      {rsvpTarget && (
        <RsvpModal
          event={rsvpTarget}
          hasVibe={Boolean(profile)}
          onClose={() => setRsvpTarget(null)}
          onDone={loadRsvpSummary}
        />
      )}
    </div>
  );
}

function RsvpModal({
  event,
  hasVibe,
  onClose,
  onDone,
}: {
  event: EventRecord;
  hasVibe: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setDone(true);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="gradient-border w-full max-w-md rounded-3xl glass-strong p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-bold">
            {done ? "You're in! 🎉" : "Count me in"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/50 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mb-5 text-sm text-white/55">{event.title}</p>

        {done ? (
          <div className="space-y-4">
            <p className="text-sm text-white/70">
              {hasVibe
                ? "Your vibe is part of this room now. When people who match your taste join, they'll see it — and that's how the right intros happen."
                : "You're on the list. Connect your music above and we'll match you with people going who share your taste."}
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-brand-gradient py-3 text-sm font-semibold"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brand-purple/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/25"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-brand-purple/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/25"
            />
            {error && <p className="text-sm text-brand-pink">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient py-3 text-sm font-semibold disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : "I'm in"}
            </button>
            <p className="text-center text-xs text-white/40">
              {hasVibe
                ? "Your vibe profile will be used to match you with the room."
                : "Only used for this event — never shared."}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
