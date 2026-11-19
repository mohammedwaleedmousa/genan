const SHELL_CACHE = "genan-shell-v6";
const PREVIOUS_SHELL_CACHE = "genan-shell-v5";
const LEGACY_SHELL_CACHE = "genan-shell-v3";
const IMAGE_CACHE = "genan-images-v4";
const LEGACY_IMAGE_CACHES = new Set(["genan-images-v2", "genan-images-v3"]);
const SHELL_PATH = "/index.html";
const APP_SHELL = [SHELL_PATH, "/manifest.json"];
const CATALOG_PATHS = new Set([
  "/", "/index", SHELL_PATH, "/home", "/products", "/categories",
  "/new-arrivals", "/best-sellers", "/seasonal-offers", "/brands",
]);

const isCatalogPage = (url) => {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  return CATALOG_PATHS.has(path) || /^\/(?:brands?|campaign)\/[^/]/.test(path);
};

const isHtml = (response) => (response.headers.get("content-type") || "").includes("text/html");

const isCacheableImage = (response) =>
  response.ok && (response.headers.get("content-type") || "").startsWith("image/");

const isSupabaseImage = (url) =>
  url.hostname.endsWith("supabase.co") &&
  (url.pathname.includes("/storage/v1/object/public/") || url.pathname.includes("/storage/v1/render/image/public/"));

const isStorefrontImageRequest = (request, url) =>
  request.destination === "image" && url.origin === self.location.origin;

const staleWhileRevalidateImage = async (request, event) => {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (isCacheableImage(response)) {
        const copy = response.clone();
        event.waitUntil(cache.put(request, copy).catch(() => {}));
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(networkPromise);
    return cached;
  }

  const network = await networkPromise;
  if (network) return network;

  return new Response("", { status: 504, statusText: "Image unavailable" });
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL.map((path) => new Request(path, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => (key.startsWith("genan-shell-") && key !== SHELL_CACHE) || LEGACY_IMAGE_CACHES.has(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();

      const refreshCatalog = keys.includes(LEGACY_SHELL_CACHE);
      const refreshQr = keys.includes(PREVIOUS_SHELL_CACHE);
      if (refreshCatalog || refreshQr) {
        const windows = await self.clients.matchAll({ type: "window" });
        for (const client of windows) {
          const url = new URL(client.url);
          const needsRefresh = (refreshCatalog && isCatalogPage(url)) ||
            (refreshQr && url.pathname.replace(/\/+$/, "") === "/qr-code");
          if (client.frameType === "top-level" && needsRefresh && client.navigate) {
            // Let activation finish before the browser waits for the navigation response.
            void client.navigate(client.url).catch(() => {});
          }
        }
      }
    })(),
  );
});

const navigateFromNetwork = async (request, url, event) => {
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response.ok && !response.redirected && isHtml(response) && isCatalogPage(url)) {
      const copy = response.clone();
      event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.put(SHELL_PATH, copy)).catch(() => {}));
    }
    return response;
  } catch {
    return (await caches.match(SHELL_PATH, { cacheName: SHELL_CACHE }).catch(() => null)) || Response.error();
  }
};

const serveAsset = async (request, event) => {
  const cached = await caches.match(request, { cacheName: SHELL_CACHE }).catch(() => null);
  if (cached) return cached;

  const response = await fetch(request);
  // A missing hashed asset can be served the SPA document by the hosting fallback.
  if (response.ok && !isHtml(response)) {
    const copy = response.clone();
    event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy)).catch(() => {}));
  }
  return response;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.headers.has("authorization")) return;

  const url = new URL(request.url);

  // Catalog media already has immutable HTTP caching. Let the browser fetch
  // it directly, independently of the cached app shell and opaque responses.
  if (isSupabaseImage(url) || (url.origin === self.location.origin &&
      url.pathname.startsWith("/assets/catalog-thumbnails/"))) return;

  if (isStorefrontImageRequest(request, url)) {
    event.respondWith(staleWhileRevalidateImage(request, event));
    return;
  }

  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/media/")) return;

  if (request.mode === "navigate") {
    event.respondWith(navigateFromNetwork(request, url, event));
    return;
  }

  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/images/")) {
    event.respondWith(serveAsset(request, event));
  }
});
