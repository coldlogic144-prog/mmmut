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
