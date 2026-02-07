/**
 * Firebase Cloud Messaging Service Worker - Admin Panel
 * Handles background push notifications for admins
 */

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: 'AIzaSyCdXhnmw03UstZiyx83Asle88vWc7SqWGE',
  authDomain: 'bee-project-f73ed.firebaseapp.com',
  projectId: 'bee-project-f73ed',
  storageBucket: 'bee-project-f73ed.firebasestorage.app',
  messagingSenderId: '1068014463115',
  appId: '1:1068014463115:web:ac31c47e33c5c9911a0c8e',
  measurementId: 'G-YHJZM2JR56',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[Admin] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'New User Message';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: payload.data?.type || 'user_message',
    data: payload.data,
    requireInteraction: true, // Keep notification visible
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Admin] Notification clicked:', event);
  event.notification.close();

  // Open the admin panel chat
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If admin panel is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'OPEN_CHAT',
            userId: event.notification.data?.userId,
          });
          return client.focus();
        }
      }
      
      // Otherwise, open new window to chat page
      if (clients.openWindow) {
        return clients.openWindow('/support/live-chat');
      }
    })
  );
});
