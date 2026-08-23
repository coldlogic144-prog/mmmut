// ============================================================================
// GENERATED FILE — tools/build_frontend.mjs composes this from
// frontend/js/modules/NN_*.js (verbatim extractions of the original
// monolithic index.html). Edit a section file, then rebuild:
//     node tools/build_frontend.mjs
// All sections share ONE module scope, exactly like the original single
// inline <script type="module">. Statement order is preserved.
// Sections composed: 10_firebase_boot.js, 15_flags_config.js, 20_notifications_push.js, 25_ai_init.js, 30_data_tables.js, 35_schedule_engine.js, 40_syllabus_data.js, 45_syllabus_ui.js, 50_state_toast_holidays_profile.js, 55_auth_core.js, 60_session_loginAs.js, 65_roll_verification.js, 70_notif_badge_admin_request.js, 75_admin_panel.js, 80_feed_attendance_events_image_history.js, 85_chess_club.js, 90_community_feedback_rating.js, 95_ledger_ai_chat.js, 99_boot_window_bindings.js
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
        import { apiFetchRoster } from './services/apiService.js';

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
        const db = getFirestore(firebaseApp);
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
        const ROLL_MIGRATION_ENABLED = true; // master kill-switch
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


        // ========== HELPERS ==========
        function getBranch(id) { return BRANCHES.find(b => b.id === id); }

        function authEmail(username) { return username + '@mmmut.local'; }

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


        // ========== SYLLABUS FUNCTIONS ==========
        function loadSyllabus() {
            const branchId = document.getElementById('syllabusBranch').value;
            const year = parseInt(document.getElementById('syllabusYear').value);
            const content = document.getElementById('syllabusContent');

            if (!branchId) {
                content.innerHTML =
                `<div class="syllabus-loading">Select your branch to view the syllabus.</div>`;
                return;
            }

            const branchData = syllabusData[branchId];
            if (!branchData) {
                content.innerHTML =
                    `<div class="syllabus-loading">Syllabus data not available for this branch.</div>`;
                return;
            }

            const semesterData = branchData.semesters[year];
            if (!semesterData) {
                content.innerHTML = `<div class="syllabus-loading">Syllabus for Year ${year} not available.</div>`;
                return;
            }

            let html = `<h3>${branchData.name} — Year ${year}</h3>`;
            html += `<table>
                        <thead>
                            <tr>
                                <th>Subject Code</th>
                                <th>Subject Name</th>
                                <th>L-T-P</th>
                                <th>Credits</th>
                            </tr>
                        </thead>
                        <tbody>`;

            semesterData.forEach(sub => {
                html += `<tr>
                            <td><span class="subject-code">${sub.code}</span></td>
                            <td>${sub.name}</td>
                            <td>${sub.ltp}</td>
                            <td>${sub.credits}</td>
                        </tr>`;
            });

            html += `</tbody></table>`;
            html +=
                `<p style="font-size:11px;color:var(--ink-soft);margin-top:12px;">Source: MMMUT Curriculum Structure & Syllabi (w.e.f. 2024-25)</p>`;
            content.innerHTML = html;
        }

        function openSyllabusFullView() {
            const branchId = document.getElementById('syllabusBranch').value;
            if (!branchId) {
                showToast('Please select a branch first to view the full syllabus.');
                return;
            }
            const year = document.getElementById('syllabusYear').value;
            const content = document.getElementById('syllabusContent').innerHTML;
            const win = window.open('', '_blank', 'width=800,height=600');
            if (win) {
                win.document.write(`
                    <html><head><title>Syllabus - ${syllabusData[branchId]?.name || 'MMMUT'}</title>
                    <style>
                        body { font-family: 'IBM Plex Sans', sans-serif; background: #EDEAE0; color: #152A3B; padding: 30px; max-width: 900px; margin: 0 auto; }
                        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
                        th, td { border: 1px solid #D9D4C4; padding: 8px 10px; text-align: left; vertical-align: top; }
                        th { background: #152A3B; color: #F1ECDD; }
                        tr:nth-child(even) { background: #F7F5EE; }
                        .subject-code { font-weight: 600; color: #B08A3E; }
                        h3 { font-family: 'Fraunces', serif; }
                    </style>
                    </head><body>
                    ${content}
                    <p style="font-size:11px;color:#8B8676;margin-top:20px;">MMMUT Gorakhpur — Curriculum Structure & Syllabi (w.e.f. 2024-25)</p>
                    </body></html>
                `);
                win.document.close();
            }
        }


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

            const syllabusSel = document.getElementById('syllabusBranch');
            syllabusSel.innerHTML = `<option value="">Select Branch</option>` +
                Object.entries(syllabusData).map(([id, data]) =>
                    `<option value="${id}">${data.name}</option>`
                ).join('');
            if (currentUser) {
                const branchId = currentUser.branchId;
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
                const mapped = syllabusBranchMap[branchId];
                if (mapped && syllabusData[mapped]) {
                    syllabusSel.value = mapped;
                }
                document.getElementById('syllabusYear').value = '1';
                loadSyllabus();
            }
        }

        function populateSectionOptions() {
            const branch = getBranch(document.getElementById('suBranch').value);
            const sel = document.getElementById('suSection');
            sel.innerHTML = branch.sections.map(s => `<option value="${s}">Section ${s}</option>`).join('');
        }

        // Toggle between "Login with Username" and "Login with Roll Number".
        let loginMethod = 'user'; // 'user' | 'roll'
        function setLoginMethod(m) {
            loginMethod = (m === 'roll') ? 'roll' : 'user';
            const userBtn = document.getElementById('loginMethodUser');
            const rollBtn = document.getElementById('loginMethodRoll');
            const lbl = document.getElementById('loginIdentifierLabel');
            const inp = document.getElementById('loginUsername');
            if (userBtn) userBtn.classList.toggle('active', loginMethod === 'user');
            if (rollBtn) rollBtn.classList.toggle('active', loginMethod === 'roll');
            if (lbl) lbl.textContent = loginMethod === 'roll' ? 'Roll Number' : 'Username';
            if (inp) {
                inp.value = '';
                inp.placeholder = loginMethod === 'roll' ? 'e.g. 2026011001' : 'e.g. rahul.cse26';
                inp.autocomplete = loginMethod === 'roll' ? 'off' : 'username';
            }
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


        // ========== AUTH ==========
        async function handleSignup() {
            hideError('signupError');
            const username = document.getElementById('suUsername').value.trim().toLowerCase();
            const password = document.getElementById('suPassword').value;
            const rollNumber = normalizeRollInput(document.getElementById('suRollNumber') ? document.getElementById('suRollNumber').value : '');
            if (!username || !password) { showError('signupError', 'Fill in your username and password.'); return; }
            if (username.length < 3) { showError('signupError', 'Username should be at least 3 characters.'); return; }
            if (password.length < 6) { showError('signupError', 'Password should be at least 6 characters.'); return; }
            // Roll number is COMPULSORY and drives the whole account: the full name
            // and branch are AUTO-ASSIGNED from the admission roster (never typed).
            if (!ROLL_NUMBER_PATTERN.test(rollNumber)) { showError('signupError', 'Roll Number is compulsory — enter your valid 10-digit college roll number (e.g. 2026011001).'); return; }
            const isAdminFlag = (username === 'tanish');

            // Resolve the roll BEFORE creating any account. The account is created
            // already VERIFIED because its identity is taken straight from the
            // roster — there is no name field for the user to fill in.
            let rosterName = '', mappedBranch = 'civil', rosterSection = '';
            // FIX (D2): Firestore is the primary source; if it errors or misses we
            // fall back to the Python backend's mirror of admission_data.csv so a
            // missing/lagging security rule can never lock a legitimate student out.
            let rd = null;
            try {
                const rsnap = await getDoc(doc(studentRosterCollection, rollNumber));
                if (rsnap.exists()) rd = rsnap.data();
            } catch (e) {
                rollMigrationLog('signup roster lookup failed', e && e.code);
            }
            if (!rd) {
                const apiRec = (typeof apiFetchRoster === 'function') ? await apiFetchRoster(rollNumber) : null;
                if (apiRec && apiRec.applicantName) {
                    rd = apiRec;
                    rollMigrationLog('signup roster resolved via backend API', { roll: rollNumber });
                }
            }
            if (!rd) {
                showError('signupError', 'That roll number is not in the B.Tech 2026–27 admission roster. Contact an administrator if this is a mistake.');
                return;
            }
            try {
                rosterName = (rd.applicantName || rd.formalName || '').trim();
                if (!rosterName) { showError('signupError', 'The roster has no applicant name for that roll number. Contact an administrator.'); return; }
                mappedBranch = rosterBranchToId(rd.branchName || (rd.enrollmentNo || '').slice(4, 7));
                rosterSection = String(rd.section || '').trim().toUpperCase();
                const claimSnap = await getDoc(doc(userRollsCollection, rollNumber));
                if (claimSnap.exists()) {
                    showError('signupError', 'That roll number is already linked to an existing account. Log in with that account or contact an administrator.');
                    return;
                }
            } catch (e) {
                rollMigrationLog('signup claim check failed', e && e.code);
                showError('signupError', 'Could not check the admission roster right now. Please try again in a moment.');
                return;
            }

            // Reflect the roster-derived branch in the form so what the user sees
            // matches what is actually saved.
            const branchSel = document.getElementById('suBranch');
            if (branchSel && branchSel.value !== mappedBranch) {
                branchSel.value = mappedBranch;
                populateSectionOptions();
            }
            // Prefer the exact section recorded for this roll in the roster.
            const validSignupSections = ((getBranch(mappedBranch) || {}).sections) || [];
            if (rosterSection && validSignupSections.includes(rosterSection)) {
                document.getElementById('suSection').value = rosterSection;
            }
            const section = document.getElementById('suSection').value ||
                (((getBranch(mappedBranch) || {}).sections || [])[0] || '');

            signingUp = true;
            try {
                let credential;
                try {
                    credential = await createUserWithEmailAndPassword(auth, authEmail(username), password);
                } catch (e) {
                    if (e && e.code === 'auth/email-already-in-use') {
                        showError('signupError', 'That username is already taken.');
                        return;
                    }
                    throw e;
                }
                const record = {
                    name: rosterName,
                    username,
                    branchId: mappedBranch,
                    section,
                    hostel: document.getElementById('suHostel').value,
                    gender: document.getElementById('suGender').value,
                    isAdmin: isAdminFlag,
                    adminRequested: false,
                    migrationStatus: 'verified',
                    rollNumber,
                    rollNumberVerified: true,
                    pendingRollNumber: '',
                    migrationReviewReason: '',
                    createdAt: Date.now(),
                    lastReadPosts: 0
                };
                await setDoc(doc(usersCollection, credential.user.uid), record, { merge: true });
                try {
                    await setDoc(doc(userRollsCollection, rollNumber), {
                        uid: credential.user.uid,
                        username,
                        rollNumber,
                        verifiedAt: serverTimestamp()
                    }, { merge: false });
                } catch (e) {
                    // The roll was claimed in a race — keep the account but flag it
                    // for review; the hard gate will explain the situation on login.
                    rollMigrationLog('signup roll claim race', { roll: rollNumber });
                    await updateDoc(doc(usersCollection, credential.user.uid), {
                        migrationStatus: 'pending',
                        pendingRollNumber: rollNumber,
                        migrationReviewReason: 'claim-race'
                    });
                    record.migrationStatus = 'pending';
                    record.pendingRollNumber = rollNumber;
                    record.migrationReviewReason = 'claim-race';
                }
                try { await setDoc(doc(attendanceCollection, credential.user.uid), { attendance: {} }); } catch (e) {}
                await loginAs(record, credential.user.uid);
            } catch (e) {
                showError('signupError', friendlyAuthError(e, 'signup'));
            } finally {
                signingUp = false;
            }
        }

        async function handleLogin() {
            hideError('loginError');
            const loginMode = (typeof loginMethod !== 'undefined') ? loginMethod : 'user';
            let username = document.getElementById('loginUsername').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value;
            if (!username || !password) { showError('loginError', 'Enter your username and password.'); return; }
            // TWO LOGIN OPTIONS:
            //   * 'user' mode — normal username login.
            //   * 'roll' mode — the box holds a 10-digit roll number, resolved to
            //     the VERIFIED existing account (userRolls/{roll} -> uid + username).
            // Real sign-in STILL uses that account's normal email/password — no new
            // credential system, no secrets in the frontend. Username mode also
            // auto-detects a plain 10-digit roll for backward compatibility.
            const enteredRoll = ROLL_NUMBER_PATTERN.test(username);
            const useRollPath = loginMode === 'roll';
            if (useRollPath && !enteredRoll) { showError('loginError', 'Roll Number mode expects a 10-digit roll number (e.g. 2026011001).'); return; }
            if (ROLL_MIGRATION_ENABLED && (useRollPath || enteredRoll)) {
                try {
                    const rollSnap = await getDoc(doc(userRollsCollection, username));
                    if (rollSnap.exists()) {
                        const r = rollSnap.data();
                        // Best-effort check that the mapped account still exists;
                        // if the users read is blocked by rules, trust the verified mapping.
                        let accountOk = false;
                        try {
                            const ue = await getDoc(doc(usersCollection, r.uid));
                            accountOk = ue.exists();
                        } catch (e) { accountOk = true; }
                        if (accountOk && r.username) {
                            // Roll login works for any verified mapping (no test-mode gate).
                            username = r.username;
                            rollMigrationLog('roll login resolution', { mappedUid: r.uid });
                        } else {
                            showError('loginError', 'That roll number is linked to an account that could not be loaded. Contact an administrator.');
                            return;
                        }
                    } else {
                        // FIX (D3): clearer guidance — the user is hard-gated, so
                        // "link it from your profile" was unreachable advice.
                        showError('loginError', 'That roll number is not linked to an account yet. Sign in with your USERNAME first; when the Verify Roll Number screen appears, enter this roll number once. Afterwards you can log in with it directly.');
                        return;
                    }
                } catch (e) {
                    rollMigrationLog('roll lookup failed', e && e.code);
                    if (e && e.code === 'permission-denied') {
                        showError('loginError', 'Roll-number lookup blocked by Firestore rules. Ask the admin to publish the public-read rule for the "userRolls" collection (see firestore_rules_append.txt). Until then, log in with your username.');
                    } else {
                        showError('loginError', 'Roll-number login is unavailable right now. Use your username to log in.');
                    }
                    return;
                }
            }
            try {
                const credential = await signInWithEmailAndPassword(auth, authEmail(username), password);
                const record = await loadUserProfile(credential.user.uid);
                if (record.username === 'tanish' && !record.isAdmin) {
                    await updateDoc(doc(usersCollection, credential.user.uid), { isAdmin: true });
                    record.isAdmin = true;
                }
                await loginAs(record, credential.user.uid);
            } catch (e) {
                showError('loginError', friendlyAuthError(e, 'login'));
            }
        }

        async function handleLogout() {
            try { await signOut(auth); } catch (e) {}
            currentUser = null;
            currentUid = null;
            attendanceCache = {};
            isAdmin = false;
            adminRequested = false;
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
            // Stop using this user's push-notification token context. Does NOT
            // delete their Firestore token document or alter authentication.
            updatePushButtonUI();
        }

        async function loadUserProfile(uid) {
            const snap = await getDoc(doc(usersCollection, uid));
            if (!snap.exists()) throw new Error('missing-profile');
            const data = snap.data();
            return {
                name: data.name,
                username: data.username,
                branchId: data.branchId,
                section: data.section,
                hostel: data.hostel || 'Day Scholar',
                gender: data.gender || 'Not specified',
                isAdmin: data.isAdmin || false,
                adminRequested: data.adminRequested || false,
                migrationStatus: data.migrationStatus || 'pending',
                rollNumber: data.rollNumber || '',
                rollNumberVerified: !!data.rollNumberVerified,
                pendingRollNumber: data.pendingRollNumber || '',
                migrationReviewReason: data.migrationReviewReason || '',
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


        // ========== LOGIN AS ==========
        async function loginAs(record, uid) {
            currentUid = uid;
            attendanceCache = await loadAttendanceMap(uid);
            currentUser = record;
            isAdmin = record.isAdmin || false;
            adminRequested = record.adminRequested || false;
            lastReadPosts = record.lastReadPosts || 0;

            document.getElementById('authScreen').style.display = 'none';
            // HARD roll-number gate — the whole app stays hidden until the account
            // is verified, so NO feature is usable before verification succeeds.
            rollGateLocked = ROLL_MIGRATION_ENABLED && rollMigrationActive(record) && record.migrationStatus !== 'verified';
            document.getElementById('app').style.display = rollGateLocked ? 'none' : 'block';

            const branch = getBranch(record.branchId);
            document.getElementById('pillName').textContent = record.name;
            document.getElementById('pillBranch').textContent = branch.name.replace('B.Tech — ', '') + ' · Sec ' + record
                .section;
            document.getElementById('pillAvatar').textContent = record.name.split(' ').map(w => w[0]).slice(0, 2).join('')
                .toUpperCase();

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
            const userPill = topRight.querySelector('.user-pill');
            if (userPill && userPill.nextSibling) {
                topRight.insertBefore(btn, userPill.nextSibling);
            } else {
                topRight.appendChild(btn);
            }

            scheduleCache = buildSchedule(branch, record.section);
            renderTopbarDate();
            renderSchedule();
            renderEvents();
            await renderAttendanceStats();
            renderPostsFeed();
            historyDate = new Date();
            renderHistoryView();

            const syllabusSel = document.getElementById('syllabusBranch');
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
            const mapped = syllabusBranchMap[record.branchId];
            if (mapped && syllabusData[mapped]) {
                syllabusSel.value = mapped;
                document.getElementById('syllabusYear').value = '1';
                loadSyllabus();
            }

            if (window._holidaysUnsub) window._holidaysUnsub();
            window._holidaysUnsub = listenHolidays();

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
                        const pill = document.querySelector('.topbar-right .user-pill');
                        if (pill && pill.nextSibling) {
                            pill.parentNode.insertBefore(b, pill.nextSibling);
                        } else {
                            document.querySelector('.topbar-right').appendChild(b);
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
            // Hard roll-number gate — non-dismissible; unlocks only on verification.
            enforceRollGate();
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

        function rollMigrationActive(user) {
            if (!ROLL_MIGRATION_ENABLED) return false;
            if (!ROLL_MIGRATION_TEST_MODE) return true;
            const username = String((user && user.username) || '').toLowerCase();
            return ROLL_MIGRATION_TEST_USERS.map(u => u.toLowerCase()).includes(username);
        }

        function rollMigrationLog(...args) {
            if (ROLL_MIGRATION_ENABLED && ROLL_MIGRATION_DEBUG) {
                try {
                    // Migration diagnostics ONLY — never passwords, auth tokens,
                    // FCM tokens, private keys, or service-account credentials.
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

        // HARD-GATE STATE — while the roll number is unverified the app is hidden behind
        // this modal and it cannot be dismissed (no ✕, no "skip for now").
        let rollGateLocked = false;

        // Maps a roster branch code to the app's branch id. Codes come from the
        // enrollment-number prefix in the official 2026-27 admission roster:
        //   CED Civil · CSD CSE · EED Electrical · ECD ECE · IOT ECE(IoT)
        //   MED Mechanical · CHD Chemical · ITC IT
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
            return ROLL_MIGRATION_ENABLED && rollMigrationActive(user) &&
                String(user && user.migrationStatus) !== 'verified';
        }

        function enforceRollGate() {
            const app = document.getElementById('app');
            const modal = document.getElementById('migrationModal');
            if (!currentUser) {
                rollGateLocked = false;
                if (app) app.style.display = 'block';
                if (modal) modal.classList.remove('open');
                return;
            }
            rollGateLocked = rollGateActive(currentUser);
            if (app) app.style.display = rollGateLocked ? 'none' : 'block';
            if (rollGateLocked) {
                openMigrationModal();
            } else if (modal) {
                modal.classList.remove('open');
            }
        }

        function openMigrationModal() {
            const modal = document.getElementById('migrationModal');
            if (!modal || !currentUser) return;
            if (!rollMigrationActive(currentUser)) return;
            if (currentUser.migrationStatus === 'verified') return;
            const input = document.getElementById('migrationRollInput');
            if (input) input.value = currentUser.pendingRollNumber || currentUser.rollNumber || '';
            const errEl = document.getElementById('migrationError');
            if (errEl) errEl.style.display = 'none';
            renderMigrationStatus();
            modal.classList.add('open');
        }

        function closeMigrationModal() {
            // The verification gate CANNOT be dismissed while it is blocking the
            // app — but it is always allowed to close during sign-out (no user).
            if (rollGateLocked && currentUser) return;
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
            if (branch === 'CED') {
                // Civil Engineering.
                if (String(profile ? profile.branchId : '').toLowerCase() !== 'civil') {
                    if (!isAdmin) reasons.push('branch-mismatch');
                    else rollMigrationLog('admin branch override', { roll: rosterEntry.rollNumber });
                }
            } else if (branch === 'CSD') {
                // The app has no 'csd' branch id — CSD rolls map to 'cse' here so
                // computer-science students are verified instead of being stalled.
                if (String(profile ? profile.branchId : '').toLowerCase() !== 'cse') {
                    if (!isAdmin) reasons.push('branch-mismatch');
                    else rollMigrationLog('admin branch override', { roll: rosterEntry.rollNumber });
                }
            } else {
                reasons.push('unknown-branch');
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
            const raw = normalizeRollInput(document.getElementById('migrationRollInput').value);
            if (!raw) return fail('Enter your roll number.');
            if (!ROLL_NUMBER_PATTERN.test(raw)) return fail('That does not look like a 10-digit roll number (e.g. 2026011001).');

            rollMigrationLog('verify start', { uid: currentUid, roll: raw });

            let rosterEntry = null;
            try {
                const snap = await getDoc(doc(studentRosterCollection, raw));
                rosterEntry = snap.exists() ? snap.data() : null;
            } catch (e) { rollMigrationLog('roster read error', e && e.code); }
            // FIX (D2): backend API mirror of admission_data.csv — keeps verification
            // working when the studentRoster read fails (rules/CDN/App Check hiccups).
            if (!rosterEntry) {
                const apiRec = (typeof apiFetchRoster === 'function') ? await apiFetchRoster(raw) : null;
                if (apiRec && apiRec.applicantName) {
                    rosterEntry = apiRec;
                    rollMigrationLog('roster resolved via backend API', { roll: raw });
                }
            }
            if (!rosterEntry) {
                fail('That roll number was not found in the B.Tech 2026–27 admission roster. Only published roll numbers can be verified.');
                rollMigrationLog('roster miss', { roll: raw });
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
            } catch (e) { rollMigrationLog('claim read failed', e && e.code); }
            if (claim) {
                if (claim.uid === currentUid && claim.rollNumber === raw) {
                    await finalizeRollVerification(raw, rosterName, mappedBranch, rosterSection);
                    showToast('✓ Roll number verified: ' + raw);
                    return;
                }
                fail('This roll number is already linked to a different account. Contact an administrator if you believe this is an error.');
                await setMigrationState('rejected', raw, 'already-claimed');
                renderMigrationStatus();
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
                    return;
                }
                rollMigrationLog('claim write failed', { roll: raw, code: code || String(e) });
                if (code !== 'already-exists') {
                    // Unknown failure — surface it honestly, keep the user pending.
                    fail('Verification could not be saved right now (' + (code || 'network error') + '). Your account is unchanged — please try again.');
                    return;
                }
                fail('This roll number was claimed by another account at the same moment. It has been flagged for manual review.');
                await setMigrationState('manual_review', raw, 'claim-race');
                renderMigrationStatus();
                return;
            }

            await finalizeRollVerification(raw, rosterName, mappedBranch, rosterSection);
            showToast('✓ Roll number verified: ' + raw);
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
                        const reasons = u.migrationReviewReason ? ' <small style="color:var(--brick);">(' + escapeHtml(u.migrationReviewReason) + ')</small>' : '';
                        const actions = (u.migrationStatus === 'verified')
                            ? '<span style="color:var(--moss);">✓ verified</span>'
                            : '<button class="btn-primary" style="margin:0 4px 0 0;padding:5px 10px;font-size:12px;" onclick="adminApproveRoll(\'' + u.id + '\',\'' + escapeHtml(u.username || '') + '\',\'' + roll + '\')">Approve</button>' +
                              '<button class="btn-secondary" style="margin:0 4px 0 0;padding:5px 10px;font-size:12px;" onclick="adminRejectRoll(\'' + u.id + '\',\'' + roll + '\')">Reject</button>' +
                              '<button class="btn-secondary" style="margin:0;padding:5px 10px;font-size:12px;" onclick="adminManualRoll(\'' + u.id + '\')">Review</button>';
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
                    '<button class="btn-primary" style="margin:0;padding:8px 18px;" onclick="adminRollLookup()">Look up</button>' +
                    '</div><div id="adminRollLookupResult" style="margin-top:10px;font-size:13px;line-height:1.6;"></div></div>';
                el.innerHTML = html;
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
                        html += `
                  <div class="post-item ${p.pinned ? 'pinned' : ''}">
                    <div class="post-title">${p.title} ${p.pinned ? '📌' : ''}</div>
                    <div class="post-meta">by ${p.author || 'admin'} · ${date}</div>
                    <div class="post-content">${p.content}</div>
                    <div class="actions" style="margin-top:6px;display:flex;gap:6px;">
                      <button class="btn-sm ${p.pinned ? 'edit' : 'pin'}" onclick="togglePinPost('${p.id}', ${!p.pinned})">${p.pinned ? 'Unpin' : 'Pin'}</button>
                      <button class="btn-sm delete" onclick="deletePost('${p.id}')">Delete</button>
                    </div>
                  </div>
                `;
                    });
                }
                html += `</div>`;
                el.innerHTML = html;
            } catch (e) {
                el.innerHTML = `<div class="empty-note">Error loading posts: ${e.message}</div>`;
            }
        }

        async function addPost() {
            const title = document.getElementById('postTitle').value.trim();
            const content = document.getElementById('postContent').value.trim();
            const pinned = document.getElementById('postPinned').checked;
            if (!title || !content) { showToast('Fill in title and content.'); return; }
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
            try {
                await updateDoc(doc(postsCollection, id), { pinned });
                showToast(pinned ? 'Post pinned.' : 'Post unpinned.');
                renderAdminPosts();
                renderPostsFeed();
            } catch (e) { showToast('Error: ' + e.message); }
        }

        async function deletePost(id) {
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

        // ========== RENDER: Posts Feed ==========

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
                html += `
              <div class="post-item ${p.pinned ? 'pinned' : ''}" style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--paper-line);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span class="post-title" style="font-size:13px;font-weight:600;">${p.title} ${p.pinned ? '📌' : ''}</span>
                  <span style="font-size:10px;color:var(--ink-soft);">${date}</span>
                </div>
                <div class="post-content" style="font-size:12px;margin-top:2px;color:var(--ink-soft);">${p.content}</div>
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


        function toggleChessClub(show) {
            const chessView = document.getElementById('chessClubView');
            const mainShell = document.getElementById('mainShell');
            const app = document.getElementById('app');
            if (show) {
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

        async function submitCommunityPost(e) {
            e.preventDefault();
            if (!currentUser) { showToast('Please log in first.'); return; }
            if (!isAdmin) { showToast('Only admins can create posts.'); return; }
            const errorEl = document.getElementById('cpFormError');
            errorEl.style.display = 'none';

            const title = document.getElementById('cpTitle').value.trim();
            const content = document.getElementById('cpContent').value.trim();
            const fileInput = document.getElementById('cpImage');

            if (!title) { errorEl.textContent = 'Please enter a title.';
                errorEl.style.display = 'block'; return; }
            if (!content) { errorEl.textContent = 'Please enter some content.';
                errorEl.style.display = 'block'; return; }

            let imageUrl = null;
            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                const path = `communityPosts/${currentUid}/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, path);
                try {
                    await uploadBytes(storageRef, file);
                    imageUrl = await getDownloadURL(storageRef);
                } catch (err) {
                    console.warn('Image upload failed, proceeding without image:', err);
                    showToast('⚠️ Image upload failed, but post will be saved without it.');
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
                    <div class="cp-author">${post.name || 'Unknown'} <span>@${post.username || '—'}</span>
                      <span class="cp-admin-badge">Admin</span>
                    </div>
                    <div class="cp-title">${post.title}</div>
                  </div>
                  <div class="cp-time">${date}</div>
                </div>
                <div class="cp-body">${post.content}</div>
                ${post.imageUrl ? `<img src="${post.imageUrl}" class="cp-image" alt="Post image" loading="lazy" />` : ''}
                <div class="cp-actions">
                  <button class="cp-like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${post.id}')">
                    ${isLiked ? '❤️' : '🤍'} <span class="cp-like-count">${likeCount}</span>
                  </button>
                  ${isOwn ? `<button class="cp-delete-btn" onclick="deleteCommunityPost('${post.id}')">🗑️ Delete</button>` : ''}
                </div>
              </div>
            `;
            });

            feed.innerHTML = html;
        }

        async function toggleLike(postId) {
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
            if (!confirm('Delete this post? This cannot be undone.')) return;
            try {
                const postRef = doc(communityPostsCollection, postId);
                const snap = await getDoc(postRef);
                if (!snap.exists()) { showToast('Post not found.'); return; }
                const data = snap.data();
                if (data.uid !== currentUid) { showToast('You can only delete your own posts.'); return; }
                if (data.imageUrl) {
                    try {
                        const imageRef = ref(storage, data.imageUrl);
                        await deleteObject(imageRef);
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
            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                const path = `feedback/${currentUid}/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, path);
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
                        `<strong>${latest.ticketId || '—'}</strong> — ${latest.subject} <span style="color:var(--ink-soft);font-size:11px;">(${statusMap[latest.status] || latest.status} · ${date})</span>`;
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
                      <span class="fb-ticket">${f.ticketId || '—'}</span>
                      <span class="fb-subject">${f.subject}</span>
                    </div>
                    <span class="fb-status-badge ${statusMap[f.status] || 'fb-status-open'}">${statusLabel[f.status] || 'Open'}</span>
                  </div>
                  <div class="fb-meta">
                    <span class="${priorityClass}">${f.priority?.toUpperCase() || 'MEDIUM'}</span>
                    · ${f.category} · ${date}
                  </div>
                  <div class="fb-message">${f.message}</div>
                  ${f.attachment ? `<a href="${f.attachment}" target="_blank" class="fb-attachment-link">📎 View Attachment</a>` : ''}
                  ${f.adminReply ? `
                    <div class="fb-reply">
                      <div class="fb-reply-label">💬 Admin Reply</div>
                      ${f.adminReply}
                      <div style="font-size:10px;color:var(--ink-soft);margin-top:4px;">${f.repliedBy ? 'by ' + f.repliedBy : ''} · ${f.adminReplyAt ? new Date(f.adminReplyAt.seconds * 1000).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : ''}</div>
                    </div>
                  ` : ''}
                  <div class="fb-actions">
                    ${f.status === 'open' ? `<button class="btn-sm delete" onclick="deleteMyFeedback('${f.id}')">Delete</button>` : ''}
                  </div>
                </div>
              `;
                });

                body.innerHTML = html;
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
                  <input class="search-box" placeholder="Search by name, username, ticket, subject…" value="${adminFeedbackSearch}" oninput="adminFeedbackSearch=this.value;renderAdminFeedback();" />
                  <div class="fb-admin-filters">
                    <button class="filter-btn ${adminFeedbackFilter==='all'?'active':''}" onclick="adminFeedbackFilter='all';renderAdminFeedback();">All</button>
                    <button class="filter-btn ${adminFeedbackFilter==='open'?'active':''}" onclick="adminFeedbackFilter='open';renderAdminFeedback();">Open</button>
                    <button class="filter-btn ${adminFeedbackFilter==='high'?'active':''}" onclick="adminFeedbackFilter='high';renderAdminFeedback();">High Priority</button>
                    <button class="filter-btn ${adminFeedbackFilter==='resolved'?'active':''}" onclick="adminFeedbackFilter='resolved';renderAdminFeedback();">Resolved</button>
                    <button class="filter-btn ${adminFeedbackFilter==='closed'?'active':''}" onclick="adminFeedbackFilter='closed';renderAdminFeedback();">Closed</button>
                  </div>
                </div>
                <div class="feedback-empty">No feedback tickets found.</div>
              `;
                    return;
                }

                let html = `
              <div class="fb-admin-search">
                <input class="search-box" placeholder="Search by name, username, ticket, subject…" value="${adminFeedbackSearch}" oninput="adminFeedbackSearch=this.value;renderAdminFeedback();" />
                <div class="fb-admin-filters">
                  <button class="filter-btn ${adminFeedbackFilter==='all'?'active':''}" onclick="adminFeedbackFilter='all';renderAdminFeedback();">All</button>
                  <button class="filter-btn ${adminFeedbackFilter==='open'?'active':''}" onclick="adminFeedbackFilter='open';renderAdminFeedback();">Open</button>
                  <button class="filter-btn ${adminFeedbackFilter==='high'?'active':''}" onclick="adminFeedbackFilter='high';renderAdminFeedback();">High Priority</button>
                  <button class="filter-btn ${adminFeedbackFilter==='resolved'?'active':''}" onclick="adminFeedbackFilter='resolved';renderAdminFeedback();">Resolved</button>
                  <button class="filter-btn ${adminFeedbackFilter==='closed'?'active':''}" onclick="adminFeedbackFilter='closed';renderAdminFeedback();">Closed</button>
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
                  <td><span class="fb-ticket" style="font-weight:600;">${f.ticketId || '—'}</span></td>
                  <td>${f.name || '—'}<br/><span style="font-size:10px;color:var(--ink-soft);">@${f.username || '—'}</span></td>
                  <td>${shortBranch}<br/><span style="font-size:10px;color:var(--ink-soft);">Sec ${f.section || '—'}</span></td>
                  <td>${f.category || '—'}</td>
                  <td><span class="${f.priority === 'high' ? 'fb-priority-high' : f.priority === 'medium' ? 'fb-priority-medium' : 'fb-priority-low'}">${f.priority?.toUpperCase() || 'MED'}</span></td>
                  <td><span class="fb-status-badge ${statusMap[f.status] || 'fb-status-open'}">${statusLabel[f.status] || 'Open'}</span></td>
                  <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${f.subject || ''}">${f.subject || '—'}</td>
                  <td>
                    <div class="fb-admin-actions">
                      <button class="btn-sm reply-btn" onclick="openAdminReply('${f.id}')">Reply</button>
                      <button class="btn-sm status-btn" onclick="changeFeedbackStatus('${f.id}')">Status</button>
                      <button class="btn-sm del-btn" onclick="deleteFeedbackAdmin('${f.id}')">Delete</button>
                    </div>
                  </td>
                </tr>
              `;
                });

                html += `</tbody></table></div>`;
                el.innerHTML = html;
            } catch (e) {
                el.innerHTML = `<div class="feedback-empty">Error loading feedback: ${e.message}</div>`;
            }
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
            if (!confirm('Delete this feedback permanently?')) return;
            try {
                const snap = await getDoc(doc(feedbackCollection, feedbackId));
                if (snap.exists() && snap.data().attachment) {
                    try {
                        const attachmentRef = ref(storage, snap.data().attachment);
                        await deleteObject(attachmentRef);
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
                    document.getElementById('ratingExisting').innerHTML =
                        `⭐ You rated ${existingRating.rating} stars. You can update your rating below.`;
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

        async function boot() {
            populateBranchOptions();
            await fetchHolidays();

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
                    // Always dismiss the (hard) roll gate when signing out so the
                    // login screen is never stuck behind the overlay.
                    rollGateLocked = false;
                    const _migrationModalEl = document.getElementById('migrationModal');
                    if (_migrationModalEl) _migrationModalEl.classList.remove('open');
                    updatePushButtonUI();
                    return;
                }
                try {
                    const record = await loadUserProfile(user.uid);
                    if (record.username === 'tanish' && !record.isAdmin) {
                        await updateDoc(doc(usersCollection, user.uid), { isAdmin: true });
                        record.isAdmin = true;
                    }
                    await loginAs(record, user.uid);
                    document.getElementById('loadingScreen').style.display = 'none';
                    setTimeout(() => renderPostsFeed(), 500);
                } catch (e) {
                    if (signingUp) return;
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

        window.toggleLedgerAI = toggleLedgerAI;
        window.clearLedgerAI = clearLedgerAI;
        window.sendLedgerAIMessage = sendLedgerAIMessage;
        window.handleLedgerAIKeydown = handleLedgerAIKeydown;
        window.autoResizeLedgerInput = autoResizeLedgerInput;

        document.addEventListener('DOMContentLoaded', () => {
            const syllabusBranch = document.getElementById('syllabusBranch');
            if (syllabusBranch) {
                syllabusBranch.addEventListener('change', loadSyllabus);
            }
            const syllabusYear = document.getElementById('syllabusYear');
            if (syllabusYear) {
                syllabusYear.addEventListener('change', loadSyllabus);
            }
        });

        boot();
