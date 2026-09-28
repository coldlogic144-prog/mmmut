"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, GraduationCap, Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TimetableWidget from "@/components/TimetableWidget";
import AttendanceWidget from "@/components/AttendanceWidget";
import Announcements from "@/components/Announcements";
import SyllabusWidget from "@/components/SyllabusWidget";
import CalendarWidget from "@/components/CalendarWidget";
import ChessClub from "@/components/ChessClub";
import CommunityBoard from "@/components/CommunityBoard";
import Assistant from "@/components/Assistant";
import GradientText from "@/components/GradientText";
import {
  BRANCHES,
  SEMESTERS,
  PROFILE_STORAGE_KEY,
  defaultProfile,
} from "@/lib/data";

/** Maps the ?s= query to human-facing heading text. */
const TITLES: Record<string, string> = {
  "": "Your semester, at a glance",
  syllabus: "Syllabus & Curriculum",
  chess: "Chess Club",
  community: "Community & Feedback",
  calendar: "Academic Calendar",
};

/**
 * DashboardShell — the authenticated student experience.
 *
 * Renders the responsive Sidebar (rail on desktop, bottom-bar on mobile), a
 * glass topbar, and the active tab's module inside an AnimatePresence so tab
 * switches feel smooth and intentional.
 */
export default function DashboardShell({ tab }: { tab: string }) {
  const heading = TITLES[tab] ?? TITLES[""];

  // Read the profile picked on the login screen (hydrated after mount to keep
  // SSR output deterministic). Falls back to CSE · Sem 1 · Section A.
  const [profileLabel, setProfileLabel] = useState("CSE · Sem 1 · Section A");
  useEffect(() => {
    const fallback = defaultProfile();
    const branchName =
      BRANCHES.find((b) => b.id === fallback.branchId)?.name.replace(/ \(.*\)$/, "") ??
      "CSE";
    const semesterLabel =
      SEMESTERS.find((s) => s.id === fallback.semesterId)?.label ?? "Semester 1";
    setProfileLabel(`${branchName} · ${semesterLabel} · Section ${fallback.section}`);
    try {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<{
          branchId: string;
          semesterId: number;
          section: string;
        }>;
        const bName =
          BRANCHES.find((b) => b.id === p.branchId)?.name.replace(/ \(.*\)$/, "") ??
          branchName;
        const sLabel =
          SEMESTERS.find((s) => s.id === p.semesterId)?.label ?? semesterLabel;
        setProfileLabel(`${bName} · ${sLabel} · Section ${p.section ?? fallback.section}`);
      }
    } catch {
      /* keep default */
    }
  }, []);

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar activeTab={tab} />

      <div className="min-w-0 flex-1 pb-24 lg:pb-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/5 bg-paper/80 px-4 py-3 backdrop-blur-lg lg:px-8">
          <Menu className="h-5 w-5 text-stone-400 lg:hidden" aria-hidden />
          <div className="hidden items-center gap-2 text-violet-400 sm:flex">
            <GraduationCap className="h-5 w-5" />
            <span className="text-sm font-medium text-stone-300">
              {profileLabel}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-stone-300 hover:border-violet/40"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brick animate-pulse-glow" />
            </button>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet to-pinksoft text-xs font-bold text-white">
              R
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
          {/* Page heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-stone-100">
              <GradientText as="span">{heading}</GradientText>
            </h1>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab || "dashboard"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {tab === "syllabus" && <SyllabusWidget />}
              {tab === "chess" && <ChessClub />}
              {tab === "community" && <CommunityBoard />}
              {tab === "calendar" && <CalendarWidget />}
              {(tab === "" || tab === undefined) && (
                <div className="space-y-6">
                  <Announcements />
                  {/* Widget grid */}
                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <TimetableWidget />
                    </div>
                    <AttendanceWidget />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Assistant />
    </div>
  );
}