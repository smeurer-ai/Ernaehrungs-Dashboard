/**
 * registerServiceWorker.js
 *
 * Registriert den Service Worker und erkennt verfügbare Updates.
 * Update-Flow:
 *   1. Neue SW-Version installiert sich (State: 'installed', 'waiting')
 *   2. onUpdateAvailable(registration) wird aufgerufen → UI zeigt UpdateBanner
 *   3. Nutzer klickt "Jetzt laden" → skipWaiting(registration) schickt SKIP_WAITING
 *   4. SW übernimmt → 'controllerchange' → Seite lädt neu
 */

/**
 * Service Worker registrieren.
 * @param {function} onUpdateAvailable - Callback mit SW-Registration wenn Update wartet
 */
export function registerServiceWorker(onUpdateAvailable) {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(registration => {
        registration.update().catch(() => {});

        function trackInstalling(sw) {
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              onUpdateAvailable(registration);
            }
          });
        }

        if (registration.installing) {
          trackInstalling(registration.installing);
        }

        registration.addEventListener('updatefound', () => {
          if (registration.installing) {
            trackInstalling(registration.installing);
          }
        });
      })
      .catch(err => {
        console.warn('[SW] Registrierung fehlgeschlagen:', err);
      });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

/**
 * Sendet SKIP_WAITING an den wartenden SW → löst controllerchange aus.
 * @param {ServiceWorkerRegistration} registration
 */
export function skipWaiting(registration) {
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}
