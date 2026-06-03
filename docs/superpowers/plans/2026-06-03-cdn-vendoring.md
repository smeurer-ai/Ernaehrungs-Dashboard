# CDN-Vendoring & CSP-Härtung – Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle vier CDN-Bibliotheken (React, ReactDOM, htm, idb) lokal bündeln und die CSP auf `script-src 'self'` verschärfen, sodass die App keinerlei externen JavaScript-Code mehr lädt.

**Architecture:** `esbuild` bündelt React+ReactDOM gemeinsam sowie htm und idb separat in self-contained ESM-Dateien unter `assets/vendor/`. `js/lib.js` tauscht CDN-URLs gegen lokale Pfade aus. Der Service Worker verliert CACHE_CDN, CDN_ASSETS und den CDN-Fetch-Branch vollständig. Vendor-Dateien werden committed.

**Tech Stack:** Node.js, esbuild (explizite devDependency), Vitest, native ES Modules

---

## Dateiübersicht

| Aktion | Pfad | Zweck |
|---|---|---|
| Create | `scripts/vendor.js` | Einmaliges Build-Skript |
| Create | `assets/vendor/react.js` | React 18.2.0 + ReactDOM/client, kombiniert |
| Create | `assets/vendor/htm.js` | htm 3.1.1 |
| Create | `assets/vendor/idb.js` | idb 8 |
| Modify | `package.json` | devDependencies + vendor-Script |
| Modify | `tests/unit/security/htmlSecurity.test.js` | CSP-Test anpassen + CDN-Blocklist-Tests |
| Modify | `js/lib.js:12-15` | CDN-URLs → lokale Pfade |
| Modify | `service-worker.js` | CDN entfernen, Vendor precachen, v1.2.5 |
| Modify | `js/version.js:1` | APP_VERSION → `'1.2.5'` |
| Modify | `ernaehrung.html:10` | CSP: `script-src 'self'`, `connect-src 'self'` |

---

## Task 1: Abhängigkeiten installieren

**Files:**
- Modify: `package.json`

- [ ] **Schritt 1.1: Pakete installieren**

```bash
npm install --save-dev react@18.2.0 react-dom@18.2.0 htm@3.1.1 idb@8 esbuild
```

Erwartete Ausgabe: `added N packages` ohne Fehler.

- [ ] **Schritt 1.2: vendor-Script in package.json eintragen**

`package.json` → `scripts`-Block, `"vendor"`-Eintrag ergänzen:

```json
{
  "name": "ernaehrungs-dashboard",
  "version": "1.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "vendor": "node scripts/vendor.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "esbuild": "...",
    "htm": "3.1.1",
    "idb": "8.x",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "vitest": "^1.6.0"
  }
}
```

Die genauen esbuild/idb/vitest-Patch-Versionen ergänzt npm automatisch.

- [ ] **Schritt 1.3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: react, react-dom, htm, idb, esbuild als devDependencies"
```

---

## Task 2: Security-Tests anpassen (TDD – zuerst rot)

**Files:**
- Modify: `tests/unit/security/htmlSecurity.test.js`

Der bestehende Test an Zeile 22 erwartet noch CDN-URLs in der CSP (`toContain("script-src 'self' https://esm.sh https://cdn.jsdelivr.net")`). Dieser Test wird umgekehrt (CDN darf dort nicht mehr vorkommen) und um Datei-Scan-Tests ergänzt.

- [ ] **Schritt 2.1: Testdatei komplett ersetzen**

`tests/unit/security/htmlSecurity.test.js` mit folgendem Inhalt überschreiben:

```js
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const html = readFileSync('ernaehrung.html', 'utf8');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../');

describe('HTML security headers', () => {
  it('loads fonts from local assets instead of Google Fonts', () => {
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
    expect(html).toContain('href="./assets/fonts/fonts.css"');
  });

  it('defines a strict CSP without any CDN origins', () => {
    const match = html.match(
      /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/
    );
    expect(match?.[1]).toBeTruthy();
    expect(match[1]).toContain("default-src 'self'");
    expect(match[1]).toContain("script-src 'self'");
    expect(match[1]).toContain("font-src 'self'");
    expect(match[1]).not.toContain('fonts.googleapis.com');
    expect(match[1]).not.toContain('fonts.gstatic.com');
    expect(match[1]).not.toContain('https://esm.sh');
    expect(match[1]).not.toContain('https://cdn.jsdelivr.net');
  });
});

// ── CDN-Blocklist ─────────────────────────────────────────────────────────────

const CDN_BLOCKLIST = ['esm.sh', 'cdn.jsdelivr.net'];

const PRODUCTION_TARGETS = [
  'ernaehrung.html',
  'service-worker.js',
  'manifest.json',
  'js',
  'assets',
];

function collectProductionFiles(root, targets) {
  const result = [];
  function walk(p) {
    const stat = statSync(p);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(p)) walk(join(p, entry));
    } else {
      result.push(p);
    }
  }
  for (const target of targets) {
    const full = join(root, target);
    try { walk(full); } catch { /* existiert noch nicht */ }
  }
  return result;
}

const productionFiles = collectProductionFiles(ROOT, PRODUCTION_TARGETS)
  .filter(f => /\.(html|js|json|css)$/.test(f));

describe('CDN-Blocklist', () => {
  for (const cdn of CDN_BLOCKLIST) {
    it(`enthält kein '${cdn}' in Produktionsdateien`, () => {
      const violations = productionFiles.filter(f =>
        readFileSync(f, 'utf-8').includes(cdn)
      );
      expect(violations, `CDN-Fundstellen:\n${violations.join('\n')}`).toEqual([]);
    });
  }
});
```

- [ ] **Schritt 2.2: Tests ausführen – müssen FEHLSCHLAGEN**

```bash
npm test
```

Erwartete Ausgabe: Die zwei CDN-Blocklist-Tests und der CSP-Test schlagen fehl, weil `js/lib.js` und `ernaehrung.html` noch CDN-URLs enthalten. Alle anderen Tests bestehen weiter.

- [ ] **Schritt 2.3: Commit**

```bash
git add tests/unit/security/htmlSecurity.test.js
git commit -m "test: CDN-Blocklist-Tests (rot – CDN-URLs noch vorhanden)"
```

---

## Task 3: Vendor-Script erstellen und ausführen

**Files:**
- Create: `scripts/vendor.js`
- Create: `assets/vendor/react.js` (generiert)
- Create: `assets/vendor/htm.js` (generiert)
- Create: `assets/vendor/idb.js` (generiert)

- [ ] **Schritt 3.1: `scripts/vendor.js` erstellen**

```js
// scripts/vendor.js
// Ausführen mit: npm run vendor
// Nur bei Versions-Updates der Bibliotheken erneut ausführen.

import * as esbuild from 'esbuild';
import { mkdirSync } from 'fs';

const outDir = 'assets/vendor';
mkdirSync(outDir, { recursive: true });

const base = {
  bundle: true,
  format: 'esm',
  platform: 'browser',
  minify: false,
};

// React + ReactDOM gemeinsam – beide teilen intern dieselbe React-Instanz.
await esbuild.build({
  ...base,
  stdin: {
    contents: `
export { default } from 'react';
export { createRoot } from 'react-dom/client';
`,
    resolveDir: '.',
  },
  outfile: `${outDir}/react.js`,
});
console.log('✓ assets/vendor/react.js');

// htm – Template-Tag-Bibliothek für JSX-ähnliche Syntax.
await esbuild.build({
  ...base,
  stdin: {
    contents: `export { default } from 'htm';`,
    resolveDir: '.',
  },
  outfile: `${outDir}/htm.js`,
});
console.log('✓ assets/vendor/htm.js');

// idb – IndexedDB-Wrapper.
await esbuild.build({
  ...base,
  stdin: {
    contents: `export { openDB } from 'idb';`,
    resolveDir: '.',
  },
  outfile: `${outDir}/idb.js`,
});
console.log('✓ assets/vendor/idb.js');

console.log('\nAlle Vendor-Dateien in assets/vendor/ erstellt.');
```

- [ ] **Schritt 3.2: Vendor-Script ausführen**

```bash
npm run vendor
```

Erwartete Ausgabe:
```
✓ assets/vendor/react.js
✓ assets/vendor/htm.js
✓ assets/vendor/idb.js

Alle Vendor-Dateien in assets/vendor/ erstellt.
```

- [ ] **Schritt 3.3: Dateien prüfen**

```bash
npm run vendor  # idempotent – zweites Ausführen darf nicht crashen
```

`assets/vendor/` muss drei Dateien enthalten: `react.js`, `htm.js`, `idb.js`.

- [ ] **Schritt 3.4: Commit**

```bash
git add scripts/vendor.js assets/vendor/
git commit -m "feat: Vendor-Script und lokale ESM-Bundles für React, htm, idb"
```

---

## Task 4: lib.js auf lokale Imports umstellen

**Files:**
- Modify: `js/lib.js:12-15`

- [ ] **Schritt 4.1: CDN-Imports durch lokale Pfade ersetzen**

In `js/lib.js` die Zeilen 12–15 ersetzen:

```js
// Vorher (Zeilen 12–15):
import React from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { openDB as _openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

// Nachher (Zeilen 12–14, eine Zeile weniger):
import React, { createRoot } from '../assets/vendor/react.js';
import htm from '../assets/vendor/htm.js';
import { openDB as _openDB } from '../assets/vendor/idb.js';
```

Der Rest von `js/lib.js` bleibt vollständig unverändert.

- [ ] **Schritt 4.2: Commit**

```bash
git add js/lib.js
git commit -m "feat: lib.js importiert React/htm/idb aus lokalen Vendor-Dateien"
```

---

## Task 5: service-worker.js bereinigen

**Files:**
- Modify: `service-worker.js`

Vier Änderungen auf einmal: Version hochsetzen, `CACHE_CDN` und `CDN_ASSETS` entfernen, Vendor-Dateien in `LOCAL_ASSETS` aufnehmen, CDN-Fetch-Branch entfernen.

- [ ] **Schritt 5.1: service-worker.js komplett ersetzen**

```js
// service-worker.js
// Version muss mit js/version.js synchron gehalten werden.
const APP_VERSION = '1.2.5';
const CACHE_STATIC = `ernaehrung-static-${APP_VERSION}`;

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

// ── Fetch: Cache-First für alle lokalen Assets ────────────────────────────────
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
```

Hinweis: Falls seit dem letzten bekannten Stand neue JS-Dateien in `js/` hinzugekommen sind, diese vor dem Commit in `LOCAL_ASSETS` ergänzen.

- [ ] **Schritt 5.2: Commit**

```bash
git add service-worker.js
git commit -m "feat: service-worker CDN-Cache entfernt, Vendor-Dateien precachen, v1.2.5"
```

---

## Task 6: js/version.js auf 1.2.5 erhöhen

**Files:**
- Modify: `js/version.js:1`

- [ ] **Schritt 6.1: APP_VERSION hochsetzen**

In `js/version.js` Zeile 1 ändern:

```js
// Vorher:
export const APP_VERSION = '1.2.4';

// Nachher:
export const APP_VERSION = '1.2.5';
```

`SCHEMA_VERSION` bleibt unverändert.

- [ ] **Schritt 6.2: Commit**

```bash
git add js/version.js
git commit -m "chore: version 1.2.5 – CDN-Vendor-Release"
```

---

## Task 7: CSP in ernaehrung.html verschärfen

**Files:**
- Modify: `ernaehrung.html:10`

- [ ] **Schritt 7.1: CSP-Meta-Tag ersetzen**

In `ernaehrung.html` Zeile 10 den bestehenden `<meta http-equiv="Content-Security-Policy" ...>` ersetzen durch:

```html
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"/>
```

Wenn später Supabase eingebunden wird, wird `connect-src 'self'` zu `connect-src 'self' https://<projekt-id>.supabase.co wss://<projekt-id>.supabase.co` ergänzt — erst dann, wenn die konkrete Supabase-Projekt-URL bekannt ist.

- [ ] **Schritt 7.2: Commit**

```bash
git add ernaehrung.html
git commit -m "security: CSP auf script-src 'self' verschärft – keine CDN-Quellen mehr"
```

---

## Task 8: Tests grün und Abschluss

**Files:**
- Test: `tests/unit/security/htmlSecurity.test.js`

- [ ] **Schritt 8.1: Alle Tests ausführen**

```bash
npm test
```

Erwartete Ausgabe: Alle Tests bestehen — inklusive der CDN-Blocklist-Tests und des aktualisierten CSP-Tests.

Falls ein Test fehlschlägt: Die in der Fehlermeldung genannte Datei öffnen, die CDN-URL suchen, durch den lokalen Pfad ersetzen, dann nochmal `npm test`.

- [ ] **Schritt 8.2: Manueller Smoke-Test**

App in einem Browser öffnen (Datei `ernaehrung.html` direkt oder über einen lokalen Dev-Server). DevTools öffnen → Tab „Netzwerk" → Filter auf „JS" setzen → Seite neu laden.

Prüfen: Keine Requests an `esm.sh` oder `cdn.jsdelivr.net` erscheinen. Die App muss vollständig laden und alle Tabs müssen funktionieren.

- [ ] **Schritt 8.3: Abschluss-Commit falls noch Dateien offen sind**

```bash
git status
git add -A
git commit -m "feat: CDN-Vendoring abgeschlossen – App läuft vollständig offline"
```

---

## Hinweis für spätere Supabase-Einbindung

Diese Punkte sind kein Teil dieses Plans:

- `connect-src 'self'` in der CSP wird um die konkrete Supabase-Projekt-URL (`https://<id>.supabase.co`) und WebSocket-URL (`wss://<id>.supabase.co`) ergänzt, wenn das Supabase-Projekt angelegt ist.
- Nur der öffentliche `anon`-Key darf ins Frontend. `service_role`-Key, DB-Passwörter und Admin-Keys bleiben in einer `.env`-Datei und werden nie committed.
- Rezept-/Lebensmittel-Import läuft über `scripts/import-foods.js` (lokal/serverseitig, nie im Browser).
