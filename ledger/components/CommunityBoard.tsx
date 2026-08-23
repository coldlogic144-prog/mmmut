"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Send, MessageSquare } from "lucide-react";
import { COMMUNITY_POSTS, SUPPORT_TICKETS } from "@/lib/data";

/**
 * CommunityBoard — posts feed + support-ticket table. The compose box is
 * interactive (adds to local state so the page feels alive).
 */
export default function CommunityBoard() {
  const [posts, setPosts] = useState(COMMUNITY_POSTS);
  const [draft, setDraft] = useState("");
  const [liked, setLiked] = useState<number[]>([]);

  const publish = () => {
    if (!draft.trim()) return;
    setPosts((prev) => [
      {
        id: Date.now(),
        author: "you.cse26",
        body: draft.trim(),
        likes: 0,
        tags: ["new"],
      },
      ...prev,
    ]);
    setDraft("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Feed */}
      <div className="space-y-3 lg:col-span-2">
        <div className="card">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && publish()}
              placeholder="Share with your batch…"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-stone-200 outline-none placeholder:text-stone-500"
            />
            <button onClick={publish} className="btn-primary text-sm">
              <Send className="mr-1 inline h-4 w-4" /> Post
            </button>
          </div>
        </div>

        {posts.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card"
          >
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span className="font-semibold text-violet-400">{p.author}</span>
              {p.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/5 px-2 py-0.5 text-[10px]"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-2 text-sm text-stone-200">{p.body}</p>
            <div className="mt-3 flex items-center gap-4">
              <button
                onClick={() =>
                  setLiked((prev) =>
                    prev.includes(p.id)
                      ? prev.filter((x) => x !== p.id)
                      : [...prev, p.id],
                  )
                }
                className="flex items-center gap-1 text-xs text-stone-400 hover:text-brick"
              >
                <Heart
                  className={`h-3.5 w-3.5 ${liked.includes(p.id) ? "fill-brick text-brick" : ""}`}
                />
                {p.likes + (liked.includes(p.id) ? 1 : 0)}
              </button>
              <span className="flex items-center gap-1 text-xs text-stone-500">
                <MessageSquare className="h-3 w-3" /> reply
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Support tickets */}
      <div className="card self-start">
        <h3 className="font-semibold text-stone-100">Support Tickets</h3>
        <ul className="mt-3 space-y-2">
          {SUPPORT_TICKETS.map((t) => (
            <li
              key={t.id}
              className="rounded-xl border border-white/5 px-3 py-2 text-sm"
            >
              <span
                className={
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                  (t.status === "Open"
                    ? "bg-brick/15 text-brick"
                    : "bg-moss/15 text-moss")
                }
              >
                {t.status}
              </span>
              <p className="mt-1 text-stone-200">{t.subject}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}