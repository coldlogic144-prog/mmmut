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
| **Hard verification gate** — blocks ALL app functionality until the roll is verified; **non-dismissible** (no ✕, no “Skip for now”) | `#migrationModal` (after the profile modal); the app stays `display:none` via `enforceRollGate()` until `finalizeRollVerification()` unlocks it |
| Gate logic `enforceRollGate()` / `verifyRollNumber()`, identity auto-assign `rosterBranchToId()` / `finalizeRollVerification()`, state helper `setMigrationState()` | before the NOTIFICATION section |
| Roll-number login — **two explicit options** in `handleLogin()` | segmented “Username / Roll Number” toggle (`#loginMethodUser`, `#loginMethodRoll`); the roll path resolves `userRolls/{roll}` → existing account |
| Migration status + roll number shown in the profile modal | `#profileRollNumber`, `#profileMigrationStatus`, “Link my roll number” |
| Admin verification tab “🎓 Roll Verify” | existing admin panel (`isAdmin`-gated) — lists pending/rejected/manual users, approve/reject/review, plus a roll lookup |
| Safe console diagnostics (`console.debug('[roll-mig] …')`) | gated by `ROLL_MIGRATION_DEBUG`; never logs passwords/tokens/keys |
| **Compulsory roll number on signup — NO name field.** The full name and branch are AUTO-ASSIGNED from `studentRoster/{roll}` (`applicantName`, `branchName`); the user only picks username/password (+ hostel/gender) | `handleSignup()` resolves the roll before creating the account, refuses rolls that are not in the roster or already linked, and creates the account `verified` |

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
1. Deploy this `index.html`. With `ROLL_MIGRATION_TEST_MODE = false` **everyone** is
   hard-gated: existing users see the non-dismissible verify modal after login; new
   users must enter a roster roll on signup (name & branch are auto-filled from it).
2. Sign up with a roster roll (`2026011001`) — the account is created **already
   verified** and named from the roster (AARAV SINGH / civil), no name is typed.
3. Sign out and back in with a username whose roll is not yet verified — the app
   stays hidden behind the gate; no attendance/chat/timetable is reachable.
4. Enter any unclaimed roster roll in the gate — it verifies instantly and **adopts
   the roster name + mapped branch** (CED → civil, CSD → cse), then unlocks the app.
5. Sign out and sign back in using the **🎓 Roll Number** login toggle + password.

> During rollout you can keep it to a subset by setting `ROLL_MIGRATION_TEST_MODE
> = true` and adding usernames to `ROLL_MIGRATION_TEST_USERS`.

## 4. Test cases — how each is satisfied now
| Scenario | Behavior |
|---|---|
| Existing user logs in | unchanged, profile loaded from `users/{uid}` |
| `migrationStatus !== 'verified'` | **HARD gate** — the app stays hidden (non-dismissible) until verification |
| Correct (unclaimed) roster roll entered in the gate | verifies instantly; **name + branch adopted from the roster**; `updateDoc` merge only, UID unchanged |
| Existing user whose old signup name differs from the roster | no longer stalls — on verify the roster name is adopted automatically |
| All existing user fields preserved | verification writes are `updateDoc` merges only |
| Attendance intact | no `attendance` writes happen anywhere in the flow |
| Log out / log back in | mapping is re-detected as `verified` (app opens, no gate) |
| Wrong / nonexistent roll number | “not found in 2026–27 admission roster” — rejected before any write |
| Already-claimed roll | “already linked to a different account” + status `rejected` |
| **CSD roll** | mapped to the app’s existing `cse` branch; auto-verifies — no longer forced to manual review |
| **Admin (`tanish`)** | may also verify any unclaimed roster roll; the legacy `evaluateRollClaim` admin-override remains for reference |
| Existing admin (`tanish`) | untouched; admin panel gains “🎓 Roll Verify” tab |
| Old user who never migrates | blocked by the hard gate — must verify a roster roll before the app opens |

## 5. Rollback (recovery)
- **Kill-switch:** set `ROLL_MIGRATION_ENABLED = false` → gate & roll-login off; the app
  reverts to pre-migration behavior with no cleanup required (fields are additive).
- **File backup:** `backups/index.html.pre-roll-migration.bak` is the untouched original.
  To fully revert, replace `index.html` with that file.
- **Data:** the migration never deletes anything; the only irreversible act would be
  deleting `studentRoster`/`userRolls` — don’t. If a roll mapping is wrong, only an
  admin (or the admin SDK) may co-correct it; the app never transfers rolls.

## 6. Notes / next steps (explicit)
- `ROLL_MIGRATION_TEST_MODE` is now `false` by default → **everyone** is hard-gated
  behind roll-number verification before any feature opens. Flip it to `true`
  (plus add usernames to `ROLL_MIGRATION_TEST_USERS`) for a staged rollout.
- The full name is never asked anywhere: it is ALWAYS auto-assigned from the
  admission roster on signup and on in-gate verification.
- A fuller official roster (all branches incl. CSD, sections) can be swapped in later;
  the code reads generically from `studentRoster`.
- No Cloud Function / Backend is required — the mapping is held in `userRolls` and
  login still goes through normal Firebase Auth email/password.
- App Check, Firebase AI, FCM (service worker), and the chess module are not changed.