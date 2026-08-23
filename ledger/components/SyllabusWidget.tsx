"use client";

import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, Loader2, CircleDashed } from "lucide-react";
import { SYLLABUS } from "@/lib/data";

/**
 * SyllabusWidget — compact cards with per-unit progress chips. Mirrors the
 * "quick link cards to view the curriculum" requirement from the spec.
 */
export default function SyllabusWidget() {
  return (
    <section className="grid gap-3 sm:grid-cols-1">
      {SYLLABUS.map((sub, i) => (
        <motion.div
          key={sub.code}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className="card"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet/15 text-violet-400">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] text-stone-500">{sub.code}</p>
              <h4 className="font-semibold text-stone-100">{sub.name}</h4>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {sub.units.map((u) => {
              const Icon =
                u.status === "Done"
                  ? CheckCircle2
                  : u.status === "Ongoing"
                    ? Loader2
                    : CircleDashed;
              return (
                <li key={u.id} className="flex items-center gap-2 text-sm">
                  <Icon
                    className={
                      "h-4 w-4 " +
                      (u.status === "Done"
                        ? "text-moss"
                        : u.status === "Ongoing"
                          ? "animate-spin text-violet-400"
                          : "text-stone-500")
                    }
                  />
                  <span
                    className={
                      u.status === "Done"
                        ? "text-stone-400 line-through"
                        : u.status === "Ongoing"
                          ? "text-stone-200"
                          : "text-stone-500"
                    }
                  >
                    {u.title}
                  </span>
                </li>
              );
            })}
          </ul>
        </motion.div>
      ))}
    </section>
  );
}