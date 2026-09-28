"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Trophy,
  MessagesSquare,
  BookOpen,
  Settings,
  LifeBuoy,
  LogOut,
  Radar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard?s=syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/dashboard?s=chess", label: "Chess Club", icon: Trophy },
  { href: "/dashboard?s=community", label: "Community", icon: MessagesSquare },
  { href: "/dashboard?s=calendar", label: "Calendar", icon: CalendarDays },
];

const BOTTOM = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard?s=syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/dashboard?s=chess", label: "Chess", icon: Trophy },
  { href: "/dashboard?s=community", label: "Board", icon: MessagesSquare },
];

/**
 * Sidebar — fixed left rail on desktop, floating bottom bar on mobile.
 *
 * Highlights the active route via a gradient dot; admin shortcut appears only
 * on large screens. Uses `nav indicator` underline for the bottom bar.
 */
export default function Sidebar({ activeTab }: { activeTab?: string }) {
  const pathname = usePathname();
  const activeHref = pathname + (activeTab ? `?s=${activeTab}` : "");

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-white/5 bg-paper/70 p-4 backdrop-blur-lg lg:flex">
        <div className="mb-8 flex items-center gap-2 px-1">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet to-pinksoft text-white">
            <Radar className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-stone-200">The Ledger</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard" && !activeTab
                : pathname === "/dashboard" && activeTab === href.split("?s=")[1];
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-violet/15 text-white"
                    : "text-stone-400 hover:bg-white/5 hover:text-stone-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 pt-3">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-400 transition hover:bg-white/5 hover:text-stone-100"
          >
            <Settings className="h-4 w-4" />
            Admin
          </Link>
          <Link
            href="#"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-400 transition hover:bg-white/5 hover:text-stone-100"
          >
            <LifeBuoy className="h-4 w-4" />
            Support
          </Link>
          <span className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-600">
            <LogOut className="h-4 w-4" />
            Signed in · CSE-A
          </span>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-white/10 bg-paper/90 px-2 py-2 backdrop-blur-lg lg:hidden">
        {BOTTOM.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard" && !activeTab
              : activeTab === href.split("?s=")[1];
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-medium transition",
                isActive ? "text-violet-400" : "text-stone-500",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
        <Link
          href="/admin"
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-medium transition",
            pathname === "/admin" ? "text-violet-400" : "text-stone-500",
          )}
        >
          <Settings className="h-5 w-5" />
          Admin
        </Link>
      </nav>
    </>
  );
}