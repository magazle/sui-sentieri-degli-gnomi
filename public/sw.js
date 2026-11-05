// Service worker minimo: guscio dell'app in cache, tile della mappa
// in cache man mano che vengono viste (stale-while-revalidate).
const APP = "gnomi-app-v2";
const TILES = "gnomi-tiles-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(APP).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => ![APP, TILES].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  if (url.hostname === "tiles.openfreemap.org") {
    e.respondWith(
      caches.open(TILES).then(async (c) => {
        const hit = await c.match(e.request);
        const net = fetch(e.request).then((r) => (r.ok && c.put(e.request, r.clone()), r)).catch(() => hit);
        return hit || net;
      }),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Pagine: rete prima, cache in caso di connessione assente.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copy = r.clone();
          caches.open(APP).then((c) => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Asset statici e audio: cache prima.
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((r) => {
          if (r.ok) {
            const copy = r.clone();
            caches.open(APP).then((c) => c.put(e.request, copy));
          }
          return r;
        }),
    ),
  );
});
