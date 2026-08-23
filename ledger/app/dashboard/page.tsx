import type { Metadata } from "next";
import DashboardShell from "@/components/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard · The Ledger",
};

/**
 * Dashboard route (App Router).
 *
 * `searchParams` (Promise in Next 15) decides which module the shell shows:
 *   /dashboard            -> overview (timetable + attendance + announcements)
 *   /dashboard?s=syllabus -> syllabus
 *   /dashboard?s=chess    -> chess club
 *   /dashboard?s=community-> community/feedback board
 *   /dashboard?s=calendar -> academic calendar
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tab = typeof sp.s === "string" ? sp.s : "";
  return <DashboardShell tab={tab} />;
}