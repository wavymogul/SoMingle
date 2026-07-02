"use client";

import { useState } from "react";
import { Loader2, Music } from "lucide-react";

type MusicKitInstance = { authorize: () => Promise<string> };
type MusicKitNamespace = {
  configure: (opts: {
    developerToken: string;
    app: { name: string; build: string };
  }) => Promise<MusicKitInstance>;
};

declare global {
  interface Window {
    MusicKit?: MusicKitNamespace;
  }
}

const MUSICKIT_SRC = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";

function loadMusicKit(): Promise<MusicKitNamespace> {
  return new Promise((resolve, reject) => {
    if (window.MusicKit) return resolve(window.MusicKit);
    const onReady = () =>
      window.MusicKit
        ? resolve(window.MusicKit)
        : reject(new Error("MusicKit unavailable"));
    if (document.getElementById("musickit-js")) {
      document.addEventListener("musickitloaded", onReady, { once: true });
      return;
    }
    const s = document.createElement("script");
    s.id = "musickit-js";
    s.src = MUSICKIT_SRC;
    s.async = true;
    document.addEventListener("musickitloaded", onReady, { once: true });
    s.onerror = () => reject(new Error("Failed to load MusicKit"));
    document.body.appendChild(s);
  });
}

export function AppleMusicButton({ onConnected }: { onConnected: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function connect() {
    setLoading(true);
    setError("");
    try {
      const tokRes = await fetch("/api/apple/token");
      const tok = await tokRes.json();
      if (!tok.configured || !tok.token) {
        throw new Error("Apple Music isn't enabled on this site yet.");
      }

      const MusicKit = await loadMusicKit();
      const music = await MusicKit.configure({
        developerToken: tok.token,
        app: { name: "SoMingle", build: "1.0.0" },
      });
      const userToken = await music.authorize();

      const res = await fetch(
        "https://api.music.apple.com/v1/me/history/heavy-rotation?limit=30",
        {
          headers: {
            Authorization: `Bearer ${tok.token}`,
            "Music-User-Token": userToken,
          },
        }
      );
      if (!res.ok) throw new Error("Couldn't read your Apple Music listening.");
      const data = (await res.json()) as {
        data?: { attributes?: { genreNames?: string[]; artistName?: string; name?: string } }[];
      };
      const items = data.data ?? [];
      const genres = items.flatMap((i) => i.attributes?.genreNames ?? []);
      const artists = items
        .map((i) => i.attributes?.artistName || i.attributes?.name || "")
        .filter(Boolean);

      const saveRes = await fetch("/api/apple/vibe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genres, artists }),
      });
      if (!saveRes.ok) throw new Error("Couldn't save your vibe profile.");
      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apple Music connect failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={connect}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#fa2d48] to-[#fb5c74] px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Music size={14} />
        )}
        Apple Music
      </button>
      {error && <span className="text-xs text-brand-pink">{error}</span>}
    </div>
  );
}
