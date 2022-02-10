// Cache
const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v2";
const CACHE_FILES = [
  "/",
  "/index.html",
  "/index.js",
  "/styles.css",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// Install Event
self.addEventListener("install", (event) => {
  console.log("Service worker installed");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  console.log("Service worker activated");
  //   Remove old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== DATA_CACHE_NAME) {
            console.log("Clearing old cache", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // If any other service workers are claiming thread
  self.clients.claim();
});

// Fetch;
self.addEventListener("fetch", (event) => {
  console.log("Service worker fetching", event.request.url);
  // Check if live is available,  no connection = fail to .catch, match file from cache
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      caches
        .open(DATA_CACHE_NAME)
        .then((cache) => {
          return fetch(event.request)
            .then((response) => {
              if (response.status === 200) {
                cache.put(event.request.url, response.clone());
              }
              return response;
            })
            .catch((error) => {
              return cache.match(event.request);
            });
        })
        .catch((error) => console.log(error))
    );
    return;
  }

  // If API request not available, serve static assets
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request);
      });
    })
  );
});