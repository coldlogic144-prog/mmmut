/**
 * The Ledger — static demo data.
 *
 * This keeps components clean and gives a single source of truth for the
 * dashboard's content. In a real deployment these would be replaced by the
 * Firebase / DB layer; here they make the whole experience feel instant and
 * self-contained.
 */

/* ============ Branches ============ */

export type Branch = { id: string; name: string; sections: string[] };

export const BRANCHES: Branch[] = [
  { id: "civil", name: "Civil Engineering (CED)", sections: ["A", "B"] },
  { id: "cse", name: "Computer Sc. & Engineering (CSD)", sections: ["A", "B", "C", "D"] },
  { id: "it", name: "Information Technology", sections: ["A", "B"] },
  { id: "ece", name: "Electronics & Comm. Engg.", sections: ["A", "B", "C"] },
  { id: "me", name: "Mechanical Engineering", sections: ["A", "B"] },
  { id: "bba", name: "BBA", sections: ["A", "B"] },
];

/* ============ Semesters ============ */

export type Semester = { id: number; label: string };

/** B.Tech semester ladder — the student picks one on the login screen. */
export const SEMESTERS: Semester[] = [
  { id: 1, label: "Semester 1" },
  { id: 2, label: "Semester 2" },
  { id: 3, label: "Semester 3" },
  { id: 4, label: "Semester 4" },
  { id: 5, label: "Semester 5" },
  { id: 6, label: "Semester 6" },
];

/** The profile a student chooses on the login card, persisted locally. */
export type LedgerProfile = {
  branchId: string;
  semesterId: number;
  section: string;
  hostel: string;
};

export const PROFILE_STORAGE_KEY = "ledger.profile";

export function defaultProfile(): LedgerProfile {
  return {
    branchId: BRANCHES[1].id, // cse
    semesterId: 1,
    section: BRANCHES[1].sections[0], // "A"
    hostel: "Day Scholar",
  };
}

/* ============ Bell schedule ============ */

export type PeriodType = "Lecture" | "Practical" | "Tutorial" | "Free";

export type Period = {
  slot: string; // "I" | "II" ...
  code: string;
  name: string;
  type: PeriodType;
  room: string;
  start: string; // "09:00"
  end: string; // "10:00"
};

export type BellDay = { day: string; periods: Period[] };

/** Bell for a CSE-style student; uses the current weekday by default. */
export function bellSchedule(dayOverride?: string): BellDay {
  const day = dayOverride ?? new Date().toLocaleDateString("en-US", { weekday: "long" });
  return { day, periods: SCHEDULE_BY_DAY[day] ?? SCHEDULE_BY_DAY["Monday"] };
}

const SLOT_TIMES: { name: string; start: string; end: string }[] = [
  { name: "I", start: "09:00", end: "10:00" },
  { name: "II", start: "10:00", end: "11:00" },
  { name: "III", start: "11:00", end: "12:00" },
  { name: "IV", start: "12:00", end: "13:00" },
  { name: "V", start: "14:00", end: "15:00" },
  { name: "VI", start: "15:00", end: "16:00" },
  { name: "VII", start: "16:00", end: "17:00" },
  { name: "VIII", start: "17:00", end: "18:00" },
];

type Row = [string, string, PeriodType, string];

function build(rows: Row[]): Period[] {
  return rows.map((row, i) => {
    const slot = SLOT_TIMES[i] ?? { name: String(i + 1), start: "—", end: "—" };
    return {
      slot: slot.name,
      code: row[0],
      name: row[1],
      type: row[2] as PeriodType,
      room: row[3],
      start: slot.start,
      end: slot.end,
    };
  });
}

const DAY_ROWS: Record<string, Row[]> = {
  Monday: [
    ["BSM-110", "Engineering Mathematics I", "Lecture", "TL-206"],
    ["BSM-131", "Engineering Physics", "Lecture", "TL-201"],
    ["BCS-110", "Introduction to C", "Practical", "CRL-3"],
    ["", "Self Study / Library", "Free", "—"],
    ["BSM-110", "Mathematics Tutorial", "Tutorial", "S-2"],
    ["BHS-101", "Universal Human Values", "Lecture", "TL-109"],
  ],
  Tuesday: [
    ["BSM-110", "Engineering Mathematics I", "Lecture", "TL-206"],
    ["BCS-110", "Introduction to C", "Lecture", "TL-201"],
    ["BCS-111", "Web Designing I", "Practical", "Lab-5"],
    ["", "Self Study / Library", "Free", "—"],
    ["BHS-101", "Universal Human Values", "Lecture", "TL-109"],
    ["BSM-131", "Engineering Physics", "Lecture", "TL-201"],
  ],
  Wednesday: [
    ["BSM-131", "Engineering Physics", "Practical", "Lab-2"],
    ["BCS-110", "Introduction to C", "Lecture", "TL-301"],
    ["", "Self Study / Library", "Free", "—"],
    ["", "Self Study / Library", "Free", "—"],
    ["BSM-110", "Mathematics Tutorial", "Tutorial", "S-2"],
    ["BHS-101", "Universal Human Values", "Lecture", "TL-109"],
  ],
  Thursday: [
    ["", "Self Study / Library", "Free", "—"],
    ["", "Self Study / Library", "Free", "—"],
    ["BSM-131", "Engineering Physics", "Practical", "Lab-2"],
    ["BCS-111", "Web Designing I", "Practical", "Lab-5"],
    ["", "Sports / Club Activity", "Free", "GV"],
    ["", "Self Study / Library", "Free", "—"],
  ],
  Friday: [
    ["BSM-110", "Mathematics Tutorial", "Tutorial", "S-2"],
    ["BCS-111", "Web Designing I", "Lecture", "TL-301"],
    ["BHS-101", "Universal Human Values", "Lecture", "TL-206"],
    ["", "Self Study / Library", "Free", "—"],
    ["BSM-131", "Engineering Physics", "Lecture", "TL-201"],
    ["", "Club Hour", "Free", "Clubs"],
  ],
};

const SCHEDULE_BY_DAY: Record<string, Period[]> = Object.fromEntries(
  Object.entries(DAY_ROWS).map(([day, rows]) => [day, build(rows)]),
);
/* ============ Attendance ============ */

export type AttendanceResult = {
  present: number; // current %
  attended: number;
  total: number;
  forecast: number[]; // projected % after 1..n more misses
};

export function forecastAttendance(
  attended: number,
  total: number,
  missClasses: number,
): AttendanceResult {
  const safeTotal = Math.max(total, 1);
  const forecast = Array.from({ length: missClasses }, (_, i) => {
    const newTotal = safeTotal + (i + 1);
    return Math.round((attended / newTotal) * 1000) / 10;
  });
  return {
    present: Math.round((attended / safeTotal) * 1000) / 10,
    attended,
    total: safeTotal,
    forecast,
  };
}

/* ============ Announcements ============ */

export type Announcement = {
  id: number;
  tag: string;
  title: string;
  body: string;
  urgent: boolean;
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    tag: "EXAM",
    title: "Minor Test I Schedule Released",
    body: "Minor Test I begins next Monday. Verify your seating and bring your ID card.",
    urgent: true,
  },
  {
    id: 2,
    tag: "CLUB",
    title: "Chess Club qualifiers this Friday",
    body: "Register in the community board by Thursday 5 PM for the knockout round.",
    urgent: false,
  },
  {
    id: 3,
    tag: "ACADEMIC",
    title: "Web Designing I lab moved",
    body: "Friday's Web Designing I practical now happens in Lab-5 instead of Lab-4.",
    urgent: true,
  },
];
/* ============ Syllabus ============ */

export type SyllabusUnit = {
  id: number;
  title: string;
  status: "Done" | "Ongoing" | "Upcoming";
};

export const SYLLABUS: { code: string; name: string; units: SyllabusUnit[] }[] = [
  {
    code: "BSM-110",
    name: "Engineering Mathematics I",
    units: [
      { id: 1, title: "Matrices & Determinants", status: "Done" },
      { id: 2, title: "Calculus of Single Variable", status: "Done" },
      { id: 3, title: "Vector Calculus", status: "Ongoing" },
      { id: 4, title: "Sequence & Series", status: "Upcoming" },
    ],
  },
  {
    code: "BSM-131",
    name: "Engineering Physics",
    units: [
      { id: 1, title: "Interference & Diffraction", status: "Done" },
      { id: 2, title: "Lasers & Fibre Optics", status: "Ongoing" },
      { id: 3, title: "Quantum Mechanics", status: "Upcoming" },
    ],
  },
  {
    code: "BCS-110",
    name: "Introduction to C Programming",
    units: [
      { id: 1, title: "Basics & I/O", status: "Done" },
      { id: 2, title: "Control Flow & Arrays", status: "Done" },
      { id: 3, title: "Functions & Recursion", status: "Ongoing" },
      { id: 4, title: "Pointers & Structures", status: "Upcoming" },
    ],
  },
];

/* ============ Academic calendar ============ */

export type CalendarEvent = {
  id: number;
  start: string;
  end: string;
  title: string;
  kind: string;
};

export const ACADEMIC_CALENDAR: CalendarEvent[] = [
  { id: 1, start: "2026-08-01", end: "2026-12-18", title: "Odd Semester", kind: "Semester" },
  { id: 2, start: "2026-08-24", end: "2026-08-28", title: "Minor Test I", kind: "Exam" },
  { id: 3, start: "2026-09-15", end: "2026-09-17", title: "Mid-Semester Break", kind: "Holiday" },
  { id: 4, start: "2026-10-20", end: "2026-10-24", title: "Minor Test II", kind: "Exam" },
  { id: 5, start: "2026-12-14", end: "2026-12-18", title: "End Semester Practicals", kind: "Exam" },
];
/* ============ Chess club ============ */

export type ChessPlayer = {
  id: number;
  name: string;
  elo: number;
  wins: number;
  losses: number;
  active: boolean;
};

export const CHESS_LEADERBOARD: ChessPlayer[] = [
  { id: 1, name: "Aishwary C.", elo: 1420, wins: 18, losses: 4, active: true },
  { id: 2, name: "Ankit R.", elo: 1365, wins: 15, losses: 6, active: true },
  { id: 3, name: "Divyansh S.", elo: 1310, wins: 12, losses: 7, active: false },
  { id: 4, name: "Naman B.", elo: 1275, wins: 10, losses: 9, active: true },
];

/* ============ Community & support ============ */

export type Post = { id: number; author: string; body: string; likes: number; tags: string[] };

export const COMMUNITY_POSTS: Post[] = [
  {
    id: 1,
    author: "riya.civil26",
    body: "Anyone else find the Mathematics tutorial notes helpful? Sharing them here 👇",
    likes: 23,
    tags: ["academic"],
  },
  {
    id: 2,
    author: "ayan.cse26",
    body: "Lost a black notebook near TL-206. Message me if found!",
    likes: 9,
    tags: ["campus"],
  },
  {
    id: 3,
    author: "prateek.me26",
    body: "Club hour this week is in the auditorium — bring your canteen pass.",
    likes: 14,
    tags: ["club"],
  },
];

export type Ticket = { id: number; subject: string; status: "Open" | "Resolved"; branch: string };

export const SUPPORT_TICKETS: Ticket[] = [
  { id: 101, subject: "Timetable override for TL-204 shows wrong room", status: "Open", branch: "cse" },
  { id: 102, subject: "Attendance not syncing after lab swap", status: "Resolved", branch: "civil" },
];

/* ============ Admin ============ */

export type AdminStats = {
  activeUsers: number;
  announcements: number;
  openTickets: number;
  presentToday: number;
  attendanceRate: number;
};

export const ADMIN_STATS: AdminStats = {
  activeUsers: 214,
  announcements: 3,
  openTickets: 1,
  presentToday: 172,
  attendanceRate: 78,
};