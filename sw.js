// WeResence Sovereign Service Worker v2.2 (Network-First HTML & Instant Cache Purge)
const CACHE_NAME = 'weresence-v2.2-force-purge';
const STATIC_ASSETS = [
  '/manifest.json',
  '/assets/logo-transparent.png',
  '/assets/app-icon-192.png',
  '/assets/app-icon-512.png',
  '/assets/emblem-512.png',
  '/assets/favicon-32.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Cache assets warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Purge ALL older caches immediately
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Purging stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // 1. Bypass any API, Supabase, or dynamic endpoints
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase.co') || url.hostname.includes('firebaseio.com') || url.hostname.includes('googleapis.com')) {
    return;
  }

  // 2. NETWORK-FIRST for HTML pages so mobile users ALWAYS get the latest version immediately!
  const isHtml = event.request.mode === 'navigate' || 
                 event.request.destination === 'document' || 
                 url.pathname === '/' || 
                 url.pathname.endsWith('.html');

  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request) || caches.match('/index.html');
        })
    );
    return;
  }

  // 3. Cache-first for static icons/images with background refresh
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
