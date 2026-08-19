const version = "cevenpro-pwa-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});

// Keeping this marker makes an update detectable without caching panel data.
self.addEventListener("message", (event) => {
  if (event.data === "cevenpro-version") event.source?.postMessage(version);
});
