"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import {
  BRANCHES,
  SEMESTERS,
  PROFILE_STORAGE_KEY,
  defaultProfile,
  type LedgerProfile,
} from "@/lib/data";

/**
 * LoginWidget — the modern glass auth card.
 *
 * Fields: Branch, Semester, Section, and Hostel/Day-Scholar status. On submit
 * it persists the chosen profile to localStorage (so the dashboard shows the
 * student's real selection), shows a brief "authenticating" shimmer, then
 * navigates to the dashboard. Static demo, but the shape matches a real auth
 * flow and is easy to swap for Firebase/DB.
 */
export default function LoginWidget() {
  const [profile, setProfile] = useState<LedgerProfile>(() => {
    // Hydrate from a previous login where present, else sensible defaults.
    const saved = defaultProfile();
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<LedgerProfile>;
          if (parsed.branchId) saved.branchId = parsed.branchId;
          if (typeof parsed.semesterId === "number") saved.semesterId = parsed.semesterId;
          if (parsed.section) saved.section = parsed.section;
          if (parsed.hostel) saved.hostel = parsed.hostel;
        }
      } catch {
        /* ignore malformed storage */
      }
    }
    return saved;
  });
  const [loading, setLoading] = useState(false);

  const currentBranch = BRANCHES.find((b) => b.id === profile.branchId) ?? BRANCHES[0];

  const onBranchChange = (id: string) => {
    const b = BRANCHES.find((x) => x.id === id);
    setProfile((p) => ({ ...p, branchId: id, section: b?.sections[0] ?? "A" }));
  };

  const submit = () => {
    setLoading(true);
    // Persist the selection so the dashboard topbar reflects what was chosen.
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* private mode — dashboard falls back to defaults */
    }
    // Small artificial delay so the motion state is visible, then open the
    // dashboard (kept as a push to avoid building a router dependency here).
    setTimeout(() => {
      window.location.assign("/dashboard");
    }, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glass backdrop-blur-lg"
    >
      <div className="mb-5 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet text-white shadow-glow">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">The Ledger</p>
          <p className="text-xs text-stone-400">Sign in to continue</p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-[11px] uppercase tracking-wide text-stone-400">
          Branch
          <select
            value={profile.branchId}
            onChange={(e) => onBranchChange(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-stone-200 outline-none"
          >
            {BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-[11px] tracking-wide text-stone-400">Semester</span>
            <select
              value={profile.semesterId}
              onChange={(e) =>
                setProfile((p) => ({ ...p, semesterId: Number(e.target.value) }))
              }
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-stone-200 outline-none"
            >
              {SEMESTERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-[11px] tracking-wide text-stone-400">Section</span>
            <select
              value={profile.section}
              onChange={(e) =>
                setProfile((p) => ({ ...p, section: e.target.value }))
              }
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-stone-200 outline-none"
            >
              {currentBranch.sections.map((s) => (
                <option key={s} value={s}>
                  Section {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-[11px] uppercase tracking-wide text-stone-400">
          Hostel / Day Scholar
          <select
            value={profile.hostel}
            onChange={(e) => setProfile((p) => ({ ...p, hostel: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-stone-200 outline-none"
          >
            <option>Day Scholar</option>
            <option>Tagore Hostel</option>
            <option>VS Hostel</option>
          </select>
        </label>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={submit}
          disabled={loading}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet to-pinksoft px-4 py-3 text-sm font-semibold text-white shadow-glow transition disabled:cursor-not-allowed"
        >
          {loading ? (
            <Sparkles className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Enter Dashboard
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </motion.button>

        <p className="mt-4 text-center text-[11px] text-stone-500">
          Web build for the odd semester · led by a student tech team
        </p>
      </div>
    </motion.div>
  );
}