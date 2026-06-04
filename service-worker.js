// service-worker.js
// Version muss mit js/version.js synchron gehalten werden.
const APP_VERSION = '1.2.7';
const CACHE_STATIC = `ernaehrung-static-${APP_VERSION}`;

// ── Lokale Assets (vollständig pre-cachen beim Install) ──────────────────────
const LOCAL_ASSETS = [
  './ernaehrung.html',
  './manifest.json',
  './assets/fonts/fonts.css',
  './assets/fonts/dm-mono-400.ttf',
  './assets/fonts/dm-sans-400.ttf',
  './assets/fonts/dm-sans-600.ttf',
  './assets/fonts/playfair-display-700.ttf',
  './assets/vendor/react.js',
  './assets/vendor/htm.js',
  './assets/vendor/idb.js',
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
  './js/calc/hydration.js',
  './js/calc/tracker.js',
  './js/hooks/useLog.js',
  './js/hooks/useFavoriteFoods.js',
  './js/tabs/tracker/TrackerTab.js',
  './js/tabs/tracker/DayLogList.js',
  './js/tabs/tracker/DayLogEntry.js',
  './js/tabs/tracker/FoodEntryModal.js',
  './js/tabs/tracker/FavoritePicker.js',
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
  './js/tabs/heute/HydrationCard.js',
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

// ── Install: alle lokalen Assets synchron cachen ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => cache.addAll(LOCAL_ASSETS))
  );
  // KEIN skipWaiting() — neuer SW wartet, bis UpdateBanner die Nutzerin fragt
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

  // Alles andere: Network-First mit Cache-Fallback
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
