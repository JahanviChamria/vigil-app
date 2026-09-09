// Vigil service worker. Two jobs: receive web push and show the notification,
// and focus the app when the notification is tapped. No offline caching in v1 —
// the app needs the network anyway for live prices, so a stale cache would only
// mislead. See IOS-PLAN.md phase 2.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  // The server sends { title, body }. Fall back gracefully if a push arrives
  // with no payload or a non-JSON body.
  let title = 'Vigil';
  let body = '';
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || '';
    } catch {
      body = event.data.text();
    }
  }

  // userVisibleOnly is set at subscribe time, so a notification MUST show or the
  // browser may drop the subscription.
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: 'icon.png',
      badge: 'icon.png',
      tag: 'vigil-alert',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('./');
    })
  );
});
