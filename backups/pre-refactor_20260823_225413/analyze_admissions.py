# -*- coding: utf-8 -*-
"""Analysis of student admission CSV data (MMMUT 2026)."""
import csv
import re
from collections import Counter

PATH = r"c:\Users\DELL\Desktop\files\admission_data.csv"

with open(PATH, newline="", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print("=" * 60)
print("1) OVERALL COUNTS")
print("=" * 60)
print(f"Total records : {len(rows)}")
print(f"Column headers: {reader.fieldnames}")

# ---- Split into contiguous blocks by Roll_No sequence ----
ordered = sorted(rows, key=lambda r: int(r["Roll_No"]))
blocks = []
cur = [ordered[0]]
for r in ordered[1:]:
    if int(r["Roll_No"]) - int(cur[-1]["Roll_No"]) == 1:
        cur.append(r)
    else:
        blocks.append(cur)
        cur = [r]
blocks.append(cur)

print()
print("===")
print("2) BLOCK / BRANCH BREAKDOWN (contiguous roll-number runs)")
print("===")
for i, block in enumerate(blocks, start=1):
    rolls = [g["Roll_No"] for g in block]
    enrs = [g["Enrollment_No"] for g in block]
    branch = block[0]["Enrollment_No"][4:7]
    seq_roll = all(int(b) - int(a) == 1 for a, b in zip(rolls, rolls[1:]))
    seq_enr = all(int(b[7:]) - int(a[7:]) == 1 for a, b in zip(enrs, enrs[1:]))
    sno_ok = all(int(g["S.No"]) == i for i, g in enumerate(block, start=1))
    print(f"  Block {i}: Branch={branch} | students={len(block)} | S.No is 1..N = {sno_ok} | "
          f"Roll seq = {seq_roll} | Enrollment seq = {seq_enr}")
    print(f"     Roll range : {rolls[0]} .. {rolls[-1]}")
    print(f"     Enroll range: {enrs[0]} .. {enrs[-1]}")

print("\n  Gaps between blocks (missing roll numbers):")
for a, b in zip(blocks, blocks[1:]):
    gap = int(b[0]["Roll_No"]) - int(a[-1]["Roll_No"]) - 1
    print(f"    {a[-1]['Roll_No']} -> {b[0]['Roll_No']}  (gap of {gap})")

# ---- Duplicate checks ----
print("\n===")
print("4) UNIQUENESS / DUPLICATES PER FIELD")
print("===")
for col in ["Form_Number", "Roll_No", "Enrollment_No", "Applicant_Name", "Source"]:
    vals = [r[col] for r in rows]
    c = Counter(vals)
    dups = {v: n for v, n in c.items() if n > 1}
    dup_count = sum(dups.values()) - len(dups)
    print(f"  {col}: records={len(vals)} unique={len(c)} duplicated_occurrences={dup_count}")
    if dups:
        for v, n in sorted(dups.items()):
            print(f"      x{n}  {v}")

print("\nSource column value distribution:", dict(Counter(r["Source"] for r in rows)))

# ---- Format / pattern checks ----
print("\n===")
print("5) FORMAT / PATTERN CHECKS")
print("===")

pat_form = re.compile(r"^MMMUT\d{9}$")       # e.g. MMMUT260003487 (5 letters + 9 digits)
pat_roll = re.compile(r"^\d{10}$")           # e.g. 2026011001 (10 digits)
pat_enr  = re.compile(r"^2026(?:CED|CSD)\d{4}$")  # e.g. 2026CED0375

def check(label, col, pat):
    bad = [r[col] for r in rows if not pat.match(r[col])]
    if bad:
        print(f"  {label}: {len(bad)} value(s) do NOT match {pat.pattern}:")
        for v in bad[:10]:
            print(f"      {v}")
    else:
        print(f"  {label}: all {len(rows)} values match {pat.pattern}")
    return bad

check("Form_Number  ", "Form_Number", pat_form)
check("Roll_No      ", "Roll_No", pat_roll)
check("Enrollment_No", "Enrollment_No", pat_enr)

# S.No values used overall
sno_vals = sorted({int(r["S.No"]) for r in rows})
print(f"\n  Distinct S.No values present: {sno_vals}  (repeats per block)")

# ---- Cross-field consistency ----
print("\n===")
print("6) CROSS-FIELD CONSISTENCY  (Roll_No prefix <-> Enrollment branch)")
print("===")
mism = 0
for r in rows:
    roll = r["Roll_No"]
    expect = "CED" if roll.startswith("202601") else "CSD" if roll.startswith("202602") else "?"
    if r["Enrollment_No"][4:7] != expect:
        mism += 1
        print("  MISMATCH", roll, r["Enrollment_No"])
print(f"  Result: {'OK — all consistent' if mism == 0 else str(mism) + ' mismatch(es)'}")

# ---- Name repetitions ----
print("\n===")
print("7) SAME NAME ON MULTIPLE ROLLS (different students)")
print("===")
name_counter = Counter(r["Applicant_Name"] for r in rows)
found = False
for name, n in name_counter.items():
    if n > 1:
        found = True
        rolls = [r["Roll_No"] + "/" + r["Enrollment_No"] for r in rows if r["Applicant_Name"] == name]
        print(f"  '{name}' appears {n}x -> " + ", ".join(rolls))
if not found:
    print("  No repeated names.")

print("\nDone.")