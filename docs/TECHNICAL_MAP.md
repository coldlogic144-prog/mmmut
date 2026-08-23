# MMUT ERO / "The Ledger" — Technical Map (Phase 1)

Generated during the 2026-08 refactor. Source of truth for the **original** monolith
was `index.html` (10,134 lines). Recovery points:

| Artifact | Path |
|---|---|
| Git history | branch `main`, last pre-refactor commit `4a6af60` |
| Pre-migration backup | `backups/index.html.pre-roll-migration.bak` |
| Pre-refactor backup | `backups/pre-refactor_20260823_225413/` |

## 1. Runtime architecture (as found)

* **Single-page app**, one file: `index.html`
  * lines 7–2658 — one giant `<style>` block (≈2,650 lines CSS)
  * lines 2660–3430 — static markup: loading screen, auth screen, app shell,
    chess-club view, modals (post, feedback, rating, migration gate, profile),
    admin panel drawer
  * lines 3431–3443 — `<script type="importmap">` (Firebase 12.17.1 CDN ESM)
  * lines 3445–10133 — **one** `<script type="module">` ≈ 6,700 lines holding
    *everything*: Firebase bootstrap, data tables, auth, roll-migration, FCM,
    AI chat, admin panel, attendance engine, chess club, feedback, ratings.
* **Hosting**: GitHub Pages project site → `https://coldlogic144-prog.github.io/-python/`
  (hard-coded as `LEDGER_URL` inside `firebase-messaging-sw.js`). No server side today.
* **Backend**: none deployed. Python scripts run locally against Firebase Admin SDK.
* **Unrelated artifacts**: `ledger/` = abandoned Next.js experiment (not referenced);
  `_bak_ai.txt`, `_cur_ai.txt`, `_idx_diff.txt`, `_module_check.mjs`,
  `_sdk_ai_12171.js`, `_sdk_ai_pretty.js` = debugging scratch dumps; `chess/test` stray.

## 2. Feature inventory (JS line ranges in original file)

| Feature | Lines | Notes |
|---|---|---|
| Firebase imports/init + App Check | 3446–3566 | reCAPTCHA Enterprise key inline |
| Firestore collection refs | 3567–3583 | 17 collections incl. chess + roster |
| Roll-migration flags | 3584–3605 | kill-switches, ROLL_NUMBER_PATTERN |
| Push notifications (FCM) | 3607–3877 | VAPID key inline, SW at site root |
| Ledger AI init (Gemini) | 3878–3906 | firebase/ai, GoogleAIBackend |
| Static data tables | 3907–4919 | PERIODS, BRANCHES, BUILTIN_EVENTS, PDF_TIMETABLES |
| Helpers + schedule builder | 4920–5042 | seeded RNG timetable generator |
| Syllabus dataset | 5043–5612 | per-branch/year subject tables |
| Syllabus UI | 5613–5693 | popup writer (the `</html>` at 5689 is a template string — not corruption) |
| Shared mutable state | 5695–5717 | 23 top-level let globals |
| Holidays/profile/auth-UI glue | 5728–5912 | |
| Signup / Login / Logout | 5914–6115 | username → username@mmmut.local mapping |
| Profile loaders | 6117–6160 | loadUserProfile, friendlyAuthError |
| loginAs() session starter | 6162–6349 | wires all listeners + gates |
| Roll verification core | 6350–6646 | hard gate, claim, finalize |
| Notif badge / admin request / admin roll-verify | 6647–6864 | |
| Admin panel (dashboard/users/timetable/calendar/holidays/posts/requests) | 6865–7450 | |
| Feed/topbar/schedule/attendance/events/canvas image/history | 7451–8013 | |
| Chess Club manager | 8014–8578 | separate from standalone game page |
| Community posts | 8579–8752 | Storage-backed images |
| Feedback + rating | 8753–9346 | ticket ids, rate-limit |
| Ledger AI chat | 9347–9893 | context gatherer + prompts |
| boot() + ~150 window.* bindings | 9894–10132 | required by inline onclick HTML |

## 3. Data model (Firestore `student-erp-77605`)

`users/{uid}` · `attendance/{uid}` · `posts` · `communityPosts` · `feedback` ·
`ratings` · `holidays` · `adminRequests` · `eventOverrides` · `timetableOverrides` ·
`chessClubMembers` · `chessChallenges` · `chessEvents` · `chessActivity` · `chessGames` ·
**`studentRoster/{rollNumber}`** (admin-imported via `student_roster_import.py`) ·
**`userRolls/{rollNumber}`** (create-only bridge: `{uid, username, verifiedAt}`).

Auth trick: usernames map to emails via `authEmail()` = `username + '@mmmut.local'`
inside Firebase Auth.

## 4. Roll-number login flow (verified against code)

1. Login screen has segmented **Username / Roll Number** toggle (`loginMethod`).
2. Roll mode: read public `userRolls/{roll}` → get `username` → normal
   `signInWithEmailAndPassword(authEmail(username), password)`.
3. After any login, `enforceRollGate()` hides the whole app behind a
   non-dismissible modal while `users/{uid}.migrationStatus !== 'verified'`.
4. Gate verify: read `studentRoster/{roll}` (name+branch auto-assigned), ensure
   `userRolls/{roll}` unclaimed, `setDoc` claim (create-only per rules),
   `finalizeRollVerification()` merges identity into `users/{uid}` and unlocks.
5. Signup requires a roster roll up-front; account is born `verified`.

### Defects found (fixed in this refactor)

| # | Defect | Fix |
|---|---|---|
| D1 | verifyRollNumber() treats **every** claim-write failure as a "claim race" → flags manual_review even when the real cause is permission-denied because the staged rules in firestore_rules_append.txt were never appended in the console. Users stuck at gate with misleading message. | Error-code aware handling: permission-denied ⇒ clear remediation message, user left pending; only genuine already-exists races mark review. |
| D2 | Roster lookups have **no fallback** if rules/CDN hiccup. | New backend endpoint GET /api/roster/{roll} (Flask over admission_data.csv) consulted automatically when Firestore misses/errors. |
| D3 | Roll-mode login error told users to "link it from your profile" even while hard-gated with no app access. | Message now explains the gate and offers username login. |

## 5. Code-health findings (no behavior change yet)

* ~150 window.X = X re-exposures exist solely because HTML uses inline onclick
  attributes. Kept for compatibility; candidate for later addEventListener migration.
* Duplicate query shapes: timetableOverridesCollection filtered the same way in
  4 places; feedback uid-queries in 5 places.
* Two renderers of the schedule: renderSchedule() DOM vs drawTimetableImage() canvas.
* Firebase config duplicated in firebase-messaging-sw.js, chess/chess.js, inline
  script (inherent to SW / classic-script contexts).
* Global mutable state: 23 let bindings shared across all sections — now single-homed
  in frontend/js/state.js.

## 6. Target layout produced by Phase 2

See root README.md tree. Extraction was **mechanical** (line-range slicing by
script, never retyped), preserving statement order so behavior is identical;
modules received generated import/export headers plus a shared state.js.

