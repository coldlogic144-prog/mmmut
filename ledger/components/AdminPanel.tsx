"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Megaphone,
  Ticket,
  CalendarCheck,
  TrendingUp,
  Bell,
  Search,
  Trash2,
  Undo2,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import {
  ADMIN_STATS,
  SEED_ACCOUNTS,
  loadAccounts,
  saveAccounts,
  type AccountStatus,
  type LedgerAccount,
} from "@/lib/data";
import { cn } from "@/lib/utils";

/** Chip styling + label per account status. */
const STATUS_BADGE: Record<AccountStatus, string> = {
  active: "bg-moss/15 text-moss",
  pending: "bg-amber-500/15 text-amber-400",
  disabled: "bg-white/10 text-stone-400",
};

const STATUS_LABEL: Record<AccountStatus, string> = {
  active: "Active",
  pending: "Pending",
  disabled: "Disabled",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function shortDate(iso: string): string {
  return iso ? iso.slice(0, 10) : "—";
}

/**
 * AdminPanel — admin UI: KPI stat cards, an announcement composer, a slim
 * timetable-editor, and a Registered Accounts manager where admins can search
 * for student accounts and permanently delete them (persisted to localStorage).
 */
export default function AdminPanel() {
  const [accounts, setAccounts] = useState<LedgerAccount[]>(SEED_ACCOUNTS);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">("all");
  const [pending, setPending] = useState<LedgerAccount | null>(null);
  const [lastDeleted, setLastDeleted] = useState<LedgerAccount | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Hydrate the registry on mount (deleted accounts stay deleted).
  useEffect(() => {
    setAccounts(loadAccounts());
  }, []);

  // Close the confirm modal with Escape.
  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPending(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts
      .filter(
        (a) =>
          (statusFilter === "all" || a.status === statusFilter) &&
          (!q ||
            a.name.toLowerCase().includes(q) ||
            a.roll.toLowerCase().includes(q) ||
            a.email.toLowerCase().includes(q) ||
            a.branch.toLowerCase().includes(q) ||
            a.section.toLowerCase().includes(q)),
      )
      .sort((x, y) => x.name.localeCompare(y.name));
  }, [accounts, query, statusFilter]);

  const confirmDelete = () => {
    if (!pending) return;
    const next = accounts.filter((a) => a.id !== pending.id);
    setAccounts(next);
    saveAccounts(next);
    setLastDeleted(pending);
    setNotice(`${pending.name}'s account has been deleted.`);
    setPending(null);
    window.setTimeout(() => setNotice(null), 4500);
  };

  const undoDelete = () => {
    if (!lastDeleted) return;
    const restored = [lastDeleted, ...accounts];
    setAccounts(restored);
    saveAccounts(restored);
    setLastDeleted(null);
    setNotice(null);
  };

  const kpis = [
    { icon: Users, label: "Active Users", value: accounts.length },
    { icon: TrendingUp, label: "Today's Turnout", value: `${ADMIN_STATS.presentToday} present` },
    { icon: Megaphone, label: "Announcements", value: ADMIN_STATS.announcements },
    { icon: Ticket, label: "Open Tickets", value: ADMIN_STATS.openTickets },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="bg-clip-text bg-[linear-gradient(120deg,#8b5cf6,#ec4899)] text-transparent text-2xl font-extrabold">
          Admin Console
        </h1>
        <p className="text-sm text-stone-500">
          Manage {accounts.length} student accounts — search, review, or
          permanently delete access.
        </p>
      </header>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ icon: Icon, label, value }, i) => (
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

      {/* Registered accounts — search & delete */}
      <div className="card mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-brick" />
          <h3 className="font-semibold text-stone-100">Registered Accounts</h3>
          <span className="ml-auto rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium text-stone-400">
            {filtered.length} of {accounts.length}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, roll, email or branch…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-stone-200 outline-none placeholder:text-stone-500 focus:border-violet/50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AccountStatus | "all")}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-stone-200 outline-none focus:border-violet/50"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        {accounts.length === 0 ? (
          <p className="mt-4 rounded-xl border border-white/5 px-4 py-6 text-center text-sm text-stone-500">
            No registered accounts remain.
          </p>
        ) : filtered.length === 0 ? (
          <p className="mt-4 rounded-xl border border-white/5 px-4 py-6 text-center text-sm text-stone-500">
            No accounts match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <ul className="mt-4 max-h-[30rem] divide-y divide-white/5 overflow-y-auto pr-1">
            {filtered.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet/30 to-pinksoft/30 text-[11px] font-bold text-violet-300">
                  {initials(a.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-100">{a.name}</p>
                  <p className="truncate text-[11px] text-stone-500">
                    {a.roll} · {a.email}
                  </p>
                </div>
                <div className="hidden shrink-0 text-right md:block">
                  <p className="text-[11px] text-stone-400">
                    {a.branchId.toUpperCase()} · {a.section}
                  </p>
                  <p className="text-[10px] text-stone-600">last active {shortDate(a.lastActive)}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    STATUS_BADGE[a.status],
                  )}
                >
                  {STATUS_LABEL[a.status]}
                </span>
                <button
                  onClick={() => setPending(a)}
                  aria-label={`Delete ${a.name}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brick/10 px-2.5 py-1.5 text-[11px] font-semibold text-brick transition hover:bg-brick/25"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirm-delete modal */}
      <AnimatePresence>
        {pending && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setPending(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[min(92vw,440px)] rounded-2xl border border-white/10 bg-paper p-6 shadow-glass"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brick/15 text-brick">
                  <ShieldAlert className="h-4 w-4" />
                </span>
                <div>
                  <h3 id="delete-dialog-title" className="text-base font-semibold text-stone-100">
                    Delete this account?
                  </h3>
                  <p className="text-[11px] text-stone-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-stone-400">
                <b className="text-stone-100">{pending.name}</b> ({pending.roll}) will
                permanently lose access to The Ledger.
              </p>

              <dl className="mt-4 space-y-1.5 text-xs text-stone-400">
                {[
                  ["Branch", pending.branch],
                  ["Section", pending.section],
                  ["Roll No.", pending.roll],
                  ["Email", pending.email],
                  ["Last active", shortDate(pending.lastActive)],
                ].map(([kk, vv]) => (
                  <div key={kk} className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 text-stone-500">{kk}</dt>
                    <dd className="truncate text-right text-stone-200">{vv}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setPending(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-stone-200 transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="rounded-xl bg-brick px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 hover:shadow-[0_0_18px_rgba(248,113,113,.35)]"
                >
                  Delete account
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo toast */}
      <AnimatePresence>
        {(notice || lastDeleted) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-0 right-0 z-50 mx-auto flex w-max max-w-[92vw] items-center gap-3 rounded-xl border border-white/10 bg-paper px-4 py-2.5 shadow-glass"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-moss" />
            <span className="text-sm text-stone-200">{notice ?? "Account restored."}</span>
            {lastDeleted && (
              <button
                onClick={undoDelete}
                className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-violet-400 transition hover:text-violet-300"
              >
                <Undo2 className="h-3 w-3" /> Undo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}