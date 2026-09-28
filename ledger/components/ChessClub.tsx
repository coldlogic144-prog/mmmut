"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Swords, Users } from "lucide-react";
import { CHESS_LEADERBOARD } from "@/lib/data";

/**
 * ChessClub — mini-dashboard: rank list of players, live members count, and a
 * "Challenge" button per row. Challenge opens a gentle confirm state.
 */
export default function ChessClub() {
  const [sent, setSent] = useState<number | null>(null);
  const active = CHESS_LEADERBOARD.filter((p) => p.active);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet to-pinksoft text-white shadow-glow">
          <Trophy className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold text-stone-100">Chess Club · Knockout</h3>
          <p className="flex items-center gap-1 text-xs text-stone-500">
            <Users className="h-3 w-3" /> {active.length} active members online
          </p>
        </div>
      </div>

      <ul className="grid gap-2">
        {CHESS_LEADERBOARD.map((p, i) => (
          <motion.li
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card flex items-center gap-3 !py-3"
          >
            <span className="w-5 text-sm font-bold text-stone-500">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet/15 text-xs font-bold text-violet-400">
              {p.name.split(" ").map((n) => n[0]).join("")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-100">
                {p.name}
                {p.active && (
                  <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-moss align-middle" />
                )}
              </p>
              <p className="text-[11px] text-stone-500">
                {p.wins}W · {p.losses}L · ELO {p.elo}
              </p>
            </div>
            <button
              onClick={() => setSent(p.id)}
              className="btn-primary !px-3 !py-1.5 text-xs"
            >
              {sent === p.id ? <span className="text-moss">Sent ✓</span> : (
                <>
                  <Swords className="mr-1 inline h-3.5 w-3.5" />
                  Challenge
                </>
              )}
            </button>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}