# ROLL-NUMBER LOGIN / MIGRATION — OPERATIONS GUIDE
App: Ledger / MMMUT Student ERP (`index.html`) · Firebase project `student-erp-77605`

Everything below is **non-destructive and additive**. No Firebase Auth users are
ever deleted/recreated, no UIDs/emails/passwords change, and no existing Firestore
data (attendance, posts, feedback, timetable, syllabus, chess, FCM) is rewritten.

---

## 1. What was implemented (in `index.html`)

| Piece | Where |
|---|---|
| Master switches `ROLL_MIGRATION_ENABLED` / `ROLL_MIGRATION_TEST_MODE` / `ROLL_MIGRATION_TEST_USERS` | near top of the inline script (after `chessGames` collection) |
| Claim gate UI (“Link your MMMUT Roll Number”) | `#migrationModal` (after the profile modal) |
| Claim logic `verifyRollNumber()`, identity check `evaluateRollClaim()`, state helper `setMigrationState()` | before the NOTIFICATION section |
| Roll-number login alias in `handleLogin()` | accepts a 10-digit roll number in the login box |
| Migration status + roll number shown in the profile modal | `#profileRollNumber`, `#profileMigrationStatus`, “Link my roll number” |
| Admin verification tab “🎓 Roll Verify” | existing admin panel (`isAdmin`-gated) — lists pending/rejected/manual users, approve/reject/review, plus a roll lookup |
| Safe console diagnostics (`console.debug('[roll-mig] …')`) | gated by `ROLL_MIGRATION_DEBUG`; never logs passwords/tokens/keys |

## 2. The two new Firestore collections the feature reads/writes

- **`studentRoster/{rollNumber}`** — authoritative roster. Written by your admin tool
  (`student_roster_import.py`), read by the claim flow. Fields: `rollNumber`,
  `enrollmentNo`, `applicantName` (normalized), `formalName`, `branchName` (CED/CSD),
  `block`, `sourceFormNumber`, `importedAt`.
- **`userRolls/{rollNumber}`** — the “roll → existing account” bridge. Document ID is the
  roll number so a roll can exist only once. Fields: `uid`, `username`, `rollNumber`,
  `verifiedAt`. **Create-only** in the rules, so a roll can never be claimed twice or
  silently transferred.
- Existing `users/{uid}` docs are only ever merged via `updateDoc` with
  `rollNumber`, `migrationStatus` (`pending|verified|rejected|manual_review`),
  `rollNumberVerified`, `pendingRollNumber`, `migrationReviewReason`, `rollClaimedAt`.

## 3. One-time steps you must do (MANUAL — nothing is auto-deployed)

### a) Import the roster (one-time)
```
pip install firebase-admin
set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\serviceAccountKey.json
python student_roster_import.py --dry-run     # preview
python student_roster_import.py --commit      # writes studentRoster only
```
The source CSV is `admission_data.csv` (215 students: CED 69, CSD 146).
The script refuses to run if the CSV has problems or duplicate roll numbers.

### b) Add the proposed Firestore rules
Open `firestore_rules_append.txt`, review it, then append those `match` blocks to your
existing rules in Firebase Console → Firestore → Rules and **Publish**. Your current
rules are untouched; only the two new collections get rules.

### c) Test (recommended order)
1. Log in as `tanish` (already in `ROLL_MIGRATION_TEST_USERS`) → the “Link your roll
   number” gate appears automatically.
2. Enter a **valid CED roll** whose roster name matches `tanish`’s profile name… note:
   only claimed if name matches. For actual students the name must match the roster
   letter-for-letter (case/space-insensitive).
3. Flip `ROLL_MIGRATION_TEST_MODE` → `false` when you want everyone to see the gate.
4. Deploy the battle-tested `index.html`.

## 4. Test cases from your spec (Phase 13) — how each is satisfied
| Scenario | Behavior |
|---|---|
| Existing user logs in | unchanged, profile loaded from `users/{uid}` |
| `migrationStatus === 'pending'` | dismissible gate opens after login |
| Correct roll + roster name + CED/civil | auto-verified: updateDoc only, UID unchanged |
| All existing user fields preserved | migration writes are `updateDoc` merges only |
| Attendance intact | no `attendance` writes happen anywhere in the flow |
| Log out / log back in | mapping is re-detected as `verified` (no gate) |
| Wrong roll number | “not found in roster” |
| Already-claimed roll | “linked to another account” + status `rejected` |
| Nonexistent roll | rejected before any write |
| Name mismatch | `manual_review`, “contact an administrator” path |
| CSD roll | `manual_review` (no app branch for CSD yet) until an admin approves |
| Existing admin (`tanish`) | untouched; admin panel gains “🎓 Roll Verify” tab |
| Old user who never migrates | old username/password login works forever |

## 5. Rollback (recovery)
- **Kill-switch:** set `ROLL_MIGRATION_ENABLED = false` → gate & roll-login off; the app
  reverts to pre-migration behavior with no cleanup required (fields are additive).
- **File backup:** `backups/index.html.pre-roll-migration.bak` is the untouched original.
  To fully revert, replace `index.html` with that file.
- **Data:** the migration never deletes anything; the only irreversible act would be
  deleting `studentRoster`/`userRolls` — don’t. If a roll mapping is wrong, only an
  admin (or the admin SDK) may co-correct it; the app never transfers rolls.

## 6. Notes / next steps (explicit)
- The app currently ships with `ROLL_MIGRATION_TEST_MODE = true` and
  `ROLL_MIGRATION_TEST_USERS = ['tanish']` — nobody else is affected until you flip it.
- A fuller official roster (all branches incl. CSD, sections) can be swapped in later;
  the code reads generically from `studentRoster`.
- No Cloud Function / Backend is required — the mapping is held in `userRolls` and
  login still goes through normal Firebase Auth email/password.
- App Check, Firebase AI, FCM (service worker), and the chess module are not changed.