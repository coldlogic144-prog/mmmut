// ============================================================================
// GENERATED FILE — tools/build_frontend.mjs composes this from
// frontend/js/modules/NN_*.js (verbatim extractions of the original
// monolithic index.html). Edit a section file, then rebuild:
//     node tools/build_frontend.mjs
// All sections share ONE module scope, exactly like the original single
// inline <script type="module">. Statement order is preserved.
// Sections composed: 10_firebase_boot.js, 15_flags_config.js, 20_notifications_push.js, 25_ai_init.js, 30_data_tables.js, 35_schedule_engine.js, 40_syllabus_data.js, 41_ledger_data.js, 45_syllabus_ui.js, 50_state_toast_holidays_profile.js, 55_auth_core.js, 60_session_loginAs.js, 65_roll_verification.js, 70_notif_badge_admin_request.js, 75_admin_panel.js, 80_feed_attendance_events_image_history.js, 85_chess_club.js, 86_ledger.js, 88_telegram.js, 90_community_feedback_rating.js, 95_ledger_ai_chat.js, 99_boot_window_bindings.js
// ============================================================================

// ============================================================================
// SECTION: 10_firebase_boot.js
// SDK imports, firebaseConfig, App Check, auth/db/storage + all Firestore collection refs
// Source: index.html lines 3446-3583 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        // ===== FIREBASE IMPORTS =====
        import { initializeApp } from "firebase/app";
        import {
            getAuth,
            createUserWithEmailAndPassword,
            signInWithEmailAndPassword,
            onAuthStateChanged,
            signOut,
            reauthenticateWithCredential,
            updatePassword,
            EmailAuthProvider
        } from "firebase/auth";
        import {
            getFirestore,
            initializeFirestore,
            doc,
            setDoc,
            getDoc,
            getDocs,
            updateDoc,
            deleteDoc,
            collection,
            query,
            where,
            serverTimestamp,
            addDoc,
            onSnapshot,
            limit,
            orderBy,
            startAfter,
            getCountFromServer,
            Timestamp,
            arrayUnion,
            arrayRemove
        } from "firebase/firestore";
        import {
            getStorage,
            ref,
            uploadBytes,
            getDownloadURL,
            deleteObject
        } from "firebase/storage";

        // ===== FIREBASE APP CHECK =====
        import {
            initializeAppCheck,
            ReCaptchaEnterpriseProvider
        } from "firebase/app-check";

        // ===== FIREBASE AI =====
        import {
            getAI,
            getGenerativeModel,
            GoogleAIBackend
        } from "firebase/ai";

        // ===== FIREBASE MESSAGING (PUSH NOTIFICATIONS) =====
        import {
            getMessaging,
            getToken,
            onMessage,
            isSupported as isMessagingSupported
        } from "firebase/messaging";

        // ===== PYTHON BACKEND CLIENT (additive — see backend/) =====
        import { apiFetchRoster, apiCreateTelegramToken, apiCheckTelegramMembership, apiGetTelegramChannelInvite, apiGetTelegramTokenStatus, apiVerifyTelegramSetup, apiSetTelegramWebhook } from './services/apiService.js';

        const firebaseConfig = {
            apiKey: "AIzaSyDMLvLIZkPFO5nsVQBr2IA-8BRB5Hzb3Xo",
            authDomain: "student-erp-77605.firebaseapp.com",
            projectId: "student-erp-77605",
            storageBucket: "student-erp-77605.firebasestorage.app",
            messagingSenderId: "734576815247",
            appId: "1:734576815247:web:70afe502f427337cbad4fa",
            measurementId: "G-N8F1GHBW55"
        };

        const firebaseApp = initializeApp(firebaseConfig);

        // ===== FIREBASE APP CHECK =====
        const RECAPTCHA_ENTERPRISE_SITE_KEY = "6LdMyoYtAAAAACElgEbzVYEQRFYAWzLNLQRfPjGo";

        const isLocal =
            location.hostname === "localhost" ||
            location.hostname === "127.0.0.1";

        const siteKeyIsSet =
            typeof RECAPTCHA_ENTERPRISE_SITE_KEY === "string" &&
            RECAPTCHA_ENTERPRISE_SITE_KEY.length > 10 &&
            !RECAPTCHA_ENTERPRISE_SITE_KEY.startsWith("REPLACE_WITH_");

        if (!siteKeyIsSet) {
            console.error(
                'App Check is NOT initialized: RECAPTCHA_ENTERPRISE_SITE_KEY is still the placeholder. ' +
                'Open Google Cloud → Security → reCAPTCHA Enterprise (or the Firebase console App Check page) ' +
                'and copy the SITE KEY of the WEB key for coldlogic144-prog.github.io into the constant above, ' +
                'then redeploy. No App Check token will be sent until you do.'
            );
        } else {
            console.log("App Check initializing...");
            console.log("App Check provider:", isLocal ? "Firebase Debug Provider (localhost)" : "reCAPTCHA Enterprise (production)");
            console.log("App Check hostname:", location.hostname);

            try {
                if (isLocal) {
                    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
                }

                initializeAppCheck(firebaseApp, {
                    provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_ENTERPRISE_SITE_KEY),
                    isTokenAutoRefreshEnabled: true
                });

                console.log("App Check initialized:", isLocal ? "debug provider (localhost)" : "reCAPTCHA Enterprise (production)");
            } catch (error) {
                console.error("App Check initialization failed:", error);
                console.error("Code:", error?.code);
                console.error("Message:", error?.message);
                throw error;
            }
        }

        const auth = getAuth(firebaseApp);
        const db = initializeFirestore(firebaseApp, {
            experimentalAutoDetectLongPolling: true
        });
        const storage = getStorage(firebaseApp);
        const usersCollection = collection(db, "users");
        const attendanceCollection = collection(db, "attendance");
        const adminRequestsCollection = collection(db, "adminRequests");
        const postsCollection = collection(db, "posts");
        const eventOverridesCollection = collection(db, "eventOverrides");
        const timetableOverridesCollection = collection(db, "timetableOverrides");
        const holidaysCollection = collection(db, "holidays");
        const feedbackCollection = collection(db, "feedback");
        const ratingsCollection = collection(db, "ratings");
        const communityPostsCollection = collection(db, "communityPosts");

        // ===== CHESS CLUB COLLECTIONS =====
        const chessMembersCollection = collection(db, "chessClubMembers");
        const chessChallengesCollection = collection(db, "chessChallenges");
        const chessEventsCollection = collection(db, "chessEvents");
        const chessActivityCollection = collection(db, "chessActivity");
        const chessGamesCollection = collection(db, "chessGames");

        // ===== TELEGRAM PRIVATE ACCESS COLLECTIONS =====
        const telegramApplicationsCollection = collection(db, "telegramApplications");

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

        // ========== TELEGRAM INTEGRATION CONFIGURATION ==========
        // Configurable channel URL, states, and Telegram settings.
        // Centralized here so URLs and states are never hardcoded throughout the application.
        const TELEGRAM_STATES = {
            NOT_APPLIED: 'NOT_APPLIED',
            PENDING_ADMIN_APPROVAL: 'PENDING_ADMIN_APPROVAL',
            ADMIN_REJECTED: 'ADMIN_REJECTED',
            ADMIN_APPROVED: 'ADMIN_APPROVED',
            TELEGRAM_NOT_CONNECTED: 'TELEGRAM_NOT_CONNECTED',
            JOIN_REQUEST_NOT_SENT: 'JOIN_REQUEST_NOT_SENT',
            JOIN_REQUEST_PENDING: 'JOIN_REQUEST_PENDING',
            CHANNEL_APPROVED: 'CHANNEL_APPROVED',
            CHANNEL_REJECTED: 'CHANNEL_REJECTED'
        };

        const TELEGRAM_CONFIG = {
            webUrl: "https://web.telegram.org/k/",
            channelUrl: "https://t.me/+Hx9BkNjz58YwZjY9",
            channelName: "Roomhub",
            channelDescription: "Access official university announcements, semester schedules, exam circulars, and departmental updates directly on Telegram.",
            channelId: "-1003908239361",
            botUsername: "mmmut_erp_bot",
            states: TELEGRAM_STATES
        };



// ============================================================================
// SECTION: 20_notifications_push.js
// Firebase Cloud Messaging web-push module
// Source: index.html lines 3621-3877 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        let messagingInstance = null;
        let fcmSwRegistration = null;
        let pushInitInFlight = false;

        function fcmVapidKeyIsSet() {
            return typeof FCM_VAPID_KEY === 'string' &&
                FCM_VAPID_KEY.length > 10 &&
                FCM_VAPID_KEY !== "PASTE_PUBLIC_VAPID_KEY_HERE";
        }

        function getPushButton() {
            return document.getElementById('pushNotifBtn');
        }

        // Reflects current permission/support state onto the button. Never throws.
        function updatePushButtonUI() {
            try {
                const btn = getPushButton();
                if (!btn) return;

                if (!('Notification' in window) || !('serviceWorker' in navigator)) {
                    btn.style.display = 'none';
                    return;
                }

                if (!currentUid) {
                    btn.style.display = 'none';
                    return;
                }

                btn.style.display = 'inline-flex';

                if (Notification.permission === 'granted') {
                    btn.textContent = '🔔 Notifications enabled';
                    btn.disabled = true;
                    btn.title = 'Push notifications are enabled for this browser.';
                    btn.style.opacity = '0.75';
                } else if (Notification.permission === 'denied') {
                    btn.textContent = '🔕 Notifications blocked';
                    btn.disabled = true;
                    btn.title = 'Notifications are blocked for this site. Enable them in your browser settings (site permissions) to receive alerts.';
                    btn.style.opacity = '0.6';
                } else {
                    btn.textContent = '🔔 Enable Notifications';
                    btn.disabled = false;
                    btn.title = 'Get notified about notices, chess challenges, and events.';
                    btn.style.opacity = '1';
                }
            } catch (e) {
                console.warn('Push UI update skipped:', e);
            }
        }

        // Deterministic-ish doc id from a token so repeated logins on the same
        // browser/device don't create unlimited duplicate token documents.
        function tokenDocId(token) {
            let hash = 0;
            for (let i = 0; i < token.length; i++) {
                hash = ((hash << 5) - hash + token.charCodeAt(i)) | 0;
            }
            return 'web_' + Math.abs(hash).toString(36);
        }

        // PART 6 — STORE THE FCM TOKEN
        async function storeFcmToken(uid, token) {
            try {
                const id = tokenDocId(token);
                const ref = doc(db, 'users', uid, 'notificationTokens', id);
                const existing = await getDoc(ref).catch(() => null);
                await setDoc(ref, {
                    token,
                    platform: 'web',
                    updatedAt: serverTimestamp(),
                    userAgent: navigator.userAgent,
                    ...(existing && existing.exists() ? {} : { createdAt: serverTimestamp() })
                }, { merge: true });
                console.log('FCM token stored for current user.');
            } catch (e) {
                console.error('Could not store FCM token in Firestore.', e);
                if (e && e.code === 'permission-denied') {
                    console.error(
                        'Firestore rules are blocking this write. Add a rule allowing a signed-in user ' +
                        'to read/write their own subcollection: match /users/{uid}/notificationTokens/{tokenId} ' +
                        '{ allow read, write: if request.auth != null && request.auth.uid == uid; } ' +
                        'This was NOT added automatically — please add it yourself in Firebase Console -> Firestore -> Rules.'
                    );
                }
            }
        }

        // PART 7 — FOREGROUND NOTIFICATIONS
        function handleIncomingNotificationData(data) {
            if (!data) return;
            try {
                const type = data.type || 'general';
                if (type === 'notice') {
                    const el = document.getElementById('postsFeedContent') || document.getElementById('notifBell');
                    if (el && typeof scrollToPosts === 'function') scrollToPosts();
                } else if (type === 'chess_challenge' || type === 'chess_event') {
                    if (typeof toggleChessClub === 'function') toggleChessClub(true);
                }
                // 'admin' and 'general' currently just surface as a toast; no navigation.
            } catch (e) {
                console.warn('Notification data handling skipped:', e);
            }
        }

        function setupForegroundMessageHandler() {
            if (!messagingInstance) return;
            try {
                onMessage(messagingInstance, (payload) => {
                    const title = payload?.notification?.title || payload?.data?.title || 'Notification';
                    const body = payload?.notification?.body || payload?.data?.body || '';
                    if (typeof showToast === 'function') {
                        showToast(`🔔 ${title}${body ? ' — ' + body : ''}`, 5000);
                    }
                    handleIncomingNotificationData(payload?.data);
                });
            } catch (e) {
                console.warn('Foreground message listener could not be attached:', e);
            }
        }

        // Registers the service worker (idempotent) without requesting permission.
        async function ensureFcmServiceWorker() {
            if (fcmSwRegistration) return fcmSwRegistration;
            if (!('serviceWorker' in navigator)) return null;
            try {
                fcmSwRegistration = await navigator.serviceWorker.register(FCM_SW_PATH);
                return fcmSwRegistration;
            } catch (e) {
                console.error('Service worker registration failed for', FCM_SW_PATH, e);
                return null;
            }
        }

        // Lightweight, safe-to-call-often check: sets up messaging + foreground
        // listener, and silently refreshes the token IF permission was already
        // granted previously. Never prompts the user. Called after login.
        async function initializePushNotifications() {
            try {
                if (!('Notification' in window) || !('serviceWorker' in navigator)) {
                    console.warn('Push notifications: browser does not support Notifications/Service Workers.');
                    updatePushButtonUI();
                    return;
                }
                if (!(await isMessagingSupported().catch(() => false))) {
                    console.warn('Push notifications: Firebase Messaging is not supported in this browser/context.');
                    updatePushButtonUI();
                    return;
                }
                if (!fcmVapidKeyIsSet()) {
                    console.warn(
                        'Push notifications disabled: FCM_VAPID_KEY is still the placeholder. ' +
                        'Set it from Firebase Console -> Project settings -> Cloud Messaging -> Web Push certificates.'
                    );
                    updatePushButtonUI();
                    return;
                }

                if (!messagingInstance) {
                    messagingInstance = getMessaging(firebaseApp);
                    setupForegroundMessageHandler();
                }

                await ensureFcmServiceWorker();
                updatePushButtonUI();

                if (Notification.permission === 'granted' && currentUid) {
                    // Already granted earlier — refresh/store token without prompting.
                    await fetchAndStoreToken();
                }
            } catch (e) {
                console.error('initializePushNotifications failed (non-fatal):', e);
                updatePushButtonUI();
            }
        }

        async function fetchAndStoreToken() {
            if (!messagingInstance || !currentUid) return;
            try {
                const reg = await ensureFcmServiceWorker();
                const token = await getToken(messagingInstance, {
                    vapidKey: FCM_VAPID_KEY,
                    ...(reg ? { serviceWorkerRegistration: reg } : {})
                });
                console.log("FCM REGISTRATION TOKEN:", token);
                if (token) {
                    await storeFcmToken(currentUid, token);
                }
                return token;
            } catch (e) {
                console.error('Could not obtain FCM token:', e);
                return null;
            }
        }

        // PART 4/5 — called ONLY from the explicit "Enable Notifications" button click.
        async function enablePushNotifications() {
            if (pushInitInFlight) return;
            pushInitInFlight = true;
            const btn = getPushButton();
            try {
                if (!currentUid) {
                    showToast('Please log in first.');
                    return;
                }
                if (!('Notification' in window)) {
                    showToast('Notifications are not supported in this browser.');
                    return;
                }
                if (!fcmVapidKeyIsSet()) {
                    console.warn('Push notifications: FCM_VAPID_KEY placeholder still present.');
                    showToast('Push notifications are not configured yet.');
                    return;
                }
                if (Notification.permission === 'denied') {
                    showToast('Notifications are blocked. Enable them in your browser\'s site settings.');
                    updatePushButtonUI();
                    return;
                }

                if (btn) { btn.disabled = true; btn.textContent = 'Requesting…'; }

                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    showToast('Notifications were not enabled.');
                    updatePushButtonUI();
                    return;
                }

                if (!messagingInstance) {
                    messagingInstance = getMessaging(firebaseApp);
                    setupForegroundMessageHandler();
                }

                const token = await fetchAndStoreToken();
                if (token) {
                    showToast('🔔 Notifications enabled.');
                } else {
                    showToast('Could not finish enabling notifications. Check console for details.');
                }
            } catch (e) {
                console.error('enablePushNotifications failed:', e);
                showToast('Could not enable notifications.');
            } finally {
                pushInitInFlight = false;
                updatePushButtonUI();
            }
        }

        // ========== FIREBASE AI LOGIC SETUP ==========
        const AI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];

        let aiModels = [];
        let aiReady = false;


// ============================================================================
// SECTION: 25_ai_init.js
// Ledger AI (Gemini) model init
// Source: index.html lines 3878-3906 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        async function initAI() {
            if (aiReady) return;

            try {
                const ai = getAI(firebaseApp, {
                    backend: new GoogleAIBackend()
                });

                aiModels = AI_MODELS.map(modelName => ({
                    name: modelName,
                    model: getGenerativeModel(ai, {
                        model: modelName
                    })
                }));

                aiReady = true;
                console.log("Ledger AI: Firebase AI Logic initialized.");
            } catch (error) {
                aiReady = false;
                aiModels = [];

                console.error("Ledger AI initialization failed:", error);
                console.error("Code:", error?.code);
                console.error("Message:", error?.message);

                throw error;
            }
        }


// ============================================================================
// SECTION: 30_data_tables.js
// PERIODS/BRANCHES/BUILTIN_EVENTS/PDF_TIMETABLES static data
// Source: index.html lines 3907-4919 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        // ========== DATA ==========
        const PERIODS = [
            { key: 'I', start: '09:10', end: '10:00', label: 'I' },
            { key: 'II', start: '10:00', end: '10:50', label: 'II' },
            { key: 'III', start: '10:50', end: '11:40', label: 'III' },
            { key: 'IV', start: '11:40', end: '12:30', label: 'IV' },
            { key: 'LUNCH', start: '12:30', end: '14:10', label: 'Lunch' },
            { key: 'V', start: '14:10', end: '15:00', label: 'V' },
            { key: 'VI', start: '15:00', end: '15:50', label: 'VI' },
            { key: 'VII', start: '15:50', end: '16:40', label: 'VII' },
            { key: 'VIII', start: '16:40', end: '17:30', label: 'VIII' },
        ];
        const TEACH_PERIODS = PERIODS.filter(p => p.key !== 'LUNCH');
        const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

        const BRANCHES = [
            { id: 'civil', name: 'B.Tech — Civil Engineering', sections: ['A', 'B'], room: 'TL-206',
                subjects: [
                    { code: 'BSM-110', name: 'Engineering Mathematics I', ltp: [3, 1, 0] },
                    { code: 'BSM-131', name: 'Engineering Physics', ltp: [3, 0, 2] },
                    { code: 'BIT-103', name: 'Programming in C', ltp: [3, 0, 2] },
                    { code: 'BCE-121', name: 'Engineering Graphics', ltp: [2, 0, 4] },
                    { code: 'BHS-101', name: 'Universal Human Values', ltp: [3, 1, 0] },
                ] },
            { id: 'cse', name: 'B.Tech — Computer Sc. & Engineering', sections: ['A', 'B', 'C', 'D'], room: 'TL-109 / TL-201',
                subjects: [
                    { code: 'BSM-110', name: 'Engineering Mathematics I', ltp: [3, 1, 0] },
                    { code: 'BSM-131', name: 'Engineering Physics', ltp: [3, 0, 2] },
                    { code: 'BCS-110', name: 'Introduction to C Programming', ltp: [3, 0, 2] },
                    { code: 'BCS-111', name: 'Web Designing-1', ltp: [2, 0, 4] },
                    { code: 'BHS-101', name: 'Universal Human Values', ltp: [3, 1, 0] },
                ] },
            { id: 'it', name: 'B.Tech — Information Technology', sections: ['A', 'B'], room: 'TL-203',
                subjects: [
                    { code: 'BSM-110', name: 'Engineering Mathematics I', ltp: [3, 1, 0] },
                    { code: 'BSM-131', name: 'Engineering Physics', ltp: [3, 0, 2] },
                    { code: 'BIT-103', name: 'Programming in C', ltp: [3, 0, 2] },
                    { code: 'BIT-104', name: 'Internet and Web Designing', ltp: [2, 0, 4] },
                    { code: 'BHS-101', name: 'Universal Human Values', ltp: [3, 1, 0] },
                ] },
            { id: 'chemical', name: 'B.Tech — Chemical Engineering', sections: ['A'], room: 'TL-110',
                subjects: [
                    { code: 'BSM-110', name: 'Engineering Mathematics I', ltp: [3, 1, 0] },
                    { code: 'BSM-131', name: 'Engineering Physics', ltp: [3, 0, 2] },
                    { code: 'BIT-103', name: 'Programming in C', ltp: [3, 0, 2] },
                    { code: 'BME-104', name: 'Manufacturing Techniques Workshop', ltp: [2, 0, 4] },
                    { code: 'BHS-101', name: 'Universal Human Values', ltp: [3, 1, 0] },
                ] },
            { id: 'ee', name: 'B.Tech — Electrical Engineering', sections: ['A', 'B'], room: 'TL-202',
                subjects: [
                    { code: 'BSM-110', name: 'Engineering Mathematics I', ltp: [3, 1, 0] },
                    { code: 'BSM-140', name: 'Environmental Science & Green Chemistry', ltp: [3, 0, 2] },
                    { code: 'BEE-110', name: 'Basic Electrical Engineering', ltp: [3, 0, 2] },
                    { code: 'BEE-108A', name: 'Electrical Wiring & Estimation', ltp: [3, 0, 2] },
                    { code: 'BHS-102', name: 'Technical Writing & Professional Communication', ltp: [2, 1, 2] },
                ] },
            { id: 'me', name: 'B.Tech — Mechanical Engineering', sections: ['A', 'B'], room: 'TL-205',
                subjects: [
                    { code: 'BSM-110', name: 'Engineering Mathematics I', ltp: [3, 1, 0] },
                    { code: 'BSM-140', name: 'Environmental Science & Green Chemistry', ltp: [3, 0, 2] },
                    { code: 'BEE-110', name: 'Basic Electrical Engineering', ltp: [3, 0, 2] },
                    { code: 'BME-104', name: 'Manufacturing Practice Workshop', ltp: [2, 0, 4] },
                    { code: 'BHS-102', name: 'Technical Writing & Professional Communication', ltp: [2, 1, 2] },
                ] },
            { id: 'ece', name: 'B.Tech — Electronics & Comm. Engineering', sections: ['A', 'B', 'C'], room: 'TL-207 / TL-204',
                subjects: [
                    { code: 'BSM-110', name: 'Engineering Mathematics I', ltp: [3, 1, 0] },
                    { code: 'BSM-140', name: 'Environmental Science & Green Chemistry', ltp: [3, 0, 2] },
                    { code: 'BEE-110', name: 'Basic Electrical Engineering', ltp: [3, 0, 2] },
                    { code: 'BEC-106', name: 'Electronic Components Testing & Measurement', ltp: [2, 0, 4] },
                    { code: 'BHS-102', name: 'Technical Writing & Professional Communication', ltp: [2, 1, 2] },
                ] },
            { id: 'eceiot', name: 'B.Tech - ECE (IOT)', sections: ['A'], room: 'TL-204',
                subjects: [
                    { code: 'BSM-110', name: 'Engineering Mathematics I', ltp: [3, 1, 0] },
                    { code: 'BSM-140', name: 'Environmental Science & Green Chemistry', ltp: [3, 0, 2] },
                    { code: 'BEE-110', name: 'Basic Electrical Engineering', ltp: [3, 0, 2] },
                    { code: 'BEC-106', name: 'Electronic Components Testing & Measurement', ltp: [2, 0, 4] },
                    { code: 'BHS-102', name: 'Technical Writing & Professional Communication', ltp: [2, 1, 2] },
                ] },
            { id: 'bba', name: 'BBA', sections: ['A', 'B'], room: 'TL-113 / TL-114',
                subjects: [
                    { code: 'BBA-114', name: 'Financial Accounting', ltp: [3, 0, 0] },
                    { code: 'BBA-115', name: 'Principles & Practices of Management', ltp: [3, 0, 0] },
                    { code: 'BBA-116', name: 'Quantitative Techniques for Business Research', ltp: [3, 0, 0] },
                    { code: 'BBA-A01', name: 'Business Communication for Managers', ltp: [2, 0, 0] },
                    { code: 'BHM-121', name: 'Industrial Psychology / IPR', ltp: [2, 0, 0] },
                    { code: 'AUC-108', name: 'Ability / Value Added Course', ltp: [2, 0, 0] },
                ] },
            { id: 'bpharm', name: 'B.Pharm', sections: ['A'], room: 'L-115',
                subjects: [
                    { code: 'BPT101T', name: 'Human Anatomy, Physiology & Pathophysiology I', ltp: [3, 0, 0] },
                    { code: 'BPT102T', name: 'Introduction to Pharmacognosy', ltp: [3, 0, 0] },
                    { code: 'BPT103T', name: 'Pharmaceutical Inorganic & Analytical Chemistry', ltp: [3, 0, 0] },
                    { code: 'BPT104T', name: 'Basics of Python Programming', ltp: [2, 0, 0] },
                    { code: 'BPT105T', name: 'General Pharmacy', ltp: [2, 0, 0] },
                    { code: 'BPT106T', name: 'Healthcare Psychology & Communication Skills', ltp: [2, 0, 0] },
                    { code: 'BPT107P', name: 'Pharmacognosy (Practical)', ltp: [0, 0, 2] },
                    { code: 'BPT108P', name: 'Inorganic & Analytical Chemistry (Practical)', ltp: [0, 0, 2] },
                    { code: 'BPT109P', name: 'General Pharmacy (Practical)', ltp: [0, 0, 2] },
                    { code: 'BPT110P', name: 'Healthcare Psychology (Practical)', ltp: [0, 0, 2] },
                    { code: 'BPT111P', name: 'Anatomy & Physiology (Practical)', ltp: [0, 0, 2] },
                ] },
        ];

        const BUILTIN_EVENTS = [
            { start: '2026-07-29', end: '2026-07-30', title: 'Physical Reporting at MMMUT Gorakhpur' },
            { start: '2026-07-31', end: '2026-07-31', title: 'Orientation Program' },
            { start: '2026-08-01', end: '2026-08-22', title: 'Induction Program for Newly Admitted Students (IPNS-2026)' },
            { start: '2026-08-03', end: '2026-08-03', title: 'Commencement of classes (partially)' },
            { start: '2026-09-18', end: '2026-09-18', title: 'Display of Mid Semester Attendance by HoD' },
            { start: '2026-09-21', end: '2026-09-25', title: 'Minor Test Examination' },
            { start: '2026-11-09', end: '2026-11-16', title: 'Mid Semester Break' },
            { start: '2026-11-21', end: '2026-11-22', title: 'Alumni Meet' },
            { start: '2026-11-23', end: '2026-11-23', title: 'Last date for end semester classes' },
            { start: '2026-11-24', end: '2026-11-27', title: 'Practical Exam / Doubt Clearing classes' },
            { start: '2026-11-26', end: '2026-11-26', title: 'Display of attendance by Dean Office' },
            { start: '2026-11-30', end: '2026-12-08', title: 'End Semester Major Examination' },
            { start: '2026-12-01', end: '2026-12-01', title: 'University Foundation Day' },
            { start: '2026-12-09', end: '2026-12-12', title: 'Semester Break' },
            { start: '2026-12-12', end: '2026-12-12', title: 'Last date for evaluation of answer sheets & marks uploading' },
            { start: '2026-12-14', end: '2026-12-14', title: 'Last date for grade moderation committee meeting (1st Year)' },
            { start: '2026-12-15', end: '2026-12-15', title: 'Last date for declaration of semester result' },
            { start: '2026-12-09', end: '2026-12-12', title: 'Online registration (Even Semester)' },
            { start: '2026-12-14', end: '2026-12-14', title: 'Commencement of classes (Even Semester)' },
            { start: '2026-12-18', end: '2026-12-20', title: 'CSA Activity — Tech Srijan' },
            { start: '2027-01-30', end: '2027-01-30', title: 'Display of Mid Semester Attendance by HoD' },
            { start: '2027-02-01', end: '2027-02-06', title: 'Minor Test Examination' },
            { start: '2027-02-12', end: '2027-02-13', title: 'CSA Activity — Annual Sports Meet' },
            { start: '2027-02-26', end: '2027-02-28', title: 'CSA Activity — Cultural Program' },
            { start: '2027-03-22', end: '2027-03-27', title: 'Mid Semester Break' },
            { start: '2027-04-17', end: '2027-04-17', title: 'Last date for end semester classes' },
            { start: '2027-04-19', end: '2027-04-24', title: 'Practical Exam / Doubt Clearing classes' },
            { start: '2027-04-22', end: '2027-04-22', title: 'Display of attendance by Dean Office' },
            { start: '2027-04-26', end: '2027-05-05', title: 'End Semester Major Examination' },
            { start: '2027-05-05', end: '2027-06-30', title: 'Session Break' },
            { start: '2027-05-10', end: '2027-05-10', title: 'Last date for evaluation of answer sheets & marks uploading' },
            { start: '2027-05-12', end: '2027-05-12', title: 'Grade moderation committee meeting (1st Year)' },
            { start: '2027-05-07', end: '2027-05-14', title: 'Social Work / Training — Dean of Extension' },
            { start: '2027-05-13', end: '2027-05-13', title: 'Last date for declaration of semester result' },
            { start: '2027-05-16', end: '2027-06-14', title: 'Summer Break for Teachers' },
            { start: '2027-07-01', end: '2027-07-10', title: 'Online registration & fee deposit — Second Year' },
        ];

        const PDF_TIMETABLES = {
            "civil::A": { "Monday": { "I": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "II": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "III": { "code": "BIT-103", "name": "Programming in C", "type": "Lecture" },
                    "IV": { "code": "BCE-121", "name": "Engineering Graphics", "type": "Lecture" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VIII": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" } },
                "Tuesday": { "I": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "II": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "III": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "II": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "III": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "BIT-103", "name": "Programming in C", "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BIT-103", "name": "Programming in C", "type": "Lecture" },
                    "IV": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "V": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "BIT-103", "name": "Programming in C", "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BIT-103", "name": "Programming in C", "type": "Lecture" },
                    "IV": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "V": { "code": "BCE-121", "name": "Engineering Graphics", "type": "Lecture" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "cse::A": { "Monday": { "I": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "IV": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "V": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "IV": { "code": "BCS-111", "name": "Web Designing-1", "type": "Lecture" },
                    "V": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "IV": { "code": "BCS-111", "name": "Web Designing-1", "type": "Lecture" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "VIII": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Lecture" } },
                "Thursday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VI": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VI": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "cse::B": { "Monday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Lecture" },
                    "III": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VI": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Lecture" },
                    "III": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VI": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "VI": { "code": "BCS-111", "name": "Web Designing-1", "type": "Lecture" },
                    "VII": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "IV": { "code": "BCS-111", "name": "Web Designing-1", "type": "Lecture" },
                    "V": { "code": "BCS-111", "name": "Web Designing-1", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "IV": { "code": "BCS-111", "name": "Web Designing-1", "type": "Lecture" },
                    "V": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "cse::C": { "Monday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "IV": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "V": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Lecture" },
                    "VI": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "BCS-111", "name": "Web Designing-1", "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VI": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "IV": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "V": { "code": "BCS-111", "name": "Web Designing-1", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "BCS-111", "name": "Web Designing-1", "type": "Lecture" },
                    "II": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Lecture" },
                    "III": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VI": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "BCS-111", "name": "Web Designing-1", "type": "Lecture" },
                    "II": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Lecture" },
                    "III": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VI": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "VII": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "cse::D": { "Monday": { "I": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "II": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Lecture" },
                    "II": { "code": "BCS-111", "name": "Web Designing-1", "type": "Lecture" },
                    "III": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "IV": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "V": { "code": "BCS-111", "name": "Web Designing-1", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Lecture" },
                    "II": { "code": "BCS-111", "name": "Web Designing-1", "type": "Lecture" },
                    "III": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BCS-110", "name": "Introduction to C Programming", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VIII": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" } },
                "Thursday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "IV": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VIII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" } },
                "Friday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "IV": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" } } },
            "it::A": { "Monday": { "I": { "code": "BIT-103", "name": "Programming in C", "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VI": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "BIT-103", "name": "Programming in C", "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VI": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BIT-103", "name": "Programming in C", "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BIT-104", "name": "Internet and Web Designing", "type": "Lecture" },
                    "VI": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VII": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BIT-103", "name": "Programming in C", "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VI": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VII": { "code": "BIT-104", "name": "Internet and Web Designing", "type": "Lecture" },
                    "VIII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" } },
                "Friday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "IV": { "code": "BIT-103", "name": "Programming in C", "type": "Lecture" },
                    "V": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" },
                    "VI": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "VII": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "it::B": { "Monday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BIT-103", "name": "Programming in C", "type": "Lecture" },
                    "III": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "IV": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BIT-103", "name": "Programming in C", "type": "Lecture" },
                    "III": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "IV": { "code": "BIT-104", "name": "Internet and Web Designing", "type": "Lecture" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" },
                    "VIII": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" } },
                "Wednesday": { "I": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "IV": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "V": { "code": "BIT-103", "name": "Programming in C", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "IV": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" },
                    "V": { "code": "BIT-104", "name": "Internet and Web Designing", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "BIT-103", "name": "Programming in C", "type": "Lecture" },
                    "II": { "code": "TL-203", "name": "TL-203", "type": "Tutorial" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BIT-103", "name": "Programming in C", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BIT-104", "name": "Internet and Web Designing", "type": "Lecture" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "chemical::A": { "Monday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "III": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BME-101", "name": "Manufacturing Techniques Workshop", "type": "Lecture" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "III": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BSM-131", "name": "Engineering Physics", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "TL-110", "name": "TL-110", "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "BIT-103", "name": "Programming in C", "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "VI": { "code": "BIT-103", "name": "Programming in C", "type": "Lecture" },
                    "VII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "BSM-131", "name": "Engineering Physics", "type": "Lecture" },
                    "III": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "IV": { "code": "BIT-103", "name": "Programming in C", "type": "Lecture" },
                    "V": { "code": "BME-104", "name": "Manufacturing Practice Workshop", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BIT-103", "name": "Programming in C", "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "III": { "code": "BHS-101", "name": "Universal Human Values", "type": "Lecture" },
                    "IV": { "code": "BIT-103", "name": "Programming in C", "type": "Lecture" },
                    "V": { "code": "BME-101", "name": "Manufacturing Techniques Workshop", "type": "Lecture" },
                    "VI": { "code": "TL-110", "name": "TL-110", "type": "Tutorial" },
                    "VII": { "code": "BHS-101", "name": "Universal Human Values", "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "ee::A": { "Monday": { "I": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Lecture" },
                    "II": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BEE-108A", "name": "Electrical Wiring & Estimation", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "IV": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Lecture" },
                    "V": { "code": "BEE-108A", "name": "Electrical Wiring & Estimation", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Lecture" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "IV": { "code": "BEE-108A", "name": "Electrical Wiring & Estimation", "type": "Lecture" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Lecture" },
                    "II": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "III": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VI": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "VII": { "code": "BEE-108A", "name": "Electrical Wiring & Estimation", "type": "Lecture" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Lecture" },
                    "II": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "III": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BEE-108A", "name": "Electrical Wiring & Estimation", "type": "Lecture" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "ee::B": { "Monday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BEE-108A", "name": "Electrical Wiring & Estimation", "type": "Lecture" },
                    "IV": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "V": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VI": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Lecture" },
                    "II": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "III": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VI": { "code": "BEE-108A", "name": "Electrical Wiring & Estimation", "type": "Lecture" },
                    "VII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Lecture" },
                    "II": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Lecture" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "BEE-108A", "name": "Electrical Wiring & Estimation", "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "IV": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Lecture" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "VIII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" } },
                "Friday": { "I": { "code": "BEE-108A", "name": "Electrical Wiring & Estimation", "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                    "type": "Lecture" },
                    "IV": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "V": { "code": "BEE-108A", "name": "Electrical Wiring & Estimation", "type": "Lecture" },
                    "VI": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "VII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "me::A": { "Monday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "III": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                    "type": "Lecture" },
                    "IV": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Lecture" },
                    "V": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" } },
                "Tuesday": { "I": { "code": "BME-104", "name": "Manufacturing Practice Workshop", "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Lecture" },
                    "VIII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" } },
                "Wednesday": { "I": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Lecture" },
                    "II": { "code": "BME-104", "name": "Manufacturing Practice Workshop", "type": "Lecture" },
                    "III": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Lecture" },
                    "VIII": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" } },
                "Thursday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BME-104", "name": "Manufacturing Practice Workshop", "type": "Lecture" },
                    "VI": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BME-104", "name": "Manufacturing Practice Workshop", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "me::B": { "Monday": { "I": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "VI": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "VII": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "III": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                    "type": "Lecture" },
                    "IV": { "code": "BME-104", "name": "Manufacturing Practice Workshop", "type": "Lecture" },
                    "V": { "code": "BME-104", "name": "Manufacturing Practice Workshop", "type": "Practical" },
                    "VI": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Lecture" },
                    "IV": { "code": "BME-104", "name": "Manufacturing Practice Workshop", "type": "Lecture" },
                    "V": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "IV": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "V": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "ece::A": { "Monday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "III": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Lecture" },
                    "VI": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                    "type": "Lecture" },
                    "VII": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "BEC-106", "name": "Electronic Components Testing & Measurement",
                        "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Lecture" },
                    "VI": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                    "type": "Lecture" },
                    "VII": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Lecture" },
                    "IV": { "code": "BEC-106", "name": "Electronic Components Testing & Measurement",
                    "type": "Lecture" },
                    "V": { "code": "BEC-106", "name": "Electronic Components Testing & Measurement",
                        "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VI": { "code": "BEC-106", "name": "Electronic Components Testing & Measurement",
                        "type": "Lecture" },
                    "VII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VI": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "ece::B": { "Monday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BEC-106", "name": "Electronic Components Testing & Measurement",
                        "type": "Lecture" },
                    "IV": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                    "type": "Lecture" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VIII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" } },
                "Tuesday": { "I": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "II": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "III": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Lecture" },
                    "IV": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                    "type": "Lecture" },
                    "V": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BEC-106", "name": "Electronic Components Testing & Measurement",
                        "type": "Lecture" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "II": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Lecture" },
                    "VIII": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Lecture" } },
                "Thursday": { "I": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "IV": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" },
                    "V": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "IV": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "V": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "ece::C": { "Monday": { "I": { "code": "BEE-110", "name": "Basic Electrical Engineering",
                        "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "VI": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                    "type": "Lecture" },
                    "VII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Lecture" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "IV": { "code": "BEC-106", "name": "Electronic Components Testing & Measurement",
                        "type": "Lecture" },
                    "V": { "code": "BEC-106", "name": "Electronic Components Testing & Measurement",
                        "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "BEC-106", "name": "Electronic Components Testing & Measurement",
                        "type": "Lecture" },
                    "II": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "III": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                    "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                    "type": "Lecture" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Lecture" },
                    "VI": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "VII": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "eceiot::A": { "Monday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I",
                        "type": "Lecture" },
                    "II": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                    "type": "Lecture" },
                    "III": { "code": "BEC-106", "name": "Electronic Components Testing & Measurement",
                        "type": "Lecture" },
                    "IV": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "V": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "II": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                    "type": "Lecture" },
                    "III": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Lecture" },
                    "IV": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "V": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" },
                    "VI": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Lecture" },
                    "IV": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                    "type": "Lecture" },
                    "V": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Practical" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "BSM-140", "name": "Environmental Science & Green Chemistry",
                        "type": "Practical" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BEC-106", "name": "Electronic Components Testing & Measurement",
                        "type": "Lecture" },
                    "IV": { "code": "BEE-110", "name": "Basic Electrical Engineering", "type": "Lecture" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BSM-110", "name": "Engineering Mathematics I", "type": "Tutorial" },
                    "VIII": { "code": "BHS-102", "name": "Technical Writing & Professional Communication",
                        "type": "Tutorial" } } },
            "bba::A": { "Monday": { "I": { "code": "BBA-115", "name": "Principles & Practices of Management",
                        "type": "Tutorial" },
                    "II": { "code": "BBA-114", "name": "Financial Accounting", "type": "Lecture" },
                    "III": { "code": "BBA-116", "name": "Quantitative Techniques for Business Research",
                        "type": "Tutorial" },
                    "IV": { "code": "BBA-114", "name": "Financial Accounting", "type": "Tutorial" },
                    "V": { "code": "BHM-121", "name": "Industrial Psychology", "type": "Tutorial" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "BHM-121", "name": "Industrial Psychology", "type": "Lecture" },
                    "II": { "code": "BBA-114", "name": "Financial Accounting", "type": "Lecture" },
                    "III": { "code": "BBA-114", "name": "Financial Accounting", "type": "Tutorial" },
                    "IV": { "code": "BBA-115", "name": "Principles & Practices of Management", "type": "Lecture" },
                    "V": { "code": "BBA-A01", "name": "Business Communication for Managers", "type": "Lecture" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "BHM-121", "name": "Industrial Psychology", "type": "Lecture" },
                    "II": { "code": "BBA-114", "name": "Financial Accounting", "type": "Lecture" },
                    "III": { "code": "BBA-116", "name": "Quantitative Techniques for Business Research",
                        "type": "Tutorial" },
                    "IV": { "code": "BBA-115", "name": "Principles & Practices of Management", "type": "Tutorial" },
                    "V": { "code": "BBA-116", "name": "Quantitative Techniques for Business Research",
                        "type": "Lecture" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BHM-121", "name": "Industrial Psychology", "type": "Tutorial" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "BHM-121", "name": "Industrial Psychology", "type": "Lecture" },
                    "II": { "code": "AUC-108", "name": "Intellectual Property Rights", "type": "Lecture" },
                    "III": { "code": "BBA-A01", "name": "Business Communication for Managers", "type": "Tutorial" },
                    "IV": { "code": "BBA-115", "name": "Principles & Practices of Management", "type": "Lecture" },
                    "V": { "code": "BBA-116", "name": "Quantitative Techniques for Business Research",
                        "type": "Lecture" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "BBA-A01", "name": "Business Communication for Managers", "type": "Lecture" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "BBA-A01", "name": "Business Communication for Managers",
                        "type": "Lecture" },
                    "II": { "code": "AUC-108", "name": "Intellectual Property Rights", "type": "Lecture" },
                    "III": { "code": "BBA-A01", "name": "Business Communication for Managers", "type": "Tutorial" },
                    "IV": { "code": "BBA-115", "name": "Principles & Practices of Management", "type": "Lecture" },
                    "V": { "code": "BBA-116", "name": "Quantitative Techniques for Business Research",
                        "type": "Lecture" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "bba::B": { "Monday": { "I": { "code": "BBA-114", "name": "Financial Accounting", "type": "Tutorial" },
                    "II": { "code": "BBA-116", "name": "Quantitative Techniques for Business Research",
                        "type": "Lecture" },
                    "III": { "code": "BHM-121", "name": "Industrial Psychology", "type": "Lecture" },
                    "IV": { "code": "BBA-115", "name": "Principles & Practices of Management", "type": "Tutorial" },
                    "V": { "code": "BBA-A01", "name": "Business Communication for Managers", "type": "Lecture" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "AUC-108", "name": "Intellectual Property Rights", "type": "Lecture" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BHM-121", "name": "Industrial Psychology", "type": "Tutorial" },
                    "IV": { "code": "BBA-114", "name": "Financial Accounting", "type": "Lecture" },
                    "V": { "code": "BBA-115", "name": "Principles & Practices of Management", "type": "Lecture" },
                    "VI": { "code": "BBA-A01", "name": "Business Communication for Managers", "type": "Lecture" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "BHM-121", "name": "Industrial Psychology", "type": "Lecture" },
                    "II": { "code": "BBA-116", "name": "Quantitative Techniques for Business Research",
                        "type": "Lecture" },
                    "III": { "code": "BBA-114", "name": "Financial Accounting", "type": "Tutorial" },
                    "IV": { "code": "BBA-114", "name": "Financial Accounting", "type": "Lecture" },
                    "V": { "code": "BHM-121", "name": "Industrial Psychology", "type": "Tutorial" },
                    "VI": { "code": "BBA-A01", "name": "Business Communication for Managers", "type": "Tutorial" },
                    "VII": { "code": "AUC-108", "name": "Intellectual Property Rights", "type": "Lecture" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "BBA-115", "name": "Principles & Practices of Management",
                        "type": "Lecture" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "BBA-114", "name": "Financial Accounting", "type": "Lecture" },
                    "IV": { "code": "BBA-116", "name": "Quantitative Techniques for Business Research",
                        "type": "Tutorial" },
                    "V": { "code": "BBA-115", "name": "Principles & Practices of Management", "type": "Lecture" },
                    "VI": { "code": "BBA-A01", "name": "Business Communication for Managers", "type": "Tutorial" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "BHM-121", "name": "Industrial Psychology", "type": "Lecture" },
                    "III": { "code": "BBA-116", "name": "Quantitative Techniques for Business Research",
                        "type": "Lecture" },
                    "IV": { "code": "BBA-116", "name": "Quantitative Techniques for Business Research",
                        "type": "Tutorial" },
                    "V": { "code": "BBA-115", "name": "Principles & Practices of Management", "type": "Tutorial" },
                    "VI": { "code": "BBA-A01", "name": "Business Communication for Managers", "type": "Lecture" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } },
            "bpharm::A": { "Monday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Tuesday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Wednesday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Thursday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } },
                "Friday": { "I": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "II": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "III": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "IV": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "V": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VI": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VII": { "code": "—", "name": "Self Study / Library", "type": "Free" },
                    "VIII": { "code": "—", "name": "Self Study / Library", "type": "Free" } } }
        };


// ============================================================================
// SECTION: 35_schedule_engine.js
// Helpers + seeded timetable generator
// Source: index.html lines 4920-5042 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        // ========== HELPERS ==========
        function getBranch(id) { return BRANCHES.find(b => b.id === id); }

        function authEmail(username) {
            username = String(username || '').trim().toLowerCase();
            if (username.endsWith('@mmmut.local')) return username;
            return username + '@mmmut.local';
        }

        function dateKey(d) { return d.toISOString().slice(0, 10); }

        function fmtTime(t) {
            const [h, m] = t.split(':').map(Number);
            const ap = h >= 12 ? 'pm' : 'am';
            const h12 = h % 12 === 0 ? 12 : h % 12;
            return `${h12}:${m.toString().padStart(2, '0')}${ap}`;
        }

        function comparePeriod(key, nowKey) {
            const order = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
            if (!nowKey) return -1;
            return order.indexOf(key) - order.indexOf(nowKey);
        }

        function computeLeaveInfo(present, absent, targetPct) {
            const total = present + absent;
            const target = targetPct / 100;
            if (total === 0) return { type: 'none' };
            const currentPct = present / total;
            if (currentPct >= target) {
                const x = Math.floor(present / target - total + 1e-9);
                return { type: 'skip', value: Math.max(0, x) };
            } else {
                const y = Math.ceil((target * total - present) / (1 - target) - 1e-9);
                return { type: 'attend', value: Math.max(1, y) };
            }
        }

        function hashSeed(str) {
            let h = 1779033703 ^ str.length;
            for (let i = 0; i < str.length; i++) {
                h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
                h = (h << 13) | (h >>> 19);
            }
            return function() {
                h = Math.imul(h ^ (h >>> 16), 2246822519);
                h = Math.imul(h ^ (h >>> 13), 3266489917);
                h = (h ^= h >>> 16) >>> 0;
                return h / 4294967296;
            };
        }

        function seededShuffle(arr, rng) {
            const a = arr.slice();
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(rng() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }

        function buildSchedule(branch, section) {
            const pdfGrid = PDF_TIMETABLES[branch.id + '::' + section];
            if (pdfGrid) return JSON.parse(JSON.stringify(pdfGrid));
            const rng = hashSeed(branch.id + '::' + section);
            const grid = {};
            DAYS.forEach(d => { grid[d] = {};
                TEACH_PERIODS.forEach(p => grid[d][p.key] = null); });
            const dayHas = {};
            DAYS.forEach(d => dayHas[d] = new Set());
            let units = [];
            branch.subjects.forEach(s => {
                const [L, T] = s.ltp;
                for (let i = 0; i < L; i++) units.push({ code: s.code, name: s.name, type: 'Lecture' });
                for (let i = 0; i < T; i++) units.push({ code: s.code, name: s.name, type: 'Tutorial' });
            });
            units = seededShuffle(units, rng);
            const morningSlots = [];
            DAYS.forEach(d => ['I', 'II', 'III', 'IV'].forEach(k => morningSlots.push({ day: d, key: k })));
            const shuffledMorning = seededShuffle(morningSlots, rng);
            const remaining = units.slice();
            shuffledMorning.forEach(slot => {
                if (!remaining.length) return;
                let idx = remaining.findIndex(u => !dayHas[slot.day].has(u.code));
                if (idx === -1) idx = 0;
                const u = remaining.splice(idx, 1)[0];
                grid[slot.day][slot.key] = u;
                dayHas[slot.day].add(u.code);
            });
            let blocks = [];
            branch.subjects.forEach(s => {
                const P = s.ltp[2];
                const blockCount = Math.max(0, Math.round(P / 2));
                for (let i = 0; i < blockCount; i++) blocks.push({ code: s.code, name: s.name, type: 'Practical' });
            });
            blocks = seededShuffle(blocks, rng);
            let pairSlots = [];
            DAYS.forEach(d => { pairSlots.push({ day: d, keys: ['V', 'VI'] });
                pairSlots.push({ day: d, keys: ['VII', 'VIII'] }); });
            pairSlots = seededShuffle(pairSlots, rng);
            const usedPair = new Set();

            function tryPlaceBlock(block, avoidSameDay) {
                for (const pair of pairSlots) {
                    const pid = pair.day + ':' + pair.keys[0];
                    if (usedPair.has(pid)) continue;
                    if (avoidSameDay && dayHas[pair.day].has(block.code)) continue;
                    grid[pair.day][pair.keys[0]] = block;
                    grid[pair.day][pair.keys[1]] = block;
                    dayHas[pair.day].add(block.code);
                    usedPair.add(pid);
                    return true;
                }
                return false;
            }
            blocks.forEach(block => {
                if (!tryPlaceBlock(block, true)) { tryPlaceBlock(block, false); }
            });
            DAYS.forEach(d => {
                TEACH_PERIODS.forEach(p => {
                    if (!grid[d][p.key]) grid[d][p.key] = { code: '—', name: 'Self Study / Library',
                    type: 'Free' };
                });
            });
            return grid;
        }


// ============================================================================
// SECTION: 40_syllabus_data.js
// Per-branch/year syllabus dataset
// Source: index.html lines 5043-5612 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        // ========== SYLLABUS DATA (from PDFs) ==========
        const syllabusData = {
            "cse": {
                name: "Computer Science & Engineering",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-131/181", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-110/160", name: "Introduction to C Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-111", name: "Web Designing-1", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-101/151", name: "Universal Human Values: Understanding Harmony", ltp: "3-1-0",
                            credits: 4 },
                        { code: "ECA-I", name: "Induction Program", ltp: "0-0-0", credits: 0 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics II", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-161", name: "Web Designing-2", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 },
                        { code: "BCS-162", name: "Design Thinking in Information & Understanding", ltp: "0-0-2",
                            credits: 0 }
                    ],
                    3: [
                        { code: "BCS-210A", name: "Discrete Structure", ltp: "3-1-0", credits: 4 },
                        { code: "BCS-211", name: "Digital Logic and Design", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-212A", name: "Object Oriented Programming through JAVA", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BCS-213", name: "Theory of Computation", ltp: "3-1-0", credits: 4 },
                        { code: "BCS-214", name: "Principles of Data Structures", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Fundamentals of Artificial Intelligence", ltp: "2-0-0",
                            credits: 0 }
                    ],
                    4: [
                        { code: "BSM-212/262", name: "Operational Research", ltp: "3-1-0", credits: 4 },
                        { code: "BCS-261", name: "Design & Analysis of Algorithms", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-262", name: "Computer Organization and Architecture", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BCS-263", name: "Database Management Systems", ltp: "3-0-2", credits: 4 }
                    ],
                    5: [
                        { code: "BHS-301/351", name: "Engineering and Managerial Economics", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BCS-305", name: "Principles of Operating Systems", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-306", name: "Principles of Compiler Design", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-307", name: "Computer Networks", ltp: "3-0-2", credits: 4 }
                    ],
                    6: [
                        { code: "BMS-301/351", name: "Principles Of Industrial Management", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BCS-355", name: "Software Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-361", name: "Image and Video Processing", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-356", name: "Parallel & Distributed Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-371", name: "Minor Project-I", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BCS-441", name: "Minor Project-II", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "ICS-444", name: "Industrial Practice (IP)", ltp: "0-0-20", credits: 10 },
                        { code: "ICS-481", name: "Major Project (MP)", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "ece": {
                name: "Electronics & Communication Engineering",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-106", name: "Electronic Components Testing and Measurement", ltp: "2-0-4",
                            credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics II", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-131/181", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-110/160", name: "Introduction to C Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-157", name: "Electronic Workshop", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-101/151", name: "Universal Human Values", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-170", name: "Design Thinking in Electronics & Communication Engineering",
                            ltp: "0-0-2", credits: 0 }
                    ],
                    3: [
                        { code: "BSM-216", name: "Applied Probability and Statistics", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-207", name: "Digital Electronics", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-208", name: "Network Theory: Analysis & Synthesis", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-209", name: "Electronic Measurement & Instrumentation", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEC-210", name: "Electronic Devices & Circuits Theory", ltp: "3-1-0", credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Fundamentals of Artificial Intelligence", ltp: "2-0-0",
                            credits: 0 }
                    ],
                    4: [
                        { code: "BEC-259", name: "Electromagnetic Field Theory", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-260", name: "Signal & Systems", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-261", name: "Microprocessor and Applications", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-262", name: "Analog Integrated Circuits", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-108", name: "Intellectual Property Right", ltp: "2-0-0", credits: 0 }
                    ],
                    5: [
                        { code: "BEC-309", name: "Microwave Theory & Techniques", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-310", name: "Modern Control Systems", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-311", name: "Analog & Digital Communication", ltp: "3-0-2", credits: 4 },
                        { code: "BMS-301", name: "Principles of Industrial Management", ltp: "3-1-0", credits: 4 }
                    ],
                    6: [
                        { code: "BEC-357", name: "Embedded System and Microcontroller", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-358", name: "Optical and Wireless Communication", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-359", name: "Digital Signal Processing", ltp: "3-0-2", credits: 4 },
                        { code: "BHS-301/351", name: "Engineering and Managerial Economics", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BEC-441", name: "Minor Project-1", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BEC-442", name: "Minor Project-2", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "IEC-415", name: "Industrial Practice (IP)", ltp: "0-0-20", credits: 10 },
                        { code: "IEC-416", name: "Major Project (MP)", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "civil": {
                name: "Civil Engineering",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-131/181", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-103", name: "Programming in C", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-121", name: "Engineering Graphics", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-101/151", name: "Universal Human Values", ltp: "3-1-0", credits: 4 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics II", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-107/157", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-161", name: "Building Planning and Drawing", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 },
                        { code: "BCE-162", name: "Design Thinking in Civil Engineering", ltp: "0-0-2", credits: 0 }
                    ],
                    3: [
                        { code: "BCE-210", name: "Civil Engineering Materials, Evaluation and Testing",
                            ltp: "3-0-2", credits: 4 },
                        { code: "BCE-211", name: "Soil Mechanics", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-212", name: "Structural Mechanics", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-213", name: "Basic Surveying", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-214", name: "Fluid Mechanics", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Fundamentals of Artificial Intelligence", ltp: "2-0-0",
                            credits: 0 }
                    ],
                    4: [
                        { code: "BSM-264", name: "Numerical Methods", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-261", name: "Hydraulics and Hydraulic Machines", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-262", name: "Structural Analysis", ltp: "3-1-0", credits: 4 },
                        { code: "BCE-263", name: "Highway Engineering", ltp: "3-0-2", credits: 4 }
                    ],
                    5: [
                        { code: "BCE-301", name: "Foundation Engineering", ltp: "3-1-0", credits: 4 },
                        { code: "BCE-302", name: "Water and Wastewater Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-303", name: "Design of Concrete Structures", ltp: "3-0-2", credits: 4 },
                        { code: "BHS-303/353", name: "Industrial/Organizational Psychology", ltp: "3-1-0",
                            credits: 4 }
                    ],
                    6: [
                        { code: "BCE-351", name: "Design of Airport, Docks and Harbor", ltp: "3-1-0", credits: 4 },
                        { code: "BCE-352", name: "Construction Technology and Management", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BCE-353", name: "Water Resources Engineering", ltp: "3-1-0", credits: 4 },
                        { code: "BMS-301/351", name: "Principles of Industrial Management", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BCE-371", name: "Minor Project I", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BCE-441", name: "Minor Project- II", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "ICE-490", name: "Industrial Practice (IP)", ltp: "0-0-20", credits: 10 },
                        { code: "ICE-481", name: "Major Project (MP)", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "me": {
                name: "Mechanical Engineering",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics-I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BME-104", name: "Manufacturing Practice Workshop", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics-II", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-131/181", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-103", name: "Programming in C", ltp: "3-0-2", credits: 4 },
                        { code: "BME-157", name: "Engineering Graphics with AutoCAD", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-101/151", name: "Universal Human values: understanding Harmony",
                            ltp: "3-1-0", credits: 4 },
                        { code: "BME-158", name: "Engineering Innovation & Design", ltp: "0-0-2", credits: 0 }
                    ],
                    3: [
                        { code: "BSM-214/264", name: "Numerical Methods", ltp: "3-0-2", credits: 4 },
                        { code: "BME-205", name: "Basics of Mechanical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BME-206", name: "Mechanics of Solids", ltp: "3-0-2", credits: 4 },
                        { code: "BME-207", name: "Material Science and Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BME-208", name: "Theory of Machines", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-102-AUC-115", name: "Value Added Course", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Fundamentals of Artificial Intelligence", ltp: "2-0-0",
                            credits: 0 }
                    ],
                    4: [
                        { code: "BME-256", name: "Software Applications for Mechanical Engineering", ltp: "2-0-4",
                            credits: 4 },
                        { code: "BME-257", name: "Fluid Mechanics & Hydraulic Machines", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BME-258", name: "Metrology and Quality Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BME-259", name: "Energy Conversion Technologies", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 }
                    ],
                    5: [
                        { code: "BME-305", name: "Design of Machine Elements", ltp: "3-0-2", credits: 4 },
                        { code: "BME-306", name: "Heat Transfer", ltp: "3-0-2", credits: 4 },
                        { code: "BME-307", name: "Manufacturing Science and Technology I", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BMS-301", name: "Principles of Industrial Management", ltp: "3-1-0", credits: 4 }
                    ],
                    6: [
                        { code: "BME-354", name: "Refrigeration and Air Conditioning", ltp: "3-0-2", credits: 4 },
                        { code: "BME-355", name: "CAD/CAM", ltp: "3-0-2", credits: 4 },
                        { code: "BME-356", name: "Manufacturing Science and Technology II", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BHS-351", name: "Engineering and Managerial Economics", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BME-390", name: "Minor Project-1", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BME-490", name: "Minor Project-2", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "IME-410", name: "Industrial Practice (IP)", ltp: "0-0-20", credits: 10 },
                        { code: "IME-411", name: "Major Project (MP)", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "chemical": {
                name: "Chemical Engineering",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics - I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-131", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-101", name: "Programming in C", ltp: "3-0-2", credits: 4 },
                        { code: "BME-101", name: "Manufacturing Techniques Workshop", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-101", name: "Universal Human Values", ltp: "3-1-0", credits: 4 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics - II", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-157", name: "Basics of Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BME-157", name: "Engineering Graphics with AutoCAD", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-152", name: "Technical Writing and Professional communication",
                            ltp: "3-0-2", credits: 4 },
                        { code: "BCH-124", name: "Creativity for Chemical Engineers", ltp: "0-0-2", credits: 0 }
                    ],
                    3: [
                        { code: "BPT-085", name: "Biology for Chemical Engineers", ltp: "3-0-2", credits: 4 },
                        { code: "BCH-205", name: "Chemical Engineering Thermodynamics - I", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BCH-206", name: "Process Calculation", ltp: "3-1-0", credits: 4 },
                        { code: "BCH-207", name: "Fluid Flow Operation", ltp: "3-0-2", credits: 4 },
                        { code: "BCH-208", name: "Particulate Technology", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Basics of Artificial Intelligence", ltp: "2-0-0", credits: 0 }
                    ],
                    4: [
                        { code: "BCH-257", name: "Chemical Engineering Thermodynamics - II", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BCH-258", name: "Heat Transfer Operation", ltp: "3-0-2", credits: 4 },
                        { code: "BCH-259", name: "Reaction Engineering - I", ltp: "3-0-2", credits: 4 },
                        { code: "BCH-260", name: "Mass Transfer - I", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-104", name: "Indian Festivals", ltp: "2-0-0", credits: 0 }
                    ],
                    5: [
                        { code: "BCH-305", name: "Chemical Technology", ltp: "3-0-2", credits: 4 },
                        { code: "BCH-306", name: "Reaction Engineering – II", ltp: "3-0-2", credits: 4 },
                        { code: "BCH-307", name: "Mass Transfer – II", ltp: "3-0-2", credits: 4 },
                        { code: "BHS-303", name: "Industrial/Organizational Psychology", ltp: "3-1-0", credits: 4 }
                    ],
                    6: [
                        { code: "BCH-354", name: "Process Equipment Design", ltp: "3-0-2", credits: 4 },
                        { code: "BCH-355", name: "Transport Phenomena", ltp: "3-1-0", credits: 4 },
                        { code: "BCH-356", name: "Process Control & Instrumentation", ltp: "3-0-2", credits: 4 },
                        { code: "BMS-352", name: "Engineering Economics and Financial Management", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BCH-371", name: "Minor Project-1", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BCH-441", name: "Minor Project-2", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "ICH-401", name: "Industrial Practice (IP)", ltp: "0-0-20", credits: 10 },
                        { code: "ICH-481", name: "Major Project (MP)", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "it": {
                name: "Information Technology",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-131/181", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-103/156", name: "Programming in C", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-104", name: "Internet and Web Designing", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-101/151", name: "Universal Human Values: Understanding Harmony",
                            ltp: "3-1-0", credits: 4 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics II", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-154", name: "Object Oriented Programming with C++", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional communication",
                            ltp: "2-1-2", credits: 4 },
                        { code: "BIT-155", name: "AC-1 (Design Thinking) Design Thinking for Software Development",
                            ltp: "0-0-2", credits: 0 }
                    ],
                    3: [
                        { code: "BIT-205", name: "AI Tools and Applications", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-206", name: "Java Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-207", name: "Data Structures", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-208", name: "Computer Organization & Architecture", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-211", name: "Game Theory and Applications", ltp: "3-1-0", credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Fundamentals of Artificial Intelligence", ltp: "2-0-0",
                            credits: 0 }
                    ],
                    4: [
                        { code: "BSM-263", name: "Discrete Mathematics", ltp: "3-1-0", credits: 4 },
                        { code: "BIT-256", name: "Database Management System", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-257", name: "Design & Analysis of Algorithm", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-258", name: "Python Programming", ltp: "3-0-2", credits: 4 }
                    ],
                    5: [
                        { code: "BIT-305", name: "Operating System", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-306", name: "Computer Network", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-307", name: "Strategic AI with Game Theory", ltp: "3-1-0", credits: 4 },
                        { code: "BHS-301/351", name: "Engineering & Managerial Economics", ltp: "3-1-0",
                            credits: 4 }
                    ],
                    6: [
                        { code: "BIT-354", name: "Wireless Sensor Network & IoT", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-355", name: "Cryptography and Cyber Security", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-356", name: "Cloud Computing", ltp: "3-0-2", credits: 4 },
                        { code: "BMS-301/351", name: "Principles of Industrial Management", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BIT-380", name: "Minor Project-1", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BIT-450", name: "Minor Project-2", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "IIT-410", name: "Industrial Practice (IP) (in Industry)", ltp: "0-0-20",
                            credits: 10 },
                        { code: "IIT-411", name: "Major Project (MP) (in University)", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "ee": {
                name: "Electrical Engineering",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-108A", name: "Electrical Wiring & Estimation", ltp: "3-0-2", credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics II", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-181", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-110/160", name: "Introduction to C Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-159", name: "Basics of Electrical Machines & Protective Equipments",
                            ltp: "2-0-4", credits: 4 },
                        { code: "BHS-151", name: "Universal Human Values: Understanding Harmony", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BEE-161", name: "Design Thinking in Electrical Systems", ltp: "0-0-2", credits: 0 }
                    ],
                    3: [
                        { code: "BSM-211", name: "Complex Variables and Numerical Techniques", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BEC-207", name: "Digital Electronics", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-205", name: "Analysis of Linear Systems", ltp: "3-1-0", credits: 4 },
                        { code: "BEE-206", name: "Fundamentals of DC Electrical Machines & Transformers",
                            ltp: "3-0-2", credits: 4 },
                        { code: "BEE-207", name: "Electrical Measurement and Measuring Instruments", ltp: "3-0-2",
                            credits: 4 },
                        { code: "AUC-108", name: "Intellectual Property Right", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Fundamentals of Artificial Intelligence", ltp: "3-1-0",
                            credits: 0 }
                    ],
                    4: [
                        { code: "BME-260", name: "Fundamentals of Mechanical Engineering", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-256", name: "Fundamentals of AC Electrical Machines", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-257", name: "Microprocessor", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-258", name: "Network Analysis & Synthesis", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 }
                    ],
                    5: [
                        { code: "BMS-302/352", name: "Engineering Economics and Financial Management",
                            ltp: "3-1-0", credits: 4 },
                        { code: "BEE-306", name: "Power System-I", ltp: "3-1-0", credits: 4 },
                        { code: "BEE-307", name: "Control System Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-308", name: "Power Electronics", ltp: "3-0-2", credits: 4 }
                    ],
                    6: [
                        { code: "BHS-303/353", name: "Industrial/Organizational Psychology", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BEE-356", name: "Power System-II", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-357", name: "Instrumentation Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-358", name: "Switchgear & Protection", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-381", name: "Minor Project-1", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BEE-481", name: "Minor Project-2", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "IEE-410", name: "Industrial Practice", ltp: "0-0-20", credits: 10 },
                        { code: "IEE-411", name: "Major Project", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "eceiot": {
                name: "ECE (IoT)",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics - I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-106", name: "Electronic Components Testing and Measurement", ltp: "2-0-4",
                            credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics - II", ltp: "3-1-0", credits: 4 },
                        { code: "BSC-131/181", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-110/160", name: "Introduction to C Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-157", name: "Electronic Workshop", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-101/151", name: "Universal Human Values (UHV)", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-170", name: "Design Thinking in Electronics & Communication Engineering",
                            ltp: "0-0-2", credits: 0 }
                    ],
                    3: [
                        { code: "BSM-216", name: "Applied Probability and Statistics", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-207", name: "Digital Electronics", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-208", name: "Network Theory: Analysis & Synthesis", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-209", name: "Electronic Measurement & Instrumentation", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEC-210", name: "Electronic Devices & Circuits Theory", ltp: "3-1-0", credits: 4 },
                        { code: "AUC-108", name: "Intellectual Property Right", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Fundamentals of Artificial Intelligence", ltp: "2-0-0",
                            credits: 0 }
                    ],
                    4: [
                        { code: "BEC-259", name: "Electromagnetic Field Theory", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-260", name: "Signal & System", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-261", name: "Microprocessor and Applications", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-263", name: "Introduction to Arduino Uno Programming", ltp: "3-0-2",
                            credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 }
                    ],
                    5: [
                        { code: "BEC-313", name: "Embedded System Design", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-314", name: "Analog and digital Circuit Design", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-315", name: "Introduction to Raspberry Pi Programming", ltp: "2-0-4",
                            credits: 4 },
                        { code: "BMS-301", name: "Principles of Industrial Management", ltp: "3-1-0", credits: 4 }
                    ],
                    6: [
                        { code: "BEC-360", name: "Digital Communication System", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-361", name: "Introduction to VLSI", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-362", name: "Introduction to Deep Learning", ltp: "3-0-2", credits: 4 },
                        { code: "BHS-301/351", name: "Engineering and Managerial Economics", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BEC-451", name: "Minor Project-1", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BEC-452", name: "Minor Project-2", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "IEC-417", name: "Industrial Practice (IP)", ltp: "0-0-20", credits: 10 },
                        { code: "IEC-418", name: "Major Project (MP)", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "bba": {
                name: "BBA",
                semesters: {
                    1: [
                        { code: "BBA-114", name: "Financial Accounting", ltp: "3-0-0", credits: 3 },
                        { code: "BBA-115", name: "Principles & Practices of Management", ltp: "3-0-0", credits: 3 },
                        { code: "BBA-116", name: "Quantitative Techniques for Business Research", ltp: "3-0-0",
                            credits: 3 },
                        { code: "BBA-A01", name: "Business Communication for Managers", ltp: "2-0-0", credits: 2 },
                        { code: "BHM-121", name: "Industrial Psychology / IPR", ltp: "2-0-0", credits: 2 },
                        { code: "AUC-108", name: "Ability / Value Added Course", ltp: "2-0-0", credits: 2 }
                    ],
                    2: [
                        { code: "BSM-110", name: "Engineering Mathematics I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-110/160", name: "Introduction to C Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 }
                    ]
                }
            },
            "bpharm": {
                name: "B.Pharm",
                semesters: {
                    1: [
                        { code: "BPT101T", name: "Human Anatomy, Physiology & Pathophysiology I", ltp: "3-0-0",
                            credits: 3 },
                        { code: "BPT102T", name: "Introduction to Pharmacognosy", ltp: "3-0-0", credits: 3 },
                        { code: "BPT103T", name: "Pharmaceutical Inorganic & Analytical Chemistry", ltp: "3-0-0",
                            credits: 3 },
                        { code: "BPT104T", name: "Basics of Python Programming", ltp: "2-0-0", credits: 2 },
                        { code: "BPT105T", name: "General Pharmacy", ltp: "2-0-0", credits: 2 },
                        { code: "BPT106T", name: "Healthcare Psychology & Communication Skills", ltp: "2-0-0",
                            credits: 2 },
                        { code: "BPT107P", name: "Pharmacognosy (Practical)", ltp: "0-0-2", credits: 1 },
                        { code: "BPT108P", name: "Inorganic & Analytical Chemistry (Practical)", ltp: "0-0-2",
                            credits: 1 },
                        { code: "BPT109P", name: "General Pharmacy (Practical)", ltp: "0-0-2", credits: 1 },
                        { code: "BPT110P", name: "Healthcare Psychology (Practical)", ltp: "0-0-2", credits: 1 },
                        { code: "BPT111P", name: "Anatomy & Physiology (Practical)", ltp: "0-0-2", credits: 1 }
                    ],
                    2: [
                        { code: "BSM-110", name: "Engineering Mathematics I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-110/160", name: "Introduction to C Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 }
                    ]
                }
            }
        };


const LEDGER_DATA = {"civil":{"name":"Civil Engineering","semesters":{"1":[{"code":"BSM-110","name":"Engineering Mathematics I","ltp":"3-1-0","credits":4,"d":"BSM 110"},{"code":"BSM-131/181","name":"Engineering Physics","ltp":"3-0-2","credits":4,"d":"BSM 131/181"},{"code":"BIT-103","name":"Programming in C","ltp":"3-0-2","credits":4,"d":"BIT 103"},{"code":"BCE-121","name":"Engineering Graphics","ltp":"2-0-4","credits":4,"d":"BCE 121"},{"code":"BHS-101/151","name":"Universal Human Values","ltp":"3-1-0","credits":4,"d":"BHS 101/151"}],"2":[{"code":"BSM-160","name":"Engineering Mathematics II","ltp":"3-1-0","credits":4,"d":"BSM 160"},{"code":"BSM-140/190","name":"Environmental Science and Green Chemistry","ltp":"3-0-2","credits":4,"d":"BSM 140/BSM 190"},{"code":"BEE-107/157","name":"Basic Electrical Engineering","ltp":"3-0-2","credits":4,"d":"BEE 107/157"},{"code":"BCE-161","name":"Building Planning and Drawing","ltp":"2-0-4","credits":4,"d":"BCE 161"},{"code":"BHS-102/152","name":"Technical Writing and Professional Communication","ltp":"2-1-2","credits":4,"d":"BHS 102/152"},{"code":"BCE-162","name":"Design Thinking in Civil Engineering","ltp":"0-0-2","credits":0,"d":"BCE 162"}],"3":[{"code":"BCE-210","name":"Civil Engineering Materials, Evaluation and Testing","ltp":"3-0-2","credits":4,"d":"BCE 210"},{"code":"BCE-211","name":"Soil Mechanics","ltp":"3-0-2","credits":4,"d":"BCE 211"},{"code":"BCE-212","name":"Structural Mechanics","ltp":"3-0-2","credits":4,"d":"BCE 212"},{"code":"BCE-213","name":"Basic Surveying","ltp":"3-0-2","credits":4,"d":"BCE 213"},{"code":"BCE-214","name":"Fluid Mechanics","ltp":"3-0-2","credits":4,"d":"BCE 214"},{"code":"AUC-101","name":"Constitution of India","ltp":"2-0-0","credits":0,"d":"AUC 101"},{"code":"AUC-119","name":"Fundamentals of Artificial Intelligence","ltp":"2-0-0","credits":0,"d":"AUC 119"}],"4":[{"code":"BSM-264","name":"Numerical Methods","ltp":"3-0-2","credits":4,"d":"BSM 264"},{"code":"BCE-261","name":"Hydraulics and Hydraulic Machines","ltp":"3-0-2","credits":4,"d":"BCE 261"},{"code":"BCE-262","name":"Structural Analysis","ltp":"3-1-0","credits":4,"d":"BCE 262"},{"code":"BCE-263","name":"Highway Engineering","ltp":"3-0-2","credits":4,"d":"BCE 263"}],"5":[{"code":"BCE-301","name":"Foundation Engineering","ltp":"3-1-0","credits":4,"d":"BCE 301"},{"code":"BCE-302","name":"Water and Wastewater Engineering","ltp":"3-0-2","credits":4,"d":"BCE 302"},{"code":"BCE-303","name":"Design of Concrete Structures","ltp":"3-0-2","credits":4,"d":"BCE 303"},{"code":"BHS-303/353","name":"Industrial/Organizational Psychology","ltp":"3-1-0","credits":4,"d":"BHS 303/353"}],"6":[{"code":"BCE-351","name":"Design of Airport, Docks and Harbor","ltp":"3-1-0","credits":4,"d":"BCE 351"},{"code":"BCE-352","name":"Construction Technology and Management","ltp":"3-1-0","credits":4,"d":"BCE 352"},{"code":"BCE-353","name":"Water Resources Engineering","ltp":"3-1-0","credits":4,"d":"BCE 353"},{"code":"BMS-301/351","name":"Principles of Industrial Management","ltp":"3-1-0","credits":4,"d":"BMS-301/351"},{"code":"BCE-371","name":"Minor Project I","ltp":"0-0-0","credits":0}],"7":[{"code":"BCE-441","name":"Minor Project- II","ltp":"0-0-12","credits":6}],"8":[{"code":"ICE-490","name":"Industrial Practice (IP)","ltp":"0-0-20","credits":10},{"code":"ICE-481","name":"Major Project (MP)","ltp":"0-0-20","credits":10}]},"extras":[{"id":"pe","label":"Electives","groups":[{"title":"Professional Elective 1","subjects":[{"code":"ECE 101","name":"Matrix Method of Analysis","ltp":"3-1-0","credits":4,"d":"ECE 101"},{"code":"ECE 102","name":"Geotechnical Investigations And Field Testing Of Soil","ltp":"3-1-0","credits":4,"d":"ECE 102"},{"code":"ECE 103","name":"Global Warming And Climate Change","ltp":"3-1-0","credits":4,"d":"ECE 103"},{"code":"ECE 104","name":"Principle Of Highway Engineering","ltp":"3-1-0","credits":4,"d":"ECE 104"},{"code":"ECE 105","name":"Engineering Hydrology","ltp":"","credits":4,"d":"ECE 105"},{"code":"ECE 106","name":"Geographic Information System","ltp":"3-1-0","credits":4,"d":"ECE 106"}]},{"title":"Professional Elective 2","subjects":[{"code":"ECE 201","name":"Prestressed Concrete","ltp":"3-1-0","credits":4,"d":"ECE 201"},{"code":"ECE 202","name":"Rock Mechanics","ltp":"3-1-0","credits":4,"d":"ECE 202"},{"code":"ECE 203","name":"Environmental Chemistryand Microbiology","ltp":"3-1-0","credits":4,"d":"ECE 203"},{"code":"ECE 204","name":"Traffic Engineering","ltp":"3-1-0","credits":4,"d":"ECE 204"}]},{"title":"Professional Elective 3","subjects":[{"code":"ECE 301","name":"Structural Dynamics","ltp":"3-1-0","credits":4,"d":"ECE 301"},{"code":"ECE 302","name":"Ground Improvement Techniques","ltp":"3-1-0","credits":4,"d":"ECE 302"},{"code":"ECE 303","name":"Environmental Planning And Management","ltp":"3-1-0","credits":4,"d":"ECE 303"},{"code":"ECE 304","name":"Railway And Airport Engineering","ltp":"3-1-0","credits":4,"d":"ECE 304"},{"code":"ECE 305","name":"Soil Water Conservation","ltp":"","credits":4,"d":"ECE 305"},{"code":"ECE 306","name":"Principles Of Remote Sensing","ltp":"3-1-0","credits":4,"d":"ECE 306"}]},{"title":"Professional Elective 4","subjects":[{"code":"ECE 401","name":"Design Of Bridges","ltp":"","credits":4,"d":"ECE 401"},{"code":"ECE 402","name":"Geosynthetics Engineering","ltp":"3-1-0","credits":4,"d":"ECE 402"},{"code":"ECE 403","name":"Disaster Management","ltp":"3-1-0","credits":4,"d":"ECE 403"},{"code":"ECE 404","name":"Pavement Analysis And Design","ltp":"3-1-0","credits":4,"d":"ECE 404"},{"code":"ECE 405","name":"Advanced Fluid Mechanics","ltp":"3-1-0","credits":4,"d":"ECE 405"}]},{"title":"Professional Elective 5","subjects":[{"code":"ECE 501","name":"Repair And Retrofitting Of Structures","ltp":"3-1-0","credits":4,"d":"ECE 501"},{"code":"ECE 502","name":"Geotechnical Earthquake Engineering","ltp":"3-1-0","credits":4,"d":"ECE 502"},{"code":"ECE 503","name":"Environmental Laws And Policy","ltp":"3-1-0","credits":4,"d":"ECE 503"},{"code":"ECE 504","name":"Highway Geometric Design","ltp":"3-1-0","credits":4,"d":"ECE 504"},{"code":"ECE 505","name":"Open Channel Hydraulics","ltp":"3-1-0","credits":4,"d":"ECE 505"},{"code":"ECE 506","name":"Groundwater Hydrology","ltp":"3-1-0","credits":4,"d":"ECE 506"}]},{"title":"Professional Elective 6","subjects":[{"code":"ECE 601","name":"Steel Structures","ltp":"3-1-0","credits":4,"d":"ECE 601"},{"code":"ECE 602","name":"Tunnel Engineering","ltp":"3-1-0","credits":4,"d":"ECE 602"},{"code":"ECE 603","name":"Analysis And Design Of Water Distribution Systems","ltp":"3-1-0","credits":4,"d":"ECE 603"},{"code":"ECE 604","name":"Urban Transportation System Planning","ltp":"3-1-0","credits":4,"d":"ECE 604"},{"code":"ECE 605","name":"Analysis And Design Of Hydraulic Structures","ltp":"3-1-0","credits":4,"d":"ECE 605"}]},{"title":"Professional Elective 7","subjects":[{"code":"ECE 701","name":"Advance Concrete Technology","ltp":"3-1-0","credits":4,"d":"ECE 701"},{"code":"ECE 702","name":"Earth And Earth Retaining Structures","ltp":"3-1-0","credits":4,"d":"ECE 702"},{"code":"ECE 703","name":"Environmental Change And Sustainable Development","ltp":"3-1-0","credits":4,"d":"ECE 703"},{"code":"ECE 704","name":"Intelligent Transportation System","ltp":"3-1-0","credits":4,"d":"ECE 704"},{"code":"ECE 705","name":"Water Resources Management","ltp":"3-1-0","credits":4,"d":"ECE 705"},{"code":"ECE 706","name":"Application Of Machine Learning In Civil Engineering","ltp":"3-1-0","credits":4,"d":"ECE 706"}]},{"title":"Professional Elective 8","subjects":[{"code":"ECE 801","name":"Design Of Masonry Structures","ltp":"3-1-0","credits":4,"d":"ECE 801"},{"code":"ECE 802","name":"Advanced Foundation Engineering","ltp":"3-1-0","credits":4,"d":"ECE 802"},{"code":"ECE 803","name":"Environmental Impact Assessment","ltp":"3-1-0","credits":4,"d":"ECE 803"},{"code":"ECE 804","name":"Planning, Design And Construction Of Rural Roads","ltp":"3-1-0","credits":4,"d":"ECE 804"},{"code":"ECE 805","name":"Urban Stormwater Management","ltp":"3-1-0","credits":4,"d":"ECE 805"}]},{"title":"Professional Elective 9","subjects":[{"code":"ECE 901","name":"Seismic Design Of Structures","ltp":"3-1-0","credits":4,"d":"ECE 901"},{"code":"ECE 902","name":"Foundation On Expansive Soil","ltp":"3-1-0","credits":4,"d":"ECE 902"},{"code":"ECE 903","name":"Environmental Data Science And Analytics","ltp":"3-1-0","credits":4,"d":"ECE 903"},{"code":"ECE 904","name":"Pavement Evaluation, Rehabilitation And Maintenance","ltp":"3-1-0","credits":4,"d":"ECE 904"},{"code":"ECE 905","name":"Geoinformatics For Water Resources","ltp":"3-1-0","credits":4,"d":"ECE 905"}]}]},{"id":"skill","label":"Skill","groups":[{"title":"Skill-based and enhancement courses","subjects":[{"code":"BCE 163","name":"Plumbing And Sanitation","ltp":"2-0-2","credits":3,"d":"BCE 163"},{"code":"BCE 164","name":"Computer Aided Drafting","ltp":"2-0-2","credits":3,"d":"BCE 164"},{"code":"BCE 165","name":"Carpentry And Fabrication","ltp":"","credits":3,"d":"BCE 165"},{"code":"BCE 264","name":"Introduction To Remote Sensing And Gis","ltp":"","credits":4,"d":"BCE 264"},{"code":"BCE 265","name":"Analysis And Design Of Water Distribution Systems","ltp":"","credits":4,"d":"BCE 265"},{"code":"BCE 266","name":"Geotechnical Exploration And Instrumentation","ltp":"3-0-2","credits":4,"d":"BCE 266"},{"code":"BCE 357","name":"Pavement Design Using Softwares","ltp":"2-0-2","credits":3,"d":"BCE 357"},{"code":"BCE 358","name":"Software Application For Building Design","ltp":"2-0-2","credits":3,"d":"BCE 358"},{"code":"BCE 359","name":"Software Applications In Geotechnical Engineering","ltp":"2-0-2","credits":3,"d":"BCE 359"}]},{"title":"Other core courses in the syllabus book","subjects":[{"code":"BCE 354","name":"Advanced Surveying","ltp":"3-0-2","credits":4,"d":"BCE 354"}]}]},{"id":"audit","label":"Audit","groups":[{"title":"Audit, value-added and Indian Knowledge System courses","subjects":[{"code":"AUC 102","name":"Indian Culture and Heritage","ltp":"","credits":0,"d":"AUC 102"},{"code":"AUC 103","name":"Indian Architecture","ltp":"","credits":0,"d":"AUC 103"},{"code":"AUC 105","name":"Vaidic Mathemeatics","ltp":"","credits":0,"d":"AUC 105"},{"code":"AUC 106","name":"Astronomy","ltp":"","credits":0,"d":"AUC 106"},{"code":"AUC 107","name":"Arts Of India","ltp":"","credits":0,"d":"AUC 107"},{"code":"AUC 109","name":"Human Rights","ltp":"","credits":0,"d":"AUC 109"},{"code":"AUC 110","name":"Logical Research","ltp":"","credits":0,"d":"AUC 110"},{"code":"AUC 111","name":"Professional Ethics","ltp":"","credits":0,"d":"AUC 111"},{"code":"AUC 112","name":"Environmental Laws","ltp":"","credits":0,"d":"AUC 112"},{"code":"AUC 113","name":"Health Law","ltp":"","credits":0,"d":"AUC 113"},{"code":"AUC 114","name":"National Cadet Corps (NCC)","ltp":"","credits":0,"d":"AUC 114"},{"code":"AUC 115","name":"Basics of Human Health and Preventive Medicines","ltp":"","credits":0,"d":"AUC 115"},{"code":"AUC 116","name":"Administration And Adjudication","ltp":"","credits":0,"d":"AUC 116"},{"code":"AUC 117","name":"Constitutional Imperative","ltp":"","credits":0,"d":"AUC 117"},{"code":"AUC 118","name":"Technologists","ltp":"","credits":0,"d":"AUC 118"},{"code":"IKS 101","name":"Indian Knowledge Through Classical Languages","ltp":"","credits":0,"d":"IKS 101"},{"code":"IKS 102","name":"Indian Knowledge System: Concepts And Applications In Science","ltp":"","credits":0,"d":"IKS 102"},{"code":"IKS 103","name":"Indian Knowledge System: Concepts And Applications In Engineering","ltp":"","credits":0,"d":"IKS 103"},{"code":"IKS 104","name":"Indian Knowledge System","ltp":"","credits":0,"d":"IKS 104"}]}]}]},"cse":{"name":"Computer Science & Engineering","semesters":{"1":[{"code":"BSM-110","name":"Engineering Mathematics I","ltp":"3-1-0","credits":4,"d":"BSM 110"},{"code":"BSM-131/181","name":"Engineering Physics","ltp":"3-0-2","credits":4,"d":"BSM 131/181"},{"code":"BCS-110/160","name":"Introduction to C Programming","ltp":"3-0-2","credits":4},{"code":"BCS-111","name":"Web Designing-1","ltp":"2-0-4","credits":4},{"code":"BHS-101/151","name":"Universal Human Values: Understanding Harmony","ltp":"3-1-0","credits":4,"d":"BHS 101/151"},{"code":"ECA-I","name":"Induction Program","ltp":"0-0-0","credits":0}],"2":[{"code":"BSM-160","name":"Engineering Mathematics II","ltp":"3-1-0","credits":4,"d":"BSM 160"},{"code":"BSM-140/190","name":"Environmental Science and Green Chemistry","ltp":"3-0-2","credits":4,"d":"BSM 140/BSM 190"},{"code":"BEE-110/160","name":"Basic Electrical Engineering","ltp":"3-0-2","credits":4},{"code":"BCS-161","name":"Web Designing-2","ltp":"2-0-4","credits":4},{"code":"BHS-102/152","name":"Technical Writing and Professional Communication","ltp":"2-1-2","credits":4,"d":"BHS 102/152"},{"code":"BCS-162","name":"Design Thinking in Information & Understanding","ltp":"0-0-2","credits":0}],"3":[{"code":"BCS-210A","name":"Discrete Structure","ltp":"3-1-0","credits":4},{"code":"BCS-211","name":"Digital Logic and Design","ltp":"3-0-2","credits":4},{"code":"BCS-212A","name":"Object Oriented Programming through JAVA","ltp":"3-0-2","credits":4},{"code":"BCS-213","name":"Theory of Computation","ltp":"3-1-0","credits":4},{"code":"BCS-214","name":"Principles of Data Structures","ltp":"3-0-2","credits":4},{"code":"AUC-101","name":"Constitution of India","ltp":"2-0-0","credits":0,"d":"AUC 101"},{"code":"AUC-119","name":"Fundamentals of Artificial Intelligence","ltp":"2-0-0","credits":0,"d":"AUC 119"}],"4":[{"code":"BSM-212/262","name":"Operational Research","ltp":"3-1-0","credits":4},{"code":"BCS-261","name":"Design & Analysis of Algorithms","ltp":"3-0-2","credits":4},{"code":"BCS-262","name":"Computer Organization and Architecture","ltp":"3-0-2","credits":4},{"code":"BCS-263","name":"Database Management Systems","ltp":"3-0-2","credits":4}],"5":[{"code":"BHS-301/351","name":"Engineering and Managerial Economics","ltp":"3-1-0","credits":4,"d":"BHS 301/351"},{"code":"BCS-305","name":"Principles of Operating Systems","ltp":"3-0-2","credits":4},{"code":"BCS-306","name":"Principles of Compiler Design","ltp":"3-0-2","credits":4},{"code":"BCS-307","name":"Computer Networks","ltp":"3-0-2","credits":4}],"6":[{"code":"BMS-301/351","name":"Principles Of Industrial Management","ltp":"3-1-0","credits":4,"d":"BMS-301/351"},{"code":"BCS-355","name":"Software Engineering","ltp":"3-0-2","credits":4},{"code":"BCS-361","name":"Image and Video Processing","ltp":"3-0-2","credits":4},{"code":"BCS-356","name":"Parallel & Distributed Programming","ltp":"3-0-2","credits":4},{"code":"BCS-371","name":"Minor Project-I","ltp":"0-0-0","credits":0}],"7":[{"code":"BCS-441","name":"Minor Project-II","ltp":"0-0-12","credits":6}],"8":[{"code":"ICS-444","name":"Industrial Practice (IP)","ltp":"0-0-20","credits":10},{"code":"ICS-481","name":"Major Project (MP)","ltp":"0-0-20","credits":10}]}},"it":{"name":"Information Technology","semesters":{"1":[{"code":"BSM-110","name":"Engineering Mathematics I","ltp":"3-1-0","credits":4,"d":"BSM 110"},{"code":"BSM-131/181","name":"Engineering Physics","ltp":"3-0-2","credits":4,"d":"BSM 131/181"},{"code":"BIT-103/156","name":"Programming in C","ltp":"3-0-2","credits":4,"d":"BIT 103"},{"code":"BIT-104","name":"Internet and Web Designing","ltp":"2-0-4","credits":4},{"code":"BHS-101/151","name":"Universal Human Values: Understanding Harmony","ltp":"3-1-0","credits":4,"d":"BHS 101/151"}],"2":[{"code":"BSM-160","name":"Engineering Mathematics II","ltp":"3-1-0","credits":4,"d":"BSM 160"},{"code":"BSM-140/190","name":"Environmental Science and Green Chemistry","ltp":"3-0-2","credits":4,"d":"BSM 140/BSM 190"},{"code":"BEE-110/160","name":"Basic Electrical Engineering","ltp":"3-0-2","credits":4},{"code":"BIT-154","name":"Object Oriented Programming with C++","ltp":"2-0-4","credits":4},{"code":"BHS-102/152","name":"Technical Writing and Professional communication","ltp":"2-1-2","credits":4,"d":"BHS 102/152"},{"code":"BIT-155","name":"AC-1 (Design Thinking) Design Thinking for Software Development","ltp":"0-0-2","credits":0}],"3":[{"code":"BIT-205","name":"AI Tools and Applications","ltp":"3-0-2","credits":4},{"code":"BIT-206","name":"Java Programming","ltp":"3-0-2","credits":4},{"code":"BIT-207","name":"Data Structures","ltp":"3-0-2","credits":4},{"code":"BIT-208","name":"Computer Organization & Architecture","ltp":"3-0-2","credits":4},{"code":"BIT-211","name":"Game Theory and Applications","ltp":"3-1-0","credits":4},{"code":"AUC-101","name":"Constitution of India","ltp":"2-0-0","credits":0,"d":"AUC 101"},{"code":"AUC-119","name":"Fundamentals of Artificial Intelligence","ltp":"2-0-0","credits":0,"d":"AUC 119"}],"4":[{"code":"BSM-263","name":"Discrete Mathematics","ltp":"3-1-0","credits":4},{"code":"BIT-256","name":"Database Management System","ltp":"3-0-2","credits":4},{"code":"BIT-257","name":"Design & Analysis of Algorithm","ltp":"3-0-2","credits":4},{"code":"BIT-258","name":"Python Programming","ltp":"3-0-2","credits":4}],"5":[{"code":"BIT-305","name":"Operating System","ltp":"3-0-2","credits":4},{"code":"BIT-306","name":"Computer Network","ltp":"3-0-2","credits":4},{"code":"BIT-307","name":"Strategic AI with Game Theory","ltp":"3-1-0","credits":4},{"code":"BHS-301/351","name":"Engineering & Managerial Economics","ltp":"3-1-0","credits":4,"d":"BHS 301/351"}],"6":[{"code":"BIT-354","name":"Wireless Sensor Network & IoT","ltp":"3-0-2","credits":4},{"code":"BIT-355","name":"Cryptography and Cyber Security","ltp":"3-0-2","credits":4},{"code":"BIT-356","name":"Cloud Computing","ltp":"3-0-2","credits":4},{"code":"BMS-301/351","name":"Principles of Industrial Management","ltp":"3-1-0","credits":4,"d":"BMS-301/351"},{"code":"BIT-380","name":"Minor Project-1","ltp":"0-0-0","credits":0}],"7":[{"code":"BIT-450","name":"Minor Project-2","ltp":"0-0-12","credits":6}],"8":[{"code":"IIT-410","name":"Industrial Practice (IP) (in Industry)","ltp":"0-0-20","credits":10},{"code":"IIT-411","name":"Major Project (MP) (in University)","ltp":"0-0-20","credits":10}]}},"ece":{"name":"Electronics & Communication Engineering","semesters":{"1":[{"code":"BSM-110","name":"Engineering Mathematics I","ltp":"3-1-0","credits":4,"d":"BSM 110"},{"code":"BSM-140/190","name":"Environmental Science and Green Chemistry","ltp":"3-0-2","credits":4,"d":"BSM 140/BSM 190"},{"code":"BEE-110/160","name":"Basic Electrical Engineering","ltp":"3-0-2","credits":4},{"code":"BEC-106","name":"Electronic Components Testing and Measurement","ltp":"2-0-4","credits":4},{"code":"BHS-102/152","name":"Technical Writing and Professional Communication","ltp":"2-1-2","credits":4,"d":"BHS 102/152"}],"2":[{"code":"BSM-160","name":"Engineering Mathematics II","ltp":"3-1-0","credits":4,"d":"BSM 160"},{"code":"BEC-131/181","name":"Engineering Physics","ltp":"3-0-2","credits":4},{"code":"BCS-110/160","name":"Introduction to C Programming","ltp":"3-0-2","credits":4},{"code":"BEC-157","name":"Electronic Workshop","ltp":"2-0-4","credits":4},{"code":"BHS-101/151","name":"Universal Human Values","ltp":"3-1-0","credits":4,"d":"BHS 101/151"},{"code":"BEC-170","name":"Design Thinking in Electronics & Communication Engineering","ltp":"0-0-2","credits":0}],"3":[{"code":"BSM-216","name":"Applied Probability and Statistics","ltp":"3-1-0","credits":4},{"code":"BEC-207","name":"Digital Electronics","ltp":"3-0-2","credits":4},{"code":"BEC-208","name":"Network Theory: Analysis & Synthesis","ltp":"3-1-0","credits":4},{"code":"BEC-209","name":"Electronic Measurement & Instrumentation","ltp":"3-0-2","credits":4},{"code":"BEC-210","name":"Electronic Devices & Circuits Theory","ltp":"3-1-0","credits":4},{"code":"AUC-101","name":"Constitution of India","ltp":"2-0-0","credits":0,"d":"AUC 101"},{"code":"AUC-119","name":"Fundamentals of Artificial Intelligence","ltp":"2-0-0","credits":0,"d":"AUC 119"}],"4":[{"code":"BEC-259","name":"Electromagnetic Field Theory","ltp":"3-1-0","credits":4},{"code":"BEC-260","name":"Signal & Systems","ltp":"3-1-0","credits":4},{"code":"BEC-261","name":"Microprocessor and Applications","ltp":"3-0-2","credits":4},{"code":"BEC-262","name":"Analog Integrated Circuits","ltp":"3-0-2","credits":4},{"code":"AUC-108","name":"Intellectual Property Right","ltp":"2-0-0","credits":0,"d":"AUC 108"}],"5":[{"code":"BEC-309","name":"Microwave Theory & Techniques","ltp":"3-0-2","credits":4},{"code":"BEC-310","name":"Modern Control Systems","ltp":"3-1-0","credits":4},{"code":"BEC-311","name":"Analog & Digital Communication","ltp":"3-0-2","credits":4},{"code":"BMS-301","name":"Principles of Industrial Management","ltp":"3-1-0","credits":4,"d":"BMS-301/351"}],"6":[{"code":"BEC-357","name":"Embedded System and Microcontroller","ltp":"3-1-0","credits":4},{"code":"BEC-358","name":"Optical and Wireless Communication","ltp":"3-0-2","credits":4},{"code":"BEC-359","name":"Digital Signal Processing","ltp":"3-0-2","credits":4},{"code":"BHS-301/351","name":"Engineering and Managerial Economics","ltp":"3-1-0","credits":4,"d":"BHS 301/351"},{"code":"BEC-441","name":"Minor Project-1","ltp":"0-0-0","credits":0}],"7":[{"code":"BEC-442","name":"Minor Project-2","ltp":"0-0-12","credits":6}],"8":[{"code":"IEC-415","name":"Industrial Practice (IP)","ltp":"0-0-20","credits":10},{"code":"IEC-416","name":"Major Project (MP)","ltp":"0-0-20","credits":10}]}},"eceiot":{"name":"ECE (IoT)","semesters":{"1":[{"code":"BSM-110","name":"Engineering Mathematics - I","ltp":"3-1-0","credits":4,"d":"BSM 110"},{"code":"BSM-140/190","name":"Environmental Science and Green Chemistry","ltp":"3-0-2","credits":4,"d":"BSM 140/BSM 190"},{"code":"BEE-110/160","name":"Basic Electrical Engineering","ltp":"3-0-2","credits":4},{"code":"BEC-106","name":"Electronic Components Testing and Measurement","ltp":"2-0-4","credits":4},{"code":"BHS-102/152","name":"Technical Writing and Professional Communication","ltp":"2-1-2","credits":4,"d":"BHS 102/152"}],"2":[{"code":"BSM-160","name":"Engineering Mathematics - II","ltp":"3-1-0","credits":4,"d":"BSM 160"},{"code":"BSC-131/181","name":"Engineering Physics","ltp":"3-0-2","credits":4},{"code":"BCS-110/160","name":"Introduction to C Programming","ltp":"3-0-2","credits":4},{"code":"BEC-157","name":"Electronic Workshop","ltp":"2-0-4","credits":4},{"code":"BHS-101/151","name":"Universal Human Values (UHV)","ltp":"3-1-0","credits":4,"d":"BHS 101/151"},{"code":"BEC-170","name":"Design Thinking in Electronics & Communication Engineering","ltp":"0-0-2","credits":0}],"3":[{"code":"BSM-216","name":"Applied Probability and Statistics","ltp":"3-1-0","credits":4},{"code":"BEC-207","name":"Digital Electronics","ltp":"3-0-2","credits":4},{"code":"BEC-208","name":"Network Theory: Analysis & Synthesis","ltp":"3-1-0","credits":4},{"code":"BEC-209","name":"Electronic Measurement & Instrumentation","ltp":"3-0-2","credits":4},{"code":"BEC-210","name":"Electronic Devices & Circuits Theory","ltp":"3-1-0","credits":4},{"code":"AUC-108","name":"Intellectual Property Right","ltp":"2-0-0","credits":0,"d":"AUC 108"},{"code":"AUC-119","name":"Fundamentals of Artificial Intelligence","ltp":"2-0-0","credits":0,"d":"AUC 119"}],"4":[{"code":"BEC-259","name":"Electromagnetic Field Theory","ltp":"3-1-0","credits":4},{"code":"BEC-260","name":"Signal & System","ltp":"3-1-0","credits":4},{"code":"BEC-261","name":"Microprocessor and Applications","ltp":"3-0-2","credits":4},{"code":"BEC-263","name":"Introduction to Arduino Uno Programming","ltp":"3-0-2","credits":4},{"code":"AUC-101","name":"Constitution of India","ltp":"2-0-0","credits":0,"d":"AUC 101"}],"5":[{"code":"BEC-313","name":"Embedded System Design","ltp":"3-1-0","credits":4},{"code":"BEC-314","name":"Analog and digital Circuit Design","ltp":"3-0-2","credits":4},{"code":"BEC-315","name":"Introduction to Raspberry Pi Programming","ltp":"2-0-4","credits":4},{"code":"BMS-301","name":"Principles of Industrial Management","ltp":"3-1-0","credits":4,"d":"BMS-301/351"}],"6":[{"code":"BEC-360","name":"Digital Communication System","ltp":"3-0-2","credits":4},{"code":"BEC-361","name":"Introduction to VLSI","ltp":"3-0-2","credits":4},{"code":"BEC-362","name":"Introduction to Deep Learning","ltp":"3-0-2","credits":4},{"code":"BHS-301/351","name":"Engineering and Managerial Economics","ltp":"3-1-0","credits":4,"d":"BHS 301/351"},{"code":"BEC-451","name":"Minor Project-1","ltp":"0-0-0","credits":0}],"7":[{"code":"BEC-452","name":"Minor Project-2","ltp":"0-0-12","credits":6}],"8":[{"code":"IEC-417","name":"Industrial Practice (IP)","ltp":"0-0-20","credits":10},{"code":"IEC-418","name":"Major Project (MP)","ltp":"0-0-20","credits":10}]}},"ee":{"name":"Electrical Engineering","semesters":{"1":[{"code":"BSM-110","name":"Engineering Mathematics I","ltp":"3-1-0","credits":4,"d":"BSM 110"},{"code":"BSM-140","name":"Environmental Science and Green Chemistry","ltp":"3-0-2","credits":4,"d":"BSM 140/BSM 190"},{"code":"BEE-110/160","name":"Basic Electrical Engineering","ltp":"3-0-2","credits":4},{"code":"BEE-108A","name":"Electrical Wiring & Estimation","ltp":"3-0-2","credits":4},{"code":"BHS-102/152","name":"Technical Writing and Professional Communication","ltp":"2-1-2","credits":4,"d":"BHS 102/152"}],"2":[{"code":"BSM-160","name":"Engineering Mathematics II","ltp":"3-1-0","credits":4,"d":"BSM 160"},{"code":"BSM-181","name":"Engineering Physics","ltp":"3-0-2","credits":4,"d":"BSM 131/181"},{"code":"BCS-110/160","name":"Introduction to C Programming","ltp":"3-0-2","credits":4},{"code":"BEE-159","name":"Basics of Electrical Machines & Protective Equipments","ltp":"2-0-4","credits":4},{"code":"BHS-151","name":"Universal Human Values: Understanding Harmony","ltp":"3-1-0","credits":4,"d":"BHS 101/151"},{"code":"BEE-161","name":"Design Thinking in Electrical Systems","ltp":"0-0-2","credits":0}],"3":[{"code":"BSM-211","name":"Complex Variables and Numerical Techniques","ltp":"3-1-0","credits":4},{"code":"BEC-207","name":"Digital Electronics","ltp":"3-0-2","credits":4},{"code":"BEE-205","name":"Analysis of Linear Systems","ltp":"3-1-0","credits":4},{"code":"BEE-206","name":"Fundamentals of DC Electrical Machines & Transformers","ltp":"3-0-2","credits":4},{"code":"BEE-207","name":"Electrical Measurement and Measuring Instruments","ltp":"3-0-2","credits":4},{"code":"AUC-108","name":"Intellectual Property Right","ltp":"2-0-0","credits":0,"d":"AUC 108"},{"code":"AUC-119","name":"Fundamentals of Artificial Intelligence","ltp":"3-1-0","credits":0,"d":"AUC 119"}],"4":[{"code":"BME-260","name":"Fundamentals of Mechanical Engineering","ltp":"3-0-2","credits":4},{"code":"BEE-256","name":"Fundamentals of AC Electrical Machines","ltp":"3-0-2","credits":4},{"code":"BEE-257","name":"Microprocessor","ltp":"3-0-2","credits":4},{"code":"BEE-258","name":"Network Analysis & Synthesis","ltp":"3-0-2","credits":4},{"code":"AUC-101","name":"Constitution of India","ltp":"2-0-0","credits":0,"d":"AUC 101"}],"5":[{"code":"BMS-302/352","name":"Engineering Economics and Financial Management","ltp":"3-1-0","credits":4},{"code":"BEE-306","name":"Power System-I","ltp":"3-1-0","credits":4},{"code":"BEE-307","name":"Control System Engineering","ltp":"3-0-2","credits":4},{"code":"BEE-308","name":"Power Electronics","ltp":"3-0-2","credits":4}],"6":[{"code":"BHS-303/353","name":"Industrial/Organizational Psychology","ltp":"3-1-0","credits":4,"d":"BHS 303/353"},{"code":"BEE-356","name":"Power System-II","ltp":"3-0-2","credits":4},{"code":"BEE-357","name":"Instrumentation Engineering","ltp":"3-0-2","credits":4},{"code":"BEE-358","name":"Switchgear & Protection","ltp":"3-0-2","credits":4},{"code":"BEE-381","name":"Minor Project-1","ltp":"0-0-0","credits":0}],"7":[{"code":"BEE-481","name":"Minor Project-2","ltp":"0-0-12","credits":6}],"8":[{"code":"IEE-410","name":"Industrial Practice","ltp":"0-0-20","credits":10},{"code":"IEE-411","name":"Major Project","ltp":"0-0-20","credits":10}]}},"me":{"name":"Mechanical Engineering","semesters":{"1":[{"code":"BSM-110","name":"Engineering Mathematics-I","ltp":"3-1-0","credits":4,"d":"BSM 110"},{"code":"BSM-140/190","name":"Environmental Science and Green Chemistry","ltp":"3-0-2","credits":4,"d":"BSM 140/BSM 190"},{"code":"BEE-110/160","name":"Basic Electrical Engineering","ltp":"3-0-2","credits":4},{"code":"BME-104","name":"Manufacturing Practice Workshop","ltp":"2-0-4","credits":4},{"code":"BHS-102/152","name":"Technical Writing and Professional Communication","ltp":"2-1-2","credits":4,"d":"BHS 102/152"}],"2":[{"code":"BSM-160","name":"Engineering Mathematics-II","ltp":"3-1-0","credits":4,"d":"BSM 160"},{"code":"BSM-131/181","name":"Engineering Physics","ltp":"3-0-2","credits":4,"d":"BSM 131/181"},{"code":"BIT-103","name":"Programming in C","ltp":"3-0-2","credits":4,"d":"BIT 103"},{"code":"BME-157","name":"Engineering Graphics with AutoCAD","ltp":"2-0-4","credits":4},{"code":"BHS-101/151","name":"Universal Human values: understanding Harmony","ltp":"3-1-0","credits":4,"d":"BHS 101/151"},{"code":"BME-158","name":"Engineering Innovation & Design","ltp":"0-0-2","credits":0}],"3":[{"code":"BSM-214/264","name":"Numerical Methods","ltp":"3-0-2","credits":4,"d":"BSM 264"},{"code":"BME-205","name":"Basics of Mechanical Engineering","ltp":"3-0-2","credits":4},{"code":"BME-206","name":"Mechanics of Solids","ltp":"3-0-2","credits":4},{"code":"BME-207","name":"Material Science and Engineering","ltp":"3-0-2","credits":4},{"code":"BME-208","name":"Theory of Machines","ltp":"3-0-2","credits":4},{"code":"AUC-102-AUC-115","name":"Value Added Course","ltp":"2-0-0","credits":0},{"code":"AUC-119","name":"Fundamentals of Artificial Intelligence","ltp":"2-0-0","credits":0,"d":"AUC 119"}],"4":[{"code":"BME-256","name":"Software Applications for Mechanical Engineering","ltp":"2-0-4","credits":4},{"code":"BME-257","name":"Fluid Mechanics & Hydraulic Machines","ltp":"3-0-2","credits":4},{"code":"BME-258","name":"Metrology and Quality Engineering","ltp":"3-0-2","credits":4},{"code":"BME-259","name":"Energy Conversion Technologies","ltp":"3-0-2","credits":4},{"code":"AUC-101","name":"Constitution of India","ltp":"2-0-0","credits":0,"d":"AUC 101"}],"5":[{"code":"BME-305","name":"Design of Machine Elements","ltp":"3-0-2","credits":4},{"code":"BME-306","name":"Heat Transfer","ltp":"3-0-2","credits":4},{"code":"BME-307","name":"Manufacturing Science and Technology I","ltp":"3-0-2","credits":4},{"code":"BMS-301","name":"Principles of Industrial Management","ltp":"3-1-0","credits":4,"d":"BMS-301/351"}],"6":[{"code":"BME-354","name":"Refrigeration and Air Conditioning","ltp":"3-0-2","credits":4},{"code":"BME-355","name":"CAD/CAM","ltp":"3-0-2","credits":4},{"code":"BME-356","name":"Manufacturing Science and Technology II","ltp":"3-0-2","credits":4},{"code":"BHS-351","name":"Engineering and Managerial Economics","ltp":"3-1-0","credits":4,"d":"BHS 301/351"},{"code":"BME-390","name":"Minor Project-1","ltp":"0-0-0","credits":0}],"7":[{"code":"BME-490","name":"Minor Project-2","ltp":"0-0-12","credits":6}],"8":[{"code":"IME-410","name":"Industrial Practice (IP)","ltp":"0-0-20","credits":10},{"code":"IME-411","name":"Major Project (MP)","ltp":"0-0-20","credits":10}]}},"chemical":{"name":"Chemical Engineering","semesters":{"1":[{"code":"BSM-110","name":"Engineering Mathematics - I","ltp":"3-1-0","credits":4,"d":"BSM 110"},{"code":"BSM-131","name":"Engineering Physics","ltp":"3-0-2","credits":4,"d":"BSM 131/181"},{"code":"BIT-101","name":"Programming in C","ltp":"3-0-2","credits":4},{"code":"BME-101","name":"Manufacturing Techniques Workshop","ltp":"2-0-4","credits":4},{"code":"BHS-101","name":"Universal Human Values","ltp":"3-1-0","credits":4,"d":"BHS 101/151"}],"2":[{"code":"BSM-160","name":"Engineering Mathematics - II","ltp":"3-1-0","credits":4,"d":"BSM 160"},{"code":"BSM-190","name":"Environmental Science and Green Chemistry","ltp":"3-0-2","credits":4,"d":"BSM 140/BSM 190"},{"code":"BEE-157","name":"Basics of Electrical Engineering","ltp":"3-0-2","credits":4,"d":"BEE 107/157"},{"code":"BME-157","name":"Engineering Graphics with AutoCAD","ltp":"2-0-4","credits":4},{"code":"BHS-152","name":"Technical Writing and Professional communication","ltp":"3-0-2","credits":4,"d":"BHS 102/152"},{"code":"BCH-124","name":"Creativity for Chemical Engineers","ltp":"0-0-2","credits":0}],"3":[{"code":"BPT-085","name":"Biology for Chemical Engineers","ltp":"3-0-2","credits":4},{"code":"BCH-205","name":"Chemical Engineering Thermodynamics - I","ltp":"3-1-0","credits":4},{"code":"BCH-206","name":"Process Calculation","ltp":"3-1-0","credits":4},{"code":"BCH-207","name":"Fluid Flow Operation","ltp":"3-0-2","credits":4},{"code":"BCH-208","name":"Particulate Technology","ltp":"3-0-2","credits":4},{"code":"AUC-101","name":"Constitution of India","ltp":"2-0-0","credits":0,"d":"AUC 101"},{"code":"AUC-119","name":"Basics of Artificial Intelligence","ltp":"2-0-0","credits":0,"d":"AUC 119"}],"4":[{"code":"BCH-257","name":"Chemical Engineering Thermodynamics - II","ltp":"3-0-2","credits":4},{"code":"BCH-258","name":"Heat Transfer Operation","ltp":"3-0-2","credits":4},{"code":"BCH-259","name":"Reaction Engineering - I","ltp":"3-0-2","credits":4},{"code":"BCH-260","name":"Mass Transfer - I","ltp":"3-0-2","credits":4},{"code":"AUC-104","name":"Indian Festivals","ltp":"2-0-0","credits":0,"d":"AUC 104"}],"5":[{"code":"BCH-305","name":"Chemical Technology","ltp":"3-0-2","credits":4},{"code":"BCH-306","name":"Reaction Engineering – II","ltp":"3-0-2","credits":4},{"code":"BCH-307","name":"Mass Transfer – II","ltp":"3-0-2","credits":4},{"code":"BHS-303","name":"Industrial/Organizational Psychology","ltp":"3-1-0","credits":4,"d":"BHS 303/353"}],"6":[{"code":"BCH-354","name":"Process Equipment Design","ltp":"3-0-2","credits":4},{"code":"BCH-355","name":"Transport Phenomena","ltp":"3-1-0","credits":4},{"code":"BCH-356","name":"Process Control & Instrumentation","ltp":"3-0-2","credits":4},{"code":"BMS-352","name":"Engineering Economics and Financial Management","ltp":"3-1-0","credits":4},{"code":"BCH-371","name":"Minor Project-1","ltp":"0-0-0","credits":0}],"7":[{"code":"BCH-441","name":"Minor Project-2","ltp":"0-0-12","credits":6}],"8":[{"code":"ICH-401","name":"Industrial Practice (IP)","ltp":"0-0-20","credits":10},{"code":"ICH-481","name":"Major Project (MP)","ltp":"0-0-20","credits":10}]}},"bba":{"name":"BBA","semesters":{"1":[{"code":"BBA-114","name":"Financial Accounting","ltp":"3-0-0","credits":3},{"code":"BBA-115","name":"Principles & Practices of Management","ltp":"3-0-0","credits":3},{"code":"BBA-116","name":"Quantitative Techniques for Business Research","ltp":"3-0-0","credits":3},{"code":"BBA-A01","name":"Business Communication for Managers","ltp":"2-0-0","credits":2},{"code":"BHM-121","name":"Industrial Psychology / IPR","ltp":"2-0-0","credits":2},{"code":"AUC-108","name":"Ability / Value Added Course","ltp":"2-0-0","credits":2,"d":"AUC 108"}],"2":[{"code":"BSM-110","name":"Engineering Mathematics I","ltp":"3-1-0","credits":4,"d":"BSM 110"},{"code":"BSM-140/190","name":"Environmental Science and Green Chemistry","ltp":"3-0-2","credits":4,"d":"BSM 140/BSM 190"},{"code":"BEE-110/160","name":"Basic Electrical Engineering","ltp":"3-0-2","credits":4},{"code":"BCS-110/160","name":"Introduction to C Programming","ltp":"3-0-2","credits":4},{"code":"BHS-102/152","name":"Technical Writing and Professional Communication","ltp":"2-1-2","credits":4,"d":"BHS 102/152"}]}},"bpharm":{"name":"B.Pharm","semesters":{"1":[{"code":"BPT101T","name":"Human Anatomy, Physiology & Pathophysiology I","ltp":"3-0-0","credits":3},{"code":"BPT102T","name":"Introduction to Pharmacognosy","ltp":"3-0-0","credits":3},{"code":"BPT103T","name":"Pharmaceutical Inorganic & Analytical Chemistry","ltp":"3-0-0","credits":3},{"code":"BPT104T","name":"Basics of Python Programming","ltp":"2-0-0","credits":2},{"code":"BPT105T","name":"General Pharmacy","ltp":"2-0-0","credits":2},{"code":"BPT106T","name":"Healthcare Psychology & Communication Skills","ltp":"2-0-0","credits":2},{"code":"BPT107P","name":"Pharmacognosy (Practical)","ltp":"0-0-2","credits":1},{"code":"BPT108P","name":"Inorganic & Analytical Chemistry (Practical)","ltp":"0-0-2","credits":1},{"code":"BPT109P","name":"General Pharmacy (Practical)","ltp":"0-0-2","credits":1},{"code":"BPT110P","name":"Healthcare Psychology (Practical)","ltp":"0-0-2","credits":1},{"code":"BPT111P","name":"Anatomy & Physiology (Practical)","ltp":"0-0-2","credits":1}],"2":[{"code":"BSM-110","name":"Engineering Mathematics I","ltp":"3-1-0","credits":4,"d":"BSM 110"},{"code":"BSM-140/190","name":"Environmental Science and Green Chemistry","ltp":"3-0-2","credits":4,"d":"BSM 140/BSM 190"},{"code":"BEE-110/160","name":"Basic Electrical Engineering","ltp":"3-0-2","credits":4},{"code":"BCS-110/160","name":"Introduction to C Programming","ltp":"3-0-2","credits":4},{"code":"BHS-102/152","name":"Technical Writing and Professional Communication","ltp":"2-1-2","credits":4,"d":"BHS 102/152"}]}}};

const LEDGER_DETAIL = {"BSM 110":{"n":"Engineering Mathematics I","c":"Basic Sciences & Maths (BSM)","p":"NIL","k":"Lecture: 3, Tutorial: 1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, methods quizzes and one Minor tests and One Major Theory Examination","o":"The course is aimed to develop the basic mathematical skills of engineering students that are imperative for effective understanding of engineering subjects.","co":["Solve linear system of equations using matrix algebra.","Know about qualitative applications of Gauss, Stoke’s and Green’s theorem.","Use of basic differential operators in various engineering problems.","Understand the concepts of limit theory and nth order differential equations and their applications to our daily life","To know the applications of double and triple integration in finding the area and volume.","To inculcate the habit of mathematical thinking and lifelong learning."],"u":[{"l":"I","t":"Differential Calculus","h":9,"p":["Limit","Continuity and Differentiability","Mean value theorems","Leibnitz theorem","Partial derivatives","Euler’s theorem for homogenous function","Total derivative","Change of variable","Taylor’s and Maclaurin’s theorem","Expansion of function of two variables","Jacobian","Extrema of function of several variables"]},{"l":"II","t":"Linear Algebra","h":9,"p":["Symmetric","Skew-symmetric matrices","Hermitian","Skew Hermitian Matrices","orthogonal and unitary matrices and basic properties","linear independence and dependence of vectors","Rank of Matrix","Inverse of a Matrix","Elementary transformation","Consistency of linear system of equations and their solution","Characteristic equation","Eigenvalues","Eigen-vectors","Cayley-Hamilton theorem","Diagonalization of matrices"]},{"l":"III","t":"Multiple Integrals","h":9,"p":["Double and triple integrals","change of order of integration","change of variables","Application of multiple integral to surface area and volume","Beta and Gamma functions","Dirichlet integral"]},{"l":"IV","t":"Vector Calculus","h":9,"p":["Gradient","Divergence and Curl","Directional derivatives, line","surface and volume integrals","Applications of Green’s","Stoke’s and Gauss divergence theorems (without Proofs)"]}],"b":["B.S. Grewal: Higher Engineering Mathematics; Khanna Publishers","Erwin kreyszig: Advanced Engineering Mathematics, John Wiley & Sons.","R. K. Jain and Iyenger: Advanced Engineering Mathematics, Narosa Publications.","B.V. Ramana: Higher Engineering Mathematics, Tata Mc. Graw Hill Education Pvt. Ltd.,"]},"BSM 131/181":{"n":"Engineering Physics","c":"Basic Sciences and Maths (BSM)","p":"Physics at 12thStandard","k":"Lecture: 3, Tutorial: 0 , Practical: 2","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, methods quizzes and one Minor tests and One Major Theory Examination","o":"Understanding of the principles and concept of Optics, Quantum Mechanics, Fiber Optics, Electrodynamics and Physics of Advanced Materials.","co":["Understand the basics principles of Optics and its applications in Engineering and Technology.","Compare and understand the uses of various lasers in different fields of Engineering.","Know the knowledge of Optical Fibre and their applications in Photonics.","Understand the principles of Quantum Mechanics and their applications in Engineering and Technology.","Know the principles of Electrodynamics and their applications in Engineering and Technology.","Understand the basic properties of advanced materials and their engineering applications."],"u":[{"l":"I","t":"Optics Interference","h":9,"p":["Interference of light","Interference in thin films","Newton’s rings","Refractive index and wavelength determination","Diffraction: Fresnel and Fraunhofer class of diffraction","Resultant of n-hormonic waves","single","double and N- slit diffraction","Diffraction grating","Grating spectra","Dispersive power","Polarization: Phenomena of double refraction","Nicol prism","Production and analysis of plane","circular and elliptical polarized light","Retardation Plate","Polarimeter","Laser: Spontaneous and stimulated emission of radiation","Population inversion","Concept of 3 and 4 level Laser","Construction and working of Ruby","He-Ne lasers","and laser applications"]},{"l":"II","t":"Quantum Mechanics and Fiber Optics Quantum Mechanics","h":9,"p":["de Broglie waves","Davisson-Germer experiment","Concept of Phase and Group velocities","Uncertainty principle and its applications","Derivation of time independent and time dependent Schrodinger wave equations","Postulates of quantum mechanics","Significance of wave function","Application of Schrodinger wave equation for a particle in one dimensional infinite potential well","Fiber Optics: Fundamentals of optical fiber","Acceptance angle and cone","Numerical aperture","Single and Multi-Mode Fibers","Step index and graded index fiber","Propagation Mechanism in optical fibers"]},{"l":"III","t":"","h":9,"p":["Electrodynamics Scalar and Vector fields","Gradient","Divergence and curl","Concept of displacement current","Maxwell’s equation in differential and integral forms","Physical significance of each equation","Maxwell’s equation in free space","Velocity of electromagnetic wave","Transverse nature of the electromagnetic wave","Poynting vector","Maxwell’s equations in dielectric and conducting medium","and skin depth"]},{"l":"IV","t":"","h":9,"p":["Physics of Advanced Materials Concept of energy bands in solids","Semiconducting materials","Concept of direct and indirect band gap in semiconductors","Carrier concentration and conductivity in semiconductors","Optoelectronic Materials","Superconducting Materials","Temperature dependence of resistivity in superconducting materials","Effect of magnetic field (Meissner effect)","Type I and Type II superconductors","London Equations","BCS theory (Qualitative)","Introduction of nanoscience","Nanotechnology and its applications","EXPERIMENTS 1","To determine the specific resistance of a given wire using Carrey Foster’s Bridge","To determine the wavelength of sodium light using Newton’s Ring experiment","To determine the wavelength of spectral lines of white light using plane diffraction grating","To determine the specific rotation of cane sugar solution using polarimeter","To study the variation of magnetic field along the axis of current carrying circular coil","To study the Hall’s effect and to determine Hall coefficient in n type Germanium","To study the energy band gap of Germanium using four probe method","To determine the height of Tower by Sextant"]}],"b":["Optics- Ajoy Ghatak, Tata McGraw-Hill","Optics- N. Subrahmanyam, Brij Lal, M.N. Avadhanulu, S. Chand","Quantum Mechanics: Theory and Applications- Ajoy Ghatak, Tata McGraw-Hill","Fiber optics and laser Principles and Applications-Anuradha De, New Age International","Optical Fibers and its application as sensors by R. K. Shukla, New Age International.","Introduction to Electrodynamics by David J. Griffiths, Pearson","Physics of Semiconductor Devices, by S. M. Sze, Wiley","Concepts of Modern Physics by Arthur Beiser, Tata MCGraw Hill.","Introduction to Solid State Physics by C. Kittel, Wiley.","Engineering Physics by B. K. Pandey and S. Chaturvedi, 3e Cengage Learning Pvt. Limited, India.","Engineering Physics by H. K. Malik and A. Singh Tata MCGraw Hill.","Advanced Practical Physics Vol. I and Vol. II by D. K. Dwivedi, Victorius Publishers, New Delhi."]},"BIT 103":{"n":"Programming In C","c":"Engineering Fundamentals (EF)","p":"NIL","k":"Lecture: 3, Tutorial: 0, Practical:2","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical work, record, viva voce, Minor test and Major Theory Examination","o":"Students will gain an understanding of the fundamentals of computers and programming. The objective is to prepare them for various dimensions of C Programming language.","co":["Describing the basics of terminologies used in computer programming.","Practicing C language programming by writing, compiling and debugging the code.","Designing programs involving simple statements, conditional statements, iterative statements, array, strings, functions, recursion and structure.","Discussing the dynamic memory allocations and use of the pointers.","Applying basic operations on files through programs.","Studying and implementing the codes using macros, pre- processor directives and command line arguments"],"u":[{"l":"I","t":"Basics of Computers and Programming","h":9,"p":["Functional diagram of computer","Language Processors","Approaches to problem solving","Concept of algorithm and flow charts","Simple Statements: Data types","Tokens and its types","Variable declaration and initialization","User defined type declaration: type def, enum","Comments","Format specifiers","Standard I/O: taking input and displaying output","Operators: types","precedence and associativity","Expressions","Type conversion","Cshort-hands"]},{"l":"II","t":"Conditional Statements","h":9,"p":["Simple if","if-else","nested if-else","else-if ladder","switch statements","nested switch","advantages of switch over nested if","restrictions on switch values","Iterative Statements: Concepts of entry and exit controlled loops","Uses of for","while and do while loops","Nested Loops","Printing various patterns using nested loops","Using break","continue and goto statements"]},{"l":"III","t":"Arrays","h":9,"p":["Single-dimensional","multi-dimensional array and their applications","declaration and manipulation of arrays","strings and string handling functions","Pointers: Pointer and address arithmetic","dereferencing","pointers and arrays","dynamic memory allocation and de-allocation","Functions: Function prototype","Arguments and its types: actual","formal and default arguments","Scope of a variable","Argument passing methods","Passing pointer as the function argument","Recursion: types","advantages and disadvantages","Storage class specifies","Character test functions"]},{"l":"IV","t":"Structure","h":9,"p":["Declaring and defining structures","Array within structure","Array of structure","Defining and using some data structures: Stack, Queue","and Linked lists","File Handling: Types of files","Text files and different operations on text files","opening a file","closing a file","Data structure of a file, EOF","I/O operations on files","Random access to the files","Standard C Pre-processors & C Library: Pre-processor","Directives, Macro","Macro substitution","Conditional Compilation","Command Line Arguments","Standard C Library","EXPERIMENTS Implementing programs in following categories using programming language ‘C’: 1","Programs of simple statements","conditional statements","and iterative statements with the applications","Programs of single and multi-dimensional arrays and their applications","Programs of strings and the applications 4","Programs of pointer and the applications 5","Programs of function and the applications 6","Programs of structure and the applications 7","Codes of file handling and management 8","Codes with Pre-processor, Macro","Conditional Compilation and Command Line Arguments"]}],"b":["Brian W. Kernighan and Dennis M. Ritchie, “The C programming language”, Pearson","E. Balagurusamy, “Programming in ANSI C”, McGraw Hill Education","Yashavant Kanetkar, “Let Us C”, bpb publication","Jeri R. Hanly, Elliot B. Koffman, “Problem Solving and Program Design in C”, Pearson","Herbert Schildt,“C: The Complete Reference”, McGraw Hill Education"]},"BCE 121":{"n":"Engineering Graphics","c":"Professional Skill (PS)","p":"NIL","k":"Lecture : 2, Tutorial : 0 , Practical: 4","cr":4,"a":"Continuous assessment through attendance, home assignments, : quizzes, practical work, record, viva voce, one minor tests, One Major Theory Exam and major Practical Examination","o":"This course aims at the following educational objectives: Comprehend : general projection theory, with emphasis on orthographic projection to represent three-dimensional objects in two-dimensional views (principal, auxiliary, sections). Dimension and annotate two- dimensional engineering drawings. The students are expected to be able to demonstrate the following","co":[],"u":[{"l":"I","t":"","h":6,"p":["Conic Sections and Orthographic Projections Introduction Introduction to Engineering Drawing covering","Principles of Engineering Graphics and their significance","usage of Drawing instruments","lettering","Conic sections including the Rectangular Hyperbola (General method only)","Cycloid","Epicycloid","Hypocycloid and Involute","Scales – Plain","Diagonal and Vernier Scales","Orthographic Projections Orthographic Projections covering Principles of Orthographic Projections- Conventions Projections of Points and lines inclined to both planes","Projections of planes inclined Planes - Auxiliary Plane"]},{"l":"II","t":"","h":6,"p":["Projection of Regular Solids Projections of Regular Solids covering those inclined to both the Planes- Auxiliary Views"]},{"l":"III","t":"","h":6,"p":["Sections and Sectional Views of Right Angular Solids Sections and Sectional Views of Right Angular Solids covering, Prism","Cylinder","Pyramid","Cone – Auxiliary Views","Development of surfaces of Right Regular Solids - Prism","Pyramid","Cylinder and Cone"]},{"l":"IV","t":"","h":6,"p":["Isometric Projections Isometric Projections covering","Principles of Isometric projection – Isometric Scale","Isometric Views","Conventions","Isometric Views of lines","Planes","Simple and compound Solids","Conversion of Isometric Views to Orthographic Views and Vice-versa","Conventions","Overview of computer graphics","demonstrating knowledge of the theory of CAD software","List of Experiments 1 To prepare a sheet of alphabet","numbers","types of lines","and scales 2 To prepare a sheet of projections of the given points and lines","3 To prepare a sheet of the projections of given plane surfaces","4 To prepare a sheet of the projections of the given solids as per the description 5 To prepare a sheet of the projections of the section of solids as per the description 6 To prepare a sheet of development of the lateral surface 7 To prepare a sheet of isometric projections of a given solid","8 To prepare a sheet of Orthographic projections of a given solid"]}],"b":["Engineering Drawing-Bhat, N.D.& M. Panchal, Charotar Publishing House, 2008","Engineering Drawing and Computer Graphics- Shah, M.B. & B.C. Rana, Pearson Education, 2008","A Text Book of Engineering Drawing-Dhawan, R.K., S. Chand Publications,2007","Text book on Engineering Drawing-Narayana, K.L. & P Kannaiah, Scitech Publishers, 2008 UNDERSTANDING HUMAN VALUES: UNDERSTANDING"]},"BHS 101/151":{"n":"Harmony","c":"HSS","p":"NIL","k":"Lecture : 3, Tutorial : 1 , Practical: 0","cr":4,"a":"Continuous assessment through attendance, home assignments, : quizzes, practical work, record, viva voce, one minor tests, One Major Theory Exam and major Practical Examination","o":"The objectives of this course are to: - : 1. Develop a holistic perspective in students based on self-exploration about themselves (human being), family, society and nature/existence. 2. Develop understanding (or developing clarity) in students about harmony in the human being, family, society and nature/existence. 3. Strengthen self-reflection in students. 4. Develop commitment and courage in students to act The students will be able to demonstrate the following knowledge,","co":["Ability to understand the interconnectedness of humanity and nature as well as the importance of values in interpersonal relationships.","Ability to recognize their role as global citizens and understand the importance of actively contributing to the betterment of society through responsible actions. 3. Ability to engage in critical reflection on their own values and beliefs, challenging assumptions and biases to foster personal growth and development. 4. Ability to appreciate and respect diversity thereby promoting communication and conflict resolution skills, promoting dialogue and understanding in resolving interpersonal and intergroup conflicts"],"u":[{"l":"I","t":"Introduction to Values","h":9,"p":["origin","definition","meaning","and types of values","Values in Education System","difference between Values","Morals","and Ethics","Self-Exploration–what is it? - Its content and process","‘Natural Acceptance’ and ‘Experiential Validation’ as the process for self-exploration","Continuous Happiness and Prosperity- A look at basic human aspirations","Right understanding","Relationship and Physical Facility- the basic requirements for fulfilment of aspirations of every human being with their correct priority","Understanding Happiness and Prosperity correctly- A critical appraisal of the current scenario","Method to fulfil the above human aspirations: understanding and living in harmony at various levels"]},{"l":"II","t":"","h":9,"p":["Understanding human being as a co-existence of the sentient ‘I’ and the material ‘Body’","Understanding the needs of Self (‘I’) and ‘Body’ - happiness and physical facility","Understanding the Body as an instrument of ‘I’ (I being the doer, seer and enjoyer)","Understanding the characteristics and activities of ‘I’ and harmony in ‘I’","Understanding the harmony of I with the Body: Sanyam and Health","correct appraisal of Physical needs","meaning of Prosperity in detail","Programs to ensure Sanyam and Health"]},{"l":"III","t":"","h":9,"p":["Understanding values in human-human relationship","meaning of Justice (nine universal values in relationships) and program for its fulfilment to ensure mutual happiness","Trust and Respect as the foundational values of relationship","Understanding the meaning of Trust","Difference between intention and competence","Understanding the meaning of Respect","Difference between respect and differentiation","the other salient values in relationship","Understanding the harmony in the society (society being an extension of family): Resolution","Prosperity","fearlessness (trust) and co-existence as comprehensive Human Goals","Visualizing a universal harmonious order in society- Undivided Society","Universal Order- from family to world family"]},{"l":"IV","t":"","h":9,"p":["Understanding the harmony in the Nature","Interconnectedness and mutual fulfilment among the four orders of nature- recyclability and self-regulation in nature","Understanding Existence as Co-existence of mutually interacting units in all-pervasive space","Holistic perception of harmony at all levels of existence","Natural acceptance of human values","Definitiveness of Ethical Human Conduct","Basis for Humanistic Education","Humanistic Constitution and Humanistic Universal Order","Competence in professional ethics"]}],"b":["& References","Andrews, C. (2006). Slow is beautiful. New Society Publishers.","Gandhi, M. K. (1909). Hind Swaraj or Indian Home Rule. Navjeevan Trust.","Gandhi, M. K. (2009). An Autobiography or The Story of My Experiments with Truth (Mahadev Desai, Trans.). Navjeevan Mudranalay. (Original work published 1925).","Gaur, R. R., Sangal, R., & Bagaria, G. P. (2010). A Foundation Course in Human Values and Professional Ethics. Excel Books.","Govindrajan, M., Senthilkumar, S., & Natarajan, M. S. (2013). Professional Ethics and Human Values. Prentice Hall India.","Kumarappa, J. C. (2017). Economy of Permanence. Sarva Seva Sangh Prakashan.","Naagarazan, R. S. (2022). A Textbook on Professional Ethics and Human Values. New Age International.","Rolland, R. (2010). Life of Vivekanad (4th Ed.). Advait Ashram.","Schumacher, E. F. (1973). Small is beautiful. A study of Economics as if people mattered. Blond & Briggs.","Suresh, J., & Raghavan, B. S. (2003). Human Values and Professional Ethics. S Chand. Semester II"]},"BSM 160":{"n":"Engineering Mathematics Ii","c":"Basic Sciences & Maths (BSM)","p":"NIL","k":"Lecture : 3, Tutorial : 1 , Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes methods and one Minor tests and One Major Theory Examination","o":"The course is aimed to develop the basic mathematical skills of engineering students that are imperative for effective understanding of engineering subjects.","co":["To solve the ordinary differential equations.","To solve the partial differential equations using Lagrange and charpit’s method.","To solve and understand the properties of Bessel`s and Legendre`s differential equation.","Application of partial differential equation in real life problems","To solve ODE and PDE with the help of Laplace transform","To inculcate the habit of mathematical thinking and lifelong learning."],"u":[{"l":"I","t":"𝑡ℎ Ordinary Differential Equations I","h":9,"p":["Linear differential equations with constant coefficients (𝑛 𝑜𝑟𝑑𝑒𝑟)","complementary function and particular integral","Simultaneous linear differential equations","solution of second order differential equations by changing dependent and independent variables","Method of variation of parameters","Applications of differential equations to engineering problems"]},{"l":"II","t":"Ordinary Differential Equations II","h":9,"p":["Series solution of second order differential equations with variable coefficient (Frobeneous method)","Bessel and Legendre equations and their series solutions","Properties of Bessel function and Legendre polynomials"]},{"l":"III","t":"Partial Differential equations","h":9,"p":["Partial differential equations of the first order","Lagrange's solution","Charpit's general method of solution","Partial differential equations of the second order: Constant coefficient and reducible to constant coefficient","Classification of linear partial differential equations of second order"]},{"l":"IV","t":"Laplace Transform","h":9,"p":["Laplace Transform","Laplace transform of derivatives and integrals","Unit step function","Laplace transform of Periodic function","Inverse Laplace transform","Convolution theorem","Applications to solve simple linear and simultaneous differential equations and Partial Differential Equations"]}],"b":["B.S. Grewal: Higher Engineering Mathematics; Khanna Publishers","Erwin kreyszig: Advanced Engineering Mathematics, John Wiley & Sons.","R. K. Jain and Iyenger: Advanced Engineering Mathematics, Narosa Publications.","B.V. Ramana: Higher Engineering Mathematics, Tata Mc. Graw Hill Education Pvt. Ltd.","M.D. Raisinghania, Ordinary and Partial Differential Equations. S Chand Publications."]},"BSM 140/BSM 190":{"n":"Environmental Science And Green Chemistry","c":"Basic Sciences & Maths (BSM)","p":"NIL","k":"Lecture : 3, Tutorial : 0 , Practical: 2","cr":4,"a":"Continuous assessment through home assignments, quizzes, minor tests, methods: practical work, viva-voce, practical exam and one minor test and one major theory Examination","o":"Understanding the principles and concepts of Chemistry viz. Chemical Bonding, acidity and basicity, Atmospheric Chemistry & Water Chemistry, Spectroscopic analytical methods and Green Chemistry and solving industrial problems using solid foundation in Chemistry.","co":["To develop the concepts of basic chemistry.","To make the students aware of global environmental issues e.g. global warming & Greenhouse effect, Ozone depletion, pollution and its prevention and understand various aspects of atmospheric chemistry.","To understand the analytical and conceptual skills required for environmental chemistry research.","To understand water treatment for all types of uses and need to protect environment.","To understand the specifications of pure water and its purification techniques.","To develop the knowledge about Green Chemistry and Green Technology."],"u":[{"l":"I","t":"Basic Chemical Concepts","h":9,"p":["Periodic properties of elements","Ionization potential","electron affinity and electronegativity","mole concept","molarity and normality","Chemical Bonding – MO Theory","MO diagram of diatomic molecules","hydrogen bonding","electrophiles","nucleophiles","inductive effect and mesomeric effect","Reaction Mechanism","Acidity and basicity - Concept of pH"]},{"l":"II","t":"Atmospheric chemistry & Water Chemistry","h":9,"p":["The atmosphere of Earth","layers of atmosphere and temperature inversion","Air pollution","Global warming and Greenhouse effect","Acid rain and Ozone layer depletion","Chemical and photochemical Smog","Sources of water","conservation of water","impurities in water and their effects","WHO guideline and BIS guideline for drinking water","Hardness of water","Softening of water by Zeolite process","Lime Soda process","Ion exchange process and Reverse osmosis"]},{"l":"III","t":"Spectroscopic analytical methods","h":9,"p":["Absorbance","Transmittance and Beer-lamberts Law","Basic principles of UV-Visible spectroscopy","Fluorescence spectroscopy","Infrared spectroscopy","NMR Spectroscopy","Use of these instrumental techniques for monitoring of environmental pollution","Environmental problems posed by the use of non-biodegradable polymers widely used in day-to-day life","Incineration as the key method for disposal of polymeric waste","Bio-degradable polymers"]},{"l":"IV","t":"Green Chemistry","h":9,"p":["Green Chemistry and Green Technology: New trends in Green chemistry","Green Chemistry Methodologies-Microwave heating","ultrasound technique","Green Chemical Synthesis Pathways","Green reagents","Green solvents","Experiments: 1","Determination of temporary and permanent hardness in water sample using EDTA as standard solution","Determination of alkalinity in the given water sample","Determination of chloride content in the given water sample by Mohr’s method","Determination of percentage of available chlorine in bleaching powder sample","Determination of iron content in the given sample using K3[Fe(CN)6] as an external indicator","Determination of Electrical conductivity/TDS of a given water sample using conductivity meter","Determination of dissolved Carbon Dioxide of given water sample","Determination of the biochemical oxygen demand of sewage influent","To calculate the lambda max of the given compound by using UV-Visible spectrophotometer","Determination of nickel / cobalt / copper solutions by UV–visible spectrometry","Examples of Green Synthesis /Reactions","Determination of Turbidity of Water 13","Iodoform test 14","Synthesis of a polymer Bakelite or Polyacrylic acid"]}],"b":["A Text Book of Environment and Ecology, Shashi Chawla, Tata McGraw Hill","Environmental Studies, Raj Kumar Singh, Tata McGraw Hill","Engineering Chemistry, Wiley India","Engineering Chemistry, Tata McGraw Hill","Organic Chemistry, Morrison & Boyd, 6th edition, Pearson Education","Fundamentals of Environmental Chemistry, Manahan, Stanley E., Boca Raton: CRC Press LLC.","Environment and Ecology, R K Khandal, Wiley India","An Introductory Text on Green Chemistry: For Undergraduate Students, lndu Tucker Sidhwani, Rakesh K. Sharma, Wiley","A text book of Green Chemistry, Shankar Prasad Deo and Nayim Sepay, Techno World Publication.","Introduction to Green Chemistry, John Andraos, Albert S. Matlack, CRC Press"]},"BEE 107/157":{"n":"Basic Electrical Engineering","c":"Engineering Fundamentals (EF)","p":"NIL","k":"Lecture: 3, Tutorial: 0, Practical: 2","cr":4,"a":"Continuous assessment through attendance, home assignments, quizzes, methods practical work, record, viva voce, Minor tests and One Major Theory & Practical Examination.","o":"1. To demonstrate and understand the basic knowledge of electrical quantities such as current, voltage, power, energy, and frequency to understand the impact of technology in a global and societal context. 2. To demonstrate and understand the basic concepts of analysis of simple DC and AC circuits used in electrical engineering and apply the basic concepts in Electrical engineering for multi-disciplinary tasks.","co":["Understand the basic properties of electrical elements, and solve problem based on basic electrical circuits & DC network theorems.","Understand the fundamental behaviour of AC circuits and solve AC circuit problems.","Apply the knowledge gained to explain the behaviour of the circuit at series & parallel resonance of circuit & the effect of resonance.","Classify different electrical measuring equipment’s and understanding their principles.","Understand the basic concepts of magnetic circuits.","Explain construction and working principle of transformer."],"u":[{"l":"I","t":"D C Circuit Analysis and Network Theorems","h":9,"p":["Circuit Concepts: Concepts of network","Active and passive elements","Voltage and current sources","Concept of linearity and linear network","Unilateral and bilateral elements","L and C as linear elements","Source transformation","Kirchhoff’s laws","Loop and nodal methods of analysis","Star-delta transformation","Network theorems: Superposition theorem","Thevenin’s theorem","Norton’s theorem","Maximum Power Transfer theorem"]},{"l":"II","t":"Steady- State Analysis of Single-Phase AC Circuits","h":9,"p":["AC fundamentals: Sinusoidal","square","and triangular waveforms – Average and effective values","Form and peak factors","Concept of phasor","phasor representation of sinusoidally varying voltage and current","Analysis of series","parallel and series-parallel RLC Circuits","Resonance in series and Parallel circuit Three Phase AC Circuits: Three phase system-its necessity and advantages","Star and delta connections","Balanced supply and balanced load","Line and phase voltage/current relations","three-phase power","and its measurement"]},{"l":"III","t":"Measuring Instruments & Magnetic Circuit","h":9,"p":["Types of instruments","Construction and working principles of PMMC and Moving Iron type voltmeters & ammeters","Use of shunts and multipliers","Magnetic circuit","concepts","analogy between electric & magnetic circuits","B-H curve","Hysteresis","and eddy current losses"]},{"l":"IV","t":"Single-Phase Transformers","h":9,"p":["Single Phase Transformer: Principle of operation","Construction","EMF equation","Power losses","Efficiency, C & S","C Test and Introduction to auto transformer","EXPERIMENTS 1","Verification of Kirchhoff’s Law","Verification of Norton’s Theorem","Verification of Thevenin’s Theorem","Verification of Superposition Theorem","Verification of Maximum Power Transfer Theorem","Verification of Series R-L-C circuit","Verification of Parallel R-L-C circuit","Measurement of Power and Power factor of three phase inductive load by two wattmeter method","To perform O, and S","test of a single-phase transformer"]}],"b":["Fundamentals of Electric Circuits, C.K. Alexander and M.N.O. Sadiku; TATA McGraw-Hill.","Principles of Electrical Engineering, V. Del Toro; Prentice Hall International."]},"BCE 161":{"n":"Building Planning And Drawing","c":"Professional Skill (PS)","p":"NIL","k":"Lecture : 2, Tutorial : 0 , Practical: 4","cr":4,"a":"Continuous assessment through attendance, home assignments, quizzes, : methods practical work, record, viva voce One Minor tests, one Major theory exam and Practical Examination.","o":"This course aims at the following educational objectives: : 1. To understand the fundamental principles and concepts of planning and architecture for buildings. 2. To study about different views of layout. 3. To learn the development controls covered by building bye laws and national building code for buildings.","co":["Apply the concepts of building planning considering climatic parameters, building bye laws, classification of buildings and design buildings.","Draw site plan, plans, elevations and sectional views of residential, commercial and public buildings, showing maximum details of various building components using the available construction area effectively according to codal provisions and standard units Effectively analyse the geometrical shapes and to be able to draw.","Prepare building services drawings How to implement the different views for a solid placed in 3dspace.","Apply his knowledge to evaluate existing projects, suggest economical modifications for sustainable development and strengthen his professional skills through self-employability and lifelong learning.","Able to prepare a water supply line diagram.","Able to prepare a firefighting layout for buildings."],"u":[{"l":"I","t":"Introduction","h":6,"p":["Building Planning- Factors Shape size and topography of site","Climatic conditions of the site","Functional requirements of the building","Local Bye laws requirements of size of different components","setbacks","neighborhood","Owner :– Status-Choices-Preferences","Economy","Building Planning- Principles Aspects","Prospects","roominess","furniture requirements","groupings","circulation","privacy","elegance","lighting & ventilation","sanitation","flexibility","economy","practical considerations"]},{"l":"II","t":"","h":6,"p":["Building Bye Laws Building Bye Laws Means of access","internal and external open spaces","floor area ratio","height of building","safety precautions","Building Sanction procedures","key plan (layout plan)","site plan","building plan","working plan","validity of sanction","completion certificate"]},{"l":"III","t":"","h":6,"p":["Site Plan &Planning of Buildings Drawing of site plan showing setbacks","Floor Area Ratio","Height of Building","and Minimum Distance from Power line","as per National Building Code (NBC)","Given the floor area or carpet areas of rooms","plan the building and draw a Single line diagram of building","a) Residential building b) School Buildings c) Hostel Buildings d) Primary Health Centre Draw the Plan","Elevation and Sectional views for the following types of buildings","a) Residential buildings","b) School Buildings c) Hostel Buildings d) Primary Health Centre e) Canteen Building f) Two storied residential building g)Small workshop Building"]},{"l":"IV","t":"","h":6,"p":["Building Basic Services Preparation of water supply Layout for residential building","Preparation of Electrical Layout for residential building","Preparation of Sanitary Layout for residential building","Preparation of Shallow Well Rain Water Harvesting Method for Building","Preparation of Fire Fighting layout for buildings","List of Experiments 1 To draw the different types of brick and brick masonry","2 To draw the different types of doors and windows","3 To draw a plan","elevation","and Section of the given building","4 Plan the building and draw a single-line diagram of a residential building 5 Plan the building and draw a single-line diagram of a hostel building 6 Plan the building and draw a single-line diagram of a Primary Health Centre building 7 The Plan","Elevation and Sectional views for the Residential buildings 8 The Plan","Elevation and Sectional views for the Two storied residential building 9 The Plan","Elevation and Sectional views for the Small workshop Building","10 The Plan","Elevation and Sectional views for the Hostel Buildings"]}],"b":["Civil Engg: Drawing Balagopal and RS Prabhu – Spades.","Time Savers standards for Building types – Joseph Deciara and john Callender Tata Mc Graw hill"]},"BHS 102/152":{"n":"Technical Writing And Professional Communication","c":"HSS","p":"None","k":"Lectures: 3, Tutorial: 1, Practical: 0","cr":4,"a":"Continuous assessment through One minor test, teacher’s assessment (quiz, tutorial, assignment, attendance), and One Major Theory Examination.","o":"The objectives of this course are to: - The course aims- 1. To sensitize the students to understand the role and importance of communication for personal and professional success. 2.To enable the learners to enhance their writing skills in techno-cultural and professional echo-system. 3.To equip learners to differentiate technical writing from general writing. 4.To equip them with technical writing skills. 5.To enable learners to exhibit knowledge, skills, attitude and judgment in and around human communication that facilitate their ability to work collaboratively with others in an interpersonal environment.","co":["The students will be able to demonstrate the following knowledge, skills, and attitudes upon completion of the course: - 1.Overcome the problems she/he shall faces in oral and written communication. 2.Acquire knowledge of and methods for using technical communication, such as reports, proposals, technical letters, etc. 3.Use and Practice compositions correctly. 4.Give presentations in different sessions and make self- appraisal. 5.Learn and understand the various facets of Communication Skills, such as (LSRW) Listening, Speaking, Reading, and writing, and","Identify, formulate, and solve real-life problems with a positive attitude; also inculcate, the habit of learning and developing communication and soft skills."],"u":[{"l":"I","t":"Language and Communication Language Vs communication","h":null,"p":["Communication as coding and decoding – signs","symbols & pictograph – verbal and non–verbal symbols – Language & communication","Types of Communication- functional","situational","verbal","and non-verbal","interpersonal, group","interactive","public","Mass Communication","Thinking and Articulation","critical","creative aspects of articulation","Skills of Language Acquisition: Natural Language Acquisition Skills: Listening","Speaking","Reading & Writing {LSRW}","Language Acquisition Through Training: Listening","Speaking","Reading","Writing","Grammar & Vocabulary {LSRWGV} Phrase","Clause & Sentence in Professional Drafting-Simplicity","Clarity and Conciseness of a Presentation","Differentiating between Professional and Creative Writing","Blending of Artistic/Professional Writing","Avoiding gender","racial","and other forms of bias in Professional Writing","Pre-writing","Drafting","and Re- writing"]},{"l":"II","t":"Towards Technical Writing","h":null,"p":["Technical Paper Writing: Professional Paper Elements-Front Matter of a Paper","Main Text of a Paper","End Matter of a Paper: Organizing References and Bibliography","Order of a thesis and Paper Elements","Concluding Remarks","Methods of Research Paper Writing: Identification of Author and His Writing-Author’s name and Affiliation","Joint Authorship of a Paper","Identification of Writing- Title","Keywords","Synopsis","Preface and Abstract","Drafting Research Article & Methodology","Thesis/Dissertation Writing: Thesis Elements-Front Matter of a Thesis","Main Text of a Thesis","End Matter of a Thesis","Specimen—Thesis and Research Paper","Chapters and Sections-Introductory Chapters and Sections","Statement of the Problems","Plan and Scope","Core Chapters and Sections- Theoretical Analysis and Synthesis","Basic Assumption and Hypothesis","Professional Presentation & Seminar Delivery Tools: Designing the Presentation","Establishing the Objectives","Making Professional PowerPoint Presentations","Signaling Structure of Presentation through Sentences and Crisp Phrases","Preparing Notes for Professional/Technical Presentation","Text Animation","White Board","Flip Charts","Diagrams","Preparing Cards","Seminar Presentations: Purpose modes and methods","Nascent Emerging Platforms for On-line Presentations viz, Zoom, Webex","Team & Meet etc"]},{"l":"III","t":"Professional Drafting","h":null,"p":["Letters vs","e-mails","Formal and Informal emails","Parts of e-mails","Types of e-mails","Managing tone of E-mails and business Letters","Examples of Letters and E-mail","Professional Correspondence through E-mail","Job Applications and cover Letters","Introduction to DOs (Demi- Official Letters) Career & Correspondence: Developing a Professional C","Bio Data & Resume","Report Writing","Kinds of Reports","Length of Report","Parts of a Report","Terms of Reference","Collection of Facts","Outlines of Report","Examples of Report","Technical Proposal","Elements of Proposal","Examples of Proposal","drafting of proposal"]},{"l":"IV","t":"Conducting Professional Meeting","h":null,"p":["Pre-meeting Preparation","During Meeting: Action Taken Report (ATR) & New Agenda Points","Post Meeting Follow ups","Notice","Circular","Agenda & Meeting Minutes","Introduction to Generation–Z","Cyber Identity & Professional Netiquettes for Netizens: Drafting E-mails","Blogs on social media","Videoconferencing","Managing Profiles on social media","What to Write and Share on social media","Telephone Etiquettes & Phubbing","List of Practical 1","Introduction to Vowel and Consonant Sounds 2","Monophthongs and Diphthongs 3","Syllable","Word Stress & Intonation 4","Harnessing Non-verbal Communication Skills in Cross-Cultural Environment for the establishment of an ideal Ecosystem to ensure Professional Success 5","Developing Speech","and Proofreading the Same 6","Argumentative Skills & Group Dynamics 7","Preparing CV","Biodata & Resume 8","Types of Interview and Interview Skills 9","PI & Telephonic Interview 10","Presentation Skills","Extempore","Debate and Video Conferencing 11","Netiquettes while Writing Blogs on social media","Ethical Usages of Generative AI Text / Reference Books 1","Acharya Anita","(2012) Interview Skills- Tips & Techniques","Yking Books","Jaipur, Basu","(2008) Technical Writing","PHI Learning Pvt, Ltd","New Delhi","Chauhan","K & Singh","(2013) Formal Letters","Pankaj Publication International","New Delhi","Chhabra T","(2018) Business Communication","Sun India Publication New Delhi","Dubey Arjun et","(2016) Communication for Professionals","Alfa Publications, Delhi","Gibaldi","Joseph (2021)","The MLA Handbook for Writers of Research Papers, IXth","Modern Language Association of America","Gurumani","(2010) Scientific Thesis Writing and Paper Presentation","MJP Publishers","Chennai","Hamilton Richard","(2009) Managing Writers","Penguin, India","Mc Graw S","(2008) Basic Managerial Skills for All, 08th","Prentice Hall of India","New Delhi","Murphy & Hildebrandt","(2008) Effective Business Communication","Tata McGraw Hill New Delhi","Pandey, Singh","& Kumar, Raman","(2023) Exploring Digital Humanities: Challenges & Opportunities","MacBrain Publishing House","New Delhi"]}],"b":[]},"BCE 162":{"n":"Design Thinking In Civil Engineering","c":"VAC/AC","p":"NIL","k":"Lecture : 0, Tutorial : 0 , Practical: 2","cr":0,"a":"Continuous assessment through attendance, home assignments, quizzes, : methods practical work, record, viva voce and Practical Examination, one minor test and one major examination","o":"The objective of this Course is to provide the new ways of creative thinking : and Learn the innovation cycle of Design Thinking process for developing innovative products which are useful for a student in preparing for an engineering career. The students are expected to be able to demonstrate the following knowledge,","co":["Compare and classify the various learning styles and memory techniques and Apply them in their engineering education.","Analyze emotional experience and Inspect emotional expressions to better understand users while designing innovative products","Develop new ways of creative thinking and Learn the innovation cycle of Design Thinking process for developing innovative products","Identification of real-time civil engineering problems and their innovative solutions.","Perceive individual differences and its impact on everyday civil engineering project decisions and further create a better project execution."],"u":[{"l":"I","t":"An Insight to Learning","h":null,"p":["Understanding the Learning Process","Kolb’s Learning Styles","Assessing and Interpreting Remembering Memory: Understanding the Memory process","Problems in retention","Memory enhancement techniques Emotions: Experience & Expression: Understanding Emotions: Experience & Expression","Assessing Empathy","Application with Peers"]},{"l":"II","t":"Basics of Design Thinking","h":null,"p":["Definition of Design Thinking","Need for Design Thinking","Objective of Design Thinking","Concepts & Brainstorming","Stages of Design Thinking Process (explain with examples) - Empathize","Define","Ideate","Prototype","Test Being Ingenious & Fixing Problem: Understanding Creative thinking process","Understanding Problem Solving","Testing Creative Problem Solving"]},{"l":"III","t":"Infrastructure Design Concepts","h":null,"p":["Introduction to infrastructure design approaches for different projects","Various IRC and IS codes guidelines for design of various infrastructure components","General Principles of Design","Drawing","Importance of Safety","Case study of best infrastructures projects in current scenario","Introduction to ethical construction practices","application of project management tools","Standards and Quality practices in production","construction","maintenance","and services"]},{"l":"IV","t":"Prototyping & Testing","h":null,"p":["Concept of Prototype","Prototyping – Virtual and Physical","Rapid Prototype Development process","Testing Methodology","Testing and Sampling process in civil engineering","Energy and Environment: Conservation","environmental pollution","and degradation","Climate change","Environmental impact assessment","Information and Communication Technologies (ICT) based tools and their applications in Engineering include networking","e-governance","and technology-based education","Ethics and values in the Engineering profession"]}],"b":["E Balaguruswamy (2022), Developing Thinking Skills (The way to Success), Khanna Book Publishing Company.","Change by Design, Tim Brown, Harper Bollins (2009)","Design Thinking in the Classroom by David Lee, Ulysses Press","Design the Future, Shrrutin N Shetty, Norton Press","Universal principles of design- William lidwell, kritina holden, Jill butter.","The era of open innovation – Chesbrough.H Semester III"]},"BCE 210":{"n":"Civil Engineering Materials, Evaluation And Testing","c":"Engineering Fundamental (EF)","p":"NIL","k":"Lecture : 3, Tutorial : 0 , Practical: 2","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, : methods quizzes and One Minor tests and One Major Theory & Practical Examination","o":"The objective of this Course is to deal with an experimental determination and : evaluation of mechanical characteristics and advanced behavior of construction materials. The students are expected to be able to demonstrate the following knowledge,","co":["Make measurements of behavior of various materials used in Civil Engineering.","Provide physical observations to complement concepts learnt","Introduce experimental procedures and common measurement instruments, equipment, devices.","Exposure to a variety of established material testing procedures and techniques","Different methods of evaluation and inferences drawn from observations"],"u":[{"l":"I","t":"Building Stones and Stone Aggregates","h":9,"p":["Introduction Classification of Rocks Geological Classification Physical and Chemical Classification Common Building Stones and Their Uses","Quarrying of St Quarrying Methods","Criteria for Selection of Stones","Characteristics to be Considered in Selection of Stones","Deterioration and Preservation of Stones","Artificial Stones","Stone Veneering","Aggregates: Requirement of stone for aggregates","Physical and Chemical characteristics of aggregates","Gradation and Gradation Zones of aggregates Clay Bricks: Genera","Brick clay","Preparation of Bricks","Types of Clay Bricks","Chemical Changes in Burning of Bricks","Dimensions of Bricks","Bricks for Special Use Conventional and Specially Shaped Bricks","light Weight Clay Bricks","Brick Substitute","Test on Bricks Cement and Concrete Blocks: Introduction","Manufacturing of Concrete Blocks","Dimensions and Tolerance","Classification of Concrete Blocks","Storage of Blocks","Autoclaved Aerated Concrete Blocks","Use of Block Masonry in Buildings","Testing of Blocks (IS 2185)"]},{"l":"II","t":"Cement","h":9,"p":["Raw materials used","Process of Manufacturing","Chemical composition","compounds formed and their effect on strength","Types of cement Grades of Cement produced in India","Sampling and Testing of cement properties","Uses of cement","Storage of Cement","Adulteration of Cement Lime: Cementing Action of Lime","Classification of Lime","Slaking of Quicklime to Prepare Slaked Lime","Tank Slaking of Quicklime to Prepare Lime Putty Storing Li me","Precautions in Handling Lime","Tests for Li me","Field and Laboratory Tests for Building Lime Mortars: Classification, Uses","Characteristics of good mortar","Ingredients","Cement mortar","Lime mortar","Lime cement mortar","special mortars","Pozzolanic Materials","Advantages of Addition of Pozzolanas","Storing of Pozzolanas Required Chemical and Physical Characteristics of Fly ash"]},{"l":"III","t":"Wood and Wood Products","h":9,"p":["Classification of Timber","Structure","Characteristics of good timber","Seasoning of timber","Defects in Timber","Diseases of timber","Decay of Timber","Preservation of Timber Testing of Timber","Industrial Timber Products such Veneers","Plywood","Fiber Boards","Particle Boards","Chip Boards","Paints","Enamels and Varnishes: Composition of oil paint","characteristic of an ideal paint","preparation of paint","covering power of paints","Painting: Plastered surfaces","painting wood surfaces","painting metal Surfaces","Defects","Effect of weather","enamels","distemper","Varnish","Miscellaneous Materials: Gypsum: Classification","Plaster of Paris","Gypsum wall Plasters","Gypsum Plaster Boards","Adhesives","Heat and sound insulating materials","Geo synthetics"]},{"l":"III","t":"Concrete","h":9,"p":["Production","Properties of Fresh","Gradation of Concrete","Transportation and placement of concrete","Concrete Additives Admixtures Different Types of Concrete Special Structural Concretes Cast Iron and Steel Introduction","Manufacture","Iron-Carbon Alloys","Manufacture of Thermo-mechanically Treated (TMT) Bars","Equilibrium Diagram (Iron-Carbon Phase Diagram)","Other Factors in Making Iron Products","Effect of Rate of Cooling Mechanical Working (Treatment) of Steel","Hot Working of Steel","Cold Working of Steel","Heat Treatment of Steel","Mild Steel and Other Steels","Wrought Iron","Cast Iron","Malleable Cast Iron","Spheroidal Graphite Iron (Ductile Iron)","Corrosion Resistance of Cast Iron","Rolled Steel Structural Sections and other market forms of steel Allumum and its alloy: Manufacture","Description of the Process","Processing of Aluminium Metal","Conversion into Different Products","Improving Surface Appearance","Improving Appearance by Anodizing of Aluminium","Improving Appearance by Powder Coating of Aluminium","Comparison of Colouring Processes","Characteristics and Advantages of Aluminium as a Construction Material","Available Forms of Aluminium and Their Uses","Aluminium Alloys Important Alloys for Industrial Use","Uses of Aluminium in Building Construction Other Metals and Their Alloys: Copper and Its Alloys","Alloys of Copper","Zinc and Its Alloys","Use of Zinc for Manufacturing of GI Sheets","Other Metals"]},{"l":"IV","t":"","h":9,"p":["Plastic and Plastic Pipes Short History of Plastics","Polymerization of Plastics","Classification of Plastics Classification According to Mechanical Property","Properties of Plastics","Fabrication of Plastic Articles","Moulding Compounds","Fabrication Methods Used for Making Plastic Articles Some Plastics in Common Use","Vinyls—Polyvinyl Chloride (PVC)","Acrylics—Polymethyl Methacrylate (PMMA)","Perspex","Polycarbonate (PC)","Polyethylene (PE), Nylo","Terylene (Polyester)","Amino Plastics—Formaldehydes, Casin","Epoxy Resins","Reinforced Plastics","Glass Fibre Reinforced Polyesters (GFRP)","Carbon Fibre Reinforced Plastic (CFRP)","Thermocol","PVC Floor Sheets/Tiles","Laminated Plastics—Formica","Use of Plastics for Doors and Windows","Use of Plastics for Roofing","Polyethylene (Polythene) Water Tanks","Compounding Plastics with Rubber Rubber: Natural Rubber","Synthetic (Polymer) Rubber","Vulcanization of Rubber","Uses of Rubber in Building Construction","Rubber in Cement Mortar and Concrete","Rubber Floors","Materials for Flooring: Ceramic Tiles","Terrazo (Mosaic) Tiles","Materials for Terrazo Tiles","Manufacture of Terrazo Tiles","Test Requirement of Precast Cement-Concrete Terrazo Tiles","Terrazo Laid In Situ","Stone Flooring","Marble Stone Flooring","Resilient Floor Materials","Rubber Flooring (IS 809-1970)","Linoleum Flooring (IS 653-1962)","PVC Sheet and Tile Flooring (IS 3492- 1966)","Selection of Type of Floor Geo-synthetic and WPC","ACP and other New Materials Pipes Used in Building Construction: Cast Iron Pipes","Plastic Pipes","Galvanized Steel (GI) Pipes","Stoneware Pipes Asbestos Cement (AC) Pipes","Concrete Pipes Practical: Bricks: Water absorption","Dimension Tolerances","Compressive strength","Efflorescence Cement: Normal Consistency of cement","Initial & final setting time of cement","Compressive strength of cement","Fineness of cement","Soundness of cement","Tensile strength Coarse Aggregate: water absorption of aggregate","Sieve Analysis of Aggregate","Grading of aggregates","Fine Aggregate: Sieve analysis of sand","Silt content of sand","Bulking of sand Cement concrete: Workability tests","compressive strength","Tensile strength"]}],"b":["Building Materials and Construction – Arora & Bindra, Dhanpat Roy Publications.","Building Materials and Construction by G C Sahu, Joygopal Jena McGraw hill Pvt Ltd 2015.","Building Construction by B. C. Punmia, Ashok Kumar Jain and Arun Kumar Jain - Laxmi Publications (P) ltd., New Delhi.","Building Materials by Duggal, New Age International.","Building Materials by P. C. Varghese, PHI.","Building Construction by PC Varghese PHI.","Construction Technology – Vol – I & II by R. Chubby, Longman UK.","Alternate Building Materials and Technology, Jagadish, Venkatarama Reddy and others; New Age Publications."]},"BCE 211":{"n":"Soil Mechanics","c":"Engineering Fundamental (EF)","p":"NIL","k":"Lecture: 3, Tutorial : 0 , Practical: 2","cr":4,"a":"Continuous assessment through attendance, home assignments, quizzes, practical methods work, record, viva voce and One Minor test and One Major Theory & Practical Examination","o":"The objectives of the course are as follows: 1. To develop an appreciation of soil as a vital construction material, so that it may subsequently be used in the design and construction of foundation for civil engineering structures. 2. To develop an understanding of the relationships between physical characteristics and mechanical properties of soils. 3. To inculcate the basic knowledge of classification and engineering properties of soil and its suitability as a foundation/subgrade material. 4. To understand the experimental methods for physical and mechanical soil properties","co":["After completion of this course the students to demonstrate following knowledge, skills and attitudes.","Fundamental differences in engineering behavior between cohesive and cohesionless soils.","Compute the groundwater seepage and distribution of ground water pressure.","Compute the applied stress beneath the ground surface.","Demonstrate the fundamental difference in the strength and deformation characteristics of cohesive and cohesionless soils.","Analyze field and laboratory data to determine the strength and deformation properties of cohesive and cohesionless soils.","Compute settlements due to consolidation of soil."],"u":[{"l":"I","t":"Geological Characteristics of Soils","h":null,"p":["Origin of soils and rocks","composition of soils: soil formation, types","clay minerals","and soil fabric","soil structure","coarse-grained and fine-grained soil for engineering use","Physical Soil Parameters: Basic three phase relationships","index properties of soil","dry unit weight-water content relationship","Atterberg’s limits","soil classification schemes"]},{"l":"II","t":"Soil Compaction","h":null,"p":["Laboratory compaction","Standard and Modified Proctor compaction tests","zero air void curve","factors affecting soil compaction","field compaction","compaction quality control: Proctor Needle Test","Purpose and Phases of Soil Investigation","One-dimensional flow of water through soils: concept of permeability","Darcy's law","flow parallel/normal to soil layers","determination of hydraulic conductivity","equivalent hydraulic conductivity","quicksand condition","seepage and flow nets","flow through dams and design of filters"]},{"l":"III","t":"Stresses, Strains, and Elastic Deformation of Soil","h":null,"p":["Stresses in soil from surface loads","Boussinesq’s theory and Westergaard theory under point loading","circular area loading","Newmark's Influence chart","Consolidation of Soils: Compressibility and consolidation characteristics Terzaghi’s One-dimensional consolidation theory","settlement of compressible soil layers","calculation of primary consolidation settlement","determination of coefficient of consolidation and secondary consolidation (creep)","Over Consolidation Ratio and Effective stress principles"]},{"l":"IV","t":"Shear Strength of Soils","h":null,"p":["Mohr circle of stress","Mohr-Coulomb failure criterion","estimation of shear strength parameters for soil","laboratory tests to determine the shear strength parameters of soils: direct shear test","triaxial tests (UU, CU, and CD)","and vane shear test","Concept of pore water pressure","Skempton’s pore pressure parameters","Stability of Slopes: Infinite and finite slope","two-dimensional slope stability analysis","methods of slices: Bishop's method","Taylor's method","and Bishop-Morgenstern method","concept of factor of safety","Geotechnical Engineering Lab Experiments 1","Classification of soil using Particle Size analysis","Determination of specific gravity of soil grains","Determination of liquid and plastic limits","and shrinkage limit","Proctor compaction test","Determination of relative density","In-situ density – core cutter method and sand replacement method","Permeability test – falling head and constant head methods","Determination of coefficient of consolidation using oedometer test","Determination of shear strength parameters using direct shear test","Determination of shear strength parameters using triaxial test"]}],"b":[" Alam Singh – Modern Geotechnical Engineering, Asia Publishing House, New Delhi.  Gopal Ranjan and A.S.R. Rao – Basic and Applied Soil Mechanics, New Age International (P) Ltd.  B.C. Punamia – Soil Mechanics and Foundations, Laxmi Publications (P) Ltd.  Brij Mohan Das – Geotechnical Engineering, CENGAGE Learning.  I.H. Khan – Textbook of Geotechnical Engineering, Prentice-Hall of India Ltd., New Delhi.  C. Venkataramaiah – Geotechnical Engineering, New Age International (P) Ltd., New Delhi.  Shashi Gulati & Manoj Datta – Geotechnical Engineering, Tata McGraw Hill, New Delhi.  J.E. Bowles – Foundation Analysis & Design, McGraw Hill, New Delhi.  K.R. Arora – Soil Mechanics & Foundation Engineering, Standard Publishers & Distributors, Delhi.  V.N.S. Murthy – Soil Mechanics and Foundation Engineering, CBS Publication.  Muni Budhu- Soil Mechanics and Foundations, Wiley India Pvt. Ltd."]},"BCE 212":{"n":"Structural Mechanics","c":"Professional Core (PC)","p":": Mechanics of structures","k":": Lecture : 3, Tutorial : 0 , Practical: 2","cr":4,"a":"Continuous assessment through tutorials, assignments, quizzes and one Minor : methods tests and One Major Theory & Practical Examination.","o":"The objective of this course is: : 1. To learn the fundamental concepts of stress, strain, and deformation of solids with applications to bars, beams, and columns. 2. Detailed study of engineering properties of materials is also introduced. 3. Fundamentals of applying equilibrium, compatibility, theories of failure and energy methods and force deformation relationships to structural elements are also emphasized. 4. To introduce the concepts for calculating the deflection of beams with various loading conditions. And builds the fundamental concepts of unsymmetrical bending and curved beams.","co":["Identify the basic concepts of structural mechanics including static equilibrium, geometry of deformation, and material constitutive behavior.","Executing the fundamental concepts of stress, strain, and elastic behaviour of materials to analyze structural members subjected to tension, compression, torsion.","Analyze the bending and shear stress on different types of sections.","Formulate an appropriate theoretical basis for the analysis of combined axial and bending stresses.","Understand the behavior of columns and struts under axial loading.","Demonstrate the use of critical thinking and problem-solving techniques as applied to structural systems."],"u":[{"l":"I","t":"","h":9,"p":["Simple Stress and Strain","Poisson’s ratio","Different Moduli of elasticity and their relations","Compound stresses and strains: Introduction: normal stress and strain","shear stress and strain","stresses on inclined plane","strain energy","impact loads and stresses","state of plane stress","principal stress and strain","maximum shear stress","Mohr‟s stress circle three-dimensional state of stress & strain","equilibrium equation","generalized Hook‟s law","theories of failure","composite bars","Temperature stresses"]},{"l":"II","t":"","h":9,"p":["Bending Moment","Shear Force Diagram for beams and determinate structural members","Bending Stresses: Derivation of formula","bending stress distribution across various beam sections like rectangular","circular","triangular","T angle sections","composite beam Shear Stresses: Derivation of formula","Shear stress distribution across various beam sections like rectangular","circular","triangular","T angle sections","composite beam"]},{"l":"III","t":"Deflection of beam","h":9,"p":["Equation of elastic curve","cantilever and simply supported beam","Macaulay‟s method","Moment Area method","Unit Load Method","Strain Energy Methods and Strain Energy theorems","Torsion- Derivation of torsion equation and its assumptions","Applications of the equation of the hollow and solid circular shafts","torsional rigidity","Combined torsion and bending of circular shafts","principal stress and maximum shear stresses under combined loading of bending and torsion"]},{"l":"IV","t":"","h":9,"p":["Combined bending and direct stress","middle third and quarter fourth rules","Columns and struts: Buckling and Stability","slenderness ratio","Euler‟s Crippling Load","Buckling Loads for columns with various end conditions","Empirical formulae for evaluation of Buckling Load","Curved Beams: Bending of beams with initial curvature","Unsymmetrical Bending","Shear Centre List of Experiments: Following experiments to be carried out: 1","Flexural rigidity of beams 2","Unsymmetrical bending 3","Buckling load of struts 4","Deflection of curved members 5","Verification of Maxwell Betti’s Reciprocal theorems"]}],"b":["Hibbeler, R. C. Mechanics of Materials. 6th ed. East Rutherford, NJ: Pearson Prentice Hall, 2004 2.Timoshenko, S. and Young, D. H., “Elements of Strength of Materials”, DVNC, New York, USA. 3.Jain, O.P. and Jain, B.K., “Theory & Analysis of Structures. Vol. I & II Nem Chand.","James M. Gere, Barry J. Goodno, “Mechanics of Materials” Cengage Learning","Coates, Coates, R.C., Coutie, M.G. & Kong, F.K., “Structural Analysis”, English Language Book Society & Nelson,1980.","Ghali, A. & Neville, M., “Structural Analysis”, Chapman & Hall Publications, 1974. 25","Jain, A.K. “Advanced Structural Analysis”, Nem Chand & Bros, Roorkee, India, 1996.","Kazmi, S. M. A., “Solid Mechanics” TMH, Delhi, India."]},"BCE 213":{"n":"Basic Surveying","c":"Professional Core (PC)","p":"NIL","k":"Lecture:3 ; Tutorial: 0 ; Practical:2","cr":4,"a":"Continuous assessment through tutorials, attendance home assignments, : methods quizzes, practical work, record, viva voce and one Minor tests and One Major Theory & Practical Examination","o":"The objective of this course is to develop an understanding of the basic : principles of surveying including the traditional measurements and representations and thereby preparation of maps and plans showing the relative position of existing features by which areas, volumes and other related quantities can be determined. The students are expected to be able to demonstrate the following knowledge,","co":["To understand the importance of surveying in the field of civil engineering","To be able to use conventional surveying tools such as chain/tape, compass, plane table, in the field of civil engineering applications","To know the basics of levelling and theodolite/ Tacheometer in elevation and angular measurements","To understand traversing and numerical aspects of traversing","To take accurate measurements, and carry out field booking, plotting and adjustment of errors in a traverse","Students learn to work with others, respect the contributions of others, resolve difficulties, and understand responsibility"],"u":[{"l":"I","t":"","h":9,"p":["Introduction and Principles of surveying","Plane and Geodetic Surveying","Control Points","Classification of surveys","Horizontal and Vertical Control Measurement by chain and tape","Sources of errors and precautions","Corrections to tape measurements","Compass surveying","Instruments","Surveyors and Prismatic compass","Bearing of survey lines","systems and conversions","Local attraction","Traversing","Latitude and departure","Traverse adjustment of closing errors","Computation of coordinates, Maps","their scales","referencing system and uses","plotting accuracy","Map coordinate system","projections and their types"]},{"l":"II","t":"Different methods of determining elevation; Spirit levelling","h":9,"p":["Definition of terms","Principle","Construction","Temporary adjustments of levels","Automatic levels","Digital Level","Levelling staves","Methods of spirit levelling","Booking and reduction of fields notes","Curvature and refraction","Reciprocal leveling","Trigonometric leveling - simple and reciprocal observations","Sources of errors and precision of leveling procedures","Contouring: Definition and characteristics of contours","contour interval","horizontal equivalent","Direct and Indirect methods of contouring","Use of contour maps","Digital Elevation Model"]},{"l":"III","t":"","h":9,"p":["Theodolite surveying","Vernier theodolite","Temporary adjustments","Measurement of horizontal and vertical angles","Methods of repetition and reiteration","errors in theodolite surveying","elimination of errors","working of Electronic Theodolites Tacheometric surveying","Principles","Methods – Stadia system – Fixed hair methods","Methods with staff held vertical and normal","Analytic lens","Subtense bar","Tangential method"]},{"l":"IV","t":"","h":9,"p":["Plane Table surveying","instruments and accessories","advantages and disadvantages of plane table surveying","methods – radiation","intersection","traversing","resection – Two- and three-point problems","errors in plane table surveying","Map preparation with plane table","Area and volume computation: area from latitude and departure","Simpson’s rule and Trapezoidal rule","Volume of level and two level sections","Trapezoidal and prismoidal formulae with corrections Basic Survey Lab/ Field Work Minimum Eight experiments are to be conducted from the following: 1","To study instruments used in chain surveying and to measure distance between two points by ranging","To determine the bearing of sides of a given traverse using Prismatic Compass","and plotting of the traverse","To find out the reduced levels of given points using level","(Reduction by Height of Collimation method and Rise and Fall Method)","To determine and draw the longitudinal and cross-section profiles along a given route","Practice for temporary adjustments of a Vernier Theodolite and taking horizontal (by Repetition and Reiteration methods) and Vertical angular measurements","Measurement of horizontal angles by Repetition method"]}],"b":["K.R. Arora, “Surveying”, Vol. I & II Standard Book House, Delhi,","B.C Punmia, “Surveying”, Vol. I, II & III Laxmi Publication","S.K. Duggal., Surveying Vol. I & II Tata McGraw Hill","A.M. Chandra,. “Plane Surveying”, New Age International Publishers, Delhi","R. Subramanian Surveying and Levelling Oxford University Press","W. Schofield Engineering Surveying Elsevier","Charles D Ghilani and Paul R Wolf Elementary Surveying Pearson","W. Schofield Engineering Surveying Elsevier","Charles D Ghilani and Paul R Wolf Elementary Surveying Pearson"]},"BCE 214":{"n":"Fluid Mechanics","c":"Professional Core (PC)","p":"NIL","k":"Lecture : 3, Tutorial : 0 , Practical: 2","cr":4,"a":"Continuous assessment through tutorials, attendance, home : methods assignments, quizzes, practical work, record, viva voce, One Minortests, and One Major Theory & Practical Examination","o":"1. Conceptualize of basic fluid properties including behavior of Newtonian fluid at rest and motion. 2. Apply mass, momentum, and energy equation in open channel flow. Estimate velocity distribution, Shear stress distribution and head loss in laminar and turbulent flow in pipes. 3. Analyze pipes in series and parallels, and water distribution networks. 4. Measure flow through pipes using various flow measuring devices. : The students are expected to be able to demonstrate the followingknowledge,","co":["Understand how to make measurements of flow.","Understand the type and nature of the flow.","Apply the principle of momentum, energy, and mass conservationin various fluid flows.","Explain and describe the difference between smooth and rough surface.","Figure out the problems in different pipe flows.","To understand the concept of boundary layer theory and flow separation."],"u":[{"l":"I","t":"Introduction","h":9,"p":["Fluids and continuum","Fluid Statics","Dimensional Analysis and Model Studies Introduction: Fluids and continuum","Physical properties of fluids: Viscosity","Compressibility","SurfaceTension","Capillarity","Vapor Pressure","Cavitation’s","Classification of fluids including rheological classification","Fluid Statics: Pressure-density-height relationship","Measurement of pressure by Manometers and mechanical gauges","Pressure on plane and curved surfaces","The Hydrostatic law","Total Pressure and Centre of pressure","Buoyancy","Stability of immersed and floating bodies"]},{"l":"II","t":"Fluid Kinematics and Fluid Dynamics-I Fluid Kinematics","h":9,"p":["Description of Fluid flow: Lagrangian and Eulerian approach","Types of fluid Flows: Steady and unsteady","Uniform and non-uniform","Laminar and turbulent flows","2 and 3- D flows","Streamlines","Path lines and Streak lines","Stream tube","Acceleration of a fluid particle alonga straight and curved path","Differential and Integral form of Continuity equation","Rotation","Vorticity and Circulation","Elementary explanation of Stream function and Velocity potential Fluid Dynamics-I: Concept of control volume and control surface","Reynolds Transport Theorem","Introduction to Naiver-Stokes Equations","Euler’s equation of motion along a streamline and its integration","Free and Forced vortex motion"]},{"l":"III","t":"Laminar and Turbulent Flows Laminar Flow","h":9,"p":["Reynolds Experiment","Equation of motion for laminar flow through pipes","Flow between parallel plates","Kinetic energy and Momentum correction factors","Stokes law","Flow through porous media","Darcy’s Law","Measurement of viscosity","Turbulent Flow: Turbulence","Equation for turbulent flow","Reynolds stresses","Eddy viscosity","Mixing length concept and velocity distribution in turbulent flow","Laminar sub-layer","Hydro-dynamically Smooth and rough boundaries","Local and average friction coefficient"]},{"l":"IV","t":"Flow Through Pipes","h":9,"p":["Nature of turbulent flow in pipes","Major and Minor energy losses","Hydraulic gradient and total energy lines","Flow in sudden expansion","contraction, bends","valves and siphons","Concept of equivalent length","Branched pipes","Pipes in series and parallel","Simple pipe networks and its analysis","Compressibility Effects in Pipe Flow: Transmission of pressure waves in rigid and elastic pipes","Water hammer EXPERIMENTS 1","To measure the surface tension of a liquid","To determine the metacentric height of a ship model experimentally","To study the transition from laminar to turbulent flow and to determine the lower critical Reynolds number","To determine the coefficients of velocity","contraction","and discharge of an orifice (or a mouthpiece) of a given shape","To plot the flow-net for a given model using the concept of electrical analogy","To calibrate an orifice meter and venturi meter and to study the variation of the coefficient of discharge with the Reynolds number","To calibrate and determine the coefficient of discharge for rectangular and triangular notches","To verify Darcy’s law and to find out the coefficient of permeability of the given medium","To verify the momentum equation","To determine the loss coefficients for the various pipe fittings"]}],"b":["R J Fox: Introduction to Fluid Mechanics","Hunter Rouse: Elementary Mechanics of Fluids, John Wiley and sons, Omc/ 1946.","L H Shames: Mechanics of Fluids, McGraw Hill, International student edition.","Garde, R J and A G Mirajgaonkar: Engineering Fluid Mechanics (including Hydraulic machines), second ed., Nemchand and Bros, Roorkee, 1983.","K L Kumar: Engineering Fluid Mechanics","Munson, Bruce R, Donald F Young and T H Okishi, Fundamentals of Fluid Mechanics, 2nd Ed,Wiley Eastern.","V Gupta and S K Gupta, Fluid Mechanics and its Applications, Wiley Eastern Ltd.","Som and Biswas: Introduction to Fluid Mechanics and Machines, TMH. Semester IV"]},"BSM 264":{"n":"Numerical Methods","c":"Basic Sciences & Mathematics (BSM)","p":"","k":"Lecture: 3, Tutorial : 0 , Practical: 2","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes methods and One Minor tests and One Major Theory & Practical Examination.","o":"The objective of this course is to introduce a broad range of numerical methods for solving mathematical problems that arise in science and engineering.","co":["After the completion of the course, the students will:","Demonstrate understanding of common numerical methods and how they are used to obtain approximate solutions to otherwise intractable mathematical problems.","To find the root of a function using Bisection, Regula falsi, Newton’s Method, Aitken’s method.","To interpolate a curve using Gauss, Newton’s interpolation formula.","To solve the first order boundary value problem.","To develop an understanding of the fundamentals in finding the numerical solutions of the system of equations and to find the eigen value of the matrix.","Demonstrate the concepts of numerical methods used for different applications."],"u":[{"l":"I","t":"Roots of equation","h":9,"p":["Bisection method","Regula Falsi Method","Secant Method","Fixed point Iteration Method","Newton Raphson Method","Modified Newton Raphson Method for Multiple roots","derivation of rate of convergence","Aitken Method"]},{"l":"II","t":"Solutions of system of Linear equations and Eigen Value problem","h":9,"p":["Linear equations: Direct method for solving systems of linear equations (Gauss elimination, Gauss Jordan, LU Decomposition, Cholesky Decomposition)","Iterative methods (Jacobi, Gauss Seidel, Relaxation method)","Algebraic Eigen value problem: Power method","Jacobi's method","Given’s method"]},{"l":"III","t":"Interpolations, and Numerical Integration","h":9,"p":["Relationship in various difference operators","Newton`s Forward and Backward Interpolation","Lagrange and Newton divided difference interpolation","Newton`s Cotes Formula","Trapezoidal Rule","Simpson’s 1/3 and 3/8 rule","Gauss Quadrature Formula","Chebyshev’s Formula","Piecewise Linear Interpolation","Cubic Spline Interpolation"]},{"l":"IV","t":"Numerical solution of Ordinary differential equations, and Difference Equation","h":9,"p":["Single Step Methods: Taylor","Picard, Euler","Modified Euler","and Runge-Kutta Fourth Order Methods","Multistep methods: Milne’s and Adam’s predictor and corrector methods","Difference equations and their solutions","Rules for finding the particular integral","EXPERIMENTS 1","To implement Regula-Falsi method to find root of algebraic equation","To implement Newton-Raphson method to find root of algebraic equation","To implement Newton’s Divided Difference formula to find value of a function at a point","To implement Numerical Integration by using Simpson’s one-third rule","To implement numerical solution of differential equation by Picard’s method","To implement numerical solution of differential equation by using Euler’s method","To implement numerical solution of differential equation by using Runge – Kutta Method"]}],"b":["M.K. Jain, S.R.K. Iyenger and R.K. Jain, Numerical Methods:, New Age Publishers.","P. Kandasamy, K.Thilagavathi, K.Gunavathi , Numerical Methods., S. Chand & Company.","B.S. Grewal; Higher Engineering Mathematics, Khanna Publishers, Delhi.","B.V. Ramana; Higher Engineering Mathematics, Tata Mc. Graw Hill Education Pvt. Ltd., New Delhi.","Brian Bradie, A Friendly Introduction to Numerical Analysis, Pearson Education, Asia, New Delhi"]},"BCE 261":{"n":"Hydraulic And Hydraulic Machines","c":"Professional Core (PC)","p":"Fluid Mechanics (BCE-214)","k":"Lecture : 3, Tutorial : 0 , Practical: 2","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods assignments, quizzes, practical work, record, viva voce, One Minor tests, and One Major Theory & Practical Examination","o":"1. Classify open channel flow and compute velocity distribution and pressure distribution in open channel flow. 2. Compute normal and critical depth and design of efficient channel. 3. Identify and compute backwater and drawdown profiles in open channel encountered in water resources project. 4. Study of characteristics and types of hydraulic jumps. 5. Locate the hydraulic jump encountered in design of hydraulic structures in an open channel. 6. Select and design hydraulic machines such as pumps and Turbines based on the system requirements. The students are expected to be able to demonstrate the following","co":["To identify the different types of flow in Open Channel.","To understand the concept of Hydraulic Jump.","To classify the various types of flow profiles","To study the characteristics of rotodynamic Pumps.","To understand the working of Turbines.","To have throughout knowledge on selection of turbines and pumps for practical purposes."],"u":[{"l":"I","t":"Introduction","h":9,"p":["Difference between open channel flow and pipe flow","geometrical parameters of a channel","continuity equation","Critical depth","concepts of specific energy and specific force","application of specific energy principles for the interpretation of open channel phenomena","flow through vertical and horizontal contractions","Uniform Flow: Chazy’s and Manning’s equations for uniform flow in an open channel","factors affecting Manning’s coefficient “n”","Velocity distribution","Velocity distribution coefficients","most efficient channel section"]},{"l":"II","t":"Gradually Varied Flow","h":9,"p":["Equation of gradually varied flow and its limitations","flow classification and surface profiles","integration of varied flow equation by graphical and numerical method and analytical and analysis of water surface profiles"]},{"l":"III","t":"Rapidly Varied Flow","h":9,"p":["Classical hydraulic jump","evaluation of the jump elements in rectangular and non-rectangular channels on horizontal and sloping beds","open channel surge","celerity of the gravity wave","Hydraulic Pumps: Rotodynamic pumps","classification on different basis","basic equations","Velocity triangles","manometric head","efficiencies","cavitation in pumps","characteristics curves"]},{"l":"IV","t":"Hydraulic turbines","h":9,"p":["Introduction","Rotodynamic Machines","Impulse turbines","Pelton Turbine","equations for jet and rotor size","efficiency","spear valve","reaction turbines","Francis and Kaplan type","Head on reaction turbine","unit quantities","similarity laws and specific speed","cavitation","characteristic curves EXPERIMENTS 1","To determine the Manning’s roughness coefficient “n‟ for the given flume","To determine the Chezy’s coefficient “C” for the given flume","To study the flow characteristics over a hump placed in an open channel","To study the flow through a horizontal contraction in a rectangular channel","To calibrate a broad-crested weir","To study the characteristics of free hydraulic jump","To study rotodynamic pumps and their characteristics 8","To study characteristics of reaction turbines (Francis/ Kaplan / Pelton)"]}],"b":["Jain A.K., Fluid Mechanics including Hydraulic Machine, Khanna publisher, 8th edition.","Modi P.N and S. M Seth, Hydraulics and Fluid Mechanics including Hydraulic machines, Standard BookPub; New Delhi.","Garde, R.J., “Fluid Mechanics through Problems”, New Age International","Streeter, V.L. and White, E.B., “Fluid Mechanics”, McGraw Hill, New York, 8th","Asawa, G.L., “Experimental Fluid Mechanics”, Vol.1, Nem Chand and Bros.,","Ranga Raju, K.G., Flow through open channels, T.M.H. 2nd edition","Rajesh Srivastava, Flow through Open Channels, Oxford University Press.","K. Subramanya, Flow through Open Channels, TMH","Vasundani, Hydraulic Machines"]},"BCE 262":{"n":"Structural Analysis","c":"Professional Core (PC)","p":"Structural Mechanics","k":"Lecture: 3, Tutorial : 1 , Practical: 0","cr":4,"a":"Continuous assessment through tutorials, assignments, quizzes and one Minor methods tests and One Major Theory Examination.","o":"The main objectives of the course are: : 1. To impart the principles of elastic structural analysis and behaviour of indeterminate structures and to get a feeling of how real-life structures behaves 2. To enable the student to get the knowledge about various methods involved in the analysis of indeterminate structures and apply those methods to evaluate the response of structures.","co":["Understand the concept of structural systems, loads, supports and displacements, statically determinate and indeterminate structural systems.","Apply a suitable analysis technique for statically indeterminate structures.","Analyze the beams and frames using the Classical Methods of analysis.","Develop and use the concept of influence line diagram for calculating maximum values of different structural quantities in a statically determinate structure, like BM, SF and displacement.","Compute reactive forces in the two hinged and three hinged arches using Conventional Methods of analysis of structures.","Evaluate the plastic behaviour of structural system based on the plastic theory"],"u":[{"l":"I","t":"Indeterminacy","h":9,"p":["static and Kinematic","Analysis of Indeterminate structures: Analysis of fixed beams","Continuous beams","and simple frames with and without translation of joint","Method of Consistent Deformation","Slope-Deflection method","Moment Distribution method","Strain Energy method"]},{"l":"II","t":"Moving loads for determinate beams","h":9,"p":["Different load cases","Influence lines for forces for determinate beams","Influence lines for indeterminate beams using Muller Breslau principle","Absolute maximum bending moment"]},{"l":"III","t":"","h":9,"p":["Analysis of Arches","Linear arch","Eddy‟s theorem","three hinged parabolic and circular arch","two hinged arch","spandrel braced arch","Influence lines for Arches and stiffening girders","Influence line diagrams for maximum bending moment","Shear force and thrust"]},{"l":"IV","t":"","h":9,"p":["Basics of Plastic Analysis","Plastic moment of resistance","Plastic section modulus","Shape factor","Load factor","Plastic hinge and mechanism","Plastic analysis of indeterminate beams and frames – Upper and lower bound theorems"]}],"b":["Theory and Analysis of Structures, Vol. I & II - O. P. Jain & B. K. Jain, Nem Chand & Bros., Roorkee.","Wang, C.K., Intermediate Structural Analysis, McGraw Hill.","Analyse Devadas Menon, “Structural Analysis”, Narosa Publishing House, 2008.","Hibbeler, R.C., Structural Analysis, 7th ed. East Rutherford, NJ: Pearson Prentice Hall, 2008.","Theory of Structures - S. P. Timoshenko and D. Young, McGraw Hill Book Publishing Company Ltd., New Delhi","Reddy. C.S., \"Basic Structural Analysis\", Tata McGraw Hill Education Pvt. Ltd., New Delhi, 2013.","Introduction to Matrix Methods of Structural Analysis by H. C. Martin, McGraw Hill Book Publishing Company Ltd.","Matrix Analysis of Framed Structures - Weaver and Gere.","Theory of Structures Vol. II - Vazirani & Ratwani. 4. Influence Line Diagrams - Dhavilkar.","Analysis of Statically Indeterminate Structures - P. Dayaratnam, Affiliated East- West Press.","Norris, C.H., Wilbur, J.B., and Utku, S., Elementary Structural Analysis, TMH,2003,1983"]},"BCE 263":{"n":"Highway Engineering","c":"Professional Core (PC)","p":"NIL","k":"Lecture:3, Tutorial: 0, Practical:2","cr":4,"a":"Continuous assessment through attendance, home assignments, quizzes, : methods practical work, record, viva voce and one Minor tests and One Major Theory & Practical Examination","o":"1. To introduce the students with the principles and practice of transportation : engineering which focuses on Traffic and Transportation Engineering and Highway Engineering. 2. To enable the students to have a strong analytical and practical knowledge of Planning, Designing, and solving the transportation problems. 3. To introduce the recent advancements in the field of Sustainable Urban Development, Traffic Engineering and Management, Systems Dynamics Approach to Transport Planning, Highway Design and Construction, Economic and Environment Evaluation of Transport Projects. 4. To strength the students’ knowledge and technical know-how to be efficient Transport Engineers.","co":["Understanding the types of pavements and their components.","Materials used for highway construction.","Methods of design of flexible and rigid pavement including IRC method.","Construction and maintenance of different types of pavements","Basic concept about highway engineering","Various types of intersection and their suitability."],"u":[{"l":"I","t":"Introduction","h":9,"p":["Role of transportation","Mode of transportation","History of road development","Nagpur Road plan","Bombay Road plan & 3rd 20-Year-Old Road Plan","Road Types and Pattern","Geometric design: cross-sectional elements","camber","shoulder","sight distance","horizontal curves","super elevation","extra widening","transition curves and gradient","vehicle curves","summit","and valley curves"]},{"l":"II","t":"Traffic Engineering","h":9,"p":["Traffic characteristic","volume studies","speed study","capacity","density","traffic control devices, signs","signals","design of signals","Island","Intersection at grade and grade separated intersections","design of rotary intersection"]},{"l":"III","t":"Design of Highway Pavement","h":9,"p":["Types of pavements","Design factors","Design of flexible pavements by CBR method (IRC: 37-2001, 2012 and 2018)","Design of rigid pavement","Westergaard theory","load and temperature stresses","joints","IRC method of rigid pavement design","(IRC 58-2002, 2011 and 2015)"]},{"l":"IV","t":"Road Construction Methods","h":9,"p":["WBM, WMM","Surface Dressing","Bituminous carpeting","Bituminous Bound Macadam and Asphaltic Concrete","Cement Concrete Road construction","List of EXPERIMENTS 1","Impact value test of Aggregate 2","Shape test (Flakiness, Index, Elongation Index) of Aggregate 3","Crushing value test of Aggregates 4","Los Angeles Abrasion Value test for Aggregate 5","Stripping test of Bituminous Sample","Ductility test of Bituminous Sample 7","Penetration test of Bituminous Sample 8","Softening point test of Bituminous sample 9","Flash and Fire Test of Bituminous Sample 10","Classified Both directional Traffic Volume study 11","Traffic speed study (using radar speedometer)","Determination of Marshall Stability Value 13","CBT Test for soil 14","Proctor Test for soil"]}],"b":["Highway Engineering by S. K. Khanna and C.E.G. Justo, Nem Chand & brothers, Roorkee.","Traffic Engineering by L. R. Kadiyali, Khanna Publishers, New Delhi.","Principles of Transportation and Highway Engineering by G.V. Rao, Tata McGraw Hill, New Delhi.","Highway and Traffic Engineering by Subhash C. Saxena, CSB Publishers and Distributers Ltd. New Delhi.","Transportation Engineering by James S. Banks Tata McGraw Hill, New Delhi.","Transportation Engg. by Papakosta and P.D. Prevedouros, Prentice Hall India, New Delhi.","Principles of Transportation Engineering by P. Chakraborti and A. Das, Prentice Hall India, New Delhi.","Highway Material Testing S.K. Khanna and C.E.G. Justo. 5. Highway Material Testing by A.K. Duggal. Semester – V"]},"BCE 301":{"n":"Foundation Engineering","c":"Professional Core (PC)","p":"Soil Mechanics","k":"Lecture : 3, Tutorial : 1 , Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods : assignments, quizzes and One Minor Test and One Major Theory Examination","o":"To enable students to understand soil exploration and in-situ testing : techniques, lateral earth pressure and retaining systems, shallow foundation design and settlement behaviour, and pile foundation performance, including soil–pile interaction.","co":["Explain and select appropriate soil exploration, sampling, and in-situ testing techniques for geotechnical site characterization.","Analyze arching behaviour and compute lateral earth pressures using Rankine and Coulomb earth pressure theories.","Evaluate the stability and performance of retaining structures, including reinforced earth walls.","Apply bearing capacity theories and settlement analysis methods for the design of shallow foundations.","Assess pile foundation performance considering axial, lateral, and uplift loading conditions.","Interpret field test results and apply them in practical geotechnical design and decision-making."],"u":[{"l":"I","t":"","h":9,"p":["Introduction to soil exploration","planning of soil exploration","methods of exploration and boring","soil sampling and samplers","sampling methods and sample disturbance","trial pits and borehole planning","depth of exploration","field versus laboratory testing","Penetration test, SPT, SCPT, DCPT","penetrometer testing","pressure meter testing","geophysical methods","rock coring","borehole logging","soil exploration reporting"]},{"l":"II","t":"","h":9,"p":["Arching in soils","theories of arching","braced excavations","earth pressure against bracings in cuts","heave of the bottom of cuts in soft clays","Concept of lateral earth pressure: at-rest","active","and passive pressures","Rankine’s theory of active and passive pressure","Generalized case for Rankine active and passive pressures","Rankine’s pressure for c′– φ′ soil with inclined backfill","Coulomb’s active & passive pressure","Graphical solution for Coulomb’s active earth pressure","and common types of retaining walls","including reinforced earth walls"]},{"l":"III","t":"","h":9,"p":["Introduction to shallow foundations","bearing capacity of shallow foundations","settlement of shallow foundations","allowable bearing pressure","proportioning of footings","ultimate soil-bearing capacity concepts","Terzaghi’s bearing capacity equation","effect of groundwater table","factor of safety in foundation design","generalized bearing capacity equation"]},{"l":"IV","t":"","h":9,"p":["Introduction to pile foundations","uses and types of piles","pile construction","pile driving methods","pile load capacity in compression","static pile load formulae","load testing on piles","dynamic pile formulae","correlation with penetration test data","group action of piles","negative skin friction","laterally loaded piles","and piles subjected to uplift loads"]}],"b":["K.R. Arora — Soil Mechanics and Foundation Engineering, Standard Publishers & Distributors, New Delhi.","Alam Singh — Modern Geotechnical Engineering, Asia Publishing House, New Delhi.","Gopal Ranjan and A.S.R. Rao — Basic and Applied Soil Mechanics, New Age International (P) Ltd.","Braja M. Das — Principles of Geotechnical Engineering, Cengage Learning.","I.H. Khan — Textbook of Geotechnical Engineering, Prentice-Hall of India Ltd., New Delhi.","C. Venkataramaiah — Geotechnical Engineering, New Age International (P) Ltd., New Delhi.","J.E. Bowles — Foundation Analysis and Design, McGraw-Hill, New Delhi.","V.N.S. Murthy — Soil Mechanics and Foundation Engineering, CBS Publishers & Distributors."]},"BCE 302":{"n":"Water And Wastewater Engineering","c":"Professional Core (PC)","p":"NIL","k":"Lecture : 3; Tutorial : 0; Practical: 2","cr":4,"a":"Continuous assessment through attendance, home assignments, methods quizzes, viva voce, One Minor Test, and One Major Theory and Practical Examination","o":"To make the students understand the quality parameters of water for various application and treatment of waste water.","co":["Design the water supply and wastewater treatment systems.","Determine the treatment efficiency of treatment units","Determining water quality parameters","Methods for determining wastewater quality parameters","Methods for forecasting population and estimating water demand and waste water generation","Knowledge about working of wastewater treatment methods"],"u":[{"l":"I","t":"Water treatment plant","h":9,"p":["Layout plan and section of water treatment plant","Estimation of raw water discharge for treatment plant","Design period","and factors considered for selection of design period","Treatment plant site selection","factors considered","future stages of expansion","selection of treatment train","Collection and conveyance of raw water from source: Intakes","types of intakes","conveyance of water","design of pumps and gravity and rising mains"]},{"l":"II","t":"Water treatment processes and treatment units","h":9,"p":["Plain sedimentation","aeration","sedimentation tank & its design","sedimentation with coagulation","types of coagulants","optimum dose of coagulants","mixing devices","design of flocculation unit","theory of filtration","types of filters and their comparison","design of rapid sand filter","washing of filter","methods of disinfection","methods of removing hardness Computation of dose of chemicals for removal of hardness"]},{"l":"III","t":"Collection of sewage &estimation of its discharge","h":9,"p":["Different types of sewers","sewerage systems","variation in sewage flow","sewer appurtenance","estimation of wastewater discharge in a sewer in sewerage system","estimation of storm water discharge in urban area","separate and combined sewerage systems","laying and testing of sewers"]},{"l":"IV","t":"Unit operations/ processes for wastewater treatment","h":9,"p":["Layout plan and section of municipal wastewater treatment plant","Physical unit operation screening","flow equalization","mixing","flocculation","sedimentation","Chemical unit processes-chemical precipitation","Biological unit processes: Aerobic attached growth and aerobic suspended growth treatment processes","anaerobic suspended growth treatment processes","an aerobic suspended growth treatment processes","low cost sanitation systems","septic tanks","soak pit","stabilization ponds","List of Experiments 1","Determination of pH Value of a given water sample","Determination of Acidity in water Sample","Determination of Alkalinity in water Sample","Determination of Chlorides in a given water Sample","Determination of Total Hardness and Carbonate Hardness in a given water sample","Determination of Dissolved Oxygen (D.O.) in a given water sample","Determination of Total Solids","Suspended & Dissolved Solids in a given water sample","Determination of Sulphate in a given water sample","Determination of Turbidity in a given water sample by Nephelo-Turbidimeter","Determination of Coli-form Bacteria in a given water sample by Most Probable Number (M.P.N.) test","Determination of Chemical Oxygen Demand (COD) of a given sample of sewage","Determination of Bio-Chemical Oxygen demand (BOD) of a given sample of sewage"]}],"b":["Environmental engineering volume 1 and 2 by S.K.Garg, Khanna publisher 2.","Water supply and sanitary engineering by G.S.Birdie and J.S.Birdie","Environmental pollution engineering by C.S. Rao wiley eastern","Water supply and wastewater engineering by B.S.N Raju, Tata McGraw hill, New Delhi","H.S. Peavy, D.R.Row & G.Tchobanoglous, environmental engineering,Mc Graw Hill Intranational Edition","Viesman, Hammer and Chadik, water supply and pollution control, PHI Publication.","M.L.Devis and D.A.Cornwell,Introdution to environmental engineering:-2nd edition-1997,Mc Graw Hill Intranational Edition","Metcalf and eddy,(revised by G.Tchobanoglous) Wastewater Engineering: Treatment, disposal reuse, Tata-Mc Graw Hill, New Delhi"]},"BCE 303":{"n":"Design Of Concrete Structures","c":"Professional Core (PC) Engineering Geology & Building Material (BCE-152)","p":"","k":"Lecture: 3, Tutorial: 0, Practical: 2","cr":4,"a":"Continuous assessment through, attendance, home assignments, quizzes, methods : practical work, record, viva voce and One Minor Test and One Major Theory & Practical Examination","o":"To introduce the students to the fundamentals of reinforced concrete : design with emphasis on the design of rectangular and T beams, short and slender columns, slabs, and footings and foundations. In addition, student will learn how to analyze and design reinforced concrete structural members under bending, shear, and/or axial loads according to the IS code requirements. The students are expected to be able to demonstrate the following","co":["Understand various philosophies for design of reinforced concrete.","Design one way and two-way slab by limit state method.","Understand the provisions of IS 456:2000 for design of R.C.C. Columns with and without eccentricity.","To use Design Chart for design of columns subjected to uni- axial biaxial bending","Know the method of pre-stressing, their advantages, and losses in pre-stress.","Able to analyses pre-stressed rectangular and T-section."],"u":[{"l":"I","t":"","h":9,"p":["Nature of Stresses in flat slabs with and without drops","coefficient for design of flat slabs","reinforcement in flat slabs","(IS Code Method)","Structural behaviour of footings","design of footing for a wall and a single column","combined rectangular and trapezoidal footings","Design of strap footing"]},{"l":"II","t":"","h":9,"p":["Structural behaviour of retaining wall","stability of retaining wall against overturning and sliding","Design of T-shaped retaining wall","Concept of Counter fort retaining wall, Loads","forces and I","bridge loadings","Design of R","slab culvert"]},{"l":"III","t":"","h":9,"p":["Design criteria","material specifications and permissible stresses for tanks","design concept of circular and rectangular tanks situated on the ground / underground","design of overhead tanks"]},{"l":"IV","t":"","h":9,"p":["Advantages of pre-stressing","methods of pre-stressing","losses in pre-stress","analysis of simple prestressed rectangular and T-section LIST OF EXPERIMENTS 1","Comparison of strength of cylinder and cube strength of concrete","Modulus of rupture of concrete","Study of admixtures and their effect on workability","Study of effect of w/c ratio on strength of concrete","Study of variation of strength of cement concrete and determination of standard deviation and gradation of concrete","Study and draw compression test diagram of concrete","To determine quality/ strength of concrete by using Rebound hammer/ Ultrasonic pulse velocity instruments"]}],"b":["and References","Nilson, A. H. Design of Concrete Structures. 13th edition. McGraw Hill, 2004","Wang C-K. and Salmon, C. G., Reinforced Concrete Design, 6th Edition, Addison Wesley, New York","Fundamentals of Reinforced Concrete by M L Gambhir, PHI 4. IS:456-2000, IS:10262-2009","Concrete Structure – Limit State Design by A.K. Jain, Nem Chand & Bros","Reinforced Concrete Design by S. Unnikrishna Pillai & D. Menon, Tata McGraw."]},"BHS 303/353":{"n":"Industrial/Organizational Psychology","c":"HSSE","p":"NIL","k":"Lecture:3, Tutorial:1, Practical:0","cr":4,"a":"Continuous assessment through One test, teacher's assessment methods : (quiz, tutorial.assignment, attendance), and One Major Theory Examination.","o":"1. I. Provide students with a foundational understanding of the principles. theories, and research methods in the field of I/O psychology. 2. To help students to understand the process of personnel management (selection. training, performance appraisal, development) while also introducing the psychological assessment methods crucial for effective personnel selection, job analysis, and employee evaluation. 3. To help students to analyse the multifaceted influences on workplace behaviour (motivation, job satisfaction, leadership dynamics, organizational culture) and to explore organizational dynamics (structure, communication patterns, decision-making processes), and strategies for effective change management. 4. To provide opportunities for students to apply I/O psychology principles to real-world scenarios. : The students will be able to demonstrate the following","co":["I . Demonstrate a clear understanding of key concepts and theories in the field of I/O psychology, including their historical development and contemporary relevance.","2. Identify and propose solutions to workplace problems using evidencebased approaches grounded in I/O psychology principles.","Apply knowledge and skills acquired in the course to real- world situations. such as improving employee performance, enhancing team effectiveness. and promoting organizational change.","Demonstrate awareness of ethical issues and professional standards. and apply ethical principles to decision-making in the workplace"],"u":[{"l":"I","t":"Introduction to Industrial Psychology","h":9,"p":["Definition, scope","brief history","various sub divisions","Research in Industrial Psychology","Scientific Management Theory","Human Relations School","Managerial Roles","Functions & Skills","Effective vs Successful managers","Job Analysis and Evaluation","Employee Selection: Recruitment","Realistic Job Previews","Effective Employee Selection Techniques","Job Search Skills","Employee Selection: References and Testing"]},{"l":"II","t":"","h":9,"p":["Evaluating Employee Performance","Designing & Evaluating Training Systems","Performance Management: Employee Retention","Engagement","and Careers","Organizational Development and Change Management: Employee Relations: Ethics and Employee Rights","Labor Relations and Collective Bargaining","Managing Global Human Resources","Managing l•luman Resources in Small and Entrepreneurial Firms"]},{"l":"III","t":"Motivation","h":9,"p":["Concept","theories and application","Emotions at workplace","Attitudes and Job Satisfaction","Perception: Components","process","factors that influence it","person perception","individual decision making: Personality: Determinants","theories and measurement","Stress: Sources","consequences and management'"]},{"l":"IV","t":"Foundations of Group Behavior","h":9,"p":["Types groups","properties","decision making in groups","Understanding work teams: Types","creating effective teams","Communication: Functions","process","modes and organizational communication","Leadership: Concept","theories","finding and creating effective leaders","Power & Politics","Conflict & Negotiation"]}],"b":["Aamodt. M. G. (2010). Industrial/Organi:ationaI Psychology: An Applied Approach. Wadsworth Cengage Learning.","Aswathappa, K. (2008). Human Resource Management. Tata McGraw Hill.","Chitale. A, K., Mohanty, R. P., & Dubey, N. R. (2019). Organizational Behavior: Text and Cases. Préntice Hall India.","Dessler, G., & Varrkey, B. (2020). Human Resource Management. Pearson.","Luthans, F. (2010). Organizational Behavior. McGraw Hill.","McShane, S. Glinow, M. A. V., & Rai, H. (2022). Organizational Behavior. McGraw Hill.","Muchinsky, P. M. (2006). Psychologv applied to work: An introduction 10 industrial and organizational psychology. Hypergmphic Press.","Pareek, U. (2004). Understanding Organisational Behaviour. Oxford University Press.","Robbins, S. P., Judge, T.A., & Volum N. (2019). Organizational Behavior. Pearson."]},"BCE 351":{"n":"Design Of Airport, Docks And Harbor","c":"Professional Core (PC)","p":"NIL","k":"Lecture : 3; Tutorial : 1; Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods assignments, quizzes, viva voce, One Minor Test, and One Major Theory Examination","o":"To introduce the students about airport planning, design, construction and planning design principles of seaport.","co":["Gain an insight on the planning and site selection of Airport Planning and design.","Knowledge on Design of various Airport components.","Analyze and design the elements for orientation of runways and passenger facility systems.","Understand the various features in Harbors and Ports, their construction, coastal protection works.","Knowledge on various Environmental Regulations and Acts.","Knowledge about sea port regulations and EIA"],"u":[{"l":"I","t":"Airport Planning","h":9,"p":["Air transport characteristics - airport classification – ICAO - airport planning: Site selection typical Airport Layouts","Case Studies","parking and Circulation Area Airport Components: Airport Classification","Planning of Airfield Components – Runway","Taxiway, Apron","Hangar- Passenger Terminals- Geometric design of runway and taxiways-Runway pavement Design- Difference between Highway and airport pavements- Introduction to various design methods- Airport drainage"]},{"l":"II","t":"Airport Design","h":9,"p":["Runway Design: Orientation","Wind Rose Diagram","Problems on basic and Actual Length","Geometric Design – Elements of Runway Design – Airport Zones – Passenger Facilities and Services – Runway and Taxiway Markings- Air Traffic Airport Classification","Planning of Airfield Components – Runway","Taxiway, Apron","Hangar- Passenger Terminals- Geometric design of runway and taxiways","Runway pavement Design- Difference between Highway and airport pavements- Introduction to various design methods- Airport drainage","Control Tower- Instrumental Landing"]},{"l":"III","t":"Seaport Components and Construction","h":9,"p":["Definition of Basic Terms: Harbor, Port","Satellite Port","Docks- Dry and Floating Dock","Waves and Tides – Planning and Design of Harbors: Harbour Layout and Terminal Facilities – Coastal Structures: Piers","Break waters","Wharves","Jetties, Quays","Spring Fenders","Dolphins Floating Landing Stage – Navigational Aids-Inland Water Transport"]},{"l":"IV","t":"Seaport Regulations and EIA","h":9,"p":["Wave action on Coastal Structures and Shore Protection and Reclamation – Coastal Regulation Zone","2011-EIA – methods of impact analysis and its process"]}],"b":["1. Khanna.S.K. Arora.M.G and Jain.S.S, Airport Planning and Design, Nemachand and Bros, Roorkee,1994","Robert Honjeff and Francis X.Mckelvey, \"Planning and Design of Airports\", McGraw Hill, New York,1996 2. Richard De Neufille and Amedeo Odoni, \"Airport Systems Planning and Design\", McGraw Hill, New York,2003","Subramanian K.P., Highways, Railways, Airport and Harbour Engineering, Sci-tech Publications (India), Chennai, 2010","Venkatramaiah. C., Transportation Engineering-Vol.2 Railways, Airports, Docks and Harbours, Bridges and Tunnels.,Universities Press (India) Private Limited, Hyderabad, 2015.","2. Mundrey J S, Railway Track Engineering, McGraw Hill Education ( India) Private Ltd, New Delhi, 2013."]},"BCE 352":{"n":"Construction Technology And Management","c":"Professional Core (PC)","p":"NIL","k":"Lecture :3, Tutorial :1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods assignments, quizzes and one Minor test and One Major Theory Examination","o":"This course aims at the following educational objectives: To plan Bar : Chart, CPM chart, PERT chart material requirement schedule, Manpower schedule, Machinery Schedule, Construction Management, to analyze, evaluate and design construction contract documents. The students are expected to be able to demonstrate the following","co":["Understand the use of advanced materials in construction projects","Plan and develop management solutions to construction projects.","Evaluate construction project economics, cost-benefit analysis and breakeven analysis.","Understand the principles of project management, resource management and inventory","Understand the different types of contracts in construction arbitration and legal aspects and its provision","Analyse the different aspects of the contracts and their legal provisions."],"u":[{"l":"I","t":"Neo Construction Materials Special Concretes","h":9,"p":["High strength concrete","Effect of RHA on the properties of HSC","High performance concrete –applications","Self-Compacting Concrete","Concrete made with waste rubber","Special Concretes","Sulfur Concrete","Ferro cement","Geo synthetics","Nano Concrete","Changes in concrete with respect to time"]},{"l":"II","t":"Elements of Management","h":9,"p":["Project cycle","Organisation","planning","scheduling monitoring updating and management system in construction","Network Techniques: Bar charts","milestone charts","work break down structure and preparation of networks","Application of network Techniques like PERT, GERT","CPM AON and AOA in construction management","Project monitoring","cost planning","resource allocation through network techniques","Line of balance technique"]},{"l":"III","t":"Engineering Economics","h":9,"p":["Time value of money","Present economy studies","Equivalence concept","financing of projects","economic comparison present worth method Equivalent annual cost method","discounted cash flow method","analytical criteria for postponing of investment retirement and replacement of asset","Depreciation and break even cost analysis"]},{"l":"IV","t":"Contract Management","h":9,"p":["Legal aspects of contraction","laws related to contracts","land acquisition","labour safety and welfare","Different types of contracts","their relative advantages and disadvantages","Elements of tender preparation","process of tendering pre-qualification of contracts","Evaluation of tenders","contract negotiation and award of work","monitoring of contract extra items","settlements of disputes","arbitration and commissioning of project"]}],"b":["Engineering Drawing-Bhat, N.D.& M. Panchal, Charotar Publishing House, 2008","Callahan, M. T., Quackenbush, D. G., and Rowings, J. E., Construction Project Scheduling, McGraw-Hill, New York, 1992.","Cleland, D. I. and Ireland, L. R., Project Management: Strategic Design and Implementation 4th Edition, McGraw-Hill, New York, 2002.","Danny Myers, Construction Economics: A New Approach, Taylor and Francis Publisher, 2004.","Harold Kerzner Project Management CBS Publisers & Distributors 2nd Edition","Kumar Neeraj Jha, Construction Project Management, Pearson Publication"]},"BCE 353":{"n":"Water Resources Engineering","c":"Professional Core (PC)","p":"NIL","k":"Lecture : 3, Tutorial : 1 , Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, methods : home assignments, quizzes, viva voce, One Minor Test, and One Major Theory Examination","o":"To understand and learn about different hydrological processes and : design of unlined canals.","co":["Design of water management systems utilizing the basic principles of the hydrologic cycle.","Apply knowledge for efficient design methods for rapid conveyance of water with lesser loss inirrigation canals.","To demonstrate a knowledge of the multi-disciplinary nature of water resources engineering.","Realize the importance of optimal water use for growing the crops, and apply methods for saving land from water-logging.","To demonstrate technique involved in making design problems of canal and related structures tobe safe and cost- effective.","Apply the knowledge in the design of hydraulic structures to be constructed for conveyance of irrigation water."],"u":[{"l":"I","t":"","h":9,"p":["Introduction– Irrigation","water resources of India","need of irrigation in India","development of irrigation in India","impact of irrigation on human environment","irrigation systems: minor and major irrigation projects","command area development","Hydrology– hydrologic cycle","rainfall-runoff process","factors affecting runoff","runoff hydrograph","runoff computations","flood discharge calculations for ungauged and gauged sites","unit hydrograph method","S -hydrograph","different methods of flood forecasting"]},{"l":"II","t":"Water requirement of crops","h":9,"p":["Crops and crop seasons in India","cropping pattern","Quality of irrigation water","Soil-water relationships- soil characteristics significant from irrigation considerations","root- zone soil water","infiltration","consumptive use","irrigation requirement","frequency of irrigation","duty and delta","Methods of applying water to the fields: surface","sub-surface","sprinkler","and trickle/drip irrigation types and its design and drawing"]},{"l":"III","t":"Irrigation channels","h":9,"p":["Sediment threshold and method of calculation","and design of lined and unlined channels","Silt Theories: Kennedy’s","Lacey’s","Tractive force Ackers and White and Engelund & Hansen method","Design procedure for irrigation channels","Longitudinal cross section","Schedule of area statistics and channel dimensions","use of Garret’s Diagrams in channel design","cross sections of an Irrigation channel","Computer programs for design of channels","Lining of Irrigation Canals: Advantages and types","factors for selection of a particular type","design of lined channels","cross section of lined channels","Economics of canal lining","Water- logging: Definition","effects","causes and anti-water logging measures","Drainage of water- loggedland","Types of drains open and closed","spacing of closed drains"]},{"l":"IV","t":"Irrigation Outlets","h":9,"p":["Requirements, types","non-modular","semi-module and rigid module","selection criterion","River Training: Objective and need","classification of rivers","and river training works","Lane Weight Balance Theory","meandering","stages","different methods of river training","design and drawing with field example problem as per IS code and IRC","bank protection","Methods for measurement of discharge"]}],"b":["Irrigation Engg. and Hydraulic Structures -.K. Garg, Khanna Publishers.","Irrigation and water Power engineering - B.C. Punmia, Laxmi Publications.","Engineering Hydrology - K. Subramanya, TMH.","Irrigation Water Power and Water Resource Engg. - K.R. Arora.","Water Resources Engg. - Larry W. Mays, John Wiley India.","Water resources Engg. - Wurbs and James, John Wiley India.","Water Resources Engg. - R. K. Linsley, McGraw Hill.","Irrigation and water Resources Engg. - G L Asawa, New age International Publishers.","Irrigation Theory and practices - A.M. Michel."]},"BCE 354":{"n":"Advanced Surveying","c":"Professional Core (PC)","p":"Basic surveying (BCE 213)","k":"Lecture: 3, Tutorial:0, Practical:2","cr":4,"a":"Continuous assessment through attendance, home assignments, methods quizzes, practical work, record, viva voce and One Minor Test and One Major Theory & Practical Examination","o":"The main objectives of the course are: : 1. To make students aware with different advance surveying methodologies applied to carry out large scale survey works using modern techniques such as total stations, photogrammetry remote sensing etc. 2. To make students able to set out curves, buildings, and culverts for construction projects. : The students are expected to be able to demonstrate the following","co":["To understand the method of triangulation and the concept of photogrammetry and photo interpretation","To learn on the principles of Electronic distance measurements, Total station and their accuracy","To analyse the precision and accuracy of observations and least square adjustment of triangle and quadrilateral without central station.","To compute and set different types of curves.","To be aware of modern advanced surveying techniques such as Remote sensing, GPS and GIS","Students learn to work with others, respect the contributions of others, resolve difficulties, and understand responsibility"],"u":[{"l":"I","t":"","h":9,"p":["Triangulation","different networks","orders and accuracies","inter visibility and height of stations","signals and towers","Baseline measurement","instruments and accessories","extension of baseline","satellite stations","Reduction to centre","Method of observation equations – conditioned quantities","method of correlates","adjustment of simple triangle and quadrilateral network without central station","Principle of Electronic Distance Measurement","Modulation","Types of EDM instruments","Distomat","Total Station – Parts of a Total Station – Accessories – Advantages and Applications","Field Procedure for total station survey","Errors in Total Station Survey","Trilateration"]},{"l":"II","t":"","h":9,"p":["Curve setting – Horizontal curves - Elements and Methods of setting out simple","compound and Reverse curves","Transition curve (true spiral, cubic spiral and cubic parabola)","Vertical curve (parabola)","Setting out of buildings – culverts – tunnels"]},{"l":"III","t":"","h":9,"p":["Photogrammetry – Terrestrial and Aerial Photogrammetry","Geometry and scale of vertical photographs","relief and tilt displacement","Stereoscopy and elevation of a point – Flight Planning for vertical photographs– Planimetric mapping from vertical photos –– Fundamentals of aerial photo interpretation","mosaics","map substitutes"]},{"l":"IV","t":"","h":9,"p":["Global Positioning Systems- Segments","GPS measurements","errors and biases","Surveying with GPS","Co-ordinate transformation","accuracy considerations","Remote Sensing- Introduction – Remote sensing concepts","Electromagnetic Spectrum","interaction of electromagnetic radiation with the atmosphere and earth surface","remote sensing data acquisition: platforms and sensors","visual image interpretation","digital image processing","Geographic Information System- Basic concepts of geographic data","GIS and its components","Data models","Topology","Process in GIS: Data capture","data sources","data encoding","geospatial analysis","GIS Applications Experiments 1","Demonstration and working on Total Station 2","To layout a precise traverse in a given area and to compute the adjusted coordinates of survey stations 3","Aerial Photo interpretation 4","Demonstration and working with Mirror stereoscopes","Parallax bar and Aerial photographs","Visual Interpretation using false colour composite 6","Demonstration and practice work with handheld GPS"]}],"b":["K.R. Arora, “Surveying” , Vol. I & II Standard Book House, Delhi,","B.C Punmia, “Surveying”, Vol. I, II & III Laxmi Publications New Delhi,","S.K. Duggal., Surveying Vol. I & II Tata McGraw Hill","A.M. Chandra., “Plane Surveying”, New Age International Publishers, Delhi","R. Subramanian Surveying and Levelling Oxford University Press","W. Schofield Engineering Surveying Elsevier","Charles D Ghilani and Paul R Wolf Elementary Surveying Pearson"]},"BHS 301/351":{"n":"Engineering And Managerial Economics","c":"HSSE","p":"NIL","k":"Lecture:3, Tutorial:1, Practical:0","cr":4,"a":"Continuous assessment through One test, teacher's assessment methods (quiz, tutorial. assignment, attendance), and One Major Theory Examination.","o":"1. To make fundamentally strong base for decision making skills by applying the concepts of economics. 2. Educate the students on how to systematically evaluate the various cost elements of a typical manufactured product or service, with a view to determining the price offer. 3. Prepare engineering students to analyze profit/revenue data and carry out make economic analysis in the decision-making process to justify or reject alternatives/projects. 4. Be equipped with the tools necessary in forecasting product demand. 5. Understand and analyze the macro environment affecting the business decision making. 6. To make students understand basic elements of Indian Economy.","co":["The students will be able to demonstrate the following knowledge, skills, and attitudes upon completion of the course: -","Students will acquire basic knowledge in Engineering & managerial economics, which allows students to gain theoretical and empirical skill of economics.","To make Engineering students prepared for economic empowerment so that they could manage their wealth, help them in starting their own business or during managerial period.","Students will develop Interdisciplinary skills which can help them to thrive in the life- long changing environment in various fields of Industry of Economics.","Students will acquire practical knowledge of economics, the kind of markets, cost theory, various issues of demand and other major economic concepts.","Able to explain succinctly the meaning and definition of managerial economics; elucidate on the characteristics and scope of managerial economics.","Able to describe the techniques of managerial economics.","Able to explain the applications of managerial economics in various aspects.","To learn about the management and economics of the industrial environment."],"u":[{"l":"I","t":"","h":9,"p":["Introduction to the Managerial Economics- Economics and Managerial economics","Review of Economic Terms and Economic Rationality","Law of diminishing marginal utility","Theories of Profit","Decision making Process with reference to Managerial economics","Managerial Economics and its application in engineering perspective"]},{"l":"II","t":"Theory of Demand","h":9,"p":["Law of Demand","Demand Function","Types of Demand","Demand Schedule","Demand Curve","Shift in Demand Curve","Factors affecting Demand","Elasticity of Demand","Theory of consumer behavior","Theory of Supply: Law of Supply","Supply Function","Supply Schedule","Supply Curve","Factors","affecting Supply"]},{"l":"III","t":"Demand Forecasting","h":9,"p":["Meaning","significance and methods of demand forecasting","production function","Laws of returns to scale & Law of Diminishing returns scale","An overview of Short and Long run cost curves – fixed cost","variable cost","average cost","marginal cost","Opportunity cost"]},{"l":"IV","t":"Market Structure","h":9,"p":["Perfect Competition","Imperfect competition – Monopolistic","Oligopoly","duopoly sorbent features of price determination and various market conditions","National Income","Inflation and Business Cycles: Concept of N","and Measurement","Meaning of Inflation","Type causes & prevention methods","Phases of business cycle"]}],"b":["Mote, Paul and Gupta, Managerial Economics, T M H, New Delhi.","H L Ahuja, Managerial Economics, S Chand & Co. New Delhi","P.L. Mehta, Managerial Economics, Analysis, Problems and Cases, Sultan Chand Sons, New Delhi.","Prof. D.N. Kakkar , Managerial Economics for Engineering, PHI publication, New Delhi","Varshney and Maheshwari, Managerial Economics, Sultan Chand and Sons, New Delhi."]},"BMS-301/351":{"n":"Principles of Industrial Management","c":"Management (M)","p":"NIL","k":"Lecture: 3, Tutorial: 1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, methods quizzes and one Minor Test and one Major Theory Examination.","o":"To enable students to develop operational skills and analyzing different situations in the industrial scenario having limited resources and obtain the optimal solution with and without constraints.","co":["Students should be able to become efficient and acquire acumen for more profitable business practices.","Students should be able to understand the importance of better customer service and product quality.","Students should be able to make work safer, faster, easier, and more rewarding.","Students should be able to help the industry in the production of more products that possess all utility factors","Students should be able to reduce costs associated with new technologies.","Students should be able to understand different principle of Industrial Management."],"u":[{"l":"I","t":"Introduction of Industrial Management","h":null,"p":["Definition","Nature and Scope of Management","Process of management","Elements of management","Definition of industrial management","Scope and Application of industrial management","Plant Location and Layout: Factors affecting Plant Location","Objectives and Principles of Plant Layout","Types of Plant-Layout"]},{"l":"II","t":"Work Analysis and Measurement","h":null,"p":["Design of work study","steps involved in work-study process","Definition and Concept of Method study","Procedure involved in Method study","Objectives and techniques of Work Measurement","work sampling and its application","Selection of Personnel and wage payment plans"]},{"l":"III","t":"Material Management","h":null,"p":["Meaning of Inventory management","Economic Order Quantity Model","ABC analysis","Just-in-time","Minimum Safety Stock Industrial Safety: Occupational safety","safety programs","Safety aspects in work system design"]},{"l":"IV","t":"Project Management","h":null,"p":["Meaning","Features","Project management life cycle","Project cost control System","Project planning and control","Project scheduling and techniques","Text & Reference books: 1","Joseph Russell Smith","“The Elements of Industrial Management”","Hard Press 2","Gavriel Salvendy","“Handbook of Industrial Engineering: Technology and Operations Management”","John Wiley & Sons, Inc, Chary","“Production and Operations Management”","Tata McGraw Hill 4","Paneerselvam","“Production and Operations Management”, PHI 5","Buffa and R, Sarin","Modern Production/ Operations Management, Wiley","Syllabus For PE1 and PE2 Elective Subjects"]}],"b":[]},"ECE 101":{"n":"Matrix Method of Analysis","c":"Professional Elective-1 NIL","p":"","k":"Lecture: 3, Tutorial: 1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, : quizzes, record, One Minor tests and One Major Theory Examination.","o":"The main objective is to expand the student knowledge of the stiffness : and flexibility methods studied in the basic structural analysis courses. This course is also expected to enable a good understanding of how standard software packages and students will be able to implement the method developing their own computer program to analyze structures. The students are expected to be able to demonstrate the following","co":["To understand the basic concepts of structural analysis and matrix algebra.","To understand the matrix methods can be applied to plane and space trusses; beams and grids; plane and spaceframes.","To identify a suitable system of releases (flexibility method) or an appropriate set of degrees of freedom (stiffness method).","To formulate and solve the equilibrium equations (stiffness method) or boundary conditions (flexibility method).","Ability to use modern structural analysis software.","Able to understand and analysis complex structures."],"u":[{"l":"I","t":"","h":9,"p":["Introduction to Flexibility and stiffness method","Hand computation of problems on beam"]},{"l":"II","t":"","h":9,"p":["Hand computation of problems on trusses","frames and grids"]},{"l":"III","t":"","h":9,"p":["Generalized computer-oriented treatment of stiffness method","Method of assembling the stiffness matrix","substructure technique for solving very large structures"]},{"l":"IV","t":"","h":9,"p":["Analysis for imposed deformation","temperature","support settlement, etc","Transfer matrix method of analyzing framed structure"]}],"b":["H.C. Matrix, Introduction to Matrix Methods, of structural Analysis, McGraw Hill, New York. 1.Weaver & Gere, Matrix Analysis of Framed structures."]},"ECE 102":{"n":"Geotechnical Investigations And Field Testing Of Soil","c":"Professional Elective - 1","p":"NIL","k":"Lecture: 3, Tutorial : 1 , Practical: 0","cr":4,"a":"","o":"The objectives of the course are as follows: 1. To Understand the types of soil and develop various applications of soil as a construction material for civil engineering structures. 2. To Evaluate the soil quality to understand the basic relationships between physical and mechanical properties of soils. 3. To understand the soil testing methods as the basic knowledge of classification and engineering properties of soil 4. To understand the different ground modification methods and the experimental methods for laboratory as well as field investigations.","co":["After completion of this course the students to demonstrate following knowledge, skills and attitudes.","Comprehend the basics of site investigation methods and field tests and its extent for variety of structures including preliminary investigations.","Identify and suitable investigation method for soil exploration.","Illustrate different specialized exploration methods based on condition and requirement.","Appraise different codal provisions for field tests","Basic knowledge about soil explorations and field investigations."],"u":[{"l":"I","t":"","h":9,"p":["Soil Formation","types of soils","physical and biological weathering","soil transport","deposition and stratification phenomena and Soil Classification","Clay minerals","coarse-grained and fine-grained soil for engineering use","Interpretations And Codal Provisions: Soil profiling","interpretation of exploration data and report preparation","various standards for soil investigations","Purpose and Phases of Soil Investigation"]},{"l":"II","t":"Exploration Methods","h":9,"p":["Methods of Boring","Augering and Drilling","Machinery used for drilling","types of augers and their usage for various projects","Soil Sampling: sampling methods","types of samples","storage of samples and their transport","Sample preparation","sample sizes","types of samplers specifications for soil testing","Trial pits","disturbed and undisturbed sampling Detailed bore hole investigations: types of borings and types of samplers","Compaction: Standard and Modified Proctor compaction tests","field compaction","compaction quality control: Proctor Needle Test"]},{"l":"III","t":"Field testing of soils","h":9,"p":["methods and specifications – visual identification tests","vane shear test","penetration tests","analysis of test results","Report writing: Soil exploration Reports- identification","calculations and preparation","Field Instrumentation: Rollers","Pressure meters","Piezometer","Pressure cells","Sensors","Inclinometers","Strain gauges etc","Collection of geological data","Resistivity and Seismic Refraction methods"]},{"l":"IV","t":"Field Tests","h":9,"p":["Plate load test","pile load test","SPT test","CPT test","flat dilatometer test","DCPT test","Vane shear test","pressure meter test","field CBR test","core cutter","sand replacement test","nuclear probe method","block shear test","Introduction to Ground Modification: Need and objectives of Ground Improvement","Classification of Ground Modification Techniques – suitability and feasibility","Emerging Trends in ground improvement"]}],"b":[" Alam Singh – Modern Geotechnical Engineering, Asia Publishing House, New Delhi.  Gopal Ranjan and A.S.R. Rao – Basic and Applied Soil Mechanics, New Age International (P) Ltd.  B.C. Punamia – Soil Mechanics and Foundations, Laxmi Publications (P) Ltd.  C. Venkataramaiah – Geotechnical Engineering, New Age International (P) Ltd., New Delhi.  Schnaid, F. (2009) In Situ Testing in Geomechanics : The Main Tests. Taylor & Francis.  J. E. Bowles, “Foundation Analysis and Design”, McGraw Hill Companies, 1997.  M. D., Desai, “Ground Property Characterization from In-Situ Testing”, Published by IGS- Surat Chapter,2005.  M. J., Hvorslev, “Sub-Surface Exploration and Sampling of Soils for Civil Engineering Purposes”, US Waterways Experiment Station, Vicksburg, 1949.  Robert M. Koerner “Construction and Geotechnical methods in Foundation Engineering”, Mc.Graw-Hill Pub. Co., New York, 1985.  Manfred R. Haussmann, “Engineering principles of ground modification”, Pearson Education Inc. New Delhi, 2008.  F. G., Bell, “Engineering Treatment of Soils”, E& FN Spon, New York, 2006.  P. Purushothama Raj, “Ground Improvement Techniques” Laxmi Publications (P) Limited, 2006.  Jie Han et. al., “Advances in ground Improvement” Allied Pub., 2009.  Hunt Roy E , Geotechnical Investigation Methods, A Field Guide for Geotechnical Engineers, Taylor & Francis Ltd."]},"ECE 103":{"n":"Global Warming And Climate Change","c":"Professional Elective - 1","p":"NIL","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, record, two Minor tests and One Major Theory Examination.","o":"The main objective is to expand the student knowledge of the climate change, its causes, impacts, and global responses such as the Kyoto Protocol and Clean Development Mechanisms.","co":["To make the students understand about the sources of energy","To understand about the effects of greenhouse gases.","To have adequate knowledge on impacts of climate change.","To acquire knowledge on modelling on climate change.","To have adequate knowledge on carbon credit.","To understand rules and protocols on global trading related to global warming."],"u":[{"l":"I","t":"Energy Sources","h":9,"p":["Global Warming Potential","Energy Issues and Climate Change","Alternate Energy Sources","Greenhouse Effect: Green house as natural phenomenon","Greenhouse Gases (GHGs) and their Emission","Sources","Quantification of CO2 Emission","Global Warming Potential of GHGs"]},{"l":"II","t":"Impacts of Climate Change","h":9,"p":["Effects on climatic and related changes","Global and Indian","scenario","Temperature Rise","Sea Level rise","Coastal Erosion and landslides","Coastal Flooding","Wetlands and Estuaries loss","Modelling on Climate Change: Case studies on climate change","Data analysis","Interpretation","Ozone layer depletion and its control"]},{"l":"III","t":"Kyoto Protocol","h":9,"p":["Importance","Significance and its role in Climate Change","Carbon Credit and Trading: Mechanisms","Various Models Global and Indian Scenario"]},{"l":"IV","t":"Cleaner Development Mechanisms","h":9,"p":["Various Projects related to CO2 Emission Reduction","Alternatives of Carbon Sequestration - Conventional and non-conventional techniques","Role of Countries and Citizens in Containing Global Warming"]}],"b":["Francis D., (2000), \"Global Warming: The Science and Climate Change\", 1st Edition, Oxford University Press.","Barry R.G., and Chorley R.L., (2017), \"Atmosphere, Weather and Climate\", 4th Edition, ELBS Publication.","Bolin B., (Ed.), (1981), \"Carbon Cycle Modelling, John Wiley and Sons Publications.","Corell R.W., and Andenon P.A., (Eds). (1991), \"Global Environmental Change\", Springer Vetlog Publishers."]},"ECE 104":{"n":"Principle Of Highway Engineering","c":"Professional Elective - 1","p":"NIL","k":"Lecture: 3; Tutorial: 1; Practical: 0 No. of credits 4","cr":4,"a":"Continuous assessment through tutorials, attendance home assignments, : quizzes, methods practical work, record, viva voce and one Minor tests and One Major Theory","o":"Followings are the course objectives of this course: 1. To introduce the fundamental principles and scope of highway and transportation engineering 2. To develop skills for planning and conducting highway alignment surveys and preparing related documentation. 3. To familiarize with the various materials used in highway construction 4. To enable application of economic evaluation methods for assessing highway projects and making informed decisions.","co":["Understand the fundamental concepts and scope of highway and transportation engineering.","Aware basic road classification and the road authorities in india","Plan and carry out highway alignment surveys","Identify different types of Materials used in highway construction","Perform and interpret basic laboratory tests on highway materials to assess their suitability for pavement construction.","Evaluate highway projects using economic analysis methods Topic covered"],"u":[{"l":"I","t":"","h":9,"p":["Highway Introduction, Scope","Planning & Development Highway planning in India","Development","Rural and urban roads","Road departments in India","Road classification","Road authorities i, IRC, CRRI, NHAI","NHDP etc"]},{"l":"II","t":"Highway Alignment & Surveys","h":9,"p":["Reconnaissance","Aerial surveys","Location surveys","Location of bridges","Problems in rural and urban areas","Highway drawings & reports Highway project preparation"]},{"l":"III","t":"","h":9,"p":["Highway Materials and construction Aggregates and their types","physical and engineering properties","Fillers","Bitumen","Characteristics","Emulsions and cutbacks","Basic tests on all materials: construction of flexible and rigid pavement"]},{"l":"IV","t":"","h":9,"p":["Highway Economics & Finance Financing of road projects","administration of roads","PPP models","Road safety audit","Methods of economic evaluation of highway projects"]}],"b":["/Reference books","Khanna, S. K. and Justo, C. e. G., Manual for Highway testing manuals, Enchant Bros., Roorkee.","Das A and Chakraborty P, Principles of Transportation Engineering, PHI Pvt. Ltd. New Delhi","Kadiyali, L.R. & Lal, N.B., Principles & Practices of Highway Engineering, Khanna Publishers, New Delhi.","Wright, P. H., Highway Engineering, John Wiley and Sons, New York","Indian standards, ASTM Codes, IRC codes, MoRTH Specifications"]},"ECE 105":{"n":"Engineering Hydrology","c":"Professional Elective 1","p":"","k":"Lecture – 3; Tutorial – 1; Practical – 0","cr":4,"a":"","o":"1. To study occurrence movement and distribution of water that is a prime resource for development of a civilization. 2. To know diverse methods of collecting the hydrological information, which is essential, to understand surface and ground water hydrology. 3. To know the basic principles of streamflow measurement 4. To understand the principles of watershed management and flood routing","co":["A background in the theory of hydrological processes and their measurement","Apply science and engineering fundamentals to solve current problems and to anticipate, mitigate and prevent future problems in water resources management","An ability to manipulate hydrological data and undertake widely used data analysis.","A systematic understanding of the nature of hydrological stores and fluxes and a critical awareness of the methods used to measure, analyse and forecast their variability; and the appropriate contexts for their application.","An understanding in principles of watershed management An ability to apply momentum, energy and mass balance equations for routing flood through rivers and reservoirs"],"u":[{"l":"I","t":"Introduction","h":9,"p":["Hydrologic cycle","processes and budget","Fundamentals of hydrometeorology","Indian monsoon system Frequency Analysis: Random variables","Probability distribution functions: normal","log-normal","Gumbel","Pearson type-3 uniform distributions","Frequency analysis","Goodness of fit measures"]},{"l":"II","t":"Precipitation Measurement and Analysis","h":9,"p":["Precipitation variability","rainfall and snow measurement techniques","design of precipitation gauging network","consistency of rain record","filling up of missing record","estimation of mean areal rainfall","IDF and DAD analysis","Snow measurement and estimation of snow melt","Hydrologic Abstractions: Interception and depression storage","Evaporation: factors affecting","measurement and estimation","Evapotranspiration: measurement and estimation","Infiltration","factors affecting infiltration","measurement of infiltration","empirical and analytical models of infiltration","Rain harvesting: procedures and design"]},{"l":"III","t":"Stream Flow","h":9,"p":["Runoff process: measurement of stream flow","factors affecting stream flow","Stage- discharge relationship","Peak discharge estimation","hydrograph analysis","base flow separation","unit hydrograph for stream flow estimation","synthetic unit hydrograph","hydrological modeling"]},{"l":"IV","t":"Watershed Management","h":9,"p":["Watershed and its characteristics","Curve number method","Soil erosion and estimates","Watershed management techniques","Erosion control","Flood Routing: Governing equations","Reservoir flood routing","Hydrologic routing: Muskingum method"]}],"b":["Chow, V.T., Maidment, D.R. and Mays, L.W.: Applied Hydrology, Mc Graw Hill 1998","Mays, L.W.: Water resources Engineering, John Wiley and Sons 2001","Singh V.P., Elementary Hydrology, Prentice Hall of India 1994","Subramanya, K., Engineering Hydrology, 4th Edition, Tata Mc Graw Hill 2013","C.W. Fetter, Applied Hydrogeology, Fourth Edition, CBS Publishers and Distributors, New Delhi, 2001 2001","H.M. Raghunath, Hydrology: Principles, Analysis and Design, 2nd edition, New Age International Publishers."]},"ECE 106":{"n":"Geographic Information System","c":"Professional Elective - 1","p":"NIL","k":"Lecture:3,Tutorial: 1, Practical:0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods assignments, quizzes, two Minor tests, and One Major Theory Examination","o":"This course aspires to: Introduce basic concepts in GIS, provide exposure to basic tools and techniques in GIS software and Introduce applications of GIS in relevant areas of civil engineering.","co":["Define what GIS is and know different types of spatial and non spatial data","Understand the GIS and its Data models","Know what are the questions that GIS can answer","Differentiate between Raster and Vector Models","Create maps and overlay features/raster data for basic analyses","Understand the applications of GIS in the fields of environmental, geotechnical, transportation and water resources engineering"],"u":[{"l":"I","t":"Definition of GIS, Cartography and GIS, GIS database","h":9,"p":["spatial and attribute data","Spatial models: Semantics","spatial information","temporal information","conceptual models of spatial information","Computer representation of geographic information: Regular tessellations","irregular tessellations","Vector representations","Topology and Spatial relationships","Scale and Resolution","Representation of Geographic fields","Representation of Geographic objects"]},{"l":"II","t":"","h":null,"p":["Raster and vector data input","raster to vector data conversion","map projection","analytical transformation","rubber sheet transformation","manual digitizing and semi-automatic line following digitizer","Remote sensing data as an input to GIS data Direct and indirect spatial data capture Accuracy and Precision","Positional accuracy","Attribute accuracy","temporal accuracy","Lineage","Completeness","Logical consistency"]},{"l":"III","t":"","h":9,"p":["GIS database Concepts and management systems","Types of Database management Systems","hierarchical","network","relational models","Object oriented DBMS","GIS functionality","data storage and data retrieval through query","generalization","classification","containment search within a spatial region"]},{"l":"IV","t":"Overlay","h":9,"p":["arithmetical","logical and conditional overlay","buffers","inter visibility","aggregation","Network analysis","Applications of GIS in planning and management of utility lines and in the field of environmental engineering","geotechnical engineering","transportation engineering and water resources engineering"]}],"b":["Stan Arnoff Geographic Information Systems: A Management Perspective, WDL Publications.","C.P. Lo and Albert K. W. Yeung, Concepts and Techniques of Geographical Information Systems, Prentice- Hall India","Reddy, M. Anji, Remote sensing and Geographic Information System BS Publications Hyderabad","B. Bhatta, Remote Sensing and GIS, Oxford University Press","Robert Laurini and Derek Thompson Fundamentals of Spatial Information Systems, Academic Press.","Tor Bernhardsen Geographic Information Systems: An Introduction, Wiley","Burrough P.A. and Rachel A. McDonell, Principles of Geographical Information Systems, Oxford Publication","Michael N. DeMers, Fundamentals of Geographic Information Systems, Wiley"]},"ECE 201":{"n":"Prestressed Concrete","c":"Professional Elective-2","p":"NIL","k":"Lecture: 3, Tutorial: 1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods : assignments, quizzes and One Minor test/s and One Major Theory Examination","o":"The course objectives are given below: 1. Understand the concepts of pre-stressing in concrete structures and identify the materials for pre-stressing. 2. Insight into the Pre-Tensioning and Post- Tensioning Processes to solve engineering problems. 3. Techniques for construction for prestressed concrete. 4. Design pre-tensioned and post tensioned girders for flexure and shear. 5. Design continuous pre-tensioned and post tensioned beams.","co":["To learn the principles, materials, methods and systems of prestressing.","To know the different types of losses and deflection of prestressed members.","To learn the design of prestressed concrete beams for flexural, shear and tension and to calculate ultimate flexural strength of beam.","To learn the design of anchorage zones, composite beams, analysis and design of continuous beam.","Analyse a Pre-stressed Concrete section.","Able to estimate the losses during the prestressing"],"u":[{"l":"I","t":"","h":9,"p":["Fundamentals of prestressing - Classification and types of prestressing Concrete Strength and strain characteristics - Steel mechanical properties - Auxiliary Materials like duct formers","Prestressing Systems: Principles of pre- tensioning and post tensioning - study of common systems of prestressing for wires strands and bars"]},{"l":"II","t":"","h":9,"p":["Advantages of prestressing","methods of prestressing","Losses in prestress","analysis of simple prestressed rectangular and T-sections","Introduction to design of elements","load balancing concept","profile of cable"]},{"l":"III","t":"Analysis of Sections","h":9,"p":["In flexure","simple sections in flexure","Design of rectangular","I beam under flexure and shear using IS 1343","kern distance - cable profile - limiting zones - composite sections cracking moment of rectangular sections"]},{"l":"IV","t":"Design of Simply Supported Beams","h":9,"p":["Allowable stress as per I","1343 - elastic design of rectangular and I-sections","Shear and Bond: Shear and bond is prestressed concrete beams - conventional design of shear reinforcement - Ultimate shear strength of a section - Prestress transfer in pretensioned beams-Principles of end block design"]}],"b":["Krishna Raju. N., “Prestressed Concrete”, Tata Mc Graw Hill.,6th Edition.","Lin.T.Y, “Prestressed concrete”, Wiley India, 2010.","Nawy, E. G., Prestressed concrete a fundamental approach 4th edition, Pearson Education, Inc. New Jersery, US., 2003.","IS 1343:2012. Prestressed concrete - code of practice, Bureau of Indian Standards (BIS), New Delhi, India., 2012.","Rajagopalan, “Prestressed concrete”, Narosa Publishing House, 2017, 2nd Edition."]},"ECE 202":{"n":"Rock Mechanics","c":"Professional Elective-2","p":"NIL","k":"Lecture: 3, Tutorial: 1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home : assignments, quizzes and One Minor test/s and One Major Theory Examination","o":"The course objectives are given below: 1. Concepts of rock mass properties governed by deformation of rocks and development of discontinuity features. 2. Insight to presence of in-situ and forced stresses in rock mass, their measurement will be able to solve engineering problems. 3. Safe excavation techniques for construction of underground structures. 4. Knowledge of Ground conditions in tunnelling with special reference to rock mass.","co":["Identification of the different types of rocks.","Laboratory experiments to be done for the rock mass properties.","Index properties of rock and rock mass.","Determination of the strength of the rock by various failure criteria.","Stress-strain behaviour of a rock mass.","Foundations on weak rocks."],"u":[{"l":"I","t":"Rock Formation","h":9,"p":["rock forming minerals","identification","geological classification of rock","geological structures","faults, folds","joints","Laboratory Testing of Rocks for the determination of physical properties","uniaxial compressive strength","tensile strength","oblique shear stress","Triaxial test","slake durability test","stress-strain responses of rocks"]},{"l":"II","t":"Engineering Classification of Rocks & Rock Masses","h":9,"p":["Deere and Miller classification","rock quality designation","rock mass rating","rock mass quality","geological strength index and their applications","Strength Criteria for Rocks & Rock Mass: Mohr-Coulomb criterion","Hoek and Brown criterion","Barton’s theory"]},{"l":"III","t":"Tunneling","h":9,"p":["Ground conditions in tunneling","elastic analysis under uniaxial","biaxial and hydrostatic conditions","Concrete lining: elastic analysis","elasto-plastic analysis: Tresca criterion","rock mass- tunnel support interaction analysis","design of support system"]},{"l":"IV","t":"Rock Slope Stability Analysis","h":9,"p":["Modes of failure","limit equilibrium approaches","application of stereographic projections","remedial measures","Foundations of Weak Rocks: Bell’s approach","bearing capacity based on classification approaches, UCS","plate load test","special considerations"]}],"b":["Ramamurthy.T, Engineering in Rocks for Slopes, Foundation and Tunnels, 2nd edition Prentice Hall India Pvt. Ltd.","Goodman.R.E, Introduction to Rock Mechanics, John Wiley & Sons.","Verma B.P, Rock mechanics for engineers, Khanna Publishers, 2nd Edition 1989, New Delhi.","David Chapman, Nicole Metje and Alfred Strak, “Introduction for Tunnel Construction”, Applied geophysics Volume III, 1st Edition 2010.","Jaeger Cook and Zimmerman, Fundamentals of Rock Mechanics, , 4th Edition, Blackwell Publishing, 2007. 4. Chandola. S.P, “A Textbook of Transportation Engineering”, S.Chand Publications, 1st 5. Edition, 2001.","Obert L and Wilbur I. Duvall, Rock mechanics and the design of structures in rock, John Wiley & Sons, Inc, 2003.","Bickel J.O., Kuesel T.R, and King E.H, “Tunnel Engineering Handbook”, Chapman & Hall/ITP Publishing Company, 1996, 544 pp.","Parker, A.D. “Planning and Estimating Underground Construction”, McGrawHill, 1970."]},"ECE 203":{"n":"Environmental Chemistryand Microbiology","c":"Professional Elective - 2","p":"NIL","k":"Lecture: 3, Tutorial: 1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods : assignments, quizzes and One Minor test/s and One Major Theory Examination","o":"The course objectives are given below: The students are expected to demonstrate the following knowledge,","co":["Synthesize and apply concepts from multiple sub-disciplines in environmental chemistry and toxicology.","Use technical and analytical skills to quantify the level and effects of xenobiotics in environmental compartments (air, water, soil, biota).","Identify relationships between chemical exposure and effects on physiological systems and design strategies for study of dose- response relationships.","Effectively understand and convey scientific material from peer- reviewed sources.","Conduct an individual research project within the university of other appropriate setting."],"u":[{"l":"I","t":"","h":9,"p":["Chemical composition of atmosphere- particles","ions and radicals","formation of particulate matter","photochemical and chemical reactions in the atmosphere","chemistry of greenhouse gases and ozone layer depletion","gaseous transformations in the atmosphere and removal mechanisms","photochemical smog","nuclear winter"]},{"l":"II","t":"","h":9,"p":["Chemical composition of lithosphere","water and air in soil","inorganic and organic components in soil, acid","base and ionexchange reaction in the soil","soil acidity","salinity and sodocity","effects of ecological factors on the toxicity of soil","Bio-geochemical cycles"]},{"l":"III","t":"","h":9,"p":["Basic concept of colloidal and quantitative chemistry","Oxidation-reduction reactions and equations","gas laws","equilibrium and Lechatelier’s principle","activity and coefficients","variations in equilibrium relationships","shifting chemical equilibrium","amphoteric hydroxides","buffers and buffer index","solubility of salts","complex formation"]},{"l":"IV","t":"","h":9,"p":["Microorganisms and their association with man","animals and plants","Extremophilic microorganisms","Microbial metabolism","role of micro-organisms in environmental management","Neutron Activation Analysis","calorimetric","Colourimetry","Atomic Absorption Spectroscopy","Gas chromatography, HPLC","Ion exchange Chromatography and Polarography, XRF, XRD"]}],"b":["Bailey R.A. (2002) Chemistry of the Environment, Academic Press, San Diego.","Masters G.M. (2004) Introduction to Environmental Engineering and Science, Second Edition, Pearson Education.","Baird C. (1999) Environmental Chemistry (2nd edition), WH Freeman and Co.","Buell P. and Girard J. (2002) Chemistry Fundamentals: An Environmental Perspective (2nd edition), Jones & Bartlett Publishers.","Bunce N. (1991) Environmental Chemistry, Wuerz Publishing Ltd., Winnipeg, Canada.","Cunningham W.P. and Cunningham M.A. (2007) Principles of Environmental Science: Inquiry and Applications, Tata McGraw-Hill.","Harrison R.M. (1991) Introductory Chemistry for the Environmental Sciences, Cambridge University Press.","Harrison R.M. (Edited) (1999) Understanding our Environment: An Introduction to Environmental Chemistry and Pollution, Royal Society of Chemistry.","Miller G.T. (2001) Environmental Science, (eighth edition), Brooks/Cole.","Pepper I.L., Gerba C.P. and Brusseau M.L. (2006) Environmental and Pollution Science, Second edition, Academic Press."]},"ECE 204":{"n":"Traffic Engineering","c":"Professional Elective-2","p":"NIL","k":"Lecture: 3, Tutorial: 1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods assignments, quizzes and One Minor test/s and One Major Theory Examination","o":"The course objectives are given below: 1. An ability to design the road with existing traffic capacity of the town /city. 2. Ability to calculate the traffic flow, traffic volume of the town/city. 3. Idea about the traffic signs.","co":["Knowledge of achieving efficient, free and rapid flow of traffic.","Knowledge of having fewer accidents and pedestrians should also be given importance.","Knowledge about the various types of signals and their uses.","Knowledge about deciding the signal timing for different traffic situations.","Knowledge of having different type of parking techniques and lighting","Knowledge of having various methods of travel demand forecasting."],"u":[{"l":"I","t":"","h":9,"p":["Introduction to traffic analysis","operation and control including traffic capacity analysis","components and characteristics traffic system","statistical application in traffic operation","Design of Intersections"]},{"l":"II","t":"","h":9,"p":["Basics of traffic signal design and phase timing","analysis and design of pre-timed and phase timing","traffic modelling including computer applications","Signal coordination for arterials and networks","Arterial analysis planning and Design"]},{"l":"III","t":"","h":9,"p":["Analysis of unsignalized intersections","Design of parking facility","Highway Lighting","Traffic planning and administration studies and their uses","traffic flow characteristics"]},{"l":"IV","t":"","h":9,"p":["Traffic control devices","intersections","traffic planning","Trip generation models","trip distribution models","modal split analysis","Advanced methods for travel demand forecasting"]}],"b":["Roess R.P., Prassas S.E, Mc- Shane W.R., Traffic Engineering, Prentice Hall, 2011.","Khanna K S., Justo C E G., Veeragavan A., Highway Engineering, Nem Chand & Bros, 2020.","Traffic Engineering by. L. R. Kadiyali Khanna publication, 2016.","Papacostas S C., Prevedouros D P., Transportation Engineering, PHI publishers, 2016.","Chakroborty P., Principles of Transportation Engineering, PHI publishers, 2020. Syllabus For PE3 and PE4 Elective Subjects"]},"ECE 301":{"n":"Structural Dynamics","c":"Professional Elective-3","p":"NIL","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods assignments, quizzes, record, o n e Minor test and One Major Theory Examination.","o":"To introduce students to the fundamentals of structural dynamics, including modeling and idealization of structures, formulation of dynamic equilibrium, and analysis of SDOF and MDOF systems. The course covers structural response to various dynamic loads, eigenvalue analysis, mode superposition, discretization of continuous systems, and basic concepts of seismic design and soil–structure interaction.","co":["Relate the structural idealization to properties of real structure.","Able to establish dynamic equilibrium.","Able to solve the Eigen value problem and knowledge to its properties.","To calculate response from different types of loading.","Continuous systems; discretization; soil-structure interaction; seismic design concepts","MDOF systems; harmonic excitation; mode superposition; Lagrange’s equations"],"u":[{"l":"I","t":"","h":9,"p":["Introduction to structural dynamics","definition of basic problem in dynamics","static versus dynamic loads","different types of dynamic loads","Sources of vibration","Degrees of freedom","Single degree of freedom systems: Free vibrations of undamped and viscously damped systems","Raleigh‟s Method","Damping in structures","viscous damping and coulomb damping","effect of damping on frequency of vibration and amplitude of vibration"]},{"l":"II","t":"Structures modelled as shear buildings","h":9,"p":["Free vibration of shear building","Forced Vibration of Shear Buildings","logarithmic decrement","forced vibration","response to periodic loading","dynamic load factors","response of structure subjected to general dynamic load","Dulhamel‟s integral","numerical evaluation of dynamics response of SDOF systems"]},{"l":"III","t":"","h":9,"p":["Multiple degree of Freedom Systems","Response to harmonic excitation","Dynamic Analysis of beams","Dynamic Analysis of plane frames","mode superposition method Lagranges’ equations","Eigen value problems","Linear Response of Multi Degree freedom systems"]},{"l":"IV","t":"","h":9,"p":["Dynamic analysis of structures with distributed properties","Discretization of continuous systems","Introduction to seismology","effect of soil properties and damping on seismic performance of structure","concept of seismic design of RC Structure"]}],"b":["/ Reference books","Hibler and Gupta (2010), Engineering Mechanics (Statics, Dynamics) by Pearson Education.","Dynamics of Structures, Anil K. Chopra, Prentice Hall, India.","Dynamics of Structures, Cloguh & Penzein, Tata McGraw Hill. New Delhi","Structural Dynamics, John M. Biggs, Tata McGraw Hill. New Delhi"]},"ECE 302":{"n":"Ground Improvement Techniques","c":"Professional Elective-3","p":"Knowledge of Basic soil mechanics is required","k":"Lecture:3, Tutorial: 1, Practical:0","cr":4,"a":"Continuous assessment through tutorials, attendance, home : methods assignments, quizzes, and One Minor tests and One Major Theory Examination.","o":"To provide students with a clear understanding of soil behavior and the need for ground improvement techniques, and to develop the ability to select and apply suitable methods such as compaction, stabilization, in-situ densification, preloading, dewatering, grouting, granular piles, and underpinning to improve the engineering performance of soils under different field conditions. The students are expected to be able to demonstrate the","co":["following knowledge, skills, and attitudes after completing this course","Analyze soil properties and assess the need for ground improvement techniques.","Apply compaction and soil stabilization methods for improving engineering properties of soil.","Evaluate and select suitable in-situ densification techniques for granular soils.","Examine improvement methods for cohesive soils including preloading and vertical drains.","Design and analyze grouting, granular piles, and underpinning techniques.","Recommend appropriate ground improvement methods based on soil conditions and site requirements."],"u":[{"l":"I","t":"Introduction and Soil Stabilization","h":9,"p":["Introduction to ground improvement","review of compaction theory","effect of compaction on soil behavior","field methods of compaction","quality control in compaction","design of soil-lime","soil-cement","soil-bitumen and soil-lime-fly-ash mixes"]},{"l":"II","t":"In-situ Densification in Granular Soils","h":9,"p":["In-situ densification methods in granular soils","deep compaction: introduction","Terra-Probe","vibroflotation techniques","ground suitability for vibroflotation","advantages","Mueller Resonance Compaction","dynamic compaction","depth of improvement"]},{"l":"III","t":"In-situ Improvement in Cohesive Soils","h":9,"p":["In-situ densification methods in cohesive soils","pre- loading and de-watering","vertical drains","electrical method","thermal method"]},{"l":"IV","t":"Grouting and Foundation Improvement Techniques","h":9,"p":["Grouting: introduction","suspension grout","solution grout","grouting equipment and methods","grouting design and layout","Granular piles: ultimate bearing capacity and settlement","method of construction","load test","Underpinning of foundations: importance","situations requiring underpinning","methodology and typical examples"]}],"b":["Purshotham Raj – Ground Improvement, Pearson Education India.","S. K. Garg – Soil Mechanics and Foundation Engineering","A. K. Samadhiya – Ground Improvement Techniques","Gopal Ranjan and A. S. Rao – Basic and Applied Soil Mechanics","J. N. Mandal – Geosynthetics World","Bergado et al. – Soft Ground Improvement","Koerner, R. M. – Designing with Geosynthetics"]},"ECE 303":{"n":"Environmental Planning And Management","c":"Professional Elective-3","p":"NIL","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods assignments, quizzes, record, o n e Minor test and One Major Theory Examination.","o":"The main objective is to expand the student knowledge of the principles and practices of environmental sustainability, planning, and protection. The student after learn to integrate environmental, social, and economic dimensions for informed decision-making in sustainable development and resource management.","co":["To understand the basic theory of environment and sustainable development.","To study the engineering methodology in planning and its limitations.","To study the environmental protection","To study the Environmental impact assessment and environmental economics.","To have adequate knowledge on total quality management in environmental management and protection.","To understand about the Environmental audit."],"u":[{"l":"I","t":"","h":9,"p":["Environment and Sustainable Development - carrying capacity","relationship with quality of life","carrying","indicators of sustainability","sustainability strategies","barriers to sustainability","resource utilization","resource degradation","industrial ecology","socio economic policies for sustainable development and clean development mechanism"]},{"l":"II","t":"","h":9,"p":["Engineering Methodology in Planning and Its Limitations - carrying capacity based short and long-term regional planning","Environmental impact assessment (EIA) - definitions and concepts","rationale and historical development of EIA","sustainable development","initial environmental examination","environmental impact statement","environmental appraisal","environmental impact factors and areas of consideration","measurement of environmental impact","organization","scope and methodologies of EIA","status of EIA in India"]},{"l":"III","t":"","h":9,"p":["Environmental Protection - Economic development and social welfare consideration in socio economic developmental policies and planning","Total cost of development and environmental protection cost","Case studies on Regional carrying capacity","Engineering Economics - Value Engineering","Time Value of Money","Cash Flows","Budgeting and Accounting","Environmental Economics: Introduction","economic tools for evaluation","Green GDP","Cleaner development mechanisms and their applications"]},{"l":"IV","t":"","h":9,"p":["Environmental Audit - methods","procedure","environmental audit versus accounts audit","compliance audit","methodologies and regulations reporting and case studies","Life cycle assessment","Triple bottom line approach","Total Quality Management in Environmental Management and Protection - ISO 9000","14000 and 18000 series of standards"]}],"b":["/ Reference books","1. Lohani B.N and North A.M., (1984)., \"Environmental Quality Management\", South Asian Publishers, New Delhi.","Chanlett E.T., (1979), Environmental Protection, McGraw Hill Publication, New York.","Danoy G.E., and Warner R.F., (1989), \"Planning and Design of Engineering Systems\", First Edition, CRC press, Unwin Hyman Publications.","MOEF, Government of India, \"Carrying Capacity Based Developmental Planning Studies for the National Capital Region\", 1995-96.","NEERI, Nagpur, Annual Reports 1995 & 1996."]},"ECE 304":{"n":"Railway And Airport Engineering","c":"Professional Elective-3","p":"NIL","k":"Lecture:3, Tutorial: 1, Practical:0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods assignments, quizzes, and One Minor test and One Major Theory Examination.","o":"To make the students understands the basic of component of railway and airport engineering and their design.","co":["Understand the knowledge of various systems of railway, airport, and water transportation.","Understand the components of railway tracks, components, and types of air crafts etc.","Understand the design concept of railway track, runway, taxiway.","Apply the concept of geometric design of railway, runway, taxiway, docks & harbours etc.","Apply the knowledge of various signaling system for railway engineering, air traffic control, navigational aids, etc.","Understand the concepts of air traffic control, navigational aids, etc."],"u":[{"l":"I","t":"Indian Railways","h":9,"p":["Development and organization of Indian Railways","Permanent way: Sub- grade formation","embankment and cutting","track damage","Rails: Rail gauges","types of rails","defects in rails","rail failure","creep of rail","Rail Fastenings: Fish plates","spikes","chairs, keys","bearing plates","Sleepers: Timber, steel","cast iron","concrete and prestressed concrete sleepers","manufacturing of concrete sleepers","sleeper density","Ballast: Ballast materials","size of ballast","screening of ballast","specification of ballast","tests on ballast"]},{"l":"II","t":"Railway Track Geometry","h":9,"p":["Gradients","horizontal curves","super elevation","safe speed on curves","can’t deficiency","negative super elevation","compensation for curvature on gradients","track resistance and tractive power","Points and Crossings: Elements of simple turn-out","details of switch","details of crossings","number and angle of crossings","design of turn-out"]},{"l":"III","t":"Stations & Yards","h":9,"p":["Site section for a railway station","layout of different types of stations","classification of stations","types of railway yard","functioning of Marshalling yards","Signaling and Interlocking: Classification of signals","methods of train working","absolute block system","mechanical interlocking of two-line railway stations"]},{"l":"IV","t":"Airport Engineering","h":9,"p":["Aircraft characteristics","types of airports","layout of airports","airport planning and design","runway orientation","wind-rose diagram","estimation of runway length and correction"]}],"b":["A Textbook of Railway Engineering by S. P. Arora & S. C. Saxena.","Airport Planning and Design by S. K. Khanna, M. G. Arora","Railway Engineering - M.M. Aggarwal.","Railway Engineering - Vasvani."]},"ECE 305":{"n":"Soil Water Conservation","c":"Professional Elective-3","p":"","k":"Lecture – 3; Tutorial – 1; Practical – 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods assignments, quizzes, One minor test and One Major Theory Examination","o":"To make the students understand about the measurement techniques for soil loss and wind erosion, and to know the different agronomical and engineering measures adopted for its control along with its design.","co":["Have an understanding of various types of soil, water and wind erosion along with its mitigation measures.","Acquire proficiency in application of universal soil loss equation for estimating soil loss/erosion from an area","Have a thorough knowledge on causes of water erosion and its control measures","Know about the agronomic and engineering methods of conservation and the design of bunds and terraces being implemented on the field.","Understand the causes of wind erosion, and methods for controlling wind erosion","Be able to provide practical solutions to minimise the erosion loss and conservation of soil."],"u":[{"l":"I","t":"","h":9,"p":["Soil erosion - Introduction","causes and types","Geological and accelerated erosion","Erosion agents","Factors affecting and effects of erosion","Soil loss estimation – Universal soil loss equation (USLE) and modified USLE","Rainfall erosivity - estimation by KE>25 and EI 30 methods","Soil erodibility and other management factors","Measurement of soil erosion - Runoff plots","soil samplers"]},{"l":"II","t":"","h":9,"p":["Water erosion - Mechanics and forms","Gullies –Classification & stages of development","Water erosion control measures - agronomical measures - contour farming","strip cropping","conservation tillage and mulching","Engineering measures– Bunds and terraces","Bunds - contour and graded bunds - design and surplus arrangements"]},{"l":"III","t":"","h":9,"p":["Terraces - level and graded broad base terraces","bench terraces - planning","design and layout procedure","contour stonewall and trenching","Gully and ravine reclamation - principles of gully control - vegetative measures","temporary structures and diversion drains","Grassed waterways and design"]},{"l":"IV","t":"","h":9,"p":["Wind erosion- Factors affecting","mechanics","soil loss estimation and control measures vegetative","mechanical measures","Design of wind breaks and shelter belts and stabilization of sand dunes","Land capability classification","Rate of sedimentation","silt monitoring and storage loss in tanks"]}],"b":["Frevert, R.K., G.O. Schwab, T.W. Edminster and K.K. Barnes. 2009. Soil and Water Conservation Engineering, 4th Edition, John Wiley and Sons, New York.","Norman Hudson. 1985. Soil Conservation. Cornell University Press, Ithaka, New York, USA. Singh Gurmel, C. Venkataraman, G. Sastry and B.P. Joshi. 1996. Manual of Soil and Water","Conservation Practices. Oxford and IBH Publishing Co. Pvt. Ltd., New Delhi.","Suresh, R. 2014. Soil and Water Conservation Engineering. Standard Publisher Distributors, New Delhi.","Michael, A.M. and T.P. Ojha. 2003. Principles of Agricultural Engineering. Volume II. 4th Edition, Jain Brothers, New Delhi.","Murthy, V.V.N. 2002. Land and Water Management Engineering. 4th Edition, Kalyani Publishers, New Delhi"]},"ECE 306":{"n":"Principles Of Remote Sensing","c":"Professional Elective-3","p":"NIL","k":"Lecture:3, Tutorial:1, Practical:0","cr":4,"a":"Continuous assessment through tutorials, attendance home methods assignments, quizzes, and one Minor tests, and One Major Theory examination","o":"To learn the principles of remote sensing phenomenon including image acquisition, analysis and processing to extract information The students are expected to be able to demonstrate the following","co":["Understand the way in which electromagnetic radiation interacts with the earth’s atmosphere, the earth’s surface and the remote sensing system.","Be familiar with different types of sensors and remote sensing space missions that are used to detect and record certain parts of the electromagnetic spectrum.","Develop some skills in image interpretation and analysis by understanding simple image enhancement, filtering operations over digital images","To carry out corrections of geometric distortions in digital images","Develop a knowledge and understanding of spectral classification of images for feature extraction","Awareness of some applications of remotely sensed images"],"u":[{"l":"I","t":"","h":9,"p":["Remote sensing system and its components","Electromagnetic spectrum","definition of emissivity","reflectance","absorbance and transmittance","Spectral signature","atmospheric window","active and passive remote sensing systems","Interaction of electromagnetic energy with atmosphere and earth features","factors affecting the reflectance"]},{"l":"II","t":"","h":9,"p":["Airborne and space platforms","Advantages and disadvantages of each","principle and functioning of multi-spectral","thermal & line scanners","Multi concept of remote sensing","Different satellite and sensor combinations: LANDSAT, SPOT","IRS series of satellites and sensors","Their important characteristics: such as flight altitude, IFOV","spatial resolution, swath","spectral bands","and repetivity"]},{"l":"III","t":"","h":9,"p":["Introduction to Digital Image Processing","digital image representation","and characterization","Concept of color","Color composites","histograms and scatter plot","image enhancement","contrast stretching","radiometric processing including correction of atmospheric corrections","geometric corrections","Image Transformations such as subtraction","ratioing","NDVI and PCA"]},{"l":"IV","t":"Ground truth","h":9,"p":["Geographic and Radiometric","Principles of Global Positioning Systems and its role to remote sensing data","Digital terrain models","Thematic classification and clustering to include unsupervised and supervised classification based on parallelepiped","minimum distance and maximum likelihood classification","accuracy assessment of classification","Applications of remote sensing"]}],"b":["Thomas Lillesand, Ralph W. Kiefer, Jonathan Chipman., Remote Sensing and Image Interpretation. Wiley","Reddy, M. Anji, Remote sensing and Geographic Information System BS Publications","B. Bhatta, Remote Sensing and GIS, Oxford University Press","Curran, Paul J., Principles of Remote sensing Longman","Campbell, J.B., Introduction of Remote Sensing Taylor and Francis","Sabins, F.F., Remote Sensing: Principles and Interpretations Waveland Pr Inc Publishers"]},"ECE 401":{"n":"Design Of Bridges","c":"Professional Elective-4","p":"","k":"","cr":4,"a":"Continuous assessment through tutorials, attendance, home Methods assignments, quizzes, record, o n e minor tests, and one Major Theory Examination.","o":"The objective of this course is to provide students with fundamental and applied knowledge of planning, analysis, design and maintenance of bridges. The course emphasizes hydrological considerations, IRC loading standards, structural design of superstructure and substructure components, and modern construction practices.","co":["After completion of the course, students will be able to:","Explain bridge components, classification and planning aspects.","Estimate flood discharge, waterway and scour depth for bridge design.","Apply IRC loadings and analyze bridge superstructures.","Design basic superstructure components such as slab, T- beam bridges and culverts.","Analyze and design substructures and foundations.","Understand bearings, joints, construction and maintenance of bridges."],"u":[{"l":"I","t":"","h":9,"p":["Introduction to bridge components and classification","Importance of bridge investigation and site selection","Hydrological considerations including estimation of design flood discharge","linear waterway and scour depth","Selection of bridge type","subsoil exploration and location of piers and abutments","IRC specifications for road bridges including carriageway width","standard IRC loadings and live load calculation by Effective Width Method"]},{"l":"II","t":"","h":9,"p":["General design considerations and load combinations","Design of pipe culvert","slab bridge","box culvert and RCC T-beam bridge","Introduction to load distribution methods","Basic concepts of balanced cantilever bridges and prestressed concrete bridges"]},{"l":"III","t":"","h":9,"p":["Types of bridge substructures and forces acting on them","Design principles of piers and abutments including stability checks","Types of bridge foundations such as open","pile and well foundations and their selection criteria"]},{"l":"IV","t":"","h":9,"p":["Importance and types of bridge bearings and expansion joints","Design principles of elastomeric bearings","Construction procedures of RCC and PSC bridges","Maintenance","inspection","load testing and assessment of load carrying capacity of bridges"]}],"b":["Ponnuswamy, S. (2014). Bridge Engineering (3rd ed.). New Delhi: Tata McGraw- Hill Education.","Krishnam Raju, N. (2010). Design of Bridges. New Delhi: Oxford & IBH Publishing Co. Pvt. Ltd.","Victor, D. J. (2001). Essentials of Bridge Engineering. New Delhi: Oxford & IBH Publishing Co. Pvt. Ltd.","Indian Roads Congress. (Latest Edition). Standard Specifications and Code of Practice for Road Bridges (IRC: 6 – Loads and Stresses; IRC: 21 – Cement Concrete; IRC: 78 – Foundations and Substructure). New Delhi: IRC.","Johnson, R. P. (2004). Composite Structures of Steel and Concrete (3rd ed.). Oxford: Blackwell Publishing.","Hambly, E. C. (1991). Bridge Deck Behaviour (2nd ed.). London: Chapman & Hall."]},"ECE 402":{"n":"Geosynthetics Engineering","c":"Professional Elective-4","p":"Soil Mechanics (BCE 211)","k":"Lecture : 3, Tutorial : 1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods assignments, quizzes and One Minor Test and One Major Theory Examination","o":"To enable students to understand the fundamental concepts and functions of geosynthetics, the analysis and design of reinforced soil structures, and advanced geosynthetic applications in ground improvement, drainage, environmental protection, and foundation systems. The students are expected to demonstrate the following","co":["Explain different types, properties, and manufacturing processes of geosynthetics.","Evaluate strength and testing requirements of reinforced soil and geosynthetic materials.","Analyze external and internal stability of geosynthetic reinforced retaining walls under static and seismic loading.","Design reinforced soil slopes, embankments, and shallow foundation support systems using geosynthetics.","Apply geosynthetics for drainage, filtration, erosion control, and environmental engineering applications.","Assess ground improvement techniques such as accelerated consolidation and geosynthetic encased stone columns."],"u":[{"l":"I","t":"","h":9,"p":["Introduction","types and applications & manufacturing of geosynthetics","strength of reinforced soils","testing of geosynthetics","drainage applications of geosynthetics","filtration applications of geosynthetics","erosion control using geosynthetics","natural geosynthetics and their applications"]},{"l":"II","t":"","h":9,"p":["Types of soil retaining structures","construction aspect of geosynthetic-reinforced retaining walls","internal and external stability analysis","testing requirements","and design for simple geometry with sloped backfill"]},{"l":"III","t":"","h":9,"p":["Stability analysis of reinforced soil slopes resting on soft and strong foundation soils","bilinear wedge analysis","design of embankments supported on load transfer platforms","reinforced soil for supporting shallow foundations"]},{"l":"IV","t":"","h":9,"p":["Accelerated consolidation of soft clays using geosynthetics","geosynthetic encased stone columns for load support","geosynthetics for construction of municipal and hazardous waste landfills"]}],"b":["Koerner, R.M. (2012) Designing with Geosynthetics, Vols. 1 & 2, 6th Edition, Xlibris Corporation, USA.","Almeida, M. and Marques, M.E.S. (2013) Design and Performance of Embankments on Very Soft Soils, CRC Press, London, U.K.","Hausmann, M.R. (1976) Engineering Principles of Ground Modification, McGraw- Hill, New York, USA.","Kempfert, H.G. and Gebreselassie, B. (2006) Excavations and Foundations in Soft Soils, Springer, The Netherlands.","Jewell, R.A. (1996) Soil Reinforcement with Geotextiles, CIRIA & Thomas Telford, London, U.K.","John, N.W.M. (1987) Geotextiles, Blackie & Son Ltd., London, U.K.","Jones, C.J.F.P. (2010) Earth Reinforcement and Soil Structures, Thomas Telford, London, U.K.","Saran, Swami (2006) Reinforced Soil and its Engineering Applications, I.K. International, New Delhi.","Shukla, S.K. (2012) Handbook of Geosynthetic Engineering, 2nd Edition, ICE Publishing, London, U.K.."]},"ECE 403":{"n":"Disaster Management","c":"Professional Elective-4","p":"NIL","k":"Lecture : 3, Tutorial : 1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods assignments, quizzes and One Minor Test and One Major Theory Examination","o":"To familiarize students with management measures to mitigates : the consequences resulting from natural or human induced disasters : The students are expected to be able to demonstrate the","co":["following knowledge, skills and attitudes after completing this course","Discuss the various modes of disaster arising in different areas","Identify the roles of NDRF and SDRF in disaster management","Illustrate the various trends of disaster management in Indian context","Recommend the various disaster prevention techniques for different context.","Define the role of engineers in Disaster mitigation","Understand the concepts of disaster factors."],"u":[{"l":"I","t":"","h":9,"p":["Type of disasters","Accent on land slides","earthquakes","flash flood","avalanches","snow blizzards","Causes","consequences and mitigation techniques","Flash floods their management and relief","Contingency planning for dam failures"]},{"l":"II","t":"","h":9,"p":["Characteristics of glaciers and protection of important monuments from glacial flow","Management of snow avalanche","Disaster management planning","Roles of NDRF and SDRF in Disaster Management"]},{"l":"III","t":"","h":9,"p":["Landslides","their classification","causes","& preventive measures","Concept","growth presents trends status in India and concept of contingency planning and systems approach of disaster management","Sociology of disasters","Human and media response and role"]},{"l":"IV","t":"","h":9,"p":["Disaster prevention techniques","Disaster legislation","Disaster prone area building codes","Vulnerability analysis","Health and sanitation aspects","Relief administration in India and role of engineers in disaster mitigation"]}],"b":["Disaster Management and Strategies by Ashu Pasricha, Kiyanoush Ghalav and Jai Narain Sharma","Disaster Management and Preparedness - Larry R. Collins, CRC Press.","Disaster Management Handbook - Jack Pinkowski, CRC Press."]},"ECE 404":{"n":"Pavement Analysis And Design","c":"Professional Elective-4","p":"Highway Engineering (BCE 263)","k":"Lecture:3, Tutorial: 1, Practical:0","cr":4,"a":"assessment through tutorials, attendance, home methods assignments, quizzes, and One Minor Test and One Major Theory Examination.","o":"To make the students to understand various approaches of analysis and design of flexible and rigid pavements : The students are expected to be able to demonstrate the","co":["following knowledge, skills, and attitudes after completing this course","Understand about pavement and distinguishes the types of road pavement","Knows the factors affect the pavement design and their characteristics.","Apply the elastic layered theory to analyse the pavement.","Design of the flexible pavements for highways","Design of rigid pavement for highways.","Ability to design rigid and flexible pavements"],"u":[{"l":"I","t":"Introduction","h":9,"p":["Definition of Pavement","Need of Pavement","Function of Pavements","Pavement Components and Its Functions","Types of Pavements","Difference between Flexible and Rigid Pavements","and Choice of Pavement Type","Composite Pavement","Perpetual Pavement"]},{"l":"II","t":"Factors Affecting Pavements Design","h":9,"p":["Traffic – Traffic Volume","Wheel Configuration","Axle Load, VDF, LDF","Contact area and tyre inflation pressure, ESWL","Repetitions of load and impact","Material Characteristics- CBR","Modulus of Subgrade Reaction","Resilient Modulus of Materials","Elastic Modulus","Poisons Ratio","Sub Grade Soil Condition","Visco-Elastic Behaviour of Bituminous Mix"]},{"l":"III","t":"Analysis of Flexible Pavement","h":9,"p":["Homogeneous Mass","Layered System","Elastic Theory","Two Layer and Multi Layers Pavement","Analysis Using IIT Pave","Flexible Pavement Design: Design of Flexible Pavement Using IRC-37 and AASHTO Method","Design of Shoulders"]},{"l":"IV","t":"Analysis of Rigid Pavement","h":9,"p":["Slab on Elastic Foundation","Stresses in Concrete Pavement","Westergaard Theory","Radius of Relative Stiffness","Load Stress","Temperature Gradient","Temperature Stress","Stresses Due to Friction","Combination of Stresses","Rigid Pavement Design: Design Factor","Westergaard‟s Theory of Local Stresses","Bradbury‟s Equation","Critical Combination of Stresses in Cement Concrete Pavement","Design of Joints in Concrete Pavements","Design of Dowel Bars","IRC Method","AASHTO Method"]}],"b":["Khanna, S. K. and Justo, C. e. G., Highway Engineering, Nemchand Bros., Roorkee","Huang, Y. H., Pavement analysis and Design. Prentice Hall, Englewood Cliffs, New Jersey","Yoder and Whitejack, Pavement Design, John Wiley & Sons.","Flaherty, O. Highways-Location Design, Construction and Maintenance of Pavements, Taylor and Francis.","Rajib B. Mallick and Tahar El-Korchi - Pavement Engineering: Principles and Practice.","IRC: 37-2001, “Guidelines for the Design of Flexible Pavements (Second Revision)”.","IRC: 58-2001, “Guidelines for the Design of Plain Jointed Rigid Pavements for Highways (Second Revision)”.","AASHTO – Design of pavement Structures"]},"ECE 405":{"n":"Advanced Fluid Mechanics","c":"Professional Elective-4","p":"Fluid Mechanics (BCE 214)","k":"Lecture : 3, Tutorial : 1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods assignments, quizzes and One Minor Test and One Major Theory Examination","o":"To make students understand advanced concepts in fluid : mechanics such as viscous flow, including laminar flow and turbulent flow and compressible fluid flows. The students are expected to be able to demonstrate the following","co":["Understanding the concept of fluid and the models of fluids.","Understanding the basic physical meaning of general equations.","Understanding the concept of stream function and potential function.","Ability to derive the equation for viscous flow, including laminar flow and turbulent flow.","Ability to address such problems in engineering, and to solve the problems","Knowledge about compressible fluid flows"],"u":[{"l":"I","t":"","h":9,"p":["Lagrangian and Eulerain Descriptions of fluid motion- Path lines","Stream lines","Streak lines","stream tubes – velocity of a fluid particle","types of flows","Equations of three-dimensional continuity equation- Stream and Velocity potential functions","Basic Laws of fluid Flow: Condition for irrotationality","circulation & vorticity Accelerations in Carte systems normal and tangential accelerations","Euler’s","Bernoulli equations in 3D– Continuity and Momentum Equations"]},{"l":"II","t":"","h":9,"p":["Prandtl’s contribution to real fluid flows – Prandtl’s boundary layer theory - Boundary layer thickness for flow over a flat plate – Von-Karman momentum integral equation - Blasius solution- Laminar boundary layer – Turbulent Boundary Layer –– Expressions for local and mean drag coefficients for different velocity profiles","Total Drag due to Laminar & Turbulent Layers – Problems"]},{"l":"III","t":"","h":9,"p":["Fundamental concept of turbulence – Time Averaged Equations – Boundary Layer Equations - Prandtl Mixing Length Model - Universal Velocity Distribution Law: Van Driest Model – Approximate solutions for drag coefficients – More Refined Turbulence Models – k-epsilon model - boundary layer separation and form drag – Karman Vortex Trail","Boundary layer control","lift on circular cylinders","Internal Flow: Smooth and rough boundaries – Equations for Velocity Distribution and frictional Resistance in smooth rough Pipes – Roughness of Commercial Pipes – Moody’s diagram"]},{"l":"IV","t":"Compressible Fluid Flow – I","h":9,"p":["Thermodynamic basics – Equations of continuity","Momentum and Energy - Acoustic Velocity Derivation of Equation for Mach Number – Flow Regimes – Mach Angle – Mach Cone – Stagnation State Compressible Fluid Flow – II: Area Variation","Property Relationships in terms of Mach number","Nozzles","Diffusers – Fanno and Releigh Lines","Property Relations – Isothermal Flow in Long Ducts – Normal Compressible Shock","Oblique Shock: Expansion and Compressible Shocks – Supersonic Wave Drag"]}],"b":["Yunus Cengel and John Cimbala, Fluid Mechanics, McGraw Hill Publishing Co. Ltd.","F M White, Viscous Fluid Flow, McGraw Hill Publishing Co. Ltd.","H Schlichting, Boundary Layer Theory, McGraw Hill Publishing Co. Ltd.","Fox, Pritchard and McDonald, Introduction to Fluid Mechanics, John Wiley & Sons Syllabus For PE5 and PE6 Elective Subjects"]},"ECE 501":{"n":"Repair And Retrofitting Of Structures","c":"Professional Elective-5","p":"Design of concrete structures (BCE 303)","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, record, O n e Minor test and One Major Theory Examination.","o":"To learn about repair and retrofitting of concrete structures","co":["The importance of maintenance and assessment method of distressed structures.","The techniques for repair protection methods and understand the properties of repair materials Masonry repair & retrofitting techniques","RC retrofitting; base isolation; damping; bridges; heritage structures","Repair, rehabilitation and retrofitting of structures and demolition methods.","the strength and durability properties, their effects due to climate and temperature.","recent development in concrete"],"u":[{"l":"I","t":"","h":9,"p":["Maintenance","repair and rehabilitation","Facets of Maintenance","importance of Maintenance various aspects of Inspection","Assessment procedure for evaluating a damaged structure","causes of deterioration"]},{"l":"II","t":"","h":9,"p":["Special concretes and mortar","concrete chemicals","special elements for accelerated strength gain","Expansive cement","polymer concrete","Sulphur infiltrated concrete","ferro cement and polymers coating for rebars loadings from concrete","mortar and dry pack","vacuum concrete","Gunite and Shotcrete","Epoxy injection","Mortar repair for cracks","shoring and underpinning","Methods of corrosion protection","corrosion inhibitors","corrosion resistant steels and cathodic protection"]},{"l":"III","t":"","h":9,"p":["Restoration and Retrofitting","Repair Materials","In-situ testing methods for RC and masonry structure","Techniques of repair and retrofitting of masonry buildings"]},{"l":"IV","t":"","h":9,"p":["Repair of structures distressed due to earthquake – Strengthening using FRP -Strengthening and stabilization techniques for repair","Engineered demolition techniques for structures -case studies"]}],"b":["Concrete Structures, Materials, Maintenance and Repair- Denison Campbell, Allen and Harold Roper, (Longman Scientific and Technical, UK),1991"]},"ECE 502":{"n":"Geotechnical Earthquake Engineering","c":"Professional Elective-5","p":"Soil Mechanics (BCE 211)","k":"Lecture: 3, Tutorial: 1, Practical: 0 No. of credits 4","cr":4,"a":"Continuous assessment through attendance, home assignments, quizzes, methods record, viva voce and One Minor test and One Major Theory Examination","o":"To make the students able to develop an understanding of earthquake fundamentals, soil dynamics, seismic effects, and the seismic design of geotechnical structures using codal provisions.","co":["Explain earthquake mechanisms, seismic waves, and geotechnical zards.","Differentiate between earthquake magnitude (Richter scale) and intensity (Mercalli scale).","Evaluate liquefaction potential using simplified methods.","Identify key seismic hazards and site-specific mitigation techniques.","Analyse basic seismic design principles for geotechnical structures.","Interpret case studies of major earthquakes and their geotechnical impacts. Topic covered"],"u":[{"l":"I","t":"","h":9,"p":["Fundamentals of earthquakes and seismicity","plate tectonics and fault mechanisms","seismic waves and wave propagation","earthquake magnitude and intensity scales","ground motion parameters (PGA, PGV, spectral acceleration)","response spectra and design spectra","seismic zoning and hazard overview"]},{"l":"II","t":"","h":9,"p":["Cyclic behaviour of soils","dynamic stress–strain relationships","shear modulus and damping ratio","cyclic triaxial and resonant column tests","shear wave velocity measurements","ground response analysis","site amplification","local site effects and soil nonlinearity"]},{"l":"III","t":"","h":9,"p":["Deterministic seismic hazard analysis (DSHA)","probabilistic seismic hazard analysis (PSHA)","ground motion prediction equations","liquefaction mechanism and cyclic mobility","SPT-based liquefaction evaluation","CPT-based evaluation","shear wave velocity method","post-liquefaction settlement and lateral spreading","liquefaction mitigation techniques"]},{"l":"IV","t":"","h":9,"p":["Seismic bearing capacity of shallow foundations","dynamic earth pressure on retaining structures","pile foundations under earthquake loading","pseudostatic slope stability analysis","Newmark sliding block method","seismic stability of earth dams and embankments","ground improvement and seismic risk mitigation"]}],"b":["Kramer, S.L. Geotechnical Earthquake Engineering (simplified chapters).","Geotechnical Applications for Earthquake Engineering\" by T.G. Sitharam","Geotechnical Earthquake Engineering Handbook\" by Robert W. Day","IS 1893 (Indian Standard for Earthquake-Resistant Design)."]},"ECE 503":{"n":"Environmental Laws And Policy","c":"Professional Elective-5","p":"NIL","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, record, O n e Minor test and One Major Theory Examination.","o":"The main objective is to expand the student knowledge of the comprehensive understanding of environmental laws, policies, and management frameworks in India and globally.","co":["To provide students with a comprehensive understanding of environmental laws, regulatory frameworks, and institutional mechanisms","To enable students to critically analyse models of environmental management","To develop student competency in environmental auditing, monitoring","To able students analyse the sustainability assessment","To foster awareness of the roles and responsibilities of government, NGOs, industries.","To know about citizens in environmental protection"],"u":[{"l":"I","t":"Introduction to Environmental Law and Management Models","h":9,"p":["Evolution and scope of environmental laws in India and globally","Constitutional provisions related to environment (Article 48A, Article 51A (g))","Models of Environmental Management: Command-and- Control","Market-Based Instruments","Voluntary Approaches","The Precautionary Principle","Polluter Pays Principle","Public Trust Doctrine","Environmental Management Tools: EIA (Environmental Impact Assessment)","EMS (Environmental Management Systems)","Life Cycle Assessment (LCA)","Introduction to the Environment Protection Act, 1986"]},{"l":"II","t":"","h":9,"p":["Environmental Policies","Guidelines and Monitoring Mechanisms National Environmental Policy, 2006","Draft National Resource Efficiency Policy","Environmental guidelines and charters (CREP Guidelines, Corporate Environment Responsibility)","Environmental auditing and environmental monitoring – types","procedures","and importance","Environmental reporting","economics","and green accounting","Concept of Extended Producer Responsibility (EPR)","ESG (Environmental, Social, and Governance) reporting","ISO 14001: Environmental Management System Standards","Role of CPCB, SPCBs","and NGT (National Green Tribunal)"]},{"l":"III","t":"","h":9,"p":["Corporate Strategy","Incentives and Stakeholder Engagement","Theories of corporate strategy and environmental policy: Porter Hypothesis","Triple Bottom Line","Environmental incentives: subsidies","tax incentives","carbon credits","tradable permits","Local Economic Development and Environmental Management","Public-Private Partnership (PPP) in environmental governance","Corporate Social Responsibility (CSR) in environmental management","Case studies on successful industrial environmental practices","Environmental ethics and corporate accountability"]},{"l":"IV","t":"","h":9,"p":["Role of Government, NGOs","and Public Participation","Governmental role in environmental governance – regulatory","facilitative","enabling","Role of Non-Governmental Organizations (NGOs) in environmental awareness and activism","Citizen engagement and participatory governance in environmental policy","Policies beyond environmentalism: Urban development","energy","transportation","and agriculture","Sustainability issues: Climate justice","environmental equity","and intergenerational equity","Climate change policies and India's National Action Plan on Climate Change (NAPCC)","Case laws and judicial activism (e.g., Ganga Pollution Case, Vellore Citizens’ Welfare Forum Case)","Green movements in India (e.g., Chipko, Narmada Bachao Andolan)"]}],"b":["Divan, S. & Rosencranz, A. – Environmental Law and Policy in India, Oxford University Press","Leela krishnan, P. – Environmental Law in India, LexisNexis","Cullet, P. – Environmental Law and Policy in India, Routledge","UNEP Manuals – Environmental Management and Policies","Sahu, G.K. – Environmental Law, Himalaya Publishing House","World Bank Reports on environmental governance and local development"]},"ECE 504":{"n":"Highway Geometric Design","c":"Professional Elective-5","p":"Highway Engineering (BCE 263)","k":"Lecture:3, Tutorial: 1, Practical:0","cr":4,"a":"Continuous assessment through tutorials, attendance, home : assignments, quizzes, and One Minor test and One Major Theory Examination.","o":"To introduce the fundamental factors influencing roadway : planning and geometric design and develop the ability to design road sections, alignments, and infrastructure for diverse users and future improvements.","co":["Understand the key design factors to be considered before planning and designing road stretches.","Identify and describe the essential elements of a road section based on various types of road users.","Design the horizontal and vertical alignment profiles of roadways following standard guidelines.","Estimate the traffic handling capacity of roads and determine the need for upgradation.","Analyze and design safe and efficient layouts at road infrastructures.","Recognize and incorporate associated components essential to a complete road system."],"u":[{"l":"I","t":"","h":9,"p":["Introduction","Design factors","functional classification of roads and Space requirements","Cross-sectional elements – Profiles","Factors controlling","common elements","Specific elements (bicycle and pedestrian facilities, service roads)","Road furniture – Longitudinal markings","Junction markings","Object markings","Messages","Road Traffic Signs","delineators","speed breakers"]},{"l":"II","t":"","h":9,"p":["Sight distances – Stopping sight distance","Overtaking sight distance","Intermediate sight distance","Head light sight distance","Factors and sight distance under specific conditions"]},{"l":"III","t":"","h":9,"p":["Highway Alignment – Types","Factors","surveys","Horizontal alignment – guiding principles","simple circular curve","Super elevation","Extra-widening","Transition curve","Gradients","Vertical curves – general guidelines and types","Alignment coordination and issues"]},{"l":"IV","t":"","h":9,"p":["Truck Lay byes","Bus Rapid Transport stations and terminals","Toll Plaza layout design","Pedestrian over bridge and subway","Kilometer stone","Clearances and Access control"]}],"b":["/ Reference books","Khanna, S. K. and Justo, C. e. G., Manual for Highway testing manuals, Enchant Bros., Roorkee.","Kadiyali, L. R., Pr. and design of pavements, Khanna Publishers, New Delhi.","Das A and Chakraborty P, Principles of Transportation Engineering, PHI Pvt. Ltd. New Delhi","Wright, P. H., Highway Engineering, John Wiley and Sons, New York","Indian standards, ASTM Codes, IRC codes, MoRTH Specifications"]},"ECE 505":{"n":"Open Channel Hydraulics","c":"Professional Elective-5","p":"Hydraulics and Hydraulic Machine (BCE 261)","k":"Lecture : 3, Tutorial :1 , Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, methods : home assignments, quizzes, viva voce, One Minor Test, and One Major Theory Examination","o":"To make the students understand and analyze free surface flow in open channels, including flow classification, depth computation, channel design, non-uniform flow, and hydraulic jump characteristics.","co":["To explain the terms of the open channel flow equations and explain the interaction among the terms.","To develop the open channel flow equations from the basic conservation equations.","To solve open channel flow problems through the selection and use of appropriate equations.","To explain the physical mechanisms and mathematical relationships for hydraulic jumps, surges, and critical, uniform, and gradually varying flows as well as spatially varied flow.","Analysis and design of open channel controls, upstream and downstream controls, & spatially varied flow.","Analysis and design of open channel transition, functions, and energy dissipaters."],"u":[{"l":"I","t":"Introduction","h":9,"p":["Basic concepts of free-surface flow","velocity and pressure distribution, Mass","energy","and momentum principle for prismatic and non-prismatic channels","Review of Uniform flow: Standard equations","hydraulically efficient channel sections","compound sections","Energy-depth relations: Concept of specific energy","specific force","critical flow","critical depth","hydraulic exponents","and channel transitions"]},{"l":"II","t":"Gradually Varied Flow (GVF)","h":9,"p":["Equation of gradually varied low and its limitations","flow classification and surface profiles","Control sections","Computation methods and analysis","Integration of varied flow equation by analytical","graphical and advanced numerical methods","Transitions of subcritical and supercritical flow","flow in curved channels"]},{"l":"III","t":"Rapidly Varied Flow (RVF)","h":9,"p":["Characteristics of rapidly varied flow","Classical hydraulic jump","Evaluation of the jump elements in rectangular and non-rectangular channels on horizontal and sloping beds","Hydraulic jump in gradually and suddenly expanding channels","submerged hydraulic jump","rolling and sky jump","use of jump as an energy dissipater","Flow measurement: by sharp-crested and broad crested weirs","critical depth flumes","sluice gate","Free- overfall","Bold Rapidly varied unsteady flow: Equation of motion for unsteady flow","“Celerity” of the gravity wave","deep and shallow water waves","open channel - positive and negative surge"]},{"l":"IV","t":"Spatially Varied Flow (SVF)","h":9,"p":["Basic principles","Differential SVF equations for increasing and decreasing discharge","Classifications and solutions","Numerical methods for profile computation","Flow over side-weir and bottom-rack"]}],"b":["Chow, V.T., Open channel Hydraulics, McGraw Hill International.","Henderson, F.M., Open Channel Flow, McGraw Hill International.","Subramanya, K., Flow in Open Channels, Tata McGraw Hill.","Ranga Raju, K.G., Flow through open channels, T.M.H.","M. Hanif Chaudhry, Open Channel Flow, PHI.","French, R.H., Open channel Hydraulics, McGraw Hill International."]},"ECE 506":{"n":"Groundwater Hydrology","c":"Professional Elective-5","p":"NIL","k":"Lecture :3, Tutorial :1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, methods quizzes, One Minor test and One Major Theory Examination","o":"To make the students understand the basic fundamentals of ground water flow and apply the knowledge of conjunctive use of ground water along with other fresh water sources","co":["Interpret groundwater field data, identify pollutants, saline water intrusion","Acquire preliminary knowledge in identifying the sources of groundwater","Apply knowledge of mathematics in deriving groundwater flow equations for steady and unsteady state","Comprehend the construction, working and development of wells in confined and unconfined aquifers","Understand the causes of groundwater pollution, modelling of contaminants in groundwater system and remedial measures for groundwater pollution","Create computer simulation models for groundwater systems"],"u":[{"l":"I","t":"Introduction","h":9,"p":["Ground water utilization & historical background","ground water in hydrologic cycle","ground water budget","ground water level fluctuations & environmental influence","literature/ data/ internet resources Occurrence of groundwater: Origin & age of ground water","rock properties affecting groundwater","groundwater column","zones of aeration & saturation","aquifers and their characteristics/classification","groundwater basins & springs"]},{"l":"II","t":"Movement of ground water","h":9,"p":["Darcy’s Law","permeability & its determination","Dupuit assumptions","heterogeneity &anisotropy","Ground water flow rates & flow directions","general flow equations through porous media","Advanced well hydraulics: steady/ unsteady","uniform/ radial flow to a well in a confined/ unconfined /leaky aquifer","well flow near aquifer boundaries/ for special conditions","partially penetrating/horizontal wells & multiple well systems","well completion/ development/ protection/ rehabilitation/ testing for yield"]},{"l":"III","t":"Pollution and quality analysis of ground water","h":9,"p":["Municipal /industrial /agricultural /miscellaneous sources & causes of pollution","attenuation/ underground distribution / potential evaluation of pollution","physical /chemical /biological analysis of ground water quality","criteria & measures of ground water quality","ground water salinity & samples","graphical representations of ground water quality"]},{"l":"IV","t":"Modeling and management of ground water","h":9,"p":["Ground water modelling through porous media /analog / electric analog / digital computer models","ground water basin management concept","hydrologic equilibrium equation","ground water basin investigations","data collection & field work","dynamic equilibrium in natural aquifers","management potential & safe yield of aquifers","stream-aquifer interaction"]}],"b":["D.K. Todd and L. F. Mays,\"Groundwater Hydrology\", John Wiley and sons.","K. R.Karanth,\"Hydrogeology\", TataMcGraw Hill Publishing Company.","S. Ramakrishnan,\"Ground water\",S. Ramakrishnan."]},"ECE 601":{"n":"Steel Structures","c":"Professional Elective-6","p":"Structural Analysis (BCE 262)","k":"Lecture: 3, Tutorial: 1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, : home assignments, quizzes, record, One Minor Test and One Major Theory Examination.","o":": To make the students learn the designing of steel structure by analyzing axially loaded tension member, axially loaded column, design of lacing and batten system, design of slab base foundation. The students are expected to be able to demonstrate the following","co":["To know the basic properties of steel and to understand the behaviour according to it.","To know the different steel structure analysis and design.","To know the design and analysis of angle sections, bolted & welded connection.","Design of steel structures according to IS-800-2007 by limit state method.","To understand concepts of strength and stiffness considerations.","Analyze, and design the riveted and bolted connections."],"u":[{"l":"I","t":"Introduction","h":9,"p":["Properties of structural steel","rolled steel sections (ISMB, ISWB, ISA)","and design philosophies (WSM vs. LSM)","Loads: Dead, live, wind","and seismic loads as per IS 875 and IS 1893","Connections: Design of bolted and welded joints","including eccentric connections and prying action"]},{"l":"II","t":"Tension Members","h":9,"p":["Failure modes (yielding, rupture, block shear)","effective net area","and design of plates and angles","Compression Members: Effective length","slenderness ratio","and design of axially loaded columns","Built-up Columns: Design of laced and battened systems for compound sections"]},{"l":"III","t":"Beams","h":9,"p":["Design of laterally supported and unsupported beams","including checks for web buckling and web crippling","Column Bases: Design of slab bases and gusseted bases for transferring loads to foundations"]},{"l":"IV","t":"Roof Trusses","h":9,"p":["Selection of truss types","load calculation on purlins","and design of truss joints","Plate Girders: Introduction to web and flange design","stiffeners","and splices","Plastic Analysis: Concepts of plastic hinges","shape factors","and collapse mechanisms"]}],"b":["Design of Steel Structures by N. Subramaniam, Oxford Publication","Design of Steel Structures by S. K. Duggal, Tata Mc-Graw-Hill Publishing Company","Design of Steel Structures by A. S. Arya & J. L. Ajmani, Nem Chand & Bros.,Roorkee. Design of Steel Structures by Gaylord & Gaylord. 3. IS : 800 –2007"]},"ECE 602":{"n":"Tunnel Engineering","c":"Professional Elective-6","p":"Soil Mechanics (BCE 211)","k":"Lecture : 3, Tutorial : 1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, methods : home assignments, quizzes, viva voce, One Minor Test, and One Major Theory Examination","o":"To make the students able to design the support system for tunnel by understanding the fundamental concepts of tunneling.","co":["Classify different types of tunnels and select appropriate tunnelling methods based on geological conditions.","Evaluate site investigation data and assess ground conditions for tunnel construction.","Design primary and secondary support systems for tunnels using analytical and empirical methods.","Compare and contrast different tunnelling methods and select optimal construction techniques","Assess ventilation, lighting, drainage, and safety considerations in tunnels.","Learn about conventional tunneling methods"],"u":[{"l":"I","t":"Definition and purpose of tunnels, Historical development of tunnelling, Types of tunnels","h":9,"p":["Traffic tunnels","utility tunnels","mining tunnels","Classification based on purpose","location","and construction method","Tunnel geometry and cross-sectional shapes","Economic and environmental considerations","Case studies of major tunnel projects worldwide"]},{"l":"II","t":"","h":9,"p":["Geological factors affecting tunnel construction","Rock mass classification systems (RMR, Q-system, GSI)","Groundwater conditions and hydrogeology","Site investigation methods: Drilling","geophysical surveys","Laboratory and field-testing procedures","Geological hazards: Squeezing ground","swelling rock","gas emissions","Interpretation of geological data for tunnel design"]},{"l":"III","t":"","h":9,"p":["Design philosophy and load considerations","Ground-structure interaction principles","Primary support systems: Rock bolts","shotcrete","steel sets","Secondary support: Concrete lining design","Analytical methods: Ground reaction curves","convergence-confinement","Numerical modelling techniques","Design of portals and approaches","Waterproofing and drainage systems"]},{"l":"IV","t":"Conventional tunnelling methods","h":9,"p":["NATM","Cut and Cover","Mechanized tunnelling: TBM types and selection criteria","Shield tunnelling and EPB machines","Drill and blast techniques","Ground improvement methods","Construction sequence and cycle optimization","Quality control and construction monitoring","Special construction techniques for difficult ground","Tunnel lighting and ventilation systems","Fire safety","emergency systems","and escape routes","Tunnel collapses and case studies","Environmental impacts and mitigation"]}],"b":["Tunnel Engineering Handbook, Thomas R. Kuesel, Elwyn H. King, and John O. Bickel (2nd Edition, Chapman & Hall/CRC, 2012)","Tunnelling and Tunnel Mechanics, Dimitrios Kolymbas","Rock Mechanics and Engineering, Xia-Ting Feng (CRC Press, 2017)","Modern Tunnelling Science and Technology, Bernard Maidl","Tunnelling: Planning, Design, Construction, B. Singh & A.K. Goel","IS Code: IS 5878 (Parts I-VI), Indian Standards for Tunnelling"]},"ECE 603":{"n":"Analysis And Design Of Water Distribution Systems","c":"Professional Elective-6","p":"Water and Wastewater Engineering (BCE 302)","k":"Lecture :3, Tutorial :1 , Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, methods : home assignments, quizzes, viva voce, One Minor Test, and One Major Theory Examination","o":"To provide a thorough theoretical and practical knowledge in water distribution systems using which a student can solve real world problems concerning with design and analysis of pipe network distributions.","co":["Develop water distribution systems with a thorough understanding of hydraulic principles and system components.","Perform calculations and solve problems commonly encountered in water distribution systems, such as volumes, flow rates, velocities, pressures, and chemical dosage","Evaluate existing systems to identify inefficiencies and implement effective solutions.","Apply industry-standard design standards to create efficient and reliable water distribution networks.","Use EPANET2 software to model, analyze, and optimize water distribution systems.","Design comprehensive water systems at the sub-division level, addressing both hydraulic and quality considerations."],"u":[{"l":"I","t":"Introduction to pipe networks","h":9,"p":["Types of networks: serial","branching","and looped","parameters","labelling network elements: branching and looped networks","parameters interrelationships: pipe head loss relationship","node flow continuity relationship","loop head loss relationship","rules for solvability of pipe networks: rules proposed by Shamir and Howard","rules proposed by Goffman and Rodeh","rules proposed by Bhave","comparison of rules"]},{"l":"II","t":"Formulation of equations","h":9,"p":["states of parameters","basic unknown parameters","single source and multi- source networks with known pipe resistances: branching and looped networks","networks with unknown pipe resistances: branched and looped","inclusion of pumps: supply and booster","inclusion of check valves: in an external pipe","in an internal pipe","in several pipes","inclusion of pressure reducing valves"]},{"l":"III","t":"Hardy-Cross Method","h":9,"p":["Method of balancing heads","method of balancing flows","modified Hardy-Cross method","selection of initial values","convergence problems Newton-Raphson Method: Basic concepts","head equations","loop equations","labelling network elements Linear theory method: pipe discharge equations","nodal head equations","relationship between Newton-Raphson and linear theory method"]},{"l":"IV","t":"Dynamic Analysis","h":9,"p":["Iterative method","direct method","Node flow analysis: two node serial network","node classification","NFA theory","Calibration: data collection and preparation","calibration methods","practical considerations"]}],"b":["Pramod R Bhave, Analysis of flow in water distribution networks, Technomic Publications, 2004.","Lewis A Rossman, EPANET 2 User Manual, 2000"]},"ECE 604":{"n":"Urban Transportation System Planning","c":"Professional Elective-6","p":"Highway Engineering (BCE 263)","k":"Lecture:3, Tutorial:1, Practical:0","cr":4,"a":"Continuous assessment through tutorials, attendance, home methods : assignments, quizzes, record, viva voce and One Minor Test and One Major Theory Examination","o":": To make the students familiar with the techniques of urban transportation system by analyzing traffic flow and assigning traffic to appropriate transportation network. The students are expected to be able to demonstrate the following","co":["Analyze urban traffic movement characteristics and estimate traffic demand using appropriate demand functions.","Develop traffic analysis zones and formulate trip generation models using statistical and analytical methods.","Apply various trip distribution models (e.g., growth factor and gravity models) to estimate inter-zonal travel patterns.","Evaluate mode choice behavior using competing and probabilistic modal split models.","Perform traffic assignment using route split analysis and transportation network elements to determine traffic flow patterns.","Apply traffic assignment techniques in transportation networks."],"u":[{"l":"I","t":"Transportation planning process and concepts","h":9,"p":["Role of Transportation","Transportation Problems","Urban Travel Characteristics","Concept of Travel Demand","Demand Function","Demand Estimation"]},{"l":"II","t":"Trip Generation Analysis","h":9,"p":["Zoning","Types and Sources of Data","Expansion Factors","Accuracy Checks","Trip Generation Models (Zonal Models, Household Models, Category Analysis, Trip Attraction of Work Centers)","Trip Distribution Analysis: Trip Distribution Models","Growth Factor Models","Gravity Models","Opportunity Models"]},{"l":"III","t":"Model Split Analysis","h":9,"p":["Model Split Models","Mode Choice Behavior","Competing Models","Mode Split Curves","Probablistic Models"]},{"l":"IV","t":"Traffic Assignment","h":9,"p":["Route Split Analysis","Elements of Transportation Networks","Nodes and Links","Minimum Path Trees","All-or-nothing Assignment","Multiple Assignment","Capacity Restraint"]}],"b":["Kadiyali, L. R., “Traffic engineering and transport planning” ,6th edition, Khanna publishers","Khisty C. J and Lall B. K.,Transportation Engineering, Prentice Hall of India","Papacostas, C. S., Fundamentals of Transportation Engineering, Prentice Hall of India, New Delhi","Prakash Rao and Sundaram, Regional Development Planning in India, Vikas Publishing House.","B.G. Hutchinson, Introduction to Urban Transportation Systems Planning, McGraw Hill. Vukan R. Vuchic, Urban Public Transportation Systems and Technology, Prentice Hall Inc., N.J.","G.E. Gray and L.A. Hoel, Public Transportation Planning Operations and Management, Prentice Hall Inc"]},"ECE 605":{"n":"Analysis And Design Of Hydraulic Structures","c":"Professional Elective-6","p":"Hydraulics and Hydraulic Machine (BCE 261)","k":"Lecture : 3, Tutorial : 1 , Practical: 0","cr":4,"a":"Continuous assessment through tutorials, : attendance, home assignments, quizzes, practical work, record, viva voce and One Minor Test and One Major Theory Examination.","o":"To provide a thorough theoretical and practical knowledge in water management systems using which a student can solve real world problems concerning with river training, gravity and embankment dams and flood routing.","co":["Use and integrate the fundamental and basic studies towards the goal of selecting, analysing, and designing of hydraulic structures.","Cope with decision-making and satisfy competing objectives. 3.Design, analyse and prove that the hydraulic structures are safe and economical.","Work in a team and learn successful group interaction for a project.","Deliver an oral presentation for the project.","Perform studies of various hydraulic structures such as weir/barrages and cross-drainage works."],"u":[{"l":"I","t":"Types of Headworks","h":9,"p":["Component parts of a diversion headwork","Failure of hydraulic structures founded on permeable foundations","principles of design","Bligh’s theory","Khosla’s theory for determination of pressure and exit gradient","Design and drawing of weir and barrages","Regulation Works Falls","Classification","Introduction to design principle of falls","Design and drawing of Sarda type and straight glacis tall","Principle and design & drawing of Distributary head- regulator and cross- regulator","canal escape","Bed bars"]},{"l":"II","t":"Canal Headworks","h":9,"p":["Functions","Location","Layout of headworks","Weir and Barrage","Canal head regulator","Introduction to the design principles of Weirs and barrages on permeable foundations","Design of vertical drop and sloping glacis weir and barrage","Cross Drainage works: Necessity and types","Aqueduct","Siphon Aqueduct","supper passage","canal siphon","level crossing","Introduction to design principles and design and drawing of cross-drainage works"]},{"l":"III","t":"Flood routing","h":9,"p":["Types","methods of reservoir routing","channel routing by Muskingham Method","Investigation and planning of dams and Reservoirs: Zones of storage","Estimation of storage capacity","Reservoir losses","Reservoir sedimentation","and its control","the life of a reservoir","Dams: classification and selection criteria","Earth Dams: Classification","causes of failure Phreatic line","and its determination Introduction to stability analysis"]},{"l":"IV","t":"stability analysis, galleries, joints, control of cracks. Spillways","h":9,"p":["Spillway capacity","types of spillways","Design of ogee spillway","Energy dissipation below the spillway","Design criteria for Hydraulic Jump type stilling basins with horizontal and sloping aprons","design principles of different types of spillway gates"]}],"b":["Water Resources Engg. - Larry W Mays, John Wiley India","Water resources Engg. - Wurbs and James, John Wiley India","Water Resources Engg. - R.K. Linsley, McGraw Hill 29","Irrigation and Water Resources Engg. - G L Asawa, New age International Publishers","Irrigation Engg. And Hydraulic Structures - S. K. Garg, Khanna Publishers","Irrigation and Water Power Engineering- B. C. Punamia & Pande B.B. Lal Syllabus For PE7, PE8 and PE9 Elective Subjects"]},"ECE 701":{"n":"Advance Concrete Technology","c":"Professional Elective – 7","p":"NIL","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes and One Minor test and One Major examination.","o":"To provide students necessary skills and modern advancement in concrete technology.","co":["Able to understand the test results of all the constituents of concrete materials and design the concrete mix using IS code method.","Able to determine the properties of fresh and hardened of concrete design special concretes and their specific applications ensure quality control while testing/ sampling and acceptance criteria.","Understand limit state design philosophy.","Understand the behavior of beam under flexure and shear.","Able to design beams using limit state method.","Able to design one way slab using limit state method."],"u":[{"l":"I","t":"","h":9,"p":["Constituent of concrete","grade of concrete","manufacturing of concrete","importance of water cement ratio","properties of fresh concrete workability","factor affecting workability","consistency","cohesiveness","bleeding","segregation Properties of hard concrete","compressive","tensile and flexure strength","modulus of elasticity","shrinkage and creep"]},{"l":"II","t":"","h":9,"p":["Mix design for compressive strength by various methods","mix design for flexural strength","Admixtures used in cement concrete","Introduction to Various Design Philosophies","Design of Rectangular Singly and Doubly Reinforced Sections by Working Stress Method","Assumptions in Limit State Design Method","Design of Rectangular Singly and Doubly Reinforced beams","T-beams","L-beams"]},{"l":"III","t":"","h":9,"p":["Behavior of RC beams in Shear","Shear Strength of beams with and without shear reinforcement","Minimum and Maximum shear reinforcement","Introduction to development length","Anchorage bond","flexural bond","Failure of beam under shear"]},{"l":"IV","t":"","h":9,"p":["Design of one way and two-way slabs","Serviceability Limit States","Control of deflection","cracking and vibrations","Design of Columns by Limit State Design Method","Effective height of columns","Minimum eccentricity","column under axial compression","requirements for reinforcement","Column with helical reinforcement"]}],"b":["IS : 456 – 2000.","Reinforced Concrete – Limit State Design by A. K. Jain, Nem Chand & Bros., Roorkee.","Plain and Reinforced Concrete Vol. I & II by O. P. Jain & Jai Krishna, Nem Chand & Bros.","Reinforced Concrete Structures by R. Park and Pauley.","Reinforced Concrete Design by P. Dayaratnam."]},"ECE 702":{"n":"Earth And Earth Retaining Structures","c":"Professional Elective – 7","p":"Foundation Engineering (BCE 301)","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes and One Minor test and One Major examibation","o":"To make students understand the principles, analysis, design, and construction aspects of ground improvement techniques and earth-retaining structures for safe and efficient geotechnical engineering applications.","co":["Explain the concepts and design considerations involved in overexcavation and replacement methods, including settlement and bearing capacity behaviour.","Apply principles of in situ ground reinforcement such as ground anchors and soil nailing for improving slope and retaining system stability.","Classify and select suitable retaining structures based on soil conditions, loading, and construction requirements.","Analyze different types of gravity, embedded, and composite retaining walls considering structural and geotechnical performance.","Evaluate factors affecting earth pressure and assess wall– soil interaction under static and seismic loading conditions.","Design retaining systems incorporating stability analysis, drainage provisions, and practical construction considerations."],"u":[{"l":"I","t":"Over excavation and replacement","h":9,"p":["Stress distribution and failure modes","general shear and punching failures","failure of distributed foundations","minimum bearing capacity and factor of safety","settlement of footings on layered soils and replaced zones","Construction aspects including selection of fill material","excavation","placement and compaction","and quality control covering locations"]},{"l":"II","t":"Ground reinforcement","h":9,"p":["Ground anchors and soil nailing","principles","design considerations & procedures","construction methods","design recommendations","global stability considerations","nail–soil pull-out failure","factors of safety and composite support systems"]},{"l":"III","t":"","h":9,"p":["Classification of retaining structures","gravity walls including mass concrete","gabions, crib","interlocking block","masonry","semi-gravity concrete","reinforced concrete cantilever","counterfort","and buttressed walls","Embedded wall systems","sheet pile walls","bored pile walls","diaphragm walls","king post or soldier pile walls","and jet-grouted walls"]},{"l":"IV","t":"","h":9,"p":["Fundamentals of earth-retaining systems","selection & design criteria","modes of failure","factors affecting earth pressure","wall and ground movements","wall flexibility and required movements for active and passive states","external loading effects","compaction pressures","swelling","shrinkage","and thermal effects","Stability of retaining walls under seismic loading","embedded wall design considerations"]}],"b":["Clayton, C.R.I., Woods, R.I., Bond, A.J., and Milititsky, J. Earth Pressure and Earth-Retaining Structures, Third Edition, CRC Press, Taylor & Francis Group.","Han, J. Principles and Practice of Ground Improvement, Wiley, 2015.","Almeida, M. and Marques, M.E.S. (2013) Design and Performance of Embankments on Very Soft Soils, CEC Press, London, U.K.","Hausmann, M.R. (1976) Engineering principles of ground modification, McGraw-Hill Publishing Co., New York, N.Y. USA.","Kempfert, H.G. and Gebreselassie, B. (2006) Excavations and Foundations in Soft Soils, Springer, The Netherlands.","Koerner, R.M. (2012) Designing with Geosynthetics. Vols. 1&2, 6th Edition, Xlibris Corporation, USA.","Jewell, R.A. (1996) Soil reinforcement with geotextiles, CIRIA & Thomas Telford, London, U.K.","John, N.W.M. (1987) Geotextiles, Blackie & Son Ltd., London, U.K.","Jones, C.J.F.P. (2010) Earth Reinforcement and Soil Structures, Thomas Telford, London, U.K.","Saran, Swami (2006) Reinforced Soil and its Engineering Applications, I.K. International, New Delhi.","Shukla, S.K. (2012) Handbook of Geosynthetic Engineering, 2nd Edition, ICE Publishing, London, U.K."]},"ECE 703":{"n":"Environmental Change And Sustainable Development","c":"Professional Elective – 7","p":"NIL","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes and One Minor test and One Major examination.","o":"The main objective is to expand the student knowledge of the sustainability, environmental change, and development challenges through global frameworks like the SDGs, systems thinking, and engineering tools.","co":["To introduce students to the key concepts, challenges, and debates related to environmental change","To develop an understanding of sustainability indicators, systems thinking, and the inter linkages among ecological","To understand the students about the SDGs goals.","To equip students with engineering tools and frameworks such as life cycle assessment","To promote critical thinking on the relevance of traditional knowledge, community- based practices","To understand about the traditional approaches to sustainability."],"u":[{"l":"I","t":"","h":9,"p":["Foundations of Sustainability and Environmental Change","Introduction to sustainability and sustainable development","Key issues: food security","material consumption","energy resources","and ecological footprint","Ethical dimensions of sustainability: intergenerational equity","environmental justice","planetary boundaries","Global and local resource demands – current trends and future projections","Paradigms of environmental change: from agricultural age to industrial and post-industrial age","Concept of circular economy and resource efficiency","Environmental Kuznets Curve"]},{"l":"II","t":"Population, Growth Limits, and Sustainability Debates. Population growth and resource use","h":9,"p":["Malthusian theory","Demographic Transition","Limits to Growth (Club of Rome Report) – critical review and current relevance","Carrying capacity and ecological resilience","Current debates in sustainability: green growth vs","degrowth","techno-optimism vs","ecological realism","Environmental movements and grassroots sustainability initiatives","Climate change and sustainability linkages","Role of education and communication in sustainability transitions"]},{"l":"III","t":"","h":9,"p":["Sustainable Development Goals (SDGs) and Systems Thinking","United Nations Sustainable Development Goals (SDGs): Overview and India’s progress","Relationships between ecological","economic","and social systems – the \"Triple Bottom Line\"","System dynamics for sustainability assessment","Environmental and social indicators of sustainability (HDI, Ecological Footprint, GPI, etc.)","Environmental justice and gender in sustainable development","National missions aligned with SDGs (e.g., National Solar Mission, Swachh Bharat Abhiyan)"]},{"l":"IV","t":"","h":9,"p":["Engineering and Traditional Approaches to Sustainability","Engineering tools for sustainability: EIA, LCA","carbon footprint analysis","green design","Sustainable engineering practices in energy, water","and construction sectors","Role and relevance of traditional ecological knowledge (TEK) and rural development paradigms","Community-based natural resource management (CBNRM) and participatory approaches","Bioeconomy","green infrastructure","and nature-based solutions","Smart villages and sustainable rural infrastructure in India"]}],"b":["/ Reference books","Kates, R. W., Parris, T. M., & Leiserowitz, A. A. – What is Sustainable Development? Goals, Indicators, Values, and Practice","Meadows, D.H., Meadows, D.L., & Randers, J. – Limits to Growth","Mebratu, D. – Sustainability and Sustainable Development: Historical and Conceptual Review, Environmental Impact Assessment Review","Margerum, R. – Beyond Consensus: Improving Collaborative Planning and Management","MoEF&CC, NITI Aayog, Government of India – Reports on SDGs and sustainability","UNDP – Human Development Reports","World Bank – Reports on climate change and sustainability","CPCB – Guidelines on sustainable development practices in India Chopra, K., and Kadekodi, G.K., Operationalisting Sustainable Development, Sage Publication, New Delhi, 1999."]},"ECE 704":{"n":"Intelligent Transportation System","c":"Professional Elective – 7","p":"NIL","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes and One Minor test and One Major examination.","o":"To make the students understands the concept of Intelligent Transportation Systems (ITS) and their application to solve the problem of modern urban transportation system.","co":["Understand the fundamentals and objectives of Intelligent Transportation Systems (ITS) and its evolution.","Explain various data collection techniques used in ITS including detectors, AVL, AVI, GIS, and video analytics.","Demonstrate the role and functioning of telecommunication systems within ITS infrastructure.","Identify and describe the major functional areas of ITS","Analyze ITS user needs and service domains such as traffic, transit, payment, safety, and emergency management.","Evaluate the integration of information and communication technologies for efficient traffic and transportation management."],"u":[{"l":"I","t":"Introduction to Intelligent Transportation Systems (ITS)","h":9,"p":["Definition of its and Identification of its Objectives","Historical Background","Benefits of ITS","its Collection Techniques - Detectors","Automatic Vehicle Location (AVL)","Automatic Vehicle Identification (AVI)","Geographic Information System (GIS)","Video Data Collection"]},{"l":"II","t":"Telecommunication in ITS","h":9,"p":["Importance of Telecommunications in the its System","Information Management","Traffic Management Centres (TMC)","Vehicle - Road Side Communication","Vehicle Positioning System"]},{"l":"III","t":"ITS Functional Areas","h":9,"p":["Advanced Traffic Management System (ATMS)","Advanced Traveller Information Systems (ATIS)","Commercial Vehicle Operations (CVO)","Advanced Vehicle Control System (AVCS)","Advanced Public Transportation System (APTS)","Advance Rural Transportation Systems (ARTS)"]},{"l":"IV","t":"ITS User Needs and Services","h":9,"p":["Travel and Traffic Management","Public Transportation Management","Electronic Payment","Commercial Vehicle Operations","Emergency Management","Advanced Vehicle Safety Systems","Information Management"]}],"b":["Sussman, J.M., Perspective on ITS, Artech House Publications, 2005","ITS Hand book 2000: Recommendations for world road association (PIARC) by Kan Paul Chen, John Miles","Chen, Kan and John C. Miles, ed. ITS Handbook 2000: Recommendations from the World Road Association (PIARC). Artech House Inc, Boston, 1999. 2.","McQueen, Bob, Rick Schuman, and Kan Chen. Advanced Traveler Information Systems, Artech House Inc., Boston, 2002.","Ozbay, Kaan, and Pushkin Kachroo. Incident Management in Intelligent Transportation Systems, Artech House, Boston."]},"ECE 705":{"n":"Water Resources Management","c":"Professional Elective – 7","p":"NIL","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes and One Minor test and One Major examination.","o":"To make the students understands the basic principles of water resources and its planning and management.","co":["Understand the planning of water resources and need for water resource management.","Understand the water resource potential in global, India scenario and explore the water resources using different technologies.","Acquire a knowledge international and national water law and its policy.","Explain the concept of water in agricultural and economic aspects.","Predict the future trends of water demand and its management during crisis","Be aware of various national and international laws associated with water usage"],"u":[{"l":"I","t":"Water, A Multi-Dimensional Resource","h":9,"p":["Water resources planning- multi-dimensional management- Water withdrawal and consumption by sector-Stress","international policy- Climate change","oceans","challenges and need for water resource management Global and Indian Scenario for Water Resources: Surface Water and Groundwater Global and Indian Scenario-Quality of water resources Water use and sustainable reuse methods- Usable water resources by continent and country-Water footprint"]},{"l":"II","t":"Water Resources Assessment","h":9,"p":["Network design-Stream flow gauging-Weir design-Gauges- Current gauging-Salt dilution Geophysical Exploration-Test drilling-Application of remote sensing techniques Water in Agricultural Systems: Water for food production","virtual water trade for achieving global water security","irrigation efficiencies","irrigation methods and current water pricing","water for livestock and processing","water pollution from agricultural production"]},{"l":"III","t":"Water Economics","h":9,"p":["Economic characteristics of water good and services-Nonmarket monetary va l u a t i o n methods-Water economic instruments-Policy options for water conservation and sustainable use","pricing","distinction between values and charges-Private sector involvement in water resources management"]},{"l":"IV","t":"Water Legal and Regulatory Settings","h":9,"p":["National and International Framework for Water Law","Basic structure of water law- An overview of water law in India -Evolution of water law","key features of water law","evolving water law and policy-Water policy for Irrigation","decentralization and participation in irrigation management","and the policy measures proposed to establish water user associations","National level initiatives for regulation of groundwater","State groundwater laws and rainwater harvesting"]}],"b":["David Stephenson, Water Resources Management, 2004, A. A. Balkema Publishers, Netherlands.","Louis Theodore, Ryan Dupont R., Water Resource Management Issues, Basic Principles and Applications, 2020, CRC Press, Taylor & Francis Group, New York.","Philippe Cullet and Sujith Koonan, Water Law in India- An Introduction to Legal Instruments, 2017. Second Edition, Oxford University Press, New Delhi.","Subramanya. K., Engineering Hydrology, 2020, Fifth Edition, McGraw Hill Education Pvt. Ltd., New Delhi."]},"ECE 706":{"n":"Application Of Machine Learning In Civil Engineering","c":"Professional Elective – 7","p":"NIL","k":"Lecture : 3, Tutorial :1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home : assignments, quizzes, viva voce, One Minor Test, and One Major Theory Examination","o":"To make the students understand the concepts and techniques of AI -ML and explore their applications in civil engineering.","co":["Identify the basics of Artificial Intelligence and Machine Learning.","Indicate how AI and ML can improve different activities in civil engineering.","Apply AI and ML algorithms to solve problems in civil engineering.","Develop skills to apply AI and ML algorithms for solving problems in civil engineering.","Applications of AI to construction management problems","Knowledge about ethical considerations in AI and ML applications"],"u":[{"l":"I","t":"Introduction to AI and ML","h":9,"p":["1 Scope of the Course","Introduction to AI and ML","Brief review of History of AI and ML","Related fields","Introduction to Artificial Neural Networks: Biological Neurons and Biological Neural Networks","Artificial Neural Networks","Activation Functions","Perceptron NN","Multilayer Perceptron NN","Back-propagation Neural Networks","Training Methods","Basic definition of supervised and unsupervised Learning","Introduction to Machine Learning: Introduction (Different Types of Learning) Hypothesis Space","Inductive Bias","Evaluation and Cross Validation"]},{"l":"II","t":"","h":9,"p":["Application of AI/ML in Structural Analysis","Design Optimization Techniques using Genetic Algorithms and Neural Networks","Case Studies: Predictive Maintenance and Optimal Design Solutions","Structural health monitoring with AI techniques","Case studies: predictive modeling for structural integrity assessment"]},{"l":"III","t":"","h":9,"p":["Introduction to design optimization","Genetic algorithms and optimization techniques","Neural network- based optimization","Application of ML in optimal design of civil engineering structures"]},{"l":"IV","t":"","h":9,"p":["Introduction to construction management","Schedule optimization using ML algorithms","Resource allocation and risk management with AI","Predictive analytics for infrastructure maintenance","Case studies: AI-driven construction project management systems","Introduction to infrastructure monitoring","IoT and sensor data integration with ML","Implementation of AI and ML algorithms using Python","Ethical considerations in AI and ML applications","Regulatory challenges and standards in civil engineering","Future trends and emerging technologies in AI and ML for civil engineering"]}],"b":["Machine Learning with Python for Everyone, Mark Fenner, Pearson","Machine Learning, Anuradha Srinivasaraghavan, Vincy Joseph, Wiley","Machine Learning with Python, U Dinesh Kumar Manaranjan Pradhan, Wiley","Neural Networks, Fuzzy Logic, and Genetic Algorithms : Synthesis and Applications By S. Rajshekharan, G. A. Vijayalakshmi Pai, PHI","KishanMehrotra, Chilukuri Mohan and Sanjay Ranka, Elements of Artificial Neural Networks, Penram International","Tom Mitchell, Machine Learning, TMH","Athem Ealpaydin, Introduction to Machine Learning, PHI 8. Andries P. Engelbrecht, Computational Intelligence - An Introduction, Wiley Publication"]},"ECE 801":{"n":"Design Of Masonry Structures","c":"Professional Elective – 8","p":"NIL","k":"Lecture : 3, Tutorial : 1 , Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, : methods home assignments, quizzes, viva voce, One Minor Test, and One Major Theory Examination","o":"To make the students learn about masonry structures and their design aspect including reinforced masonry and masonry walls in composite action.","co":["Describe about masonry construction","Assess the strength and stability of masonry walls","Explain the design aspects of reinforced masonry","Describe the behaviour of reinforced masonry & masonry walls in composite action","Apply codal provisions to evaluate and design masonry structures under practical loading conditions."],"u":[{"l":"I","t":"Masonry Construction","h":9,"p":["Brick","stone and block masonry units – strength","modulus of elasticity and water absorption of masonry materials –classification and properties of mortars","selection of mortars","Defects and errors in masonry construction","cracks in masonry, types","reasons for cracking","methods of avoiding cracks"]},{"l":"II","t":"Strength and Stability","h":9,"p":["Strength and Stability of concentrically loaded masonry walls","effect of unit strength","mortar strength","joint thickness","rate of absorption","effect of curing","effect of ageing","workmanship","strength formulae and mechanism of failure for masonry subjected to direct compression"]},{"l":"III","t":"Design Considerations","h":9,"p":["Effective height of walls","opening in walls","effective length","effective thickness","slenderness ratio","eccentricity","load dispersion","arching action","lintels"]},{"l":"IV","t":"Design of Masonry Walls","h":9,"p":["Design of load bearing masonry for building up to 3 storeys using IS: 1905 and SP: 20 procedures"]}],"b":["Henry,A.W, “Structural masonry”, Macmillan Education Ltd., 1990.","Dayarathnam.P, “Brick and reinforced brick structures”, Oxford & IBH Publication, 1987. References:","Sinha, B.P and Davies, S.R, “Design of Masonry Structures”, E & FN spon, 1997.","IS 1905-1987, “Code of practice for structural use of unreinforced masonry”, 3rd Revision, BIS, New Delhi.","SP 20 (S&T), “Hand book on Masonry Design and Construction”, 1st Revision, BIS, New Delhi, 1991."]},"ECE 802":{"n":"Advanced Foundation Engineering","c":"Professional Elective – 8","p":"Foundation Engineering (BCE 301)","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home Methods assignments, quizzes, record, o n e minor test, and one Major Theory Examination.","o":"To enable students to understand the advanced behaviour and design of shallow and deep foundations, pile and caisson systems, earth-retaining structures, and machine foundation analysis under static and dynamic loading conditions.","co":["Apply soil–foundation interaction concepts in advanced foundation analysis.","Analyse and design raft (mat) foundations.","Evaluate axial capacity of single piles and interpret load tests.","Analyse pile group behaviour including settlement and negative skin friction.","Assess laterally loaded piles and special deep foundations (well and caisson).","Perform dynamic analysis and design of machine foundations."],"u":[{"l":"I","t":"Raft Foundations and Soil–Structure Interaction","h":9,"p":["Raft foundations for buildings and tower structures","types of rafts","soil–structure interaction concepts","modulus of subgrade reaction","contact pressure variation","nonlinear behaviour of soil–foundation system","analysis and design considerations of raft foundations"]},{"l":"II","t":"Advanced Pile Foundation Analysis","h":9,"p":["Pile foundations: types and methods of installation","load carrying capacity of single pile","static and dynamic analysis of piles","pile load tests and codal provisions","pile groups in sands and clays – settlement and group efficiency","negative skin friction","behaviour of piles under lateral loading using Winkler’s theory","batter piles – analysis concepts"]},{"l":"III","t":"Special Deep Foundations for Heavy Structures","h":9,"p":["Foundations for heavy structures","well foundations and caisson foundations","construction methods and equipment","stability considerations","load transfer mechanisms","settlement behaviour and design principles"]},{"l":"IV","t":"Machine Foundations","h":9,"p":["Types of machine foundations","theory of vibrations","free and forced vibrations of single degree freedom system","damping effects","dynamic soil properties","permissible amplitudes","design criteria for machine foundation blocks and vibration isolation principles"]}],"b":["Das, B. M. (2011). Principles of Foundation Engineering (7th ed.). Stamford, CT, USA: Cengage Learning.","Bowles, J. E. (1996). Foundation Analysis and Design (5th ed.). New York, USA: McGraw- Hill Education.","Tomlinson, M. J., & Woodward, J. (2014). Foundation Design and Construction (7th ed.). Harlow, England: Pearson Education Ltd.","Saran, S. (2006). Analysis and Design of Substructures (2nd ed.). New Delhi, India: Oxford & IBH Publishing Co. Pvt. Ltd.","Murthy, V. N. S. (2002). Soil Mechanics and Foundation Engineering (1st ed.). New Delhi, India: CBS Publishers & Distributors.","Ranjan, G., & Rao, A. S. R. (1991). Basic and Applied Soil Mechanics (2nd ed.). New Delhi, India: New Age International (Publishers).","Srinivasulu, P., & Vaidyanathan, C. V. (2009). Handbook of Machine Foundations (3rd ed.). New Delhi, India: Tata McGraw-Hill Publishing Company."]},"ECE 803":{"n":"Environmental Impact Assessment","c":"Professional Elective – 8","p":"NIL","k":"Lecture : 3, Tutorial : 1 , Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home : assignments, quizzes, viva voce, One Minor Test, and One Major Theory Examination","o":"To make the students understand the basic principles of environmental impact assessment and their application to assess risks posing threats to the environment.","co":["Able to explain the concepts about the Environmental Impact Assessment (EIA).","Able to evaluate the subjects which must be considered in EIA projects.","Knowledge about various screening methods for EIA","Able to overview of assessing risks posing threats to the environment","Able to access different case studies/examples of EIA in practice","Able to prepare EIA reports."],"u":[{"l":"I","t":"Introduction","h":9,"p":["Environment and its components","Concept of Ecological imbalances","carrying capacity and sustainable development Legal","Policy & Regulatory framework: Legislative and environmental clearance procedures in India and other countries","Impact Assessment Methodologies? Matrices","overlays","network analysis"]},{"l":"II","t":"EIA Procedure ‐ Scoping & Screening","h":null,"p":["Evolution of environmental impact assessment (EIA)","Current screening process in India","A step-by-step procedure for developing EIA","Elements of Environmental Analysis","EIA Methodologies and Impact Identification: Public consultation","Post monitoring","Data collection for Air Quality Impact analysis","Environmental health impact assessment","Environmental risk analysis","Economic valuation methods","Cost-benefit analysis"]},{"l":"III","t":"","h":null,"p":["Prediction & Assessment of Impacts on the Water and Soil Environment","Water Quality Impact Analysis and energy impact analysis","Impact Analysis of Water resources projects","Prediction & Assessment of Impacts on the Soil Environment"]},{"l":"IV","t":"","h":null,"p":["EIA Case Studies","EIA Reporting & Review of EIA","Case studies of Industrial and other EIA projects","Brief introduction about Environment legislation and Environmental Audit","Practical applications of EIA methodologies"]}],"b":["Environmental Impact Assessment by C.W. Canter","Environmental Impact Assessment for Developing Countries: Asit K. Biswas","A Chadwick, Introduction to Environmental Impact Assessment, Taylor & Francis , 2007","R.Therirvel, E. Wilson, S. Hompson, D. Heaney, D.Pritchard, Strategic Environmental Assessment, Earthscan, London , 1992","Paul, A Erickson, A Practical Guide to Environmental Impact Assessment, Academic Press , 1994"]},"ECE 804":{"n":"Planning, Design And Construction Of Rural Roads","c":"Professional Elective – 8","p":"Highway Engineering (BCE 263)","k":"Lecture : 3, Tutorial : 1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home : assignments, quizzes, viva voce, One Minor Test, and One Major Theory Examination","o":"To make the students aware the knowledge of rural road planning approaches, their design and construction using sustainable approaches.","co":["Explain rural road planning approaches, models, and optimal network concepts.","Apply geometric design standards for rural and hill roads as per PMGSY guidelines.","Design flexible and rigid pavements for rural roads using relevant IRC provisions.","Identify road failures and suggest suitable remedial measures.","Select appropriate conventional, marginal, and waste materials and apply suitable mix design methods.","Describe low-cost construction techniques and waste material utilization in rural roads, including hill area considerations."],"u":[{"l":"I","t":"Planning of Rural Roads","h":9,"p":["Classification of roads","brief introduction to earlier 20 year plans","system’s approach","NATPAC model","gravity model","CRRI model","Accessibility Based Rural Network Planning model","concept of link efficiency","optimal road network planning approach"]},{"l":"II","t":"Geometric Design","h":null,"p":["Geometric design standards for rural roads with special reference to PMGSY","hill road standards","Pavement Design: Various pavement design methods for rural roads including flexible and rigid pavements using IRC:SP-20","IRC-72","IRC-37","IRC:SP-62","CRRI nomograms","Type and causes of road failures and their remedial measures"]},{"l":"III","t":"Materials and Mix design methods","h":null,"p":["Conventional materials","marginal and waste materials including fly ash","Granular Blast Furnace Slag (GBFS)","Blast Furnace Slag (BFS)","Steel Making Slag (SMS)","bagasse and Crum Rubber Modified Binder (CRMB), etc","Mix Design Methods: CRRI method","triangular chart method","Fuller’s method","Rothfuch method","PI based method"]},{"l":"IV","t":"Construction","h":null,"p":["Low cost techniques for rural road construction","tractor bound technology","special considerations for hill areas","Case studies of waste material utilization in rural roads"]}],"b":["“Rural Roads Manual”, SP-20, IRC. 2002","“Document on Rural Road Development”, Vol. I & II, CRRI. 1990","“PMGSY Operation Manual”, NRRDA. 2005","“Specifications for Rural Roads”, MoRD, IRC. 2004","Khanna, S.K. and Justo, C.E.G., “Highway Engineering”, Nem Chand & Bros. 2004","Kadiyali, L.R., “Traffic Engineering and Transport Planning”, Khanna Publishers. 1999","“Quality Assurance Handbook for Rural Roads”, NRRDA"]},"ECE 805":{"n":"Urban Stormwater Management","c":"Professional Elective – 8","p":"NIL","k":"Lecture : 3, Tutorial : 1 , Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home : assignments, quizzes, viva voce, One Minor Test, and One Major Theory Examination","o":"To make the students understand the dynamics of urban hydrological cycle and provide knowledge of suitable stormwater management techniques","co":["Explain the effect urbanization has on water pathways","Describe the effects of climate change on rainfall and urban hydrology","Compare different stormwater control measures","Explain the contribution of stormwater control measures to urban climate adaption","Reflect on the importance of stormwater in the urban planning process","Learn about various stormwater models"],"u":[{"l":"I","t":"Urban Hydrology and Stormwater","h":9,"p":["Urban hydrology and stormwater problems","Interaction of land use and urban storm runoff","stormwater planning in urban areas","new directions in urban hydrology and stormwater management","Rainfall Abstractions: Introduction","interception","depression storage","infiltration processes","SCS method","phi-index","importance of losses in urbanized basins"]},{"l":"II","t":"Urban Runoff Processes","h":null,"p":["Introduction","surface runoff subsystem","transport subsystem","time of concentration for urban drainage system","urban runoff calculation methods","Urban Runoff Quality: Pollution potential of stormwater","sources of pollutants","entry of pollutants into urban runoff","estimation of pollution rate","washoff of pollutants from undeveloped areas","environmental assessment consideration"]},{"l":"III","t":"Data Collection","h":null,"p":["Data collection strategy","types of data and examples","rainfall and streamflow data collection","pollutant data","land use characteristics"]},{"l":"IV","t":"Overview of Urban Stormwater Models","h":null,"p":["Introduction","role of urban stormwater models","planning models","design and analysis models","operation and control models","data requirements","model calibration","validation","and verification"]}],"b":["David F Kibler and Delleur, J. W., Introduction to urban hydrology and stormwater management, American Geophysical Union, 2013.","Shaw L Yu, Stormwater management for transportation facilities, National Cooperative Highway Research Program, 174, Transportation Research Board, USA, 1993.","Wanielista and Eglin, Hydrology – Quantity and Quality Control, Wiley, 2006","Statre P and Urbanos, Stormwater deduction for drainage and CSO management, Prentice Hall, 2003"]},"ECE 901":{"n":"Seismic Design Of Structures","c":"Professional Elective – 9","p":"NIL","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes and One Minor test and One Major Theory Examination","o":"To make the students understand the basic of seismic load and their application in design of structures.","co":["To introduce nature and characteristics of various dynamics loads.","To have considerable knowledge of theory of vibrations including multi-degree of freedom systems.","To assess of structural failure due to earthquakes.","To analyze and design structures subjected to seismic loading as per IS codes.","To introduce ductile detailing of structures, concept of soft story and design of shear walls as per IS codes.","Understand the concept of base shear, natural time period and natural frequency."],"u":[{"l":"I","t":"Seismological background","h":9,"p":["Seismicity of a region","earthquake faults and waves","structure of earth","plate tectonics","elastic-rebound theory of earthquake","Richter scale","measurement of ground motion","seismogram"]},{"l":"II","t":"","h":9,"p":["Definitions of basic problems in dynamics","static versus dynamic loads","different types of dynamic loads","un-damped and damped vibration of SDOF system","natural frequency","and periods of vibration","damping in structure","response to periodic loads","response to general dynamic load","response of structure subject to gravitational motion","lumped SDOF elastic systems","translational excitation"]},{"l":"III","t":"","h":9,"p":["Multi Degree of Freedom Systems Two degree and multi-degree freedom systems lumped MDOF elastic systems","translational excitation time history analysis","multistoried buildings with symmetric plans","multistoried buildings with unsymmetrical plans","combining maximum modal responses using mean square response of a single mode","SRSS and CQCC combination of modal responses","earthquake response spectra","factors influencing response spectra","design response spectra for elastic systems","peak ground acceleration","response spectrum shapes","deformation","pseudo-velocity","pseudo- acceleration response spectra","peak structural response from the response spectrum","response spectrum characteristics"]},{"l":"IV","t":"","h":9,"p":["Concepts of Earthquake Resistant Design of Reinforced Concrete Buildings – Earthquake and vibration effects on structure","identification of seismic damages in R","buildings","Effect of structural irregularities on the performance of R","buildings during earthquakes and seismo- resistant building architecture Seismic Analysis and Modelling of R","Buildings: I","code method of seismic analysis: seismic co- efficient method and its limitation","response spectrum method","IS: 1893 (Part 1)-2016","seismic design considerations","allowable ductility demand","ductility capacity","reinforcement detailing for members and joints as per IS 13920 - 2016, of R","building"]}],"b":["Earthquake Resistant Design of Structures - P. Agarwal & M. Shrikhande","Structural Dynamics – Theory & Computation - Mario Paz","Dynamics of Structures Theory and Applications to Earthquake Engineering - Anil K. Chopra","Introduction to Structural Dynamics - J.M. Biggs","Elements of Earthquake Engineering - Jai Krishna and A.R. Chandrasekharan","Fundamental of Earthquake Engineering - N.M. Neumarks and E. Rosenblueth","Engineering Vibrations - L.S. Jacobsen & R.S. Ayre","Structural Dynamics - R. Roy Craig Jr.","Dynamics of Structures - R.W. Clough & J. Penjien 3. Reinforced Concrete Design by P. Dayaratnam."]},"ECE 902":{"n":"Foundation On Expansive Soil","c":"Professional Elective – 9","p":"Foundation Engineering (BCE 301)","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, record, One Minor Test, and one Major Theory Examination.","o":"To provide a n exposure on the properties of expansive soils and to study about the substructures placed on expansive soils.","co":["To assess the occurrence and distribution of expansive soils.","To study the properties of expansive soils","To study the controlling techniques of expansive soils.","To understand various methods of stabilization of expansive soils and foundations used in expansive soils.","Design foundations on expansive soil.","Select suitable techniques and understand the mechanism of treatment of swelling Soils."],"u":[{"l":"I","t":"General principles","h":9,"p":["Origin of expansive soils","Physical properties of expansive soils","Mineralogical composition","Identification of expansive soils","Field conditions that favour swelling","Consequences of swelling"]},{"l":"II","t":"Swelling characteristics","h":9,"p":["Swelling characteristics","Laboratory tests","Prediction of swelling characteristics","Evaluation of heave","Techniques for controlling swelling: Horizontal moisture barriers","Vertical moisture barriers","Surface and subsurface drainage","Pre-wetting","Soil replacement","Sand cushion techniques","CNS layer technique"]},{"l":"III","t":"Foundations on expansive soils","h":9,"p":["Belled piers","Bearing capacity and skin friction","Advantages and disadvantages","Design of belled piers","Under reamed piles","Design and construction"]},{"l":"IV","t":"Modification of swelling characteristics","h":9,"p":["Lime stabilization","Mechanisms","Limitations","Lime injection","Lime columns","Mixing","Chemical stabilization","Construction"]}],"b":["/ Reference books","Fu Hua Chen, Foundations on Expansive Soils, Elsevier Scientific Publishing Company, New York.","Gopal Ranjan & A.S. Rao, Basic and Applied Soil Mechanics, New Age International Publishers – New Delhi.","Handbook on Underreamed and Bored Compaction Pile Foundation, CBRI, Roorkee.","IS: 2720 (Part XLI) – 1977 – Measurement of Swelling Pressure of Soils.","R.K. Katti, Search for Solutions in Expansive Soils.","Alam Singh, Modern Geotechnical Engineering, Geo-Environ Academia, Jodhapur.","Swami Saran, Analysis and Design of Substructures, Oxford & IBH, New Delhi."]},"ECE 903":{"n":"Environmental Data Science And Analytics","c":"Professional Elective – 9","p":"NIL","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, record, One Minor test, and one Major Theory Examination.","o":"To familiarize the students with application of data analysis in environmental engineering","co":["Identify and pre-process various types of environmental datasets for analysis.","Apply statistical tests to validate environmental hypotheses and detect trends.","Develop machine learning models to predict and classify environmental phenomena.","Utilize GIS and time-series tools to visualize and solve spatial environmental problems.","Application of big data for environmental analysis problems","Application of IoT for environmental engineering problems"],"u":[{"l":"I","t":"Foundations of Environmental Data & Probability","h":9,"p":["Nature of Data Spatial: pollution at different locations","Temporal: pollution over time","Spatiotemporal: pollution across space and time","Sources: IoT sensors","satellites (remote sensing)","USGS/EPA databases Data Pre-processing","Probability Distributions","Descriptive Statistics & Visualization"]},{"l":"II","t":"Statistical Inference & Hypothesis Testing","h":9,"p":["Sampling Designs","Parametric Tests: t-tests and ANOVA for comparing pollution levels across different sites or time periods","Non-Parametric Tests: Mann-Kendall test for trend analysis in climate data","Wilcoxon rank-sum test","Regression Analysis: Simple and multiple linear regression for predicting environmental parameters (BOD prediction based on temperature and pH)"]},{"l":"III","t":"Machine Learning for Environmental Systems","h":9,"p":["Machine Learning: Types Classification","Supervised Learning: Classification: Identifying land cover types using satellite imagery (Random Forest, SVM)","Regression: Predicting Air Quality Index (AQI) using meteorological data","Unsupervised Learning: Clustering: Grouping monitoring stations with similar pollution profiles (K-means)","Principal Component Analysis (PCA): Reducing dimensions in complex chemical datasets to identify primary pollution sources"]},{"l":"IV","t":"Sensing, Big Data & Decision Support Systems","h":9,"p":["IoT & Sensors: Real-time data acquisition from smart water meters and air quality sensors","Environmental Modelling: Integration of data analytics with physical models (e.g., Fate and Transport models)","Decision Support: Multi-Criteria Decision Making (MCDM) for waste management site selection","Ethical Considerations: Data privacy in smart cities and environmental justice in data representation"]}],"b":["/Reference Books","Devore, Jay L. Probability and Statistics for Scientists and Engineers. Duxbury Press, 2000."]},"ECE 904":{"n":"Pavement Evaluation, Rehabilitation And Maintenance","c":"Professional Elective – 9","p":"NIL","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, record, One Minor test, and one Major Theory Examination.","o":"To develop understanding of Pavement Management Systems, pavement evaluation and distress assessment, and the selection of appropriate maintenance and rehabilitation strategies.","co":["Explain the concepts, components, and process of Pavement Management Systems (PMS).","Identify highway maintenance and rehabilitation problems and planning approaches.","Evaluate pavement performance, structural capacity, distress, and safety parameters.","Conduct pavement distress surveys and interpret condition data.","Analyze causes and treatments of distresses in flexible and rigid pavements.","Select suitable maintenance and rehabilitation strategies for pavement systems."],"u":[{"l":"I","t":"Introduction","h":9,"p":["Definition of Pavement Management System(PMS)","Need of PMS","Pavement Management as an Engineering Management System","Pavement Management Process","Basic Components of PMS","Problems of Highway Maintenance and Rehabilitation(M&R)","Approaches to Pavement Management","Classification and Planning of Maintenance"]},{"l":"II","t":"Pavement Evaluation and Performance","h":9,"p":["General Concept of Pavement Evaluation","Evaluation of Pavement Performance","Evaluation of Pavement Distress","Evaluation of Pavement Safety (Roughness and Skid Resistance)","NDT Testing"]},{"l":"III","t":"Pavement Distress Survey and Rating Procedures","h":9,"p":["Overview","Importance of Pavement Condition Data","Types of Distresses in Flexible and Rigid Pavement","Distress Symptoms","Cause & Treatment"]},{"l":"IV","t":"Maintenance & Rehabilitation Selection","h":9,"p":["Classification of M&R","Rehabilitation Strategies","Pavement M&R Alternatives","Flexible and Rigid Pavement Maintenance Techniques","Use of Expert Systems in the Selection of M &R Strategies"]}],"b":["Huss and Hudson, Modern Pavement Management system, McGraw Hill","Shahin M.Y., Pavement management for roads, airport and parking lots, KLUWER ACADEMIC PUB, Boston/London","Khanna, S. K. and Justo, C. E G., Highway Engineering, Nemchand Bros., Roorkee","Kadiyali, L. R., Pr. and design of pavements, Khanna Publishers, New Delhi.","Yoder E.J. and Witczale M.W., Principles of pavement design, John Wiley & Sons, Inc, New York","Huang, Y. H., Pavement analysis and Design. Prentice Hall, Englewood Cliffs, New Jersey.","IRC codes (IRC 83), ASTM D 6433"]},"ECE 905":{"n":"Geoinformatics For Water Resources","c":"Professional Elective – 9","p":"NIL","k":"Lecture: 3, Tutorial:1, Practical: 0","cr":4,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, record, One Minor test, and one Major Theory Examination.","o":"Enhance the capability and advanced knowledge of Geoinformatics tools and technique to understand, monitor, mapping and management of Water Resources in various aspects.","co":["Develop appropriate methods for studying and/or solving the problems related to hydrological cycle, estimation of hydrological parameter and water budget with the help of RS&GIS","Acquire know-how in watershed mapping, classification, and prioritization","Able to provide geo-information science and earth observation technology to watershed management and prioritization","Hands on training on geoinformatics tools and technique in the application of water resources","Knowledge of snow/glacier mapping and sedimentation analysis due to snow melt","Application of GIS and remote sensing for oceanographic studies"],"u":[{"l":"I","t":"Overview of RS & GIS Application in Water Resources Management","h":9,"p":["Hydrological Modelling with Geospatial Inputs","Hydrological cycle","Estimation of precipitation","Hydrological Parameter Estimation using RS & GIS","Digital Elevation Model (DEM) hydro processing","Drainage network and drainage pattern","watershed definition and scope","morphometric parameter"]},{"l":"II","t":"Watershed Characterization","h":9,"p":["Watershed Prioritization and Conservation Planning","Aquatic System","Classification of Wetland and Wetland mapping using Remote Sensing","Water balance studies- interception","soil moisture","evaporation","run off and discharge"]},{"l":"III","t":"Snow/Glacier Mapping","h":9,"p":["Monitoring and Snow Melt Runoff Model","Soil erosion and Sediment modelling","Reservoir Sedimentation Assessment using Remote Sensing"]},{"l":"IV","t":"Application of remote sensing in Oceanography","h":9,"p":["Sea Surface Temperature","Chlorophy-ll","Total Suspended Solids","Fishing potential and Coastal wetland","Monitoring of Hydro- meteorological Disasters and Damage Assessment","Flood Modelling and Early Warning Systems"]}],"b":["/Reference Books","Jensen J. R, Remote Sensing of the Environment: An Earth Resource Perspective, Pearsons,","Lillesand T, Kiefer RW and Chipman J, Remote Sensing and Image Interpretation, Wiley &Sons.","Chang K., Introduction to Geographic Information Systems, McGraw-Hill, New York, 2006.","JVS Murty, 2004, “Watershed management” New Age International Pvt Ltd, New Delhi","Lyon JG GIS for Water Resources and Watershed Management Chen Y, GIS and Remote Sensing in Hydrology, Water Resources and Environment, 2004","W.G.M. 1998. Remote sensing in water resources management: the state of the art. Colombo, Sri Lanka: IWMI Skill-Based Courses to Qualify for UG Certificate (Engg.) in Civil Engineering"]},"BCE 163":{"n":"Plumbing And Sanitation","c":"Skill-based courses","p":"NIL","k":"Lecture: 2, Tutorial:0, Practical: 2","cr":3,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, record, two Minor tests and One Major Theory Examination.","o":"The objective of this course is to provide a student with basic knowledge in home–hold plumbing so that he/she should be able to design and analyse plumbing system for an individual residential/commercial/industrial building.","co":["Coordinate plumbing works from inception to completion with Owners, Architects, other consultants and contractors.","Select proper plumbing materials and systems.","Read and interpret plumbing drawings.","Supervise code based plumbing installations.","Understand methods to conserve water and energy.","Protect health and safety of end users."],"u":[{"l":"I","t":"Plumbing Terminology, Plumbing Fixtures","h":6,"p":["accessible","readily accessible","aerated fittings, AHJ","bathroom group","carrier","flood level rim","floor sink","flushometer valve","flush tanks","lavatories","macerating toilet","plumbing appliances","plumber","Traps: indirect waste, vent","blow off","developed length","dirty arm, FOG","indirect waste","receptors","slip joints, trap","and vent","Drainage: adapter fitting","adjusted roof area, AAV","air break","air gap","area drain, base","bell and spigot joint","building drain","branch, DFU","grease interceptor","joints","roof drain","smoke test, stack","Water supply: angle valve","anti-scald valve","backflow","bypass","check valve","cross connection","ferrule","gate valve","gray water","joints, PRV"]},{"l":"II","t":"","h":6,"p":["Definitions of plumbing fixtures","fittings","appliances and appurtenances","maximum flow rates","water closets","bidets","urinals","flushing devices","washbasins","bath/shower","toilets for differently abled","kitchen sinks","water coolers","drinking fountain","clothes washer","dish washer","mop sink","overflows","strainers","prohibited fixtures","floor drains","floor slopes","location of valves","hot water temperature controls","installation standard dimensions in plan and elevation"]},{"l":"III","t":"","h":6,"p":["Discharge for indirect waste piping","nature of contents or systems","proper methods to install indirect waste piping","air gap and air break","sink traps","dish washers","drinking fountains","waste receptors","sterile equipment","appliances","condensers","point of discharge","venting","Vent requirement","purpose of venting","trap seal protection","materials","vent connections","flood rim level","termination","vent stacks","water curtain and hydraulic jump","cleanouts","venting of interceptors","introduction to vent sizing"]},{"l":"IV","t":"","h":6,"p":["Rain Water Harvesting (RWH) definition, need","catchment","conduits","settlement tanks","treatment","possible uses","recharging pits","NBC requirements","MOEF&CC requirements","and advantages of RWH","Hot water systems","individual and centralized systems","geysers","heaters","heat pumps","energy sources","solar hot water systems, types","boilers","hot water generators","hot water consumption pattern","introduction to sizing of systems","Definition of gray water","approvals","specifications and drawings","safety","total gray water discharge","holding tanks","valves and piping","Reclaimed water systems","definition of reclaimed water","pipe identification","installation","safety signs","valves","cross connection","approved uses","List of Practical 1","Demonstration of water supply pipes and fittings 2","Cutting and joining water supply pipes and fittings 3","Flow measurement of various plumbing fixtures and fittings 4","Cutting and joining of drainage pipes, traps","and fittings 5","Vent requirements for a residence Design and demonstration of rain water harvesting system for an independent house"]}],"b":["Uniform Illustrated Plumbing Code-India (UIPC-I) published by IPA and IAPMO (India) 2 National Building Code (NBC) of India 3 IS 17650 Part 1 and Part 2 for Water Efficient Plumbing Products 4 Water Efficient Products-India (WEP-I) published by IPA and IAPMO (India)","Water Efficiency and Sanitation Standard (WE.Stand) published by IPA and IAPMO (India)","Water Pollution, Berry, CBS Publishers.","‘A Guide to Good Plumbing Practices’, a book published by IPA","Elements of Water Pollution Control Engineering, O.P. Gupta, Khanna Book Publishing, New Delhi.","Ram Babn Sao, perfect knowledge of plumbing Handbook.","Plumbing Book , by Chand Kumawat."]},"BCE 164":{"n":"Computer Aided Drafting","c":"Skill-based courses","p":"NIL","k":"Lecture: 2, Tutorial:0, Practical: 2","cr":3,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, record, two Minor tests and One Major Theory Examination.","o":"1. The objective of this lab is to teach the student usage of Auto cad, basic drawing fundamentals in various civil engineering applications, especially in building drawing. 2. The objective of this course is to teach students the basic commands and tools necessary for professional 2D drawing, 3D drawing and drafting using AutoCAD 3. Students able to learn to sketch and take field dimensions. 4. Students able to learn to take data and transform it into graphic drawings. Students able to learn basic engineering drawing formats","co":["Understand CAD software and basic functions","Evaluate plans of Single storied building & multistoried buildings","Develop different sections at different elevations","Detailing of building components like doors, windows roof trusses","Develop section and elevation for single and multistoried buildings using CAD software. 6 Exposure to creating working drawings"],"u":[{"l":"I","t":"","h":6,"p":["Overview of Computer Graphics covering","listing the computer technologies that impact on graphical communication","Demonstrating knowledge of the theory of CAD software [such as: The Menu System, Toolbars (Standard, Object Properties, Draw, Modify and Dimension), Drawing Area (Background, Crosshairs, Coordinate System), Dialog boxes and windows, Shortcut menus (Button Bars), The Command Line (where applicable), The Status Bar, Different methods of zoom as used in CAD, Select and erase objects.; Isometric Views of lines, Planes, Simple and compound Solids]"]},{"l":"II","t":"","h":6,"p":["Customisation & CAD Drawing consisting of set up of the drawing page and the printer","including scale settings","Setting up of units and drawing limits","ISO and ANSI standards for coordinate dimensioning and tolerancing","Orthographic constraints","Snap to objects manually and automatically","Producing drawings by using various coordinate input entry methods to draw straight lines","Applying various ways of drawing circles"]},{"l":"III","t":"","h":6,"p":["Annotations","layering & other functions covering applying dimensions to objects","applying annotations to drawings","Setting up and use of Layers","layers to create drawings","Create","edit and use customized layers","Changing line lengths through modifying existing lines (extend/lengthen)","Printing documents to paper using the print command","orthographic projection techniques","Drawing sectional views of composite right regular geometric solids and project the true shape of the sectioned surface","Drawing annotation","Computer-aided design (CAD) software modelling of parts and assemblies","Parametric and non-parametric solid","surface","and wireframe models","Part editing and two-dimensional documentation of models","Planar projection theory","including sketching of perspective","isometric","Multiview","auxiliary","and section views","Spatial visualization exercises","Dimensioning guidelines","tolerancing techniques","dimensioning and scale multi views of dwelling"]},{"l":"IV","t":"","h":6,"p":["Demonstration of a simple team design project that illustrates Geometry and topology of engineered components: creation of engineering models and their presentation in standard 2D blueprint form and as 3D wire-frame and shaded solids","meshed topologies for engineering analysis and tool-path generation for component manufacture","geometric dimensioning and tolerancing","Use of solid-modelling software for creating associative models at the component and assembly levels","floor plans that include: windows, doors","and fixtures such as WC, bath, sink","shower, etc","Applying colour coding according to building drawing practice","Drawing sectional elevation showing foundation to ceiling","Introduction to Building Information Modelling (BIM)","List of Experiments 1","Prepare simple lines using basic commands 2","Create basic shape using command 3","Prepare plan","section and elevation of bungalow using 2D entity command","modification and other commands 4","Create a presentation drawing in computer: layout plans","all floor plans","section and elevation 5","Create a 3D view of a building with any 3D software such Google sketch-up, Revit"]}],"b":["Bhatt N.D., Panchal V.M. & Ingle P.R., (2014), Engineering Drawing, Charotar Publishing House","Shah, M.B. & Rana B.C. (2008), Engineering Drawing and Computer Graphics, Pearson Education","Agrawal B. & Agrawal C. M. (2012), Engineering Graphics, TMH Publication","Narayana, K.L. & P Kannaiah (2008), Textbook on Engineering Drawing, Scitech Publishers","(Corresponding set of) CAD Software Theory and User Manuals"]},"BCE 165":{"n":"Carpentry And Fabrication","c":"Skilled Based Course","p":"","k":"Lecture – 2; Tutorial – 0; Practical – 2","cr":3,"a":"Continuous assessment through attendance, home assignments, quizzes, two minor methods practical exam and One Major Practical Examination","o":"To familiarize a student with basic skills in carpentry and fabrication so that he/she can work with wood and metals.","co":["At the end of the course student will be able to:","Identify and select the right type of wood for various applications.","Acquire required knowledge and practical skills in wood cutting, joining and other allied operations.","Acquire required knowledge and practical skills in engineering measurements.","Acquire experience in preventive and corrective maintenance of various cutting tools, machine tools and equipment.","Acquire required knowledge and practical skills in fabrication techniques","Finish various jobs within specified time and resource limits, with proper measurements and evaluate them by appropriate methods and tools."],"u":[{"l":"I","t":"Introduction to Carpentry","h":6,"p":["Need for the work","training","relationship between timber","tools and carpentry","Carpentry tools: classification of tools","measuring & making","holding","cutting","grooving","planning","striking","boring and miscellaneous tools","care and maintenance of tools","wood working machines","wood working lathe","wood sawing machine"]},{"l":"II","t":"Types of work and working procedure","h":6,"p":["Marking","sawing","planning","chiselling","boring","striking","checking","sharpening","joints in carpentry work, nails","screws and other materials","finishing work"]},{"l":"III","t":"General Fabrication Concepts","h":6,"p":["Introduction to fabrication","material properties: metals","semi-conductors and polymers","design and planning: principles of design","blueprint reading","and creating fabrication plans","safety and standards"]},{"l":"IV","t":"Fabrication Processes","h":6,"p":["Cutting: various cutting methods like, laser","plasma","water jet","and mechanical shears","forming: techniques for shaping metal","bending","rolling","and stamping","welding and joining: different welding methods","soldering","brazing and adhesive bonding","finishing: surface treatments like painting","plating and polishing","List of Experiments – Carpentry 1","To prepare Half Lap Joint","To make a simple Mortise and Tenon joint","To make a Mortise Tenon joint 45 Deg","To make a Habed or Lap DoveTail Joint","To make a Common Multiple Joint","List of Experiments – Fabrication 1","Manual Metal Arc Welding/ Shielded Metal Arc Welding 2","Gas Metal Arc Welding 3","Friction Stir Welding 4","Mold Preparation","Melting and Casting"]}],"b":["S. N. Pophale and A. K. Goel, Carpentry and woodwork, Railway Engineering Technical Society, Pune, 2008.","Willis H Wagner, Howard Bud Smith, and Mark W Huth, Modern Carpentry, Goodheart-Wilcox Publications, 12th Edn., 2015. R L Agarwal and Tahil Manghnani, Welding Engineering, Khanna Publishers, Fifht Edn., 1991. Skill-Based Courses to Qualify for UG Diploma (Engg.) in Civil Engineering"]},"BCE 264":{"n":"Introduction To Remote Sensing And Gis","c":"Minor","p":"","k":"Lecture – 3; Tutorial – 0; Practical – 2","cr":4,"a":"Continuous assessment through attendance, home assignments, quizzes, methods two minor practical exam and One Major Practical Examination","o":"1. To introduce the student to the physical principles of Remote Sensing and image interpretation as a tool for mapping. 2. To provide exposure to fundamental data models and data structures in GIS 3. To introduced principle of GPS, It’s components, signal structure, and working procedure","co":["At the end of the course student will be able to:","Select the type of remote sensing data for mapping earth surface features","Identify the earth surface features from satellite images","Analyse the basic components of GIS","Classify the maps, coordinate systems and projections","Process spatial and attribute data and prepare thematic maps","Apply remote sensing & GIS techniques for natural resources evaluation"],"u":[{"l":"I","t":"Fundamentals of GIS","h":9,"p":["Information Systems","Modelling Real World Features Data","Data Models – Spatial and Non-spatial","Components","Data Collection and Input","Data Conversion","Metadata Database Management: Database Structures, Files","Standard Data Formats","Compression Techniques","Hardware and Software"]},{"l":"II","t":"Principles of Remote Sensing","h":9,"p":["Concept of remote sensing","principles of electromagnetic radiation","characteristics of remotely sensed data","remote sensing data interpretation and analysis Geo-referencing: Place names","linear referencing systems","cadasters","measuring the earth latitude and longitude","projections and coordinates","measuring latitude","longitude and elevation using GPS","converting geo-references"]},{"l":"III","t":"GIS data collection","h":9,"p":["Primary geographic data capture","secondary geographic data capture","obtaining data from external sources","capturing attribute data","Cartography and map production: maps and cartography","principles of map design","map series","applications"]},{"l":"IV","t":"","h":9,"p":["Different map projections","spatial interpolation techniques","DEM and different types of resolutions","quality assessment of freely available DEMs","overlaying operations","buffer analysis","classification methods","errors in GIS","key elements of maps","limitations of GIS List of Practical exercises for Remote sensing and GIS course 1","Introduction to GIS and QGIS- Downloading and installing QGIS","Introduction to QGIS interface and layers","and Plugin management in QGIS (e.g., OpenLayers, QuickMapServices) 2","Introduction to handheld GPS devices","Field data collection","Exporting GPS data to GIS","Coordinate systems overview","and UTM conversion using QGIS","Remote Sensing Data: Introduction and Acquisition","Basics of remote sensing","Types of satellite data (Landsat, Sentinel, etc.) and downloading satellite data from: USGS Earth Explorer and Bhuvan Portal","Data Conversion- Vector and raster data types","and Conversion between data formats","To carry out image rectification and Geo-referencing using QGIS and geo-referenced layers 6","To create new vector layers","digitizing features (points, lines, and polygons)","Using snapping and topology tools and Attribute data entry during digitization","To editing attribute tables","using field calculator","Selection by location and attributes 8","To learn DEM elevation data","Downloading DEMs (SRTM), Slope","aspect","and hill shade generation","Contour extraction and watershed analysis","To carry out raster data analysis","Raster calculator for map algebra","and Vegetation indices (NDVI)","Supervised classification using Semi-Automatic Classification Plugin (SCP)","Unsupervised classification using Semi-Automatic Classification Plugin (SCP)"]}],"b":["Introduction to Remote Sensing, James B. Campbell & Randolph H. Wynne., The Guilford Press,","Introduction to the physics and techniques of Remote Sensing, Charles Elach& Jakob van Zyl., John Wiley & Sons publications, 2006.","Remote Sensing and Image Interpretation, Lillesand T.M & Kiefer R.W., John Wiely and Sons, 2015","Geographic Information systems and Science, Paul Longley., John Wiley & Sons, 4th Edition,2015.","Introduction to Geographic Information Systems, 9th Edition, Kang Tsung Chang., Tata Mc Graw Hill Publishing Company Ltd, New Delhi, 2018."]},"BCE 265":{"n":"Analysis And Design Of Water Distribution Systems","c":"Skill-based courses","p":"","k":"Lecture – 3; Tutorial – 0; Practical – 2","cr":4,"a":"Continuous assessment through attendance, home assignments, quizzes, methods two minor practical exam and One Major Practical Examination","o":"To provide a thorough theoretical and practical knowledge in water distribution systems using which a student can solve real world problems concerning with design and analysis of pipe network distributions.","co":["1. Develop water distribution systems with a thorough understanding of hydraulic principles and system components.","Perform calculations and solve problems commonly encountered in water distribution systems, such as volumes, flow rates, velocities, pressures, and chemical dosage","Evaluate existing systems to identify inefficiencies and implement effective solutions.","Apply industry-standard design standards to create efficient and reliable water distribution networks.","Use EPANET2 software to model, analyze, and optimize water distribution systems.","Design comprehensive water systems at the sub-division level, addressing both hydraulic and quality considerations."],"u":[{"l":"I","t":"Introduction to pipe networks","h":9,"p":["Types of networks: serial","branching","and looped","parameters","labelling network elements: branching and looped networks","parameters interrelationships: pipe head loss relationship","node flow continuity relationship","loop head loss relationship","rules for solvability of pipe networks: rules proposed by Shamir and Howard","rules proposed by Goffman and Rodeh","rules proposed by Bhave","comparison of rules"]},{"l":"II","t":"Formulation of equations","h":9,"p":["states of parameters","basic unknown parameters","single source and multi- source networks with known pipe resistances: branching and looped networks","networks with unknown pipe resistances: branched and looped","inclusion of pumps: supply and booster","inclusion of check valves: in an external pipe","in an internal pipe","in several pipes","inclusion of pressure reducing valves"]},{"l":"III","t":"Hardy-Cross Method","h":9,"p":["Method of balancing heads","method of balancing flows","modified Hardy- Cross method","selection of initial values","convergence problems Newton-Raphson Method: Basic concepts","head equations","loop equations","labelling network elements Linear theory method: pipe discharge equations","nodal head equations","relationship between Newton-Raphson and linear theory method"]},{"l":"IV","t":"Dynamic Analysis","h":9,"p":["Iterative method","direct method","Node flow analysis: two node serial network","node classification","NFA theory","Calibration: data collection and preparation","calibration methods","practical considerations"]}],"b":["Pramod R Bhave, Analysis of flow in water distribution networks, Technomic Publications, 2004.","Lewis A Rossman, EPANET 2 User Manual, 2000 List of Practical Experiments","Quick start tutorial","Preparing physical and non-physical components of network models","Understanding EPANET’s workspace","Working with projects","Working with objects","Working with the map","Analyzing a network","Viewing results","Printing and copying","Importing and exporting files"]},"BCE 266":{"n":"Geotechnical Exploration And Instrumentation","c":"Skill-based courses","p":"","k":"Lecture: 3, Tutorial: 0 , Practical: 2","cr":4,"a":"","o":"The objectives of the course are as follows: 1. To Understand the types of soil and develop various applications of soil as a construction material for civil engineering structures. 2. To Evaluate the soil quality to understand the basic relationships between physical and mechanical properties of soils. 3. To understand the soil testing methods as the basic knowledge of classification and engineering properties of soil 4. To understand the different ground modification methods and the experimental methods for laboratory as well as field investigations.","co":["After completion of this course the students to demonstrate following knowledge, skills and attitudes.","Comprehend the basics of site investigation methods and field tests and its extent for variety of structures including preliminary investigations.","Identify and suitable investigation method for soil exploration.","Illustrate different specialized exploration methods based on condition and requirement.","Appraise different codal provisions for field tests.","Basic knowledge about soil explorations and field investigations.","Learn to prepare soil investigation report."],"u":[{"l":"I","t":"Interpretations and Codal Provisions","h":9,"p":["Soil profiling","interpretation of exploration data and report preparation","various standards for soil investigations","direct","semi-direct","and indirect methods of soil investigations","Purpose and Phases of Soil Investigation","Report writing: Soil exploration Reports- identification","calculations and preparation"]},{"l":"II","t":"Exploration Methods","h":9,"p":["Methods of Boring","Augering and Drilling","Machinery used for drilling","types of augers and their usage for various projects","Soil Sampling: sampling methods","types of samples","storage of samples and their transport","Sample preparation","sample sizes","types of samplers specifications for soil testing","Trial pits","disturbed and undisturbed sampling Detailed bore hole investigations: types of borings and types of samplers","Compaction: Standard and Modified Proctor compaction tests","field compaction","Proctor Needle Test","Consolidation test"]},{"l":"III","t":"Geophysical Investigations","h":9,"p":["Introduction to geophysical methods","Seismic Refraction Test: Principles and applications","MASW (Multichannel Analysis of Surface Waves) and SASW (Spectral Analysis of Surface Waves) methods","Electrical resistivity test: Principles","methods","and applications","Ground-penetrating radar (GPR) and magnetic surveys","Seismic Refraction methods"]},{"l":"IV","t":"Field Tests","h":9,"p":["Methods and specifications – visual identification tests","vane shear test","penetration tests","analysis of test results","Field Instrumentation: Rollers","Pressure meters","Piezometer","Pressure cells","Sensors","Inclinometers","Strain gauges etc","Plate load test","pile load test","SPT test","CPT test","flat dilatometer test","DCPT test","Vane shear test","pressure meter test","field CBR test","core cutter","sand replacement test","List of Experiments 1","(i) Insitu Density by Core Cutter Method (ii) Insitu Density by Sand Replacement Method 2","Methods of Boring and Field Sampling 3","Standard Penetration Test (SPT) 4","Static Cone Penetration Test (SCPT) 5","Dynamic Cone Penetration Test (DCPT) 6","Plate Load Test 7","Pile Load Test 8","Vane Shear Test 9","Field CBR 10","Geophysical Exploration Methods"]}],"b":[" Alam Singh – Modern Geotechnical Engineering, Asia Publishing House, New Delhi.  Gopal Ranjan and A.S.R. Rao – Basic and Applied Soil Mechanics, New Age International (P) Ltd.  B.C. Punamia – Soil Mechanics and Foundations, Laxmi Publications (P) Ltd.  C. Venkataramaiah – Geotechnical Engineering, New Age International (P) Ltd., New Delhi.  Schnaid, F. (2009) In Situ Testing in Geomechanics : The Main Tests. Taylor & Francis.  J. E. Bowles, “Foundation Analysis and Design”, McGraw Hill Companies, 1997.  M. D., Desai, “Ground Property Characterization from In-Situ Testing”, Published by IGS- Surat Chapter,2005.  M. J., Hvorslev, “Sub-Surface Exploration and Sampling of Soils for Civil Engineering Purposes”, US Waterways Experiment Station, Vicksburg, 1949.  Robert M. Koerner “Construction and Geotechnical methods in Foundation Engineering”, Mc.Graw-Hill Pub. Co., New York, 1985.  Manfred R. Haussmann, “Engineering principles of ground modification”, Pearson Education Inc. New Delhi, 2008.  F. G., Bell, “Engineering Treatment of Soils”, E& FN Spon, New York, 2006.  P. Purushothama Raj, “Ground Improvement Techniques” Laxmi Publications (P) Limited,"," Jie Han et. al., “Advances in ground Improvement” Allied Pub., 2009.  Hunt Roy E , Geotechnical Investigation Methods, A Field Guide for Geotechnical Engineers, Taylor & Francis Ltd. Skill Based Courses to Qualify for B. Voc. (Engg.) Course in Civil Engineering"]},"BCE 357":{"n":"Pavement Design Using Softwares","c":"Skill Enhancement Course","p":"NIL","k":"Lecture:2, Tutorial:0, Practical:2","cr":3,"a":"Continuous assessment through attendance, home assignments, methods quizzes, and One Minor Test and One Major Theory and Practical Examination.","o":"To enable students to utilize pavement design software in alignment with relevant codal provisions.","co":["Explain flexible and rigid pavement design principles as per IRC.","Ability to perform flexible pavement thickness design using IITPAVE","Capability to analyse stress and strain responses in pavement layers","Skill to interpret software outputs for design decisions","Understanding of mechanistic–empirical pavement design framework","Ability to compare different pavement alternatives using computational tools"],"u":[{"l":"I","t":"Types of pavements","h":6,"p":["flexible","rigid and composite pavements","Design philosophies as per IRC pavement design guidelines (IRC:37, IRC:58)","Introduction to IITPAVE software: interface","input parameters and output interpretation","Pavement material characterization: resilient modulus","Poisson’s ratio","elastic modulus"]},{"l":"II","t":"Flexible Pavement Design using IITPAVE","h":6,"p":["Layered elastic theory and stress–strain response in pavements","Traffic loading and axle load spectrum","Design inputs: traffic","subgrade CBR","layer properties","Fatigue and rutting criteria as per IRC:37","Thickness design and performance analysis using IITPAVE","Sensitivity analysis on traffic and material properties"]},{"l":"III","t":"Fundamentals of rigid pavement design","h":6,"p":["Westergaard’s theory","Stresses in concrete pavements (edge, corner and interior stresses)","Design parameters: modulus of subgrade reaction","temperature stresses","load transfer"]},{"l":"IV","t":"Advanced Pavement Analysis Tools","h":6,"p":["Mechanistic–empirical pavement design concepts","Reliability","drainage and climatic factors in pavement design","Introduction to other pavement design software","Case studies on pavement design optimization using software List of experiments Module 1: Installation and familiarization with pavement design software including interface and workflow","Module 2: Determination of effective subgrade CBR and resilient modulus for mechanistic design input","Module 3: Design and analysis of bituminous pavement with granular base and sub-base using software","Module 4: Design and analysis of bituminous pavement with GSB and cement treated base (CTB)","Module 5: computation of Cumulative Fatigue Damage in Cement Treated Base (CTB) layer for Single Axles Module 6: computation of Cumulative Fatigue Damage in CTB Layer for Tandem axles Module 7: computation of Cumulative Fatigue Damage in (CTB) Layer for Tridem Axles Module 8: Design and evaluation of flexible pavement with cement treated sub-base (CTSB) and CTB layers","Module 9: Design and analysis of flexible pavement with dry lean concrete (DLC) sub-base and CTB","Module 10: Design of bituminous pavement using RAP treated with foamed bitumen or emulsion and cemented sub-base"]}],"b":["Khanna, S. K. and Justo, C. e. G., Highway Engineering, Nemchand Bros., Roorkee","Huang, Y. H., Pavement analysis and Design. Prentice Hall, Englewood Cliffs, New Jersey","Yoder and Whitejack, Pavement Design, John Wiley & Sons.","Flaherty, O. Highways-Location Design, Construction and Maintenance of Pavements, Taylor and Francis.","Rajib B. Mallick and Tahar El-Korchi - Pavement Engineering: Principles and Practice.","IRC: 37-2001, “Guidelines for the Design of Flexible Pavements (Second Revision)”.","IRC: 58-2001, “Guidelines for the Design of Plain Jointed Rigid Pavements for Highways (Second Revision)”.","AASHTO – Design of pavement Structures"]},"BCE 358":{"n":"Software Application For Building Design","c":"Skill Enhancement Course","p":"NIL","k":"Lecture: 2, Tutorial: 0 , Practical: 2","cr":3,"a":"Continuous assessment through attendance, home assignments, quizzes, and One Minor Test and One Major Theory and Practical Examination.","o":"To introduce the fundamentals of computer-based structural analysis and design for building systems and to familiarize students with practical issues related to structural modeling, error identification and validation of analysis results.","co":["After completion of this course, students will be able to:","Develop 2D and 3D structural models using STAAD Pro with appropriate material and section properties.","Apply different types of loads, define load cases and prepare load combinations in STAAD Pro.","Perform structural analysis and interpret reactions, shear forces, bending moments and displacements.","Model and analyze building frames under gravity and lateral loads.","Analyze truss and arch structures and evaluate structural behavior under different loading conditions.","Validate and interpret structural analysis results for building design."],"u":[{"l":"I","t":"","h":null,"p":["Introduction to structural modeling in STAAD Pro environment","Definition of units","grid system and coordinate system","Modeling of basic structural components such as beams","slabs and columns","Assignment of material properties","section properties and support conditions","Development of simple two-dimensional structural models"]},{"l":"II","t":"","h":null,"p":["Modeling of structural elements and assignment of boundary conditions in STAAD Pro","Application of dead and live loads on structural members","Definition of load cases and preparation of load combinations","Execution of structural analysis and study of reactions","shear force","bending moment and displacement results"]},{"l":"III","t":"","h":null,"p":["Modeling of building frames including multi-storey beam-column systems in STAAD Pro","Application of dead","live and lateral loads on building structures","Analysis of complete building models and interpretation of internal forces and storey displacements","Assessment of structural behavior under combined loading conditions"]},{"l":"IV","t":"","h":null,"p":["Modeling of truss and arch structures in STAAD Pro","Assignment of loading and support conditions","Structural analysis under different load combinations and interpretation of analysis results within the software environment","List of Experiments 1","Analysis of a simply supported beam and study of reactions","shear force and bending moment diagram","Analysis of a cantilever beam and study of deflection and bending moment","Analysis of a continuous beam and comparison of internal forces under different loading cases","Analysis of a 2D portal frame and study of displacement and bending moment distribution","Analysis of a multi-bay frame and comparison of storey deflection","Modeling and analysis of a single-storey building frame under dead and live loads","Modeling and analysis of a two-storey building frame and evaluation of storey drift","Analysis of a 2D truss and determination of axial forces in members","Analysis of a simple 3D frame structure and evaluation of nodal displacements","Analysis of a two-hinged arch and study of support reactions and horizontal thrust"]}],"b":["Hibbeler, R. C., Structural Analysis, 10th ed., Pearson Education. McGuire, W., Gallagher, R. H. & Ziemian, R. D., Matrix Structural Analysis, John Wiley & Sons. Kassimali, A., Structural Analysis, 5th Edition, Cengage Learning, 2018.a Weaver, W. and Gere, J. M., Matrix Analysis of Framed Structures, CBS Publishers & Distributors. IS 456: 2000, Plain and Reinforced Concrete – Code of Practice, Bureau of Indian Standards, New Delhi. IS 800: 2007, General Construction in Steel – Code of Practice, Bureau of Indian Standards, New Delhi."]},"BCE 359":{"n":"Software Applications In Geotechnical Engineering","c":"Skill Enhancement Course","p":"NIL","k":"Lecture: 2, Tutorial:0, Practical: 2","cr":3,"a":"","o":"To develop competency in numerical modelling and software-based analysis of geotechnical engineering problems using professional tools.","co":["After completion of the course, students will be able to:","Understand numerical modelling concepts and geotechnical software fundamentals.","Develop computational models with appropriate geometry, mesh and soil parameters.","Analyse bearing capacity and settlement of shallow foundations using software tools.","Evaluate slope stability and seepage behaviour through numerical analysis.","Model retaining structures, excavations and soil–structure interaction problems.","Interpret results and validate numerical solutions with classical geotechnical theory."],"u":[{"l":"I","t":"","h":6,"p":["Introduction to numerical modelling in geotechnical engineering and overview of finite element and limit analysis approaches","Basic modelling workflow including geometry creation","meshing","boundary conditions","loading conditions and selection of appropriate soil constitutive models based on laboratory and field data"]},{"l":"II","t":"","h":6,"p":["Analysis of soil and foundation problems including bearing capacity and settlement of shallow foundations","stress distribution in soil mass and basic soil–structure interaction modelling","Parametric studies to assess the influence of soil strength and stiffness parameters on foundation response"]},{"l":"III","t":"","h":6,"p":["Numerical modelling of slope stability and seepage problems","evaluation of factor of safety","identification of failure mechanisms and influence of pore water pressure on slope behaviour","Coupled seepage–stability analysis for slopes and earth structures"]},{"l":"IV","t":"","h":6,"p":["Analysis of earth retaining structures and excavations using numerical techniques","including staged construction and reinforced soil concepts","Introductory modelling of seismic response and interpretation","and validation","Practical Experiments: 1","Introduction to geotechnical software interface, setup","geometry and meshing techniques","Modelling of shallow foundation for bearing capacity and settlement estimation","1-Dimensional consolidation of the clay material","Slope stability analysis using limit equilibrium and finite element analysis","Seepage analysis of the earthen dam 6","Stability and deformation analysis of retaining structures","Braced excavation analysis with staged construction considering soil–structure interaction","Slope stabilization analysis using soil nailing and geosynthetic reinforcement techniques","Evaluation of earthquake-induced failure mechanism of slopes","Bearing capacity and load-settlement analysis of the foundation resting over reinforced earth beds"]}],"b":["Brinkgreve, R.B.J., Kumarswamy, S., Swolfs, W.M., Finite Element Method in Geotechnical Engineering, CRC Press.","Das, B.M., Principles of Foundation Engineering, Cengage Learning.","Griffiths, D.V. and Lane, P.A., Slope Stability Analysis by Finite Elements, Thomas Telford.","Potts, D.M. and Zdravković, L., Finite Element Analysis in Geotechnical Engineering, Thomas Telford.","Smith, I.M., Griffiths, D.V., and Margetts, L., Programming the Finite Element Method, Wiley.","GeoStudio User Manual, Geo-Slope International Ltd.","OptumG2 Reference Manual, Optum Computational Engineering.","Duncan, J.M. and Wright, S.G., Soil Strength and Slope Stability, Wiley. Syllabus of Audit Courses CONSTITUTION OF INDIA"]},"AUC 119":{"n":": Fundamentals of Artificial Intelligence","c":"Audit Course","p":"","k":"","cr":0,"a":"Continuous assessment through assignments, quizzes, tutorials, course- methods based project, one minor test and one major examination","o":"The course aims to: 1. Introduce fundamental concepts of Artificial Intelligence. 2. Develop basic Python programming skills for AI applications. 3. Build foundations in data analysis and preprocessing. 4. Provide understanding of machine learning concepts. 5. Expose students to AI use cases in various engineering domains.","co":["After successful completion of this course, students will be able to:","Understand fundamental concepts of Artificial Intelligence and intelligent systems.","Apply Python libraries for data handling and visualization.","Perform data preprocessing and exploratory data analysis.","Understand basic machine learning concepts and evaluation metrics.","Identify and analyze AI applications in various engineering domains.","Develop simple AI-based solutions using data preprocessing, visualization, and basic machine learning models."],"u":[{"l":"I","t":"Introduction to AI and Python Programming Overview of Artificial Intelligence","h":6,"p":["History, scope","types of AI","Applications of AI in modern technology","Python Basics: Data types","variables","operators","Control Structures: Conditional statements, loops","Functions and Modules","Data Structures: Lists","tuples","dictionaries, sets","File Handling Introduction to NumPy","Pandas","Matplotlib"]},{"l":"II","t":"Exploratory Data Analysis Types of Data","h":6,"p":["Numerical and Categorical","Steps in Exploratory Data Analysis","Descriptive Statistics","Data Visualization Techniques","Introduction to Data-driven Decision Making"]},{"l":"III","t":"","h":6,"p":["Data Preprocessing and Introduction to Machine Learning Data Cleaning and Deduplication","Handling Missing Data","Data Transformation: Normalization","Scaling","Binning","Introduction to Supervised and Unsupervised Learning (Conceptual Only)","Model Evaluation Metrics: Accuracy","Precision","Recall","F1-score"]},{"l":"IV","t":"","h":6,"p":["AI Use Cases in Engineering Predictive maintenance and fault detection in industrial systems using sensor data","Smart infrastructure monitoring","Process optimization","quality inspection","and automation in manufacturing environments","Intelligent decision support systems for healthcare","environmental monitoring","and cybersecurity applications"]}],"b":["Aurélien Géron, Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow, O’Reilly","Wes McKinney, Python for Data Analysis, O’Reilly","Ethem Alpaydin, Introduction to Machine Learning, MIT Press","Jake VanderPlas, Python Data Science Handbook, O’Reilly","Ian Goodfellow, Yoshua Bengio, Aaron Courville, Deep Learning, MIT Press","Sebastian Raschka, Machine Learning with Python, Packt","Stuart Russell & Peter Norvig, Artificial Intelligence: A Modern Approach, Pearson","Andreas C. Müller & Sarah Guido, Introduction to Machine Learning with Python, O’Reilly. INDIAN KNOWLEDGE THROUGH CLASSICAL LANGUAGES"]},"AUC 101":{"n":"Constitution Of India","c":"Audit","p":"NIL","k":"1/2 Lecture : , Tutorial : , Practical:","cr":0,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical, Tutorial class, viva voce and Minor tests and One Major Theory Examination.","o":"","co":["At the end of the course, learners should be able to","Student will Identify and explore the basic features and modalities about Indian constitution","Students will be able to differentiate and relate the functioning of Indian parliamentary system at the center and state level.","Student will be able to differentiate different aspects of Indian Legal System and its related bodies."],"u":[{"l":"1","t":"Introduction and Basic Information about Indian Constitution","h":null,"p":["Historical Background of the Constituent Assembly","The Preamble of the Constitution","Fundamental Rights","Fundamental Duties","Directive Principles of State Policy","Parliamentary System","Federal System"]},{"l":"2","t":"Union Executive and State Executive","h":null,"p":["Powers of Indian Parliament Functions of Rajya Sabha","Functions of Lok Sabha","Powers and Functions of the President","Powers and Functions of the Prime Minister","Judiciary"]},{"l":"3","t":"Introduction and Basic Information about Legal System","h":null,"p":["The Court System in India and Foreign Courtiers (District Court, District Consumer Forum, Tribunals, High Courts, Supreme Court)"]},{"l":"4","t":"Intellectual Property Laws and Regulation to Information","h":null,"p":["Introduction","Legal Aspects of Patents","Filing of Patent Applications","Rights from Patents","Infringement of Patents","Copyright","Information Technology Act, 2000","The Company’s Act"]}],"b":["G. Austin (2004) Working of a Democratic Constitution of India, New Delhi: Oxford University Press.","Basu, D.D (2005), An Introduction to the Constitution of India, New Delhi, Prentice Hall.","N. Chandhoke & Priyadarshini (eds) (2009) Contemporary India: Economy, Society, Politics, New Delhi: Oxford University Press.","N.G Jayal and P.B. Maheta, (eds) (2010) Oxford Companion to Indian Politics, New Delhi: Oxford University Press."]},"AUC 102":{"n":"Indian Culture and Heritage","c":"Audit","p":"NIL","k":"1/2 Lecture : , Tutorial : , Practical:","cr":0,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical, Tutorial class, viva voce and Minor tests and One Major Theory Examination. Unit-I Indian Culture: An Introduction, Characteristics of Indian culture, Significance of Geography on Indian Culture, Society in India, Religion and Philosophy in India. Unit-II Indian Languages and Literature, Evolution of script and languages in India, Harappan Script and Brahmi Script, History of Buddhist and Jain Literature. Unit-III A Brief History of Indian Arts and Architecture, Indian Art & Architecture: Gandhara School and Mathura School of Art; Hindu Temple Architecture, Buddhist Architecture, Medieval Architecture and Colonial Architecture. Indian Painting Tradition: ancient, medieval, modern Performing Arts: Divisions of Indian classical music: Hindustani and Carnatic, Dances of India: Various Dance forms: Classical and Regional, Rise of modern theatre and Indian cinema. Unit-IV Spread of Indian Culture Abroad, Causes Significance and Modes of Cultural Exchange - Through Traders, Teachers, Emissaries, Missionaries and Gypsies, Indian Culture in South East Asia, India, Central Asia and Western World. Recommended Readings: 1. Barua, B. 1934-37. Barhut Vol. I-III. Calcutta: Indian Research Institute. 2. Cunningham, Alexander 1966. The Bhilsa Topes. Varanasi: Indological Book Corporation. 3. Cunningham, Alexander 1965. The Stupa of Bharhut. Varanasi: Indological Book Corporation. 4. Dallapiccola, L.S.Z. Lallemant. 1980. The Stupa : Its Religious, Historical, and Architectural Significance. Wiesbaden: Franz Steiner Verlag. 5. Dehejia, Vidya 1972. Early Buddhist Rock Temples A Chronological Study. London: Thames and Hudson","o":"","co":[],"u":[{"l":"I","t":"Indian Culture","h":null,"p":["An Introduction","Characteristics of Indian culture","Significance of Geography on Indian Culture","Society in India","Religion and Philosophy in India"]},{"l":"II","t":"","h":null,"p":["Indian Languages and Literature","Evolution of script and languages in India","Harappan Script and Brahmi Script","History of Buddhist and Jain Literature"]},{"l":"III","t":"A Brief History of Indian Arts and Architecture, Indian Art & Architecture","h":null,"p":["Gandhara School and Mathura School of Art","Hindu Temple Architecture","Buddhist Architecture","Medieval Architecture and Colonial Architecture","Indian Painting Tradition: ancient","medieval","modern Performing Arts: Divisions of Indian classical music: Hindustani and Carnatic","Dances of India: Various Dance forms: Classical and Regional","Rise of modern theatre and Indian cinema"]},{"l":"IV","t":"","h":null,"p":["Spread of Indian Culture Abroad","Causes Significance and Modes of Cultural Exchange - Through Traders","Teachers","Emissaries","Missionaries and Gypsies","Indian Culture in South East Asia, India","Central Asia and Western World","Recommended Readings: 1, Barua","1934-37","Barhut Vol, I-III","Calcutta: Indian Research Institute","Cunningham","Alexander 1966","The Bhilsa Topes","Varanasi: Indological Book Corporation","Cunningham","Alexander 1965","The Stupa of Bharhut","Varanasi: Indological Book Corporation","Dallapiccola","Lallemant, 1980","The Stupa : Its Religious","Historical","and Architectural Significance","Wiesbaden: Franz Steiner Verlag","Dehejia","Vidya 1972","Early Buddhist Rock Temples A Chronological Study","London: Thames and Hudson"]}],"b":[]},"AUC 103":{"n":"Indian Architecture","c":"Audit","p":"NIL","k":"1/2 Lecture : , Tutorial : , Practical:","cr":0,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical, Tutorial class, viva voce and Minor tests and One Major Theory Examination.","o":"","co":["This course will help student learn about the development of Indian architecture and its contextual and traditional aspects.","The learner will gain knowledge of the development of architectural forms with reference to technology, style and character in various aspects of Hindu architecture.","The students will comprehend and relate to the theoretical basis of Budhdhist and Jain Architectures."],"u":[{"l":"1","t":"Indus Valley Civilization","h":null,"p":["Town planning principles","cultural ethos","economy exemplified","The Aryan civilization: With its emphasis on the Vedic town plan"]},{"l":"2","t":"","h":null,"p":["Buddhist Architecture Typology of lats","eddicts","stupas","viharas","and chaityas","both in rock- cut or other wise","The Buddhist philosophy and its imprint"]},{"l":"3","t":"Hindu Architecture, Indo Aryan","h":null,"p":["The evolution of the temple form","evolution of the shikhara in north India","The three schools of architecture - the Gujarat","the Khajuraho","and the Orrisan styles","Introduction to Dravidian Hindu Architecture"]},{"l":"4","t":"Jain Architecture","h":null,"p":["The temple cities of Palitana","Mount Abu and Girnar","Jain Theory The Jain philosophy and its imprint in built form","REFERNCE BOOKS 1","Stella Kramrisch","The Hindu temple","Volume 1 & 2","Motilal Banarsidass Publications, 1996","Percy Brown","Indian Architecture (Buddhist and Hindu period)","Taraporewala Sons & co Pvt, Ltd","1965 3","Volwahsen","Andreas","Living Architecture 4","Satish Grover","The Architecture of India- Volume 2, Vikas, 1980","Henri Stierlin","Anne Stierlin","Hindu India: from Khajuraho to the temple city of Madurai","Taschen, 1998","James Fergusson","History of Indian & Eastern Architecture","2007 7","Batley","Design Development of Indian Architecture","John murray","London, 1934"]}],"b":[]},"AUC 104":{"n":"Indian Festivals","c":"Audit","p":"NIL","k":"½ Lecture : , Tutorial : , Practical:","cr":0,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical, Tutorial class, viva voce and Minor tests and One Major Theory Examination.","o":"","co":["Students will learn about rich cultural aspects associated with Indian religions","The course will give deep insight in to understand the importance of festivals."],"u":[{"l":"1","t":"Indian Festivals","h":null,"p":["Introduction to major Indian festivals Bihu","Raksha Bandhan, Onam","Pongal, Holi","Dipawali","Dushehra","Easter","Good Friday","Christmas","Eid-ul-fitr and Eid-ul-Azha","Cultural aspects of festivals"]},{"l":"2","t":"","h":null,"p":["Characteristics of Indian festivals","Seasonal in nature","seasonal festival are Agro based","worships of animals"]},{"l":"3","t":"","h":null,"p":["festivals observed at same time but with different names in different parts of country"]},{"l":"3","t":"","h":null,"p":["Artificial or non religious festivals- like Jaisalmer desert festivals","Mango festivals in Delhi","Elephant festivals in India, Etc"]}],"b":["Discover India; Festival of India by Sonia Mehta","Hindu Festival : Origin, sentiments and Rituals by Mukuncharan Das."]},"AUC 105":{"n":"Vaidic Mathemeatics","c":"Audit","p":"NIL","k":"1/2 Lecture : , Tutorial : , Practical:","cr":0,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical, Tutorial class, viva voce and Minor tests and One Major Theory Examination.","o":"","co":["● Vedic mathematics methods are used in coding and VLSI implementation of encryption. ● Vedic mathematics method of division, exponentiation and multiplication are used in internet security and cryptographic algorithms for making these calculations faster than before. ● Arithmetic and logic unit (ALU) is responsible for all mathematical and logical calculations in computers. Some sutras like udharvtriyakbhyam and nikhilam are used for implementing multiplication methods. ● Digital Signal Processing (DSP) includes face recognition, text speech conversion, image processing and audio -video processing and also filtering of noise. In this area VM methods are very useful to improve the performance of DSP algorithms."],"u":[{"l":"I","t":"","h":null,"p":["Introduction & history of Vedic mathematics","Arithmetic and number","Vedic Maths Formulae","Addition and Subtraction: Addition - Completing the whole","Addition from left to right","Addition of list of numbers - Shudh method","Subtraction - Base method","Subtraction - Completing the whole","Subtraction from left to right"]},{"l":"II","t":"Multiplication","h":null,"p":["Ekadhikenpurven method (multiplication of two numbers of two digits)","Eknunenpurven method (multiplication of two numbers of three digits)","Urdhvatiragbhyam method (multiplication of two numbers of three digits)","Nikhilam Navtashchramam Dashtaha (multiplication of two numbers of three digits)","Combined Operations Division and Divisibility: Division","Nikhilam Navtashchramam Dashtaha (two digits divisor)","Paravartya Yojyet method (three digits divisor) Divisibility: Ekadhikenpurven method (two digits divisor)","Eknunenpurven method (two digits divisor)"]},{"l":"III","t":"Least Common Multiple (LCM) and Highest Common Factor (HCF) Power and Root Power","h":null,"p":["Square (two digit numbers)","Cube (two digit numbers)","Root: Square root (four digit number)","Cube root (six digit numbers)"]},{"l":"IV","t":"","h":null,"p":["Contribution of Indian Mathematicians (In light of Arithmetic)","Aryabhatt","Brahmagupt","Mahaveeracharya","Bharti Krishna Tirtha"]}],"b":["Vedic Mathematics, Motilal Banarsi Das, New Delhi.","Vedic Ganita: Vihangama Drishti-1, Siksha Sanskriti Uthana Nyasa, New Delhi.","Vedic Ganita Praneta, Siksha Sanskriti Uthana Nyasa, New Delhi.","Vedic Mathematics: Past, Present and Future, Siksha Sanskriti Uthana Nyasa, New Delhi.","Leelavati, Chokhambba Vidya Bhavan, Varanasi.","Bharatiya Mathematicians, Sharda Sanskrit Sansthan, Varanasi."]},"AUC 106":{"n":"Astronomy","c":"Audit","p":"NIL","k":"1/2 Lecture : , Tutorial : , Practical:","cr":0,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical, Tutorial class, viva voce and Minor tests and One Major Theory Examination. UNIT-I Historical introduction: Old Indian and western – astronomy – Aryabhatta, Tycho Brahe, Copernicus, Galileo – Olbers paradox – solar system – satellites, planets, comets, meteorites, asteroids. Practical astronomy – telescopes and observations & techniques – constellations, celestial coordinates, ephemeris. Celestial mechanics – Kepler’s laws – and derivations from Newton’s laws. Sun: Structure and various layers, sunspots, flares, faculae, granules, limb darkening, solar wind and climate. UNIT-II Stellar astronomy: H-R diagram, color-magnitude diagram – main sequence – stellar evolution – red giants, white dwarfs, neutron stars, black holes – accretion disc – Schwartzchild radius – stellar masses Saha–Boltzman equation – derivation and interpretation. Variable stars: Cepheid, RR Lyrae and Mira type variables – Novae and Super novae. Binary and multiple star system – measurement of relative masses and velocities. Interstellar clouds – Nebulae. UNIT-III Transformations Generalized Coordinates, Canonical transformations, Conditions for canonical transformation and problem, Poisson brackets, invariance of PB under canonical transformation, Rotating frames of reference, inertial forces in rotating frames. UNIT-IV Relativity and Application Concept of Special Theory of Relativity, Lorentz Transformation, Length Contraction and time dilation, Relativistic addition of velocities, conservation of mass and momentum, Concept of General Theory of Relativity, Equivalence of mass and energy, Relativistic Doppler shift and aberration of light. Lagrangian and Hamiltonian of relativistic particles, Relativistic degenerate electron gas. Reference Books: 1. “Textbook of Astronomy and Astrophysics with elements of Cosmology”, V. B. Bhatia, Narosa publishing 2001. 2. William Marshall Smart, Robin Michael Green “On Spherical Astronomy“, (Editor) Carroll, Bradley W Cambridge University Press ,1977 3. Bradley W.Carroll and Dale A. Ostlie. “Introduction to modern Astrophysics” Addison-Wesley, 1996. 4. Bradley W.Carroll and Dale A. Ostlie, “An Introduction to Modern Astrophysics” Addison Wesley Publishing Company,1996 5. ‘Stellar Astronomy’ by K. D Abhayankar. 6. ‘Solar Physics’ by K. D Abhayankar.","o":"","co":[],"u":[{"l":"I","t":"Historical introduction","h":null,"p":["Old Indian and western – astronomy – Aryabhatta","Tycho Brahe","Copernicus","Galileo – Olbers paradox – solar system – satellites","planets","comets","meteorites","asteroids","Practical astronomy – telescopes and observations & techniques – constellations","celestial coordinates","ephemeris","Celestial mechanics – Kepler’s laws – and derivations from Newton’s laws","Sun: Structure and various layers","sunspots","flares","faculae","granules","limb darkening","solar wind and climate"]},{"l":"II","t":"Stellar astronomy","h":null,"p":["H-R diagram","color-magnitude diagram – main sequence – stellar evolution – red giants","white dwarfs","neutron stars","black holes – accretion disc – Schwartzchild radius – stellar masses Saha–Boltzman equation – derivation and interpretation","Variable stars: Cepheid","RR Lyrae and Mira type variables – Novae and Super novae","Binary and multiple star system – measurement of relative masses and velocities","Interstellar clouds – Nebulae"]},{"l":"III","t":"","h":null,"p":["Transformations Generalized Coordinates","Canonical transformations","Conditions for canonical transformation and problem","Poisson brackets","invariance of PB under canonical transformation","Rotating frames of reference","inertial forces in rotating frames"]},{"l":"IV","t":"","h":null,"p":["Relativity and Application Concept of Special Theory of Relativity","Lorentz Transformation","Length Contraction and time dilation","Relativistic addition of velocities","conservation of mass and momentum","Concept of General Theory of Relativity","Equivalence of mass and energy","Relativistic Doppler shift and aberration of light","Lagrangian and Hamiltonian of relativistic particles","Relativistic degenerate electron gas"]}],"b":["“Textbook of Astronomy and Astrophysics with elements of Cosmology”, V. B. Bhatia, Narosa publishing 2001.","William Marshall Smart, Robin Michael Green “On Spherical Astronomy“, (Editor) Carroll, Bradley W Cambridge University Press ,1977","Bradley W.Carroll and Dale A. Ostlie. “Introduction to modern Astrophysics” Addison-Wesley,","Bradley W.Carroll and Dale A. Ostlie, “An Introduction to Modern Astrophysics” Addison Wesley Publishing Company,1996","‘Stellar Astronomy’ by K. D Abhayankar.","‘Solar Physics’ by K. D Abhayankar."]},"AUC 107":{"n":"Arts Of India","c":"Audit","p":"NIL","k":"1/2 Lecture : , Tutorial : , Practical:","cr":0,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical, Tutorial class, viva voce and Minor tests and One Major Theory Examination.","o":"","co":["Students will be introduced to emergence and development of art traditions upto 6th century C.E. Monuments will be studied in their cultural context.","Students will able to understand the monuments in their religious, regional and stylistic context. Students will be able to prepare plans of the monuments."],"u":[{"l":"1","t":"","h":null,"p":["Introduction to traditions of Art and Architecture in India","Introduction to Art and Architecture and prelude to historical art","Art of the pre-Mauryan period, iii","Art and Architecture of Mauryan Period iv","Sources of Inspiration of Mauryan Art and Architecture: Foreign and Indigenous"]},{"l":"2","t":"","h":null,"p":["Emergence and Development of Structural Stupa Architecture","Origin of Stupa Architecture","Stupa Architecture - Pre-Mauryan and Mauryan periods, iii","North India","Central India","Deccan and Gandhara iv","Structural monasteries and Chaityas","Emergence and Development of Rock-cut Architecture","Origin of Rock-cut Architecture","Eastern India","Western Deccan","Eastern Deccan","Central India"]},{"l":"3","t":"","h":null,"p":[]},{"l":"4","t":"","h":null,"p":["Emergence and Development of Temple Architecture (08 hrs) i","Origin of Temple Architecture- Theoretical aspects","Concept and symbolism of Temple, iii","Archaeological remains of structural temples","Temple Architecture during the Gupta period","Temple Architecture during the Vakataka period"]},{"l":"4","t":"","h":null,"p":["Sculptural Art and Paintings - Emergence and Development (10 hrs) i","Sculptural Art and Paintings - Concept and Symbolism","Terracottas","Ivories and Bronzes iii","Paintings iv","Stone sculptures- Gandhara","Mathura","Sarnath and Andhra schools of Art","Art during the Gupta-Vakataka period","Recommended Readings: 1, Barua","1934-37","Barhut Vol, I-III","Calcutta: Indian Research Institute","Cunningham","Alexander 1966","The Bhilsa Topes","Varanasi: Indological Book Corporation","Cunningham","Alexander 1965","The Stupa of Bharhut","Varanasi: Indological Book Corporation","Dallapiccola","Lallemant, 1980","The Stupa : Its Religious","Historical","and Architectural Significance","Wiesbaden: Franz Steiner Verlag","Dehejia","Vidya 1972","Early Buddhist Rock Temples A Chronological Study","London: Thames and Hudson"]}],"b":[]},"AUC 108":{"n":"Intellectual Property Rights","c":"Audit","p":"NIL","k":"1/2 Lecture : , Tutorial : , Practical:","cr":0,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical, Tutorial class, viva voce and Minor tests and One Major Theory Examination.","o":"","co":["After the completion of the course the student will be able to","Create an understanding on Intellectual Properties and the importance of it.","Understand Trademarks and Trade secrets. To create awareness of unfair completion and methods of it.","Create awareness on the protection copyrights and patents. Understand the Ownership rights and transfer.","Create awareness of Cyber laws, Cyber Crime and get understanding of Privacy of Data.","To create awareness international aspects of IPR and the Emerging Trends in IPR. Course Content"],"u":[{"l":"I","t":"Introduction to Intellectual property","h":null,"p":["Introduction","types of intellectual property—Patent","Trademarks","Copy rights","IPR and World Trade Organization","other international organizations","agencies and treaties","importance of intellectual property rights","Creating Intellectual Property","Intellectual Property Management","Emerging Issues in IPR","Research and Development in India"]},{"l":"II","t":"Fundamentals of Patent","h":null,"p":["Historical Overview of Patent Law","Concept of Patent","Patentable Inventions","Procedure for Obtaining Patent","Rights and Obligations of Patent Holder","Transfer and Infringement of Patent Rights","Geographical Indications","Case Study: Apple versus Samsung Patent Dispute"]},{"l":"III","t":"Trademarks","h":null,"p":["Purpose and function of trademarks","acquisition of trademark rights","protectable matter","selecting","and evaluating trademark","trade mark registration processes"]},{"l":"IV","t":"Copy rights","h":null,"p":["Fundamental of copy right law","originality of material","rights of reproduction","rights to perform the work publicly","copy right ownership issues","copy right registration","notice of copy right","international copy right law","Law of patents: Foundation of patent law","patent searching process","ownership rights and transfer"]}],"b":[" Textbook of Intellectual Property Rights, N.K. Acharya. Asia Law House, ed. 2021.  Intellectual property right, Deborah. E. Bouchoux, Cengage learning.  Intellectual Property Rights–Pandey Neeraj, Dharni Khushdeep. PHI.  Intellectual Property Rights: Text and Cases R. Radhakrishnan, S. Balasubramanian. Excel Books.","Intellectual property right – Unleashing the knowledge economy, Prabuddha Ganguli, Tate McGraw Hill ltd.","A short course in International Intellectual Property Rights – Karla C. Shippey, World Trade Press.","Intellectual Property Rights – Heritage, Science, & Society under international treaties – A. Subbian, - Deep & Deep Publications – New Delhi."]},"AUC 109":{"n":"Human Rights","c":"Audit","p":"NIL","k":"1/2 Lecture : , Tutorial : , Practical:","cr":0,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical, Tutorial class, viva voce and Minor tests and One Major Theory Examination.","o":"","co":["On completion of the course, students will be able to:","Simply put, human rights education is all learning that develops the knowledge, skills, and values of human rights.","Strengthen the respect for human rights and fundamental freedoms.","Enable all persons to participate effectively in a free society.","Learn about human rights principles, such as the universality, indivisibility, and interdependence of human rights."],"u":[{"l":"I","t":"The Basic Concepts","h":null,"p":["Individual, Group","Civil Society, State","Equality","Justice","Human Values: Humanity","Virtues","Compassion"]},{"l":"II","t":"Human Rights and Human Duties","h":null,"p":["i) Philosophical and historical foundation of human rights and duties ii) Theories of rights iii) Concept and classifications of human rights and duties iv) Human rights and duties 1","Correlation of rights and duties/responsibilities 2","Tensions between rights inter se","duties inter se","and rights and duties"]},{"l":"III","t":"Society, Religion, Culture, and their Inter-Relationship","h":null,"p":["Impact of Social Structure on Human behavior","Roll of Socialization in Human Values","Science and Technology","Modernization","Globalization","and Dehumanization"]},{"l":"IV","t":"Social Structure and Social Problems","h":null,"p":["Social and Communal Conflicts and Social Harmony","Rural Poverty","Unemployment","Bonded Labour","Migrant workers and Human Rights Violations","Human Rights of mentally and physically challenged"]}],"b":["Shastry, T. S. N., India and Human rights: Reflections, Concept Publishing Company India (P Ltd), 2005.","Nirmal, C.J., Human Rights in India: Historical, Social and Political Perspectives (Law in India), Oxford India."]},"AUC 110":{"n":"Logical Research","c":"Audit","p":"NIL","k":"1/2 Lecture : , Tutorial : , Practical:","cr":0,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical, Tutorial class, viva voce and Minor tests and One Major Theory Examination","o":"","co":["In this course you should develop the following competencies:","To understand about research methodology with its different aspects, about logical reasoning, and types of research.","It will also result in knowledge appraisal from data collection to data interpretation.","Mathematical reasoning will also help them to acquire several skills required for the placement. Course Content"],"u":[{"l":"1","t":"Research Methodology","h":null,"p":["meaning","characteristics","Types of research","Process of research","Research methods and Ethical issues in research"]},{"l":"2","t":"Logical Reasoning","h":null,"p":["arguments","deductive and inductive research","quantitative and qualitative research","scientific research","logical approach in research - Venn diagram","Inferences","analogies"]},{"l":"3","t":"","h":null,"p":["Data collection","Organization of data","Data analysis and mapping","Parametric and non- parametric","Data Interpretation"]},{"l":"4","t":"","h":null,"p":["Mathematical Reasoning","number series","letter series, codes","relationships","classification"]}],"b":["Business Research Methods – Donald Cooper & Pamela Schindler, TMGH, 9th edition","Business Research Methods – Alan Bryman & Emma Bell, Oxford University Press. 3.ResearchMethodology–C.R.Kothari","Marketing Research- G C Beri","Logical reasoning- R S Agarwal"]},"AUC 111":{"n":"Professional Ethics","c":"Audit","p":"NIL","k":"1/2 Lecture : , Tutorial : , Practical:","cr":0,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical, Tutorial class, viva voce and Minor tests and One Major Theory Examination.","o":"","co":["After the completion of the course the student will be able to-","Understand the core values that shape the ethical behaviour of a professional.","Identify the multiple ethical interests at stake in a real-world situation or practice.","Explain the role and responsibility in technological development by keeping personal ethics and legal ethics.","Solve moral and ethical problems through exploration and assessment by established experiments.","Apply the knowledge of human values and social values to contemporary ethical values and global issues. Course Content"],"u":[{"l":"I","t":"Understanding Professional Ethics and Human Values","h":null,"p":["Morals","values and Ethics – Integrity- Academic integrity-Work Ethics- Service Learning- Civic Virtue Respect for others- Living peacefully- Caring and Sharing- Honestly- courage-Cooperation commitment Empathy-Self Confidence -Social Expectations"]},{"l":"II","t":"Ethics for Engineers","h":null,"p":["Ethics – its importance – code of ethics – person and virtues – habits and morals – 4 main virtues – ethical theories – Kohlberg’s theory – Gilligan’s theory – towards a comprehensive approach to moral behaviour – truth – approach to knowledge in technology"]},{"l":"III","t":"Environmental Ethics and Sustainability","h":null,"p":["Problems of environmental ethics in engineering – engineering as profession serving people – engineer’s responsibility to environment – principles of sustainability – industrial","economic","environmental","agricultural","and urban sustainability – Sustainable development","Global Ethical Issues"]},{"l":"IV","t":"Social Experimentation, Responsibility and Rights","h":null,"p":["Engineers and responsible experiments – safety and risk – confidentiality – knowledge gained confidentiality – experimental nature of engineering – Intellectual Property Rights – professional rights – employee rights – occupational crime"]}],"b":[" Mike W Martin, Roland Schinzinger, “ Ethics in Engineering”, Tata McGraw –Hill.  Govindarajan M, Natarajan S, Senthil Kumar V S, “Engineering Ethics” PHI India.  R.R Gaur, R Sangal, G P Bagaria, A foundation course in Human Values and professional Ethics, Excel books, New Delhi.  Aarne Vesblind, Alastair S Gunn, “Engineering Ethics and the Enviornment”.  Edmund G Seebauer, Robert L Barry, “Fundamentals of Ethics for scientists and engineers” Oxford University Press.  B L Bajpai, 2004, Indian Ethos and Modern Management, New Royal Book Co., Lucknow. Reprinted 2008."]},"AUC 112":{"n":"Environmental Laws","c":"Audit","p":"NIL","k":"1/2 Lecture : , Tutorial : , Practical:","cr":null,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical, Tutorial class, viva voce and Minor tests and One Major Theory Examination.","o":"","co":["The course gives students the opportunity to grapple with contemporary legal debates in environment law. Therefore, the learning outcomes of this course can be encapsulated as follows:","The primary learning outcome is to sensitize the students towards human activities that adversely affect the environment and the need for regulation of such activities.","Students will develop a thorough understanding of practice and procedure followed by various environmental law enforcing agencies/bodies.","Students will be able to pursue environmental litigation before the National Green Tribunal and assist the Tribunal as a researcher or in any other capacity.","Students will be able to assist industries and projects in obtaining environmental clearance and compliances with other environmental laws."],"u":[{"l":"I","t":"Development of Environmental Laws and Policies in India","h":null,"p":["Concept of ‘environment’ and understanding scope of environmental law","Two approaches towards environmental protection- ‘Eco-centric approach’ and ‘Anthropocentric’ approach, III","Impact of IEL on environmental law in India","Significance of Environmental Protection in Five Year Plans","Development of the ‘Right to Environment’ as a Fundamental Right and challenges"]},{"l":"II","t":"Judicial remedies and the role of National Green Tribunal","h":null,"p":["Civil Remedies i","Tortious remedy and Class Action II","Criminal Law Remedies under relevant provisions of Indian Penal Code","1860 and Criminal Procedure Code","1973 III","Constitutional Law Remedies i","Writ Jurisdiction & Public Interest Litigation IV","Statutory Remedies i","Remedies under Public Liability Insurance Act 1991","National Environment Tribunal Act, 1995","National Green Tribunal Act, 2010"]},{"l":"III","t":"Statutory framework for Prevention of Environmental, Air and Water Pollution","h":null,"p":["Water (Prevention and Control of Pollution) Act 1974 [Framework of the Act, Criminal Liability and Judicial relief under the Act, Constitutional Challenges of Restraining Orders under Section 33] II","The Air (Prevention and Control of Pollution) Act 1981 [Framework of the Act, Criminal Liability and Judicial relief under the Act, Noise Pollution] III","Environment (Protection) Act","1986 [Framework of the Act, Enforcement mechanisms and Role of Pollution Control Boards, Environment Impact Assessment, Coastal zone regulations Notifications] IV","Law on Waste Management and Handling V","Procedural environmental rights under various environmental laws  Right to Information  Right to public consultation  Right of access to justice"]},{"l":"IV","t":"Statutory framework governing Forest, Wildlife and Biodiversity","h":null,"p":["Statutory Framework on Forest Preservation [The Indian Forest Act, 1927; Forest (Conservation) Act, 1980; National Forest Policy, 1988; The Scheduled Tribe and other Traditional Forest Dwellers (Recognition of Forest Rights) Act, 2006] III","Statutory Framework on Wildlife & Biodiversity Protection [The Wildlife (Protection) Act, 1972; Implementation and gaps and Judicial Perspective; Biological Diversity Act, 2002]"]}],"b":["Shyam Divan & Armin Rosencranz, Environmental Law & Policy in India (2 nded, Oxford University Press, 2014)","P. Leelakrishnan, Environmental law in India (4th ed, LexisNexis, 2016)","Lavanya Rajamani and Shibani Ghosh, Indian Environmental Law: Key Concepts and Principles (Orient Blackswan, 2019)","Gitanjali Nain Gill, Environmental Justice in India: The National Green Tribunal (Routledge, 2017)","Patricia Birnie, Alan Boyle and Catherine Redgwell, International Law and the Environment (3rd ed., Oxford University Press, 2009)","Philippe Sands, Principles of International Environmental Law (2nd ed, Cambridge University Press, 2003)"]},"AUC 113":{"n":"Health Law","c":"Audit","p":"NIL","k":"½ Lecture : , Tutorial : , Practical:","cr":0,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical, Tutorial class, viva voce and Minor tests and One Major Theory Examination","o":"","co":["In this course you should develop the following competencies:","Knowledge and understanding of the values and policies underlying Health Law.","Knowledge and understanding of substantive law related to health care, health care insurance markets as well as related procedural law.","Written and oral communication in the legal context. Course Content"],"u":[{"l":"1","t":"","h":null,"p":["BASICS OF HEALTH LAW- Basic of Health and its provider","Origin & Evaluation","All Council Acts"]},{"l":"2","t":"","h":null,"p":["NEED FOR HEALTH LAW -Fraudulence","Negligence and Abuse","Human Rights","Rights & Duties of Health Care Provider (Public & Private Activities)"]},{"l":"3","t":"","h":null,"p":["LEGAL ASPECTS OF HEALTH LAW- Role of Health Policy & Health Care Delivery","General Laws on Health Law (Medical Allied Agencies)","Specific Laws on Health Law (NDT, PWD/etc.)"]},{"l":"4","t":"","h":null,"p":["MEDICAL INSURANCE –Introduction-Various types","Significance and Kind of Medical Insurance/Policies","Insurance & Assurance","General Principles of Law and Contract","Medical Insurance Regulations"]}],"b":["Jonathan Herring- Medical Law and Ethics 2)Mason and Mc Call Smith- Law and Medical Ethics 3)S. V. Jogarao- Current Issues in Criminal Justice and Medical Law"]},"AUC 114":{"n":"National Cadet Corps (NCC)","c":"Audit","p":"NIL","k":"½ Lecture : , Tutorial : , Practical:","cr":0,"a":"","o":"","co":["In this course you should develop the following competencies:","Imbibe the conduct of NCC cadets.","Respect the diversity of different Indian culture.","Perform his/her role in Nation Building","Do the social services on different occasions.","Practice togetherness and empathy in all walks of their life.","Do the asana and gain the physical& mental fitness Course Content"],"u":[{"l":"1","t":"","h":null,"p":["NCC General History, Aims","Objective of NCC","NCC as Organization","Incentives of NCC","Duties of NCC Cadet","NCC Camps: Types & Conduct"]},{"l":"2","t":"National Integration & Awareness National Integration","h":null,"p":["Importance & Necessity","Factors Affecting National Integration","Unity in Diversity & Role of NCC in Nation Building","Threats to National Security"]},{"l":"3","t":"","h":null,"p":["Social Service and Community Development Celebration of Days of National & International Importance","Social Service and Community Development Activities to be conducted"]},{"l":"4","t":"Health & Hygiene","h":null,"p":["Yoga- Introduction","Definition","Purpose","Benefits","Asanas-Padamsana","Siddhasana","Gyan Mudra","Surya Namaskar","Shavasana","Vajrasana","Dhanurasana","Chakrasana","Sarvaangasana","Halasana etc"]}],"b":["R. Gupta, “NCC: Handbook of NCC Cadets for 'A', 'B' and 'C' Certificate Examinations” 1st Edition (English, Paperback, RPH Editorial Board)"]},"AUC 115":{"n":"Basics of Human Health and Preventive Medicines","c":"Audit","p":"NIL","k":"1/2 Lecture: , Tutorial : , Practical:","cr":0,"a":"Continuous assessment through tutorials, attendance, home assignments, quizzes, practical, Tutorial class, viva voce and Minor tests and One Major Theory Examination. UNIT- 1 Health- Definition, dimensions, concept of wellbeing, Physical quality of life index, Spectrum of health, Determinants of health. Concept of disease- Epidemiological triad, Natural history of disease, Risk factors, risk group, Iceberg of disease, Disease control, Disease elimination, Disease eradication, Monitoring and surveillance- Concept of prevention, Primary, Secondary and Tertiary, Modes of Intervention. UNIT- 2 Communicable diseases- Type of microorganisms, Mode of transmission, Prevention of infectious diseases, Vaccination/immunization. Diarrheal diseases and dehydration- Prevention and role of ORS. Fever- cause and how to deal with. Respiratory problems and cough UNIT - 3 Non communicable diseases/ Lifestyle related disorder- Risk factors, CAD, risk and prevention, Hypertension, Diabetes mellitus, Obesity, Cancer, Accidents. UNIT – 4 Nutrition and health- Classification of food, Balance diet. Occupational hazards Mental health and substance abuse Medical Emergencies- BLS and ALS. Reference Textbook 1) K. Park – “Park’s Textbook of Preventive and Social Medicine” 2) Yash Pal Bedi & Pragya Sharma– “Handbook of Preventive and Social Medicine, Seventeenth Edition, CBS Publication”. 3) Sunder Lal, Adarsh, Pankaj – “Update on Textbook of Community Medicine Preventive and Social Medicine with Recent Advances” 5th Edition, Publication 2018. 4) Dr. B. Saha- “Preventive and Social Medicine Communicable Disease Hygiene”. 5) Rabindra Nath Roy, Indernil Saha- “Mahajan and Gupta Textbook of Preventive and Social Medicine” 4th Edition, Japee CONSTITUTION OF INDIA AND ENVIRONMENTAL GOVERNANCE:","o":"","co":[],"u":[{"l":"1","t":"","h":null,"p":["Health- Definition","dimensions","concept of wellbeing","Physical quality of life index","Spectrum of health","Determinants of health","Concept of disease- Epidemiological triad","Natural history of disease","Risk factors","risk group","Iceberg of disease","Disease control","Disease elimination","Disease eradication","Monitoring and surveillance- Concept of prevention","Primary","Secondary and Tertiary","Modes of Intervention"]},{"l":"2","t":"","h":null,"p":["Communicable diseases- Type of microorganisms","Mode of transmission","Prevention of infectious diseases","Vaccination/immunization","Diarrheal diseases and dehydration- Prevention and role of ORS","Fever- cause and how to deal with","Respiratory problems and cough"]},{"l":"3","t":"","h":null,"p":["Non communicable diseases/ Lifestyle related disorder- Risk factors, CAD","risk and prevention","Hypertension","Diabetes mellitus","Obesity","Cancer","Accidents"]},{"l":"4","t":"","h":null,"p":["Nutrition and health- Classification of food","Balance diet","Occupational hazards Mental health and substance abuse Medical Emergencies- BLS and ALS","Reference Textbook 1) K","Park – “Park’s Textbook of Preventive and Social Medicine” 2) Yash Pal Bedi & Pragya Sharma– “Handbook of Preventive and Social Medicine","Seventeenth Edition","CBS Publication”","3) Sunder Lal","Adarsh","Pankaj – “Update on Textbook of Community Medicine Preventive and Social Medicine with Recent Advances” 5th Edition","Publication 2018, 4) Dr","Saha- “Preventive and Social Medicine Communicable Disease Hygiene”","5) Rabindra Nath Roy","Indernil Saha- “Mahajan and Gupta Textbook of Preventive and Social Medicine” 4th Edition","Japee CONSTITUTION OF INDIA AND ENVIRONMENTAL GOVERNANCE"]}],"b":[]},"AUC 116":{"n":"Administration And Adjudication","c":"Audit","p":"NIL","k":"1 / 2 Lecture, Tutorial, Practical","cr":0,"a":"Continuous assessment through Tutorial classes, Home Assignments, Quizzes, Practical, Viva- Voce, Attendance, Minor Tests and One Major Theory Examination.","o":"","co":["At the end of the course, learners should be able to:","Understand the fundamental principles of environmental governance.","Understand Constitutional perspectives of environmental governance in India.","Procedural compliance under environmental legislations and role of Judiciary and quasi- judicial bodies in environmental governance.","Develop an understanding of bio-diversity conservation, climate change, forest protection, waste management and other issues. COURSE CONTENTS"],"u":[{"l":"I","t":"","h":null,"p":["Foundations of Environmental Law and Governance Principles and Legal Instruments of Environmental Governance Emerging Trends in Environmental Law"]},{"l":"II","t":"","h":null,"p":["Constitution of India and the articles relating Environment Pollution Control Laws and Administrative processes Environment Protection Act and Administrative processes Waste Management Laws and Role of Municipalities and other agencies"]},{"l":"III","t":"","h":null,"p":["Basics of Forest Management in India Judiciary and its role Biodiversity Laws and its Application","ABS Guidelines"]},{"l":"IV","t":"","h":null,"p":["Wildlife Protection and management in India Adjudicatory Mechanisms- Supreme Court","High Court","National Green Tribunal"]}],"b":[" Philippe Sands, Principles of International Environmental Law, Cambridge, 2018  Indian Environmental Law: Key Concepts and Principles, ed. Shibani Ghosh, Orient BlackSwan (2019).  NawneetVibhaw, Environmental Law: An Introduction, LexisNexis (2016).  Shyam Divan and Armin Rosencranz, Environmental Law and Policy in India: Cases, Material & Statutes  Justice T S Doabia (2010) Environmental and Pollution Laws in India, Lexis Nexis Butterworths Wadhwa. Chapters 10 and 11.  S Ghosh, S Lele, N Henle, Appellate Authorities under Pollution Control Laws in India: Powers, Problems and Potential, LEAD 2018  Ritwick Dutta and Bhupender Yadav (2012) Supreme Court on Forest Conservation, Universal Law Publishing. Introduction (The Court’s Journey through Forests) and Chapter1.  Gitanjali Gill, Environmental Justice in India: The National Green Tribunal, Routledge (2016)  Abhayraj Naik and Parul Kumar, India’s Domestic Climate Policy is Fragmented and Lacks Clarity, available at https://www.epw.in/engage/article/indias-domestic-climate-policy- fragmented-lacks-clarity  Suggested Documentaries- Climate Change the Facts, BBC (April, 2019) DIRECTIVE PRINCIPLES OF STATE POLICY AND FUNDAMENTAL DUTIES:"]},"AUC 117":{"n":"Constitutional Imperative","c":"Audit","p":"NIL","k":"1 / 2 Lecture, Tutorial, Practical","cr":0,"a":"Continuous assessment through Tutorial classes, Home Assignments, Quizzes, Practical, Viva- Voce, Attendance, Minor Tests and One Major Theory Examination.","o":"","co":["At the end of the course, learners should be able to:","Understand the fundamental concepts behind Directive Principles of State Policy.","Evolution and the adoption of the DPSP through the Constituent Assembly debates.","Learn how the three organs of the governance play role in shaping and achieving DPSP.","Understand the basics and relevance of Fundamental Duties.","Evaluate the relationship between Indian Knowledge System and Fundamental Duties. COURSE LAYOUT"],"u":[{"l":"I","t":"","h":null,"p":["Evolution and Concept of Directive Principles of State Policy","Incorporation of the Directive Principles of State Policy: Constituent Assembly Debates"]},{"l":"II","t":"","h":null,"p":["Salient Features of the Directive Principles of State Policy under the Indian Constitution","The Legislative","the Executive and the Judiciary on the Directive Principles of the State Policy"]},{"l":"III","t":"","h":null,"p":["The Legislative","the Executive and the Judiciary on the Directive Principles of the State Policy (Cont.,)","Evolution and Relevance of the Fundamental Duties"]},{"l":"IV","t":"","h":null,"p":["Relationship between Fundamental Duties and Indian Knowledge System","The Legislative","the Executive and the Judiciary on Fundamental Duties"]}],"b":[" H.M. Seervai, Constitutional Law of India, Vol. I and 2, Universal Law Publishing (LexisNexis) 4th Edition, 2015  Samaraditya Pal, India’s Constitution: Origins and Evolution, Vol. 3, LexisNexis, 2015 Constituent Assembly Debates, Loksabha Secretariat  Justice R C Lahoti, Fundamental Duties: A Forgotten Chapter of the Constitution, LexisNexis, 2015  NCRWC, A Consultation Paper on Effectuation of Fundamental Duties of Citizens, 2001  Granvile Austin, The Indian Constitution: A Cornerstone of a Nation, Oxford Clarendon Press, 1966. INTRODUCTION TO INTELLECTUAL PROPERTY TO ENGINEERS AND"]},"AUC 118":{"n":"Technologists","c":"Audit","p":"NIL","k":"1 / 2 Lecture, Tutorial, Practical","cr":0,"a":"Continuous assessment through Tutorial classes, Home Assignments, Quizzes, Practical, Viva- Voce, Attendance, Minor Tests and One Major Theory Examination.","o":"The course aims to: 1. Introduce fundamental concepts of Artificial Intelligence. 2. Develop basic Python programming skills for AI applications. 3. Build foundations in data analysis and preprocessing. 4. Provide understanding of machine learning concepts. 5. Expose students to AI use cases in various engineering domains.","co":["After the completion of the course the learners should be able to:","Create an understanding on Intellectual Properties and the importance of it.","Learn basics of Patents, Trademarks and copyrights.","Create awareness on the filing, protection copyrights and patents and understand the Ownership rights and their transfer.","Understand trade secrets and able to compare their positives and negatives traits.",", Aware of emerging trends in IPR, and learn about IP management. COURSE LAYOUT"],"u":[{"l":"I","t":"","h":null,"p":["Introduction to Intellectual Property","Types of intellectual property—Patent","Trademarks","Copy rights","IPR and World Trade Organization","Other international organizations"]},{"l":"II","t":"","h":null,"p":["Basics of Patent","Patent filing procedure","Obligations of Patent Holder","Basics of Copyright- Fundamental of copy right law","originality of material","rights of reproduction","rights to perform the work publicly","copy right ownership issues","copy right registration Industrial Design","Emerging issue"]},{"l":"III","t":"","h":null,"p":["Trademark basic","Purpose and function of trademarks","acquisition of trademark rights","protectable matter","selecting","and evaluating trademark","trade mark registration processes GI basic","IC Layout Design"]},{"l":"IV","t":"","h":null,"p":["Trade secret","Comparative analysis","IP management"]}],"b":[" THE ECONOMIC STRUCTURE OF INTELLECTUAL PROPERTY LAW, William M. LANDES, Richard A. Posner, Harvard University Press, 2003.  Intellectual Property and Development: Theory and Practice, Rami M. Olwan, Springer  Narayanan, P (2006) Intellectual Property Law. 3rdedition. Eastern Law House  Colston, C., Middleton, K. 2004 Modern Intellectual Property Law. 2nd Edition. Cavendish Publishing Ltd  Cornish W, Llewelyn, D (2003) Intellectual Property: Patents, Copyrights, Trademarks and Allied rights. Fifth edition. Sweet and Maxwell.  William M. Landes & Richard A. Posner, Indefinitely Renewable Copyright, 70 U. CHI. L. REV. Goldstein, Kitch and Perlman, 2006, Selected Statutes and International Agreements on Unfair Competition, Trademark, Copyright, and Patent  Paul Goldstein, 2002, Copyright, Patent, Trademark and Related State Doctrines: Cases and Materials on Intellectual Property Law, Revised 5th edition, New York, NY: Foundation Press, 1025 pages.  T.K.Bandyopadhyay and Saurabh Bindal, “Introduction to Intellectual Property” 1st edition Eastern Book Company, 2015 AUC119 : Fundamentals of Artificial Intelligence Course category : Audit Course Pre-requisite : Basic Programming Knowledge Subject Contact : Lecture: 2, Tutorial: 0, Practical:0 hours/week Number of Credits : 0 Course Assessment : Continuous assessment through assignments, quizzes, tutorials, course- methods based project, one minor test and one major examination Course Objectives : The course aims to:","Introduce fundamental concepts of Artificial Intelligence.","Develop basic Python programming skills for AI applications.","Build foundations in data analysis and preprocessing.","Provide understanding of machine learning concepts.","Expose students to AI use cases in various engineering domains. Course Outcomes : After successful completion of this course, students will be able to: CO1. Understand fundamental concepts of Artificial Intelligence and intelligent systems. CO2. Apply Python libraries for data handling and visualization. CO3. Perform data preprocessing and exploratory data analysis. CO4. Understand basic machine learning concepts and evaluation metrics. CO5. Identify and analyze AI applications in various engineering domains. CO6. Develop simple AI-based solutions using data preprocessing, visualization, and basic machine learning models. Topics Covered UNIT I: Introduction to AI and Python Programming 6 Overview of Artificial Intelligence: History, scope, types of AI, Applications of AI in modern technology, Python Basics: Data types, variables, operators, Control Structures: Conditional statements, loops, Functions and Modules, Data Structures: Lists, tuples, dictionaries, sets, File Handling Introduction to NumPy, Pandas, Matplotlib. UNIT II: Exploratory Data Analysis 6 Types of Data: Numerical and Categorical, Steps in Exploratory Data Analysis, Descriptive Statistics, Data Visualization Techniques, Introduction to Data-driven Decision Making. UNIT III: Data Preprocessing and Introduction to Machine Learning 6 Data Cleaning and Deduplication, Handling Missing Data, Data Transformation: Normalization, Scaling, Binning, Introduction to Supervised and Unsupervised Learning (Conceptual Only), Model Evaluation Metrics: Accuracy, Precision, Recall, F1-score. UNIT IV: AI Use Cases in Engineering 6 Predictive maintenance and fault detection in industrial systems using sensor data, Smart infrastructure monitoring, Process optimization, quality inspection, and automation in manufacturing environments, Intelligent decision support systems for healthcare, environmental monitoring, and cybersecurity applications.","Aurélien Géron, Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow, O’Reilly","Wes McKinney, Python for Data Analysis, O’Reilly","Ethem Alpaydin, Introduction to Machine Learning, MIT Press","Jake VanderPlas, Python Data Science Handbook, O’Reilly","Ian Goodfellow, Yoshua Bengio, Aaron Courville, Deep Learning, MIT Press","Sebastian Raschka, Machine Learning with Python, Packt","Stuart Russell & Peter Norvig, Artificial Intelligence: A Modern Approach, Pearson","Andreas C. Müller & Sarah Guido, Introduction to Machine Learning with Python, O’Reilly."]},"IKS 101":{"n":"Indian Knowledge Through Classical Languages","c":"Audit","p":"NIL","k":"1 / 2 Lecture, Tutorial, Practical","cr":0,"a":"Continuous assessment through Tutorial classes, Home Assignments, Quizzes, Practical, Viva- Voce, Attendance, Minor Tests and One Major Theory Examination.","o":"","co":["At the end of the course learners shall be able to:","Students will be able to read, understand, and interpret the core texts of Sanskrit, Pali, Prakrit, and other Indian languages.","Students will analyze the historical and cultural significance of Indian philosophy, science, art, and social practices.","Students will develop the ability to apply the principles of Indian scriptures and folk traditions to modern contexts.","Students will critically evaluate the contributions of the Indian Knowledge Tradition in fields like medicine, architecture, and science.","Students will be equipped to promote and preserve the Indian Knowledge Tradition through innovative and creative approaches. COURSE CONTENTS"],"u":[{"l":"I","t":"Sanskrit Language-Based Indian Knowledge Tradition Objective","h":null,"p":["To understand the fundamental principles","philosophies","and their significance in the Indian Knowledge Tradition through the Sanskrit language and its literature","Course Content: 1","Linguistics and Literature: - Introduction to Sanskrit language","its grammar (morphology, phonetics)","and vocabulary (words, meanings, synonyms, and prosody)","Key texts: Vedas (Rigveda, Yajurveda, Samaveda, Atharvaveda)","Upanishads","Mahabharata","Ramayana","Puranas","and their significance","Philosophy and Religion: - Indian philosophical systems (Yoga, Vedanta, Nyaya, Vaisheshika, Mimamsa, Sankhya)","Core concepts of the Bhagavad Gita and Brahmasutra","Jain and Buddhist philosophies (methods, principles, and statements)","Science and Mathematics: - Mathematics: Contributions of Aryabhata","Bhaskaracharya","and Shulba Sutras","Architecture: Sushruta Samhita","Charaka Samhita","Ayurveda and Rasashastra (Chemistry): Contributions to medical and chemical sciences","History","Culture","and Society: - Elements of history and culture in Sanskrit literature","Kautilya’s Arthashastra (practical approach)","Contributions of Kalidasa","Bhavabhuti","and Kabir","Musicology: Gandharvacharya","Sangita Ratnakara"]},{"l":"II","t":"Pali Language-Based Indian Knowledge Tradition Objective","h":null,"p":["To understand the Buddhist perspective of the Indian Knowledge Tradition through the Pali language and its literature","Course Content: 1","Linguistics and Literature: - Introduction to Pali language","its structure","grammar","and vocabulary","Primary","secondary (various sutras, commentaries)","and tertiary Pali literature","Philosophy and Religion: - Buddhist philosophy: Truth and reality","the Eightfold Path","Nirvana","Buddhist meditation practices and their psychological aspects","Architecture and Art: - Buddhist architecture: Stupas (Sanchi, Amaravati)","viharas","universities (Nalanda, Takshashila, etc.)","Buddhist art: Gandhara and Mathura styles","Buddhist iconography"]},{"l":"III","t":"Prakrit Language-Based Indian Knowledge Tradition Objective","h":null,"p":["To understand the Jain perspective of the Indian Knowledge Tradition through the Prakrit language and Jain literature","Course Content: 1","Linguistics and Literature: - Introduction to Prakrit language","its dialects (Shauraseni, Magadhi, Ardhamagadhi)","Jain Agamas: Acharanga Sutra","Sutrakritanga","and other texts","Philosophy and Religion: - Jain philosophy: Anekantavada (non-absolutism)","Syadvada (relativity)","and principles of religion","Jain ethics and principles of non-violence","Science and Mathematics: - Jain mathematics and cosmology","Contributions of Jainism to astronomy and religion","Culture and Art: - Jain architecture: Dilwara temples","Ranakpur","Jain painting and sculpture","Jain music and literary traditions"]},{"l":"IV","t":"Indian Knowledge Tradition Based on Other Indian Languages and Folk Traditions Objective","h":null,"p":["To understand the Indian Knowledge Tradition through Tamil","Telugu","Kannada","and other Indian languages","as well as folk traditions","Course Content: 1","Linguistics and Literature: - Tamil and Telugu literature: Bhakti literature","Tirukkural","and Shaiva-Vaishnava poetry","Folk literature: Kabir, Gita","and oral traditions","Folk Culture and Traditions: - Folk arts: Madhubani, Warli","Folk music and dance: Bihu, Garba","Lavani","Folk festivals","rituals","and oral traditions","Education and Technology: - Tamil Siddha medicine and traditional knowledge systems","Traditional water management and folk practices","Folk astronomy and meteorology","Social and Economic Traditions: - Traditional occupations and practices","Folk beliefs and community life","Regional festivals and their cultural significance","Resources: - Primary texts: Vedas","Upanishads","Puranas","Jain Agamas","Buddhist texts","Modern reference books: Works on Indian culture","history","and traditions","Digital resources: Digital libraries and online resources for Indian languages","Regional manuscripts and traditional knowledge systems"]}],"b":[]},"IKS 102":{"n":"Indian Knowledge System: Concepts And Applications In Science","c":"Audit","p":"NIL","k":"1 / 2 Lecture, Tutorial, Practical","cr":0,"a":"Continuous assessment through Tutorial classes, Home Assignments, Quizzes, Practical, Viva- Voce, Attendance, Minor Tests and One Major Theory Examination.","o":"","co":["At the end of the course, learners should be able to:","Understand the basic concepts of Science in Indian Knowledge Systems.","Get an overview of aspects in which ancient science played impactful role.","Develop an insight for utilizing the scientific knowledge into contemporary fields. COURSE CONTENTS"],"u":[{"l":"I","t":"","h":null,"p":["Indian Knowledge System – An Introduction The Vedic Corpus- Vedas","Upanishads","Schools of philosophy Buddhist Corpus- Tripitakas","Jataka Tales Jaina Corpus- Agamas Wisdom through the Ages"]},{"l":"II","t":"","h":null,"p":["Number Systems and Units of Measurement Mathematics- Overview","Vaidic and Later age mathematics Astronomy- Overview and contributions"]},{"l":"III","t":"","h":null,"p":["Knowledge Framework and classifications Linguistics- Panini & Sanskrit","Pali and Prakrit"]},{"l":"IV","t":"","h":null,"p":["Health Wellness and Psychology Town Planning and Architecture"]}],"b":["Mahadevan, B., Bhat Vinayak Rajat, Nagendra Pavana R.N. (2022), “Introduction to Indian Knowledge System: Concepts and Applications”, PHI Learning Private Ltd. Delhi. ADDITIONAL READINGS:  Pride of India: A Glimpse into India’s Scientific Heritage, Samskrita Bharati, New Delhi.  Sampad and Vijay (2011). “The Wonder that is Sanskrit”, Sri Aurobindo Society, Puducherry.  Acarya, P.K. (1996). Indian Architecture, MunshiramManoharlal Publishers, New Delhi.  Banerjea, P. (1916). Public Administration in Ancient India, Macmillan, London.  Kapoor Kapil, Singh Avadhesh (2021). “Indian Knowledge Systems Vol – I & II”, sntntn snIdndidn fP. tatnint ddittd dennatd fo  Verma. Keshav Dev. (2012) Vedic Physics, Motilal Banarsidass Publishers."]},"IKS 103":{"n":"Indian Knowledge System: Concepts And Applications In Engineering","c":"Audit","p":"NIL","k":"1 / 2 Lecture, Tutorial, Practical","cr":0,"a":"Continuous assessment through Tutorial classes, Home Assignments, Quizzes, Practical, Viva- Voce, Attendance, Minor Tests and One Major Theory Examination.","o":"","co":["At the end of the course, learners should be able to:","Understand the basic concepts of Engineering in Indian Knowledge Systems.","Get an overview of aspects in which ancient Engineering played an impactful role.","Develop an insight for utilizing the scientific knowledge into contemporary fields.","Understand the role of Engineering in town planning in ancient India.","Understand the interrelation of Astronomy and Architecture. COURSE LAYOUT"],"u":[{"l":"I","t":"","h":null,"p":["Indian Knowledge System – An Introduction The Vedic Corpus"]},{"l":"II","t":"","h":null,"p":["Number System and Units of Measurements Mathematics Astronomy"]},{"l":"III","t":"Engineering and Technology","h":null,"p":["Metals and Metalworking Engineering and Technology: Other Applications"]},{"l":"IV","t":"","h":null,"p":["Town Planning and Architecture Knowledge Framework and Classification Linguistics"]}],"b":["Mahadevan, B., Bhat Vinayak Rajat, Nagendra Pavana R.N. (2022), “Introduction to Indian Knowledge System: Concepts and Applications”, PHI Learning Private Ltd. Delhi. ADDITIONAL READINGS:  Pride of India: A Glimpse into India’s Scientific Heritage, Samskrita Bharati, New Delhi.  Sampad and Vijay (2011). “The Wonder that is Sanskrit”, Sri Aurobindo Society, Puducherry.  Bag, A.K. (1979). Mathematics in Ancient and Medieval India, Chaukhamba Orientalia, New Delhi.  Datta, B. and Singh, A.N. (1962). History of Hindu Mathematics: Parts I and II, Asia Publishing House, Mumbai.  Kak, S.C. (1987). “On Astronomy in Ancient India”, Indian Journal of History of Science, 22(3), pp. 205–221.  Subbarayappa, B.V. and Sarma, K.V. (1985). Indian Astronomy: A Source Book, Nehru Centre, Mumbai.  Bag, A.K. (1997). History of Technology in India, Vol. I, Indian National Science Academy, New Delhi.  Acarya, P.K. (1996). Indian Architecture, Munshiram Manoharlal Publishers, New Delhi.  Banerjea, P. (1916). Public Administration in Ancient India, Macmillan, London.  Kapoor Kapil, Singh Avadhesh (2021). “Indian Knowledge Systems Vol – I & II”, Indian Institute of Advanced Study, Shimla, H.P."]},"IKS 104":{"n":"Indian Knowledge System","c":"Audit","p":"NIL","k":"1 / 2 Lecture, Tutorial, Practical","cr":0,"a":"Continuous assessment through Tutorial classes, Home Assignments, Quizzes, Practical, Viva- Voce, Attendance, Minor Tests and One Major Theory Examination.","o":"","co":["At the end of the course, learners should be able to:","Understand the history, nature and basic philosophy of Indian Knowledge System.","Develop basic understanding of ancient epistemological approaches.","Get an overview of literary and scriptural corpus of ancient India and its education system.","Develop an insight in scientific approaches relevant in contemporary times.","Understand ancient India’s Governance and Public Administration. COURSE LAYOUT"],"u":[{"l":"1","t":"History of Indian Knowledge System Genesis of Bhartiya Knowledge System History of IKS IKS","h":null,"p":["Nature","Philosophy and Character India’s Epistemology Knowledge Frameworks & Classification"]},{"l":"2","t":"","h":null,"p":["Literary Aspects of IKS Ancient Scriptures Ancient Education Educating Sciences Chandashastra (Prosody) Bhasa Va Vyakarana (Language and Grammar) Bharata’s Natyashastra (Science of Drama, Dance and Music) Khagol Vijnana (Astronomy) Vastukala (Architecture) Ayurveda Krishi Vijnana (Agricultural) Practices"]},{"l":"3","t":"Scientific approaches of IKS & Torch-bearers Dhatu Vijnana (Metallurgy) Ganita","h":null,"p":["Mathematics in India Yuddha Vidhya (Military Sciences) Niyuddha Kala (Martial Arts) Environmental Sciences"]},{"l":"4","t":"","h":null,"p":["Governance in IKS & Way Forward Science of Consciousness in Ancient India (Cognitive Science) Anviksiki (Logic and Disputation) Governance & Public Administration IKS way forward"]}],"b":[" Introduction to Indian Knowledge System: Concepts and Applications, Archak, K.B. (2012). Kaveri Books, New Delhi.ISBN-13:978-9391818203  Introduction To Indian Knowledge System: Concepts and Applications, Mahadevan, B.Bhat, Vinayak Rajat,Nagendra Pavana R.N.PHI, ISBN: 9789391818203  Glimpse into Kautilya’s Arthashastra Ramachandrudu P. (2010), Sanskrit Academy, Hyderabad ISBN:9788380171074  “Introduction” in Studies in Epics and Purāṇas, (Eds.), KM Munshi and N Chandrashekara Aiyer Bhartiya Vidya Bhavan"]}};


// ============================================================================
// SECTION: 45_syllabus_ui.js
// Syllabus Tracker preview (dashboard) — merged with The Ledger.
// The old static "Curriculum" table viewer was removed: the dashboard card at
// #syllabusCard is now a live preview of the Ledger (Syllabus Tracker).
// loadSyllabus()/openSyllabusFullView() are kept as backwards-compatible shims
// so any lingering onclick / test hooks route into the Ledger instead of 404ing.
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        // Backwards-compat: old "Curriculum" card called these. Route to Ledger.
        function loadSyllabus() {
            if (typeof renderDashboardLedgerPreview === 'function') {
                renderDashboardLedgerPreview();
            }
            return;
        }

        function openSyllabusFullView() {
            if (typeof toggleLedgerSection === 'function') {
                toggleLedgerSection(true);
            }
            return;
        }

        // Live dashboard preview of the Syllabus Tracker (Ledger).
        // Shows the user's own branch, current semester view, one compact row
        // per course with real progress bars + working checkboxes.
        function renderDashboardLedgerPreview() {
            const host = document.getElementById('dashboardLedgerPreview');
            if (!host) return;
            if (typeof LEDGER_DATA === 'undefined' || !LEDGER_DATA) {
                host.innerHTML = `<div class="syllabus-loading">Syllabus data is loading…</div>`;
                return;
            }
            const branch = (typeof ledgerCurrentBranch !== 'undefined' && LEDGER_DATA[ledgerCurrentBranch])
                ? ledgerCurrentBranch
                : (typeof detectUserBranch === 'function' ? detectUserBranch() : 'civil');
            const bData = LEDGER_DATA[branch];
            if (!bData) {
                host.innerHTML = `<div class="syllabus-loading">Syllabus data not available for this branch.</div>`;
                return;
            }
            const view = (typeof ledgerCurrentView !== 'undefined') ? String(ledgerCurrentView) : '1';
            const subjects = (bData.semesters && bData.semesters[view]) || [];
            if (!subjects.length) {
                host.innerHTML = `<div class="syllabus-loading">Curriculum records are being updated for this semester.</div>`;
                return;
            }
            const roman = (typeof LEDGER_ROMAN !== 'undefined' && LEDGER_ROMAN[Number(view) - 1]) || ('Sem ' + view);
            let doneCount = 0;
            const rows = subjects.slice(0, 6).map(sub => {
                const total = (typeof getLedgerCourseTopicCount === 'function') ? getLedgerCourseTopicCount(sub) : 0;
                const done = (typeof getLedgerCourseTopicsDone === 'function') ? getLedgerCourseTopicsDone(branch, sub) : 0;
                const isDone = (typeof isLedgerCourseDone === 'function') ? isLedgerCourseDone(branch, sub, view) : false;
                if (isDone) doneCount++;
                const pct = total > 0 ? Math.round((done / total) * 100) : (isDone ? 100 : 0);
                const detailHint = sub.d ? ' · unit syllabus available' : '';
                return `
                    <div class="ledger-preview-row ${isDone ? 'row-done' : ''}">
                        <button type="button" class="ledger-cb preview-cb ${isDone ? 'checked' : ''}"
                            onclick="handleLedgerAction('subj', '${view}', '${escapeHtml(sub.code)}')"
                            role="checkbox" aria-checked="${isDone}" aria-label="Mark ${escapeHtml(sub.name)} completed">
                            ${(typeof LEDGER_CHECK_SVG !== 'undefined') ? LEDGER_CHECK_SVG : '✓'}
                        </button>
                        <div class="ledger-preview-main" onclick="toggleLedgerSection(true)" title="Open in Syllabus Tracker">
                            <div class="ledger-preview-title-row">
                                <span class="ledger-course-code sm">${escapeHtml(sub.code)}</span>
                                <span class="ledger-preview-name">${escapeHtml(sub.name)}</span>
                            </div>
                            <div class="ledger-preview-bar"><i style="width:${pct}%"></i></div>
                            <div class="ledger-preview-meta">${done}/${total} topics · ${pct}%${detailHint}</div>
                        </div>
                    </div>`;
            }).join('');
            const extraNote = subjects.length > 6 ? `<div class="ledger-preview-more">+ ${subjects.length - 6} more courses in Sem ${roman}</div>` : '';
            host.innerHTML = `
                <div class="ledger-preview-head">
                    <span class="ledger-preview-branch">${escapeHtml(bData.name)}</span>
                    <span class="ledger-preview-sem">Sem ${roman} · ${doneCount}/${subjects.length} done</span>
                </div>
                <div class="ledger-preview-list">${rows}</div>
                ${extraNote}
                <button class="btn-secondary ledger-preview-open" onclick="toggleLedgerSection(true)">Open full Syllabus Tracker →</button>`;
        }

// ============================================================================
// SECTION: 50_state_toast_holidays_profile.js
// Shared state lets, toast, holidays, profile modal, branch options
// Source: index.html lines 5694-5912 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================


        // ========== STATE ==========
        let currentUser = null;
        let currentUid = null;
        let attendanceCache = {};
        let scheduleCache = null;
        let scheduleView = 'today';
        let signingUp = false;
        let isAdmin = false;
        let adminRequested = false;
        let historyDate = new Date();
        let holidays = new Set();
        let allPosts = [];
        let lastReadPosts = 0;
        let communityPosts = [];

        // Chess club state
        let chessMembers = [];
        let chessEvents = [];
        let chessChallenges = [];
        let chessActivity = [];
        let chessGames = [];
        let chessCurrentTab = 'home';
        let chessMemberStatus = false; // whether current user is a member

        // ========== TOAST ==========
        function showToast(msg, duration = 3000) {
            const el = document.getElementById('toast');
            el.textContent = msg;
            el.classList.add('show');
            clearTimeout(el._timer);
            el._timer = setTimeout(() => el.classList.remove('show'), duration);
        }

        // ========== HOLIDAYS ==========
        async function fetchHolidays() {
            if (!auth.currentUser && !currentUser) return;
            try {
                const snap = await getDocs(holidaysCollection);
                holidays = new Set(snap.docs.map(d => d.data().date));
            } catch (e) {
                console.warn('Failed to fetch holidays:', e);
                holidays = new Set();
            }
        }

        function listenHolidays() {
            return onSnapshot(holidaysCollection, (snap) => {
                holidays = new Set(snap.docs.map(d => d.data().date));
                if (currentUser) {
                    renderSchedule();
                    renderHistoryView();
                    renderAttendanceStats();
                }
            });
        }

        // ========== PROFILE MODAL ==========
        function openProfileModal() {
            if (!currentUser) return;
            const branch = getBranch(currentUser.branchId);
            document.getElementById('profileName').value = currentUser.name;
            document.getElementById('profileUsername').value = currentUser.username;
            document.getElementById('profileBranch').value = branch.name;
            const sel = document.getElementById('profileSection');
            sel.innerHTML = branch.sections.map(s =>
                `<option value="${s}" ${s===currentUser.section?'selected':''}>${s}</option>`).join('');
            document.getElementById('profileHostel').value = currentUser.hostel || 'Day Scholar';
            document.getElementById('profileGender').value = currentUser.gender || 'Not specified';
            const rollField = document.getElementById('profileRollNumber');
            const migField = document.getElementById('profileMigrationStatus');
            if (rollField) rollField.value = currentUser.rollNumber || (currentUser.pendingRollNumber ? currentUser.pendingRollNumber + ' (unverified)' : '—');
            if (migField) migField.value = rollMigrationLabel(currentUser.migrationStatus);
            const linkBtn = document.getElementById('profileLinkRollBtn');
            if (linkBtn) {
                linkBtn.style.display = (currentUser.migrationStatus !== 'verified' && rollMigrationActive(currentUser)) ? 'inline-block' : 'none';
            }
            document.getElementById('profileOldPassword').value = '';
            document.getElementById('profileNewPassword').value = '';
            document.getElementById('profileConfirmPassword').value = '';
            document.getElementById('profileModal').classList.add('open');
        }

        function closeProfileModal() {
            document.getElementById('profileModal').classList.remove('open');
        }

        async function saveProfile() {
            const newSection = document.getElementById('profileSection').value;
            const newHostel = document.getElementById('profileHostel').value;
            const newGender = document.getElementById('profileGender').value;
            if (newSection === currentUser.section && newHostel === currentUser.hostel && newGender === currentUser
                .gender) {
                showToast('No change made.');
                closeProfileModal();
                return;
            }
            try {
                const updates = { section: newSection, hostel: newHostel, gender: newGender };
                await updateDoc(doc(usersCollection, currentUid), updates);
                currentUser.section = newSection;
                currentUser.hostel = newHostel;
                currentUser.gender = newGender;
                const branch = getBranch(currentUser.branchId);
                scheduleCache = buildSchedule(branch, newSection);
                renderSchedule();
                renderHistoryView();
                renderAttendanceStats();
                document.getElementById('pillBranch').textContent = branch.name.replace('B.Tech — ', '') + ' · Sec ' +
                    newSection;
                showToast('Profile updated!');
                closeProfileModal();
            } catch (e) {
                showToast('Error updating profile: ' + e.message);
            }
        }

        // ========== CHANGE PASSWORD ==========
        async function changePassword() {
            const oldPw = document.getElementById('profileOldPassword').value;
            const newPw = document.getElementById('profileNewPassword').value;
            const confirmPw = document.getElementById('profileConfirmPassword').value;
            if (!oldPw) { showToast('Please enter your current password.'); return; }
            if (!newPw || newPw.length < 6) { showToast('New password must be at least 6 characters.'); return; }
            if (newPw !== confirmPw) { showToast('New passwords do not match.'); return; }

            try {
                const user = auth.currentUser;
                if (!user) { showToast('You are not logged in.'); return; }
                const credential = EmailAuthProvider.credential(user.email, oldPw);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPw);
                showToast('Password changed successfully!');
                document.getElementById('profileOldPassword').value = '';
                document.getElementById('profileNewPassword').value = '';
                document.getElementById('profileConfirmPassword').value = '';
                closeProfileModal();
            } catch (e) {
                console.error(e);
                if (e.code === 'auth/wrong-password') {
                    showToast('Incorrect current password.');
                } else if (e.code === 'auth/weak-password') {
                    showToast('New password is too weak. Use at least 6 characters.');
                } else {
                    showToast('Error changing password: ' + e.message);
                }
            }
        }

        // ========== AUTH UI ==========
        function populateBranchOptions() {
            const sel = document.getElementById('suBranch');
            sel.innerHTML = BRANCHES.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
            populateSectionOptions();

            // Old static Curriculum branch/year selects were removed — the
            // dashboard now shows a live Ledger (Syllabus Tracker) preview.
            // Nothing to populate here; preview renders from Ledger state.
        }

        function populateSectionOptions() {
            const branch = getBranch(document.getElementById('suBranch').value);
            const sel = document.getElementById('suSection');
            sel.innerHTML = branch.sections.map(s => `<option value="${s}">Section ${s}</option>`).join('');
        }

        // Login method (retained as safe stub while roll number system is removed)
        let loginMethod = 'user';
        function setLoginMethod(m) {
            loginMethod = 'user';
        }

        function switchAuthTab(which) {
            document.getElementById('tabLogin').classList.toggle('active', which === 'login');
            document.getElementById('tabSignup').classList.toggle('active', which === 'signup');
            document.getElementById('loginForm').style.display = which === 'login' ? 'block' : 'none';
            document.getElementById('signupForm').style.display = which === 'signup' ? 'block' : 'none';
        }

        function showError(id, msg) { const el = document.getElementById(id);
            el.textContent = msg;
            el.style.display = 'block'; }

        function hideError(id) { document.getElementById(id).style.display = 'none'; }


// ============================================================================
// SECTION: 55_auth_core.js
// Signup / Login / Logout / profile loaders / friendlyAuthError
// Source: index.html lines 5913-6160 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        // ========== AUTH ==========
        async function handleSignup() {
            hideError('signupError');
            const nameEl = document.getElementById('suName');
            const name = (nameEl ? nameEl.value : '').trim();
            const username = document.getElementById('suUsername').value.trim().toLowerCase();
            const password = document.getElementById('suPassword').value;
            const branchId = document.getElementById('suBranch').value;
            const section = document.getElementById('suSection').value;
            const hostel = document.getElementById('suHostel').value;
            const gender = document.getElementById('suGender').value;

            if (!name || !username || !password) {
                showError('signupError', 'Fill in your name, username and password.');
                return;
            }
            if (username.length < 3) {
                showError('signupError', 'Username should be at least 3 characters.');
                return;
            }
            if (!/^[a-z0-9._-]+$/.test(username)) {
                showError('signupError', 'Username can only contain letters, numbers, dots, hyphens, and underscores.');
                return;
            }
            if (password.length < 6) {
                showError('signupError', 'Password should be at least 6 characters.');
                return;
            }
            // SECURITY: never self-assign admin. Admins are promoted only via
            // Firestore rules (isAdmin) by an existing admin.

            signingUp = true;

            // ==========================================
            // STEP A: FIREBASE AUTHENTICATION SIGNUP
            // ==========================================
            let credential;
            const email = authEmail(username);
            try {
                credential = await createUserWithEmailAndPassword(auth, email, password);
            } catch (authErr) {
                console.error('Signup Auth Error:\ncode:', authErr?.code, '\nmessage:', authErr?.message);
                signingUp = false;
                showError('signupError', friendlyAuthError(authErr, 'signup'));
                return; // STOP! Never proceed to profile creation if auth fails.
            }

            if (!credential || !credential.user || !credential.user.uid) {
                console.error('Signup Auth Error: No user credential returned.');
                signingUp = false;
                showError('signupError', 'Authentication succeeded but no session was returned. Please try logging in.');
                return; // STOP!
            }

            // ==========================================
            // STEP B: FIRESTORE PROFILE CREATION (ONLY AFTER AUTH SUCCEEDS)
            // ==========================================
            const uid = credential.user.uid;
            const record = {
                name,
                username,
                branchId,
                section,
                hostel,
                gender,
                isAdmin: false,
                adminRequested: false,
                migrationStatus: 'verified',
                rollNumber: '',
                rollNumberVerified: false,
                pendingRollNumber: '',
                migrationReviewReason: '',
                createdAt: Date.now(),
                lastReadPosts: 0
            };

            // STEP 2 Verification: Inspect auth state prior to Firestore profile write
            console.log('Signup Auth verification before Firestore write:', {
                currentUser: auth.currentUser ? {
                    uid: auth.currentUser.uid,
                    email: auth.currentUser.email
                } : null,
                currentUserUid: auth.currentUser ? auth.currentUser.uid : null,
                currentUserEmail: auth.currentUser ? auth.currentUser.email : null,
                docUid: uid,
                isAuthActive: auth.currentUser != null,
                uidMatches: auth.currentUser ? (auth.currentUser.uid === uid) : false
            });

            try {
                await setDoc(doc(usersCollection, uid), record, { merge: true });
                try {
                    await setDoc(doc(attendanceCollection, uid), { attendance: {} });
                } catch (attErr) {
                    console.warn('Initial attendance doc creation skipped:', attErr);
                }
                await loginAs(record, uid);
            } catch (profileErr) {
                console.error('Signup Profile Write Error:\ncode:', profileErr?.code, '\nmessage:', profileErr?.message);
                showError('signupError', friendlyAuthError(profileErr, 'signup'));
            } finally {
                signingUp = false;
            }
        }

        async function handleLogin() {
            hideError('loginError');
            let username = document.getElementById('loginUsername').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value;
            if (!username || !password) {
                showError('loginError', 'Enter your username and password.');
                return;
            }

            // ==========================================
            // STEP 1: FIREBASE AUTHENTICATION LOGIN
            // ==========================================
            let credential;
            const email = authEmail(username);
            try {
                credential = await signInWithEmailAndPassword(auth, email, password);
                console.log('AUTH LOGIN:\nSUCCESS\ncode: auth/success\nmessage: Authentication succeeded for ' + email);
            } catch (authErr) {
                console.error('AUTH LOGIN:\nFAILED\ncode:', authErr?.code, '\nmessage:', authErr?.message);
                showError('loginError', friendlyAuthError(authErr, 'login'));
                return; // STOP! Never proceed if Auth fails.
            }

            if (!credential || !credential.user || !credential.user.uid) {
                console.error('AUTH LOGIN:\nFAILED\ncode: no-credential\nmessage: No user returned');
                showError('loginError', 'Authentication succeeded but no session was returned.');
                return;
            }

            const uid = credential.user.uid;

            // ==========================================
            // STEP 2: FIRESTORE PROFILE RETRIEVAL
            // ==========================================
            let record;
            try {
                record = await loadUserProfile(uid);
                console.log('FIRESTORE PROFILE:\nSUCCESS\ncode: firestore/success\nmessage: Profile loaded for ' + record.username);
            } catch (profileErr) {
                console.error('FIRESTORE PROFILE:\nFAILED\ncode:', profileErr?.code || 'profile-error', '\nmessage:', profileErr?.message);
                showError('loginError', 'Auth succeeded, but profile could not be loaded: ' + (profileErr?.message || profileErr?.code));
                return; // STOP! Do not report as incorrect password.
            }

            // SECURITY: no client-side auto-promotion. Admin rights come only
            // from Firestore (isAdmin) and rules block self-escalation.

            // ==========================================
            // STEP 3: NAVIGATION TO ERP / DASHBOARD
            // ==========================================
            try {
                await loginAs(record, uid);
                console.log('NAVIGATION:\nSUCCESS\nmessage: Dashboard opened successfully');
            } catch (navErr) {
                console.error('NAVIGATION:\nFAILED\ncode:', navErr?.code || 'nav-error', '\nmessage:', navErr?.message);
                showError('loginError', 'Navigation to dashboard failed: ' + (navErr?.message || navErr));
            }
        }

        async function handleLogout() {
            try { await signOut(auth); } catch (e) {}
            currentUser = null;
            currentUid = null;
            attendanceCache = {};
            isAdmin = false;
            adminRequested = false;
            try {
                sessionStorage.removeItem('mmmut_active_view');
                sessionStorage.clear();
            } catch (_) {}
            document.getElementById('app').style.display = 'none';
            document.getElementById('authScreen').style.display = 'flex';
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
            closeAdminPanel();
            closeProfileModal();
            closeMigrationModal();
            closeFeedbackForm();
            closeMyFeedback();
            closeRatingModal();
            closeAdminReplyModal();
            closeCreatePost();
            if (document.getElementById('ledgerAiChat').classList.contains('open')) {
                document.getElementById('ledgerAiChat').classList.remove('open');
            }
            // Close chess club if open
            if (document.getElementById('chessClubView').style.display !== 'none') {
                toggleChessClub(false);
            }
            // Close Telegram section if open
            if (document.getElementById('telegramView') && document.getElementById('telegramView').style.display !== 'none') {
                toggleTelegramSection(false);
            }
            // Close Ledger section if open
            if (document.getElementById('ledgerView') && document.getElementById('ledgerView').style.display !== 'none') {
                toggleLedgerSection(false);
            }
            if (typeof setupTelegramAppListener === 'function') {
                setupTelegramAppListener(null);
            }
            // Stop using this user's push-notification token context. Does NOT
            // delete their Firestore token document or alter authentication.
            updatePushButtonUI();
            const sidebarAdminBtn = document.getElementById('sidebarAdminBtn');
            if (sidebarAdminBtn) sidebarAdminBtn.style.display = 'none';
        }

        async function loadUserProfile(uid) {
            const snap = await getDoc(doc(usersCollection, uid));
            if (!snap.exists()) {
                const u = auth.currentUser;
                if (u && u.uid === uid) {
                    const fallbackUsername = (u.email || '').replace('@mmmut.local', '').toLowerCase() || 'student';
                    console.warn('Profile doc users/' + uid + ' missing in Firestore. Creating fallback profile for', fallbackUsername);
                    const fallbackRecord = {
                        name: fallbackUsername,
                        username: fallbackUsername,
                        branchId: 'cse',
                        section: 'A',
                        hostel: 'Day Scholar',
                        gender: 'Not specified',
                        isAdmin: false,
                        adminRequested: false,
                        migrationStatus: 'verified',
                        rollNumber: '',
                        rollNumberVerified: false,
                        pendingRollNumber: '',
                        migrationReviewReason: '',
                        createdAt: Date.now(),
                        lastReadPosts: 0
                    };
                    try {
                        await setDoc(doc(usersCollection, uid), fallbackRecord, { merge: true });
                        return fallbackRecord;
                    } catch (healErr) {
                        console.error('Failed to create fallback profile doc:', healErr);
                    }
                }
                throw new Error('missing-profile');
            }
            const data = snap.data();
            return {
                name: data.name || data.username || 'Student',
                username: data.username || '',
                branchId: data.branchId || 'cse',
                section: data.section || 'A',
                hostel: data.hostel || 'Day Scholar',
                gender: data.gender || 'Not specified',
                isAdmin: data.isAdmin || false,
                adminRequested: data.adminRequested || false,
                migrationStatus: data.migrationStatus || 'verified',
                rollNumber: data.rollNumber || '',
                rollNumberVerified: !!data.rollNumberVerified,
                pendingRollNumber: data.pendingRollNumber || '',
                migrationReviewReason: data.migrationReviewReason || '',
                createdAt: data.createdAt || 0,
                lastReadPosts: data.lastReadPosts || 0
            };
        }

        async function loadAttendanceMap(uid) {
            const ref = doc(attendanceCollection, uid);
            const snap = await getDoc(ref);
            if (!snap.exists()) { await setDoc(ref, { attendance: {} }); return {}; }
            const data = snap.data();
            return data.attendance || {};
        }

        function friendlyAuthError(error, mode) {
            const code = error && error.code ? error.code : '';
            if (code === 'auth/email-already-in-use') return 'That username is already taken.';
            if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') return 'Incorrect username or password.';
            if (code === 'auth/user-not-found') return 'No account with that username. Try signing up.';
            if (code === 'auth/weak-password') return 'Password should be at least 6 characters.';
            if (code === 'auth/operation-not-allowed') return 'Email/password sign up is not enabled in Firebase Authentication.';
            if (code === 'auth/unauthorized-domain') return 'This domain is not authorized in Firebase Authentication settings.';
            if (code === 'auth/network-request-failed') return 'Network error. Check your connection and try again.';
            if (code === 'permission-denied') return 'Firebase saved the account, but Firestore rules blocked the profile.';
            if (code) return (mode === 'signup' ? 'Signup failed: ' : 'Login failed: ') + code;
            return mode === 'signup' ? 'Something went wrong creating your account.' :
                'Could not log in — please try again.';
        }

// ============================================================================
// SECTION: 60_session_loginAs.js
// loginAs() session starter wiring all listeners + gates
// Source: index.html lines 6161-6349 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================


        // ========== LOGIN AS ==========
        async function loginAs(record, uid) {
            currentUid = uid;
            try {
                attendanceCache = await loadAttendanceMap(uid);
            } catch (attErr) {
                console.warn('loadAttendanceMap non-fatal error:', attErr);
                attendanceCache = {};
            }
            currentUser = record;
            isAdmin = record.isAdmin || false;
            adminRequested = record.adminRequested || false;
            lastReadPosts = record.lastReadPosts || 0;

            const ls = document.getElementById('loadingScreen');
            if (ls) ls.style.display = 'none';
            document.getElementById('authScreen').style.display = 'none';
            rollGateLocked = false;
            document.getElementById('app').style.display = 'block';

            const branch = getBranch(record.branchId) || BRANCHES[0];
            document.getElementById('pillName').textContent = record.name || record.username || 'Student';
            document.getElementById('pillBranch').textContent = (branch ? branch.name.replace('B.Tech — ', '') : 'B.Tech') + ' · Sec ' + (record.section || 'A');
            document.getElementById('pillAvatar').textContent = (record.name || record.username || 'ST').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

            const topRight = document.querySelector('.topbar-right');
            const existing = topRight.querySelector('.btn-admin, .btn-request-admin');
            if (existing) existing.remove();

            const btn = document.createElement('button');
            if (isAdmin) {
                btn.className = 'btn-admin';
                btn.textContent = '⚙️ Admin';
                btn.onclick = () => openAdminPanel();
            } else if (!adminRequested) {
                btn.className = 'btn-request-admin';
                btn.textContent = '👤 Request Admin';
                btn.onclick = () => requestAdminRole();
            } else {
                btn.className = 'btn-request-admin';
                btn.textContent = '⏳ Request Pending';
                btn.disabled = true;
                btn.style.opacity = '0.6';
            }
            if (topRight) {
                const userMenuContainer = document.getElementById('userMenuContainer');
                if (userMenuContainer) {
                    topRight.insertBefore(btn, userMenuContainer);
                } else {
                    topRight.appendChild(btn);
                }
            }

            // Show/hide sidebar Admin Panel button based on admin status
            const sidebarAdminBtn = document.getElementById('sidebarAdminBtn');
            if (sidebarAdminBtn) {
                sidebarAdminBtn.style.display = isAdmin ? 'flex' : 'none';
            }

            const dropdownAdminLabel = document.getElementById('dropdownAdminLabel');
            const dropdownAdminIcon = document.getElementById('dropdownAdminIcon');
            if (dropdownAdminLabel) {
                if (isAdmin) {
                    dropdownAdminLabel.textContent = 'Admin Panel';
                    if (dropdownAdminIcon) dropdownAdminIcon.textContent = '🛡️';
                } else if (!adminRequested) {
                    dropdownAdminLabel.textContent = 'Request Admin Role';
                    if (dropdownAdminIcon) dropdownAdminIcon.textContent = '👤';
                } else {
                    dropdownAdminLabel.textContent = 'Admin Request Pending';
                    if (dropdownAdminIcon) dropdownAdminIcon.textContent = '⏳';
                }
            }

            scheduleCache = buildSchedule(branch, record.section);
            renderTopbarDate();
            renderSchedule();
            renderEvents();
            await renderAttendanceStats();
            renderPostsFeed();
            historyDate = new Date();
            renderHistoryView();

            // Curriculum viewer merged into Syllabus Tracker — refresh the
            // dashboard preview instead of the removed static table.
            if (typeof renderDashboardLedgerPreview === 'function') {
                try { renderDashboardLedgerPreview(); } catch (_) {}
            }

            if (window._holidaysUnsub) window._holidaysUnsub();
            window._holidaysUnsub = listenHolidays();

            if (typeof setupTelegramAppListener === 'function') {
                setupTelegramAppListener(record.uid || currentUid);
            }

            if (window._postsUnsub) window._postsUnsub();
            window._postsUnsub = onSnapshot(query(postsCollection, orderBy('createdAt', 'desc')), (snap) => {
                allPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                updateNotificationBadge();
                if (document.getElementById('postsFeedContent')) {
                    renderPostsFeed();
                }
            });

            if (window._communityPostsUnsub) window._communityPostsUnsub();
            window._communityPostsUnsub = onSnapshot(
                query(communityPostsCollection, orderBy('createdAt', 'desc')),
                (snap) => {
                    communityPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    renderCommunityPosts();
                    const newBtn = document.getElementById('cpNewPostBtn');
                    if (newBtn) {
                        newBtn.style.display = isAdmin ? 'inline-flex' : 'none';
                    }
                }
            );

            if (window._feedbackUnsub) window._feedbackUnsub();
            window._feedbackUnsub = onSnapshot(
                query(feedbackCollection, where('uid', '==', currentUid), orderBy('createdAt', 'desc')),
                (snap) => {
                    if (document.getElementById('feedbackPreviewContent')) {
                        renderFeedbackPreview();
                    }
                    snap.docChanges().forEach(change => {
                        if (change.type === 'modified') {
                            const data = change.doc.data();
                            if (data.adminReply && data.adminReply !== data._prevReply) {
                                showToast('💬 Your feedback has received a reply.');
                            }
                            data._prevReply = data.adminReply;
                        }
                    });
                }
            );

            if (currentUid) {
                const unsub = onSnapshot(doc(usersCollection, currentUid), (snap) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        isAdmin = data.isAdmin || false;
                        adminRequested = data.adminRequested || false;
                        if (data.lastReadPosts !== undefined) lastReadPosts = data.lastReadPosts;
                        updateNotificationBadge();
                        const btn2 = document.querySelector(
                        '.topbar-right .btn-admin, .topbar-right .btn-request-admin');
                        if (btn2) btn2.remove();
                        const b = document.createElement('button');
                        if (isAdmin) {
                            b.className = 'btn-admin';
                            b.textContent = '⚙️ Admin';
                            b.onclick = () => openAdminPanel();
                        } else if (!adminRequested) {
                            b.className = 'btn-request-admin';
                            b.textContent = '👤 Request Admin';
                            b.onclick = () => requestAdminRole();
                        } else {
                            b.className = 'btn-request-admin';
                            b.textContent = '⏳ Request Pending';
                            b.disabled = true;
                            b.style.opacity = '0.6';
                        }
                        const tr = document.querySelector('.topbar-right');
                        if (tr) {
                            const userMenuContainer = document.getElementById('userMenuContainer');
                            if (userMenuContainer) {
                                tr.insertBefore(b, userMenuContainer);
                            } else {
                                tr.appendChild(b);
                            }
                        }
                        const sidebarAdminBtn2 = document.getElementById('sidebarAdminBtn');
                        if (sidebarAdminBtn2) {
                            sidebarAdminBtn2.style.display = isAdmin ? 'flex' : 'none';
                        }
                        const dropdownAdminLabel2 = document.getElementById('dropdownAdminLabel');
                        const dropdownAdminIcon2 = document.getElementById('dropdownAdminIcon');
                        if (dropdownAdminLabel2) {
                            if (isAdmin) {
                                dropdownAdminLabel2.textContent = 'Admin Panel';
                                if (dropdownAdminIcon2) dropdownAdminIcon2.textContent = '🛡️';
                            } else if (!adminRequested) {
                                dropdownAdminLabel2.textContent = 'Request Admin Role';
                                if (dropdownAdminIcon2) dropdownAdminIcon2.textContent = '👤';
                            } else {
                                dropdownAdminLabel2.textContent = 'Admin Request Pending';
                                if (dropdownAdminIcon2) dropdownAdminIcon2.textContent = '⏳';
                            }
                        }
                        const newBtn = document.getElementById('cpNewPostBtn');
                        if (newBtn) {
                            newBtn.style.display = isAdmin ? 'inline-flex' : 'none';
                        }
                    }
                });
                window._adminUnsub = unsub;
            }

            setTimeout(updateNotificationBadge, 500);
            renderFeedbackPreview();
            loadExistingRating();
            renderCommunityPosts();
            // Initialize chess club if not already
            initChessClub();

            // Initialize push notifications (additive, non-blocking, never prompts
            // automatically — see PART 4/9). Runs after auth is fully established.
            updatePushButtonUI();
            initializePushNotifications().catch(e => console.warn('Push init skipped:', e));
            rollGateLocked = false;
        }

        // ========== ROLL-NUMBER VERIFICATION — CORE (hard-gate, additive) ==========
        // Safety rules enforced below:
        //   * roll numbers come ONLY from studentRoster (admin-imported CSV).
        //   * a roll number is linked exactly once (create-only userRolls doc).
        //   * existing users/{uid} docs are merged (updateDoc) — never replaced.
        //   * Firebase UIDs, emails, passwords and attendance are untouched.
        //   * UNVERIFIED accounts are HARD-GATED: the app stays hidden behind the
        //     verification modal until the roll number is verified — no feature is
        //     usable first, and the gate cannot be dismissed.
        //   * the full name is NEVER asked — it is auto-assigned from the roster.
        //   * verified users keep working with their normal username/password login.

// ============================================================================
// SECTION: 65_roll_verification.js
// Roll-number hard gate, claim, finalize (roll-login core)
// Source: index.html lines 6350-6646 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        function rollMigrationActive(user) {
            return false;
        }

        function rollMigrationLog(...args) {
            if (ROLL_MIGRATION_ENABLED && ROLL_MIGRATION_DEBUG) {
                try {
                    console.debug('[roll-mig]', ...args);
                } catch (e) { /* ignore */ }
            }
        }

        function normalizeUserName(s) {
            return String(s || '').toUpperCase().replace(/[^A-Z]/g, ' ').replace(/\s+/g, ' ').trim();
        }

        function normalizeRollInput(raw) {
            return String(raw || '').trim().replace(/\s+/g, '');
        }

        function rollMigrationLabel(status) {
            const map = {
                pending: 'Pending — roll not linked',
                verified: 'Verified',
                rejected: 'Rejected',
                manual_review: 'Manual review'
            };
            return map[status] || String(status || 'pending');
        }

        function renderMigrationStatus() {
            const el = document.getElementById('migrationStatus');
            if (!el || !currentUser) return;
            if (currentUser.migrationStatus === 'verified' && currentUser.rollNumber) {
                el.innerHTML = '<div style="color:var(--moss);font-weight:600;">✓ Roll number verified: <span class="mono">' +
                    escapeHtml(currentUser.rollNumber) + '</span></div>';
            } else {
                const extra = currentUser.migrationReviewReason ? ' — ' + escapeHtml(currentUser.migrationReviewReason) : '';
                el.innerHTML = '<div style="color:var(--ink-soft);">' + rollMigrationLabel(currentUser.migrationStatus) + extra + '.</div>';
            }
        }

        // HARD-GATE STATE — disabled
        let rollGateLocked = false;

        const ROSTER_BRANCH_TO_ID = {
            'CED': 'civil',
            'CSD': 'cse',
            'EED': 'ee',
            'ECD': 'ece',
            'IOT': 'eceiot',
            'MED': 'me',
            'CHD': 'chemical',
            'ITC': 'it',
        };
        function rosterBranchToId(branchName) {
            return ROSTER_BRANCH_TO_ID[String(branchName || '').trim().toUpperCase()] || 'civil';
        }

        function rollGateActive(user) {
            return false;
        }

        function enforceRollGate() {
            rollGateLocked = false;
            const app = document.getElementById('app');
            const modal = document.getElementById('migrationModal');
            if (app) app.style.display = 'block';
            if (modal) modal.classList.remove('open');
        }

        function openMigrationModal() {
            // Disabled while roll number system is removed
            return;
        }

        function closeMigrationModal() {
            rollGateLocked = false;
            const modal = document.getElementById('migrationModal');
            if (modal) modal.classList.remove('open');
        }

        async function setMigrationState(status, roll, reason) {
            const patch = { migrationStatus: status };
            if (status === 'verified') {
                patch.rollNumber = roll;
                patch.rollNumberVerified = true;
                patch.rollClaimedAt = serverTimestamp();
                patch.pendingRollNumber = '';
                patch.migrationReviewReason = '';
            } else {
                if (roll) patch.pendingRollNumber = roll;
                if (reason) patch.migrationReviewReason = reason;
            }
            await updateDoc(doc(usersCollection, currentUid), patch);
            currentUser.migrationStatus = status;
            if (status === 'verified') {
                currentUser.rollNumber = roll;
                currentUser.rollNumberVerified = true;
                currentUser.pendingRollNumber = '';
                currentUser.migrationReviewReason = '';
            } else {
                if (roll) currentUser.pendingRollNumber = roll;
                if (reason) currentUser.migrationReviewReason = reason;
            }
            rollMigrationLog('state', { uid: currentUid, status, roll, reason });
        }

        function evaluateRollClaim(profile, rosterEntry) {
            if (!rosterEntry) return { verdict: 'notfound', reasons: ['not-in-roster'] };
            const reasons = [];
            const isAdmin = !!(profile && profile.isAdmin);
            const pName = normalizeUserName(profile ? profile.name : '');
            const rName = normalizeUserName(rosterEntry.applicantName || rosterEntry.formalName || '');
            const nameMismatch = !pName || !rName || pName !== rName;
            // Admins may self-verify a roster roll even when the profile name does
            // not exactly match the roster applicantName (e.g. the MMMUT admin
            // 'tanish' — whose full name is not present in the admission CSV).
            if (nameMismatch && !isAdmin) reasons.push('name-mismatch');
            else if (nameMismatch && isAdmin) rollMigrationLog('admin name override', { roll: rosterEntry.rollNumber });
            const branch = String(rosterEntry.branchName ||
                (rosterEntry.enrollmentNo || '').slice(4, 7) || '').toUpperCase();
            // Map ANY roster branch via the authoritative table (was hardcoded to
            // CED/CSD only, producing 'unknown-branch' for the other six branches
            // in the legacy admin-override path — now consistent with verify()).
            const mapped = rosterBranchToId(
                rosterEntry.branchName || (rosterEntry.enrollmentNo || '').slice(4, 7) || branch);
            if (String(profile ? profile.branchId : '').toLowerCase() !== mapped) {
                if (!isAdmin) reasons.push('branch-mismatch');
                else rollMigrationLog('admin branch override', { roll: rosterEntry.rollNumber, mapped });
            }
            return reasons.length === 0
                ? { verdict: 'ok', reasons, branch }
                : { verdict: 'manual-review', reasons, branch };
        }

        async function verifyRollNumber() {
            const err = document.getElementById('migrationError');
            const fail = (msg) => { if (err) { err.textContent = msg; err.style.display = 'block'; } };
            if (err) err.style.display = 'none';
            if (!currentUser) { fail('You are not logged in.'); return; }
            if (!rollMigrationActive(currentUser)) { fail('Roll-number verification is not enabled for this session yet.'); return; }
            const input = document.getElementById('migrationRollInput');
            const raw = normalizeRollInput(input ? input.value : '');
            if (!raw) return fail('Enter your roll number.');
            if (!ROLL_NUMBER_PATTERN.test(raw)) return fail('That does not look like a 10-digit roll number (e.g. 2026011001).');

            rollMigrationLog('verify start', { uid: currentUid, roll: raw });

            // ===== DIAGNOSTICS (temporary, safe fields only — never credentials) =====
            const diag = {
                roll: raw,
                fsResult: 'not-attempted',     // hit | miss | error:<code>
                backendAttempted: false,
                backendResult: 'not-attempted',// hit | miss | unavailable | disabled
                decision: ''
            };
            const diagDecision = (reason) => {
                diag.decision = reason;
                rollMigrationLog('verify decision', diag);
            };

            let rosterEntry = null;
            try {
                const snap = await getDoc(doc(studentRosterCollection, raw));
                rosterEntry = snap.exists() ? snap.data() : null;
                diag.fsResult = rosterEntry ? 'hit' : 'miss';
            } catch (e) {
                diag.fsResult = 'error:' + ((e && e.code) || 'unknown');
                rollMigrationLog('roster read error', e && e.code);
            }
            // FIX (D2): backend API mirror of admission_data.csv — keeps verification
            // working when the studentRoster read fails or the doc is missing
            // (e.g. stale partial import / rules / CDN / App Check hiccups).
            if (!rosterEntry) {
                diag.backendAttempted = true;
                if (typeof apiFetchRoster !== 'function') {
                    diag.backendResult = 'disabled';
                } else {
                    const apiRec = await apiFetchRoster(raw);
                    if (apiRec && apiRec.applicantName) {
                        rosterEntry = apiRec;
                        diag.backendResult = 'hit';
                        rollMigrationLog('roster resolved via backend API', { roll: raw });
                    } else {
                        // apiService returns null both for "backend not configured"
                        // and for genuine misses; distinguish via its base URL.
                        diag.backendResult =
                            (localStorage.getItem('mmmut_api_base') || '') ? 'miss' : 'unconfigured';
                    }
                }
            }
            if (!rosterEntry) {
                fail('That roll number was not found in the B.Tech 2026–27 admission roster. Only published roll numbers can be verified.');
                diagDecision('rejected:not-in-roster');
                return;
            }

            // The applicant's NAME IS AUTO-ASSIGNED from the roll number data, and
            // the branch is derived the same way (CED -> civil, CSD -> cse) — so no
            // name/branch mismatch can stall a legitimate claim.
            const rosterName = (rosterEntry.applicantName || rosterEntry.formalName || '').trim();
            if (!rosterName) {
                fail('The admission roster entry for this roll number has no applicant name. Contact an administrator.');
                return;
            }
            const mappedBranch = rosterBranchToId(rosterEntry.branchName || (rosterEntry.enrollmentNo || '').slice(4, 7));
            const rosterSection = String(rosterEntry.section || '').trim().toUpperCase();

            let claim = null;
            try {
                const cSnap = await getDoc(doc(userRollsCollection, raw));
                claim = cSnap.exists() ? cSnap.data() : null;
                diag.claimRead = claim ? 'hit' : 'miss';
            } catch (e) {
                diag.claimRead = 'error:' + ((e && e.code) || 'unknown');
                rollMigrationLog('claim read failed', e && e.code);
            }
            if (claim) {
                if (claim.uid === currentUid && claim.rollNumber === raw) {
                    await finalizeRollVerification(raw, rosterName, mappedBranch, rosterSection);
                    showToast('✓ Roll number verified: ' + raw);
                    diagDecision('verified:already-own-claim');
                    return;
                }
                fail('This roll number is already linked to a different account. Contact an administrator if you believe this is an error.');
                await setMigrationState('rejected', raw, 'already-claimed');
                renderMigrationStatus();
                diagDecision('rejected:already-claimed-by-other');
                return;
            }

            try {
                await setDoc(doc(userRollsCollection, raw), {
                    uid: currentUid,
                    username: currentUser.username || '',
                    rollNumber: raw,
                    verifiedAt: serverTimestamp()
                }, { merge: false });
            } catch (e) {
                // FIX (D1): a failed claim write is NOT always a race. If the real
                // cause is a missing rule (permission-denied) we must NOT flag the
                // account for manual_review — the user stays pending and gets an
                // actionable message instead of being stuck with a wrong status.
                const code = e && e.code;
                if (code === 'permission-denied') {
                    rollMigrationLog('claim write permission-denied', { roll: raw });
                    fail('Verification could not be saved: Firestore refused the write to "userRolls". The admin needs to publish the staged rules from firestore_rules_append.txt. Your account is NOT marked as rejected — please try again after the rules are live.');
                    diagDecision('blocked:permission-denied-on-claim-write');
                    return;
                }
                rollMigrationLog('claim write failed', { roll: raw, code: code || String(e) });
                if (code !== 'already-exists') {
                    // Unknown failure — surface it honestly, keep the user pending.
                    fail('Verification could not be saved right now (' + (code || 'network error') + '). Your account is unchanged — please try again.');
                    diagDecision('error:claim-write-' + (code || 'network'));
                    return;
                }
                fail('This roll number was claimed by another account at the same moment. It has been flagged for manual review.');
                await setMigrationState('manual_review', raw, 'claim-race');
                renderMigrationStatus();
                diagDecision('manual-review:claim-race');
                return;
            }

            await finalizeRollVerification(raw, rosterName, mappedBranch, rosterSection);
            showToast('✓ Roll number verified: ' + raw);
            diagDecision('verified:new-claim-created');
        }

        // Marks the roll as verified AND adopts the roster identity (name + branch)
        // into the user's profile, then unlocks the whole app.
        async function finalizeRollVerification(raw, rosterName, mappedBranch, rosterSection) {
            const wasBranch = currentUser.branchId;
            const wasSection = currentUser.section;
            // Adopt the roster's exact section when it is valid for this branch.
            const validVerifySections = ((getBranch(mappedBranch) || {}).sections) || [];
            const finalSection = (rosterSection && validVerifySections.includes(rosterSection))
                ? rosterSection : (wasSection || validVerifySections[0] || '');
            await updateDoc(doc(usersCollection, currentUid), {
                name: rosterName,
                branchId: mappedBranch,
                section: finalSection,
                migrationStatus: 'verified',
                rollNumber: raw,
                rollNumberVerified: true,
                pendingRollNumber: '',
                migrationReviewReason: '',
                rollClaimedAt: serverTimestamp()
            });
            currentUser.name = rosterName;
            currentUser.branchId = mappedBranch;
            currentUser.section = finalSection;
            currentUser.migrationStatus = 'verified';
            currentUser.rollNumber = raw;
            currentUser.rollNumberVerified = true;
            currentUser.pendingRollNumber = '';
            currentUser.migrationReviewReason = '';

            // Reflect the roster-assigned identity in the top bar + schedule.
            const branch = getBranch(mappedBranch);
            if (branch) {
                document.getElementById('pillName').textContent = rosterName;
                document.getElementById('pillAvatar').textContent =
                    rosterName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                document.getElementById('pillBranch').textContent =
                    branch.name.replace('B.Tech — ', '') + ' · Sec ' + (currentUser.section || '');
                if (wasBranch !== mappedBranch || wasSection !== finalSection) {
                    scheduleCache = buildSchedule(branch, currentUser.section);
                    renderSchedule();
                    renderHistoryView();
                    renderAttendanceStats();
                }
            }

            // UNLOCK THE APP — verification is the only key.
            rollGateLocked = false;
            const app = document.getElementById('app');
            if (app) app.style.display = 'block';
            closeMigrationModal();
            renderMigrationStatus();
            rollMigrationLog('verified', { uid: currentUid, roll: raw, name: rosterName });
        }


// ============================================================================
// SECTION: 70_notif_badge_admin_request.js
// Notification badge, posts-read, admin role request, admin roll-verify tab
// Source: index.html lines 6647-6864 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        // ========== NOTIFICATION ==========
        function updateNotificationBadge() {
            const badge = document.getElementById('notifBadge');
            if (!badge) return;
            const unread = allPosts.filter(p => {
                const ts = p.createdAt?.seconds || 0;
                return ts > lastReadPosts;
            }).length;
            if (unread > 0) {
                badge.style.display = 'inline';
                badge.textContent = unread > 99 ? '99+' : unread;
            } else {
                badge.style.display = 'none';
            }
        }

        async function markPostsRead() {
            if (!currentUid) return;
            const now = Date.now() / 1000;
            try {
                await updateDoc(doc(usersCollection, currentUid), { lastReadPosts: now });
                lastReadPosts = now;
                updateNotificationBadge();
            } catch (e) {}
        }

        function scrollToPosts() {
            const card = document.getElementById('postsTopCard');
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(markPostsRead, 1000);
            }
        }

        // ========== REQUEST ADMIN ==========
        async function requestAdminRole() {
            if (!currentUid || !currentUser) { showToast('Please log in first.'); return; }
            if (adminRequested) { showToast('You already have a pending request.'); return; }
            if (isAdmin) { showToast('You are already an admin.'); return; }
            try {
                const q = query(adminRequestsCollection, where('uid', '==', currentUid));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const existing = snap.docs[0].data();
                    if (existing.status === 'pending') {
                        adminRequested = true;
                        await updateDoc(doc(usersCollection, currentUid), { adminRequested: true });
                        showToast('Your request is already pending.');
                        return;
                    } else if (existing.status === 'approved') {
                        showToast('You are already an admin.');
                        return;
                    } else if (existing.status === 'rejected') {
                        await deleteDoc(doc(adminRequestsCollection, snap.docs[0].id));
                    }
                }
                await addDoc(adminRequestsCollection, {
                    uid: currentUid,
                    username: currentUser.username,
                    name: currentUser.name,
                    branchId: currentUser.branchId,
                    section: currentUser.section,
                    status: 'pending',
                    requestedAt: serverTimestamp()
                });
                await updateDoc(doc(usersCollection, currentUid), { adminRequested: true });
                adminRequested = true;
                showToast('Admin request sent! Waiting for approval.');
                const btn = document.querySelector('.topbar-right .btn-request-admin');
                if (btn) { btn.textContent = '⏳ Request Pending';
                    btn.disabled = true;
                    btn.style.opacity = '0.6'; }
            } catch (e) {
                console.error(e);
                showToast('Failed to send request: ' + e.message);
            }
        }

        // ========== ADMIN: ROLL VERIFICATION (uses the EXISTING isAdmin system) ==========
        async function renderAdminRollVerify() {
            const el = document.getElementById('adminRollVerifyContent');
            if (!el) return;
            try {
                const userSnap = await getDocs(usersCollection);
                const users = userSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const needReview = users.filter(u => (u.migrationStatus || 'pending') !== 'verified' || (u.pendingRollNumber));
                let html = '<div style="font-size:13px;color:var(--ink-soft);margin-bottom:14px;">' +
                    'Students whose roll-number link is pending / in manual review / rejected. Approve only after checking the roster.</div>';
                if (!needReview.length) {
                    html += '<div class="empty-note">No pending roll number links. 🎉</div>';
                } else {
                    html += '<div style="overflow-x:auto;max-height:520px;overflow-y:auto;">' +
                        '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
                        '<thead style="background:var(--ink);color:#F1ECDD;position:sticky;top:0;">' +
                        '<tr><th style="padding:9px 8px;text-align:left;">Name</th>' +
                        '<th style="padding:9px 8px;text-align:left;">Username</th>' +
                        '<th style="padding:9px 8px;text-align:left;">Roll entered</th>' +
                        '<th style="padding:9px 8px;text-align:left;">Status</th>' +
                        '<th style="padding:9px 8px;text-align:left;">Actions</th></tr></thead><tbody>';
                    needReview.forEach(u => {
                        const roll = u.rollNumber || u.pendingRollNumber || '';
                        const safeUid = String(u.id || '').replace(/[^A-Za-z0-9_-]/g, '');
                        const safeRoll = String(roll || '').replace(/[^0-9]/g, '').slice(0, 12);
                        const safeUsername = escapeHtml(u.username || '');
                        const reasons = u.migrationReviewReason ? ' <small style="color:var(--brick);">(' + escapeHtml(u.migrationReviewReason) + ')</small>' : '';
                        const actions = (u.migrationStatus === 'verified')
                            ? '<span style="color:var(--moss);">✓ verified</span>'
                            : '<button class="btn-primary" style="margin:0 4px 0 0;padding:5px 10px;font-size:12px;" data-roll-act="approve" data-uid="' + safeUid + '" data-username="' + safeUsername + '" data-roll="' + safeRoll + '">Approve</button>' +
                              '<button class="btn-secondary" style="margin:0 4px 0 0;padding:5px 10px;font-size:12px;" data-roll-act="reject" data-uid="' + safeUid + '" data-roll="' + safeRoll + '">Reject</button>' +
                              '<button class="btn-secondary" style="margin:0;padding:5px 10px;font-size:12px;" data-roll-act="review" data-uid="' + safeUid + '">Review</button>';
                        html += '<tr style="border-bottom:1px solid var(--paper-line);">' +
                            '<td style="padding:8px;">' + escapeHtml(u.name || '—') + '</td>' +
                            '<td style="padding:8px;" class="mono">' + escapeHtml(u.username || '—') + '</td>' +
                            '<td style="padding:8px;" class="mono">' + (roll ? escapeHtml(roll) : '—') + '</td>' +
                            '<td style="padding:8px;">' + rollMigrationLabel(u.migrationStatus) + reasons + '</td>' +
                            '<td style="padding:8px;white-space:nowrap;">' + actions + '</td></tr>';
                    });
                    html += '</tbody></table></div>';
                }
                html += '<hr style="border:none;border-top:1px solid var(--paper-line);margin:18px 0;" />' +
                    '<div style="max-width:480px;">' +
                    '<label style="font-weight:600;font-size:13px;">Look up a roll number (roster + current claim)</label>' +
                    '<div style="display:flex;gap:8px;margin-top:8px;">' +
                    '<input id="adminRollLookupInput" placeholder="2026011001" maxlength="12" style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid var(--paper-line);font-size:13px;" />' +
                    '<button class="btn-primary" style="margin:0;padding:8px 18px;" id="adminRollLookupBtn">Look up</button>' +
                    '</div><div id="adminRollLookupResult" style="margin-top:10px;font-size:13px;line-height:1.6;"></div></div>';
                el.innerHTML = html;
                el.querySelectorAll('button[data-roll-act]').forEach(b => {
                    b.addEventListener('click', () => {
                        const uid = b.dataset.uid, roll = b.dataset.roll;
                        if (b.dataset.rollAct === 'approve') adminApproveRoll(uid, b.dataset.username || '', roll);
                        else if (b.dataset.rollAct === 'reject') adminRejectRoll(uid, roll);
                        else adminManualRoll(uid);
                    });
                });
                const lookupBtn = el.querySelector('#adminRollLookupBtn');
                if (lookupBtn) lookupBtn.addEventListener('click', adminRollLookup);
            } catch (e) {
                el.innerHTML = '<div class="empty-note">Error loading roll verification: ' + escapeHtml(e.message) + '</div>';
            }
        }

        function escapeHtml(s) {
            return String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[ch]));
        }

        async function adminRollLookup() {
            const roll = normalizeRollInput(document.getElementById('adminRollLookupInput').value);
            const out = document.getElementById('adminRollLookupResult');
            if (!out) return;
            if (!ROLL_NUMBER_PATTERN.test(roll)) { out.innerHTML = 'Enter a 10-digit roll number.'; return; }
            let html = '';
            const rSnap = await getDoc(doc(studentRosterCollection, roll)).catch(() => null);
            if (rSnap && rSnap.exists()) {
                const r = rSnap.data();
                html += '• Roster: <b>' + escapeHtml(r.formalName || r.applicantName) + '</b> — ' +
                    escapeHtml(r.enrollmentNo || '') + ' (' + escapeHtml(r.branchName || '?') + ')<br/>';
            } else {
                html += '• Not present in the import roster.<br/>';
            }
            const cSnap = await getDoc(doc(userRollsCollection, roll)).catch(() => null);
            if (cSnap && cSnap.exists()) {
                const c = cSnap.data();
                html += '• Claimed by uid <span class="mono">' + escapeHtml(c.uid || '?') + '</span> (' +
                    escapeHtml(c.username || '') + ').<br/>';
            } else {
                html += '• Not claimed by anyone yet.<br/>';
            }
            out.innerHTML = html;
        }

        async function adminApproveRoll(uid, username, roll) {
            roll = normalizeRollInput(roll || '');
            if (!roll) { showToast('No roll number entered for this user yet.'); return; }
            if (!window.confirm('Approve linking roll ' + roll + ' to this EXISTING account? This only merges fields — it never deletes Firebase users, changes UIDs, emails or passwords.')) return;
            const claim = await getDoc(doc(userRollsCollection, roll)).catch(() => null);
            if (claim && claim.exists() && claim.data().uid !== uid) {
                showToast('Refusing: roll ' + roll + ' is already linked to another uid (' + claim.data().uid + ').');
                return;
            }
            try {
                if (!claim || !claim.exists()) {
                    await setDoc(doc(userRollsCollection, roll), {
                        uid,
                        username: username || '',
                        rollNumber: roll,
                        verifiedAt: serverTimestamp()
                    }, { merge: false });
                }
                await updateDoc(doc(usersCollection, uid), {
                    rollNumber: roll,
                    migrationStatus: 'verified',
                    rollNumberVerified: true,
                    pendingRollNumber: '',
                    migrationReviewReason: '',
                    rollClaimedAt: serverTimestamp()
                });
                showToast('✓ Roll verified for ' + (username || uid));
                renderAdminRollVerify();
            } catch (e) {
                showToast('Approval failed: ' + e.message);
            }
        }

        async function adminRejectRoll(uid, roll) {
            if (!window.confirm('Reject this roll-number link request?')) return;
            try {
                await updateDoc(doc(usersCollection, uid), {
                    migrationStatus: 'rejected',
                    pendingRollNumber: normalizeRollInput(roll || ''),
                    migrationReviewReason: 'rejected-by-admin'
                });
                showToast('Roll request rejected.');
                renderAdminRollVerify();
            } catch (e) { showToast('Reject failed: ' + e.message); }
        }

        async function adminManualRoll(uid) {
            if (!window.confirm('Mark this roll-number link as needing manual review?')) return;
            try {
                await updateDoc(doc(usersCollection, uid), { migrationStatus: 'manual_review' });
                showToast('Marked for manual review.');
                renderAdminRollVerify();
            } catch (e) { showToast('Update failed: ' + e.message); }
        }

        // ========== ADMIN PANEL ==========
        let adminTab = 'dashboard';


// ============================================================================
// SECTION: 75_admin_panel.js
// Admin dashboard/users/timetable-editor/calendar/holidays/posts/requests
// Source: index.html lines 6865-7450 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        function openAdminPanel() {
            if (!isAdmin) { showToast('You are not an admin.'); return; }
            document.getElementById('adminPanel').classList.add('open');
            switchAdminTab(adminTab || 'dashboard');
        }

        function closeAdminPanel() { document.getElementById('adminPanel').classList.remove('open'); }

        function switchAdminTab(tab) {
            adminTab = tab;
            document.querySelectorAll('.admin-tab').forEach(t => {
                t.classList.toggle('active', t.dataset.tab === tab);
            });
            document.querySelectorAll('.admin-panel-body .tab-content').forEach(t => {
                t.classList.toggle('active', t.id === 'tab-' + tab);
            });
            if (tab === 'dashboard') renderAdminDashboard();
            if (tab === 'users') renderAdminUsers();
            if (tab === 'timetable') renderAdminTimetable();
            if (tab === 'calendar') renderAdminCalendar();
            if (tab === 'holidays') renderAdminHolidays();
            if (tab === 'posts') renderAdminPosts();
            if (tab === 'requests') renderAdminRequests();
            if (tab === 'feedback') renderAdminFeedback();
            if (tab === 'rollverify') renderAdminRollVerify();
            if (tab === 'telegram') renderAdminTelegram();
        }

        // ========== ADMIN: DASHBOARD ==========
        async function renderAdminDashboard() {
            const el = document.getElementById('adminDashboardContent');
            try {
                const usersSnap = await getDocs(usersCollection);
                const totalUsers = usersSnap.size;
                const adminUsers = usersSnap.docs.filter(d => d.data().isAdmin).length;
                const requestsSnap = await getDocs(query(adminRequestsCollection, where('status', '==', 'pending')));
                const pendingRequests = requestsSnap.size;
                const postsSnap = await getDocs(postsCollection);
                const totalPosts = postsSnap.size;
                const holidaysSnap = await getDocs(holidaysCollection);
                const totalHolidays = holidaysSnap.size;
                const fbSnap = await getDocs(feedbackCollection);
                const totalFeedback = fbSnap.size;
                const cpSnap = await getDocs(communityPostsCollection);
                const totalCommunityPosts = cpSnap.size;
                el.innerHTML = `
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:24px;">
                <div class="admin-card"><div class="title" style="font-size:28px;font-weight:700;">${totalUsers}</div><div style="font-size:12px;color:var(--ink-soft);">Total Users</div></div>
                <div class="admin-card"><div class="title" style="font-size:28px;font-weight:700;">${adminUsers}</div><div style="font-size:12px;color:var(--ink-soft);">Admins</div></div>
                <div class="admin-card"><div class="title" style="font-size:28px;font-weight:700;">${pendingRequests}</div><div style="font-size:12px;color:var(--ink-soft);">Pending Admin Requests</div></div>
                <div class="admin-card"><div class="title" style="font-size:28px;font-weight:700;">${totalPosts}</div><div style="font-size:12px;color:var(--ink-soft);">Announcements</div></div>
                <div class="admin-card"><div class="title" style="font-size:28px;font-weight:700;">${totalHolidays}</div><div style="font-size:12px;color:var(--ink-soft);">Holidays</div></div>
                <div class="admin-card"><div class="title" style="font-size:28px;font-weight:700;">${totalFeedback}</div><div style="font-size:12px;color:var(--ink-soft);">Feedback Tickets</div></div>
                <div class="admin-card"><div class="title" style="font-size:28px;font-weight:700;">${totalCommunityPosts}</div><div style="font-size:12px;color:var(--ink-soft);">Community Posts</div></div>
              </div>
              <div style="font-size:13px;color:var(--ink-soft);">Welcome to the admin panel. Use the tabs above to manage users, timetable, calendar, holidays, announcements, admin requests, and feedback.</div>
            `;
            } catch (e) {
                el.innerHTML = `<div class="empty-note">Error loading dashboard: ${e.message}</div>`;
            }
        }

        // ========== ADMIN: USERS ==========
        async function renderAdminUsers() {
            const el = document.getElementById('adminUsersContent');
            try {
                const snap = await getDocs(usersCollection);
                let users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const q = String(window.adminUsersSearch || '').trim().toLowerCase();
                if (q) {
                    users = users.filter(u =>
                        String(u.name || '').toLowerCase().includes(q) ||
                        String(u.username || '').toLowerCase().includes(q) ||
                        String(u.rollNumber || '').toLowerCase().includes(q) ||
                        String(u.pendingRollNumber || '').toLowerCase().includes(q));
                }
                let html = `
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">
                <input id="adminUsersSearchBox" style="flex:1;min-width:220px;padding:9px 12px;border-radius:8px;border:1px solid var(--paper-line);background:#fff;font-size:13px;color:var(--ink);" placeholder="Search by name, roll number or username…" value="${escapeHtml(window.adminUsersSearch || '')}" oninput="window.adminUsersSearch=this.value;renderAdminUsers();" />
                <span style="font-size:12px;color:var(--ink-soft);">${users.length} account(s)</span>
              </div>
              <div style="font-size:12.5px;color:var(--ink-soft);margin-bottom:10px;">⚠️ Delete permanently removes the student's profile and frees their linked roll number. You cannot delete your own signed-in account.</div>
              <div style="overflow-x:auto;max-height:500px;overflow-y:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                  <thead style="background:var(--ink);color:#F1ECDD;position:sticky;top:0;">
                    <tr><th style="padding:10px 8px;text-align:left;">Name</th><th style="padding:10px 8px;text-align:left;">Roll No.</th><th style="padding:10px 8px;text-align:left;">Username</th><th style="padding:10px 8px;text-align:left;">Branch</th><th style="padding:10px 8px;text-align:left;">Sec</th><th style="padding:10px 8px;text-align:left;">Hostel</th><th style="padding:10px 8px;text-align:left;">Gender</th><th style="padding:10px 8px;text-align:left;">Admin</th><th style="padding:10px 8px;text-align:left;">Actions</th></tr>
                  </thead>
                  <tbody>
            `;
                users.forEach(u => {
                    const branch = getBranch(u.branchId);
                    const roll = u.rollNumber || u.pendingRollNumber || '';
                    html += `
                <tr style="border-bottom:1px solid var(--paper-line);">
                  <td style="padding:8px;">${escapeHtml(u.name || '—')}</td>
                  <td style="padding:8px;" class="mono">${roll ? escapeHtml(roll) : '—'}</td>
                  <td style="padding:8px;" class="mono">${escapeHtml(u.username || '—')}</td>
                  <td style="padding:8px;">${branch ? escapeHtml(branch.name.replace('B.Tech — ', '').replace('B.Tech - ', '')) : escapeHtml(u.branchId || '—')}</td>
                  <td style="padding:8px;">${escapeHtml(u.section || '—')}</td>
                  <td style="padding:8px;">${escapeHtml(u.hostel || 'Day Scholar')}</td>
                  <td style="padding:8px;">${escapeHtml(u.gender || 'Not specified')}</td>
                  <td style="padding:8px;">${u.isAdmin ? '✅' : '—'}</td>
                  <td style="padding:8px;white-space:nowrap;">${u.id === currentUid
                      ? '<span style="color:var(--ink-soft);font-size:12px;">you</span>'
                      : '<button style="background:var(--brick-soft);color:var(--brick);border:none;border-radius:8px;padding:6px 12px;font-weight:600;font-size:12px;cursor:pointer;" onclick="adminDeleteUser(\'' + u.id + '\',\'' + escapeHtml(u.username || '') + '\',\'' + roll + '\')">🗑 Delete</button>'}</td>
                </tr>
              `;
                });
                html += `</tbody></table></div>`;
                el.innerHTML = html;
                if (q) {
                    const sb = document.getElementById('adminUsersSearchBox');
                    if (sb) { sb.focus(); try { sb.setSelectionRange(sb.value.length, sb.value.length); } catch (e) { /* ignore */ } }
                }
            } catch (e) {
                el.innerHTML = `<div class="empty-note">Error loading users: ${e.message}</div>`;
            }
        }

        // ========== ADMIN: DELETE USER ==========
        // Permanently removes a user's profile document and frees their claimed
        // roll number so someone else can link it again. The Firebase Auth record
        // itself cannot be deleted from the client SDK — but without a
        // users/{uid} profile the account can no longer load (login shows
        // "Could not load your profile"), so access is effectively revoked.
        async function adminDeleteUser(uid, username, roll) {
            if (!isAdmin) { showToast('You are not an admin.'); return; }
            if (!uid) return;
            if (uid === currentUid) { showToast('You cannot delete the account you are currently signed in with.'); return; }
            const label = username || uid;
            const msg = 'Permanently delete the account "' + label + '"?' +
                (roll ? '\n\nTheir roll number ' + roll + ' will also be unlinked so it can be claimed again.' : '') +
                '\n\nThis action cannot be undone.';
            if (!window.confirm(msg)) return;
            try {
                await deleteDoc(doc(usersCollection, uid));
            } catch (e) {
                showToast('Delete failed: ' + e.message);
                return;
            }
            let note = '';
            if (roll) {
                try {
                    await deleteDoc(doc(userRollsCollection, roll));
                } catch (e) {
                    note = ' ⚠ Roll ' + roll + ' could not be unlinked automatically — remove it from the userRolls collection manually.';
                }
            }
            showToast('🗑 Account deleted: ' + label + '.' + note);
            renderAdminUsers();
        }

        // ========== ADMIN: TIMETABLE ==========
        let ttEditBranch = 'cse',
            ttEditSection = 'A',
            ttEditDay = 'Monday',
            ttEditPeriod = 'I';

        async function renderAdminTimetable() {
            const el = document.getElementById('adminTimetableContent');
            const branch = getBranch(ttEditBranch);
            if (!branch) { el.innerHTML = `<div class="empty-note">Select a branch.</div>`; return; }
            let html = `
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
              <div><label style="font-size:11px;font-weight:600;display:block;color:var(--ink-soft);">Branch</label>
                <select id="ttBranch" onchange="ttEditBranch=this.value;renderAdminTimetable();">
                  ${BRANCHES.map(b => `<option value="${b.id}" ${b.id===ttEditBranch?'selected':''}>${b.name}</option>`).join('')}
                </select>
              </div>
              <div><label style="font-size:11px;font-weight:600;display:block;color:var(--ink-soft);">Section</label>
                <select id="ttSection" onchange="ttEditSection=this.value;renderAdminTimetable();">
                  ${branch.sections.map(s => `<option value="${s}" ${s===ttEditSection?'selected':''}>${s}</option>`).join('')}
                </select>
              </div>
              <div><label style="font-size:11px;font-weight:600;display:block;color:var(--ink-soft);">Day</label>
                <select id="ttDay" onchange="ttEditDay=this.value;renderAdminTimetable();">
                  ${DAYS.map(d => `<option value="${d}" ${d===ttEditDay?'selected':''}>${d}</option>`).join('')}
                </select>
              </div>
              <div><label style="font-size:11px;font-weight:600;display:block;color:var(--ink-soft);">Period</label>
                <select id="ttPeriod" onchange="ttEditPeriod=this.value;renderAdminTimetable();">
                  ${TEACH_PERIODS.map(p => `<option value="${p.key}" ${p.key===ttEditPeriod?'selected':''}>${p.key}</option>`).join('')}
                </select>
              </div>
            </div>
          `;
            const schedule = buildSchedule(branch, ttEditSection);
            const dayData = schedule[ttEditDay];
            const cell = dayData ? dayData[ttEditPeriod] : null;
            let override = null;
            try {
                const q = query(timetableOverridesCollection,
                    where('branchId', '==', ttEditBranch),
                    where('section', '==', ttEditSection),
                    where('day', '==', ttEditDay),
                    where('period', '==', ttEditPeriod)
                );
                const snap = await getDocs(q);
                if (!snap.empty) override = { id: snap.docs[0].id, ...snap.docs[0].data() };
            } catch (e) {}
            const current = override || cell || { code: '—', name: 'Self Study / Library', type: 'Free' };
            html += `
            <div class="admin-card">
              <div style="font-weight:600;margin-bottom:8px;">Editing: ${ttEditDay}, Period ${ttEditPeriod}</div>
              <div style="font-size:13px;margin-bottom:12px;">Current: <b>${current.code}</b> — ${current.name} (${current.type})</div>
              <form id="ttEditForm" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" onsubmit="event.preventDefault();saveTimetableOverride();">
                <div><label style="font-size:11px;font-weight:600;color:var(--ink-soft);">Subject Code</label>
                  <input id="ttCode" value="${current.code !== '—' ? current.code : ''}" placeholder="e.g. BSM-110"></div>
                <div><label style="font-size:11px;font-weight:600;color:var(--ink-soft);">Subject Name</label>
                  <input id="ttName" value="${current.name !== 'Self Study / Library' ? current.name : ''}" placeholder="e.g. Engineering Mathematics I"></div>
                <div><label style="font-size:11px;font-weight:600;color:var(--ink-soft);">Type</label>
                  <select id="ttType">
                    <option value="Lecture" ${current.type==='Lecture'?'selected':''}>Lecture</option>
                    <option value="Tutorial" ${current.type==='Tutorial'?'selected':''}>Tutorial</option>
                    <option value="Practical" ${current.type==='Practical'?'selected':''}>Practical</option>
                    <option value="Free" ${current.type==='Free'?'selected':''}>Free / Self Study</option>
                  </select>
                </div>
                <div style="display:flex;align-items:flex-end;gap:8px;">
                  <button type="submit" class="btn-primary" style="width:auto;padding:10px 24px;margin:0;">Save Override</button>
                  ${override ? `<button type="button" class="btn-danger" style="width:auto;padding:10px 20px;margin:0;" onclick="deleteTimetableOverride('${override.id}')">Delete</button>` : ''}
                </div>
              </form>
              <div style="margin-top:10px;font-size:11px;color:var(--ink-soft);">Overrides are stored per branch+section+day+period. Leave code/name blank for "Free".</div>
            </div>
          `;
            el.innerHTML = html;
        }
        window.ttEditBranch = 'cse';
        window.ttEditSection = 'A';
        window.ttEditDay = 'Monday';
        window.ttEditPeriod = 'I';
        window.renderAdminTimetable = renderAdminTimetable;

        async function saveTimetableOverride() {
            const branchId = document.getElementById('ttBranch')?.value || ttEditBranch;
            const section = document.getElementById('ttSection')?.value || ttEditSection;
            const day = document.getElementById('ttDay')?.value || ttEditDay;
            const period = document.getElementById('ttPeriod')?.value || ttEditPeriod;
            const code = document.getElementById('ttCode').value.trim() || '—';
            const name = document.getElementById('ttName').value.trim() || 'Self Study / Library';
            const type = document.getElementById('ttType').value;
            try {
                const q = query(timetableOverridesCollection,
                    where('branchId', '==', branchId),
                    where('section', '==', section),
                    where('day', '==', day),
                    where('period', '==', period)
                );
                const snap = await getDocs(q);
                const data = { branchId, section, day, period, code, name, type,
                    updatedBy: currentUser ? currentUser.username : 'admin', updatedAt: serverTimestamp() };
                if (snap.empty) {
                    await addDoc(timetableOverridesCollection, data);
                    showToast('Timetable override saved.');
                } else {
                    await updateDoc(doc(timetableOverridesCollection, snap.docs[0].id), data);
                    showToast('Timetable override updated.');
                }
                const branch = getBranch(branchId);
                if (branch && currentUser) {
                    scheduleCache = buildSchedule(branch, currentUser.section);
                    renderSchedule();
                    renderHistoryView();
                }
                renderAdminTimetable();
            } catch (e) { showToast('Error: ' + e.message); }
        }

        async function deleteTimetableOverride(id) {
            if (!confirm('Delete this timetable override?')) return;
            try {
                await deleteDoc(doc(timetableOverridesCollection, id));
                showToast('Override deleted.');
                const branch = getBranch(ttEditBranch);
                if (branch && currentUser) { scheduleCache = buildSchedule(branch, currentUser.section);
                    renderSchedule();
                    renderHistoryView(); }
                renderAdminTimetable();
            } catch (e) { showToast('Error: ' + e.message); }
        }
        window.saveTimetableOverride = saveTimetableOverride;
        window.deleteTimetableOverride = deleteTimetableOverride;

        // ========== ADMIN: CALENDAR ==========
        async function renderAdminCalendar() {
            const el = document.getElementById('adminCalendarContent');
            try {
                const snap = await getDocs(eventOverridesCollection);
                const customEvents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const allEvents = [...BUILTIN_EVENTS.map(e => ({ ...e, isBuiltin: true })), ...customEvents.map(e => ({ ...e,
                        isBuiltin: false }))];
                allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
                let html = `
              <div class="admin-form">
                <div class="full"><label>Title</label><input id="calTitle" placeholder="e.g. Minor Test Examination"></div>
                <div><label>Start Date</label><input id="calStart" type="date" value="2026-08-01"></div>
                <div><label>End Date</label><input id="calEnd" type="date" value="2026-08-01"></div>
                <div class="form-actions">
                  <button class="btn-primary" onclick="addCalendarEvent()">Add Event</button>
                </div>
              </div>
              <div style="margin-top:16px;max-height:400px;overflow-y:auto;">
            `;
                allEvents.forEach(e => {
                    const isCustom = !e.isBuiltin;
                    const range = e.start === e.end ?
                        new Date(e.start + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric',
                            month: 'short',
                            year: 'numeric' }) :
                        `${new Date(e.start+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – ${new Date(e.end+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`;
                    html += `
                <div class="admin-card">
                  <div class="row">
                    <div class="left">
                      <div class="title">${e.title} ${e.isBuiltin ? '<span style="font-size:10px;color:var(--ink-soft);">(built-in)</span>' : ''}</div>
                      <div class="sub">${range}</div>
                    </div>
                    <div class="actions">
                      ${isCustom ? `<button class="btn-sm delete" onclick="deleteCalendarEvent('${e.id}')">Delete</button>` : ''}
                    </div>
                  </div>
                </div>
              `;
                });
                html += `</div>`;
                el.innerHTML = html;
            } catch (e) {
                el.innerHTML = `<div class="empty-note">Error loading calendar: ${e.message}</div>`;
            }
        }

        async function addCalendarEvent() {
            const title = document.getElementById('calTitle').value.trim();
            const start = document.getElementById('calStart').value;
            const end = document.getElementById('calEnd').value;
            if (!title || !start || !end) { showToast('Fill in all fields.'); return; }
            if (new Date(start) > new Date(end)) { showToast('Start date must be before end date.'); return; }
            try {
                await addDoc(eventOverridesCollection, { title, start, end, updatedBy: currentUser ? currentUser
                        .username :
                        'admin', updatedAt: serverTimestamp(), isCustom: true });
                showToast('Event added.');
                renderAdminCalendar();
                renderEvents();
            } catch (e) { showToast('Error: ' + e.message); }
        }

        async function deleteCalendarEvent(id) {
            if (!confirm('Delete this event?')) return;
            try {
                await deleteDoc(doc(eventOverridesCollection, id));
                showToast('Event deleted.');
                renderAdminCalendar();
                renderEvents();
            } catch (e) { showToast('Error: ' + e.message); }
        }
        window.addCalendarEvent = addCalendarEvent;
        window.deleteCalendarEvent = deleteCalendarEvent;

        // ========== ADMIN: HOLIDAYS ==========
        async function renderAdminHolidays() {
            const el = document.getElementById('adminHolidaysContent');
            try {
                const snap = await getDocs(holidaysCollection);
                const holidayDocs = snap.docs.map(d => ({ id: d.id, date: d.data().date }));
                let html = `
              <div class="admin-form">
                <div class="full"><label>Add Holiday</label>
                  <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <input type="date" id="holidayDate" value="${dateKey(new Date())}" style="flex:1;min-width:180px;">
                    <button class="btn-primary" onclick="addHoliday()" style="width:auto;padding:10px 24px;margin:0;">Add Holiday</button>
                  </div>
                </div>
              </div>
              <div style="margin-top:16px;max-height:400px;overflow-y:auto;">
            `;
                if (holidayDocs.length === 0) {
                    html += `<div class="empty-note">No holidays set.</div>`;
                } else {
                    holidayDocs.forEach(h => {
                        const dateObj = new Date(h.date + 'T00:00:00');
                        const display = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric',
                            month: 'short', year: 'numeric' });
                        html += `
                  <div class="admin-card">
                    <div class="row">
                      <div class="left">
                        <div class="title">${display}</div>
                      </div>
                      <div class="actions">
                        <button class="btn-sm delete" onclick="deleteHoliday('${h.id}')">Delete</button>
                      </div>
                    </div>
                  </div>
                `;
                    });
                }
                html += `</div>`;
                el.innerHTML = html;
            } catch (e) {
                el.innerHTML = `<div class="empty-note">Error loading holidays: ${e.message}</div>`;
            }
        }

        async function addHoliday() {
            const date = document.getElementById('holidayDate').value;
            if (!date) { showToast('Select a date.'); return; }
            if (holidays.has(date)) { showToast('Already a holiday.'); return; }
            try {
                await addDoc(holidaysCollection, { date });
                showToast('Holiday added.');
                renderAdminHolidays();
            } catch (e) { showToast('Error: ' + e.message); }
        }

        async function deleteHoliday(id) {
            if (!confirm('Remove this holiday?')) return;
            try {
                await deleteDoc(doc(holidaysCollection, id));
                showToast('Holiday removed.');
                renderAdminHolidays();
            } catch (e) { showToast('Error: ' + e.message); }
        }
        window.addHoliday = addHoliday;
        window.deleteHoliday = deleteHoliday;

        // ========== ADMIN: POSTS ==========
        async function renderAdminPosts() {
            const el = document.getElementById('adminPostsContent');
            try {
                const snap = await getDocs(postsCollection);
                let posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                posts.sort((a, b) => {
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    const da = a.createdAt?.seconds || 0;
                    const db = b.createdAt?.seconds || 0;
                    return db - da;
                });
                let html = `
              <div class="admin-form">
                <div class="full"><label>Title</label><input id="postTitle" placeholder="Announcement title"></div>
                <div class="full"><label>Content</label><textarea id="postContent" placeholder="Write your announcement…" rows="3"></textarea></div>
                <div class="form-actions">
                  <button class="btn-primary" onclick="addPost()">Publish Announcement</button>
                  <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:400;text-transform:none;">
                    <input type="checkbox" id="postPinned"> Pin this post
                  </label>
                </div>
              </div>
              <div style="margin-top:16px;max-height:400px;overflow-y:auto;">
            `;
                if (posts.length === 0) {
                    html += `<div class="empty-note">No announcements yet.</div>`;
                } else {
                    posts.forEach(p => {
                        const date = p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString(
                            'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                        const pid = String(p.id || '').replace(/[^A-Za-z0-9_-]/g, '');
                        html += `
                  <div class="post-item ${p.pinned ? 'pinned' : ''}">
                    <div class="post-title">${escapeHtml(p.title)} ${p.pinned ? '📌' : ''}</div>
                    <div class="post-meta">by ${escapeHtml(p.author || 'admin')} · ${escapeHtml(date)}</div>
                    <div class="post-content">${escapeHtml(p.content)}</div>
                    <div class="actions" style="margin-top:6px;display:flex;gap:6px;">
                      <button class="btn-sm ${p.pinned ? 'edit' : 'pin'}" data-pact="pin" data-pid="${pid}" data-pin="${p.pinned ? '0' : '1'}">${p.pinned ? 'Unpin' : 'Pin'}</button>
                      <button class="btn-sm delete" data-pact="del" data-pid="${pid}">Delete</button>
                    </div>
                  </div>
                `;
                    });
                }
                html += `</div>`;
                el.innerHTML = html;
                el.querySelectorAll('button[data-pact]').forEach(b => {
                    b.addEventListener('click', () => {
                        const id = b.dataset.pid;
                        if (!id) return;
                        if (b.dataset.pact === 'pin') togglePinPost(id, b.dataset.pin === '1');
                        else if (b.dataset.pact === 'del') deletePost(id);
                    });
                });
            } catch (e) {
                el.innerHTML = `<div class="empty-note">Error loading posts: ${escapeHtml(e.message)}</div>`;
            }
        }

        async function addPost() {
            const title = document.getElementById('postTitle').value.trim().slice(0, 120);
            const content = document.getElementById('postContent').value.trim().slice(0, 5000);
            const pinned = document.getElementById('postPinned').checked;
            if (!title || !content) { showToast('Fill in title and content.'); return; }
            if (!isAdmin) { showToast('Only admins can publish announcements.'); return; }
            try {
                await addDoc(postsCollection, {
                    title,
                    content,
                    pinned,
                    author: currentUser ? currentUser.username : 'admin',
                    authorName: currentUser ? currentUser.name : 'Admin',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                showToast('Announcement published.');
                document.getElementById('postTitle').value = '';
                document.getElementById('postContent').value = '';
                document.getElementById('postPinned').checked = false;
                renderAdminPosts();
                renderPostsFeed();
            } catch (e) { showToast('Error: ' + e.message); }
        }

        async function togglePinPost(id, pinned) {
            id = String(id || '').replace(/[^A-Za-z0-9_-]/g, '');
            if (!id) return;
            if (!isAdmin) { showToast('Only admins can pin posts.'); return; }
            try {
                await updateDoc(doc(postsCollection, id), { pinned });
                showToast(pinned ? 'Post pinned.' : 'Post unpinned.');
                renderAdminPosts();
                renderPostsFeed();
            } catch (e) { showToast('Error: ' + e.message); }
        }

        async function deletePost(id) {
            id = String(id || '').replace(/[^A-Za-z0-9_-]/g, '');
            if (!id) return;
            if (!isAdmin) { showToast('Only admins can delete announcements.'); return; }
            if (!confirm('Delete this announcement?')) return;
            try {
                await deleteDoc(doc(postsCollection, id));
                showToast('Announcement deleted.');
                renderAdminPosts();
                renderPostsFeed();
            } catch (e) { showToast('Error: ' + e.message); }
        }
        window.addPost = addPost;
        window.togglePinPost = togglePinPost;
        window.deletePost = deletePost;

        // ========== ADMIN: REQUESTS ==========
        async function renderAdminRequests() {
            const el = document.getElementById('adminRequestsContent');
            try {
                const snap = await getDocs(query(adminRequestsCollection, where('status', '==', 'pending')));
                const requests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                let html =
                    `<div style="margin-bottom:16px;font-size:13px;color:var(--ink-soft);">${requests.length} pending request${requests.length !== 1 ? 's' : ''}.</div>`;
                if (requests.length === 0) {
                    html += `<div class="empty-note">No pending admin requests.</div>`;
                } else {
                    requests.forEach(r => {
                        const date = r.requestedAt ? new Date(r.requestedAt.seconds * 1000).toLocaleDateString(
                            'en-IN', { day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit' }) : '—';
                        html += `
                  <div class="admin-card">
                    <div class="row">
                      <div class="left">
                        <div class="title">${r.name} (@${r.username})</div>
                        <div class="sub">${r.branchId} · Section ${r.section} · requested ${date}</div>
                      </div>
                      <div class="actions">
                        <button class="btn-sm approve" onclick="approveAdminRequest('${r.id}','${r.uid}')">Approve</button>
                        <button class="btn-sm reject" onclick="rejectAdminRequest('${r.id}','${r.uid}')">Reject</button>
                      </div>
                    </div>
                  </div>
                `;
                    });
                }
                el.innerHTML = html;
            } catch (e) {
                el.innerHTML = `<div class="empty-note">Error loading requests: ${e.message}</div>`;
            }
        }

        async function approveAdminRequest(requestId, uid) {
            if (!confirm('Approve this admin request?')) return;
            try {
                await updateDoc(doc(adminRequestsCollection, requestId), { status: 'approved', reviewedAt: serverTimestamp(),
                    reviewedBy: currentUser ? currentUser.username : 'admin' });
                await updateDoc(doc(usersCollection, uid), { isAdmin: true, adminRequested: false });
                showToast('Admin request approved!');
                renderAdminRequests();
            } catch (e) { showToast('Error: ' + e.message); }
        }

        async function rejectAdminRequest(requestId, uid) {
            if (!confirm('Reject this admin request?')) return;
            try {
                await updateDoc(doc(adminRequestsCollection, requestId), { status: 'rejected', reviewedAt: serverTimestamp(),
                    reviewedBy: currentUser ? currentUser.username : 'admin' });
                await updateDoc(doc(usersCollection, uid), { adminRequested: false });
                showToast('Admin request rejected.');
                renderAdminRequests();
            } catch (e) { showToast('Error: ' + e.message); }
        }
        window.approveAdminRequest = approveAdminRequest;
        window.rejectAdminRequest = rejectAdminRequest;

        // ========== ADMIN: TELEGRAM ACCESS APPLICATIONS ==========
        async function renderAdminTelegram() {
            const el = document.getElementById('adminTelegramContent');
            if (!el) return;
            el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--ink-soft);">Loading Telegram applications…</div>';
            try {
                const snap = await getDocs(telegramApplicationsCollection);
                let apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                // Sort pending first, then by appliedAt desc
                apps.sort((a, b) => {
                    if (a.status === 'PENDING_ADMIN_APPROVAL' && b.status !== 'PENDING_ADMIN_APPROVAL') return -1;
                    if (b.status === 'PENDING_ADMIN_APPROVAL' && a.status !== 'PENDING_ADMIN_APPROVAL') return 1;
                    const tA = (a.appliedAt && a.appliedAt.seconds) || 0;
                    const tB = (b.appliedAt && b.appliedAt.seconds) || 0;
                    return tB - tA;
                });

                const pendingCount = apps.filter(a => a.status === 'PENDING_ADMIN_APPROVAL').length;
                const approvedCount = apps.filter(a => ['ADMIN_APPROVED', 'JOIN_REQUEST_NOT_SENT', 'JOIN_REQUEST_PENDING', 'CHANNEL_APPROVED'].includes(a.status)).length;
                const rejectedCount = apps.filter(a => ['ADMIN_REJECTED', 'CHANNEL_REJECTED'].includes(a.status)).length;

                let html = `
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:18px;">
                    <div class="admin-card"><div class="title" style="font-size:24px;font-weight:700;color:var(--primary);">${apps.length}</div><div style="font-size:12px;color:var(--ink-soft);">Total Applications</div></div>
                    <div class="admin-card"><div class="title" style="font-size:24px;font-weight:700;color:#d97706;">${pendingCount}</div><div style="font-size:12px;color:var(--ink-soft);">Pending Review</div></div>
                    <div class="admin-card"><div class="title" style="font-size:24px;font-weight:700;color:#16a34a;">${approvedCount}</div><div style="font-size:12px;color:var(--ink-soft);">Admin Approved</div></div>
                    <div class="admin-card"><div class="title" style="font-size:24px;font-weight:700;color:#dc2626;">${rejectedCount}</div><div style="font-size:12px;color:var(--ink-soft);">Declined</div></div>
                </div>
                <div style="margin-bottom:12px;font-size:13px;color:var(--ink-soft);">
                    <strong>Stage 1 Approval:</strong> Approving unlocks Telegram linking for the student. They will then request access to the private channel.
                </div>`;

                if (apps.length === 0) {
                    html += '<div class="empty-note">No Telegram applications received yet.</div>';
                } else {
                    html += `
                    <div style="overflow-x:auto;max-height:550px;overflow-y:auto;">
                        <table style="width:100%;border-collapse:collapse;font-size:13px;">
                            <thead style="background:var(--ink);color:#F1ECDD;position:sticky;top:0;z-index:2;">
                                <tr>
                                    <th style="padding:10px 8px;text-align:left;">Student</th>
                                    <th style="padding:10px 8px;text-align:left;">Roll No.</th>
                                    <th style="padding:10px 8px;text-align:left;">Branch</th>
                                    <th style="padding:10px 8px;text-align:left;">Applied</th>
                                    <th style="padding:10px 8px;text-align:left;">Telegram User</th>
                                    <th style="padding:10px 8px;text-align:left;">Status</th>
                                    <th style="padding:10px 8px;text-align:left;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>`;

                    apps.forEach(app => {
                        const statusBadge = getTelegramStatusBadge(app.status);
                        const appliedStr = app.appliedAt ? formatDate(app.appliedAt) : '—';
                        const tgUserStr = app.telegramUsername ? `@${escapeHtml(app.telegramUsername)}` : (app.telegramUserId ? `ID: ${escapeHtml(app.telegramUserId)}` : '<span style="color:var(--ink-soft);font-style:italic;">Not linked</span>');

                        let actionsHtml = '';
                        if (app.status === 'PENDING_ADMIN_APPROVAL') {
                            actionsHtml = `
                                <div style="display:flex;gap:6px;">
                                    <button class="btn-sm" style="background:#16a34a;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;" onclick="approveTelegramApplication('${app.id}')">✓ Approve</button>
                                    <button class="btn-sm" style="background:#dc2626;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;" onclick="rejectTelegramApplication('${app.id}')">✕ Reject</button>
                                </div>`;
                        } else if (app.status === 'ADMIN_REJECTED') {
                            actionsHtml = `
                                <button class="btn-sm" style="background:#16a34a;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;" onclick="approveTelegramApplication('${app.id}')">✓ Approve</button>`;
                        } else {
                            actionsHtml = `
                                <button class="btn-sm" style="background:#dc2626;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;" onclick="rejectTelegramApplication('${app.id}')">Revoke</button>`;
                        }

                        html += `
                            <tr style="border-bottom:1px solid var(--paper-line);">
                                <td style="padding:10px 8px;"><strong>${escapeHtml(app.studentName || '—')}</strong><br><span style="font-size:11px;color:var(--ink-soft);">${escapeHtml(app.studentUsername || '')}</span></td>
                                <td style="padding:10px 8px;">${escapeHtml(app.studentRoll || '—')}</td>
                                <td style="padding:10px 8px;">${escapeHtml(getBranchName(app.studentBranch))}</td>
                                <td style="padding:10px 8px;font-size:12px;color:var(--ink-soft);">${appliedStr}</td>
                                <td style="padding:10px 8px;">${tgUserStr}</td>
                                <td style="padding:10px 8px;">${statusBadge}</td>
                                <td style="padding:10px 8px;">${actionsHtml}</td>
                            </tr>`;
                    });

                    html += `
                            </tbody>
                        </table>
                    </div>`;
                }

                el.innerHTML = html;
            } catch (err) {
                console.error('[Admin Telegram] Error rendering:', err);
                el.innerHTML = `<div class="empty-note">Error loading Telegram applications: ${err.message}</div>`;
            }
        }

        function getTelegramStatusBadge(status) {
            switch (status) {
                case 'PENDING_ADMIN_APPROVAL':
                    return '<span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:600;background:#fef3c7;color:#92400e;">⏳ Pending ERP Admin</span>';
                case 'ADMIN_APPROVED':
                    return '<span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:600;background:#dcfce7;color:#166534;">✅ ERP Approved</span>';
                case 'ADMIN_REJECTED':
                    return '<span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:600;background:#fee2e2;color:#991b1b;">❌ ERP Rejected</span>';
                case 'JOIN_REQUEST_NOT_SENT':
                    return '<span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:600;background:#e0f2fe;color:#075985;">🔗 Telegram Linked</span>';
                case 'JOIN_REQUEST_PENDING':
                    return '<span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:600;background:#ffedd5;color:#9a3412;">⏳ Channel Review</span>';
                case 'CHANNEL_APPROVED':
                    return '<span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:600;background:#bbf7d0;color:#14532d;">🎉 Channel Member</span>';
                case 'CHANNEL_REJECTED':
                    return '<span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:600;background:#fecaca;color:#7f1d1d;">🚫 Channel Rejected</span>';
                default:
                    return `<span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:600;background:#f3f4f6;color:#374151;">${escapeHtml(status || '—')}</span>`;
            }
        }

        async function approveTelegramApplication(uid) {
            if (!confirm('Approve Telegram access for this student?')) return;
            try {
                await updateDoc(doc(telegramApplicationsCollection, uid), {
                    status: 'ADMIN_APPROVED',
                    reviewedAt: serverTimestamp(),
                    reviewedBy: (currentUser && currentUser.uid) || 'admin',
                    rejectionReason: null
                });
                showToast('✅ Student Telegram application approved!');
                renderAdminTelegram();
            } catch (e) {
                console.error('[Admin] Approve Telegram error:', e);
                showToast('Failed to approve: ' + e.message);
            }
        }

        async function rejectTelegramApplication(uid) {
            const reason = prompt('Enter rejection reason (optional):', 'Application does not meet eligibility criteria at this time.');
            if (reason === null) return; // user cancelled prompt

            try {
                await updateDoc(doc(telegramApplicationsCollection, uid), {
                    status: 'ADMIN_REJECTED',
                    reviewedAt: serverTimestamp(),
                    reviewedBy: (currentUser && currentUser.uid) || 'admin',
                    rejectionReason: reason || 'Not eligible at this time.'
                });
                showToast('Application marked as rejected.');
                renderAdminTelegram();
            } catch (e) {
                console.error('[Admin] Reject Telegram error:', e);
                showToast('Failed to reject: ' + e.message);
            }
        }

        window.renderAdminTelegram = renderAdminTelegram;
        window.approveTelegramApplication = approveTelegramApplication;
        window.rejectTelegramApplication = rejectTelegramApplication;

        // ========== RENDER: Posts Feed ==========

// ============================================================================
// SECTION: 80_feed_attendance_events_image_history.js
// Posts feed, topbar, schedule render+marking, stats, events, canvas image, history
// Source: index.html lines 7451-8012 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        async function renderPostsFeed(viewAll = false) {
            const content = document.getElementById('postsFeedContent');
            if (!content) return;
            let posts = allPosts.slice();
            if (!viewAll) {
                posts = posts.slice(0, 5);
            }
            if (posts.length === 0) {
                content.innerHTML = `<div class="empty-note">No announcements yet.</div>`;
                return;
            }
            let html = '';
            posts.forEach(p => {
                const date = p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString(
                    'en-IN', { day: 'numeric', month: 'short' }) : '—';
                const title = escapeHtml(p.title || '');
                const content = escapeHtml(p.content || '');
                html += `
              <div class="post-item ${p.pinned ? 'pinned' : ''}" style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--paper-line);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span class="post-title" style="font-size:13px;font-weight:600;">${title} ${p.pinned ? '📌' : ''}</span>
                  <span style="font-size:10px;color:var(--ink-soft);">${escapeHtml(date)}</span>
                </div>
                <div class="post-content" style="font-size:12px;margin-top:2px;color:var(--ink-soft);">${content}</div>
              </div>
            `;
            });
            if (!viewAll && allPosts.length > 5) {
                html +=
                    `<div style="text-align:right;margin-top:8px;"><button class="btn-secondary" style="padding:4px 12px;font-size:11px;margin:0;" onclick="renderPostsFeed(true)">View all ${allPosts.length} →</button></div>`;
            }
            content.innerHTML = html;
        }

        // ========== RENDER: Schedule ==========
        function renderTopbarDate() {
            const now = new Date();
            const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('todayLabel').textContent = now.toLocaleDateString('en-IN', opts);
        }

        function currentPeriodKey() {
            const now = new Date();
            const mins = now.getHours() * 60 + now.getMinutes();
            for (const p of PERIODS) {
                const [sh, sm] = p.start.split(':').map(Number);
                const [eh, em] = p.end.split(':').map(Number);
                const s = sh * 60 + sm,
                    e = eh * 60 + em;
                if (mins >= s && mins < e) return p.key;
            }
            return null;
        }

        function todayName() {
            const idx = new Date().getDay();
            const map = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
            return map[idx] || null;
        }

        function setScheduleView(v) {
            scheduleView = v;
            document.getElementById('tabToday').classList.toggle('active', v === 'today');
            document.getElementById('tabWeek').classList.toggle('active', v === 'week');
            document.getElementById('tabImage').classList.toggle('active', v === 'image');
            document.getElementById('todayView').style.display = v === 'today' ? 'block' : 'none';
            document.getElementById('weekView').style.display = v === 'week' ? 'block' : 'none';
            document.getElementById('imageView').style.display = v === 'image' ? 'block' : 'none';
            if (v === 'image') {
                if (document.fonts && document.fonts.ready) { document.fonts.ready.then(drawTimetableImage); } else { drawTimetableImage(); }
            } else { renderSchedule(); }
        }

        async function getAttendanceMap() { return attendanceCache || {}; }

        async function setAttendanceMap(map) {
            attendanceCache = map;
            if (!currentUid) return;
            const ref = doc(attendanceCollection, currentUid);
            try { await updateDoc(ref, { attendance: map }); } catch (e) { await setDoc(ref, { attendance: map }); }
        }

        async function markAttendance(periodKey, subjectCode, status) {
            const map = await getAttendanceMap();
            const today = dateKey(new Date());
            if (holidays.has(today)) {
                showToast('Today is a holiday – attendance cannot be marked.');
                return;
            }
            if (!map[today]) map[today] = {};
            const cellKey = periodKey + '::' + subjectCode;
            if (map[today][cellKey] === status) { delete map[today][cellKey]; } else { map[today][cellKey] = status; }
            await setAttendanceMap(map);
            renderSchedule();
            await renderAttendanceStats();
            renderHistoryView();
        }

        async function markAttendanceForDate(periodKey, subjectCode, status, dateStr) {
            const map = await getAttendanceMap();
            if (holidays.has(dateStr)) {
                showToast('This date is a holiday – attendance cannot be marked.');
                return;
            }
            if (!map[dateStr]) map[dateStr] = {};
            const cellKey = periodKey + '::' + subjectCode;
            if (map[dateStr][cellKey] === status) { delete map[dateStr][cellKey]; } else { map[dateStr][cellKey] =
                status; }
            await setAttendanceMap(map);
            renderSchedule();
            await renderAttendanceStats();
            renderHistoryView();
        }

        async function renderSchedule() {
            const day = todayName();
            const nowKey = currentPeriodKey();
            const map = await getAttendanceMap();
            const today = dateKey(new Date());
            const todayMarks = map[today] || {};
            let schedule = scheduleCache;
            if (currentUser && currentUser.branchId) {
                try {
                    const q = query(timetableOverridesCollection,
                        where('branchId', '==', currentUser.branchId),
                        where('section', '==', currentUser.section)
                    );
                    const snap = await getDocs(q);
                    snap.docs.forEach(d => {
                        const ov = d.data();
                        if (schedule[ov.day] && schedule[ov.day][ov.period]) {
                            schedule[ov.day][ov.period] = { code: ov.code, name: ov.name, type: ov.type };
                        }
                    });
                } catch (e) {}
            }
            const todayView = document.getElementById('todayView');
            if (!day || holidays.has(today)) {
                if (holidays.has(today)) {
                    todayView.innerHTML = `<div class="holiday-banner">🏖️ Today is a holiday. No classes scheduled.</div>`;
                } else {
                    todayView.innerHTML =
                    `<div class="empty-note">It's the weekend — no scheduled periods today. Enjoy it.</div>`;
                }
            } else {
                let html = `<div class="rail">`;
                PERIODS.forEach(p => {
                    if (p.key === 'LUNCH') {
                        html +=
                            `<div class="rail-item lunch"><div class="rail-dot">·</div><div class="rail-row"><span class="rail-time">Lunch · ${fmtTime(p.start)}–${fmtTime(p.end)}</span></div></div>`;
                        return;
                    }
                    const cell = schedule[day][p.key];
                    const isNow = p.key === nowKey;
                    const isPast = comparePeriod(p.key, nowKey) < 0;
                    const stateClass = isNow ? 'now' : (isPast ? 'done' : '');
                    const cellKey = p.key + '::' + cell.code;
                    const mark = todayMarks[cellKey];
                    const isFree = cell.code === '—';
                    html += `<div class="rail-item ${stateClass}">
                <div class="rail-dot">${p.key}</div>
                <div class="rail-row">
                  <div>
                    <div class="rail-subject">${cell.name}</div>
                    <div class="rail-meta">${cell.code!=='—'?cell.code+' · ':''}${cell.type} · ${fmtTime(p.start)}–${fmtTime(p.end)}</div>
                  </div>
                  ${isFree ? '' : `
                  <div class="rail-actions">
                    ${mark ? `<span class="status-tag ${mark}">${mark}</span>` : ''}
                    <button class="mini-btn present ${mark==='present'?'active':''}" title="Mark present" onclick="markAttendance('${p.key}','${cell.code}','present')">✓</button>
                    <button class="mini-btn absent ${mark==='absent'?'active':''}" title="Mark absent" onclick="markAttendance('${p.key}','${cell.code}','absent')">✕</button>
                  </div>`}
                </div>
              </div>`;
                });
                html += `</div>`;
                todayView.innerHTML = html;
            }
            const weekView = document.getElementById('weekView');
            let wh = `<div class="week-grid">`;
            wh += `<div></div>` + DAY_SHORT.map(d => `<div class="wh">${d}</div>`).join('');
            TEACH_PERIODS.forEach(p => {
                wh += `<div class="week-per">${p.key}</div>`;
                DAYS.forEach(d => {
                    const cell = schedule[d][p.key];
                    const cls = cell.type === 'Practical' ? 'p' : 'lec';
                    wh +=
                        `<div class="week-cell ${cls}"><div class="wc-code">${cell.code}</div><div class="wc-type">${cell.type}</div></div>`;
                });
            });
            wh += `</div>
            <div style="margin-top:12px;font-size:11px;color:var(--ink-soft);">
              <span class="legend-dot" style="background:var(--teal-soft);border:1px solid var(--teal);"></span>Practical block
              <span style="margin-left:14px;" class="legend-dot" style="background:var(--paper);border:1px solid var(--paper-line);"></span>Lecture / Tutorial
            </div>`;
            weekView.innerHTML = wh;
        }

        // ========== RENDER: Attendance Stats ==========
        async function renderAttendanceStats() {
            const branch = getBranch(currentUser.branchId);
            const map = await getAttendanceMap();
            const targetPct = Number(document.getElementById('targetPct').value);
            const counts = {};
            branch.subjects.forEach(s => counts[s.code] = { present: 0, absent: 0, name: s.name });
            Object.keys(map).forEach(dateStr => {
                if (holidays.has(dateStr)) return;
                const dayMap = map[dateStr];
                Object.entries(dayMap).forEach(([cellKey, status]) => {
                    const code = cellKey.split('::')[1];
                    if (counts[code]) {
                        if (status === 'present') counts[code].present++;
                        else if (status === 'absent') counts[code].absent++;
                    }
                });
            });
            let totalP = 0,
                totalA = 0;
            const statsEl = document.getElementById('subjectStats');
            let html = '';
            branch.subjects.forEach(s => {
                const c = counts[s.code];
                const total = c.present + c.absent;
                totalP += c.present;
                totalA += c.absent;
                const pct = total ? Math.round((c.present / total) * 100) : null;
                const barClass = pct === null ? '' : (pct < 65 ? 'danger' : (pct < 75 ? 'warn' : ''));
                const leave = total ? computeLeaveInfo(c.present, c.absent, targetPct) : { type: 'none' };
                let leaveLine = '';
                if (leave.type === 'skip') {
                    leaveLine = leave.value > 0 ?
                        `<div class="leave-line ok">can miss ${leave.value} more</div>` :
                        `<div class="leave-line warn">no more misses left</div>`;
                } else if (leave.type === 'attend') {
                    leaveLine = `<div class="leave-line warn">attend next ${leave.value} straight</div>`;
                }
                html += `<div class="stat-row">
              <div class="stat-label" title="${s.name}">${s.code}${leaveLine}</div>
              <div class="stat-bar-track"><div class="stat-bar-fill ${barClass}" style="width:${pct===null?0:pct}%;"></div></div>
              <div class="stat-pct">${pct===null?'—':pct+'%'}</div>
            </div>`;
            });
            statsEl.innerHTML = html ||
                `<div class="empty-note">No attendance marked yet — tick classes off as they happen.</div>`;
            const overallTotal = totalP + totalA;
            const overallPct = overallTotal ? Math.round((totalP / overallTotal) * 100) : null;
            document.getElementById('overallPct').textContent = overallPct === null ? '—' : overallPct + '%';
            document.getElementById('overallCounts').innerHTML = overallTotal ?
                `<b>${totalP}</b> attended<br><b>${totalA}</b> missed<br>of ${overallTotal} marked (excluding holidays)` :
                `Nothing marked yet this semester.`;
            const leaveEl = document.getElementById('overallLeave');
            if (!overallTotal) {
                leaveEl.innerHTML =
                    `<span style="color:var(--ink-soft);">Mark a few classes to see how much leave you can safely take toward ${targetPct}%.</span>`;
            } else {
                const overallLeave = computeLeaveInfo(totalP, totalA, targetPct);
                if (overallLeave.type === 'skip') {
                    leaveEl.innerHTML = overallLeave.value > 0 ?
                        `You're at <b>${overallPct}%</b> overall — you can take <b>${overallLeave.value}</b> more period${overallLeave.value===1?'':'s'} off and stay at or above ${targetPct}%.` :
                        `You're at <b>${overallPct}%</b>, right at the edge — one more miss will drop you below ${targetPct}%.`;
                } else {
                    leaveEl.innerHTML =
                        `You're at <b>${overallPct}%</b>, below ${targetPct}%. Attend the next <b>${overallLeave.value}</b> period${overallLeave.value===1?'':'s'} in a row (with no misses) to climb back to ${targetPct}%.`;
                }
            }
        }

        // ========== RENDER: Events ==========
        async function renderEvents() {
            const now = new Date();
            const todayStr = dateKey(now);
            let customEvents = [];
            try { const snap = await getDocs(eventOverridesCollection);
                customEvents = snap.docs.map(d => ({ ...d.data() })); } catch (e) {}
            const allEvents = [...BUILTIN_EVENTS, ...customEvents];
            const upcoming = allEvents
                .map(e => ({ ...e, endDate: new Date(e.end + 'T23:59:59') }))
                .filter(e => e.endDate >= now)
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .slice(0, 7);
            const el = document.getElementById('eventsList');
            if (!upcoming.length) { el.innerHTML =
                    `<div class="empty-note">No more scheduled events this session.</div>`; return; }
            el.innerHTML = upcoming.map(e => {
                const start = new Date(e.start + 'T00:00:00');
                const isOngoing = todayStr >= e.start && todayStr <= e.end;
                const mon = start.toLocaleDateString('en-IN', { month: 'short' });
                const day = start.getDate();
                const rangeStr = e.start === e.end ? start.toLocaleDateString('en-IN', { day: 'numeric',
                        month: 'short', year: 'numeric' }) :
                    `${start.toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – ${new Date(e.end+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`;
                return `<div class="event-item">
              <div class="event-date"><span class="d">${day}</span>${mon}</div>
              <div>
                <div class="event-title">${e.title}</div>
                <div class="event-range">${rangeStr}</div>
                ${isOngoing ? `<span class="event-badge today">ongoing</span>` : ''}
              </div>
            </div>`;
            }).join('');
        }

        // ========== RENDER: Timetable Image ==========
        function roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();
        }

        function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
            const words = text.split(' ');
            let line = '',
                ly = y,
                lines = 0;
            for (let n = 0; n < words.length; n++) {
                const test = line + words[n] + ' ';
                if (ctx.measureText(test).width > maxWidth && n > 0) {
                    ctx.fillText(line.trim(), x, ly);
                    line = words[n] + ' ';
                    ly += lineHeight;
                    lines++;
                    if (lines >= maxLines - 1) {
                        const rest = words.slice(n + 1).join(' ');
                        let last = line.trim();
                        if (rest) { while (ctx.measureText(last + '…').width > maxWidth && last.length > 0) { last = last
                                .slice(0, -1); } last += '…'; }
                        ctx.fillText(last, x, ly);
                        return;
                    }
                } else { line = test; }
            }
            ctx.fillText(line.trim(), x, ly);
        }

        function drawTimetableImage() {
            const canvas = document.getElementById('ttCanvas');
            if (!canvas || !currentUser) return;
            const branch = getBranch(currentUser.branchId);
            const dpr = window.devicePixelRatio || 1;
            const W = 1180,
                H = 760;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            const ctx = canvas.getContext('2d');
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#F7F5EE';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#152A3B';
            ctx.fillRect(0, 0, W, 92);
            ctx.fillStyle = '#E4D2A4';
            ctx.font = '600 11px "IBM Plex Mono", monospace';
            ctx.fillText('M.M.M. UNIVERSITY OF TECHNOLOGY, GORAKHPUR  ·  SESSION 2026–27', 28, 24);
            ctx.fillStyle = '#F1ECDD';
            ctx.font = '600 25px "Fraunces", serif';
            ctx.fillText(branch.name + ' — Section ' + currentUser.section, 28, 58);
            ctx.font = '400 12px "IBM Plex Mono", monospace';
            ctx.fillStyle = '#CBD6DD';
            ctx.fillText('Room: ' + branch.room, 28, 80);
            const gridLeft = 96,
                gridTop = 118;
            const dayColW = (W - 28 - gridLeft) / 5;
            const rowH = (H - gridTop - 28) / 8;
            ctx.textAlign = 'center';
            DAYS.forEach((d, i) => {
                ctx.fillStyle = '#152A3B';
                ctx.font = '700 13px "IBM Plex Sans", sans-serif';
                ctx.fillText(DAY_SHORT[i].toUpperCase(), gridLeft + dayColW * i + dayColW / 2, gridTop - 16);
            });
            TEACH_PERIODS.forEach((p, ri) => {
                const y = gridTop + rowH * ri;
                ctx.fillStyle = '#2C4258';
                ctx.font = '700 12px "IBM Plex Mono", monospace';
                ctx.fillText(p.key, 44, y + rowH / 2 - 4);
                ctx.font = '400 9px "IBM Plex Mono", monospace';
                ctx.fillStyle = '#8B8676';
                ctx.fillText(fmtTime(p.start), 44, y + rowH / 2 + 11);
                ctx.textAlign = 'left';
                DAYS.forEach((d, ci) => {
                    const x = gridLeft + dayColW * ci;
                    const cell = scheduleCache[d][p.key];
                    const isP = cell.type === 'Practical';
                    const isFree = cell.code === '—';
                    ctx.fillStyle = isFree ? '#F1EFE6' : (isP ? '#DCE9E6' : '#EDEAE0');
                    ctx.strokeStyle = '#D9D4C4';
                    ctx.lineWidth = 1;
                    roundRect(ctx, x + 3, y + 3, dayColW - 6, rowH - 6, 7);
                    ctx.fill();
                    ctx.stroke();
                    if (!isFree) {
                        ctx.fillStyle = '#152A3B';
                        ctx.font = '700 11px "IBM Plex Mono", monospace';
                        ctx.fillText(cell.code, x + 11, y + 21);
                        ctx.font = '400 9.5px "IBM Plex Sans", sans-serif';
                        ctx.fillStyle = '#2C4258';
                        wrapText(ctx, cell.name, x + 11, y + 35, dayColW - 22, 11, 3);
                        ctx.font = '500 8.5px "IBM Plex Mono", monospace';
                        ctx.fillStyle = isP ? '#2F5D5A' : '#B08A3E';
                        ctx.fillText(cell.type.toUpperCase(), x + 11, y + rowH - 9);
                    } else {
                        ctx.fillStyle = '#B7B2A0';
                        ctx.font = 'italic 9.5px "IBM Plex Sans", sans-serif';
                        ctx.fillText('Self study', x + 11, y + rowH / 2 + 3);
                    }
                    ctx.textAlign = 'left';
                });
                ctx.textAlign = 'left';
            });
            ctx.fillStyle = '#8B8676';
            ctx.font = '400 9.5px "IBM Plex Mono", monospace';
            ctx.fillText(
                'Generated by The Ledger · exact slot placement is approximate, subjects & credit hours are as per curriculum',
                28, H - 12);
        }

        function downloadTimetableImage() {
            const canvas = document.getElementById('ttCanvas');
            const branch = getBranch(currentUser.branchId);
            const link = document.createElement('a');
            link.download = branch.id + '-sec' + currentUser.section + '-timetable.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }

        // ========== RENDER: History View ==========
        function navigateHistoryDate(delta) {
            const newDate = new Date(historyDate);
            newDate.setDate(newDate.getDate() + delta);
            historyDate = newDate;
            renderHistoryView();
            document.getElementById('histPrev').disabled = false;
            document.getElementById('histNext').disabled = false;
        }

        function goToTodayHistory() {
            historyDate = new Date();
            renderHistoryView();
        }

        async function renderHistoryView() {
            const container = document.getElementById('historyView');
            if (!container) return;
            const dateObj = historyDate;
            const dateStr = dateKey(dateObj);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const displayStr = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short',
                year: 'numeric' });
            document.getElementById('histDateDisplay').textContent = displayStr;

            const map = await getAttendanceMap();
            const dayMarks = map[dateStr] || {};

            const dayIdx = dateObj.getDay();
            const isWeekend = dayIdx === 0 || dayIdx === 6;
            const dayKey = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIdx];
            const isTeachingDay = DAYS.includes(dayKey);
            const isHoliday = holidays.has(dateStr);

            if (isWeekend || !isTeachingDay) {
                container.innerHTML = `
              <div class="history-empty">${dayKey} — no classes scheduled.</div>
              <div class="history-summary">
                <span class="hstat"><span class="num" style="color:var(--ink-soft);">—</span> <span class="lbl">no periods</span></span>
              </div>
            `;
                return;
            }

            if (isHoliday) {
                container.innerHTML = `
              <div class="holiday-banner">🏖️ Holiday — no classes on this day.</div>
              <div class="history-summary">
                <span class="hstat"><span class="num" style="color:var(--ink-soft);">—</span> <span class="lbl">no attendance</span></span>
              </div>
            `;
                return;
            }

            let schedule = scheduleCache;
            if (currentUser && currentUser.branchId) {
                try {
                    const q = query(timetableOverridesCollection,
                        where('branchId', '==', currentUser.branchId),
                        where('section', '==', currentUser.section)
                    );
                    const snap = await getDocs(q);
                    snap.docs.forEach(d => {
                        const ov = d.data();
                        if (schedule[ov.day] && schedule[ov.day][ov.period]) {
                            schedule[ov.day][ov.period] = { code: ov.code, name: ov.name, type: ov.type };
                        }
                    });
                } catch (e) {}
            }

            const daySchedule = schedule[dayKey];
            if (!daySchedule) {
                container.innerHTML = `<div class="history-empty">No schedule for ${dayKey}.</div>`;
                return;
            }

            let html = `<div class="rail" style="margin-top:4px;">`;
            let presentCount = 0,
                absentCount = 0;
            PERIODS.forEach(p => {
                if (p.key === 'LUNCH') {
                    html +=
                        `<div class="rail-item lunch"><div class="rail-dot">·</div><div class="rail-row"><span class="rail-time">Lunch · ${fmtTime(p.start)}–${fmtTime(p.end)}</span></div></div>`;
                    return;
                }
                const cell = daySchedule[p.key];
                if (!cell) return;
                const cellKey = p.key + '::' + cell.code;
                const mark = dayMarks[cellKey];
                if (mark === 'present') presentCount++;
                else if (mark === 'absent') absentCount++;
                const isFree = cell.code === '—';
                const isPast = dateObj < new Date() ? 'done' : '';
                html += `<div class="rail-item ${isPast}">
              <div class="rail-dot">${p.key}</div>
              <div class="rail-row">
                <div>
                  <div class="rail-subject">${cell.name}</div>
                  <div class="rail-meta">${cell.code!=='—'?cell.code+' · ':''}${cell.type} · ${fmtTime(p.start)}–${fmtTime(p.end)}</div>
                </div>
                ${isFree ? '' : `
                <div class="rail-actions history-actions">
                  ${mark ? `<span class="status-tag ${mark}">${mark}</span>` : `<span class="status-tag" style="background:var(--paper);color:var(--ink-soft);">—</span>`}
                  <button class="mini-btn present ${mark==='present'?'active':''}" title="Mark present" onclick="markAttendanceForDate('${p.key}','${cell.code}','present','${dateStr}')">✓</button>
                  <button class="mini-btn absent ${mark==='absent'?'active':''}" title="Mark absent" onclick="markAttendanceForDate('${p.key}','${cell.code}','absent','${dateStr}')">✕</button>
                </div>`}
              </div>
            </div>`;
            });
            html += `</div>`;

            const totalMarked = presentCount + absentCount;
            html += `
            <div class="history-summary">
              <span class="hstat"><span class="num present">${presentCount}</span> <span class="lbl">present</span></span>
              <span class="hstat"><span class="num absent">${absentCount}</span> <span class="lbl">absent</span></span>
              <span class="hstat"><span class="num" style="color:var(--ink-soft);">${totalMarked}</span> <span class="lbl">marked</span></span>
              ${totalMarked > 0 ? `<span class="hstat"><span class="num" style="color:var(--teal);">${Math.round(presentCount/totalMarked*100)}%</span> <span class="lbl">today</span></span>` : ''}
            </div>
          `;

            const todayStr = dateKey(new Date());
            if (dateStr > todayStr) {
                html +=
                    `<div style="font-size:11px;color:var(--brass);background:var(--brass-soft);padding:6px 12px;border-radius:8px;margin-top:6px;">⏳ This date is in the future — you can still pre-mark attendance if you know your schedule.</div>`;
            }

            container.innerHTML = html;
        }

        // ============================================================
        // ========== CHESS CLUB ======================================
        // ============================================================

// ============================================================================
// SECTION: 85_chess_club.js
// Chess club manager (members/events/challenges/games/activity)
// Source: index.html lines 8013-8578 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================


        function toggleChessClub(show) {
            const chessView = document.getElementById('chessClubView');
            const mainShell = document.getElementById('mainShell');
            const app = document.getElementById('app');
            if (show) {
                const telegramView = document.getElementById('telegramView');
                const ledgerView = document.getElementById('ledgerView');
                if (telegramView) telegramView.style.display = 'none';
                if (ledgerView) ledgerView.style.display = 'none';
                chessView.style.display = 'block';
                mainShell.style.display = 'none';
                // Hide footer? We'll keep footer visible but it's outside shell. Actually footer is inside app but after shell? The footer is inside app but after shell. We'll hide footer too.
                const footer = document.querySelector('.app-foot');
                if (footer) footer.style.display = 'none';
                // Show chess club view
                chessView.style.display = 'block';
                // Initialize data if not loaded
                if (currentUser) {
                    initChessClub();
                }
            } else {
                chessView.style.display = 'none';
                mainShell.style.display = 'flex';
                const footer = document.querySelector('.app-foot');
                if (footer) footer.style.display = 'block';
                // Clean up Firestore real-time listeners on exit to prevent memory & network leaks
                if (window._chessMembersUnsub) { window._chessMembersUnsub(); window._chessMembersUnsub = null; }
                if (window._chessEventsUnsub) { window._chessEventsUnsub(); window._chessEventsUnsub = null; }
                if (window._chessChallengesUnsub) { window._chessChallengesUnsub(); window._chessChallengesUnsub = null; }
                if (window._chessActivityUnsub) { window._chessActivityUnsub(); window._chessActivityUnsub = null; }
                if (window._chessGamesUnsub) { window._chessGamesUnsub(); window._chessGamesUnsub = null; }
            }
        }

        function switchChessTab(tab) {
            chessCurrentTab = tab;
            document.querySelectorAll('#chessClubView .chess-tabs .tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tab);
            });
            document.querySelectorAll('#chessClubView .chess-tab-content').forEach(el => {
                el.style.display = 'none';
            });
            const target = document.getElementById('chessTab-' + tab);
            if (target) target.style.display = 'block';
            // Render content based on tab
            if (tab === 'home') renderChessHome();
            else if (tab === 'members') renderChessMembers();
            else if (tab === 'leaderboard') renderChessLeaderboard();
            else if (tab === 'events') renderChessEvents();
            else if (tab === 'challenges') renderChessChallenges();
            else if (tab === 'games') renderChessGames();
            else if (tab === 'activity') renderChessActivity();
        }

        async function initChessClub() {
            // Check if user is member
            if (currentUid) {
                const docSnap = await getDoc(doc(chessMembersCollection, currentUid));
                chessMemberStatus = docSnap.exists();
                updateChessJoinButtons();
            }
            // Load members count
            const snap = await getDocs(chessMembersCollection);
            const count = snap.size;
            document.getElementById('chessMemberCount').textContent = count;
            document.getElementById('chessMemberCount2').textContent = count + ' members';

            // Listen for changes
            if (window._chessMembersUnsub) window._chessMembersUnsub();
            window._chessMembersUnsub = onSnapshot(chessMembersCollection, (snap) => {
                const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                chessMembers = docs;
                document.getElementById('chessMemberCount').textContent = docs.length;
                document.getElementById('chessMemberCount2').textContent = docs.length + ' members';
                if (chessCurrentTab === 'home') renderChessHome();
                if (chessCurrentTab === 'members') renderChessMembers();
                if (chessCurrentTab === 'leaderboard') renderChessLeaderboard();
                // Also update challenge opponent dropdown
                populateChallengeOpponents();
            });

            if (window._chessEventsUnsub) window._chessEventsUnsub();
            window._chessEventsUnsub = onSnapshot(chessEventsCollection, (snap) => {
                chessEvents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (chessCurrentTab === 'home') renderChessHome();
                if (chessCurrentTab === 'events') renderChessEvents();
            });

            if (window._chessChallengesUnsub) window._chessChallengesUnsub();
            window._chessChallengesUnsub = onSnapshot(chessChallengesCollection, (snap) => {
                chessChallenges = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (chessCurrentTab === 'challenges') renderChessChallenges();
                if (chessCurrentTab === 'home') renderChessHome();
            });

            if (window._chessActivityUnsub) window._chessActivityUnsub();
            window._chessActivityUnsub = onSnapshot(query(chessActivityCollection, orderBy('createdAt', 'desc'), limit(20)), (snap) => {
                chessActivity = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (chessCurrentTab === 'activity') renderChessActivity();
                if (chessCurrentTab === 'home') renderChessHome();
            });

            if (window._chessGamesUnsub) window._chessGamesUnsub();
            window._chessGamesUnsub = onSnapshot(chessGamesCollection, (snap) => {
                chessGames = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (chessCurrentTab === 'games') renderChessGames();
            });

            // Initial render
            switchChessTab(chessCurrentTab);
            renderChessHome();
            populateChallengeOpponents();
            // Admin event button
            const eventCreateBtn = document.getElementById('chessEventCreateBtn');
            if (eventCreateBtn) {
                eventCreateBtn.style.display = isAdmin ? 'inline-flex' : 'none';
            }
        }

        function updateChessJoinButtons() {
            const joinBtn = document.getElementById('chessJoinBtn');
            const leaveBtn = document.getElementById('chessLeaveBtn');
            if (chessMemberStatus) {
                joinBtn.style.display = 'none';
                leaveBtn.style.display = 'inline-block';
            } else {
                joinBtn.style.display = 'inline-block';
                leaveBtn.style.display = 'none';
            }
        }

        async function handleChessJoin() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            try {
                await setDoc(doc(chessMembersCollection, currentUid), {
                    uid: currentUid,
                    name: currentUser.name,
                    username: currentUser.username,
                    branch: currentUser.branchId,
                    section: currentUser.section,
                    joinedAt: serverTimestamp(),
                    rating: 1200, // initial rating
                    wins: 0,
                    losses: 0,
                    draws: 0
                });
                chessMemberStatus = true;
                updateChessJoinButtons();
                showToast('🎉 You joined the Chess Club!');
                // Add activity
                await addDoc(chessActivityCollection, {
                    type: 'join',
                    uid: currentUid,
                    name: currentUser.name,
                    message: `${currentUser.name} joined the Chess Club`,
                    createdAt: serverTimestamp()
                });
                renderChessHome();
                renderChessMembers();
                renderChessLeaderboard();
            } catch (e) {
                showToast('Error joining: ' + e.message);
            }
        }

        async function handleChessLeave() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            if (!confirm('Are you sure you want to leave the Chess Club?')) return;
            try {
                await deleteDoc(doc(chessMembersCollection, currentUid));
                chessMemberStatus = false;
                updateChessJoinButtons();
                showToast('You left the Chess Club.');
                // Activity
                await addDoc(chessActivityCollection, {
                    type: 'leave',
                    uid: currentUid,
                    name: currentUser.name,
                    message: `${currentUser.name} left the Chess Club`,
                    createdAt: serverTimestamp()
                });
                renderChessHome();
                renderChessMembers();
                renderChessLeaderboard();
            } catch (e) {
                showToast('Error leaving: ' + e.message);
            }
        }

        function renderChessHome() {
            // Next event
            const nextEvent = chessEvents.filter(e => new Date(e.date + 'T' + (e.time || '00:00')) >= new Date()).sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')))[0];
            const nextEl = document.getElementById('chessNextEvent');
            if (nextEvent) {
                const date = new Date(nextEvent.date + 'T' + (nextEvent.time || '00:00'));
                const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                nextEl.innerHTML = `
                    <div style="font-weight:600; font-size:15px;">${nextEvent.title}</div>
                    <div style="font-size:13px; color:var(--ink-soft);">${nextEvent.timeControl || ''} • ${dateStr} ${timeStr}</div>
                `;
            } else {
                nextEl.innerHTML = `<div style="font-size:13px; color:var(--ink-soft);">No upcoming events.</div>`;
            }

            // Leaderboard preview (top 3)
            const sorted = [...chessMembers].sort((a, b) => (b.rating || 1200) - (a.rating || 1200));
            const top3 = sorted.slice(0, 3);
            const preview = document.getElementById('chessLeaderboardPreview');
            if (top3.length === 0) {
                preview.innerHTML = `<div class="empty-note">No members yet.</div>`;
            } else {
                const medals = ['🥇', '🥈', '🥉'];
                preview.innerHTML = top3.map((m, i) => `
                    <div class="leaderboard-row">
                        <div class="rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">${medals[i] || i+1}</div>
                        <div class="player">${m.name || 'Unknown'}</div>
                        <div class="rating">${m.rating || 1200}</div>
                    </div>
                `).join('');
            }

            // Recent activity preview
            const activityPreview = document.getElementById('chessActivityList');
            if (activityPreview && chessCurrentTab === 'home') {
                // we'll show only in activity tab
            }
        }

        function renderChessMembers() {
            const list = document.getElementById('chessMembersList');
            if (!list) return;
            if (chessMembers.length === 0) {
                list.innerHTML = `<div class="empty-note">No members yet. Be the first to join!</div>`;
                return;
            }
            let html = '';
            chessMembers.forEach(m => {
                const branchName = getBranch(m.branch)?.name || m.branch || '';
                const shortBranch = branchName.replace('B.Tech — ', '');
                const avatar = (m.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                html += `
                    <div class="member-item">
                        <div class="avatar">${avatar}</div>
                        <div class="info">
                            <div class="name">${m.name || 'Unknown'} ${m.uid === currentUid ? ' (you)' : ''}</div>
                            <div class="branch">${shortBranch}${m.section ? ' · Sec ' + m.section : ''}</div>
                        </div>
                        <div class="rating">${m.rating || 1200}</div>
                    </div>
                `;
            });
            list.innerHTML = html;
        }

        function renderChessLeaderboard() {
            const container = document.getElementById('chessLeaderboardFull');
            if (!container) return;
            const sorted = [...chessMembers].sort((a, b) => (b.rating || 1200) - (a.rating || 1200));
            if (sorted.length === 0) {
                container.innerHTML = `<div class="empty-note">No members yet.</div>`;
                return;
            }
            let html = '';
            sorted.forEach((m, i) => {
                const rank = i + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
                const games = (m.wins || 0) + (m.losses || 0) + (m.draws || 0);
                html += `
                    <div class="leaderboard-row">
                        <div class="rank ${rank===1?'gold':rank===2?'silver':rank===3?'bronze':''}">${medal}</div>
                        <div class="player">${m.name || 'Unknown'}</div>
                        <div style="font-size:12px; color:var(--ink-soft); flex:1;">${games} games</div>
                        <div class="rating">${m.rating || 1200}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        function renderChessEvents() {
            const container = document.getElementById('chessEventsList');
            if (!container) return;
            if (chessEvents.length === 0) {
                container.innerHTML = `<div class="empty-note">No events scheduled.</div>`;
                return;
            }
            const sorted = [...chessEvents].sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')) - new Date(b.date + 'T' + (b.time || '00:00')));
            let html = '';
            sorted.forEach(e => {
                const date = new Date(e.date + 'T' + (e.time || '00:00'));
                const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                const participants = e.participants ? e.participants.length : 0;
                const isPast = date < new Date();
                html += `
                    <div class="event-card">
                        <div class="title">${e.title} ${isPast ? ' (past)' : ''}</div>
                        <div class="details">${dateStr} ${timeStr} · ${e.timeControl || 'No time control'} · ${participants} participants</div>
                        <div class="details" style="font-size:12px;">${e.description || ''}</div>
                        <div class="actions">
                            ${!isPast && currentUser ? `<button class="btn-primary" style="margin:0; padding:4px 16px; font-size:12px;" onclick="registerForEvent('${e.id}')">Register</button>` : ''}
                            ${isAdmin ? `<button class="btn-danger" style="margin:0; padding:4px 16px; font-size:12px;" onclick="deleteChessEvent('${e.id}')">Delete</button>` : ''}
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        async function registerForEvent(eventId) {
            if (!currentUser) { showToast('Please log in first.'); return; }
            try {
                const ref = doc(chessEventsCollection, eventId);
                const snap = await getDoc(ref);
                if (!snap.exists()) { showToast('Event not found.'); return; }
                const data = snap.data();
                const participants = data.participants || [];
                if (participants.includes(currentUid)) {
                    showToast('You are already registered.');
                    return;
                }
                participants.push(currentUid);
                await updateDoc(ref, { participants });
                showToast('Registered for event!');
                renderChessEvents();
                // Activity
                await addDoc(chessActivityCollection, {
                    type: 'register',
                    uid: currentUid,
                    name: currentUser.name,
                    message: `${currentUser.name} registered for ${data.title}`,
                    createdAt: serverTimestamp()
                });
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        async function deleteChessEvent(eventId) {
            if (!confirm('Delete this event?')) return;
            try {
                await deleteDoc(doc(chessEventsCollection, eventId));
                showToast('Event deleted.');
                renderChessEvents();
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        function openChessEventForm() {
            document.getElementById('chessEventForm').style.display = 'block';
            document.getElementById('chessEventDate').value = dateKey(new Date());
            document.getElementById('chessEventTime').value = '19:00';
        }

        function closeChessEventForm() {
            document.getElementById('chessEventForm').style.display = 'none';
        }

        async function submitChessEvent(e) {
            e.preventDefault();
            if (!isAdmin) { showToast('Only admins can create events.'); return; }
            const title = document.getElementById('chessEventTitle').value.trim();
            const date = document.getElementById('chessEventDate').value;
            const time = document.getElementById('chessEventTime').value;
            const timeControl = document.getElementById('chessEventTimeControl').value.trim();
            const description = document.getElementById('chessEventDesc').value.trim();
            if (!title || !date) { showToast('Title and date are required.'); return; }
            try {
                await addDoc(chessEventsCollection, {
                    title,
                    date,
                    time,
                    timeControl: timeControl || 'N/A',
                    description,
                    participants: [],
                    createdBy: currentUid,
                    createdAt: serverTimestamp()
                });
                showToast('Event created!');
                closeChessEventForm();
                renderChessEvents();
                // Activity
                await addDoc(chessActivityCollection, {
                    type: 'event_created',
                    uid: currentUid,
                    name: currentUser.name,
                    message: `${currentUser.name} created event: ${title}`,
                    createdAt: serverTimestamp()
                });
                // Reset form
                document.getElementById('chessEventTitle').value = '';
                document.getElementById('chessEventDesc').value = '';
                document.getElementById('chessEventTimeControl').value = '';
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        function populateChallengeOpponents() {
            const sel = document.getElementById('chessChallengeOpponent');
            if (!sel) return;
            const current = sel.value;
            sel.innerHTML = '';
            chessMembers.forEach(m => {
                if (m.uid !== currentUid) {
                    const opt = document.createElement('option');
                    opt.value = m.uid;
                    opt.textContent = m.name || 'Unknown';
                    sel.appendChild(opt);
                }
            });
            if (current && sel.querySelector(`option[value="${current}"]`)) {
                sel.value = current;
            }
        }

        async function sendChessChallenge() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            const opponentUid = document.getElementById('chessChallengeOpponent').value;
            if (!opponentUid) { showToast('Select an opponent.'); return; }
            if (opponentUid === currentUid) { showToast('You cannot challenge yourself.'); return; }
            // Check if there is already a pending challenge between these two
            const existing = chessChallenges.find(c =>
                (c.challengerUid === currentUid && c.opponentUid === opponentUid && c.status === 'pending') ||
                (c.challengerUid === opponentUid && c.opponentUid === currentUid && c.status === 'pending')
            );
            if (existing) {
                showToast('A challenge is already pending between you two.');
                return;
            }
            try {
                await addDoc(chessChallengesCollection, {
                    challengerUid: currentUid,
                    opponentUid: opponentUid,
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    challengerName: currentUser.name,
                    opponentName: chessMembers.find(m => m.uid === opponentUid)?.name || 'Unknown'
                });
                showToast('Challenge sent!');
                renderChessChallenges();
                // Activity
                await addDoc(chessActivityCollection, {
                    type: 'challenge',
                    uid: currentUid,
                    name: currentUser.name,
                    message: `${currentUser.name} challenged ${chessMembers.find(m=>m.uid===opponentUid)?.name || 'Unknown'}`,
                    createdAt: serverTimestamp()
                });
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        function renderChessChallenges() {
            const container = document.getElementById('chessChallengesList');
            if (!container) return;
            // Show challenges where current user is involved
            const myChallenges = chessChallenges.filter(c => c.challengerUid === currentUid || c.opponentUid === currentUid);
            if (myChallenges.length === 0) {
                container.innerHTML = `<div class="empty-note">No challenges.</div>`;
                return;
            }
            let html = '';
            myChallenges.forEach(c => {
                const isChallenger = c.challengerUid === currentUid;
                const otherName = isChallenger ? c.opponentName || 'Unknown' : c.challengerName || 'Unknown';
                const status = c.status;
                const date = c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
                let actions = '';
                if (status === 'pending' && !isChallenger) {
                    actions = `<button class="btn-success" style="margin:0; padding:4px 12px; font-size:11px;" onclick="respondChallenge('${c.id}','accepted')">Accept</button>
                               <button class="btn-danger" style="margin:0; padding:4px 12px; font-size:11px;" onclick="respondChallenge('${c.id}','declined')">Decline</button>`;
                } else if (status === 'pending' && isChallenger) {
                    actions = `<button class="btn-danger" style="margin:0; padding:4px 12px; font-size:11px;" onclick="respondChallenge('${c.id}','cancelled')">Cancel</button>`;
                }
                html += `
                    <div class="challenge-item">
                        <div class="info">
                            <strong>${isChallenger ? 'You' : otherName}</strong> ${isChallenger ? 'challenged' : 'challenged you'} 
                            (${status}) ${date}
                        </div>
                        <div class="actions">${actions}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        async function respondChallenge(challengeId, status) {
            if (!currentUser) { showToast('Please log in first.'); return; }
            try {
                await updateDoc(doc(chessChallengesCollection, challengeId), { status });
                showToast(`Challenge ${status}.`);
                renderChessChallenges();
                // Activity
                const challenge = chessChallenges.find(c => c.id === challengeId);
                if (challenge) {
                    const msg = status === 'accepted' ? `${currentUser.name} accepted challenge from ${challenge.challengerName}` :
                        status === 'declined' ? `${currentUser.name} declined challenge from ${challenge.challengerName}` :
                        `Challenge cancelled`;
                    await addDoc(chessActivityCollection, {
                        type: 'challenge_response',
                        uid: currentUid,
                        name: currentUser.name,
                        message: msg,
                        createdAt: serverTimestamp()
                    });
                }
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        function renderChessGames() {
            const container = document.getElementById('chessGamesList');
            if (!container) return;
            // Show games where current user is involved
            const myGames = chessGames.filter(g => g.whiteUid === currentUid || g.blackUid === currentUid);
            if (myGames.length === 0) {
                container.innerHTML = `<div class="empty-note">No games recorded yet.</div>`;
                return;
            }
            let html = '';
            myGames.forEach(g => {
                const isWhite = g.whiteUid === currentUid;
                const opponent = isWhite ? g.blackName : g.whiteName;
                const result = g.result; // 'win', 'loss', 'draw'
                const resultText = result === 'win' ? (isWhite ? 'Win' : 'Loss') : result === 'loss' ? (isWhite ? 'Loss' : 'Win') : 'Draw';
                const date = g.playedAt ? new Date(g.playedAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                const ratingChange = g.ratingChange || 0;
                const resultClass = result === 'win' ? 'win' : result === 'loss' ? 'loss' : 'draw';
                html += `
                    <div class="game-item">
                        <div><span class="opponent">${opponent}</span> · ${date}</div>
                        <div><span class="result ${resultClass}">${resultText}</span> ${ratingChange !== 0 ? '(' + (ratingChange > 0 ? '+' : '') + ratingChange + ')' : ''}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        function renderChessActivity() {
            const container = document.getElementById('chessActivityList');
            if (!container) return;
            if (chessActivity.length === 0) {
                container.innerHTML = `<div class="empty-note">No activity yet.</div>`;
                return;
            }
            let html = '';
            chessActivity.forEach(a => {
                const date = a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
                html += `
                    <div style="padding:6px 0; border-bottom:1px solid var(--paper-line); font-size:13px;">
                        <span style="color:var(--ink-soft);">${date}</span> — ${a.message}
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        // Admin event form triggers
        document.addEventListener('DOMContentLoaded', () => {
            const chessEventCreateBtn = document.getElementById('chessEventCreateBtn');
            if (chessEventCreateBtn) {
                chessEventCreateBtn.addEventListener('click', openChessEventForm);
            }
        });

        // ============================================================
        // ========== COMMUNITY POSTS ==================================
        // ============================================================


// ============================================================================
// SECTION: 86_ledger.js
// The Ledger — Integrated Syllabus & Curriculum Tracker Module
// Full Firestore progress synchronization per authenticated student
// Supports 10 branches, 8 semesters, electives, units, topics & search
// ============================================================================

        let ledgerCurrentBranch = 'civil';
        let ledgerCurrentView = '1';
        let ledgerSearchQuery = '';
        let ledgerOpenCourses = new Set();
        let ledgerState = {}; // branchId -> { [key]: 1 }
        let ledgerUnsub = null;
        let ledgerSyncStatus = 'idle'; // 'idle' | 'syncing' | 'synced' | 'offline' | 'error'
        let ledgerSyncTimeout = null;

        const LEDGER_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
        const LEDGER_CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l6 6L20 6"/></svg>`;

        // Helper keys
        function getLedgerFlagKey(branch, view, code) {
            return `f|${branch}|${view}|${code}`;
        }

        function getLedgerTopicKey(branch, d, unitIdx, topicIdx) {
            return `t|${branch}|${d}|${unitIdx}|${topicIdx}`;
        }

        function getActiveLedgerBranch() {
            return LEDGER_DATA[ledgerCurrentBranch] || LEDGER_DATA['civil'];
        }

        function getLedgerCourseTopicCount(sub) {
            if (!sub.d) return 0;
            const detail = LEDGER_DETAIL[sub.d];
            if (!detail || !detail.u) return 0;
            return detail.u.reduce((acc, u) => acc + (u.p ? u.p.length : 0), 0);
        }

        function getLedgerCourseTopicsDone(branch, sub) {
            if (!sub.d) return 0;
            const detail = LEDGER_DETAIL[sub.d];
            if (!detail || !detail.u) return 0;
            const branchMap = ledgerState[branch] || {};
            let count = 0;
            detail.u.forEach((u, uIdx) => {
                if (u.p) {
                    u.p.forEach((_, tIdx) => {
                        const key = getLedgerTopicKey(branch, sub.d, uIdx, tIdx);
                        if (branchMap[key]) count++;
                    });
                }
            });
            return count;
        }

        function isLedgerCourseDone(branch, sub, view) {
            const branchMap = ledgerState[branch] || {};
            const total = getLedgerCourseTopicCount(sub);
            if (total > 0) {
                return getLedgerCourseTopicsDone(branch, sub) === total || !!branchMap[getLedgerFlagKey(branch, view, sub.code)];
            }
            return !!branchMap[getLedgerFlagKey(branch, view, sub.code)];
        }

        function isLedgerUnitDone(branch, sub, unitIdx) {
            if (!sub.d) return false;
            const detail = LEDGER_DETAIL[sub.d];
            if (!detail || !detail.u || !detail.u[unitIdx] || !detail.u[unitIdx].p) return false;
            const topics = detail.u[unitIdx].p;
            if (!topics.length) return false;
            const branchMap = ledgerState[branch] || {};
            return topics.every((_, tIdx) => !!branchMap[getLedgerTopicKey(branch, sub.d, unitIdx, tIdx)]);
        }

        function getLedgerUnitTopicsDone(branch, sub, unitIdx) {
            if (!sub.d) return 0;
            const detail = LEDGER_DETAIL[sub.d];
            if (!detail || !detail.u || !detail.u[unitIdx] || !detail.u[unitIdx].p) return 0;
            const branchMap = ledgerState[branch] || {};
            let count = 0;
            detail.u[unitIdx].p.forEach((_, tIdx) => {
                if (branchMap[getLedgerTopicKey(branch, sub.d, unitIdx, tIdx)]) count++;
            });
            return count;
        }

        function getLedgerSemTotals(branch, semView) {
            const bData = LEDGER_DATA[branch];
            if (!bData || !bData.semesters || !bData.semesters[semView]) {
                return { total: 0, done: 0, coursesTotal: 0, coursesDone: 0 };
            }
            const subjects = bData.semesters[semView];
            let totalCredits = 0;
            let doneCredits = 0;
            let coursesTotal = subjects.length;
            let coursesDone = 0;

            subjects.forEach(sub => {
                const credits = Number(sub.credits) || 0;
                totalCredits += credits;
                if (isLedgerCourseDone(branch, sub, semView)) {
                    doneCredits += credits;
                    coursesDone++;
                }
            });

            return { total: totalCredits, done: doneCredits, coursesTotal, coursesDone };
        }

        function getLedgerBranchOverallStats(branch) {
            const bData = LEDGER_DATA[branch];
            if (!bData) {
                return { totalCredits: 0, doneCredits: 0, semsTotal: 0, semsDone: 0, topicsTotal: 0, topicsDone: 0 };
            }

            let totalCredits = 0;
            let doneCredits = 0;
            let semsTotal = 0;
            let semsDone = 0;
            let topicsTotal = 0;
            let topicsDone = 0;

            if (bData.semesters) {
                Object.keys(bData.semesters).forEach(semKey => {
                    const st = getLedgerSemTotals(branch, semKey);
                    totalCredits += st.total;
                    doneCredits += st.done;
                    semsTotal++;
                    if (st.total > 0 && st.done === st.total) {
                        semsDone++;
                    }
                    bData.semesters[semKey].forEach(sub => {
                        topicsTotal += getLedgerCourseTopicCount(sub);
                        topicsDone += getLedgerCourseTopicsDone(branch, sub);
                    });
                });
            }

            if (bData.extras) {
                bData.extras.forEach(extra => {
                    if (extra.groups) {
                        extra.groups.forEach(g => {
                            if (g.subjects) {
                                g.subjects.forEach(sub => {
                                    topicsTotal += getLedgerCourseTopicCount(sub);
                                    topicsDone += getLedgerCourseTopicsDone(branch, sub);
                                });
                            }
                        });
                    }
                });
            }

            return { totalCredits, doneCredits, semsTotal, semsDone, topicsTotal, topicsDone };
        }

        // Auto-detect student branch from profile
        function detectUserBranch() {
            if (currentUser && currentUser.branchId) {
                const b = String(currentUser.branchId).toLowerCase().trim();
                if (LEDGER_DATA[b]) return b;
                // Special mapping check
                if (b === 'cse' && LEDGER_DATA['cse']) return 'cse';
                if (b === 'it' && LEDGER_DATA['it']) return 'it';
                if (b === 'ece' && LEDGER_DATA['ece']) return 'ece';
                if (b === 'eceiot' && LEDGER_DATA['eceiot']) return 'eceiot';
                if (b === 'civil' && LEDGER_DATA['civil']) return 'civil';
                if (b === 'ee' && LEDGER_DATA['ee']) return 'ee';
                if (b === 'me' && LEDGER_DATA['me']) return 'me';
                if (b === 'chemical' && LEDGER_DATA['chemical']) return 'chemical';
                if (b === 'bba' && LEDGER_DATA['bba']) return 'bba';
                if (b === 'bpharm' && LEDGER_DATA['bpharm']) return 'bpharm';
            }
            return 'civil';
        }

        // Navigation toggler
        function toggleLedgerSection(show) {
            const ledgerView = document.getElementById('ledgerView');
            const mainShell = document.getElementById('mainShell');
            const telegramView = document.getElementById('telegramView');
            const chessView = document.getElementById('chessClubView');
            if (!ledgerView) return;

            if (show) {
                if (mainShell) mainShell.style.display = 'none';
                if (telegramView) telegramView.style.display = 'none';
                if (chessView) chessView.style.display = 'none';
                ledgerView.style.display = 'block';

                try { sessionStorage.setItem('mmmut_active_view', 'ledger'); } catch (_) {}

                if (typeof window.toggleSidebar === 'function') {
                    window.toggleSidebar(false);
                }

                // Initialize branch & data if first open
                if (!ledgerState[ledgerCurrentBranch]) {
                    ledgerCurrentBranch = detectUserBranch();
                }

                attachLedgerFirestoreListener(ledgerCurrentBranch);
                renderLedgerUI();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                ledgerView.style.display = 'none';
                if (mainShell) mainShell.style.display = 'block';
                try { sessionStorage.removeItem('mmmut_active_view'); } catch (_) {}

                // Clean up Firestore listener when navigating away
                cleanupLedgerListener();
            }
        }

        function cleanupLedgerListener() {
            if (ledgerUnsub) {
                ledgerUnsub();
                ledgerUnsub = null;
            }
        }

        // Attach Realtime Firestore Listener for the selected branch
        function attachLedgerFirestoreListener(branch) {
            cleanupLedgerListener();
            if (!currentUid || (typeof auth !== 'undefined' && !auth.currentUser)) {
                // Read from local cache if unauthenticated or offline
                try {
                    const local = localStorage.getItem(`mmmut_ledger_${branch}`);
                    if (local) ledgerState[branch] = JSON.parse(local);
                } catch (_) {}
                updateLedgerSyncBadge('offline');
                renderLedgerUI();
                return;
            }

            updateLedgerSyncBadge('syncing');

            try {
                const docRef = doc(db, 'users', currentUid, 'ledgerProgress', branch);
                ledgerUnsub = onSnapshot(docRef, (snap) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        ledgerState[branch] = data.completed || {};
                    } else {
                        // Check if we have local cache to migrate/seed
                        let cached = null;
                        try {
                            const raw = localStorage.getItem(`mmmut_ledger_${branch}`);
                            if (raw) cached = JSON.parse(raw);
                        } catch (_) {}

                        if (cached && Object.keys(cached).length > 0) {
                            ledgerState[branch] = cached;
                            saveLedgerProgressToFirestore(branch);
                        } else {
                            ledgerState[branch] = {};
                        }
                    }
                    updateLedgerSyncBadge('synced');
                    renderLedgerUI();
                }, (error) => {
                    console.warn('[Ledger] Firestore progress listener warning:', error);
                    updateLedgerSyncBadge('offline');
                    // Fallback to local cache
                    try {
                        const local = localStorage.getItem(`mmmut_ledger_${branch}`);
                        if (local && !ledgerState[branch]) ledgerState[branch] = JSON.parse(local);
                    } catch (_) {}
                    renderLedgerUI();
                });
            } catch (err) {
                console.error('[Ledger] Failed to attach listener:', err);
                updateLedgerSyncBadge('error');
            }
        }

        // Debounced Firestore Save
        function saveLedgerProgress(branch) {
            // Immediately persist to local cache for instant resilience
            try {
                localStorage.setItem(`mmmut_ledger_${branch}`, JSON.stringify(ledgerState[branch] || {}));
            } catch (_) {}

            updateLedgerSyncBadge('syncing');

            if (ledgerSyncTimeout) clearTimeout(ledgerSyncTimeout);
            ledgerSyncTimeout = setTimeout(() => {
                saveLedgerProgressToFirestore(branch);
            }, 300);
        }

        async function saveLedgerProgressToFirestore(branch) {
            if (!currentUid || (typeof auth !== 'undefined' && !auth.currentUser)) {
                updateLedgerSyncBadge('offline');
                return;
            }

            try {
                const docRef = doc(db, 'users', currentUid, 'ledgerProgress', branch);
                await setDoc(docRef, {
                    branch: branch,
                    completed: ledgerState[branch] || {},
                    lastUpdated: serverTimestamp()
                }, { merge: true });
                updateLedgerSyncBadge('synced');
            } catch (err) {
                console.warn('[Ledger] Progress sync error:', err);
                updateLedgerSyncBadge('offline');
            }
        }

        function updateLedgerSyncBadge(status) {
            ledgerSyncStatus = status;
            const badge = document.getElementById('ledgerSyncBadge');
            if (!badge) return;

            if (status === 'synced') {
                badge.className = 'ledger-sync-badge synced';
                badge.innerHTML = `<span class="sync-dot"></span><span>Cloud Synced</span>`;
            } else if (status === 'syncing') {
                badge.className = 'ledger-sync-badge syncing';
                badge.innerHTML = `<span class="sync-dot"></span><span>Saving…</span>`;
            } else if (status === 'offline') {
                badge.className = 'ledger-sync-badge offline';
                badge.innerHTML = `<span class="sync-dot"></span><span>Offline Mode</span>`;
            } else {
                badge.className = 'ledger-sync-badge error';
                badge.innerHTML = `<span class="sync-dot"></span><span>Sync Paused</span>`;
            }
        }

        // Subject, Unit, and Topic action handlers
        function handleLedgerAction(act, view, code, unitIdx, topicIdx) {
            const branch = ledgerCurrentBranch;
            if (!ledgerState[branch]) ledgerState[branch] = {};
            const branchMap = ledgerState[branch];
            const bData = LEDGER_DATA[branch];
            if (!bData) return;

            // Locate subject
            let sub = null;
            if (bData.semesters && bData.semesters[view]) {
                sub = bData.semesters[view].find(s => s.code === code);
            }
            if (!sub && bData.extras) {
                const extra = bData.extras.find(x => x.id === view);
                if (extra && extra.groups) {
                    for (const g of extra.groups) {
                        const found = g.subjects.find(s => s.code === code);
                        if (found) { sub = found; break; }
                    }
                }
            }
            if (!sub) return;

            const detail = sub.d ? LEDGER_DETAIL[sub.d] : null;

            if (act === 'open') {
                if (!sub.d) return;
                const sid = `${branch}|${view}|${code}`;
                if (ledgerOpenCourses.has(sid)) {
                    ledgerOpenCourses.delete(sid);
                } else {
                    ledgerOpenCourses.add(sid);
                }
                renderLedgerCoursesOnly();
                return;
            }

            if (act === 'subj') {
                const currentlyDone = isLedgerCourseDone(branch, sub, view);
                const willBeDone = !currentlyDone;
                const fKey = getLedgerFlagKey(branch, view, sub.code);

                if (willBeDone) {
                    branchMap[fKey] = 1;
                } else {
                    delete branchMap[fKey];
                }

                if (detail && detail.u) {
                    detail.u.forEach((u, uI) => {
                        if (u.p) {
                            u.p.forEach((_, tI) => {
                                const tKey = getLedgerTopicKey(branch, sub.d, uI, tI);
                                if (willBeDone) branchMap[tKey] = 1;
                                else delete branchMap[tKey];
                            });
                        }
                    });
                }

                saveLedgerProgress(branch);
                renderLedgerUI();
                return;
            }

            if (act === 'unit') {
                const uI = parseInt(unitIdx, 10);
                if (!detail || !detail.u || !detail.u[uI]) return;
                const u = detail.u[uI];
                const unitDone = isLedgerUnitDone(branch, sub, uI);
                const willBeDone = !unitDone;

                if (u.p) {
                    u.p.forEach((_, tI) => {
                        const tKey = getLedgerTopicKey(branch, sub.d, uI, tI);
                        if (willBeDone) branchMap[tKey] = 1;
                        else delete branchMap[tKey];
                    });
                }

                // If all topics in all units are now done, we can flag whole course or remove flag if not
                delete branchMap[getLedgerFlagKey(branch, view, sub.code)];

                saveLedgerProgress(branch);
                renderLedgerUI();
                return;
            }

            if (act === 'topic') {
                const uI = parseInt(unitIdx, 10);
                const tI = parseInt(topicIdx, 10);
                if (!detail) return;
                const tKey = getLedgerTopicKey(branch, sub.d, uI, tI);

                if (branchMap[tKey]) {
                    delete branchMap[tKey];
                } else {
                    branchMap[tKey] = 1;
                }

                // Clear course whole-cleared flag so topic count determines course status
                delete branchMap[getLedgerFlagKey(branch, view, sub.code)];

                saveLedgerProgress(branch);
                renderLedgerUI();
                return;
            }
        }

        function handleLedgerBranchChange(newBranch) {
            if (!LEDGER_DATA[newBranch]) return;
            ledgerCurrentBranch = newBranch;
            ledgerCurrentView = '1';
            ledgerSearchQuery = '';
            ledgerOpenCourses.clear();
            const qEl = document.getElementById('ledgerSearchInput');
            if (qEl) qEl.value = '';

            attachLedgerFirestoreListener(ledgerCurrentBranch);
            renderLedgerUI();
        }

        function handleLedgerSemesterChange(newView) {
            ledgerCurrentView = String(newView);
            ledgerSearchQuery = '';
            const qEl = document.getElementById('ledgerSearchInput');
            if (qEl) qEl.value = '';
            renderLedgerUI();
        }

        function handleLedgerSearchInput(query) {
            ledgerSearchQuery = (query || '').trim().toLowerCase();
            const clearBtn = document.getElementById('ledgerSearchClearBtn');
            if (clearBtn) {
                clearBtn.style.display = ledgerSearchQuery ? 'inline-flex' : 'none';
            }
            renderLedgerCoursesOnly();
        }

        function clearLedgerSearch() {
            ledgerSearchQuery = '';
            const qEl = document.getElementById('ledgerSearchInput');
            if (qEl) qEl.value = '';
            const clearBtn = document.getElementById('ledgerSearchClearBtn');
            if (clearBtn) clearBtn.style.display = 'none';
            renderLedgerCoursesOnly();
        }

        // Reset branch confirmation modal
        function openLedgerResetModal() {
            const modal = document.getElementById('ledgerResetModal');
            const targetBranchName = document.getElementById('ledgerResetBranchName');
            if (targetBranchName) {
                targetBranchName.textContent = getActiveLedgerBranch().name;
            }
            if (modal) modal.classList.add('open');
        }

        function closeLedgerResetModal() {
            const modal = document.getElementById('ledgerResetModal');
            if (modal) modal.classList.remove('open');
        }

        async function confirmLedgerReset() {
            const branch = ledgerCurrentBranch;
            ledgerState[branch] = {};
            try {
                localStorage.removeItem(`mmmut_ledger_${branch}`);
            } catch (_) {}

            closeLedgerResetModal();
            saveLedgerProgress(branch);
            renderLedgerUI();
            showToast(`Progress for ${getActiveLedgerBranch().name} has been reset.`);
        }

        // Course matching for search
        function matchLedgerCourse(sub, q) {
            if (!q) return true;
            if (sub.code.toLowerCase().includes(q)) return true;
            if (sub.name.toLowerCase().includes(q)) return true;
            if (sub.d) {
                const detail = LEDGER_DETAIL[sub.d];
                if (detail) {
                    if (detail.c && detail.c.toLowerCase().includes(q)) return true;
                    if (detail.u) {
                        for (const u of detail.u) {
                            if (u.t && u.t.toLowerCase().includes(q)) return true;
                            if (u.p && u.p.some(topic => topic.toLowerCase().includes(q))) return true;
                        }
                    }
                }
            }
            return false;
        }

        // Render functions
        function renderLedgerUI() {
            const container = document.getElementById('ledgerView');
            if (!container) return;

            renderLedgerBranchSelector();
            renderLedgerSummaryStats();
            renderLedgerSemesterChips();
            renderLedgerCoursesOnly();
            // Keep the dashboard Syllabus Tracker preview in sync (single source: Ledger state).
            if (typeof renderDashboardLedgerPreview === 'function') {
                try { renderDashboardLedgerPreview(); } catch (_) {}
            }
        }

        function renderLedgerBranchSelector() {
            const sel = document.getElementById('ledgerBranchSelect');
            if (!sel) return;

            if (sel.options.length === 0) {
                let opts = '';
                Object.keys(LEDGER_DATA).forEach(k => {
                    opts += `<option value="${k}">${escapeHtml(LEDGER_DATA[k].name)}</option>`;
                });
                sel.innerHTML = opts;
            }
            sel.value = ledgerCurrentBranch;
        }

        function renderLedgerSummaryStats() {
            const branch = ledgerCurrentBranch;
            const stats = getLedgerBranchOverallStats(branch);
            const semTotals = getLedgerSemTotals(branch, ledgerCurrentView);

            const pct = stats.totalCredits > 0 ? Math.round((stats.doneCredits / stats.totalCredits) * 100) : 0;
            const remainingTopics = Math.max(0, stats.topicsTotal - stats.topicsDone);

            const elTotalCreds = document.getElementById('ledgerStatCredits');
            if (elTotalCreds) elTotalCreds.textContent = `${stats.doneCredits} / ${stats.totalCredits}`;

            const elPct = document.getElementById('ledgerStatPct');
            if (elPct) elPct.textContent = `${pct}%`;

            const elTopicsDone = document.getElementById('ledgerStatTopicsDone');
            if (elTopicsDone) elTopicsDone.textContent = `${stats.topicsDone}`;

            const elTopicsRem = document.getElementById('ledgerStatTopicsRemaining');
            if (elTopicsRem) elTopicsRem.textContent = `${remainingTopics}`;

            const elSemProgress = document.getElementById('ledgerStatSemProgress');
            if (elSemProgress) {
                const isEx = !!(LEDGER_DATA[branch].extras || []).find(x => x.id === ledgerCurrentView);
                if (isEx) {
                    elSemProgress.textContent = `Electives / Special Track`;
                } else {
                    const semPct = semTotals.total > 0 ? Math.round((semTotals.done / semTotals.total) * 100) : 0;
                    elSemProgress.textContent = `${semTotals.done}/${semTotals.total} credits (${semPct}%)`;
                }
            }

            const bar = document.getElementById('ledgerSemProgressBar');
            if (bar) {
                const semPct = semTotals.total > 0 ? Math.round((semTotals.done / semTotals.total) * 100) : 0;
                bar.style.width = `${semPct}%`;
            }

            const footerBranchName = document.getElementById('ledgerFooterBranchName');
            if (footerBranchName) {
                footerBranchName.textContent = getActiveLedgerBranch().name;
            }
        }

        function renderLedgerSemesterChips() {
            const strip = document.getElementById('ledgerSemesterStrip');
            if (!strip) return;

            const bData = getActiveLedgerBranch();
            let html = '';

            if (bData.semesters) {
                const sems = Object.keys(bData.semesters).map(Number).sort((a, b) => a - b);
                sems.forEach(s => {
                    const sStr = String(s);
                    const totals = getLedgerSemTotals(ledgerCurrentBranch, sStr);
                    const isDone = totals.total > 0 && totals.done === totals.total;
                    const isActive = sStr === ledgerCurrentView && !ledgerSearchQuery;
                    const roman = LEDGER_ROMAN[s - 1] || s;

                    html += `<button type="button" class="ledger-chip ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}" 
                        onclick="handleLedgerSemesterChange('${sStr}')" title="Semester ${roman}">
                        <span>Sem ${roman}</span>
                        ${isDone ? `<span class="chip-check">✓</span>` : ''}
                    </button>`;
                });
            }

            if (bData.extras && bData.extras.length > 0) {
                html += `<div class="ledger-chip-divider"></div>`;
                bData.extras.forEach(extra => {
                    const isActive = extra.id === ledgerCurrentView && !ledgerSearchQuery;
                    html += `<button type="button" class="ledger-chip text-chip ${isActive ? 'active' : ''}" 
                        onclick="handleLedgerSemesterChange('${extra.id}')" title="${escapeHtml(extra.label)}">
                        <span>${escapeHtml(extra.label)}</span>
                    </button>`;
                });
            }

            strip.innerHTML = html;
        }

        function renderLedgerCoursesOnly() {
            const listEl = document.getElementById('ledgerCourseList');
            if (!listEl) return;

            const branch = ledgerCurrentBranch;
            const bData = getActiveLedgerBranch();
            let html = '';

            if (ledgerSearchQuery) {
                // Search across all views
                let matchesCount = 0;
                const searchResults = [];

                // Semesters
                if (bData.semesters) {
                    Object.keys(bData.semesters).forEach(semKey => {
                        const semLabel = `Sem ${LEDGER_ROMAN[Number(semKey) - 1] || semKey}`;
                        bData.semesters[semKey].forEach(sub => {
                            if (matchLedgerCourse(sub, ledgerSearchQuery)) {
                                searchResults.push({ sub, view: semKey, tag: semLabel });
                            }
                        });
                    });
                }

                // Extras
                if (bData.extras) {
                    bData.extras.forEach(extra => {
                        if (extra.groups) {
                            extra.groups.forEach(g => {
                                if (g.subjects) {
                                    g.subjects.forEach(sub => {
                                        if (matchLedgerCourse(sub, ledgerSearchQuery)) {
                                            searchResults.push({ sub, view: extra.id, tag: extra.label });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }

                if (searchResults.length === 0) {
                    listEl.innerHTML = `
                        <div class="ledger-empty-state">
                            <div class="empty-icon">🔍</div>
                            <h4>No matching courses or topics</h4>
                            <p>No results found for "${escapeHtml(ledgerSearchQuery)}" in ${escapeHtml(bData.name)}. Try searching for keywords like "beams", "circuits", "matrix", or a subject code.</p>
                            <button class="btn-secondary" onclick="clearLedgerSearch()" style="margin-top:10px;">Clear Search</button>
                        </div>`;
                    return;
                }

                html += `<div class="ledger-search-banner">Found <strong>${searchResults.length}</strong> matching courses & topics in <strong>${escapeHtml(bData.name)}</strong>:</div>`;
                html += `<div class="ledger-courses-table">`;
                searchResults.forEach(item => {
                    html += renderLedgerCourseRow(item.sub, item.view, item.tag);
                });
                html += `</div>`;
                listEl.innerHTML = html;
                return;
            }

            // Normal Semester / Extra View
            const extra = (bData.extras || []).find(x => x.id === ledgerCurrentView);
            if (extra) {
                if (extra.groups && extra.groups.length > 0) {
                    extra.groups.forEach(g => {
                        html += `<div class="ledger-group-heading">
                            <h4>${escapeHtml(g.title)}</h4>
                            <span class="group-count">${g.subjects ? g.subjects.length : 0} subjects</span>
                        </div>`;
                        html += `<div class="ledger-courses-table">`;
                        if (g.subjects) {
                            g.subjects.forEach(s => {
                                html += renderLedgerCourseRow(s, ledgerCurrentView, null);
                            });
                        }
                        html += `</div>`;
                    });
                }
            } else {
                const subjects = (bData.semesters && bData.semesters[ledgerCurrentView]) || [];
                if (subjects.length === 0) {
                    listEl.innerHTML = `
                        <div class="ledger-empty-state">
                            <div class="empty-icon">📚</div>
                            <h4>No courses listed for Semester ${LEDGER_ROMAN[Number(ledgerCurrentView) - 1] || ledgerCurrentView}</h4>
                            <p>Curriculum records are being updated for this semester.</p>
                        </div>`;
                    return;
                }

                html += `<div class="ledger-courses-table">`;
                subjects.forEach(s => {
                    html += renderLedgerCourseRow(s, ledgerCurrentView, null);
                });
                html += `</div>`;
            }

            listEl.innerHTML = html;
        }

        function renderLedgerCourseRow(sub, view, tag) {
            const branch = ledgerCurrentBranch;
            const sid = `${branch}|${view}|${sub.code}`;
            const detail = sub.d ? LEDGER_DETAIL[sub.d] : null;
            const totalTopics = getLedgerCourseTopicCount(sub);
            const doneTopics = totalTopics > 0 ? getLedgerCourseTopicsDone(branch, sub) : 0;
            const courseDone = isLedgerCourseDone(branch, sub, view);
            const isPartial = !courseDone && doneTopics > 0;
            const isOpen = ledgerOpenCourses.has(sid) && detail;
            const pct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

            let rowHtml = `
            <div class="ledger-course-item ${courseDone ? 'course-done' : ''} ${isOpen ? 'course-open' : ''}">
                <div class="ledger-course-header">
                    <!-- Checkbox -->
                    <button type="button" class="ledger-cb ${courseDone ? 'checked' : ''} ${isPartial ? 'partial' : ''}" 
                        onclick="handleLedgerAction('subj', '${view}', '${escapeHtml(sub.code)}')"
                        role="checkbox" aria-checked="${courseDone}" aria-label="Mark ${escapeHtml(sub.name)} completed">
                        ${LEDGER_CHECK_SVG}
                    </button>

                    <!-- Code Badge -->
                    <div class="ledger-course-code">${escapeHtml(sub.code)}</div>

                    <!-- Course Title & Progress Bar -->
                    <div class="ledger-course-main" onclick="handleLedgerAction('open', '${view}', '${escapeHtml(sub.code)}')">
                        <div class="ledger-course-title-wrap">
                            <span class="ledger-course-title">${escapeHtml(sub.name)}</span>
                            ${tag ? `<span class="ledger-sem-tag">${escapeHtml(tag)}</span>` : ''}
                        </div>
                        <div class="ledger-course-meta-inline">
                            ${totalTopics > 0 ? `
                                <div class="ledger-mini-bar-wrap">
                                    <div class="ledger-mini-bar"><i style="width:${pct}%"></i></div>
                                    <span class="ledger-mini-label">${doneTopics} of ${totalTopics} topics (${pct}%)</span>
                                </div>
                            ` : `
                                <span class="ledger-not-loaded-tag">Unit syllabus not loaded · mark course as a whole</span>
                            `}
                        </div>
                    </div>

                    <!-- L-T-P (Desktop / Tablet) -->
                    <div class="ledger-course-ltp" title="Lecture-Tutorial-Practical">${escapeHtml(sub.ltp || '—')}</div>

                    <!-- Credits -->
                    <div class="ledger-course-credits" title="Credits">${sub.credits != null ? sub.credits + ' cr' : '—'}</div>

                    <!-- Expand Chevron -->
                    <button type="button" class="ledger-expand-btn ${isOpen ? 'open' : ''}" 
                        onclick="handleLedgerAction('open', '${view}', '${escapeHtml(sub.code)}')"
                        aria-label="Toggle details for ${escapeHtml(sub.name)}" ${detail ? '' : 'disabled style="opacity:0.3;"'}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>`;

            if (isOpen && detail) {
                rowHtml += renderLedgerCourseDetailsPanel(sub, view, detail);
            }

            rowHtml += `</div>`;
            return rowHtml;
        }

        function renderLedgerCourseDetailsPanel(sub, view, detail) {
            const branch = ledgerCurrentBranch;
            let panel = `<div class="ledger-course-details-panel">`;

            // Metadata card
            panel += `<div class="ledger-detail-meta-grid">`;
            if (detail.c) panel += `<div class="meta-item"><span class="meta-label">Category</span><span class="meta-val">${escapeHtml(detail.c)}</span></div>`;
            if (detail.p) panel += `<div class="meta-item"><span class="meta-label">Prerequisites</span><span class="meta-val">${escapeHtml(detail.p)}</span></div>`;
            if (detail.k) panel += `<div class="meta-item"><span class="meta-label">Contact Hours</span><span class="meta-val">${escapeHtml(detail.k)}</span></div>`;
            if (detail.cr != null) panel += `<div class="meta-item"><span class="meta-label">Credits</span><span class="meta-val">${detail.cr}</span></div>`;
            if (detail.a) panel += `<div class="meta-item full-width"><span class="meta-label">Evaluation Scheme</span><span class="meta-val">${escapeHtml(detail.a)}</span></div>`;
            panel += `</div>`;

            // Objectives
            if (detail.o) {
                panel += `
                <div class="ledger-section-block">
                    <h5 class="ledger-section-title">Course Objectives</h5>
                    <p class="ledger-section-text">${escapeHtml(detail.o)}</p>
                </div>`;
            }

            // Outcomes
            if (detail.co && detail.co.length > 0) {
                panel += `
                <div class="ledger-section-block">
                    <h5 class="ledger-section-title">Course Outcomes</h5>
                    <ul class="ledger-outcomes-list">
                        ${detail.co.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
                    </ul>
                </div>`;
            }

            // Units & Topics
            if (detail.u && detail.u.length > 0) {
                panel += `
                <div class="ledger-section-block">
                    <div class="ledger-section-header-flex">
                        <h5 class="ledger-section-title">Units &amp; Topic Syllabus</h5>
                        <span class="ledger-section-sub">Tick individual topics or whole units as covered</span>
                    </div>
                    <div class="ledger-units-accordion">`;

                detail.u.forEach((u, uIdx) => {
                    const uTotal = u.p ? u.p.length : 0;
                    const uDone = getLedgerUnitTopicsDone(branch, sub, uIdx);
                    const unitComplete = uTotal > 0 && uDone === uTotal;
                    const unitPartial = !unitComplete && uDone > 0;

                    panel += `
                    <div class="ledger-unit-card">
                        <div class="ledger-unit-header">
                            <button type="button" class="ledger-cb unit-cb ${unitComplete ? 'checked' : ''} ${unitPartial ? 'partial' : ''}" 
                                onclick="handleLedgerAction('unit', '${view}', '${escapeHtml(sub.code)}', ${uIdx})"
                                role="checkbox" aria-checked="${unitComplete}" aria-label="Mark Unit ${escapeHtml(u.l)} completed">
                                ${LEDGER_CHECK_SVG}
                            </button>
                            <div class="ledger-unit-title-wrap">
                                <span class="ledger-unit-badge">Unit ${escapeHtml(u.l)}</span>
                                <span class="ledger-unit-title">${escapeHtml(u.t || 'Topics')}</span>
                            </div>
                            <div class="ledger-unit-metrics">
                                ${u.h ? `<span class="unit-hours">${u.h} hrs</span>` : ''}
                                <span class="unit-counter">${uDone}/${uTotal} covered</span>
                            </div>
                        </div>

                        <!-- Topics Grid -->
                        <div class="ledger-topics-grid">`;

                    if (u.p) {
                        u.p.forEach((topicText, tIdx) => {
                            const isTopicChecked = !!(ledgerState[branch] && ledgerState[branch][getLedgerTopicKey(branch, sub.d, uIdx, tIdx)]);
                            panel += `
                            <div class="ledger-topic-item ${isTopicChecked ? 'topic-done' : ''}" 
                                onclick="handleLedgerAction('topic', '${view}', '${escapeHtml(sub.code)}', ${uIdx}, ${tIdx})">
                                <button type="button" class="ledger-cb topic-cb ${isTopicChecked ? 'checked' : ''}" 
                                    tabindex="-1" aria-hidden="true">
                                    ${LEDGER_CHECK_SVG}
                                </button>
                                <span class="ledger-topic-text">${escapeHtml(topicText)}</span>
                            </div>`;
                        });
                    }

                    panel += `</div></div>`;
                });

                panel += `</div></div>`;
            }

            // Reference Books
            if (detail.b && detail.b.length > 0) {
                panel += `
                <div class="ledger-section-block">
                    <h5 class="ledger-section-title">Recommended Books &amp; Textbooks</h5>
                    <ol class="ledger-books-list">
                        ${detail.b.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
                    </ol>
                </div>`;
            }

            panel += `</div>`;
            return panel;
        }


        let telegramAppUnsub = null;
        let currentTelegramAppState = 'NOT_APPLIED';
        let currentTelegramAppData = null;
        let telegramTokenWatcherTimer = null;

        async function getIdTokenSafe() {
            try {
                if (typeof auth !== 'undefined' && auth.currentUser) {
                    return await auth.currentUser.getIdToken();
                }
            } catch (_) {}
            return null;
        }

        async function fetchChannelInviteLink() {
            const cfg = window.TELEGRAM_CONFIG || (typeof TELEGRAM_CONFIG !== 'undefined' ? TELEGRAM_CONFIG : {});

            // Attempt to retrieve real private invite link from backend (auth required)
            if (typeof apiGetTelegramChannelInvite === 'function') {
                try {
                    const idToken = await getIdTokenSafe();
                    const res = await apiGetTelegramChannelInvite(idToken);
                    if (res && res.ok && res.inviteLink) {
                        const link = String(res.inviteLink).trim();
                        if (link && !link.includes('mmmut_erp_bot') && !link.includes('mmmut_erp_official')) {
                            cfg.channelUrl = link;
                            if (res.channelName) cfg.channelName = res.channelName;
                            return link;
                        }
                    }
                } catch (e) {
                    console.warn('[Telegram] Could not fetch channel invite link from backend:', e);
                }
            }

            // No hardcoded fallback: invite must come from the server after auth.
            return cfg.channelUrl || null;
        }

        function openTelegramWeb(sameTab = false) {
            const url = (window.TELEGRAM_CONFIG && window.TELEGRAM_CONFIG.webUrl) ||
                (typeof TELEGRAM_CONFIG !== 'undefined' && TELEGRAM_CONFIG.webUrl) ||
                'https://web.telegram.org/k/';
            if (sameTab) {
                try { sessionStorage.setItem('mmmut_active_view', 'telegram'); } catch (_) {}
                window.location.href = url;
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        }

        async function openTelegramChannel() {
            const inviteUrl = await fetchChannelInviteLink();
            if (!inviteUrl) {
                showToast('⚠️ Private channel invite link is not configured on the server yet. Please contact the administrator.');
                return;
            }
            try {
                window.open(inviteUrl, '_blank', 'noopener,noreferrer');
            } catch (_) {}
            launchTelegramDestination(inviteUrl, 'Roomhub (Private Channel)');
        }

        function launchTelegramDestination(url, title = 'Telegram Channel Access') {
            if (!url) return;
            const container = document.getElementById('telegramLaunchPortal');
            if (container) {
                container.style.display = 'block';
                const titleEl = document.getElementById('tgPortalTitle');
                if (titleEl) titleEl.textContent = title;
                const urlEl = document.getElementById('tgPortalUrl');
                if (urlEl) urlEl.textContent = url;
                const webBtn = document.getElementById('btnPortalOpenWeb');
                if (webBtn) {
                    webBtn.onclick = () => {
                        try { sessionStorage.setItem('mmmut_active_view', 'telegram'); } catch (_) {}
                        window.location.href = url;
                    };
                }
                const tabBtn = document.getElementById('btnPortalOpenTab');
                if (tabBtn) {
                    tabBtn.onclick = () => {
                        window.open(url, '_blank', 'noopener,noreferrer');
                    };
                }
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        }

        function closeTelegramPortal() {
            const container = document.getElementById('telegramLaunchPortal');
            if (container) container.style.display = 'none';
        }

        // ============================================================================
        // REAL-TIME LISTENER FOR STUDENT'S TELEGRAM APPLICATION
        // ============================================================================
        function setupTelegramAppListener(uid) {
            if (telegramAppUnsub) {
                try { telegramAppUnsub(); } catch (_) {}
                telegramAppUnsub = null;
            }
            if (!uid) {
                currentTelegramAppState = 'NOT_APPLIED';
                currentTelegramAppData = null;
                renderTelegramUI();
                return;
            }

            try {
                const appDocRef = doc(telegramApplicationsCollection, uid);
                telegramAppUnsub = onSnapshot(appDocRef, (snap) => {
                    if (!snap.exists()) {
                        currentTelegramAppState = 'NOT_APPLIED';
                        currentTelegramAppData = null;
                    } else {
                        currentTelegramAppData = snap.data();
                        const rawStatus = currentTelegramAppData.status || 'PENDING_ADMIN_APPROVAL';
                        // Decouple Stage 1 (ERP Admin) from Stage 2 (Telegram Connection)
                        if (rawStatus === 'ADMIN_APPROVED' && !currentTelegramAppData.telegramUserId) {
                            currentTelegramAppState = 'TELEGRAM_NOT_CONNECTED';
                        } else {
                            currentTelegramAppState = rawStatus;
                        }
                    }
                    renderTelegramUI();
                }, (err) => {
                    console.warn('[Telegram] Listener notice:', err.message);
                });
            } catch (err) {
                console.error('[Telegram] Failed to attach application listener:', err);
            }
        }

        // ============================================================================
        // STATE TRANSITION ACTIONS (STUDENT FACING)
        // ============================================================================

        // Stage 1: Student submits application for ERP Admin Review
        async function applyForTelegramAccess() {
            if (!currentUser || !currentUid) {
                showToast('Please sign in to apply for Telegram access.');
                return;
            }

            const btn = document.getElementById('btnApplyTelegram');
            if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

            try {
                const studentName = (currentProfile && (currentProfile.name || currentProfile.displayName)) ||
                    (currentUser && currentUser.displayName) || 'Student';
                const studentRoll = (currentProfile && (currentProfile.rollNumber || currentProfile.pendingRollNumber)) || '';
                const studentBranch = (currentProfile && currentProfile.branchId) || '';
                const studentUsername = (currentProfile && currentProfile.username) || '';

                const appDoc = {
                    uid: currentUid,
                    studentName: studentName,
                    studentRoll: studentRoll,
                    studentBranch: studentBranch,
                    studentUsername: studentUsername,
                    status: 'PENDING_ADMIN_APPROVAL',
                    appliedAt: serverTimestamp(),
                    reviewedAt: null,
                    reviewedBy: null,
                    rejectionReason: null,
                    telegramUserId: null,
                    telegramUsername: null
                };

                await setDoc(doc(telegramApplicationsCollection, currentUid), appDoc);
                showToast('✅ Application submitted for ERP Administrator approval.');
            } catch (err) {
                console.error('[Telegram] Error submitting application:', err);
                showToast('Failed to submit application: ' + (err.message || 'Permission denied'));
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = 'Apply for Telegram Access'; }
            }
        }

        // Re-apply if previously rejected by admin
        async function reapplyForTelegramAccess() {
            if (!currentUser || !currentUid) return;
            const btn = document.getElementById('btnReapplyTelegram');
            if (btn) { btn.disabled = true; btn.textContent = 'Re-submitting…'; }

            try {
                await updateDoc(doc(telegramApplicationsCollection, currentUid), {
                    status: 'PENDING_ADMIN_APPROVAL',
                    appliedAt: serverTimestamp(),
                    rejectionReason: null
                });
                showToast('✅ Application re-submitted for Administrator review.');
            } catch (err) {
                console.error('[Telegram] Reapply error:', err);
                showToast('Error re-applying: ' + err.message);
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = 'Re-apply for Access'; }
            }
        }

        // Stage 2, Step A: Connect Telegram Identity via Official Deep-link (/start <token>)
        async function connectTelegramAccount() {
            if (!currentUser || !currentUid) return;
            const btn = document.getElementById('btnConnectTelegram');
            if (btn) { btn.disabled = true; btn.textContent = 'Generating Link…'; }

            try {
                const idToken = await getIdTokenSafe();

                // Request single-use linking token from server-side backend
                const res = typeof apiCreateTelegramToken === 'function' ?
                    await apiCreateTelegramToken(currentUid, idToken) : null;

                if (res && res.ok && res.deepLink) {
                    window.open(res.deepLink, '_blank', 'noopener,noreferrer');
                    showToast('Opening Telegram bot… Press Start in Telegram to link.');
                    startTelegramTokenWatcher(res.token, idToken);
                } else {
                    showToast('Could not generate Telegram link. Please try again after login.');
                }
            } catch (err) {
                console.error('[Telegram] Error connecting Telegram:', err);
                showToast('Could not initiate Telegram connection.');
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = 'Connect Telegram Account'; }
            }
        }

        // Polling watcher while student links with bot on Telegram
        function startTelegramTokenWatcher(token, idToken) {
            if (telegramTokenWatcherTimer) {
                clearInterval(telegramTokenWatcherTimer);
                telegramTokenWatcherTimer = null;
            }

            let attempts = 0;
            telegramTokenWatcherTimer = setInterval(async () => {
                attempts++;
                if (attempts > 40) { // 2 minutes max
                    clearInterval(telegramTokenWatcherTimer);
                    telegramTokenWatcherTimer = null;
                    return;
                }

                if (typeof apiGetTelegramTokenStatus === 'function') {
                    const fresh = idToken || await getIdTokenSafe();
                    const statusRes = await apiGetTelegramTokenStatus(token, fresh);
                    if (statusRes && statusRes.ok && statusRes.linked) {
                        clearInterval(telegramTokenWatcherTimer);
                        telegramTokenWatcherTimer = null;

                        // Token is single-use and consumed server-side; webhook
                        // already recorded the link. Refresh from Firestore listener.
                        showToast('🎉 Telegram account connected successfully!');
                    }
                }
            }, 3000);
        }

        // Fallback helper to record handle if bot server is unreachable
        async function promptManualTelegramHandle() {
            const handle = prompt('Enter your Telegram @username to link with your ERP profile:');
            if (!handle) return;
            const clean = handle.trim().replace(/^@/, '');
            if (!clean) return;

            try {
                await updateDoc(doc(telegramApplicationsCollection, currentUid), {
                    telegramUsername: clean,
                    telegramUserId: clean,
                    status: 'JOIN_REQUEST_NOT_SENT',
                    linkedAt: serverTimestamp()
                });
                showToast('Telegram username saved. Proceed to request channel access.');
            } catch (e) {
                showToast('Failed to save Telegram handle: ' + e.message);
            }
        }

        // Stage 2, Step B: Student requests to join the private channel
        async function requestChannelJoin() {
            if (!currentUser || !currentUid) return;
            const btn = document.getElementById('btnRequestJoinChannel');
            if (btn) { btn.disabled = true; btn.textContent = 'Resolving Link…'; }

            try {
                // Fetch private channel invite link
                const inviteUrl = await fetchChannelInviteLink();
                if (!inviteUrl) {
                    showToast('⚠️ Private channel invite link is not configured on the server yet. Please contact the administrator.');
                    return;
                }

                // Open private channel join request link safely
                try {
                    window.open(inviteUrl, '_blank', 'noopener,noreferrer');
                } catch (_) {}
                launchTelegramDestination(inviteUrl, 'Roomhub (Private Channel Join Request)');

                // Update state to JOIN_REQUEST_PENDING
                await updateDoc(doc(telegramApplicationsCollection, currentUid), {
                    status: 'JOIN_REQUEST_PENDING',
                    joinRequestedAt: serverTimestamp()
                });

                showToast('Join link opened. Once you request in Telegram, wait for channel admin approval.');
            } catch (err) {
                console.error('[Telegram] Error recording join request:', err);
                showToast('Failed to record join request: ' + err.message);
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = 'Request to Join Private Channel'; }
            }
        }

        // Stage 2, Step C: Check membership status via Telegram getChatMember
        async function checkMembershipStatus() {
            if (!currentUser || !currentUid) return;
            const btn = document.getElementById('btnCheckMembership');
            if (btn) { btn.disabled = true; btn.textContent = 'Checking Status…'; }

            try {
                const tgUserId = currentTelegramAppData?.telegramUserId;
                const idToken = await getIdTokenSafe();

                let checkRes = null;
                if (typeof apiCheckTelegramMembership === 'function') {
                    checkRes = await apiCheckTelegramMembership(currentUid, tgUserId, idToken);
                }

                if (checkRes && checkRes.ok) {
                    if (checkRes.isMember || checkRes.status === 'CHANNEL_APPROVED') {
                        // User is an active member
                        await updateDoc(doc(telegramApplicationsCollection, currentUid), {
                            status: 'CHANNEL_APPROVED',
                            verifiedAt: serverTimestamp()
                        });
                        showToast('🎉 Membership verified! Welcome to the private channel.');
                    } else if (checkRes.status === 'CHANNEL_REJECTED' && checkRes.rejectionEvidence) {
                        // Reliable evidence of rejection
                        await updateDoc(doc(telegramApplicationsCollection, currentUid), {
                            status: 'CHANNEL_REJECTED',
                            reviewedAt: serverTimestamp()
                        });
                        showToast('Your channel join request was declined by the administrator.');
                    } else {
                        // USER CORRECTION ENFORCEMENT:
                        // If not currently a member, REMAINS JOIN_REQUEST_PENDING!
                        // Do NOT falsely display CHANNEL_REJECTED.
                        showToast('⏳ Your join request is still pending channel administrator approval.');
                    }
                } else {
                    // Backend unavailable or fallback
                    showToast('Status check: still awaiting channel administrator approval.');
                }
            } catch (err) {
                console.error('[Telegram] Membership check error:', err);
                showToast('Could not verify membership right now. Please try again.');
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = '🔄 Check Membership Status'; }
            }
        }

        // ============================================================================
        // UI RENDERING FOR THE 8 STATES
        // ============================================================================
        function renderTelegramUI() {
            const container = document.getElementById('telegramStateContainer');
            if (!container) return;

            const state = currentTelegramAppState || 'NOT_APPLIED';
            const data = currentTelegramAppData || {};

            let html = '';

            switch (state) {
                case 'NOT_APPLIED':
                    html = `
                    <div class="tg-state-card">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Stage 1 of 2</span>
                            <span class="tg-status-badge tg-badge-neutral">Not Applied</span>
                        </div>
                        <h3 class="tg-state-title">Apply for University Telegram Access</h3>
                        <p class="tg-state-desc">
                            Access to the private university channel is restricted to verified MMMUT students.
                            First, submit your application for ERP Administrator verification.
                        </p>
                        <div class="tg-applicant-box">
                            <div class="tg-info-row"><span>Student Name:</span> <strong>${escapeHtml((currentProfile && (currentProfile.name || currentProfile.displayName)) || (currentUser && currentUser.displayName) || 'Student')}</strong></div>
                            <div class="tg-info-row"><span>Roll Number:</span> <strong>${escapeHtml((currentProfile && (currentProfile.rollNumber || currentProfile.pendingRollNumber)) || '—')}</strong></div>
                            <div class="tg-info-row"><span>Branch:</span> <strong>${escapeHtml(getBranchName((currentProfile && currentProfile.branchId) || ''))}</strong></div>
                        </div>
                        <div class="tg-actions">
                            <button id="btnApplyTelegram" class="btn-primary" onclick="applyForTelegramAccess()">
                                <span>Apply for Telegram Access</span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>`;
                    break;

                case 'PENDING_ADMIN_APPROVAL':
                    html = `
                    <div class="tg-state-card">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Stage 1 of 2</span>
                            <span class="tg-status-badge tg-badge-warning">⏳ Pending ERP Admin Review</span>
                        </div>
                        <h3 class="tg-state-title">Application Under Review</h3>
                        <p class="tg-state-desc">
                            Your application has been received and is queued for verification by an ERP Administrator.
                            Once approved, you will be invited to link your Telegram account and join the private channel.
                        </p>
                        <div class="tg-timeline-note">
                            <span>🕒</span>
                            <span>Submitted: ${data.appliedAt ? formatDate(data.appliedAt) : 'Just now'}. Reviews typically complete within 24 hours.</span>
                        </div>
                    </div>`;
                    break;

                case 'ADMIN_REJECTED':
                    html = `
                    <div class="tg-state-card tg-card-danger">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Stage 1 of 2</span>
                            <span class="tg-status-badge tg-badge-danger">❌ Application Not Approved</span>
                        </div>
                        <h3 class="tg-state-title">ERP Access Request Declined</h3>
                        <p class="tg-state-desc">
                            Your application for Telegram access was reviewed and declined by the ERP administrator.
                        </p>
                        ${data.rejectionReason ? `
                        <div class="tg-reason-box">
                            <strong>Reason:</strong> ${escapeHtml(data.rejectionReason)}
                        </div>` : ''}
                        <div class="tg-actions">
                            <button id="btnReapplyTelegram" class="btn-primary" onclick="reapplyForTelegramAccess()">
                                <span>Re-apply for Access</span>
                                <span>↺</span>
                            </button>
                        </div>
                    </div>`;
                    break;

                case 'ADMIN_APPROVED':
                case 'TELEGRAM_NOT_CONNECTED':
                    html = `
                    <div class="tg-state-card tg-card-success">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Stage 2 of 2</span>
                            <span class="tg-status-badge tg-badge-success">✅ ERP Admin Approved</span>
                        </div>
                        <h3 class="tg-state-title">Connect Your Telegram Account</h3>
                        <p class="tg-state-desc">
                            Your student application has been verified! Now link your Telegram account so our official
                            bot can recognize you when you request access to the private university channel.
                        </p>
                        <div class="tg-helper-note">
                            <span>💡</span>
                            <span>Clicking the button will open Telegram with our official verification bot. Simply tap <strong>Start</strong> to link.</span>
                        </div>
                        <div class="tg-actions">
                            <button id="btnConnectTelegram" class="btn-telegram-primary" onclick="connectTelegramAccount()">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
                                <span>Connect Telegram Account</span>
                            </button>
                        </div>
                    </div>`;
                    break;

                case 'JOIN_REQUEST_NOT_SENT':
                    html = `
                    <div class="tg-state-card">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Stage 2 of 2</span>
                            <span class="tg-status-badge tg-badge-info">🔗 Telegram Linked</span>
                        </div>
                        <h3 class="tg-state-title">Telegram Connected: @${escapeHtml(data.telegramUsername || data.telegramUserId || 'User')}</h3>
                        <p class="tg-state-desc">
                            Your Telegram identity is verified. You may now request to join the private university channel.
                            The channel administrator will approve your request inside Telegram.
                        </p>
                        <div class="tg-actions">
                            <button id="btnRequestJoinChannel" class="btn-primary" onclick="requestChannelJoin()">
                                <span>Request to Join Private Channel</span>
                                <span>↗</span>
                            </button>
                        </div>
                    </div>`;
                    break;

                case 'JOIN_REQUEST_PENDING':
                    html = `
                    <div class="tg-state-card">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Stage 2 of 2</span>
                            <span class="tg-status-badge tg-badge-warning">⏳ Join Request Pending Channel Admin</span>
                        </div>
                        <h3 class="tg-state-title">Awaiting Channel Administrator Approval</h3>
                        <p class="tg-state-desc">
                            Your join request has been delivered to the private Telegram channel.
                            The channel administrator will review and accept your request in Telegram.
                        </p>
                        <div class="tg-helper-note">
                            <span>ℹ️</span>
                            <span>Once the channel admin accepts your join request, click the button below to verify your membership.</span>
                        </div>
                        <div class="tg-actions">
                            <button id="btnCheckMembership" class="btn-secondary" onclick="checkMembershipStatus()">
                                <span>🔄 Check Membership Status</span>
                            </button>
                            <button class="btn-secondary" onclick="requestChannelJoin()">
                                <span>Re-open Channel Link</span>
                            </button>
                        </div>
                    </div>`;
                    break;

                case 'CHANNEL_APPROVED':
                    html = `
                    <div class="tg-state-card tg-card-success">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Access Granted</span>
                            <span class="tg-status-badge tg-badge-success">🎉 Active Channel Member</span>
                        </div>
                        <h3 class="tg-state-title">Welcome to Roomhub (Private Channel)</h3>
                        <p class="tg-state-desc">
                            Your membership is confirmed! You have full access to official semester notices, circulars,
                            academic updates, and university broadcasts.
                        </p>
                        <div class="tg-actions">
                            <button class="btn-telegram-primary" onclick="openTelegramChannel()">
                                <span>Open Roomhub Channel</span>
                                <span>↗</span>
                            </button>
                            <button class="btn-secondary" onclick="openTelegramWeb()">
                                <span>Launch Telegram Web</span>
                            </button>
                        </div>
                    </div>`;
                    break;

                case 'CHANNEL_REJECTED':
                    html = `
                    <div class="tg-state-card tg-card-danger">
                        <div class="tg-state-header">
                            <span class="tg-stage-pill">Channel Access</span>
                            <span class="tg-status-badge tg-badge-danger">🚫 Request Declined</span>
                        </div>
                        <h3 class="tg-state-title">Channel Join Request Declined</h3>
                        <p class="tg-state-desc">
                            Your join request to the private Telegram channel was declined by the channel administrator.
                        </p>
                        <div class="tg-actions">
                            <button class="btn-secondary" onclick="requestChannelJoin()">
                                <span>Re-submit Join Request</span>
                            </button>
                            <button id="btnCheckMembership" class="btn-secondary" onclick="checkMembershipStatus()">
                                <span>🔄 Re-check Status</span>
                            </button>
                        </div>
                    </div>`;
                    break;
            }

            container.innerHTML = html;
        }

        function getBranchName(branchId) {
            if (typeof getBranch === 'function') {
                const b = getBranch(branchId);
                if (b && b.name) return b.name;
            }
            return branchId || 'All Branches';
        }

        function renderTelegramSection() {
            const config = window.TELEGRAM_CONFIG || (typeof TELEGRAM_CONFIG !== 'undefined' ? TELEGRAM_CONFIG : {});
            const chNameEl = document.getElementById('telegramChannelName');
            const chDescEl = document.getElementById('telegramChannelDesc');
            if (chNameEl && config.channelName) {
                chNameEl.textContent = config.channelName;
            }
            if (chDescEl && config.channelDescription) {
                chDescEl.textContent = config.channelDescription;
            }

            // Also re-render dynamic state machine UI
            renderTelegramUI();
        }

        function toggleTelegramSection(show) {
            const telegramView = document.getElementById('telegramView');
            const mainShell = document.getElementById('mainShell');
            const chessView = document.getElementById('chessClubView');
            if (!telegramView) return;

            if (show) {
                if (chessView) chessView.style.display = 'none';
                const ledgerView = document.getElementById('ledgerView');
                if (ledgerView) ledgerView.style.display = 'none';
                if (mainShell) mainShell.style.display = 'none';
                telegramView.style.display = 'block';

                try { sessionStorage.setItem('mmmut_active_view', 'telegram'); } catch (_) {}

                // Close mobile sidebar drawer if open
                if (typeof window.toggleSidebar === 'function') {
                    window.toggleSidebar(false);
                }

                // If signed in, initialize real-time application listener
                if (currentUid && (!telegramAppUnsub || currentTelegramAppState === 'NOT_APPLIED')) {
                    setupTelegramAppListener(currentUid);
                }

                // Render dynamic channel info from configuration
                renderTelegramSection();

                // Smoothly scroll to the top of view
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                telegramView.style.display = 'none';
                if (mainShell) mainShell.style.display = 'flex';
                try { sessionStorage.removeItem('mmmut_active_view'); } catch (_) {}
            }
        }


// ============================================================================
// SECTION: 90_community_feedback_rating.js
// Community posts, feedback tickets, ratings
// Source: index.html lines 8579-9346 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        function openCreatePost() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            if (!isAdmin) { showToast('Only admins can create posts.'); return; }
            document.getElementById('createPostOverlay').classList.add('open');
            document.getElementById('cpTitle').value = '';
            document.getElementById('cpContent').value = '';
            document.getElementById('cpImage').value = '';
            document.getElementById('cpImagePreview').style.display = 'none';
            document.getElementById('cpFormError').style.display = 'none';
        }

        function closeCreatePost() {
            document.getElementById('createPostOverlay').classList.remove('open');
        }

        function previewCommunityPostImage() {
            const file = document.getElementById('cpImage').files[0];
            const preview = document.getElementById('cpImagePreview');
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                preview.style.display = 'none';
            }
        }

        // ========== SECURITY HELPERS (XSS-safe rendering) ==========
        function safeUrl(u) {
            const s = String(u || '');
            if (/^https:\/\//.test(s)) return s.replace(/"/g, '%22');
            return '';
        }
        function cleanFileName(name) {
            return String(name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'file';
        }
        function safeId(id) {
            return String(id || '').replace(/[^A-Za-z0-9_-]/g, '');
        }

        async function submitCommunityPost(e) {
            e.preventDefault();
            if (!currentUser) { showToast('Please log in first.'); return; }
            if (!isAdmin) { showToast('Only admins can create posts.'); return; }
            const errorEl = document.getElementById('cpFormError');
            errorEl.style.display = 'none';

            const title = document.getElementById('cpTitle').value.trim().slice(0, 120);
            const content = document.getElementById('cpContent').value.trim().slice(0, 5000);
            const fileInput = document.getElementById('cpImage');

            if (!title) { errorEl.textContent = 'Please enter a title.';
                errorEl.style.display = 'block'; return; }
            if (!content) { errorEl.textContent = 'Please enter some content.';
                errorEl.style.display = 'block'; return; }

            let imageUrl = null;
            let imagePath = null;
            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                if (file.size > 5 * 1024 * 1024) { errorEl.textContent = 'Image must be under 5MB.'; errorEl.style.display = 'block'; return; }
                if (!String(file.type || '').startsWith('image/')) { errorEl.textContent = 'Only image files allowed.'; errorEl.style.display = 'block'; return; }
                imagePath = `communityPosts/${currentUid}/${Date.now()}_${cleanFileName(file.name)}`;
                const storageRef = ref(storage, imagePath);
                try {
                    await uploadBytes(storageRef, file);
                    imageUrl = await getDownloadURL(storageRef);
                } catch (err) {
                    console.warn('Image upload failed:', err);
                    errorEl.textContent = 'Image upload failed: ' + (err && err.message ? err.message : err) +
                        ' — Storage rules may not be deployed (see storage.rules). Post not published.';
                    errorEl.style.display = 'block';
                    return;
                }
            }

            try {
                await addDoc(communityPostsCollection, {
                    uid: currentUid,
                    username: currentUser.username,
                    name: currentUser.name,
                    title,
                    content,
                    imageUrl: imageUrl || null,
                    imagePath: imagePath || null,
                    likes: [],
                    createdAt: serverTimestamp()
                });
                showToast('✅ Post published!');
                closeCreatePost();
            } catch (err) {
                errorEl.textContent = 'Error publishing post: ' + err.message;
                errorEl.style.display = 'block';
            }
        }

        async function renderCommunityPosts() {
            const feed = document.getElementById('communityPostsFeed');
            if (!feed) return;

            if (!currentUser) {
                feed.innerHTML = `<div class="empty-note">Log in to see community posts.</div>`;
                return;
            }

            if (communityPosts.length === 0) {
                feed.innerHTML =
                    `<div class="empty-note">No posts yet. Check back later for updates from the admin.</div>`;
                return;
            }

            let html = '';
            communityPosts.forEach(post => {
                const date = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleString(
                    'en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit',
                        minute: '2-digit' }) : '—';
                const isLiked = post.likes && post.likes.includes(currentUid);
                const likeCount = post.likes ? post.likes.length : 0;
                const isOwn = post.uid === currentUid;

                html += `
              <div class="community-post">
                <div class="cp-head">
                  <div>
                    <div class="cp-author">${escapeHtml(post.name || 'Unknown')} <span>@${escapeHtml(post.username || '—')}</span>
                      <span class="cp-admin-badge">Admin</span>
                    </div>
                    <div class="cp-title">${escapeHtml(post.title)}</div>
                  </div>
                  <div class="cp-time">${escapeHtml(date)}</div>
                </div>
                <div class="cp-body">${escapeHtml(post.content)}</div>
                ${post.imageUrl && safeUrl(post.imageUrl) ? `<img src="${safeUrl(post.imageUrl)}" class="cp-image" alt="Post image" loading="lazy" />` : ''}
                <div class="cp-actions">
                  <button class="cp-like-btn ${isLiked ? 'liked' : ''}" data-post-id="${safeId(post.id)}" data-action="like">
                    ${isLiked ? '❤️' : '🤍'} <span class="cp-like-count">${likeCount}</span>
                  </button>
                  ${isOwn ? `<button class="cp-delete-btn" data-post-id="${safeId(post.id)}" data-action="delete">🗑️ Delete</button>` : ''}
                </div>
              </div>
            `;
            });

            feed.innerHTML = html;
            feed.querySelectorAll('button[data-action="like"]').forEach(b =>
                b.addEventListener('click', () => toggleLike(b.dataset.postId)));
            feed.querySelectorAll('button[data-action="delete"]').forEach(b =>
                b.addEventListener('click', () => deleteCommunityPost(b.dataset.postId)));
        }

        async function toggleLike(postId) {
            postId = String(postId || '').replace(/[^A-Za-z0-9_-]/g, '');
            if (!postId) return;
            if (!currentUser) { showToast('Please log in first.'); return; }
            try {
                const postRef = doc(communityPostsCollection, postId);
                const snap = await getDoc(postRef);
                if (!snap.exists()) { showToast('Post not found.'); return; }
                const data = snap.data();
                const likes = data.likes || [];
                const idx = likes.indexOf(currentUid);
                if (idx > -1) {
                    likes.splice(idx, 1);
                } else {
                    likes.push(currentUid);
                }
                await updateDoc(postRef, { likes });
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        async function deleteCommunityPost(postId) {
            postId = String(postId || '').replace(/[^A-Za-z0-9_-]/g, '');
            if (!postId) return;
            if (!confirm('Delete this post? This cannot be undone.')) return;
            try {
                const postRef = doc(communityPostsCollection, postId);
                const snap = await getDoc(postRef);
                if (!snap.exists()) { showToast('Post not found.'); return; }
                const data = snap.data();
                if (data.uid !== currentUid) { showToast('You can only delete your own posts.'); return; }
                if (data.imagePath) {
                    try {
                        await deleteObject(ref(storage, data.imagePath));
                    } catch (e) {}
                }
                await deleteDoc(postRef);
                showToast('Post deleted.');
            } catch (e) {
                showToast('Error deleting: ' + e.message);
            }
        }

        // ============================================================
        // ========== FEEDBACK SYSTEM ==================================
        // ============================================================

        function generateTicketId() {
            const year = new Date().getFullYear();
            const random = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
            return `FB-${year}-${random}`;
        }

        async function checkRateLimit(uid) {
            const today = dateKey(new Date());
            const q = query(
                feedbackCollection,
                where('uid', '==', uid),
                where('createdAtDate', '==', today)
            );
            const snap = await getDocs(q);
            return snap.size < 5;
        }

        function openFeedbackForm() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            document.getElementById('feedbackFormOverlay').classList.add('open');
            document.getElementById('fbFormError').style.display = 'none';
            document.getElementById('fbCategory').value = '';
            document.getElementById('fbSubject').value = '';
            document.getElementById('fbMessage').value = '';
            document.getElementById('fbPriority').value = 'medium';
            document.getElementById('fbScreenshot').value = '';
            document.getElementById('fbCharCount').textContent = '0 / 2000';
        }

        function closeFeedbackForm() {
            document.getElementById('feedbackFormOverlay').classList.remove('open');
        }

        document.addEventListener('DOMContentLoaded', () => {
            const msg = document.getElementById('fbMessage');
            if (msg) {
                msg.addEventListener('input', () => {
                    document.getElementById('fbCharCount').textContent = msg.value.length + ' / 2000';
                });
            }
        });

        async function submitFeedback(e) {
            e.preventDefault();
            if (!currentUser) { showToast('Please log in first.'); return; }
            const errorEl = document.getElementById('fbFormError');
            errorEl.style.display = 'none';

            const category = document.getElementById('fbCategory').value;
            const subject = document.getElementById('fbSubject').value.trim();
            const message = document.getElementById('fbMessage').value.trim();
            const priority = document.getElementById('fbPriority').value;
            const fileInput = document.getElementById('fbScreenshot');

            if (!category) { errorEl.textContent = 'Please select a category.';
                errorEl.style.display = 'block'; return; }
            if (!subject || subject.length > 100) { errorEl.textContent =
                    'Subject is required and must be 100 characters or less.';
                errorEl.style.display = 'block'; return; }
            if (message.length < 20 || message.length > 2000) { errorEl.textContent =
                    'Description must be between 20 and 2000 characters.';
                errorEl.style.display = 'block'; return; }

            const ok = await checkRateLimit(currentUid);
            if (!ok) { errorEl.textContent = 'Daily feedback limit reached (5 per day).';
                errorEl.style.display = 'block'; return; }

            let attachmentUrl = null;
            let attachmentPath = null;
            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                if (file.size > 5 * 1024 * 1024) { errorEl.textContent = 'Screenshot must be under 5MB.'; errorEl.style.display = 'block'; return; }
                if (!String(file.type || '').startsWith('image/')) { errorEl.textContent = 'Only image files allowed.'; errorEl.style.display = 'block'; return; }
                attachmentPath = `feedback/${currentUid}/${Date.now()}_${cleanFileName(file.name)}`;
                const storageRef = ref(storage, attachmentPath);
                try {
                    await uploadBytes(storageRef, file);
                    attachmentUrl = await getDownloadURL(storageRef);
                } catch (err) {
                    errorEl.textContent = 'Failed to upload screenshot: ' + err.message;
                    errorEl.style.display = 'block';
                    return;
                }
            }

            const ticketId = generateTicketId();
            const today = dateKey(new Date());

            try {
                await addDoc(feedbackCollection, {
                    uid: currentUid,
                    username: currentUser.username,
                    name: currentUser.name,
                    branch: currentUser.branchId,
                    section: currentUser.section,
                    category,
                    subject,
                    message,
                    priority,
                    status: 'open',
                    attachment: attachmentUrl,
                    attachmentPath: attachmentPath || null,
                    ticketId,
                    createdAtDate: today,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    adminReply: null,
                    adminReplyAt: null,
                    repliedBy: null
                });
                showToast('✅ Feedback submitted! Ticket: ' + ticketId);
                closeFeedbackForm();
                renderFeedbackPreview();
                if (isAdmin) renderAdminFeedback();
            } catch (err) {
                errorEl.textContent = 'Error submitting feedback: ' + err.message;
                errorEl.style.display = 'block';
            }
        }

        async function renderFeedbackPreview() {
            if (!currentUser) return;
            const previewEl = document.getElementById('feedbackPreviewContent');
            if (!previewEl) return;
            try {
                const q = query(feedbackCollection, where('uid', '==', currentUid), orderBy('createdAt', 'desc'), limit(3));
                const snap = await getDocs(q);
                const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                const allQ = query(feedbackCollection, where('uid', '==', currentUid));
                const allSnap = await getDocs(allQ);
                const allDocs = allSnap.docs.map(d => d.data());
                const total = allDocs.length;
                const open = allDocs.filter(d => d.status === 'open' || d.status === 'in_progress').length;
                const resolved = allDocs.filter(d => d.status === 'resolved' || d.status === 'closed').length;

                document.getElementById('fbTotalCount').textContent = total;
                document.getElementById('fbOpenCount').textContent = open;
                document.getElementById('fbResolvedCount').textContent = resolved;

                const latestEl = document.getElementById('fbLatestPreview');
                if (items.length === 0) {
                    latestEl.textContent = 'No feedback yet. Click "New" to submit.';
                } else {
                    const latest = items[0];
                    const statusMap = {
                        'open': '🟡 Open',
                        'in_progress': '🔵 In Progress',
                        'resolved': '🟢 Resolved',
                        'closed': '⚪ Closed'
                    };
                    const date = latest.createdAt ? new Date(latest.createdAt.seconds * 1000).toLocaleDateString(
                        'en-IN', { day: 'numeric', month: 'short' }) : '—';
                    latestEl.innerHTML =
                        `<strong>${escapeHtml(latest.ticketId || '—')}</strong> — ${escapeHtml(latest.subject)} <span style="color:var(--ink-soft);font-size:11px;">(${escapeHtml(statusMap[latest.status] || latest.status || '')} · ${escapeHtml(date)})</span>`;
                }
            } catch (e) {}
        }

        // ========== MY FEEDBACK ==========
        let myFeedbackPage = 0;
        const MY_FEEDBACK_LIMIT = 20;

        function openMyFeedback() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            document.getElementById('myFeedbackOverlay').classList.add('open');
            myFeedbackPage = 0;
            renderMyFeedback();
        }

        function closeMyFeedback() {
            document.getElementById('myFeedbackOverlay').classList.remove('open');
        }

        async function renderMyFeedback() {
            const body = document.getElementById('myFeedbackBody');
            if (!body) return;
            try {
                const q = query(
                    feedbackCollection,
                    where('uid', '==', currentUid),
                    orderBy('createdAt', 'desc'),
                    limit(MY_FEEDBACK_LIMIT)
                );
                const snap = await getDocs(q);
                const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                if (items.length === 0) {
                    body.innerHTML = `<div class="feedback-empty">You haven't submitted any feedback yet.</div>`;
                    return;
                }

                let html = '';
                items.forEach(f => {
                    const statusMap = {
                        'open': 'fb-status-open',
                        'in_progress': 'fb-status-in_progress',
                        'resolved': 'fb-status-resolved',
                        'closed': 'fb-status-closed'
                    };
                    const statusLabel = {
                        'open': 'Open',
                        'in_progress': 'In Progress',
                        'resolved': 'Resolved',
                        'closed': 'Closed'
                    };
                    const date = f.createdAt ? new Date(f.createdAt.seconds * 1000).toLocaleDateString(
                        'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                    const priorityClass = f.priority === 'high' ? 'fb-priority-high' : f.priority === 'medium' ?
                        'fb-priority-medium' : 'fb-priority-low';

                    html += `
                <div class="feedback-list-item">
                  <div class="fb-head">
                    <div>
                      <span class="fb-ticket">${escapeHtml(f.ticketId || '—')}</span>
                      <span class="fb-subject">${escapeHtml(f.subject)}</span>
                    </div>
                    <span class="fb-status-badge ${escapeHtml(statusMap[f.status] || 'fb-status-open')}">${escapeHtml(statusLabel[f.status] || 'Open')}</span>
                  </div>
                  <div class="fb-meta">
                    <span class="${priorityClass}">${escapeHtml((f.priority || 'medium').toUpperCase())}</span>
                    · ${escapeHtml(f.category)} · ${escapeHtml(date)}
                  </div>
                  <div class="fb-message">${escapeHtml(f.message)}</div>
                  ${f.attachment && safeUrl(f.attachment) ? `<a href="${safeUrl(f.attachment)}" target="_blank" rel="noopener" class="fb-attachment-link">📎 View Attachment</a>` : ''}
                  ${f.adminReply ? `
                    <div class="fb-reply">
                      <div class="fb-reply-label">💬 Admin Reply</div>
                      ${escapeHtml(f.adminReply)}
                      <div style="font-size:10px;color:var(--ink-soft);margin-top:4px;">${f.repliedBy ? 'by ' + escapeHtml(f.repliedBy) : ''} · ${f.adminReplyAt ? escapeHtml(new Date(f.adminReplyAt.seconds * 1000).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})) : ''}</div>
                    </div>
                  ` : ''}
                  <div class="fb-actions">
                    ${f.status === 'open' ? `<button class="btn-sm delete" data-fb-id="${safeId(f.id)}" data-action="del">Delete</button>` : ''}
                  </div>
                </div>
              `;
                });

                body.innerHTML = html;
                body.querySelectorAll('button[data-action="del"]').forEach(b =>
                    b.addEventListener('click', () => deleteMyFeedback(b.dataset.fbId)));
            } catch (e) {
                body.innerHTML = `<div class="feedback-empty">Error loading feedback: ${e.message}</div>`;
            }
        }

        async function deleteMyFeedback(id) {
            if (!confirm('Delete this feedback? This cannot be undone.')) return;
            try {
                const docRef = doc(feedbackCollection, id);
                const snap = await getDoc(docRef);
                if (!snap.exists()) { showToast('Feedback not found.'); return; }
                const data = snap.data();
                if (data.uid !== currentUid) { showToast('You can only delete your own feedback.'); return; }
                if (data.status !== 'open') { showToast('Only open feedback can be deleted.'); return; }
                await deleteDoc(docRef);
                showToast('Feedback deleted.');
                renderMyFeedback();
                renderFeedbackPreview();
                if (isAdmin) renderAdminFeedback();
            } catch (e) {
                showToast('Error deleting: ' + e.message);
            }
        }

        // ========== ADMIN FEEDBACK ==========
        let adminFeedbackPage = 0;
        const ADMIN_FEEDBACK_LIMIT = 20;
        let adminFeedbackFilter = 'all';
        let adminFeedbackSearch = '';
        let adminFeedbackLastDoc = null;
        let adminFeedbackDocs = [];

        async function renderAdminFeedback() {
            const el = document.getElementById('adminFeedbackContent');
            if (!el) return;
            try {
                let q = query(feedbackCollection, orderBy('createdAt', 'desc'), limit(ADMIN_FEEDBACK_LIMIT));

                let filtered = [];
                const snap = await getDocs(q);
                let allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                const search = adminFeedbackSearch.trim().toLowerCase();
                if (search) {
                    allDocs = allDocs.filter(d =>
                        (d.name || '').toLowerCase().includes(search) ||
                        (d.username || '').toLowerCase().includes(search) ||
                        (d.ticketId || '').toLowerCase().includes(search) ||
                        (d.subject || '').toLowerCase().includes(search) ||
                        (d.category || '').toLowerCase().includes(search) ||
                        (d.branch || '').toLowerCase().includes(search) ||
                        (d.section || '').toLowerCase().includes(search) ||
                        (d.status || '').toLowerCase().includes(search)
                    );
                }

                if (adminFeedbackFilter === 'open') {
                    allDocs = allDocs.filter(d => d.status === 'open' || d.status === 'in_progress');
                } else if (adminFeedbackFilter === 'high') {
                    allDocs = allDocs.filter(d => d.priority === 'high');
                } else if (adminFeedbackFilter === 'resolved') {
                    allDocs = allDocs.filter(d => d.status === 'resolved' || d.status === 'closed');
                } else if (adminFeedbackFilter === 'closed') {
                    allDocs = allDocs.filter(d => d.status === 'closed');
                }

                adminFeedbackDocs = allDocs;

                if (allDocs.length === 0) {
                    el.innerHTML = `
                <div class="fb-admin-search">
                  <input class="search-box" placeholder="Search by name, username, ticket, subject…" value="${escapeHtml(adminFeedbackSearch)}" id="fbAdminSearch" />
                  <div class="fb-admin-filters">
                    <button class="filter-btn ${adminFeedbackFilter==='all'?'active':''}" data-filter="all">All</button>
                    <button class="filter-btn ${adminFeedbackFilter==='open'?'active':''}" data-filter="open">Open</button>
                    <button class="filter-btn ${adminFeedbackFilter==='high'?'active':''}" data-filter="high">High Priority</button>
                    <button class="filter-btn ${adminFeedbackFilter==='resolved'?'active':''}" data-filter="resolved">Resolved</button>
                    <button class="filter-btn ${adminFeedbackFilter==='closed'?'active':''}" data-filter="closed">Closed</button>
                  </div>
                </div>
                <div class="feedback-empty">No feedback tickets found.</div>
              `;
                    wireAdminFeedbackControls(el);
                    return;
                }

                let html = `
              <div class="fb-admin-search">
                <input class="search-box" placeholder="Search by name, username, ticket, subject…" value="${escapeHtml(adminFeedbackSearch)}" id="fbAdminSearch" />
                <div class="fb-admin-filters">
                  <button class="filter-btn ${adminFeedbackFilter==='all'?'active':''}" data-filter="all">All</button>
                  <button class="filter-btn ${adminFeedbackFilter==='open'?'active':''}" data-filter="open">Open</button>
                  <button class="filter-btn ${adminFeedbackFilter==='high'?'active':''}" data-filter="high">High Priority</button>
                  <button class="filter-btn ${adminFeedbackFilter==='resolved'?'active':''}" data-filter="resolved">Resolved</button>
                  <button class="filter-btn ${adminFeedbackFilter==='closed'?'active':''}" data-filter="closed">Closed</button>
                </div>
              </div>
              <div class="fb-admin-table-wrap">
                <table class="fb-admin-table">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Student</th>
                      <th>Branch/Sec</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Subject</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
            `;

                allDocs.forEach(f => {
                    const statusMap = {
                        'open': 'fb-status-open',
                        'in_progress': 'fb-status-in_progress',
                        'resolved': 'fb-status-resolved',
                        'closed': 'fb-status-closed'
                    };
                    const statusLabel = {
                        'open': 'Open',
                        'in_progress': 'In Progress',
                        'resolved': 'Resolved',
                        'closed': 'Closed'
                    };
                    const branchName = getBranch(f.branch)?.name || f.branch || '—';
                    const shortBranch = branchName.replace('B.Tech — ', '');
                    const date = f.createdAt ? new Date(f.createdAt.seconds * 1000).toLocaleDateString(
                        'en-IN', { day: 'numeric', month: 'short' }) : '—';

                    html += `
                <tr>
                  <td><span class="fb-ticket" style="font-weight:600;">${escapeHtml(f.ticketId || '—')}</span></td>
                  <td>${escapeHtml(f.name || '—')}<br/><span style="font-size:10px;color:var(--ink-soft);">@${escapeHtml(f.username || '—')}</span></td>
                  <td>${escapeHtml(shortBranch)}<br/><span style="font-size:10px;color:var(--ink-soft);">Sec ${escapeHtml(f.section || '—')}</span></td>
                  <td>${escapeHtml(f.category || '—')}</td>
                  <td><span class="${f.priority === 'high' ? 'fb-priority-high' : f.priority === 'medium' ? 'fb-priority-medium' : 'fb-priority-low'}">${escapeHtml((f.priority || 'med').toUpperCase())}</span></td>
                  <td><span class="fb-status-badge ${escapeHtml(statusMap[f.status] || 'fb-status-open')}">${escapeHtml(statusLabel[f.status] || 'Open')}</span></td>
                  <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(f.subject || '')}">${escapeHtml(f.subject || '—')}</td>
                  <td>
                    <div class="fb-admin-actions">
                      <button class="btn-sm reply-btn" data-fb-act="reply" data-fb-id="${safeId(f.id)}">Reply</button>
                      <button class="btn-sm status-btn" data-fb-act="status" data-fb-id="${safeId(f.id)}">Status</button>
                      <button class="btn-sm del-btn" data-fb-act="del" data-fb-id="${safeId(f.id)}">Delete</button>
                    </div>
                  </td>
                </tr>
              `;
                });

                html += `</tbody></table></div>`;
                el.innerHTML = html;
                wireAdminFeedbackControls(el);
                el.querySelectorAll('button[data-fb-act]').forEach(b => {
                    const id = b.dataset.fbId;
                    const act = b.dataset.fbAct;
                    b.addEventListener('click', () => {
                        if (act === 'reply') openAdminReply(id);
                        else if (act === 'status') changeFeedbackStatus(id);
                        else if (act === 'del') deleteFeedbackAdmin(id);
                    });
                });
            } catch (e) {
                el.innerHTML = `<div class="feedback-empty">Error loading feedback: ${escapeHtml(e.message)}</div>`;
            }
        }

        function wireAdminFeedbackControls(root) {
            const input = root.querySelector('#fbAdminSearch');
            if (input) {
                input.addEventListener('input', () => {
                    adminFeedbackSearch = input.value;
                    const t = setTimeout(() => {}, 0);
                    clearTimeout(t);
                    renderAdminFeedbackDebounced();
                });
            }
            root.querySelectorAll('button[data-filter]').forEach(b =>
                b.addEventListener('click', () => { adminFeedbackFilter = b.dataset.filter; renderAdminFeedback(); }));
        }
        let _fbRenderTimer = null;
        function renderAdminFeedbackDebounced() {
            if (_fbRenderTimer) clearTimeout(_fbRenderTimer);
            _fbRenderTimer = setTimeout(() => renderAdminFeedback(), 250);
        }

        // ========== ADMIN REPLY ==========
        let replyFeedbackId = null;

        function openAdminReply(feedbackId) {
            replyFeedbackId = feedbackId;
            document.getElementById('adminReplyModal').classList.add('open');
            document.getElementById('adminReplyText').value = '';
            document.getElementById('adminReplyError').style.display = 'none';
            getDoc(doc(feedbackCollection, feedbackId)).then(snap => {
                if (snap.exists()) {
                    const data = snap.data();
                    document.getElementById('replyTicketInfo').textContent =
                        `Ticket: ${data.ticketId || '—'} — ${data.subject || ''}`;
                }
            }).catch(() => {});
        }

        function closeAdminReplyModal() {
            document.getElementById('adminReplyModal').classList.remove('open');
            replyFeedbackId = null;
        }

        async function submitAdminReply() {
            if (!replyFeedbackId) { showToast('No feedback selected.'); return; }
            const reply = document.getElementById('adminReplyText').value.trim();
            if (!reply) { document.getElementById('adminReplyError').textContent = 'Please enter a reply.';
                document.getElementById('adminReplyError').style.display = 'block'; return; }

            try {
                await updateDoc(doc(feedbackCollection, replyFeedbackId), {
                    adminReply: reply,
                    adminReplyAt: serverTimestamp(),
                    repliedBy: currentUser ? currentUser.username : 'admin',
                    status: 'in_progress',
                    updatedAt: serverTimestamp()
                });
                showToast('✅ Reply sent!');
                closeAdminReplyModal();
                renderAdminFeedback();
                renderFeedbackPreview();
            } catch (e) {
                document.getElementById('adminReplyError').textContent = 'Error: ' + e.message;
                document.getElementById('adminReplyError').style.display = 'block';
            }
        }

        // ========== CHANGE STATUS ==========
        async function changeFeedbackStatus(feedbackId) {
            const statuses = ['open', 'in_progress', 'resolved', 'closed'];
            const labels = ['🟡 Open', '🔵 In Progress', '🟢 Resolved', '⚪ Closed'];
            const current = await getDoc(doc(feedbackCollection, feedbackId));
            if (!current.exists()) { showToast('Feedback not found.'); return; }
            const curStatus = current.data().status || 'open';
            const idx = statuses.indexOf(curStatus);
            const next = statuses[(idx + 1) % statuses.length];
            const choice = confirm(
                `Current status: ${labels[statuses.indexOf(curStatus)]}\nClick OK to change to: ${labels[statuses.indexOf(next)]}`
                );
            if (!choice) return;
            try {
                await updateDoc(doc(feedbackCollection, feedbackId), {
                    status: next,
                    updatedAt: serverTimestamp()
                });
                showToast(`Status changed to ${next}.`);
                renderAdminFeedback();
                renderFeedbackPreview();
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        // ========== DELETE FEEDBACK (ADMIN) ==========
        async function deleteFeedbackAdmin(feedbackId) {
            feedbackId = safeId(feedbackId);
            if (!feedbackId) return;
            if (!isAdmin) { showToast('Only admins can delete feedback.'); return; }
            if (!confirm('Delete this feedback permanently?')) return;
            try {
                const snap = await getDoc(doc(feedbackCollection, feedbackId));
                if (snap.exists() && snap.data().attachmentPath) {
                    try {
                        await deleteObject(ref(storage, snap.data().attachmentPath));
                    } catch (e) {}
                }
                await deleteDoc(doc(feedbackCollection, feedbackId));
                showToast('Feedback deleted.');
                renderAdminFeedback();
                renderFeedbackPreview();
            } catch (e) {
                showToast('Error: ' + e.message);
            }
        }

        // ========== ERP RATING ==========
        let selectedRating = 0;
        let existingRating = null;

        function openRatingModal() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            document.getElementById('ratingModal').classList.add('open');
            document.getElementById('ratingFormError').style.display = 'none';
            document.getElementById('ratingComment').value = '';
            loadExistingRating();
        }

        function closeRatingModal() {
            document.getElementById('ratingModal').classList.remove('open');
        }

        async function loadExistingRating() {
            if (!currentUser) return;
            try {
                const q = query(ratingsCollection, where('uid', '==', currentUid));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    const doc = snap.docs[0];
                    existingRating = { id: doc.id, ...doc.data() };
                    selectedRating = existingRating.rating || 0;
                    document.getElementById('ratingComment').value = existingRating.comment || '';
                    document.getElementById('ratingExisting').style.display = 'block';
                    document.getElementById('ratingExisting').textContent =
                        `⭐ You rated ${Number(existingRating.rating) || 0} stars. You can update your rating below.`;
                    updateRatingStars();
                } else {
                    existingRating = null;
                    selectedRating = 0;
                    document.getElementById('ratingExisting').style.display = 'none';
                    updateRatingStars();
                }
            } catch (e) {}
        }

        function updateRatingStars() {
            const stars = document.querySelectorAll('#ratingStars span');
            stars.forEach((el, i) => {
                el.className = i < selectedRating ? 'star-on' : 'star-off';
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            const stars = document.querySelectorAll('#ratingStars span');
            stars.forEach(el => {
                el.addEventListener('click', () => {
                    selectedRating = parseInt(el.dataset.val);
                    updateRatingStars();
                });
                el.addEventListener('mouseenter', () => {
                    const val = parseInt(el.dataset.val);
                    const all = document.querySelectorAll('#ratingStars span');
                    all.forEach((s, i) => {
                        s.className = i < val ? 'star-on' : 'star-off';
                    });
                });
                el.addEventListener('mouseleave', updateRatingStars);
            });
        });

        async function submitRating() {
            if (!currentUser) { showToast('Please log in first.'); return; }
            if (selectedRating < 1 || selectedRating > 5) {
                document.getElementById('ratingFormError').textContent = 'Please select a rating (1–5 stars).';
                document.getElementById('ratingFormError').style.display = 'block';
                return;
            }
            const comment = document.getElementById('ratingComment').value.trim();

            try {
                if (existingRating) {
                    await updateDoc(doc(ratingsCollection, existingRating.id), {
                        rating: selectedRating,
                        comment: comment,
                        updatedAt: serverTimestamp()
                    });
                    showToast('⭐ Rating updated!');
                } else {
                    await addDoc(ratingsCollection, {
                        uid: currentUid,
                        username: currentUser.username,
                        name: currentUser.name,
                        rating: selectedRating,
                        comment: comment,
                        createdAt: serverTimestamp()
                    });
                    showToast('⭐ Thanks for rating!');
                }
                closeRatingModal();
                loadExistingRating();
            } catch (e) {
                document.getElementById('ratingFormError').textContent = 'Error: ' + e.message;
                document.getElementById('ratingFormError').style.display = 'block';
            }
        }

        // ============================================================
        // ========== LEDGER AI – CHAT IMPLEMENTATION =================
        // ============================================================

        let aiConversationHistory = [];
        const MAX_HISTORY = 20;


// ============================================================================
// SECTION: 95_ledger_ai_chat.js
// Ledger AI chat UI, context builder, prompts
// Source: index.html lines 9347-9893 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        function toggleLedgerAI() {
            const chat = document.getElementById('ledgerAiChat');
            const isOpen = chat.classList.contains('open');
            if (isOpen) {
                chat.classList.remove('open');
            } else {
                chat.classList.add('open');
                document.getElementById('ledgerAiInput').focus();
                document.getElementById('aiBadgeDot').style.display = 'none';
            }
        }

        function clearLedgerAI() {
            if (!confirm('Clear the conversation?')) return;
            aiConversationHistory = [];
            const container = document.getElementById('ledgerAiMessages');
            const empty = document.getElementById('ledgerAiEmpty');
            const messages = container.querySelectorAll('.message, .typing-indicator');
            messages.forEach(el => el.remove());
            empty.style.display = 'flex';
            document.getElementById('ledgerAiError').classList.remove('show');
            document.getElementById('ledgerAiError').textContent = '';
            showToast('Conversation cleared.');
        }

        function handleLedgerAIKeydown(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendLedgerAIMessage();
            }
        }

        function autoResizeLedgerInput(el) {
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
        }

        function addAIMessage(content, isUser) {
            const container = document.getElementById('ledgerAiMessages');
            const empty = document.getElementById('ledgerAiEmpty');
            empty.style.display = 'none';

            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${isUser ? 'user' : 'ai'}`;

            if (isUser) {
                msgDiv.textContent = content;
            } else {
                let html = content;
                html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
                html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
                html = html.replace(/^[\-\*]\s(.+)$/gm, '<li>$1</li>');
                html = html.replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>');
                html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
                html = html.replace(/\n/g, '<br />');
                html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
                msgDiv.innerHTML = html;
            }

            container.appendChild(msgDiv);
            container.scrollTop = container.scrollHeight;
            return msgDiv;
        }

        function showTypingIndicator() {
            const container = document.getElementById('ledgerAiMessages');
            const empty = document.getElementById('ledgerAiEmpty');
            empty.style.display = 'none';

            const existing = container.querySelector('.typing-indicator');
            if (existing) existing.remove();

            const typing = document.createElement('div');
            typing.className = 'typing-indicator';
            typing.innerHTML =
                `<span>Ledger AI</span><div class="dots"><span></span><span></span><span></span></div>`;
            container.appendChild(typing);
            container.scrollTop = container.scrollHeight;
            return typing;
        }

        function hideTypingIndicator() {
            const container = document.getElementById('ledgerAiMessages');
            const existing = container.querySelector('.typing-indicator');
            if (existing) existing.remove();
        }

        function showAIError(msg) {
            const el = document.getElementById('ledgerAiError');
            el.textContent = msg;
            el.classList.add('show');
        }

        function hideAIError() {
            document.getElementById('ledgerAiError').classList.remove('show');
        }

        function setAILoading(loading) {
            const sendBtn = document.getElementById('ledgerAiSendBtn');
            const input = document.getElementById('ledgerAiInput');
            sendBtn.disabled = loading;
            input.disabled = loading;
            if (loading) {
                sendBtn.textContent = '⏳';
            } else {
                sendBtn.textContent = '➤';
            }
        }

        // ===== CORE AI LOGIC =====

        function gatherUserContext(question) {
            if (!currentUser) return null;

            const branch = getBranch(currentUser.branchId);
            if (!branch) return null;

            const context = {
                user: {
                    name: currentUser.name,
                    username: currentUser.username,
                    branch: branch.name,
                    section: currentUser.section,
                    hostel: currentUser.hostel || 'Day Scholar',
                    gender: currentUser.gender || 'Not specified'
                },
                attendance: { present: 0, absent: 0, bySubject: {} },
                today: null,
                tomorrow: null,
                week: null,
                subjects: branch.subjects.map(s => ({ code: s.code, name: s.name, ltp: s.ltp })),
                upcomingEvents: [],
                upcomingHolidays: [],
                syllabus: null
            };

            const map = attendanceCache || {};
            const counts = {};
            branch.subjects.forEach(s => counts[s.code] = { present: 0, absent: 0, name: s.name });

            Object.keys(map).forEach(dateStr => {
                if (holidays.has(dateStr)) return;
                const dayMap = map[dateStr];
                Object.entries(dayMap).forEach(([cellKey, status]) => {
                    const code = cellKey.split('::')[1];
                    if (counts[code]) {
                        if (status === 'present') counts[code].present++;
                        else if (status === 'absent') counts[code].absent++;
                    }
                });
            });

            let totalP = 0,
                totalA = 0;
            const bySubject = {};
            branch.subjects.forEach(s => {
                const c = counts[s.code] || { present: 0, absent: 0 };
                totalP += c.present;
                totalA += c.absent;
                bySubject[s.code] = {
                    name: s.name,
                    present: c.present,
                    absent: c.absent,
                    total: c.present + c.absent,
                    pct: (c.present + c.absent) > 0 ? Math.round((c.present / (c.present + c.absent)) * 100) : null
                };
            });
            context.attendance.present = totalP;
            context.attendance.absent = totalA;
            context.attendance.total = totalP + totalA;
            context.attendance.overallPct = (totalP + totalA) > 0 ? Math.round((totalP / (totalP + totalA)) * 100) : null;
            context.attendance.bySubject = bySubject;

            const dayIdx = new Date().getDay();
            const dayMap = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
            const todayName = dayMap[dayIdx] || null;
            const todayStr = dateKey(new Date());

            if (scheduleCache) {
                if (todayName && scheduleCache[todayName]) {
                    context.today = {};
                    const daySchedule = scheduleCache[todayName];
                    TEACH_PERIODS.forEach(p => {
                        if (daySchedule[p.key]) {
                            const cell = daySchedule[p.key];
                            context.today[p.key] = {
                                code: cell.code,
                                name: cell.name,
                                type: cell.type,
                                start: p.start,
                                end: p.end,
                                isFree: cell.code === '—'
                            };
                        }
                    });
                }

                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowIdx = tomorrow.getDay();
                const tomorrowName = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' } [
                tomorrowIdx] || null;
                if (tomorrowName && scheduleCache[tomorrowName]) {
                    context.tomorrow = {};
                    const daySchedule = scheduleCache[tomorrowName];
                    TEACH_PERIODS.forEach(p => {
                        if (daySchedule[p.key]) {
                            const cell = daySchedule[p.key];
                            context.tomorrow[p.key] = {
                                code: cell.code,
                                name: cell.name,
                                type: cell.type,
                                start: p.start,
                                end: p.end,
                                isFree: cell.code === '—'
                            };
                        }
                    });
                }

                context.week = {};
                DAYS.forEach(d => {
                    if (scheduleCache[d]) {
                        context.week[d] = {};
                        TEACH_PERIODS.forEach(p => {
                            if (scheduleCache[d][p.key]) {
                                const cell = scheduleCache[d][p.key];
                                context.week[d][p.key] = {
                                    code: cell.code,
                                    name: cell.name,
                                    type: cell.type,
                                    isFree: cell.code === '—'
                                };
                            }
                        });
                    }
                });
            }

            const now = new Date();
            const allEvents = [...BUILTIN_EVENTS];
            const upcoming = allEvents
                .map(e => ({ ...e, endDate: new Date(e.end + 'T23:59:59') }))
                .filter(e => e.endDate >= now)
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .slice(0, 5);
            context.upcomingEvents = upcoming.map(e => ({
                title: e.title,
                start: e.start,
                end: e.end,
                isOngoing: todayStr >= e.start && todayStr <= e.end
            }));

            const holidayArray = Array.from(holidays).sort();
            const nextHolidays = holidayArray
                .filter(h => h >= todayStr)
                .slice(0, 5)
                .map(h => {
                    const d = new Date(h + 'T00:00:00');
                    return {
                        date: h,
                        display: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric',
                            month: 'short' })
                    };
                });
            context.upcomingHolidays = nextHolidays;

            const syllabusBranchMap = {
                'cse': 'cse',
                'it': 'it',
                'ece': 'ece',
                'eceiot': 'eceiot',
                'civil': 'civil',
                'me': 'me',
                'chemical': 'chemical',
                'ee': 'ee',
                'bba': 'bba',
                'bpharm': 'bpharm'
            };
            const mapped = syllabusBranchMap[currentUser.branchId];
            if (mapped && syllabusData[mapped]) {
                const year = 1;
                const semData = syllabusData[mapped].semesters[year];
                if (semData) {
                    context.syllabus = {
                        branch: syllabusData[mapped].name,
                        year: year,
                        subjects: semData.map(s => ({ code: s.code, name: s.name, credits: s.credits }))
                    };
                }
            }

            return context;
        }

        function buildSystemPrompt(context) {
            if (!context) {
                return `You are Ledger AI, a helpful academic assistant for students of MMMUT (Madan Mohan Malaviya University of Technology, Gorakhpur). You are knowledgeable about the university's curriculum, timetable, and academic life. You are friendly, concise, and accurate. If you don't know something, say so clearly. Never invent information or pretend to have data that wasn't provided.`;
            }

            const user = context.user;
            const att = context.attendance;
            const subjects = context.subjects || [];

            let prompt =
                `You are Ledger AI, a helpful academic assistant for students of MMMUT (Madan Mohan Malaviya University of Technology, Gorakhpur). You are friendly, concise, and accurate. If you don't know something, say so clearly. Never invent information or pretend to have data that wasn't provided. Use the data below to answer the user's questions about their academics. Only use data that is directly relevant to the question. Do not expose raw data dumps; instead, synthesize helpful answers. Never reveal other users' information. Never expose Firebase credentials or internal security rules.\n\n`;

            prompt += `CURRENT USER:\n`;
            prompt += `- Name: ${user.name}\n`;
            prompt += `- Username: ${user.username}\n`;
            prompt += `- Branch: ${user.branch}\n`;
            prompt += `- Section: ${user.section}\n`;
            prompt += `- Hostel: ${user.hostel}\n\n`;

            prompt += `ATTENDANCE (this semester):\n`;
            if (att.total > 0) {
                prompt += `- Overall: ${att.present} present, ${att.absent} absent (${att.total} marked). Percentage: ${att.overallPct}%\n`;
                prompt += `- By subject:\n`;
                Object.entries(att.bySubject).forEach(([code, data]) => {
                    const pct = data.pct !== null ? `${data.pct}%` : 'N/A';
                    prompt += `  - ${code} (${data.name}): ${data.present} present, ${data.absent} absent (${data.total} marked) — ${pct}\n`;
                });
            } else {
                prompt += `- No attendance has been marked yet this semester.\n`;
            }
            prompt += `\n`;

            prompt += `SUBJECTS (this semester):\n`;
            subjects.forEach(s => {
                prompt += `- ${s.code}: ${s.name}\n`;
            });
            prompt += `\n`;

            if (context.today) {
                prompt += `TODAY'S SCHEDULE:\n`;
                const periods = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
                let hasClasses = false;
                periods.forEach(p => {
                    if (context.today[p] && !context.today[p].isFree) {
                        hasClasses = true;
                        const s = context.today[p];
                        prompt += `  Period ${p}: ${s.code} — ${s.name} (${s.type}) ${s.start}-${s.end}\n`;
                    } else if (context.today[p] && context.today[p].isFree) {
                        prompt += `  Period ${p}: Free / Self Study\n`;
                    }
                });
                if (!hasClasses) {
                    prompt += `  No classes today (or all periods are free).\n`;
                }
                prompt += `\n`;
            } else {
                prompt += `TODAY'S SCHEDULE: Not available (weekend or no schedule).\n\n`;
            }

            if (context.tomorrow) {
                prompt += `TOMORROW'S SCHEDULE:\n`;
                const periods = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
                let hasClasses = false;
                periods.forEach(p => {
                    if (context.tomorrow[p] && !context.tomorrow[p].isFree) {
                        hasClasses = true;
                        const s = context.tomorrow[p];
                        prompt += `  Period ${p}: ${s.code} — ${s.name} (${s.type}) ${s.start}-${s.end}\n`;
                    } else if (context.tomorrow[p] && context.tomorrow[p].isFree) {
                        prompt += `  Period ${p}: Free / Self Study\n`;
                    }
                });
                if (!hasClasses) {
                    prompt += `  No classes tomorrow (or all periods are free).\n`;
                }
                prompt += `\n`;
            } else {
                prompt += `TOMORROW'S SCHEDULE: Not available (weekend or no schedule).\n\n`;
            }

            if (context.upcomingEvents && context.upcomingEvents.length > 0) {
                prompt += `UPCOMING EVENTS:\n`;
                context.upcomingEvents.forEach(e => {
                    prompt += `- ${e.title} (${e.start} to ${e.end})${e.isOngoing ? ' — ONGOING' : ''}\n`;
                });
                prompt += `\n`;
            }

            if (context.upcomingHolidays && context.upcomingHolidays.length > 0) {
                prompt += `UPCOMING HOLIDAYS:\n`;
                context.upcomingHolidays.forEach(h => {
                    prompt += `- ${h.display} (${h.date})\n`;
                });
                prompt += `\n`;
            }

            if (context.syllabus) {
                prompt += `SYLLABUS (Year ${context.syllabus.year}):\n`;
                context.syllabus.subjects.forEach(s => {
                    prompt += `- ${s.code}: ${s.name} (${s.credits} credits)\n`;
                });
                prompt += `\n`;
            }

            prompt +=
                `When answering, be helpful, clear, and concise. If the user asks about attendance, use the numbers above. If they ask about their timetable, use the schedule above. If they ask about something not covered by the data, say so honestly and suggest what they can do (e.g., check with their professor, refer to the syllabus, etc.). Never reveal Firebase credentials, security rules, or other users' data.`;
            return prompt;
        }

        // ===== sendLedgerAIMessage – UPDATED ERROR HANDLING =====
        async function sendLedgerAIMessage() {
            const input = document.getElementById('ledgerAiInput');
            const message = input.value.trim();

            if (!message) return;
            if (!currentUser) {
                showToast('Please log in to use Ledger AI.');
                return;
            }

            hideAIError();

            // Try to initialize AI if not ready
            if (!aiReady || aiModels.length === 0) {
                try {
                    await initAI();
                } catch (initError) {
                    // Show the REAL error message from Firebase
                    const errorMsg = initError.message || 'Unknown initialization error';
                    showAIError(`AI initialization failed: ${errorMsg}`);
                    console.error('Ledger AI init error:', initError);
                    setAILoading(false);
                    return;
                }
            }

            // Double-check that the model is available
            if (aiModels.length === 0) {
                showAIError('Ledger AI is temporarily unavailable. Please check Firebase AI Logic configuration and App Check.');
                return;
            }

            addAIMessage(message, true);
            aiConversationHistory.push({ role: 'user', content: message });

            input.value = '';
            input.style.height = 'auto';
            setAILoading(true);

            const typingEl = showTypingIndicator();

            try {
                const context = gatherUserContext(message);
                const systemPrompt = buildSystemPrompt(context);

                let fullPrompt = systemPrompt + '\n\n';
                const historyMessages = aiConversationHistory.slice(-MAX_HISTORY);
                historyMessages.forEach(msg => {
                    fullPrompt += `${msg.role === 'user' ? 'User' : 'Ledger AI'}: ${msg.content}\n`;
                });

                // Try each configured model in order. This automatically handles
                // unavailable model names by falling back to the next model on
                // the list, and logs the REAL Firebase error for every failure.
                let aiResponse = null;
                let lastModelError = null;

                for (const { name: modelName, model } of aiModels) {
                    try {
                        const result = await model.generateContent({
                            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }]
                        });
                        const response = result.response;
                        const text = response.text();
                        if (text && text.trim().length >= 2) {
                            aiResponse = text;
                            break;
                        }
                    } catch (modelError) {
                        lastModelError = modelError;
                        // Detailed diagnostics – never hide the actual Firebase error.
                        console.error("Ledger AI model failed", {
                            model: modelName,
                            code: modelError?.code,
                            message: modelError?.message,
                            error: modelError
                        });
                        const msg = (modelError && modelError.message) ? String(modelError.message) : '';
                        const isModelUnavailable = /not found|404|does not exist|not supported|models\/|no longer available/i.test(msg);
                        if (!isModelUnavailable) {
                            // Not a "model unavailable" problem – no point trying
                            // another model name. Re-throw for the handler below.
                            throw modelError;
                        }
                        console.warn(`Ledger AI: ${modelName} unavailable, trying next one → ${msg}`);
                    }
                }

                if (aiResponse === null) {
                    if (lastModelError) throw lastModelError;
                    throw new Error('Ledger AI: no AI model generated a response.');
                }

                if (!aiResponse || aiResponse.trim().length < 2) {
                    aiResponse =
                        "I'm not sure how to answer that. Could you rephrase your question? I can help with attendance, timetable, syllabus, and academic calendar questions.";
                }

                hideTypingIndicator();
                addAIMessage(aiResponse, false);
                aiConversationHistory.push({ role: 'assistant', content: aiResponse });

                if (aiConversationHistory.length > MAX_HISTORY * 2) {
                    aiConversationHistory = aiConversationHistory.slice(-MAX_HISTORY * 2);
                }

            } catch (error) {
                console.error('Ledger AI error:', error);
                hideTypingIndicator();
                let errorMsg = 'Sorry, I encountered an error. Please try again later.';
                if (error.message) {
                    const msg = String(error.message);
                    if (/app.?check|attest|INVALID_APP_CREDENTIAL|UNAUTHENTICATED|UNAVAILABLE/i.test(msg)) {
                        // Log the real App Check error from generateContent so the
                        // browser console always shows the actual Firebase reason.
                        console.error(
                            'Ledger AI: generateContent received an App Check error.',
                            { code: error?.code || error?.name, message: msg, error }
                        );
                        errorMsg = 'App Check rejected the request. On GitHub Pages: confirm the reCAPTCHA Enterprise site key for this domain is configured in the Firebase console (App Check). On localhost: register the debug token shown in the browser console (Firebase Console → App Check → Manage debug tokens).';
                    } else if (/permission|auth|403|access denied/i.test(msg)) {
                        errorMsg =
                            'I don\'t have permission to access the AI service. Please check the "AI Logic" settings for this web app in the Firebase console and try again.';
                    } else if (/quota|429|rate limit/i.test(msg)) {
                        errorMsg = 'AI service quota exceeded. Please try again later.';
                    } else if (/not found|404|does not exist|not supported|models\/|no longer available/i.test(msg)) {
                        errorMsg = 'The configured AI model is not available for this project. Enable a current Gemini model for the Gemini Developer API on the "AI Logic" page in the Firebase console. See the browser console for the exact model error.';
                    } else if (/blocked|safety|recitation/i.test(msg)) {
                        errorMsg = 'The AI couldn\'t answer that request because it was blocked by safety filters. Please rephrase your question.';
                    } else {
                        errorMsg = `Error: ${msg}`;
                    }
                }
                showAIError(errorMsg);
            } finally {
                setAILoading(false);
                input.focus();
            }
        }

        // ========== BOOT – UPDATED TO HANDLE AI INIT GRACEFULLY ==========

// ============================================================================
// SECTION: 99_boot_window_bindings.js
// boot(), auth-state router, window.* bindings for inline onclick, DOMContentLoaded
// Source: index.html lines 9894-10132 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        async function boot() {
            populateBranchOptions();
            fetchHolidays().catch(e => console.warn('Failed to fetch holidays during boot:', e));

            // Pre-initialize AI in the background – if it fails, log the error but don't break the app
            initAI().then(() => {
                if (aiReady && document.getElementById('aiBadgeDot')) {
                    const dot = document.getElementById('aiBadgeDot');
                    dot.style.display = 'block';
                    dot.textContent = '✦';
                    dot.style.fontSize = '10px';
                    dot.style.padding = '2px 4px';
                    dot.style.background = 'var(--teal)';
                    dot.style.color = '#fff';
                    dot.style.minWidth = '18px';
                    setTimeout(() => { dot.style.display = 'none'; }, 8000);
                }
            }).catch((err) => {
                // AI failed to load – log the error, the badge stays hidden
                console.warn('Ledger AI background initialization failed:', err);
                // Optionally show a subtle indicator that AI is unavailable
                const dot = document.getElementById('aiBadgeDot');
                if (dot) {
                    dot.style.display = 'block';
                    dot.textContent = '⚠';
                    dot.style.fontSize = '10px';
                    dot.style.padding = '2px 4px';
                    dot.style.background = 'var(--brick)';
                    dot.style.color = '#fff';
                    dot.style.minWidth = '18px';
                    setTimeout(() => { dot.style.display = 'none'; }, 5000);
                }
            });

            onAuthStateChanged(auth, async user => {
                if (window._mockUser) return;
                if (!user) {
                    currentUser = null;
                    currentUid = null;
                    attendanceCache = {};
                    isAdmin = false;
                    adminRequested = false;
                    document.getElementById('loadingScreen').style.display = 'none';
                    document.getElementById('app').style.display = 'none';
                    document.getElementById('authScreen').style.display = 'flex';
                    if (window._adminUnsub) { window._adminUnsub();
                        window._adminUnsub = null; }
                    if (window._holidaysUnsub) { window._holidaysUnsub();
                        window._holidaysUnsub = null; }
                    if (window._postsUnsub) { window._postsUnsub();
                        window._postsUnsub = null; }
                    if (window._feedbackUnsub) { window._feedbackUnsub();
                        window._feedbackUnsub = null; }
                    if (window._communityPostsUnsub) { window._communityPostsUnsub();
                        window._communityPostsUnsub = null; }
                    if (window._chessMembersUnsub) { window._chessMembersUnsub();
                        window._chessMembersUnsub = null; }
                    if (window._chessEventsUnsub) { window._chessEventsUnsub();
                        window._chessEventsUnsub = null; }
                    if (window._chessChallengesUnsub) { window._chessChallengesUnsub();
                        window._chessChallengesUnsub = null; }
                    if (window._chessActivityUnsub) { window._chessActivityUnsub();
                        window._chessActivityUnsub = null; }
                    if (window._chessGamesUnsub) { window._chessGamesUnsub();
                        window._chessGamesUnsub = null; }
                    if (typeof cleanupLedgerListener === 'function') {
                        cleanupLedgerListener();
                    }
                    // Always dismiss the (hard) roll gate when signing out so the
                    // login screen is never stuck behind the overlay.
                    rollGateLocked = false;
                    const _migrationModalEl = document.getElementById('migrationModal');
                    if (_migrationModalEl) _migrationModalEl.classList.remove('open');
                    updatePushButtonUI();
                    return;
                }
                // If user is already loaded and active (e.g. handleLogin or handleSignup just finished), don't duplicate
                if (currentUid === user.uid && currentUser) {
                    document.getElementById('loadingScreen').style.display = 'none';
                    return;
                }
                try {
                    const record = await loadUserProfile(user.uid);
                    await loginAs(record, user.uid);
                    document.getElementById('loadingScreen').style.display = 'none';
                    setTimeout(() => renderPostsFeed(), 500);
                    try {
                        if (sessionStorage.getItem('mmmut_active_view') === 'telegram') {
                            toggleTelegramSection(true);
                        } else if (sessionStorage.getItem('mmmut_active_view') === 'ledger') {
                            toggleLedgerSection(true);
                        }
                    } catch (_) {}
                } catch (e) {
                    if (signingUp) return;
                    if (window._mockUser) return;
                    console.warn('onAuthStateChanged loadUserProfile failed:', e);
                    await signOut(auth);
                    document.getElementById('loadingScreen').style.display = 'none';
                    document.getElementById('app').style.display = 'none';
                    document.getElementById('authScreen').style.display = 'flex';
                    showError('loginError', 'Could not load your profile. Please log in again.');
                }
            });
            setInterval(() => { if (currentUser) { renderTopbarDate();
                    renderSchedule();
                    renderHistoryView(); } }, 60000);
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAdminPanel();
                    closeProfileModal();
                    closeFeedbackForm();
                    closeMyFeedback();
                    closeRatingModal();
                    closeAdminReplyModal();
                    closeCreatePost();
                    if (typeof closeLedgerResetModal === 'function') closeLedgerResetModal();
                    if (document.getElementById('ledgerAiChat').classList.contains('open')) {
                        document.getElementById('ledgerAiChat').classList.remove('open');
                    } } });
            document.getElementById('adminPanel').addEventListener('click', (e) => {
                if (e.target === document.getElementById('adminPanel')) closeAdminPanel();
            });
            document.getElementById('profileModal').addEventListener('click', (e) => {
                if (e.target === document.getElementById('profileModal')) closeProfileModal();
            });
            document.getElementById('feedbackFormOverlay').addEventListener('click', (e) => {
                if (e.target === document.getElementById('feedbackFormOverlay')) closeFeedbackForm();
            });
            document.getElementById('myFeedbackOverlay').addEventListener('click', (e) => {
                if (e.target === document.getElementById('myFeedbackOverlay')) closeMyFeedback();
            });
            document.getElementById('ratingModal').addEventListener('click', (e) => {
                if (e.target === document.getElementById('ratingModal')) closeRatingModal();
            });
            document.getElementById('adminReplyModal').addEventListener('click', (e) => {
                if (e.target === document.getElementById('adminReplyModal')) closeAdminReplyModal();
            });
            document.getElementById('createPostOverlay').addEventListener('click', (e) => {
                if (e.target === document.getElementById('createPostOverlay')) closeCreatePost();
            });

            const fbMsg = document.getElementById('fbMessage');
            if (fbMsg) {
                fbMsg.addEventListener('input', () => {
                    const el = document.getElementById('fbCharCount');
                    if (el) el.textContent = fbMsg.value.length + ' / 2000';
                });
            }
        }

        // Expose globals
        window.populateSectionOptions = populateSectionOptions;
        window.switchAuthTab = switchAuthTab;
        window.setLoginMethod = setLoginMethod;
        window.handleSignup = handleSignup;
        window.handleLogin = handleLogin;
        window.handleLogout = handleLogout;
        window.setScheduleView = setScheduleView;
        window.markAttendance = markAttendance;
        window.markAttendanceForDate = markAttendanceForDate;
        window.downloadTimetableImage = downloadTimetableImage;
        window.openAdminPanel = openAdminPanel;
        window.closeAdminPanel = closeAdminPanel;
        window.switchAdminTab = switchAdminTab;
        window.renderAdminDashboard = renderAdminDashboard;
        window.renderAdminUsers = renderAdminUsers;
        window.adminDeleteUser = adminDeleteUser;
        window.renderAdminTimetable = renderAdminTimetable;
        window.renderAdminCalendar = renderAdminCalendar;
        window.renderAdminHolidays = renderAdminHolidays;
        window.renderAdminPosts = renderAdminPosts;
        window.renderAdminRequests = renderAdminRequests;
        window.renderAdminRollVerify = renderAdminRollVerify;
        window.adminRollLookup = adminRollLookup;
        window.adminApproveRoll = adminApproveRoll;
        window.adminRejectRoll = adminRejectRoll;
        window.adminManualRoll = adminManualRoll;
        window.openMigrationModal = openMigrationModal;
        window.closeMigrationModal = closeMigrationModal;
        window.verifyRollNumber = verifyRollNumber;
        window.requestAdminRole = requestAdminRole;
        window.renderAttendanceStats = renderAttendanceStats;
        window.renderPostsFeed = renderPostsFeed;
        window.navigateHistoryDate = navigateHistoryDate;
        window.goToTodayHistory = goToTodayHistory;
        window.renderHistoryView = renderHistoryView;
        window.addHoliday = addHoliday;
        window.deleteHoliday = deleteHoliday;
        window.openProfileModal = openProfileModal;
        window.closeProfileModal = closeProfileModal;
        window.saveProfile = saveProfile;
        window.changePassword = changePassword;
        window.scrollToPosts = scrollToPosts;
        window.loadSyllabus = loadSyllabus;
        window.openSyllabusFullView = openSyllabusFullView;
        window.openCreatePost = openCreatePost;
        window.closeCreatePost = closeCreatePost;
        window.submitCommunityPost = submitCommunityPost;
        window.previewCommunityPostImage = previewCommunityPostImage;
        window.toggleLike = toggleLike;
        window.deleteCommunityPost = deleteCommunityPost;
        window.renderCommunityPosts = renderCommunityPosts;
        window.openFeedbackForm = openFeedbackForm;
        window.closeFeedbackForm = closeFeedbackForm;
        window.submitFeedback = submitFeedback;
        window.openMyFeedback = openMyFeedback;
        window.closeMyFeedback = closeMyFeedback;
        window.deleteMyFeedback = deleteMyFeedback;
        window.renderAdminFeedback = renderAdminFeedback;
        window.openAdminReply = openAdminReply;
        window.closeAdminReplyModal = closeAdminReplyModal;
        window.submitAdminReply = submitAdminReply;
        window.changeFeedbackStatus = changeFeedbackStatus;
        window.deleteFeedbackAdmin = deleteFeedbackAdmin;
        window.openRatingModal = openRatingModal;
        window.closeRatingModal = closeRatingModal;
        window.submitRating = submitRating;
        window.renderFeedbackPreview = renderFeedbackPreview;
        window.adminFeedbackFilter = 'all';
        window.adminFeedbackSearch = '';

        // Chess club globals
        window.toggleChessClub = toggleChessClub;
        window.switchChessTab = switchChessTab;
        window.handleChessJoin = handleChessJoin;
        window.handleChessLeave = handleChessLeave;
        window.registerForEvent = registerForEvent;
        window.deleteChessEvent = deleteChessEvent;
        window.openChessEventForm = openChessEventForm;
        window.closeChessEventForm = closeChessEventForm;
        window.submitChessEvent = submitChessEvent;
        window.sendChessChallenge = sendChessChallenge;
        window.respondChallenge = respondChallenge;

        // Push notifications globals
        window.enablePushNotifications = enablePushNotifications;

        // Telegram section globals
        window.TELEGRAM_CONFIG = TELEGRAM_CONFIG;
        window.toggleTelegramSection = toggleTelegramSection;
        window.openTelegramWeb = openTelegramWeb;
        window.openTelegramChannel = openTelegramChannel;
        window.renderTelegramSection = renderTelegramSection;
        window.renderTelegramUI = renderTelegramUI;
        window.setupTelegramAppListener = setupTelegramAppListener;
        window.applyForTelegramAccess = applyForTelegramAccess;
        window.reapplyForTelegramAccess = reapplyForTelegramAccess;
        window.connectTelegramAccount = connectTelegramAccount;
        window.requestChannelJoin = requestChannelJoin;
        window.checkMembershipStatus = checkMembershipStatus;
        window.launchTelegramDestination = launchTelegramDestination;
        window.closeTelegramPortal = closeTelegramPortal;
        window.fetchChannelInviteLink = fetchChannelInviteLink;

        window.toggleLedgerAI = toggleLedgerAI;
        window.clearLedgerAI = clearLedgerAI;
        window.sendLedgerAIMessage = sendLedgerAIMessage;
        window.handleLedgerAIKeydown = handleLedgerAIKeydown;
        window.autoResizeLedgerInput = autoResizeLedgerInput;

        // The Ledger (Syllabus Tracker) globals
        window.toggleLedgerSection = toggleLedgerSection;
        window.handleLedgerAction = handleLedgerAction;
        window.handleLedgerBranchChange = handleLedgerBranchChange;
        window.handleLedgerSemesterChange = handleLedgerSemesterChange;
        window.handleLedgerSearchInput = handleLedgerSearchInput;
        window.clearLedgerSearch = clearLedgerSearch;
        window.openLedgerResetModal = openLedgerResetModal;
        window.closeLedgerResetModal = closeLedgerResetModal;
        window.confirmLedgerReset = confirmLedgerReset;
        window.getLedgerCurrentBranch = () => ledgerCurrentBranch;
        window.loginAs = loginAs;

        document.addEventListener('DOMContentLoaded', () => {
            // Legacy static Curriculum selects (syllabusBranch/syllabusYear)
            // were removed — the dashboard card is now a live Ledger preview.
            // Keep the guards so nothing throws if old markup is cached.
            const syllabusBranch = document.getElementById('syllabusBranch');
            if (syllabusBranch) {
                syllabusBranch.addEventListener('change', loadSyllabus);
            }
            const syllabusYear = document.getElementById('syllabusYear');
            if (syllabusYear) {
                syllabusYear.addEventListener('change', loadSyllabus);
            }
            if (typeof renderDashboardLedgerPreview === 'function') {
                try { renderDashboardLedgerPreview(); } catch (_) {}
            }
        });

        boot();
