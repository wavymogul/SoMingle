"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  Loader2,
  Lock,
  RefreshCw,
  Sparkles,
  Users,
  ClipboardList,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import type { SurveyRecord, WaitlistRecord } from "@/lib/types";

type AdminData = {
  stats: {
    surveyCount: number;
    waitlistCount: number;
    earlyAccessCount: number;
    creatorCount: number;
  };
  surveys: SurveyRecord[];
  waitlist: WaitlistRecord[];
};

const USER_KEY = "somingle_admin_user";
const PASS_KEY = "somingle_admin_pw";

export function AdminDashboard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [tab, setTab] = useState<"surveys" | "waitlist">("surveys");

  async function load(user: string, pw: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        headers: { "x-admin-username": user, "x-admin-password": pw },
      });
      if (res.status === 401)
        throw new Error("Incorrect username or password.");
      if (!res.ok) throw new Error("Failed to load data.");
      const json = (await res.json()) as AdminData;
      setData(json);
      setAuthed(true);
      sessionStorage.setItem(USER_KEY, user);
      sessionStorage.setItem(PASS_KEY, pw);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedUser = sessionStorage.getItem(USER_KEY);
    const savedPass = sessionStorage.getItem(PASS_KEY);
    if (savedUser && savedPass) {
      setUsername(savedUser);
      setPassword(savedPass);
      load(savedUser, savedPass);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(username, password);
          }}
          className="gradient-border w-full max-w-sm rounded-3xl glass-strong p-8"
        >
          <div className="mb-6 flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="font-display text-lg font-bold">
              So<span className="gradient-text">Mingle</span> Admin
            </span>
          </div>
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <Lock size={20} className="text-brand-purple" />
          </div>
          <h1 className="font-display text-xl font-bold">Dashboard access</h1>
          <p className="mt-1 text-sm text-white/55">
            Sign in to view survey responses and analytics.
          </p>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoComplete="username"
            autoFocus
            className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm focus:border-brand-purple/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/25"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm focus:border-brand-purple/60 focus:outline-none focus:ring-2 focus:ring-brand-purple/25"
          />
          {error && <p className="mt-3 text-sm text-brand-pink">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient py-3 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="font-display text-lg font-bold">
            So<span className="gradient-text">Mingle</span> Admin
          </span>
        </div>
        <button
          onClick={() => load(username, password)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full glass-strong px-4 py-2 text-sm font-medium hover:bg-white/10"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          Refresh
        </button>
      </header>

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={ClipboardList}
              label="Survey Responses"
              value={data.stats.surveyCount}
            />
            <StatCard
              icon={Users}
              label="Waitlist Signups"
              value={data.stats.waitlistCount}
            />
            <StatCard
              icon={Rocket}
              label="Want Early Access"
              value={data.stats.earlyAccessCount}
            />
            <StatCard
              icon={Sparkles}
              label="Event Creators"
              value={data.stats.creatorCount}
            />
          </div>

          <Insights surveys={data.surveys} />

          <div className="mt-8 flex items-center gap-2">
            <TabButton
              active={tab === "surveys"}
              onClick={() => setTab("surveys")}
            >
              Survey Responses ({data.surveys.length})
            </TabButton>
            <TabButton
              active={tab === "waitlist"}
              onClick={() => setTab("waitlist")}
            >
              Waitlist ({data.waitlist.length})
            </TabButton>
          </div>

          <div className="mt-4">
            {tab === "surveys" ? (
              <SurveyTable surveys={data.surveys} />
            ) : (
              <WaitlistTable waitlist={data.waitlist} />
            )}
          </div>
        </>
      )}
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl glass p-6">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
        <Icon size={18} className="text-brand-gold" />
      </div>
      <div className="font-display text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-white/55">{label}</div>
    </div>
  );
}

function Insights({ surveys }: { surveys: SurveyRecord[] }) {
  const topInterests = useMemo(
    () => tally(surveys, "experienceInterests"),
    [surveys]
  );
  const topGains = useMemo(() => tally(surveys, "hopingToGain"), [surveys]);
  const topVibes = useMemo(() => tally(surveys, "vibeWords"), [surveys]);
  const topGenres = useMemo(() => tally(surveys, "musicGenres"), [surveys]);

  const kpis = useMemo(() => {
    const avg = (key: "affordabilityImportance" | "musicImportance") => {
      if (surveys.length === 0) return "—";
      const sum = surveys.reduce((a, s) => a + (Number(s[key]) || 0), 0);
      return (sum / surveys.length).toFixed(1);
    };
    return {
      affordability: avg("affordabilityImportance"),
      music: avg("musicImportance"),
      topCity: mode(surveys.map((s) => s.city)),
      topMeeting: mode(surveys.map((s) => s.meetingPreference)),
      djPct:
        surveys.length === 0
          ? "—"
          : `${Math.round(
              (surveys.filter((s) => s.attendForDj === "Yes").length /
                surveys.length) *
                100
            )}%`,
    };
  }, [surveys]);

  if (surveys.length === 0) return null;

  return (
    <>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MiniStat label="Avg affordability /10" value={kpis.affordability} />
        <MiniStat label="Avg music importance /10" value={kpis.music} />
        <MiniStat label="Most desired city" value={kpis.topCity} />
        <MiniStat label="Top meeting style" value={kpis.topMeeting} />
        <MiniStat label="Would attend for the DJ" value={kpis.djPct} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <RankPanel
          title="Most-wanted experiences"
          icon={BarChart3}
          entries={topInterests}
        />
        <RankPanel
          title="What people want to gain"
          icon={BarChart3}
          entries={topGains}
        />
        <RankPanel title="Top vibe words" icon={BarChart3} entries={topVibes} />
        <RankPanel
          title="Top music genres"
          icon={BarChart3}
          entries={topGenres}
        />
      </div>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl glass p-4">
      <div className="truncate font-display text-xl font-bold" title={value}>
        {value}
      </div>
      <div className="mt-1 text-xs text-white/50">{label}</div>
    </div>
  );
}

// Most common non-empty string value.
function mode(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) {
    const t = v?.trim();
    if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? "—";
}

type ArrayKey =
  | "experienceInterests"
  | "hopingToGain"
  | "vibeWords"
  | "musicGenres"
  | "creatorChallenges"
  | "rolesInterested";

function tally(surveys: SurveyRecord[], key: ArrayKey): [string, number][] {
  const counts = new Map<string, number>();
  for (const s of surveys) {
    for (const v of s[key] ?? []) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
}

function RankPanel({
  title,
  icon: Icon,
  entries,
}: {
  title: string;
  icon: LucideIcon;
  entries: [string, number][];
}) {
  const max = entries[0]?.[1] ?? 1;
  return (
    <div className="rounded-3xl glass p-6">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/85">
        <Icon size={16} className="text-brand-purple" /> {title}
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-white/40">No data yet.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map(([label, count]) => (
            <li key={label}>
              <div className="mb-1 flex justify-between text-xs text-white/70">
                <span>{label}</span>
                <span>{count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-brand-gradient"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-gradient text-white"
          : "glass text-white/65 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SurveyTable({ surveys }: { surveys: SurveyRecord[] }) {
  const [open, setOpen] = useState<number | null>(null);

  if (surveys.length === 0) {
    return <EmptyState label="No survey responses yet." />;
  }

  return (
    <div className="rounded-3xl glass p-4 sm:p-6">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => downloadCsv("somingle-surveys.csv", surveys)}
          className="inline-flex items-center gap-2 rounded-full glass-strong px-4 py-2 text-sm font-medium hover:bg-white/10"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-white/45">
            <tr className="border-b border-white/10">
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">City</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Host?</th>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {surveys.map((s) => (
              <Fragment key={s.id}>
                <tr className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-3 py-3 font-medium">{s.fullName}</td>
                  <td className="px-3 py-3 text-white/70">{s.email}</td>
                  <td className="px-3 py-3 text-white/70">{s.city || "—"}</td>
                  <td className="px-3 py-3 text-white/70">{s.status || "—"}</td>
                  <td className="px-3 py-3 text-white/70">
                    {s.hostsEvents || "—"}
                  </td>
                  <td className="px-3 py-3 text-white/50">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => setOpen(open === s.id ? null : s.id)}
                      className="text-xs font-semibold text-brand-pink hover:underline"
                    >
                      {open === s.id ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
                {open === s.id && (
                  <tr>
                    <td colSpan={7} className="px-3 pb-5">
                      <SurveyDetail s={s} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SurveyDetail({ s }: { s: SurveyRecord }) {
  const rows: [string, string][] = [
    ["Phone", s.phone || "—"],
    ["Instagram", s.instagram || "—"],
    ["Age range", s.ageRange || "—"],
    ["Occupation", s.occupation || "—"],
    ["Frustrations", s.eventFrustrations || "—"],
    ["Why people go out less", s.goingOutLess || "—"],
    ["What makes it worth it", s.worthAttending || "—"],
    ["Spent & disappointed", s.spentAndDisappointed || "—"],
    ["…why", s.disappointedWhy || "—"],
    ["Interested experiences", s.experienceInterests.join(", ") || "—"],
    ["Motivation to attend", s.motivation || "—"],
    ["Missing in city", s.missingInCity || "—"],
    ["Vibe words", s.vibeWords?.join(", ") || "—"],
    ["Hoping to gain", s.hopingToGain.join(", ") || "—"],
    ["Meeting preference", s.meetingPreference || "—"],
    ["Affordability (1-10)", String(s.affordabilityImportance)],
    ["Like-minded (1-10)", String(s.likeMindedImportance)],
    ["Music genres", s.musicGenres?.join(", ") || "—"],
    ["Preferred event music", s.preferredEventMusic || "—"],
    ["Music importance (1-10)", String(s.musicImportance ?? "—")],
    ["Attend for the DJ", s.attendForDj || "—"],
    ["Discover new DJs", s.discoverDjs || "—"],
    ["Event type", s.eventType || "—"],
    ["Creator challenges", s.creatorChallenges.join(", ") || "—"],
    ["How SoMingle helps", s.howSomingleHelps || "—"],
    ["Dream event", s.dreamEvent || "—"],
    ["Wants early access", s.wantsEarlyAccess || "—"],
    ["Roles interested", s.rolesInterested.join(", ") || "—"],
    ["Feels like belonging", s.belongingFeeling || "—"],
  ];
  return (
    <div className="grid gap-x-8 gap-y-2 rounded-2xl bg-white/[0.03] p-5 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="text-sm">
          <span className="text-white/45">{k}: </span>
          <span className="text-white/85">{v}</span>
        </div>
      ))}
    </div>
  );
}

function WaitlistTable({ waitlist }: { waitlist: WaitlistRecord[] }) {
  if (waitlist.length === 0) {
    return <EmptyState label="No waitlist signups yet." />;
  }
  return (
    <div className="rounded-3xl glass p-4 sm:p-6">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => downloadCsv("somingle-waitlist.csv", waitlist)}
          className="inline-flex items-center gap-2 rounded-full glass-strong px-4 py-2 text-sm font-medium hover:bg-white/10"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-white/45">
            <tr className="border-b border-white/10">
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {waitlist.map((w) => (
              <tr
                key={w.id}
                className="border-b border-white/5 hover:bg-white/[0.03]"
              >
                <td className="px-3 py-3 font-medium">{w.name}</td>
                <td className="px-3 py-3 text-white/70">{w.email}</td>
                <td className="px-3 py-3 text-white/50">
                  {new Date(w.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-3xl glass p-12 text-center text-sm text-white/45">
      {label}
    </div>
  );
}
