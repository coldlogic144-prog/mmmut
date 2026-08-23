// ============================================================
// firebase-messaging-sw.js
// Firebase Cloud Messaging service worker for The Ledger.
// Handles BACKGROUND push notifications only (the page itself
// handles foreground messages via onMessage() in index.html).
//
// This file must live in the SAME directory as index.html
// (site root) so its default scope covers the whole site.
// ============================================================

importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js");

// Same public Firebase config already used by index.html.
// The apiKey here is a public client identifier, not a secret —
// this matches standard Firebase web setup and contains no
// private/VAPID key.
firebase.initializeApp({
    apiKey: "AIzaSyDMLvLIZkPFO5nsVQBr2IA-8BRB5Hzb3Xo",
    authDomain: "student-erp-77605.firebaseapp.com",
    projectId: "student-erp-77605",
    storageBucket: "student-erp-77605.firebasestorage.app",
    messagingSenderId: "734576815247",
    appId: "1:734576815247:web:70afe502f427337cbad4fa"
});

const messaging = firebase.messaging();

// The origin/path notifications should open or focus.
const LEDGER_URL = "https://coldlogic144-prog.github.io/-python/";

messaging.onBackgroundMessage((payload) => {
    console.log("[firebase-messaging-sw.js] Background message received:", payload);

    const title =
        (payload.notification && payload.notification.title) ||
        (payload.data && payload.data.title) ||
        "The Ledger";

    const body =
        (payload.notification && payload.notification.body) ||
        (payload.data && payload.data.body) ||
        "";

    const icon =
        (payload.notification && payload.notification.icon) ||
        (payload.data && payload.data.icon) ||
        undefined;

    const notificationOptions = {
        body,
        icon,
        data: payload.data || {}
    };

    self.registration.showNotification(title, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.startsWith(LEDGER_URL) && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(LEDGER_URL);
            }
        })
    );
});
