# Deployment Guide

## 1. Frontend → GitHub Pages (as today)

1. Publish the **contents of `frontend/`** to the repo/branch that serves
   `coldlogic144-prog.github.io/-python/` (keep the same sub-path — the FCM
   service worker hard-codes `LEDGER_URL`, and App Check is keyed to this origin).
2. Relative paths (`./css/...`, `./js/app.js`) make the sub-path safe.
3. After any section edit: `node tools/build_frontend.mjs`, commit, push.

## 2. Backend → Render (or any WSGI host)

The API is read-only and needs no secrets.

* **Render Blueprint**: repo contains `render.yaml` — New + → Blueprint → pick
  repo. Health check `/api/health`. Free tier suffices.
* **Anything else**: `pip install -r backend/requirements.txt`,
  start command `gunicorn backend.app:app -w 2 --bind 0.0.0.0:$PORT`.
* Set `API_ALLOW_ORIGIN=https://coldlogic144-prog.github.io` in production.

## 3. Wire frontend ⇄ backend

One-time (per browser) or bake into code:

```js
localStorage.setItem('mmmut_api_base', 'https://mmmut-ero-backend.onrender.com');
```

Behavior when set:
* Roll verification & signup roster checks try Firestore first, then fall back
  to `GET /api/roster/<roll>` on error/miss (defect D2 fix).
Unset ⇒ identical legacy behavior.

## 4. REQUIRED Firebase console step (one-time)

Append both rule blocks from **`firestore_rules_append.txt`** to your Firestore
rules and publish:

* `studentRoster` — public read (verification lookups), admin write.
* `userRolls`    — public read (roll→account login resolution),
                   create-only claims (`request.auth.uid`-locked).

Until published, users hitting the gate see the new remediation message
(D1 fix) instead of being silently flagged for manual review.

## 5. Roster refresh

```
python student_roster_import.py --dry-run      # validate CSV
python student_roster_import.py --commit       # merge into Firestore
# then redeploy backend so its CSV mirror matches (data/admission_data.csv)
```

## 6. Post-deploy checklist

- [ ] `GET https://<backend>/api/health` → `"rosterCount": 1189`
- [ ] Login with username works; gate appears for unverified accounts
- [ ] Gate accepts a fresh roster roll; name+branch auto-assigned
- [ ] Sign out → login via 🎓 Roll Number toggle using that roll
- [ ] Push notifications still register (SW at site root, VAPID key unchanged)
- [ ] Chess page loads from `chess/chess.html`
