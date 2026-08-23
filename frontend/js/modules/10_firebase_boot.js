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