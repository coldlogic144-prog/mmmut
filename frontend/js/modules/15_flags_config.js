// ============================================================================
// SECTION: 15_flags_config.js
// Roll-migration kill-switches/pattern + FCM VAPID key & SW path
// Source: index.html lines 3584-3605, 3607-3620 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================


        // ========== ROLL-NUMBER MIGRATION (recovery-safe, additive) ==========
        // Master switches. FLIP ROLL_MIGRATION_ENABLED to false to instantly
        // restore the ORIGINAL pre-migration behavior of the app (gate hidden,
        // roll-login disabled). No cleanup required — the migration only EVER:
        //   * reads studentRoster (authoritative roster, admin-imported),
        //   * creates ONE userRolls/{roll} doc (claim once, never overwritten),
        //   * updateDoc()s (merges) the CURRENT user's own users/{uid} doc.
        // It NEVER deletes/recreates Firebase users, changes UIDs/emails/
        // passwords, nor touches attendance, chess, notices, feedback,
        // timetable, syllabus or FCM data.
        //
        // SAFETY (2026-08 incident): set to FALSE while Firestore studentRoster
        // still lacks the six non-CED/CSD branches (759 students). Re-enable
        // ONLY after student_roster_import.py --commit succeeds against the
        // full admission_data.csv AND the acceptance matrix passes — see
        // docs/ROLL_VERIFICATION_INCIDENT.md.
        const ROLL_MIGRATION_ENABLED = false; // master kill-switch
        // Roll-number linking is now enabled FOR EVERYONE (TEST_MODE = false).
        // Every signed-in user is asked for their roll number and can sign in
        // with it once verified. The TEST list is consulted only while
        // TEST_MODE is true (a safe dry-run for a handful of accounts).
        const ROLL_MIGRATION_TEST_MODE = false;
        const ROLL_MIGRATION_TEST_USERS = ['tanish']; // inactive while TEST_MODE is false
        const ROLL_MIGRATION_DEBUG = true; // safe console diagnostics (no secrets)
        const ROLL_NUMBER_PATTERN = /^\d{10}$/;
        const studentRosterCollection = collection(db, "studentRoster");
        const userRollsCollection = collection(db, "userRolls");
        // ========== FIREBASE CLOUD MESSAGING (WEB PUSH NOTIFICATIONS) ==========
        // Additive module. Does not touch auth, App Check, AI Logic, Firestore rules,
        // or chess club logic. Safe no-ops if unsupported / not yet configured.

        // PART 3 — VAPID KEY
        // Paste the PUBLIC VAPID key from:
        // Firebase Console -> Project settings -> Cloud Messaging -> Web Push certificates
        // NEVER paste the private key here. This constant is PUBLIC by design.
        const FCM_VAPID_KEY = "BLPazRMtvG9Xau0OUbuGX2mjGM4cfxIZeZfVmZMznaWLmIj4u8bXkBrKBtYElcJxr7I_L5lT5V5LJ91Z2B5zSi0";

        // Path to the service worker. It must live at the site root relative to this
        // page (same directory as index.html), per Part 1.
        const FCM_SW_PATH = 'firebase-messaging-sw.js';
