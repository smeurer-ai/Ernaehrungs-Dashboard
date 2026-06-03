# Design-Spec: CDN-Vendoring & CSP-Härtung

**Datum:** 2026-06-03  
**Status:** Zur Umsetzung freigegeben  
**Scope:** Lokalisierung aller externen JavaScript-Abhängigkeiten, vollständige CSP-Härtung

---

## Ziel

Alle JavaScript-Abhängigkeiten werden aus dem Internet (CDN) in das Projektverzeichnis geholt und dort dauerhaft gespeichert. Nach Abschluss darf die App keinerlei externen JavaScript-Code mehr laden. Die Content Security Policy (CSP) wird entsprechend verschärft.

Zusätzlich werden Architektur-Leitlinien für zukünftige Backend-Anbindung (Supabase) festgelegt, damit keine privaten API-Keys versehentlich im Frontend landen.

---

## Betroffene Abhängigkeiten

| Bibliothek | Aktuelle CDN-URL | Lokaler Zielpfad |
|---|---|---|
| React 18.2.0 + ReactDOM | `https://esm.sh/react@18.2.0` + `/react-dom@18.2.0/client` | `assets/vendor/react.js` |
| htm 3.1.1 | `https://esm.sh/htm@3.1.1` | `assets/vendor/htm.js` |
| idb 8 | `https://cdn.jsdelivr.net/npm/idb@8/+esm` | `assets/vendor/idb.js` |

React und ReactDOM werden **gemeinsam** in eine Datei gebündelt, weil sie intern dieselbe React-Instanz teilen müssen.

---

## Neue Dateien

### `scripts/vendor.js`

Node.js-Skript, das esbuild (bereits in `node_modules` via Vitest) nutzt:

- Fügt temporären Einstiegspunkt für React + ReactDOM zusammen
- Bündelt alle drei Bibliotheken als eigenständige ESM-Module
- Schreibt Ausgabe nach `assets/vendor/`
- Wird **nicht** automatisch ausgeführt — nur manuell bei Versions-Updates

### `assets/vendor/react.js` (~150 KB)

Self-contained ESM-Bundle. Exportiert:
- `default` → React-Objekt (für `import React from ...`)
- `createRoot` → benannter Export aus ReactDOM/client

### `assets/vendor/htm.js` (~3 KB)

Self-contained ESM-Bundle. Exportiert `default` → htm-Funktion.

### `assets/vendor/idb.js` (~15 KB)

Self-contained ESM-Bundle. Exportiert `openDB` als benannten Export.

Alle drei Dateien werden in Git committed, damit die App ohne weitere Schritte direkt nach einem `git clone` funktioniert.

---

## Geänderte Dateien

### `package.json`

Neue `devDependencies`:
- `react@18.2.0`
- `react-dom@18.2.0`
- `htm@3.1.1`
- `idb@8`

Neues Script:
```json
"vendor": "node scripts/vendor.js"
```

### `js/lib.js`

CDN-URLs werden durch lokale Pfade ersetzt:

```js
// Vorher:
import React from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { openDB as _openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

// Nachher:
import React, { createRoot } from '../assets/vendor/react.js';
import htm from '../assets/vendor/htm.js';
import { openDB as _openDB } from '../assets/vendor/idb.js';
```

### `ernaehrung.html` — CSP

Nach dem Vendoring wird die CSP auf `script-src 'self'` verschärft. Keine CDN-Domains mehr erlaubt.

`connect-src` wird auf Zukunft vorbereitet: aktuell `'self'`, später ergänzt um die konkrete Supabase-Projekt-URL (`https://<projekt-id>.supabase.co`) und die WebSocket-URL (`wss://<projekt-id>.supabase.co`) für Realtime. Diese URLs werden erst eingetragen, wenn das Supabase-Projekt tatsächlich angelegt ist — nicht vorher.

**Ziel-CSP nach Vendoring:**
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
font-src 'self';
img-src 'self' data: blob:;
connect-src 'self';
manifest-src 'self';
worker-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none'
```

### `service-worker.js`

- `CDN_ASSETS`-Array und der zugehörige `CACHE_CDN`-Cache entfallen vollständig
- Die drei Vendor-Dateien kommen in `LOCAL_ASSETS` (werden wie alle anderen lokalen Assets gecacht)
- Version auf `1.2.5` erhöht → zwingt alle bestehenden Clients beim nächsten App-Start zum Cache-Update

### `js/version.js`

`APP_VERSION` → `'1.2.5'`

---

## Sicherheits-Leitlinien für Supabase (zukünftig)

Diese Leitlinien gelten, sobald Supabase eingebunden wird. Sie sind **kein Teil dieses Implementierungsschritts**, werden aber hier dokumentiert damit sie nicht vergessen werden.

**Was ins Frontend darf:**
- Der öffentliche `anon`-Key von Supabase (er ist für den Browser bestimmt, Row Level Security schützt die Daten)
- Die Projekt-URL

**Was nie ins Frontend darf:**
- `service_role`-Key (Superuser, umgeht RLS)
- Datenbank-Passwörter
- Admin-API-Keys jeder Art

**Rezept- und Lebensmittel-Import:**
Der Import von Rezept- oder Lebensmitteldaten für den eigenen Account läuft über ein **getrenntes lokales Script** (z.B. `scripts/import-foods.js`), das direkt mit der Datenbank oder der Supabase Admin API kommuniziert. Dieses Script wird lokal ausgeführt, nie im Browser. Es darf den `service_role`-Key aus einer `.env`-Datei lesen — die `.env`-Datei ist in `.gitignore` und wird nie committed.

---

## Tests

### Bestehender Security-Test erweitern

`tests/unit/security/htmlSecurity.test.js` bekommt zwei neue Prüfungen:
1. `esm.sh` kommt in keiner Datei mehr vor (weder HTML noch JS)
2. `cdn.jsdelivr.net` kommt in keiner Datei mehr vor

### Manueller Smoke-Test

Nach der Implementierung: App im Browser öffnen, DevTools → Network-Tab öffnen, prüfen dass keine Requests an `esm.sh` oder `jsdelivr.net` gehen.

---

## Was dieses Design nicht tut

- Kein Einfrieren der App-Funktionalität
- Kein Einbringen eines Bündelungs-Schritts zur Laufzeit
- Kein Ändern der App-Logik, der Tabs, Berechnungen oder des Designs
- Kein Anlegen eines Supabase-Projekts (folgt später)
