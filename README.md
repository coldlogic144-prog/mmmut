# MMMUT ERO / "The Ledger" — Student ERP

Firebase-backed student app for M.M.M. University of Technology, Gorakhpur:
attendance, timetable, syllabus, announcements, community posts, feedback,
chess club, FCM push, Gemini AI assistant — with **roll-number verified login**.

Production today: GitHub Pages (`coldlogic144-prog.github.io/-python/`).
Optional Python backend (this repo, `backend/`) hardens roll verification.

## Layout

```
mmmut/
├── frontend/                  # deploy this folder to GitHub Pages
│   ├── index.html             # markup + importmap; loads js/app.js
│   ├── css/                   # base / layout / components / pages
│   └── js/
│       ├── app.js             # GENERATED: composed from js/modules/*  (don't edit)
│       ├── modules/           # NN_*.js source sections — EDIT THESE
│       │   ├── 10_firebase_boot.js        SDK imports, App Check, collections
│       │   ├── 15_flags_config.js         kill-switches, VAPID key
│       │   ├── 20_notifications_push.js   FCM web-push
│       │   ├── 25_ai_init.js              Gemini init
│       │   ├── 30_data_tables.js          periods/branches/timetables data
│       │   ├── 35_schedule_engine.js      seeded timetable generator
│       │   ├── 40_syllabus_data.js        syllabus dataset
│       │   ├── 45_syllabus_ui.js          syllabus viewer
│       │   ├── 50_state_toast_holidays_profile.js
│       │   ├── 55_auth_core.js            signup/login/logout (+roll login)
│       │   ├── 60_session_loginAs.js      post-login session wiring
│       │   ├── 65_roll_verification.js    HARD GATE + verify + claim
│       │   ├── 70_notif_badge_admin_request.js
│       │   ├── 75_admin_panel.js          admin tabs
│       │   ├── 80_feed_attendance_events_image_history.js
│       │   ├── 85_chess_club.js
│       │   ├── 90_community_feedback_rating.js
│       │   ├── 95_ledger_ai_chat.js
│       │   └── 99_boot_window_bindings.js boot() + window.* bindings
│       └── services/apiService.js         REAL ES module: Python backend client
├── backend/                   # Flask API (read-only roster service)
│   ├── app.py                 # factory + CORS
│   ├── routes/roster.py       # /api/health /api/roster/<roll> /search /stats
│   ├── services/roster_store.py  CSV loader (mirrors student_roster_import.py)
│   ├── utils/responses.py     # JSON envelope helpers
│   ├── requirements.txt · Procfile
├── data/admission_data.csv    # authoritative B.Tech 2026-27 roster (1,189)
├── docs/                      # TECHNICAL_MAP · DEPLOYMENT · REFACTOR_NOTES
├── tools/                     # extract_frontend.mjs · build_frontend.mjs
├── chess/                     # standalone game page (linked from topbar)
├── backups/                   # recovery points — never delete
└── student_roster_import.py   # one-time Firestore importer (--dry-run first!)
```

## Why `js/modules/*` are not independent ES modules

The original app was ONE `<script type="module">`: all features share dozens of
mutable bindings, and locals shadow globals across sections. Mechanical splitting
into per-file modules would require a framework-level state refactor and risk
silent breakage. So sections stay **plain code sharing one scope**, composed in
original statement order into the real module `js/app.js`. Byte-parity with the
monolith was proven during extraction (see docs/REFACTOR_NOTES.md).

## Workflow

Edit a section → rebuild → reload:

```
node tools/build_frontend.mjs
python -m http.server 8090 --directory frontend   # local test
```

## Backend quickstart

```
pip install -r backend/requirements.txt
python backend/app.py                 # http://127.0.0.1:5000/api/health
```

Then point the frontend at it (any page console):

```js
localStorage.setItem('mmmut_api_base', 'https://your-backend.onrender.com');
```

Empty/unset = backend disabled; everything works exactly as before.

## Firebase operations

* Roll feature rules: append blocks from `firestore_rules_append.txt` in the
  Firebase console (**required** for public `userRolls` reads and create-only claims).
* Roster re-import: `python student_roster_import.py --dry-run` then `--commit`.
* Kill-switches live in `frontend/js/modules/15_flags_config.js`
  (`ROLL_MIGRATION_ENABLED`) — flip, rebuild, redeploy.

Recovery points: git history, `backups/index.html.pre-roll-migration.bak`,
`backups/pre-refactor_20260823_225413/`. Root `index.html` is the untouched legacy build.
