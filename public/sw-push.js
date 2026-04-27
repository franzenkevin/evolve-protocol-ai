// Push notification service worker
self.addEventListener('push', (event) => {
  let data = { title: 'EVORIA', body: 'Nova notificação' };
  try {
    data = event.data?.json() || data;
  } catch { /* use defaults */ }

  const url = data.data?.url || '/';
  const tag = data.data?.url ? `notif-${data.data.url}` : 'hypertrophy-notif';

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      vibrate: [200, 100, 200],
      tag,
      data: { url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
