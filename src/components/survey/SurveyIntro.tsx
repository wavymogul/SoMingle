import { Sparkles, Radio, Users } from "lucide-react";
import { Reveal } from "../ui/Reveal";

export function SurveyIntro() {
  return (
    <div className="mb-12">
      <Reveal className="text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-white/80">
          <Sparkles size={14} className="text-brand-gold" />
          Choose your vibe. Find your tribe.
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          Welcome to{" "}
          <span className="gradient-text">SoMingle</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-white/70">
          SoMingle is the world&apos;s first{" "}
          <span className="font-semibold text-white">
            Trusted Live Intelligence System
          </span>{" "}
          that powers criteria-curated social experiences.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="gradient-border mt-9 rounded-[2rem] glass-strong p-7 sm:p-9">
          <p className="text-center text-white/75">
            We believe meaningful connections don&apos;t happen by
            accident&mdash;they happen when the right people meet in the right
            environment.
          </p>
          <p className="mt-5 text-center text-white/75">
            This survey helps us understand what truly makes people feel{" "}
            <span className="font-semibold text-white">connected, safe, and
            excited</span>{" "}
            to show up.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl glass px-4 py-3.5">
              <Users size={18} className="shrink-0 text-brand-pink" />
              <span className="text-sm font-medium text-white/85">
                Every attendee helps shape the experience.
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl glass px-4 py-3.5">
              <Radio size={18} className="shrink-0 text-brand-violet" />
              <span className="text-sm font-medium text-white/85">
                Every response strengthens the room.
              </span>
            </div>
          </div>

          <p className="mt-7 text-center text-sm text-white/60">
            🔒 Anonymous by default — no name or email required.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mt-9 text-center">
          <p className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Come as you are.{" "}
            <span className="gradient-text animate-shimmer">
              Let&apos;s be real again.
            </span>
          </p>
          <p className="mt-3 font-display text-base font-semibold text-white/80">
            For us. By us.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
