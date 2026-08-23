"use client";

import { motion } from "framer-motion";
import { CalendarRange } from "lucide-react";
import { ACADEMIC_CALENDAR } from "@/lib/data";

const KIND_COLOR: Record<string, string> = {
  Semester: "bg-violet/15 text-violet-400",
  Exam: "bg-brick/15 text-brick",
  Holiday: "bg-moss/15 text-moss",
};

/**
 * CalendarWidget — compact academic calendar list; each event gets a dated
 * badge. Future real version would render an actual month grid.
 */
export default function CalendarWidget() {
  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <CalendarRange className="h-4 w-4 text-violet-400" />
        <h3 className="font-semibold text-stone-100">Academic Calendar</h3>
      </div>

      <ul className="mt-4 space-y-2">
        {ACADEMIC_CALENDAR.map((e, i) => (
          <motion.li
            key={e.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center justify-between gap-2 rounded-xl border border-white/5 px-3 py-2 text-sm"
          >
            <span className="font-medium text-stone-200">{e.title}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${KIND_COLOR[e.kind] ?? "bg-white/10 text-stone-300"}`}
            >
              {e.kind}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}