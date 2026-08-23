"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingDown, CheckCircle2 } from "lucide-react";
import { forecastAttendance } from "@/lib/data";

/**
 * AttendanceWidget — circular progress + "what if" forecast dropdown.
 *
 * Uses an SVG circle with a gradient stroke. The dropdown lets the student
 * see projected % after an arbitrary number of absent classes.
 */
export default function AttendanceWidget() {
  const [missCount, setMissCount] = useState(2);

  const result = useMemo(
    () => forecastAttendance(30, 40, missCount),
    [missCount],
  );

  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="card group">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-stone-100">Attendance</h3>
          <p className="text-xs text-stone-500">Overall this semester</p>
        </div>
        <span className="rounded-full bg-moss/15 px-2.5 py-1 text-[11px] font-semibold text-moss">
          Healthy
        </span>
      </div>

      <div className="mt-5 flex items-center gap-6">
        {/* Radial ring */}
        <div className="relative grid h-36 w-36 shrink-0 place-items-center">
          <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="10"
              className="stroke-white/10"
            />
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              stroke="url(#attGrad)"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference * (1 - result.present / 100) }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="attGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute grid place-items-center">
            <span className="text-3xl font-extrabold text-white">
              {result.present}%
            </span>
            <span className="text-[10px] text-stone-500">
              {result.attended}/{result.total} classes
            </span>
          </div>
        </div>

        {/* Forecast */}
        <div className="flex-1 space-y-3">
          <div>
            <label className="text-[11px] tracking-wide text-stone-400">
              If I miss the next …
            </label>
            <select
              value={missCount}
              onChange={(e) => setMissCount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-stone-200"
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} class{n === 1 ? "" : "es"}
                </option>
              ))}
            </select>
          </div>

          {missCount > 0 ? (
            <ul className="space-y-1.5 text-sm">
              {result.forecast.map((p, i) => (
                <li key={i} className="flex items-center gap-2 text-stone-300">
                  <TrendingDown className="h-3.5 w-3.5 text-brick" />
                  After {i + 1} miss → <b>{p}%</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-sm text-moss">
              <CheckCircle2 className="h-4 w-4" /> No dips expected.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}