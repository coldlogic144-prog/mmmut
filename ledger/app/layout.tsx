import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

/**
 * The Ledger — root application shell.
 *
 * Responsibilities:
 *  - Loads Inter (variable weight) as the single app-wide sans font.
 *  - Sets dark viewport theme + metadata so every page inherits them.
 *  - Renders the fixed ambient glow behind the entire dashboard.
 *
 * Pages (app/page.tsx etc.) mount their own chrome — sidebar for the
 * dashboard, centered auth card for the landing screen — so this layout stays
 * intentionally thin and reusable.
 */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Ledger · Student Dashboard",
  description:
    "Your semester, period by period. Attendance, timetable, syllabus & community.",
  keywords: ["MMMUT", "student", "dashboard", "attendance", "timetable"],
  metadataBase: new URL("https://ledger.local"),
};

export const viewport: Viewport = {
  themeColor: "#0b0d14",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-gray-950 text-stone-100 antialiased">
        {/* Ambient violet glow behind everything. */}
        <div className="bg-ledger-glow" />
        {children}
      </body>
    </html>
  );
}