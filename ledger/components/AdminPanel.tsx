"use client";

import { motion } from "framer-motion";
import {
  Users,
  Megaphone,
  Ticket,
  CalendarCheck,
  TrendingUp,
  Bell,
} from "lucide-react";
import { ADMIN_STATS } from "@/lib/data";

/**
 * AdminPanel — minimal admin UI: KPI stat cards, an announcement composer,
 * and a slim timetable-editor (read + inline save for demo).
 */
export default function AdminPanel() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="bg-clip-text bg-[linear-gradient(120deg,#8b5cf6,#ec4899)] text-transparent text-2xl font-extrabold">
          Admin Console
        </h1>
        <p className="text-sm text-stone-500">
          Oversee 214 student accounts, the bell, and announcements.
        </p>
      </header>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Active Users", value: ADMIN_STATS.activeUsers },
          { icon: TrendingUp, label: "Today's Turnout", value: `${ADMIN_STATS.presentToday} present` },
          { icon: Megaphone, label: "Announcements", value: ADMIN_STATS.announcements },
          { icon: Ticket, label: "Open Tickets", value: ADMIN_STATS.openTickets },
        ].map(({ icon: Icon, label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card"
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-violet-400" />
              <span className="text-xs text-stone-400">{label}</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-white">{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Announcement builder */}
        <div className="card">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-violet-400" />
            <h3 className="font-semibold text-stone-100">Post Announcement</h3>
          </div>
          <div className="mt-4 space-y-2.5">
            <input
              placeholder="Headline"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-stone-200 outline-none"
            />
            <textarea
              rows={3}
              placeholder="Write the update…"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-stone-200 outline-none resize-none"
            />
            <button className="btn-primary w-full">Publish to Noticeboard</button>
          </div>
        </div>

        {/* Timetable editor (demo) */}
        <div className="card">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-violet-400" />
            <h3 className="font-semibold text-stone-100">Timetable Override</h3>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[11px] text-stone-400">Branch</span>
              <select className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-sm text-stone-200">
                <option>CSE (CSD)</option>
                <option>Civil (CED)</option>
                <option>IT</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-[11px] text-stone-400">Period</span>
              <select className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-sm text-stone-200">
                {["I", "II", "III", "IV", "V", "VI"].map((p) => (
                  <option key={p}>Period {p}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              placeholder="Room (e.g. TL-206)"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone-200 outline-none"
            />
            <button className="btn-primary text-sm">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}