#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""roster_store.py — loads admission_data.csv into memory using the EXACT
normalization rules of student_roster_import.py (single source of truth for
the shape of studentRoster/{rollNumber} documents)."""
from __future__ import annotations

import csv
import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CSV = os.path.normpath(os.path.join(BASE_DIR, "..", "..", "data", "admission_data.csv"))

ROLL_RE = re.compile(r"^\d{10}$")
# Every B.Tech 2026-27 branch uses a 3-letter code in the enrollment number:
#   CED (Civil) CSD (CSE) EED (Electrical) ECD (ECE) IOT (ECE-IoT)
#   MED (Mechanical) CHD (Chemical) ITC (IT)
ENROLL_RE = re.compile(r"^2026([A-Z]{3})\d{4}$")


def norm_name(raw: str) -> str:
    """Roster-normalized candidate name — IDENTICAL to student_roster_import.py."""
    if not raw:
        return ""
    s = re.sub(r"[^A-Za-z]", " ", str(raw).upper())
    return " ".join(s.split())


def norm_section(raw) -> str:
    """Excel sections look like CE1A / CSE1B / ECE1C — keep the letter."""
    s = re.sub(r"\s+", "", str(raw or "")).upper()
    return s[-1] if s and s[-1].isalpha() else ""


def _load_rows(path: str) -> list[dict]:
    rows: list[dict] = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            rows.append({
                "formNumber": (r.get("Form_Number") or "").strip(),
                "rollNumber": (r.get("Roll_No") or "").strip(),
                "enrollmentNo": (r.get("Enrollment_No") or "").strip(),
                "name": (r.get("Applicant_Name") or "").strip(),
                "section": norm_section(r.get("Section")),
                "batch": (r.get("Batch") or "").strip(),
            })
    return rows


class RosterStore:
    """In-memory roster with lazy single load + optional mtime-based reload."""

    def __init__(self, path: str = None):
        self.path = path or os.environ.get("MMMUT_DATA_CSV", DEFAULT_CSV)
        self._by_roll: dict[str, dict] = {}
        self._tally: dict[str, int] = {}
        self._count = 0
        self._mtime = None
        self.reload()

    def reload(self) -> None:
        rows = _load_rows(self.path)
        well_formed = [r for r in rows if ROLL_RE.match(r["rollNumber"])]
        ordered = sorted(well_formed, key=lambda r: (int(r["rollNumber"]), r["rollNumber"]))
        block_idx, prev = 0, None
        block_of: dict[str, int] = {}
        for r in ordered:
            if prev is None or int(r["rollNumber"]) - int(prev["rollNumber"]) != 1:
                block_idx += 1
            block_of[r["rollNumber"]] = block_idx
            prev = r

        by_roll: dict[str, dict] = {}
        tally: dict[str, int] = {}
        for r in rows:
            roll = r["rollNumber"]
            if roll in by_roll or not ROLL_RE.match(roll):
                continue
            m = ENROLL_RE.match(r["enrollmentNo"])
            if not m:
                continue
            normalized = norm_name(r["name"])
            if not normalized:
                continue
            by_roll[roll] = {
                "rollNumber": roll,
                "enrollmentNo": r["enrollmentNo"],
                "applicantName": normalized,
                "formalName": r["name"],
                "branchName": m.group(1),
                "section": r["section"],
                "batch": r["batch"],
                "block": block_of.get(roll, 0),
                "sourceFormNumber": r["formNumber"],
            }
            tally[m.group(1)] = tally.get(m.group(1), 0) + 1

        self._by_roll = by_roll
        self._tally = tally
        self._count = len(by_roll)
        try:
            self._mtime = os.path.getmtime(self.path)
        except OSError:
            self._mtime = None

    def _maybe_reload(self) -> None:
        try:
            mt = os.path.getmtime(self.path)
        except OSError:
            return
        if self._mtime is not None and mt != self._mtime:
            self.reload()

    # ------------------------------------------------------------ queries --
    def get(self, roll: str) -> dict | None:
        if not ROLL_RE.match(str(roll or "")):
            return None
        self._maybe_reload()
        return self._by_roll.get(str(roll))

    def search(self, q: str, limit: int = 25) -> list[dict]:
        q = str(q or "").strip().upper()
        if not q:
            return []
        self._maybe_reload()
        out: list[dict] = []
        for roll, rec in self._by_roll.items():
            if roll.startswith(q) or q in rec["applicantName"]:
                out.append(rec)
                if len(out) >= limit:
                    break
        return out

    def stats(self) -> dict:
        return {"count": self._count, "branches": self._tally}


store = RosterStore()
