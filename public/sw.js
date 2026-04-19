// Self-destroying service worker.
// Older builds registered a vite-plugin-pwa service worker that kept serving
// stale assets from the published domain. This replacement immediately
// unregisters itself and clears every cache so the next page load fetches the
// latest deployment directly from the network.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      } catch {
        // Ignore cache cleanup failures.
      }
      try {
        await self.registration.unregister();
      } catch {
        // Ignore unregister failures.
      }
      try {
        const clientList = await self.clients.matchAll({ type: "window" });
        clientList.forEach((client) => {
          if ("navigate" in client) {
            client.navigate(client.url);
          }
        });
      } catch {
        // Ignore reload failures.
      }
    })(),
  );
});