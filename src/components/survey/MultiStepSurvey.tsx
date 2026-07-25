"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  PartyPopper,
} from "lucide-react";
import Link from "next/link";
import {
  Field,
  TextInput,
  TextArea,
  RadioGroup,
  CheckboxGroup,
  ScaleInput,
} from "./Fields";
import {
  AGE_RANGES,
  STATUS_OPTIONS,
  EXPERIENCE_INTERESTS,
  VIBE_WORDS,
  MAX_VIBE_WORDS,
  GAIN_OPTIONS,
  MEETING_PREFERENCES,
  MUSIC_GENRES,
  EVENT_MUSIC,
  EVENT_TYPES,
  CREATOR_CHALLENGES,
  ROLE_OPTIONS,
  YES_NO,
} from "@/lib/survey-options";
import type { SurveyPayload } from "@/lib/types";

const emptyForm: SurveyPayload = {
  fullName: "",
  email: "",
  phone: "",
  instagram: "",
  ageRange: "",
  city: "",
  occupation: "",
  status: "",
  eventFrustrations: "",
  goingOutLess: "",
  worthAttending: "",
  spentAndDisappointed: "",
  disappointedWhy: "",
  experienceInterests: [],
  motivation: "",
  missingInCity: "",
  vibeWords: [],
  hopingToGain: [],
  meetingPreference: "",
  affordabilityImportance: 5,
  likeMindedImportance: 5,
  musicGenres: [],
  preferredEventMusic: "",
  musicImportance: 5,
  attendForDj: "",
  discoverDjs: "",
  hostsEvents: "",
  eventType: "",
  creatorChallenges: [],
  howSomingleHelps: "",
  dreamEvent: "",
  wantsEarlyAccess: "",
  rolesInterested: [],
  belongingFeeling: "",
};

const STEPS = [
  { id: "about", title: "About You", subtitle: "Let's start with the basics." },
  {
    id: "realtalk",
    title: "Real Talk",
    subtitle: "Tell us the truth — this is what helps us most.",
  },
  {
    id: "want",
    title: "What Do You Actually Want?",
    subtitle: "The experiences you'd actually show up for.",
  },
  {
    id: "vibe",
    title: "Your Vibe",
    subtitle: "Choose up to 5 words that feel like you.",
  },
  {
    id: "connection",
    title: "Connection Style",
    subtitle: "How you like to meet people.",
  },
  {
    id: "music",
    title: "Music",
    subtitle: "The soundtrack to the room. (SoMingle × Yo DJ)",
  },
  {
    id: "creator",
    title: "For Creators, Hosts & Brands",
    subtitle: "Do you build experiences for others?",
  },
  {
    id: "future",
    title: "The Future",
    subtitle: "Imagine the perfect experience.",
  },
];

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export function MultiStepSurvey() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<SurveyPayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = <K extends keyof SurveyPayload>(key: K, val: SurveyPayload[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const progress = useMemo(
    () => ((step + 1) / STEPS.length) * 100,
    [step]
  );

  // Anonymous by default: nothing is required. An email is only validated
  // when the respondent chose to enter one.
  const emailOk = form.email.trim() === "" || isEmail(form.email);
  const stepValid = useMemo(() => {
    if (step === 0) return emailOk;
    return true;
  }, [step, emailOk]);

  const next = () => {
    setError("");
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };
  const back = () => {
    setError("");
    if (step > 0) setStep((s) => s - 1);
  };

  async function submit() {
    if (form.email.trim() && !isEmail(form.email)) {
      setError("Please enter a valid email or leave it blank to stay anonymous.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-border mx-auto max-w-2xl rounded-[2rem] glass-strong p-10 text-center"
      >
        <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient">
          <PartyPopper size={30} />
        </div>
        <h2 className="font-display text-3xl font-bold">
          You&apos;re helping redefine how the world connects.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-white/65">
          Every answer helps build more authentic communities, better
          experiences, and stronger relationships. Thank you for helping us
          remember how to be real again.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/45">
          We&apos;ll keep you updated as SoMingle grows.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/#waitlist"
            className="rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold"
          >
            Join the waitlist
          </Link>
          <Link
            href="/"
            className="rounded-full glass-strong px-6 py-3 text-sm font-semibold"
          >
            Back to home
          </Link>
        </div>
      </motion.div>
    );
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs text-white/50">
          <span className="font-semibold uppercase tracking-wider text-brand-purple">
            Section {step + 1} of {STEPS.length}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-brand-gradient"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="gradient-border rounded-[2rem] glass-strong p-6 sm:p-9">
        <div className="mb-7">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            {current.title}
          </h2>
          <p className="mt-1.5 text-sm text-white/55">{current.subtitle}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {step === 0 && <StepAbout form={form} set={set} />}
            {step === 1 && <StepRealTalk form={form} set={set} />}
            {step === 2 && <StepWant form={form} set={set} />}
            {step === 3 && <StepVibe form={form} set={set} />}
            {step === 4 && <StepConnection form={form} set={set} />}
            {step === 5 && <StepMusic form={form} set={set} />}
            {step === 6 && <StepCreator form={form} set={set} />}
            {step === 7 && <StepFuture form={form} set={set} />}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="mt-5 rounded-xl bg-brand-pink/15 px-4 py-3 text-sm text-brand-pink">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:text-white disabled:opacity-0"
          >
            <ArrowLeft size={16} /> Back
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-brand-gradient bg-[length:200%_auto] px-7 py-3 text-sm font-semibold shadow-lg shadow-brand-purple/25 transition-all hover:bg-[position:100%_50%] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  Submit <CheckCircle2 size={18} />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              disabled={!stepValid}
              className="group inline-flex items-center gap-2 rounded-full bg-brand-gradient bg-[length:200%_auto] px-7 py-3 text-sm font-semibold shadow-lg shadow-brand-purple/25 transition-all hover:bg-[position:100%_50%] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          )}
        </div>
        {step === 0 && !stepValid && (
          <p className="mt-3 text-right text-xs text-white/40">
            Please enter a valid email — or leave it blank to stay anonymous.
          </p>
        )}
      </div>
    </div>
  );
}

type StepProps = {
  form: SurveyPayload;
  set: <K extends keyof SurveyPayload>(key: K, val: SurveyPayload[K]) => void;
};

function StepAbout({ form, set }: StepProps) {
  return (
    <>
      <p className="rounded-2xl bg-white/5 px-4 py-3 text-xs text-white/55">
        🔒 <span className="font-semibold text-white/75">Anonymous by
        default.</span>{" "}
        Every question is optional — skip anything. Add your email only if you
        want early access and updates.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" hint="(optional)">
          <TextInput
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="Or stay anonymous"
          />
        </Field>
        <Field label="Email" hint="(optional — for early access & updates)">
          <TextInput
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@email.com"
          />
        </Field>
        <Field label="Phone Number" hint="(optional)">
          <TextInput
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+1 555 000 0000"
          />
        </Field>
        <Field label="Instagram Handle" hint="(optional)">
          <TextInput
            value={form.instagram}
            onChange={(e) => set("instagram", e.target.value)}
            placeholder="@yourhandle"
          />
        </Field>
        <Field label="City">
          <TextInput
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="Where do you go out?"
          />
        </Field>
        <Field label="Occupation">
          <TextInput
            value={form.occupation}
            onChange={(e) => set("occupation", e.target.value)}
            placeholder="What do you do?"
          />
        </Field>
      </div>
      <Field label="Age Range">
        <RadioGroup
          options={AGE_RANGES}
          value={form.ageRange}
          onChange={(v) => set("ageRange", v)}
          columns={4}
        />
      </Field>
      <Field label="Current Status">
        <RadioGroup
          options={STATUS_OPTIONS}
          value={form.status}
          onChange={(v) => set("status", v)}
          columns={3}
        />
      </Field>
    </>
  );
}

function StepRealTalk({ form, set }: StepProps) {
  return (
    <>
      <Field label="What frustrates you most about events today?">
        <TextArea
          value={form.eventFrustrations}
          onChange={(e) => set("eventFrustrations", e.target.value)}
          placeholder="Be honest — the more real, the better."
        />
      </Field>
      <Field label="Why do you think people are going out less?">
        <TextArea
          value={form.goingOutLess}
          onChange={(e) => set("goingOutLess", e.target.value)}
        />
      </Field>
      <Field label="What makes an event feel worth attending?">
        <TextArea
          value={form.worthAttending}
          onChange={(e) => set("worthAttending", e.target.value)}
        />
      </Field>
      <Field label="Have you ever spent money on an event and felt disappointed afterward?">
        <RadioGroup
          options={YES_NO}
          value={form.spentAndDisappointed}
          onChange={(v) => set("spentAndDisappointed", v)}
          columns={2}
        />
      </Field>
      {form.spentAndDisappointed === "Yes" && (
        <Field label="If yes, why?">
          <TextArea
            value={form.disappointedWhy}
            onChange={(e) => set("disappointedWhy", e.target.value)}
            placeholder="What let you down?"
          />
        </Field>
      )}
    </>
  );
}

function StepWant({ form, set }: StepProps) {
  return (
    <>
      <Field label="What types of experiences interest you most?" hint="(select all that apply)">
        <CheckboxGroup
          options={EXPERIENCE_INTERESTS}
          value={form.experienceInterests}
          onChange={(v) => set("experienceInterests", v)}
          columns={2}
        />
      </Field>
      <Field label="What would motivate you to attend more events?">
        <TextArea
          value={form.motivation}
          onChange={(e) => set("motivation", e.target.value)}
        />
      </Field>
      <Field label="What is missing in your city?">
        <TextArea
          value={form.missingInCity}
          onChange={(e) => set("missingInCity", e.target.value)}
        />
      </Field>
    </>
  );
}

function StepVibe({ form, set }: StepProps) {
  const remaining = MAX_VIBE_WORDS - form.vibeWords.length;
  return (
    <>
      <Field
        label="Choose 5 words"
        hint={
          remaining > 0
            ? `(${remaining} more)`
            : "(5 of 5 — tap one to swap)"
        }
      >
        <CheckboxGroup
          options={VIBE_WORDS}
          value={form.vibeWords}
          onChange={(v) => set("vibeWords", v)}
          columns={2}
          max={MAX_VIBE_WORDS}
        />
      </Field>
      <p className="rounded-2xl bg-white/5 px-4 py-3 text-xs text-white/45">
        Your vibe helps us understand the energy of the room — and who you&apos;ll
        click with.
      </p>
    </>
  );
}

function StepConnection({ form, set }: StepProps) {
  return (
    <>
      <Field label="What are you hoping to gain from experiences?" hint="(select all that apply)">
        <CheckboxGroup
          options={GAIN_OPTIONS}
          value={form.hopingToGain}
          onChange={(v) => set("hopingToGain", v)}
          columns={2}
        />
      </Field>
      <Field label="How do you prefer meeting people?">
        <RadioGroup
          options={MEETING_PREFERENCES}
          value={form.meetingPreference}
          onChange={(v) => set("meetingPreference", v)}
          columns={2}
        />
      </Field>
      <Field label="How important is affordability?">
        <ScaleInput
          value={form.affordabilityImportance}
          onChange={(v) => set("affordabilityImportance", v)}
        />
      </Field>
      <Field label="How important is meeting like-minded people?">
        <ScaleInput
          value={form.likeMindedImportance}
          onChange={(v) => set("likeMindedImportance", v)}
        />
      </Field>
    </>
  );
}

function StepMusic({ form, set }: StepProps) {
  return (
    <>
      <Field label="Favorite genres" hint="(select all that apply)">
        <CheckboxGroup
          options={MUSIC_GENRES}
          value={form.musicGenres}
          onChange={(v) => set("musicGenres", v)}
          columns={2}
        />
      </Field>
      <Field label="Preferred event music">
        <RadioGroup
          options={EVENT_MUSIC}
          value={form.preferredEventMusic}
          onChange={(v) => set("preferredEventMusic", v)}
          columns={2}
        />
      </Field>
      <Field label="How important is music to your experience?">
        <ScaleInput
          value={form.musicImportance}
          onChange={(v) => set("musicImportance", v)}
        />
      </Field>
      <Field label="Would you attend an event because of the DJ?">
        <RadioGroup
          options={YES_NO}
          value={form.attendForDj}
          onChange={(v) => set("attendForDj", v)}
          columns={2}
        />
      </Field>
      <Field label="Would you want to discover new DJs?">
        <RadioGroup
          options={YES_NO}
          value={form.discoverDjs}
          onChange={(v) => set("discoverDjs", v)}
          columns={2}
        />
      </Field>
    </>
  );
}

function StepCreator({ form, set }: StepProps) {
  return (
    <>
      <Field label="Do you host events?">
        <RadioGroup
          options={YES_NO}
          value={form.hostsEvents}
          onChange={(v) => set("hostsEvents", v)}
          columns={2}
        />
      </Field>
      {form.hostsEvents === "Yes" && (
        <>
          <Field label="What type?">
            <RadioGroup
              options={EVENT_TYPES}
              value={form.eventType}
              onChange={(v) => set("eventType", v)}
              columns={3}
            />
          </Field>
          <Field label="What challenges do you face?" hint="(select all that apply)">
            <CheckboxGroup
              options={CREATOR_CHALLENGES}
              value={form.creatorChallenges}
              onChange={(v) => set("creatorChallenges", v)}
              columns={2}
            />
          </Field>
          <Field label="How could SoMingle help?">
            <TextArea
              value={form.howSomingleHelps}
              onChange={(e) => set("howSomingleHelps", e.target.value)}
            />
          </Field>
        </>
      )}
      {form.hostsEvents === "No" && (
        <p className="rounded-2xl bg-white/5 px-4 py-4 text-sm text-white/55">
          No worries — this section is for hosts and brands. Tap Continue to keep
          going.
        </p>
      )}
    </>
  );
}

function StepFuture({ form, set }: StepProps) {
  return (
    <>
      <Field label="Describe your dream event.">
        <TextArea
          value={form.dreamEvent}
          onChange={(e) => set("dreamEvent", e.target.value)}
          placeholder="If money and logistics weren't a problem — what would it be?"
          className="min-h-[140px]"
        />
      </Field>
      <Field label="Would you like early access to SoMingle?">
        <RadioGroup
          options={YES_NO}
          value={form.wantsEarlyAccess}
          onChange={(v) => set("wantsEarlyAccess", v)}
          columns={2}
        />
      </Field>
      {form.wantsEarlyAccess === "Yes" && (
        <Field
          label="Where should we send your early access?"
          hint="(optional — your answers stay anonymous without it)"
        >
          <TextInput
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@email.com"
          />
        </Field>
      )}
      <Field label="Would you like to become:" hint="(select all that apply)">
        <CheckboxGroup
          options={ROLE_OPTIONS}
          value={form.rolesInterested}
          onChange={(v) => set("rolesInterested", v)}
          columns={2}
        />
      </Field>

      <div className="gradient-border mt-2 rounded-2xl p-[1px]">
        <div className="rounded-2xl bg-ink-900/60 p-5">
          <Field label="What makes you instantly feel like you belong somewhere?">
            <TextArea
              value={form.belongingFeeling}
              onChange={(e) => set("belongingFeeling", e.target.value)}
              placeholder="The moment you know you're in the right room…"
              className="min-h-[120px]"
            />
          </Field>
        </div>
      </div>
    </>
  );
}
