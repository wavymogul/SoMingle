"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  X,
  ChevronRight,
  MapPin,
  Star,
  Zap,
  Flower2,
  Leaf,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { ExperiencesCarousel } from "./ExperiencesCarousel";
import type { VibeProfile } from "@/lib/vibe";

/*
 * App-style "For You" home feed (mobile). Experiences use real event + RSVP
 * data; People / Tribes / Places / Growth / Trust are product previews of the
 * SoMingle app, clearly labeled — no real users are shown.
 */

const MOODS = [
  { emoji: "😊", label: "Energized" },
  { emoji: "😌", label: "Relaxed" },
  { emoji: "🎨", label: "Creative" },
  { emoji: "🌱", label: "Open to Meeting People" },
];

const PEOPLE = [
  { name: "Sarah", role: "Photographer", km: 2.3, match: 92, tags: ["Creative", "Coffee", "Hiking"], hue: "from-brand-purple to-brand-pink" },
  { name: "Marcus", role: "Entrepreneur", km: 1.8, match: 88, tags: ["Music", "Art", "Mindful"], hue: "from-brand-blue to-brand-purple" },
  { name: "Aaliyah", role: "Designer", km: 3.1, match: 86, tags: ["Travel", "Books", "Wellness"], hue: "from-brand-pink to-brand-gold" },
  { name: "Ethan", role: "Coach", km: 3.3, match: 84, tags: ["Fitness", "Food", "Podcasts"], hue: "from-brand-gold to-brand-pink" },
];

const TRIBES = [
  { icon: Sparkles, name: "Creative Collective", members: 328, online: 42, note: "Discussion happening now", next: "Tomorrow 7 PM", color: "text-brand-purple" },
  { icon: Flower2, name: "Spiritual Seekers", members: 215, online: 28, note: "Morning check-in", next: "Sun 10 AM", color: "text-brand-blue" },
  { icon: Zap, name: "Entrepreneur Flow", members: 184, online: 19, note: "New resources shared", next: "Wed 6 PM", color: "text-brand-gold" },
  { icon: Leaf, name: "Wellness Circle", members: 156, online: 23, note: "Weekend walk planned", next: "Sat 9 AM", color: "text-emerald-400" },
];

const PLACES = [
  { name: "Arvo Coffee", tags: "Quiet · Cozy · Great Coffee", km: 0.4, rating: 4.8, img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=60" },
  { name: "Studio 89", tags: "Creative · Inspiring · Calm", km: 0.7, rating: 4.7, img: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=60" },
  { name: "Bellwoods Park", tags: "Nature · Relaxing · Open", km: 1.2, rating: 4.9, img: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=60" },
  { name: "North Bowl", tags: "Fun · Social · Active", km: 1.5, rating: 4.6, img: "https://images.unsplash.com/photo-1538488881038-e252a119ace7?auto=format&fit=crop&w=800&q=60" },
];

function PreviewChip() {
  return (
    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
      Preview
    </span>
  );
}

function SectionHead({ title, preview }: { title: string; preview?: boolean }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 px-1">
      <h2 className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-display text-[17px] font-bold leading-snug">
        {title}
        {preview && <PreviewChip />}
      </h2>
      {preview && (
        <Link
          href="/#waitlist"
          className="shrink-0 whitespace-nowrap text-[11px] font-semibold text-brand-pink"
        >
          Get early access
        </Link>
      )}
    </div>
  );
}

export function ForYouFeed() {
  const [greeting, setGreeting] = useState("Good evening");
  const [mood, setMood] = useState<string>("");
  const [insightOpen, setInsightOpen] = useState(true);
  const [profile, setProfile] = useState<VibeProfile | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
    setMood(localStorage.getItem("somingle_mood") ?? "");
    fetch("/api/spotify/me")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile ?? null))
      .catch(() => {});
  }, []);

  const pickMood = (label: string) => {
    const nextMood = mood === label ? "" : label;
    setMood(nextMood);
    localStorage.setItem("somingle_mood", nextMood);
  };

  const insightBody = profile
    ? `Based on your vibe (${profile.topGenres.slice(0, 2).join(", ") || "your listening"}), you may enjoy the gatherings below.`
    : "Connect your music on the Events page and we'll match tonight's rooms to your vibe.";

  return (
    <section className="lg:hidden">
      <div className="mx-auto max-w-md px-5 pt-24">
        {/* Greeting + mood */}
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {greeting} 👋
        </h1>
        <p className="mt-1 text-sm text-white/55">How are you feeling today?</p>
        <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
          {MOODS.map((m) => {
            const active = mood === m.label;
            return (
              <button
                key={m.label}
                onClick={() => pickMood(m.label)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-gradient text-white"
                    : "glass text-white/70"
                }`}
              >
                {m.emoji} {m.label}
              </button>
            );
          })}
        </div>

        {/* AI Insight */}
        {insightOpen && (
          <div className="relative mt-5 overflow-hidden rounded-3xl gradient-border glass-strong p-5">
            <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-brand-purple/30 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 right-10 h-32 w-32 rounded-full bg-brand-pink/25 blur-2xl" />
            <button
              onClick={() => setInsightOpen(false)}
              aria-label="Dismiss insight"
              className="absolute right-3 top-3 rounded-lg p-1 text-white/50"
            >
              <X size={16} />
            </button>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-gold">
              <Sparkles size={12} /> AI Insight
            </p>
            <p className="mt-2 pr-6 font-display text-base font-semibold leading-snug">
              {greeting === "Good evening" ? "Tonight" : "Today"} looks like a
              great time for meaningful conversations.
            </p>
            <p className="mt-2 text-xs text-white/60">{insightBody}</p>
            <Link
              href="/events"
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white"
            >
              View suggestions <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* People preview */}
        <div className="mt-8">
          <SectionHead title="People You May Connect With" preview />
          <div className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2">
            {PEOPLE.map((p) => (
              <div
                key={p.name}
                className="w-[190px] shrink-0 snap-start rounded-3xl glass p-4"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${p.hue} font-display text-xl font-bold`}
                  >
                    {p.name[0]}
                  </div>
                  <span className="rounded-full bg-brand-gradient px-2 py-0.5 text-[10px] font-bold">
                    {p.match}% match
                  </span>
                </div>
                <p className="mt-3 font-display text-base font-semibold">
                  {p.name}
                </p>
                <p className="text-xs text-white/50">
                  {p.role} · {p.km} km away
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real events */}
        <ExperiencesCarousel />

        {/* Tribes preview */}
        <div id="tribes" className="mt-8 scroll-mt-24">
          <SectionHead title="Your Tribes" preview />
          <div className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2">
            {TRIBES.map((t) => {
              const Icon = t.icon;
              return (
                <div
                  key={t.name}
                  className="w-[210px] shrink-0 snap-start rounded-3xl glass p-4"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                    <Icon size={20} className={t.color} />
                  </div>
                  <p className="mt-3 font-display text-sm font-semibold">
                    {t.name}
                  </p>
                  <p className="mt-0.5 text-xs text-white/50">
                    {t.members} members ·{" "}
                    <span className="text-emerald-400">{t.online} online</span>
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/55">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {t.note}
                  </p>
                  <p className="mt-2 text-[11px] text-white/40">
                    Next meetup: {t.next}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Places preview */}
        <div className="mt-8">
          <SectionHead title="Nearby Places" preview />
          <div className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2">
            {PLACES.map((pl) => (
              <div
                key={pl.name}
                className="w-[200px] shrink-0 snap-start overflow-hidden rounded-3xl glass"
              >
                <div className="aspect-[16/10] bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pl.img} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="p-3.5">
                  <p className="font-display text-sm font-semibold">{pl.name}</p>
                  <p className="mt-0.5 text-[11px] text-white/50">{pl.tags}</p>
                  <p className="mt-2 flex items-center gap-2 text-[11px] text-white/60">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {pl.km} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={11} className="text-brand-gold" /> {pl.rating}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Growth + Trust preview */}
        <div className="mt-8 grid grid-cols-1 gap-4">
          <div className="rounded-3xl glass p-5">
            <p className="flex items-center gap-2 font-display text-sm font-bold">
              <TrendingUp size={16} className="text-brand-pink" /> Your Growth
              Journey <PreviewChip />
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {[
                ["3", "New Connections"],
                ["2", "New Communities"],
                ["1", "Meaningful Meetup"],
                ["+12%", "Trust Increase"],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="font-display text-xl font-bold text-brand-pink">
                    {v}
                  </p>
                  <p className="mt-1 text-[10px] leading-tight text-white/50">
                    {l}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-white/55">
              You&apos;re showing up and it&apos;s making an impact. Keep going!
              💜
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-3xl glass p-5">
            <div className="relative h-20 w-20 shrink-0">
              <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
                <circle
                  cx="40" cy="40" r="34" fill="none" stroke="url(#trustGrad)" strokeWidth="7"
                  strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 34 * 0.85} ${2 * Math.PI * 34}`}
                />
                <defs>
                  <linearGradient id="trustGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold">
                85
              </span>
            </div>
            <div>
              <p className="flex items-center gap-2 font-display text-sm font-bold">
                <ShieldCheck size={16} className="text-brand-gold" /> Your Trust
                Score <PreviewChip />
              </p>
              <p className="mt-1 text-xs text-white/60">
                High Trust — known for being authentic, respectful, and
                uplifting.
              </p>
              <Link
                href="/#mission"
                className="mt-1.5 inline-block text-[11px] font-semibold text-brand-pink"
              >
                How it works →
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-white/35">
          Preview sections show what the SoMingle app will feel like.{" "}
          <Link href="/#waitlist" className="text-brand-pink">
            Join the waitlist
          </Link>{" "}
          to be first in.
        </p>
      </div>
    </section>
  );
}
