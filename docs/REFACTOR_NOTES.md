# Refactor Notes (what changed and why)

## Safety first (Phase 0)
* Fresh backup: `backups/pre-refactor_20260823_225413/` (index.html, sw, python, CSV, rules doc).
* Existing recovery points untouched: git history + `backups/index.html.pre-roll-migration.bak`.
* Root `index.html` left byte-identical as the legacy fallback build.
* No Firebase data/Auth/UID/passwords touched; no collections deleted.

## Phase 1 — understanding
Full map: `docs/TECHNICAL_MAP.md` (feature inventory with line ranges, data
model, roll-login flow, defects found, code-health notes).

## Phase 2 — structure
### CSS
One 2,650-line `<style>` block → four files split on content boundaries,
linked in original order so the cascade is provably unchanged:
base / layout / components / pages.

### JavaScript
Original: single ~6,700-line inline module. Target sections extracted
**verbatim by line range** into `frontend/js/modules/NN_*.js`
(19 files, tiling lines 3446–10132 exactly once; verified programmatically).
A build step composes them — in original order — into the real ES module
`frontend/js/app.js`, which `frontend/index.html` loads. The composer injects
exactly one new import (`apiService`) after the Firebase import block.

**Why not per-file ES modules?** Tried first: automated export/import headers +
shared-state object rewrite. Validation caught that locals shadow globals inside
the same file (e.g. `loginAs()` declares its own `const isAdmin` while a nested
callback reads the *global* `isAdmin`; `renderAdminDashboard` shadows
`holidays`). Correctly resolving that requires real scope analysis — i.e., a
state-management refactor of a live app, which violates the "preserve
functionality" mandate. Composition keeps one shared scope exactly like the
monolith while delivering reviewable, editable, ordered source sections.
Escaping hatch documented in TECHNICAL_MAP §5 for a future framework migration.

### New capability: backend client
`frontend/js/services/apiService.js` is the only standalone ES module:
`apiFetchRoster(roll)` / `apiHealth()`, null-on-any-failure semantics,
base URL via `localStorage['mmmut_api_base']` or code constant. Disabled by default.

## Roll-login fixes (in section files; rebuild required)
| ID | Fix |
|----|-----|
| D1 | Claim-write failures classified: permission-denied ⇒ remediation message, account stays **pending** (no bogus manual_review); unknown codes surfaced honestly; only true races flag review. |
| D2 | Roster lookups (gate verify + signup) fall back to `GET /api/roster/<roll>` when Firestore errors or misses. |
| D3 | Roll-mode login errors now explain the hard gate ("sign in with username once, verify, then use roll") instead of pointing at an unreachable profile page; permission-denied during lookup names the missing rule. |

## Validation performed
* `node --check`: composed `app.js` + `apiService.js` pass ESM syntax.
* Section coverage check: ranges tile the original script body exactly once.
* Backend live test: `/api/health` → rosterCount 1189 + correct branch tallies;
  `/api/roster/2026011001` → AARAV SINGH/CED/A (matches known-good sample);
  miss case returns `{found:false}`.
* Static serve of `frontend/`: index.html, all CSS, app.js, apiService.js → HTTP 200.

## Rollback
Replace deployed `index.html`+assets with root legacy copy, or restore from
either backup folder, or `git checkout <pre-refactor-sha> -- .`.
Kill-switches (`ROLL_MIGRATION_ENABLED=false`) still revert gate behavior
without any deploy.
