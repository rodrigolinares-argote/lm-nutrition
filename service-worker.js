/**
 * LM Nutrition — Service Worker
 * Cache-first para el app shell. Soporte offline completo.
 */

const CACHE = 'lm-nutrition-v1';

const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/tokens.css',
  '/css/base.css',
  '/css/components.css',
  '/css/animations.css',
  '/js/app.js',
  '/js/utils/router.js',
  '/js/utils/eventBus.js',
  '/js/utils/dateUtils.js',
  '/js/utils/macroCalc.js',
  '/js/storage/db.js',
  '/js/storage/schema.js',
  '/js/services/NutritionService.js',
  '/js/services/FoodService.js',
  '/js/services/ProfileService.js',
  '/js/components/Toast.js',
  '/js/components/Modal.js',
  '/js/components/BottomNav.js',
  '/js/components/MacroRing.js',
  '/js/modules/Dashboard.js',
  '/js/modules/Log.js',
  '/js/modules/Foods.js',
  '/js/modules/Progress.js',
  '/js/modules/Profile.js',
  '/assets/logo/logo.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Recursos de Google Fonts: network-first, cache fallback
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // App shell: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(r => {
        if (r && r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        return r;
      });
    })
  );
});
