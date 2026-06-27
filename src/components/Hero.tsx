"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { ButtonLink } from "./ui/Button";

const tags = [
  "Rooftop socials",
  "Live music",
  "Creative meetups",
  "Founders & creators",
  "Real connections",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-24 sm:pt-44 md:pb-32">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-brand-radial blur-2xl" />
        <motion.div
          className="absolute -left-24 top-40 h-72 w-72 rounded-full bg-brand-purple/20 blur-3xl"
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-brand-pink/20 blur-3xl"
          animate={{ y: [0, -36, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-brand-gold/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-white/80"
        >
          <Sparkles size={14} className="text-brand-gold" />
          Come as you are. Let&apos;s be real again.
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        >
          Choose Your Vibe.
          <br />
          <span className="gradient-text animate-shimmer">Find Your Tribe.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="mx-auto mt-6 max-w-xl font-display text-lg font-semibold text-white/90 sm:text-xl"
        >
          Built for you. Guided by trust. Designed for real connection.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="mx-auto mt-5 max-w-2xl text-base text-white/70 sm:text-lg"
        >
          Welcome to SoMingle&mdash;the world&apos;s trusted community layer,
          where meaningful relationships begin and everyone has the opportunity
          to find where they belong.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <ButtonLink href="/survey" className="w-full sm:w-auto">
            Help Shape SoMingle
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </ButtonLink>
          <ButtonLink href="#waitlist" variant="secondary" className="w-full sm:w-auto">
            Join The Waitlist
          </ButtonLink>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-2"
        >
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full glass px-3.5 py-1.5 text-xs text-white/70"
            >
              {t}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
