"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, TrendingUp, Users, X } from "lucide-react";
import { EVENT_CATEGORIES } from "@/lib/events-data";
import type { EventRecord, RsvpRecord } from "@/lib/types";

const emptyForm = {
  title: "",
  description: "",
  category: EVENT_CATEGORIES[0],
  city: "",
  venue: "",
  date: "",
  time: "",
  priceFrom: "",
  imageUrl: "",
  ticketUrl: "",
  organizer: "",
  trending: false,
};

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-brand-purple/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/25";

export function EventsAdmin({ user, pass }: { user: string; pass: string }) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isSample, setIsSample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const authHeaders = useCallback(
    () => ({ "x-admin-username": user, "x-admin-password": pass }),
    [user, pass]
  );

  const [rsvpsByEvent, setRsvpsByEvent] = useState<Record<string, RsvpRecord[]>>(
    {}
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, rsvpRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/rsvp?admin=1", { headers: authHeaders() }),
      ]);
      const data = await evRes.json();
      if (data.ok) {
        setEvents(data.events as EventRecord[]);
        setIsSample(Boolean(data.sample));
      }
      const rsvpData = await rsvpRes.json();
      if (rsvpData.ok) {
        const grouped: Record<string, RsvpRecord[]> = {};
        for (const r of rsvpData.rsvps as RsvpRecord[]) {
          (grouped[String(r.eventId)] ??= []).push(r);
        }
        setRsvpsByEvent(grouped);
      }
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const editing = editingId != null;
      const res = await fetch("/api/events", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          ...form,
          priceFrom: Number(form.priceFrom) || 0,
          ...(editing ? { id: editingId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save event.");
      setForm(emptyForm);
      setEditingId(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(ev: EventRecord) {
    setEditingId(ev.id);
    setError("");
    setForm({
      title: ev.title,
      description: ev.description,
      category: ev.category || EVENT_CATEGORIES[0],
      city: ev.city,
      venue: ev.venue,
      date: ev.date,
      time: ev.time,
      priceFrom: ev.priceFrom ? String(ev.priceFrom) : "",
      imageUrl: ev.imageUrl,
      ticketUrl: ev.ticketUrl === "#" ? "" : ev.ticketUrl,
      organizer: ev.organizer,
      trending: ev.trending,
    });
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function remove(id: number) {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/events?id=${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (editingId === id) cancelEdit();
    await reload();
  }

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Create form */}
      <form onSubmit={save} className="h-fit rounded-3xl glass p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
            {editingId != null ? (
              <>
                <Pencil size={18} className="text-brand-gold" /> Edit event
              </>
            ) : (
              <>
                <Plus size={18} className="text-brand-pink" /> Add event
              </>
            )}
          </h3>
          {editingId != null && (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center gap-1 text-xs text-white/55 hover:text-white"
            >
              <X size={14} /> Cancel
            </button>
          )}
        </div>
        <div className="space-y-3">
          <input
            className={inputCls}
            placeholder="Event title *"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-ink-800">
                  {c}
                </option>
              ))}
            </select>
            <input
              className={inputCls}
              placeholder="City"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>
          <input
            className={inputCls}
            placeholder="Venue"
            value={form.venue}
            onChange={(e) => set("venue", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              className={inputCls}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
            <input
              className={inputCls}
              placeholder="Time (e.g. 9:00 PM)"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min={0}
              className={inputCls}
              placeholder="Price from ($, 0 = free)"
              value={form.priceFrom}
              onChange={(e) => set("priceFrom", e.target.value)}
            />
            <input
              className={inputCls}
              placeholder="Organizer"
              value={form.organizer}
              onChange={(e) => set("organizer", e.target.value)}
            />
          </div>
          <input
            className={inputCls}
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
          />
          <input
            className={inputCls}
            placeholder="Ticket / RSVP URL"
            value={form.ticketUrl}
            onChange={(e) => set("ticketUrl", e.target.value)}
          />
          <textarea
            className={`${inputCls} min-h-[72px] resize-y`}
            placeholder="Short description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/75">
            <input
              type="checkbox"
              checked={form.trending}
              onChange={(e) => set("trending", e.target.checked)}
              className="h-4 w-4 accent-brand-purple"
            />
            <TrendingUp size={15} className="text-brand-gold" /> Mark as trending
          </label>
          {error && <p className="text-sm text-brand-pink">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : editingId != null ? (
              "Save changes"
            ) : (
              "Publish event"
            )}
          </button>
        </div>
      </form>

      {/* List */}
      <div>
        {isSample && events.length > 0 && (
          <p className="mb-4 rounded-2xl bg-brand-purple/15 px-4 py-3 text-sm text-white/75">
            Showing sample events. Publish your first event above and these
            placeholders are replaced with your real lineup.
          </p>
        )}
        {loading ? (
          <div className="flex justify-center py-20 text-white/50">
            <Loader2 className="animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl glass p-12 text-center text-sm text-white/45">
            No events yet. Add your first one.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => {
              const rsvps = rsvpsByEvent[String(ev.id)] ?? [];
              return (
                <div key={ev.id} className="rounded-2xl glass p-3">
                  <div className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ev.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-14 w-20 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{ev.title}</p>
                        {ev.trending && (
                          <TrendingUp
                            size={14}
                            className="shrink-0 text-brand-gold"
                          />
                        )}
                      </div>
                      <p className="truncate text-xs text-white/50">
                        {ev.category} · {ev.city || "—"} · {ev.date || "TBA"}
                      </p>
                    </div>
                    {!isSample && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => startEdit(ev)}
                          className={`rounded-xl p-2 transition-colors hover:bg-white/10 hover:text-white ${
                            editingId === ev.id
                              ? "text-brand-gold"
                              : "text-white/50"
                          }`}
                          aria-label="Edit event"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => remove(ev.id)}
                          className="rounded-xl p-2 text-white/50 transition-colors hover:bg-brand-pink/15 hover:text-brand-pink"
                          aria-label="Delete event"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {rsvps.length > 0 && (
                    <details className="mt-2 rounded-xl bg-white/[0.03] px-3 py-2">
                      <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-white/70">
                        <Users size={13} className="text-brand-pink" />
                        {rsvps.length} interested
                        <span className="text-white/40">
                          ·{" "}
                          {rsvps.filter((r) => r.vibe).length} with vibe
                          profiles
                        </span>
                      </summary>
                      <ul className="mt-2 space-y-1.5">
                        {rsvps.map((r) => (
                          <li
                            key={r.id}
                            className="flex flex-wrap items-baseline gap-x-2 text-xs"
                          >
                            <span className="font-medium text-white/85">
                              {r.name}
                            </span>
                            <span className="text-white/50">{r.email}</span>
                            {r.vibe && r.vibe.topGenres.length > 0 && (
                              <span className="text-brand-pink/80">
                                {r.vibe.topGenres.slice(0, 3).join(", ")}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
