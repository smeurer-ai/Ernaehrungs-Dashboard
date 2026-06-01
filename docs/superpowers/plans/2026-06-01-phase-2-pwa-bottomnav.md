# Phase 2: PWA + Bottom-Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App als installierbare PWA auf dem Homescreen nutzbar machen (Offline, Icon, Vollbild) und die Tab-Navigation von oben nach unten verschieben.

**Architecture:** Service Worker cached alle lokalen Assets + CDN-Bibliotheken beim Install. Bei einer neuen App-Version wartet der neue SW und ein UpdateBanner fragt die Nutzerin nach Neustart. Die Navigation wechselt von horizontalen Top-Tabs zu einer fixierten Bottom-Navigation mit Icons.

**Tech Stack:** Vanilla Service Worker (kein Workbox), `manifest.json`, Python + Pillow für Icon-Generierung, htm + React (bestehend).

---

## Kontext & Dateistruktur

**Codebase:** `D:\Claude Projekte\Ernährungs-Dashboard\`  
**Framework:** React 18 via esm.sh, htm als JSX-Ersatz, native ES Modules — kein Build-Prozess.  
**Einstiegspunkt:** `ernaehrung.html` → `js/app.js`  
**Bibliotheksimporte:** alle in `js/lib.js` (esm.sh + jsdelivr CDN)

### Neue Dateien
| Datei | Zweck |
|---|---|
| `manifest.json` | PWA-Manifest (Name, Icons, Display, Theme) |
| `service-worker.js` | Cache-Logik mit Versions-Strategie |
| `icons/icon-192.png` | App-Icon 192×192 |
| `icons/icon-512.png` | App-Icon 512×512 |
| `icons/icon-maskable-512.png` | Maskable Icon für adaptive Icons (Android) |
| `js/pwa/registerServiceWorker.js` | SW registrieren, Update-Erkennung |
| `js/ui/UpdateBanner.js` | Banner "App-Update verfügbar – jetzt laden?" |

### Geänderte Dateien
| Datei | Änderung |
|---|---|
| `js/version.js` | APP_VERSION 1.0.0 → 1.1.0 |
| `js/ui/theme.js` | Neue Styles `S.bottomNav`, `S.bottomNavTab` ergänzen |
| `js/ui/Navigation.js` | Top-Tabs → Bottom-Navigation (mit Icons) |
| `ernaehrung.html` | `<link rel="manifest">`, `<meta theme-color>`, `<link rel="icon">` |
| `js/app.js` | SW registrieren, UpdateBanner einbinden |

---

## Task 1: Version bump + Preflight

**Files:**
- Modify: `js/version.js`

- [ ] **Step 1.1: Version hochzählen**

Inhalt von `js/version.js` ersetzen:

```javascript
export const APP_VERSION = '1.1.0';
export const SCHEMA_VERSION = 1; // Identisch mit IndexedDB-Version
```

- [ ] **Step 1.2: Prüfen, ob Python + Pillow verfügbar ist**

```bash
python -c "from PIL import Image; print('Pillow OK')"
```

Erwartete Ausgabe: `Pillow OK`  
Falls Fehler: `pip install Pillow` ausführen.

- [ ] **Step 1.3: Commit**

```bash
git add js/version.js
git commit -m "chore: bump version to 1.1.0 for Phase 2"
```

---

## Task 2: App-Icons erstellen

**Files:**
- Create: `icons/icon-192.png`
- Create: `icons/icon-512.png`
- Create: `icons/icon-maskable-512.png`

Die Icons zeigen ein goldenes „E" (für Ernährung) in einem Gold-Ring auf dunklem Hintergrund (#111).

- [ ] **Step 2.1: `icons/`-Ordner anlegen + Python-Script ausführen**

Script direkt als Einzeiler ausführen (working dir = Projekt-Root):

```bash
python - << 'EOF'
from PIL import Image, ImageDraw
import os

os.makedirs('icons', exist_ok=True)

def make_icon(size):
    gold = (200, 169, 110)   # #c8a96e
    dark = (17, 17, 17)      # #111
    img = Image.new('RGB', (size, size), dark)
    draw = ImageDraw.Draw(img)

    pad = size // 10
    lw = max(3, size // 45)

    # Gold-Ring (äußerer Kreis)
    draw.ellipse([pad, pad, size - 1 - pad, size - 1 - pad], outline=gold, width=lw)

    # „E" zentriert
    cx, cy = size // 2, size // 2
    h = size // 2        # Buchstaben-Höhe
    w = size // 4        # Buchstaben-Breite
    bar = max(2, size // 40)

    # Vertikaler Strich
    draw.rectangle([cx - w // 2, cy - h // 2, cx - w // 2 + bar, cy + h // 2], fill=gold)
    # Obere Querlinie
    draw.rectangle([cx - w // 2, cy - h // 2, cx + w // 2, cy - h // 2 + bar], fill=gold)
    # Mittlere Querlinie (etwas kürzer)
    draw.rectangle([cx - w // 2, cy - bar // 2, cx + w // 2 - bar * 2, cy + bar // 2], fill=gold)
    # Untere Querlinie
    draw.rectangle([cx - w // 2, cy + h // 2 - bar, cx + w // 2, cy + h // 2], fill=gold)

    return img

make_icon(192).save('icons/icon-192.png')
make_icon(512).save('icons/icon-512.png')
make_icon(512).save('icons/icon-maskable-512.png')
print('Icons erstellt: icons/icon-192.png, icons/icon-512.png, icons/icon-maskable-512.png')
EOF
```

Erwartete Ausgabe: `Icons erstellt: icons/icon-192.png, icons/icon-512.png, icons/icon-maskable-512.png`

- [ ] **Step 2.2: Icons visuell prüfen**

```bash
ls -la icons/
```

Erwartet: 3 PNG-Dateien, alle > 1 KB.  
Optional: in einem Browser öffnen und prüfen, ob das „E" auf goldenem Ring sichtbar ist.

- [ ] **Step 2.3: Commit**

```bash
git add icons/
git commit -m "feat: add PWA app icons (192, 512, maskable)"
```

---

## Task 3: manifest.json

**Files:**
- Create: `manifest.json`

- [ ] **Step 3.1: manifest.json erstellen**

Im Projekt-Root `manifest.json` anlegen:

```json
{
  "name": "Ernährungs-Tool",
  "short_name": "Ernährung",
  "description": "Postmenopausaler Ernährungsplan – Muskelerhalt & Fettabbau",
  "start_url": "./ernaehrung.html",
  "display": "standalone",
  "background_color": "#111111",
  "theme_color": "#111111",
  "orientation": "portrait-primary",
  "lang": "de",
  "icons": [
    {
      "src": "./icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "./icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "./icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["health", "fitness"]
}
```

- [ ] **Step 3.2: Commit**

```bash
git add manifest.json
git commit -m "feat: add PWA manifest"
```

---

## Task 4: service-worker.js

**Files:**
- Create: `service-worker.js`

**Strategie:**
- Lokale Assets: Cache-First (aus lokalem Cache, bei Miss: Netz + in Cache speichern)
- CDN-Assets (esm.sh, jsdelivr): Stale-While-Revalidate (aus Cache sofort, Netz im Hintergrund)
- HTML-Navigations-Requests: Cache-First
- Alte Caches beim `activate`-Event löschen
- `skipWaiting` NUR auf explizite Nachricht vom Client (für UpdateBanner-Pattern)

- [ ] **Step 4.1: service-worker.js erstellen**

Im Projekt-Root `service-worker.js` anlegen:

```javascript
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
          // allSettled: CDN-Fehler sollen den Install nicht abbrechen
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

  // Nur GET; Chrome-Extensions ignorieren
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
          }).catch(() => cached); // Netz-Fehler → gecachte Version behalten
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
```

- [ ] **Step 4.2: Commit**

```bash
git add service-worker.js
git commit -m "feat: add service worker with cache-first strategy + update pattern"
```

---

## Task 5: js/pwa/registerServiceWorker.js

**Files:**
- Create: `js/pwa/registerServiceWorker.js`

- [ ] **Step 5.1: Ordner anlegen + Datei erstellen**

```bash
mkdir -p "js/pwa"
```

`js/pwa/registerServiceWorker.js` anlegen:

```javascript
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
        // Sofort auf Updates prüfen (z.B. nach Browser-Cache-Ablauf)
        registration.update().catch(() => {});

        // Überwacht einen SW, der gerade installiert
        function trackInstalling(sw) {
          sw.addEventListener('statechange', () => {
            // 'installed' + controller vorhanden = neuer SW wartet, alter noch aktiv
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              onUpdateAvailable(registration);
            }
          });
        }

        // Fall 1: SW installiert sich beim Seitenaufruf
        if (registration.installing) {
          trackInstalling(registration.installing);
        }

        // Fall 2: Update wird in einer späteren Session gefunden
        registration.addEventListener('updatefound', () => {
          if (registration.installing) {
            trackInstalling(registration.installing);
          }
        });
      })
      .catch(err => {
        // Nur in Dev-Tools sichtbar; kein UI-Fehler (App funktioniert ohne SW)
        console.warn('[SW] Registrierung fehlgeschlagen:', err);
      });

    // Wenn Controller wechselt (nach skipWaiting): Seite neu laden
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
```

- [ ] **Step 5.2: Commit**

```bash
git add js/pwa/registerServiceWorker.js
git commit -m "feat: add service worker registration + update detection"
```

---

## Task 6: js/ui/UpdateBanner.js

**Files:**
- Create: `js/ui/UpdateBanner.js`

- [ ] **Step 6.1: UpdateBanner.js erstellen**

```javascript
import { html, useState } from '../lib.js';
import { COLORS, FONTS } from './theme.js';
import { skipWaiting } from '../pwa/registerServiceWorker.js';

/**
 * UpdateBanner
 *
 * Erscheint wenn eine neue App-Version als Service Worker wartet.
 * Props:
 *   registration — ServiceWorkerRegistration (null = kein Update)
 */
export function UpdateBanner({ registration }) {
  const [dismissed, setDismissed] = useState(false);

  if (!registration || dismissed) return null;

  function handleUpdate() {
    skipWaiting(registration);
    // Seiten-Reload erfolgt automatisch via 'controllerchange' in registerServiceWorker.js
  }

  return html`
    <div style=${{
      background: '#1a1a12',
      borderBottom: `2px solid ${COLORS.gold}`,
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexShrink: 0,
    }}>
      <span style=${{
        fontSize: '12px',
        color: COLORS.textMuted,
        fontFamily: FONTS.mono,
        letterSpacing: '0.04em',
      }}>
        🔄 App-Update verfügbar
      </span>
      <div style=${{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick=${handleUpdate}
          style=${{
            background: COLORS.gold,
            color: '#111',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: FONTS.mono,
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          Jetzt laden
        </button>
        <button
          onClick=${() => setDismissed(true)}
          style=${{
            background: 'transparent',
            color: COLORS.textMuted,
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '11px',
            fontFamily: FONTS.mono,
            cursor: 'pointer',
          }}
        >
          Später
        </button>
      </div>
    </div>
  `;
}
```

- [ ] **Step 6.2: Commit**

```bash
git add js/ui/UpdateBanner.js
git commit -m "feat: add UpdateBanner for PWA update flow"
```

---

## Task 7: Bottom-Navigation (Navigation.js + theme.js)

**Files:**
- Modify: `js/ui/theme.js` — neue Styles ergänzen
- Modify: `js/ui/Navigation.js` — komplett umschreiben

### 7a: theme.js erweitern

- [ ] **Step 7.1: Neue Styles zu theme.js hinzufügen**

Am Ende der `S`-Objekt-Definition (vor der schließenden `}`), folgende Einträge ergänzen:

```javascript
  // ── Bottom-Navigation (Phase 2) ──────────────────────────────────────────
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '62px',
    background: '#141414',
    borderTop: '1px solid #222',
    display: 'flex',
    zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom)', // iPhone Notch
  },
  bottomNavTab: a => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    border: 'none',
    borderTop: a ? `2px solid #c8a96e` : '2px solid transparent',
    background: 'transparent',
    color: a ? '#c8a96e' : '#d4d0c8',
    cursor: 'pointer',
    padding: '6px 4px 4px',
    fontFamily: "'DM Mono', monospace",
    fontSize: '9px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    transition: 'color 0.15s, border-color 0.15s',
  }),
  bottomNavIcon: { fontSize: '20px', lineHeight: 1 },
```

**Wichtig:** Die existierenden `S.tabs` und `S.tab` Styles NICHT entfernen (könnten später noch referenziert werden).

- [ ] **Step 7.2: Prüfen dass theme.js noch valides JS ist**

```bash
node -e "import('./js/ui/theme.js').then(() => console.log('OK')).catch(e => console.error(e))"
```

Erwartet: `OK`

### 7b: Navigation.js umschreiben

- [ ] **Step 7.3: Navigation.js komplett ersetzen**

```javascript
import { html } from '../lib.js';
import { S } from './theme.js';

const TABS = [
  { id: 'heute',   label: 'Heute',   icon: '🏠' },
  { id: 'tracker', label: 'Tracker', icon: '✏️'  },
  { id: 'rezepte', label: 'Rezepte', icon: '🥗'  },
  { id: 'woche',   label: 'Woche',   icon: '📅'  },
  { id: 'profil',  label: 'Profil',  icon: '👤'  },
];

/**
 * Bottom-Navigation — 5 Tabs fixiert am unteren Bildschirmrand.
 * Aktiver Tab: Gold-Akzentlinie oben + goldene Farbe.
 */
export function Navigation({ activeTab, onTabChange }) {
  return html`
    <nav style=${S.bottomNav} role="navigation" aria-label="Hauptnavigation">
      ${TABS.map(tab => html`
        <button
          key=${tab.id}
          style=${S.bottomNavTab(activeTab === tab.id)}
          onClick=${() => onTabChange(tab.id)}
          aria-label=${tab.label}
          aria-current=${activeTab === tab.id ? 'page' : undefined}
        >
          <span style=${S.bottomNavIcon}>${tab.icon}</span>
          <span>${tab.label}</span>
        </button>
      `)}
    </nav>
  `;
}
```

- [ ] **Step 7.4: Commit**

```bash
git add js/ui/Navigation.js js/ui/theme.js
git commit -m "feat: replace top tabs with bottom navigation"
```

---

## Task 8: ernaehrung.html erweitern

**Files:**
- Modify: `ernaehrung.html`

- [ ] **Step 8.1: ernaehrung.html aktualisieren**

Die Datei `ernaehrung.html` so anpassen (vollständiger neuer Inhalt):

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <meta name="theme-color" content="#111111"/>
  <meta name="apple-mobile-web-app-capable" content="yes"/>
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
  <meta name="apple-mobile-web-app-title" content="Ernährung"/>
  <title>Ernährungs-Tool · Stephanie Meurer</title>
  <link rel="manifest" href="./manifest.json"/>
  <link rel="icon" href="./icons/icon-192.png" type="image/png"/>
  <link rel="apple-touch-icon" href="./icons/icon-192.png"/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600&family=DM+Mono:wght@400;600&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; }
    body {
      background: #111;
      color: #f0ece4;
      font-family: 'DM Sans', sans-serif;
      -webkit-font-smoothing: antialiased;
      /* Verhindert Rubber-Band-Scrolling auf iOS */
      overscroll-behavior: none;
    }
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    input[type=number] { -moz-appearance: textfield; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: #111; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
    * { cursor: inherit; }
    body { cursor: default; }
    button, [role="button"], label[style*="cursor"] { cursor: pointer !important; }
    input, select, textarea { cursor: text; caret-color: #c8a96e; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./js/app.js"></script>
</body>
</html>
```

- [ ] **Step 8.2: Commit**

```bash
git add ernaehrung.html
git commit -m "feat: add PWA meta tags, manifest link, apple-touch-icon"
```

---

## Task 9: app.js — SW registrieren + UpdateBanner verdrahten

**Files:**
- Modify: `js/app.js`

- [ ] **Step 9.1: app.js anpassen**

Vollständiger neuer Inhalt für `js/app.js`:

```javascript
import { React, html, useState, useEffect, createRoot } from './lib.js';
import { runMigrations } from './storage/migrations.js';
import { useProfile } from './hooks/useProfile.js';
import { useSettings } from './hooks/useSettings.js';
import { useUiState } from './hooks/useUiState.js';
import { ToastProvider } from './ui/Toast.js';
import { ErrorBoundary } from './ui/ErrorBoundary.js';
import { Navigation } from './ui/Navigation.js';
import { BackupReminderBanner } from './ui/BackupReminderBanner.js';
import { UpdateBanner } from './ui/UpdateBanner.js';
import { HeuteTab } from './tabs/heute/HeuteTab.js';
import { TrackerTab } from './tabs/tracker/TrackerTab.js';
import { RezepteTab } from './tabs/rezepte/RezepteTab.js';
import { WocheTab } from './tabs/woche/WocheTab.js';
import { ProfilTab } from './tabs/profil/ProfilTab.js';
import { ErststartAssistent } from './tabs/profil/ErststartAssistent.js';
import { exportAll } from './storage/exportImport.js';
import { registerServiceWorker } from './pwa/registerServiceWorker.js';
import { S, COLORS, FONTS } from './ui/theme.js';

function App() {
  const [profile, setProfile, calculated] = useProfile();
  const [settings, updateSettings] = useSettings();
  const [uiState, updateUiState] = useUiState();
  const [migrationError, setMigrationError] = useState(null);
  const [migrationDone, setMigrationDone] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null); // für UpdateBanner

  // Migrationen beim Start ausführen
  useEffect(() => {
    runMigrations().then(result => {
      if (!result.ok) setMigrationError(result.error);
      setMigrationDone(true);
    });
  }, []);

  // Service Worker registrieren (einmalig nach Mount)
  useEffect(() => {
    registerServiceWorker(registration => {
      // Neue Version wartet → Banner anzeigen
      setSwRegistration(registration);
    });
  }, []);

  // Warte auf Migration
  if (!migrationDone) {
    return html`
      <div style=${{ ...S.app, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style=${{ textAlign: 'center', color: COLORS.textMuted }}>
          <div style=${{ fontSize: '32px', marginBottom: '16px' }}>🥗</div>
          <div style=${{ fontFamily: FONTS.mono, fontSize: '12px' }}>Starte…</div>
        </div>
      </div>
    `;
  }

  // Migrations-Fehler
  if (migrationError) {
    return html`
      <div style=${{ ...S.app, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style=${{ background: '#3a1515', border: '1px solid #e05c5c', borderRadius: '12px', padding: '24px', maxWidth: '360px', textAlign: 'center' }}>
          <div style=${{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
          <div style=${{ fontSize: '14px', fontWeight: 600, color: '#f0ece4', marginBottom: '8px' }}>Fehler beim Start</div>
          <div style=${{ fontSize: '11px', color: '#e05c5c', fontFamily: "'DM Mono',monospace", marginBottom: '16px' }}>${migrationError}</div>
          <button onClick=${() => window.location.reload()} style=${{ background: '#c8a96e', color: '#111', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 700 }}>
            Neu laden
          </button>
        </div>
      </div>
    `;
  }

  // Erststart: kein Profil vorhanden → Wizard
  if (!profile) {
    return html`<${ErststartAssistent} onComplete=${setProfile} />`;
  }

  // Normale App
  const activeTab = uiState.activeTab;

  function renderTab() {
    switch (activeTab) {
      case 'heute':   return html`<${HeuteTab} profile=${profile} calculated=${calculated} />`;
      case 'tracker': return html`<${TrackerTab} />`;
      case 'rezepte': return html`<${RezepteTab} />`;
      case 'woche':   return html`<${WocheTab} />`;
      case 'profil':  return html`
        <${ProfilTab}
          profile=${profile}
          calculated=${calculated}
          onProfileSave=${setProfile}
          settings=${settings}
          onSettingsUpdate=${updateSettings}
        />
      `;
      default: return html`<${HeuteTab} profile=${profile} calculated=${calculated} />`;
    }
  }

  async function handleBannerExport() {
    const blob = await exportAll();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ernaehrung-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    updateSettings({ lastBackupAt: Date.now() });
  }

  return html`
    <div style=${S.app}>
      <${UpdateBanner} registration=${swRegistration} />
      <${BackupReminderBanner} settings=${settings} onExport=${handleBannerExport} />
      <div style=${S.header}>
        <div style=${S.title}>Ernährungs-Tool</div>
        <div style=${S.sub}>Stephanie Meurer · Postmenopause & Krafttraining</div>
      </div>
      ${renderTab()}
      <${Navigation} activeTab=${activeTab} onTabChange=${tab => updateUiState({ activeTab: tab })} />
    </div>
  `;
}

// App mounten: ErrorBoundary → ToastProvider → App
createRoot(document.getElementById('root')).render(
  html`<${ErrorBoundary}><${ToastProvider}><${App} /></${ToastProvider}></${ErrorBoundary}>`
);
```

**Wichtige Änderungen gegenüber vorher:**
1. `UpdateBanner` importiert und eingebunden (vor BackupReminderBanner)
2. `registerServiceWorker` importiert + im `useEffect` aufgerufen
3. `<Navigation>` ans Ende (vor `</div>`) verschoben (war bisher zwischen Header und Content)
4. `swRegistration` State für UpdateBanner

- [ ] **Step 9.2: Commit**

```bash
git add js/app.js
git commit -m "feat: wire up service worker + UpdateBanner in app"
```

---

## Task 10: Manuelle Smoke-Test-Checkliste

**Files:**
- Create: `tests/manual-checklist-phase-2.md`

- [ ] **Step 10.1: Checkliste erstellen**

```markdown
# Manuelle Smoke-Tests Phase 2 — PWA + Bottom Navigation

**Datum:** ___________  
**Tester:** ___________  
**URL:** https://smeurer-ai.github.io/Ernaehrungs-Dashboard/ernaehrung.html

---

## T-00: Smoke — App lädt ohne Fehler

- [ ] App öffnet in Chrome auf Desktop, keine Konsolen-Fehler (F12 → Console)
- [ ] App öffnet in Chrome auf Android (oder iOS Safari), keine weißen Bildschirme
- [ ] Alle 5 Tabs der Bottom-Navigation sichtbar: Heute, Tracker, Rezepte, Woche, Profil
- [ ] Navigation am **unteren** Bildschirmrand (nicht mehr oben)
- [ ] Aktiver Tab (Heute) hat goldene Akzentlinie + goldene Schrift

---

## T-01: Bottom-Navigation — Tab-Wechsel

- [ ] Klick auf "Tracker" → Tracker-Tab öffnet sich
- [ ] Klick auf "Rezepte" → Rezepte-Tab öffnet sich
- [ ] Klick auf "Woche" → Woche-Tab öffnet sich
- [ ] Klick auf "Profil" → Profil-Tab öffnet sich
- [ ] Klick auf "Heute" → zurück zum Heute-Tab
- [ ] Aktive Tab-Kennzeichnung folgt dem Klick korrekt

---

## T-02: Inhalt nicht verdeckt durch Bottom-Nav

- [ ] Heute-Tab: Unterste Karte (Abendessen) vollständig sichtbar, nicht von Nav verdeckt
- [ ] Profil-Tab: Speichern-Button erreichbar, nicht von Nav verdeckt
- [ ] Scroll-Position endet oberhalb der Bottom-Nav

---

## T-03: PWA — Service Worker registriert

- [ ] Chrome DevTools → Application → Service Workers: Status "activated and running" für `service-worker.js`
- [ ] Chrome DevTools → Application → Cache Storage: `ernaehrung-static-1.1.0` und `ernaehrung-cdn-1.1.0` vorhanden
- [ ] Gecachte Dateien vorhanden (mindestens ernaehrung.html, js/app.js, js/lib.js)

---

## T-04: PWA — App als installierbar erkannt

- [ ] Chrome Desktop: Installations-Icon in der Adressleiste sichtbar (⊕ oder ähnlich)
- [ ] Chrome Android: "Zum Startbildschirm hinzufügen" erscheint im Browser-Menü
- [ ] Manifest valide: DevTools → Application → Manifest → Keine Fehler

---

## T-05: PWA — Installation + Standalone-Modus

- [ ] App installieren (via Browser-Prompt oder Menü "Zum Startbildschirm")
- [ ] App vom Homescreen/App-Icon öffnen
- [ ] App läuft im Standalone-Modus (kein Browser-Chrome sichtbar)
- [ ] App-Icon entspricht dem generierten Icon (dunkel mit goldenem E)
- [ ] Vollbild-Ansicht (kein URL-Bar)

---

## T-06: Offline-Modus

- [ ] App im Browser öffnen (einmal, damit SW cached)
- [ ] Chrome DevTools → Network → "Offline" aktivieren
- [ ] Seite neu laden → App öffnet sich **ohne Netzwerk**
- [ ] Heute-Tab funktioniert (Plan sichtbar)
- [ ] Chrome DevTools → Network → "Offline" deaktivieren

---

## T-07: UpdateBanner-Flow (Simulation)

- [ ] Chrome DevTools → Application → Service Workers → "Update on reload" aktivieren
- [ ] Seite neu laden
- [ ] In DevTools: neuer SW erscheint als "waiting to activate"
- [ ] UpdateBanner im App-UI sichtbar: "🔄 App-Update verfügbar"
- [ ] Klick auf "Jetzt laden" → App lädt neu → Banner weg → neuer SW aktiv
- [ ] Klick auf "Später" → Banner verschwindet, SW bleibt wartend

---

## T-08: iOS-Safari (falls verfügbar)

- [ ] App lädt ohne Fehler
- [ ] Bottom-Navigation sichtbar + funktionsfähig
- [ ] Kein Inhalt unter der iPhone-Home-Indicator-Leiste verdeckt (safe-area-inset)
- [ ] "Zum Home-Bildschirm" → App öffnet sich in Vollbild

---

## T-09: Regressions-Check Phase 1

- [ ] Erststart-Wizard erscheint bei leerem Profil (nach Clear Storage)
- [ ] Profil-Editor speichert Änderungen (Gewicht, BMR-Berechnung korrekt)
- [ ] Export funktioniert (JSON-Download)
- [ ] Import funktioniert (JSON laden, Profil wiederhergestellt)
- [ ] Heute-Tab zeigt Mahlzeitenplan passend zum Tagestyp
```

- [ ] **Step 10.2: Commit**

```bash
git add tests/manual-checklist-phase-2.md
git commit -m "docs: add Phase 2 manual smoke test checklist"
```

---

## Task 11: Finaler Commit + Push

- [ ] **Step 11.1: Status prüfen**

```bash
git status
git log --oneline -8
```

Erwartet: Working tree clean. Die letzten Commits zeigen alle Phase-2-Schritte.

- [ ] **Step 11.2: Versions-Konsistenz prüfen**

`service-worker.js` (Zeile 5) und `js/version.js` (Zeile 1) müssen beide `1.1.0` enthalten:

```bash
grep "APP_VERSION\|1.1.0" service-worker.js js/version.js
```

Erwartet: beide Dateien zeigen `1.1.0`.

- [ ] **Step 11.3: Pushen**

```bash
git push
```

---

## Spec-Coverage-Check

| Feature (Spec §2) | Task | Status |
|---|---|---|
| #16 PWA-Installation (Manifest + SW + Install) | Task 3 + 4 + 8 | ✅ |
| #17 Bottom-Navigation | Task 7 | ✅ |
| #18 Offline-Modus | Task 4 (SW Cache) + T-06 | ✅ |
| #19 Update-Benachrichtigung | Task 5 + 6 + 9 | ✅ |
| #20 App-Icon | Task 2 | ✅ |

**Bewusst nicht in Phase 2:**
- `installPrompt.js` (Custom Install-Button): Browser-nativer Prompt ist ausreichend für Phase 2. Custom UI kommt optional in Phase 3.
- Vitest-Unit-Tests für `calc/`: Bleibt TS-01-Schuld, wird vor Phase 3 angegangen.

---

*Plan erstellt: 2026-06-01 · Ziel-Branch: master · Nächste Phase: Phase 3 (Tracker + Barcode + Custom Foods)*
