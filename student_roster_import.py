#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
student_roster_import.py — ONE-TIME authoritative import of the B.Tech 1st Year
2026-27 CED/CSD admission roster (admission_data.csv) into Firestore's
`studentRoster` collection (docId = Roll_No).

RECOVERY-SAFE by design:
  * CREATE with merge onto `studentRoster` ONLY. No users, attendance, posts,
    notices, feedback, or auth users are ever touched.
  * No UID / password / Firebase Auth changes.
  * Never runs automatically. Always start with --dry-run.

RUN (needs the Firebase Admin Python SDK + a service account JSON):
    pip install firebase-admin
    set GOOGLE_APPLICATION_CREDENTIALS=C:\\path\\to\\serviceAccountKey.json
    python student_roster_import.py --dry-run          # preview only
    python student_roster_import.py --commit           # actually import

Stored shape at studentRoster/{rollNumber}:
    { rollNumber, enrollmentNo, applicantName(normalized), formalName(raw),
      branchName(CED|CSD), block, sourceFormNumber, importedAt }
"""
from __future__ import annotations

import argparse
import csv
import os
import re
import sys

CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "admission_data.csv")

ROLL_RE = re.compile(r"^\d{10}$")
ENROLL_RE = re.compile(r"^2026(CED|CSD)\d{4}$")


def norm_name(raw: str) -> str:
    """Roster-normalized candidate name: upper-case letters, single spaces."""
    if not raw:
        return ""
    s = re.sub(r"[^A-Za-z]", " ", raw.upper())
    return " ".join(s.split())


def load_rows(path: str):
    rows = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        for i, r in enumerate(csv.DictReader(f), start=2):  # 1 = header
            rows.append({
                "row": i,
                "formNumber": (r.get("Form_Number") or "").strip(),
                "rollNumber": (r.get("Roll_No") or "").strip(),
                "enrollmentNo": (r.get("Enrollment_No") or "").strip(),
                "name": (r.get("Applicant_Name") or "").strip(),
            })
    return rows


def build_records():
    rows = load_rows(CSV_PATH)
    problems, duplicates = [], []

    # Determine contiguous roll-number blocks (CED list, CSD list-1, CSD list-2)
    # over well-formed rolls only, so a stray non-numeric roll can never crash
    # the int() sort below — it is reported as a problem instead.
    well_formed = [r for r in rows if ROLL_RE.match(r["rollNumber"])]
    ordered = sorted(well_formed, key=lambda r: (int(r["rollNumber"]), r["rollNumber"]))
    block_idx, prev = 0, None
    block_of = {}
    for r in ordered:
        if prev is None or int(r["rollNumber"]) - int(prev["rollNumber"]) != 1:
            block_idx += 1
        block_of[r["rollNumber"]] = block_idx
        prev = r

    records = []
    for r in rows:
        roll, enr = r["rollNumber"], r["enrollmentNo"]
        if not ROLL_RE.match(roll):
            problems.append(f"row {r['row']}: invalid rollNumber '{roll}'")
            continue
        m = ENROLL_RE.match(enr)
        if not m:
            problems.append(
                f"row {r['row']}: invalid Enrollment_No '{enr}' "
                f"(expected 2026CEDxxxx or 2026CSDxxxx)")
            continue
        normalized = norm_name(r["name"])
        if not normalized:
            problems.append(f"row {r['row']}: empty applicant name")
            continue
        records.append({
            "rollNumber": roll,
            "enrollmentNo": enr,
            "applicantName": normalized,
            "formalName": r["name"],
            "branchName": m.group(1),
            "block": block_of.get(roll, 0),
            "sourceFormNumber": r["formNumber"],
        })

    seen = set()
    for rec in records:
        if rec["rollNumber"] in seen:
            duplicates.append(rec["rollNumber"])
        seen.add(rec["rollNumber"])
    return records, problems, duplicates


def main() -> int:
    ap = argparse.ArgumentParser(description="Import admission roster into Firestore studentRoster")
    ap.add_argument("--dry-run", action="store_true", help="Validate + preview only (also default)")
    ap.add_argument("--commit", action="store_true", help="Actually write to Firestore (needs creds)")
    args = ap.parse_args()

    records, problems, duplicates = build_records()
    print(f"\nSource file      : {CSV_PATH}")
    print(f"Parsed rows      : {len(records)}")
    print(f"CSV problems     : {len(problems)}")
    print(f"Duplicate rolls  : {len(set(duplicates))}")

    if problems or duplicates:
        print("\n>>> Refusing to proceed until the source data is clean. <<<")
        for p in problems:
            print("  -", p)
        for d in sorted(set(duplicates)):
            print("  - duplicate roll:", d)
        return 2

    branch_counts = {}
    for rec in records:
        branch_counts[rec["branchName"]] = branch_counts.get(rec["branchName"], 0) + 1
    print("Branch tally    :", branch_counts)
    print("Blocks          :", {b: sum(1 for r in records if r["block"] == b) for b in
                                sorted({r["block"] for r in records})})
    print("Sample (first 5 + last 3):")
    for rec in records[:5] + records[-3:]:
        print("   ", rec["rollNumber"], rec["enrollmentNo"], rec["applicantName"])

    if args.commit:
        try:
            import firebase_admin  # noqa: F401
            from firebase_admin import credentials, firestore
        except ImportError:
            print("\nERROR: firebase-admin not installed. Run: pip install firebase-admin")
            return 2
        if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            print("\nERROR: set GOOGLE_APPLICATION_CREDENTIALS to your service-account JSON.")
            return 2
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(credentials.ApplicationDefault())

        db = firestore.client()
        written = 0
        for rec in records:
            # merge=True: existing roster docs are never replaced/deleted.
            rec["importedAt"] = firestore.SERVER_TIMESTAMP
            db.collection("studentRoster").document(rec["rollNumber"]).set(rec, merge=True)
            written += 1
        print(f"\nCommitted: {written} roster documents created/merged into 'studentRoster'.")
        print("Now deploy the staged 'userRolls' + 'studentRoster' rules (see firestore_rules_append.txt).")
        return 0

    print("\n(DRY-RUN only — nothing was written.)")
    return 0


if __name__ == "__main__":
    sys.exit(main())