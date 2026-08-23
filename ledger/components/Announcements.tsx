"use client";

import { motion } from "framer-motion";
import { Megaphone, ChevronRight } from "lucide-react";
import { ANNOUNCEMENTS } from "@/lib/data";

/**
 * Announcements — a CSS marquee ticker for urgent lines, followed by stacked
 * highlights where `urgent` items glow brick-red.
 */
export default function Announcements() {
  const urgent = ANNOUNCEMENTS.filter((a) => a.urgent);

  return (
    <section className="space-y-4">
      {/* Scrolling ticker */}
      <div className="overflow-hidden rounded-xl border border-white/8 bg-paper/60 py-2.5">
        <div className="flex items-center gap-2 text-xs text-stone-300">
          <span className="flex items-center gap-1.5 rounded-full bg-brick/15 px-2 py-0.5 font-semibold text-brick">
            <Megaphone className="h-3 w-3" /> LIVE
          </span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet/15 text-violet-400">
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
        <div className="mt-2 flex w-full whitespace-nowrap">
          <div className="animate-marquee min-w-full">
            {urgent.map((a) => (
              <span key={a.id} className="mx-8 text-sm text-stone-200">
                <b className="text-brick">{a.tag}:</b> {a.title} — {a.body}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stacked highlight cards */}
      <div className="grid gap-3">
        {ANNOUNCEMENTS.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="card"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                  (a.urgent
                    ? "bg-brick/20 text-brick"
                    : "bg-violet/15 text-violet-400")
                }
              >
                {a.tag}
              </span>
              <span className="text-[10px] text-stone-500">now</span>
            </div>
            <h4 className="mt-2 font-semibold text-stone-100">{a.title}</h4>
            <p className="mt-1 text-sm text-stone-400">{a.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}