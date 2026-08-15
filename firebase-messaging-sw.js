importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDMLvLIZkPFO5nsVQBr2IA-8BRB5Hzb3Xo",
  authDomain: "student-erp-77605.firebaseapp.com",
  projectId: "student-erp-77605",
  storageBucket: "student-erp-77605.firebasestorage.app",
  messagingSenderId: "734576815247",
  appId: "1:734576815247:web:70afe502f427337cbad4fa"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  const title = payload.notification?.title || "Ledger";
  const options = {
    body: payload.notification?.body || "You have a new notification.",
    icon: "/-python/icon-192.png",
    badge: "/-python/icon-192.png",
    data: payload.data || {}
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow("https://coldlogic144-prog.github.io/-python/");
      }
    })
  );
});
