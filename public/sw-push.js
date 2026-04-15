// Push notification service worker
self.addEventListener('push', (event) => {
  let data = { title: 'Hypertrophy', body: 'Hora do treino! 🏋️' };
  try {
    data = event.data?.json() || data;
  } catch { /* use defaults */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      vibrate: [200, 100, 200],
      tag: 'training-reminder',
      data: { url: '/training' },
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
