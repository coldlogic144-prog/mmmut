"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send } from "lucide-react";

type ChatMessage = { role: "user" | "ai"; text: string };

/** Small local "intent" matcher so the demo answers real questions offline. */
function answer(input: string): string {
  const s = input.toLowerCase();
  if (s.includes("attend")) {
    return "You're at 75% overall. Missing 2 more classes drops you to ~68% — your 75% UFMC cutoff is still safe for now. 📉";
  }
  if (s.includes("timetable") || s.includes("period")) {
    return "Today: Mathematics (TL-206) I period, then Physics practical at Lab-2 after lunch. Check the Bell Schedule card above.";
  }
  if (s.includes("syllabus")) {
    return "BSM-110 covers Matrices → Vector Calculus → Sequences. We're currently on Unit 3 (Vector Calculus).";
  }
  if (s.includes("minor") || s.includes("test")) {
    return "Minor Test I runs 24–28 Aug. Syllabus = BSM-110 units 1–3. Good luck! 📚";
  }
  if (s.includes("chess")) {
    return "Chess Club quals are Friday. Aishwary C. leads with ELO 1420. Tap Challenge on the Chess card to play.";
  }
  return "I can help with attendance, timetable, syllabus, and Minor Tests. Try: “what if I miss 2 classes?”";
}

/**
 * Assistant — floating "Ledger AI" chat bubble (bottom-right). Local demo
 * brain keeps it deployable with zero backend.
 */
export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", text: "Hi! I'm Ledger AI — your academic assistant. Ask me about attendance, syllabus or timetables." },
  ]);
  const [draft, setDraft] = useState("");

  const send = () => {
    const q = draft.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: answer(q) }]);
    }, 500);
  };

  return (
    <>
      {/* Floating toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        aria-label="Open Ledger AI"
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-violet/40 bg-paper px-4 py-3 shadow-glow backdrop-blur-lg lg:bottom-6 lg:right-6"
      >
        <Bot className="h-5 w-5 text-violet-400" />
        <span className="hidden text-sm font-medium text-stone-100 sm:block">
          Ledger AI · Academic Assistant
        </span>
        {open ? <X className="h-4 w-4 text-stone-400" /> : null}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-20 right-4 z-40 flex h-[420px] w-[min(92vw,340px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-paper shadow-glass backdrop-blur-xl lg:bottom-24 lg:right-6"
          >
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-violet/20 text-violet-300">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-stone-100">Ledger AI</p>
                <p className="text-[10px] text-moss">◆ online · syllabus brain</p>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm " +
                    (m.role === "ai"
                      ? "rounded-tl-sm bg-white/8 text-stone-200"
                      : "ml-auto rounded-tr-sm bg-gradient-to-r from-violet to-pinksoft text-white")
                  }
                >
                  {m.text}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-white/5 px-3 py-2.5">
              <input
                value={draft}
                                onChange={(e) => setDraft((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about your semester…"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone-200 outline-none placeholder:text-stone-500"
              />
              <button onClick={send} className="btn-primary !px-3 !py-2 text-sm">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}