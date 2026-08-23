"use client";

import { motion } from "framer-motion";
import { MapPin, Clock3 } from "lucide-react";
import { bellSchedule } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * TimetableWidget — today's bell schedule as a vertical timeline.
 *
 * The *current* ongoing period (between start & end clock-times) is lifted and
 * given a gradient glow so it reads at a glance.
 */

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function currentPeriodIndex(periods: ReturnType<typeof bellSchedule>["periods"]) {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  // Fall back to the first upcoming period if morning hasn't started.
  for (let i = 0; i < periods.length; i++) {
    const start = toMinutes(periods[i].start);
    const end = toMinutes(periods[i].end);
    if (end === 0 && start === 0) continue;
    if (mins >= start && mins < end) return i;
  }
  return -1;
}

export default function TimetableWidget() {
  const { day, periods } = bellSchedule();
  const active = currentPeriodIndex(periods);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-stone-100">Bell Schedule</h3>
          <p className="text-xs text-stone-500">{day}&apos;s classes</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-violet/15 px-2.5 py-1 text-[11px] font-semibold text-violet-400">
          <Clock3 className="h-3 w-3" /> LIVE
        </span>
      </div>

      <ul className="mt-5 grid gap-2">
        {periods.map((p, i) => {
          const isFree = p.type === "Free";
          const isActive = i === active;
          return (
            <motion.li
              key={p.slot}
              layout
              animate={{ y: isActive ? -2 : 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-white/5 px-3 py-2 text-sm transition",
                isActive && "bg-gradient-to-r from-violet/25 to-pinksoft/20 shadow-glow",
                isFree && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold",
                  isActive ? "bg-violet text-white" : "bg-white/5 text-stone-300",
                )}
              >
                {p.slot}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-stone-100">
                  {p.name || "Free"}
                  {p.code && <span className="ml-1 text-stone-500">· {p.code}</span>}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-stone-500">
                  <MapPin className="h-3 w-3" /> {p.room}
                </p>
              </div>
              <span className="text-[11px] text-stone-400">
                {p.start}–{p.end}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}