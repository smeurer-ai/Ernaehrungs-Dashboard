// service-worker.js
// Version muss mit js/version.js synchron gehalten werden.
// Bei jedem Phase-Release: APP_VERSION hochzählen.
const APP_VERSION = '1.1.0';
const CACHE_STATIC = `ernaehrung-static-${APP_VERSION}`;
const CACHE_CDN    = `ernaehrung-cdn-${APP_VERSION}`;

// ── Lokale Assets (vollständig pre-cachen beim Install) ──────────────────────
const LOCAL_ASSETS = [
  './ernaehrung.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './js/app.js',
  './js/lib.js',
  './js/version.js',
  './js/sync/deviceId.js',
  './js/storage/migrations.js',
  './js/storage/indexeddb.js',
  './js/storage/localStorage.js',
  './js/storage/exportImport.js',
  './js/calc/bmr.js',
  './js/calc/macros.js',
  './js/calc/nutritionLogic.js',
  './js/data/mealTemplates.js',
  './js/data/tips.js',
  './js/hooks/useProfile.js',
  './js/hooks/useSettings.js',
  './js/hooks/useUiState.js',
  './js/ui/theme.js',
  './js/ui/Navigation.js',
  './js/ui/Modal.js',
  './js/ui/KcalRing.js',
  './js/ui/MacroBar.js',
  './js/ui/Toast.js',
  './js/ui/ErrorBoundary.js',
  './js/ui/BackupReminderBanner.js',
  './js/ui/UpdateBanner.js',
  './js/pwa/registerServiceWorker.js',
  './js/tabs/heute/DayTypeSwitch.js',
  './js/tabs/heute/DaySummary.js',
  './js/tabs/heute/MealPlanEntry.js',
  './js/tabs/heute/MealPlanList.js',
  './js/tabs/heute/HeuteTab.js',
  './js/tabs/tracker/TrackerTab.js',
  './js/tabs/rezepte/RezepteTab.js',
  './js/tabs/woche/WeekGrid.js',
  './js/tabs/woche/WocheTab.js',
  './js/tabs/profil/DataManagement.js',
  './js/tabs/profil/ErststartAssistent.js',
  './js/tabs/profil/PostmenopausalInfo.js',
  './js/tabs/profil/ProfilTab.js',
  './js/tabs/profil/SettingsPanel.js',
  './js/tabs/profil/ProfileEditor.js',
];

// ── CDN-Assets (best-effort pre-cachen, Fehler erlaubt) ──────────────────────
const CDN_ASSETS = [
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0/client',
  'https://esm.sh/htm@3.1.1',
  'https://cdn.jsdelivr.net/npm/idb@8/+esm',
];

// ── Install: alle lokalen Assets synchron cachen ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(LOCAL_ASSETS))
      .then(() =>
        caches.open(CACHE_CDN).then(cache =>
          Promise.allSettled(CDN_ASSETS.map(url => cache.add(url)))
        )
      )
  );
  // KEIN skipWaiting() hier — neuer SW wartet, bis UpdateBanner die Nutzerin fragt
});

// ── Activate: alte Caches löschen + Kontrolle übernehmen ─────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k.startsWith('ernaehrung-') && !k.endsWith(APP_VERSION))
            .map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: Requests abfangen und aus Cache bedienen ──────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // ── Lokale Assets: Cache-First ──
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_STATIC).then(c => c.put(request, clone));
          }
          return resp;
        });
      })
    );
    return;
  }

  // ── CDN (esm.sh + jsdelivr): Stale-While-Revalidate ──
  if (url.hostname === 'esm.sh' || url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(
      caches.open(CACHE_CDN).then(cache =>
        cache.match(request).then(cached => {
          const networkFetch = fetch(request).then(resp => {
            if (resp.ok) cache.put(request, resp.clone());
            return resp;
          }).catch(() => cached);
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // ── Alles andere: Network-First mit Cache-Fallback ──
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ── Nachricht vom Client: skipWaiting auf explizite Anforderung ──────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
