import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminPanel from "@/components/AdminPanel";

export const metadata: Metadata = {
  title: "Admin · The Ledger",
};

/** Admin console route — desktop-only skeleton with a back-link to the app. */
export default function AdminPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-stone-400 transition hover:text-violet-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
      <AdminPanel />
    </main>
  );
}