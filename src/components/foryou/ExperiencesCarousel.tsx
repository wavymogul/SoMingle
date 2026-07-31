"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { scoreEvent, type VibeProfile } from "@/lib/vibe";
import type { EventRecord } from "@/lib/types";

function dateBadge(iso: string): string {
  if (!iso) return "Soon";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return "Tonight";
  if (diffDays === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// Horizontal, app-style carousel of real upcoming events with live RSVP
// counts and (when a vibe profile is connected) per-event match scores.
export function ExperiencesCarousel() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [summary, setSummary] = useState<Record<string, { going: number }>>({});
  const [profile, setProfile] = useState<VibeProfile | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [ev, rs, me] = await Promise.all([
          fetch("/api/events").then((r) => r.json()),
          fetch("/api/rsvp").then((r) => r.json()),
          fetch("/api/spotify/me").then((r) => r.json()),
        ]);
        if (!active) return;
        if (ev.ok) setEvents((ev.events as EventRecord[]).slice(0, 6));
        if (rs.ok) setSummary(rs.summary ?? {});
        setProfile(me.profile ?? null);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (events.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="font-display text-lg font-bold">Upcoming Experiences</h2>
        <Link href="/events" className="text-xs font-semibold text-brand-pink">
          See all
        </Link>
      </div>
      <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2">
        {events.map((e) => {
          const going = summary[String(e.id)]?.going ?? 0;
          const match = profile ? scoreEvent(profile, e) : null;
          return (
            <Link
              key={e.id}
              href="/events"
              className="w-[280px] shrink-0 snap-start overflow-hidden rounded-3xl glass"
            >
              <div className="relative aspect-[16/10] bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-950/95 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-brand-gradient px-2.5 py-1 text-[11px] font-semibold text-white">
                  {dateBadge(e.date)}
                </span>
                {match != null && (
                  <span className="absolute bottom-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-brand-pink bg-ink-950/80 text-[11px] font-bold text-white">
                    {match}%
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-base font-semibold leading-snug">
                  {e.title}
                </h3>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/55">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">
                    {e.venue}
                    {e.venue && e.city ? " · " : ""}
                    {e.city}
                  </span>
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={12} />
                    {e.time || "TBA"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={12} />
                    {going > 0 ? `${going} going` : "Be first"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
