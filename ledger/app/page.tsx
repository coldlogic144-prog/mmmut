"use client";

import { motion } from "framer-motion";
import { Shield, BookOpenCheck, Trophy, Radar } from "lucide-react";
import GradientText from "@/components/GradientText";
import Typewriter from "@/components/Typewriter";
import LoginWidget from "@/components/LoginWidget";

/**
 * Landing / Login screen.
 *
 * Hero copy ("The Ledger. Your semester, period by period.") with a Typewriter
 * cycling the three headline verbs, a small feature strip, and the glass login
 * card. Fully responsive — the two halves collapse on small screens.
 */
export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Hero flourishes */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-28 -right-24 h-96 w-96 rounded-full bg-violet/20 blur-3xl animate-float"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.2, duration: 1 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-pinksoft/15 blur-3xl"
      />

      {/* Top brand row */}
      <header className="flex items-center gap-2 px-6 py-5">
        <div className="flex items-center">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet to-pinksoft text-white">
            <Radar className="h-4 w-4" />
          </div>
          <span className="ml-2 text-sm font-bold tracking-wide text-stone-200">
            The Ledger
          </span>
        </div>
        <span className="ml-auto rounded-full border border-white/10 px-3 py-1 text-xs text-stone-300">
          MMMUT · B.Tech 2026
        </span>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-10 px-6 pt-6 lg:grid-cols-2">
        {/* Left: hero copy */}
        <div className="space-y-5">
          <motion.h1
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl leading-[1.05] font-extrabold tracking-tight text-stone-50 sm:text-6xl"
          >
            <GradientText as="span">The Ledger.</GradientText>
            <br />
            <span className="text-stone-300">Your semester,</span>
            <br />
            <span className="text-stone-300">period by period.</span>
          </motion.h1>

          <p className="max-w-md text-stone-400 text-lg">
            One calm home for{" "}
            <Typewriter
              phrases={[
                "Track Attendance",
                "View Timetable",
                "Ace your Minor Tests",
              ]}
              className="font-semibold text-violet"
            />
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { icon: Shield, label: "Attendance" },
              { icon: BookOpenCheck, label: "Syllabus" },
              { icon: Trophy, label: "Clubs" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <Icon className="h-4 w-4 text-violet-400" />
                <span className="text-xs text-stone-300">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: login card */}
        <div className="justify-center">
          <LoginWidget />
        </div>
      </div>

      <footer className="px-6 py-4 text-center text-xs text-stone-600">
        Built with Next.js, Tailwind CSS & Framer Motion · The Ledger student dashboard
      </footer>
    </main>
  );
}