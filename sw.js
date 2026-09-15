/* Service worker mínimo: habilita la instalación como app (PWA) sin arriesgar
 * la frescura de los datos.
 *
 * - Precachea solo el "cascarón" (la página y los iconos).
 * - Navegaciones (abrir la app): network-first, con fallback al cascarón
 *   cacheado si no hay red → la app instalada abre aunque esté offline.
 * - TODO lo demás (data.json, APIs, objetos de Supabase, JS/CSS desde el
 *   bucket): pass-through directo a la red, SIN cachear — así el cache-buster
 *   de remote.js y los datos en vivo siguen intactos.
 */
const CACHE = "inversiones-shell-v1";
const SHELL = [
  "./",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/favicon.svg",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // addAll falla si algún recurso 404ea; se toleran individualmente.
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Solo se maneja la navegación (abrir la app); el resto pasa a la red tal cual.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => caches.match("./").then((r) => r || caches.match(req)))
    );
  }
  // Sin respondWith para el resto ⇒ comportamiento de red por defecto (no se cachea).
});
