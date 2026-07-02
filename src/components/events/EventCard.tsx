import { CalendarDays, MapPin, TrendingUp, Ticket, Users } from "lucide-react";
import type { EventRecord } from "@/lib/types";

function formatDate(iso: string): string {
  if (!iso) return "TBA";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const priceLabel = (n: number) => (n > 0 ? `From $${n}` : "Free");

export function EventCard({
  event,
  matchScore,
  going,
  vibeMatches,
  onRsvp,
}: {
  event: EventRecord;
  matchScore?: number;
  going?: number;
  vibeMatches?: number;
  onRsvp?: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-3xl glass transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[0.07]">
      <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.imageUrl}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-950/90 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {event.category}
          </span>
          {event.trending && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-gradient px-2.5 py-1 text-xs font-semibold text-white">
              <TrendingUp size={12} /> Trending
            </span>
          )}
        </div>
        {typeof matchScore === "number" && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-gradient px-2.5 py-1 text-xs font-bold text-white shadow-lg">
            {matchScore}% your vibe
          </span>
        )}
        <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {priceLabel(event.priceFrom)}
        </span>
      </div>

      <div className="p-5">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-brand-pink">
          <CalendarDays size={14} />
          {formatDate(event.date)}
          {event.time ? ` · ${event.time}` : ""}
        </div>
        <h3 className="font-display text-lg font-semibold leading-snug">
          {event.title}
        </h3>
        <div className="mt-2 flex items-start gap-1.5 text-sm text-white/55">
          <MapPin size={15} className="mt-0.5 shrink-0" />
          <span>
            {event.venue}
            {event.venue && event.city ? " · " : ""}
            {event.city}
          </span>
        </div>
        {event.description && (
          <p className="mt-3 line-clamp-2 text-sm text-white/55">
            {event.description}
          </p>
        )}
        {onRsvp && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-3.5 py-2.5">
            <span className="flex items-center gap-1.5 text-xs text-white/60">
              <Users size={13} className="shrink-0" />
              {going ? (
                <>
                  {going} interested
                  {vibeMatches ? (
                    <span className="font-semibold text-brand-pink">
                      · {vibeMatches} share your vibe
                    </span>
                  ) : null}
                </>
              ) : (
                "Be the first in the room"
              )}
            </span>
            <button
              onClick={onRsvp}
              className="shrink-0 text-xs font-semibold text-brand-pink hover:underline"
            >
              I&apos;m in
            </button>
          </div>
        )}
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs text-white/40">
            {event.organizer ? `By ${event.organizer}` : " "}
          </span>
          <a
            href={event.ticketUrl || "#"}
            target={event.ticketUrl && event.ticketUrl !== "#" ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-gradient px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            <Ticket size={14} /> Get Tickets
          </a>
        </div>
      </div>
    </article>
  );
}
