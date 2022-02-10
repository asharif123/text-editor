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

// Activate - storing info that gets cached data that gets used
self.addEventListener("activate", (event) => {
  console.log("Service worker activated");
  // remove unwanted caches
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

//  show cached files if online;
// when this is called from main program, verify if fetch call part of api
// store information in cache
self.addEventListener("fetch", (event) => {
  console.log("Service worker fetching", event.request.url);
  // storing in the cache and uploading later
  // storing new data in memory, when you reconnect internet it readds data from memory to api
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

  // serve static assets if no API is available
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request);
      });
    })
  );
});