const CACHE_NAME = "fouri-sper-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const { title, body, url } = event.data.json();

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/pwa-icon-192",
      badge: "/pwa-icon-192",
      // Nieuwe oproep vervangt een vorige i.p.v. dat ze zich opstapelen in
      // het meldingenscherm, en de trilling maakt 'm net wat opvallender
      // dan een standaard stille melding.
      tag: "shuss-oproep",
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: url || "/" },
    })
  );
});

// Focust een al open tab op de juiste url i.p.v. altijd een nieuw tabblad
// te openen — de app draait meestal al als PWA op de hoofdtelefoon.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (new URL(client.url).pathname === url && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

// Network-first, falling back to the last cached copy when offline. Server
// actions and Supabase auth flows are POSTs and never hit this cache.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? Response.error()))
  );
});
