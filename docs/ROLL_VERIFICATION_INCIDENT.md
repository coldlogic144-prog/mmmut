# INCIDENT: Roll Verification Fails for Most Students (2026-08)

## Symptom
Hard gate shows *"That roll number is not in the B.Tech 2026–27 admission
roster."* for legitimate students, while some users verify fine.

## Root cause (verified with live data, not inferred)

**PRIMARY — stale partial Firestore roster.**
`studentRoster` contains only **215 of 1,189** authoritative rows:

| Contiguous run present in Firestore | Docs |
|---|---|
| 2026011001 – 2026011069 (CED part 1) | 69 |
| 2026021001 – 2026021073 (CSD list 1) | 73 |
| 2026021101 – 2026021173 (CSD list 2) | 73 |

These are exactly the rolls of the ORIGINAL CED/CSD-only CSV era (see
`analyze_admissions.py`'s `^2026(?:CED|CSD)\d{4}$` pattern). The CSV was later
expanded to all 8 branches (1,189 rows; zero regex/duplicate defects — verified),
but **`student_roster_import.py --commit` was never re-run**, so 974 students
have no Firestore document. Full ID inventory:
`docs/firestore_studentRoster_ids.txt`.

**SECONDARY — production runs pre-fix code.** Live checks of
`coldlogic144-prog.github.io/-python/`: index.html is the old inline-monolith
build (456 KB), `/js/app.js` returns 404, and none of the D1/D2/D3 fixes exist
in the served bundle. Therefore the D2 backend fallback can never fire there
(also because no backend is deployed and `BAKED_API_BASE` is '').

## Failure chain per affected user
input → normalizeRollInput OK → getDoc(studentRoster/{roll}) ⇒ missing
→ apiFetchRoster ⇒ null (backend unconfigured) → roster-miss fail() ⇒ the
reported message. Code behaved as written; the data and deployment were wrong.

## Evidence probes (all reproducible)
* Firestore public REST GET: 200 for e.g. 2026011001/2026021001;
  clean **404 (not 403)** for every other branch ⇒ rules deployed & read works,
  documents genuinely absent.
* Backend over full CSV: 10/10 multi-branch valid HITs, 5/5 invalid rejected,
  rosterCount 1189 (`tools/roll_acceptance.mjs` — 19/19 PASS).
* Production fetches above (stale build confirmed).

## Remediation runbook (ordered)
1. **Re-import the roster** (adds 974 docs; merge-safe, touches nothing else):
   ```
   set GOOGLE_APPLICATION_CREDENTIALS=<service-account.json>
   python student_roster_import.py --dry-run     # expect: 1189 parsed, 0 problems
   python student_roster_import.py --commit
   ```
2. Verify: rerun `node tools/roll_acceptance.mjs` — the FIRESTORE section must
   show HIT for all 8 branches (CED/CSD tails included).
3. **Deploy the new frontend**: publish contents of `frontend/` to the Pages
   path (index.html ≈ 30 KB referencing ./css/* and ./js/app.js). Confirm
   `GET /-python/js/app.js` = 200 and contains `ROLL_MIGRATION_ENABLED`.
4. **Deploy backend** (optional but recommended): Render blueprint
   (`render.yaml`) → set `BAKED_API_BASE` in `frontend/js/services/apiService.js`
   to the service URL, rebuild app.js, redeploy. This makes verification immune
   to future Firestore hiccups.
5. **Only then** flip `ROLL_MIGRATION_ENABLED` back to `true`
   (frontend/js/modules/15_flags_config.js), rebuild, redeploy, and spot-check
   one fresh verification end-to-end.

## Hard-gate status during incident
`ROLL_MIGRATION_ENABLED = false` as of commit following this file — username
login and all features work; no legitimate student can be locked out until the
gate is proven reliable (steps 1–5).
