# Implementierungsplan — Phase 1: Fundament

**App**: Ernährungs-Dashboard PWA
**Spec-Version**: 1.2.2
**Phase**: 1 von 6
**Datum**: 2026-05-30
**Status**: Bereit zur Implementierung

> **Goldene Regel Phase 1**: Kein Cloud-Code. Kein Supabase. Kein Login. Kein Sync.
> Einzige Netzwerk-Verbindung erlaubt: Google Fonts (CSS-Import).

---

## Inhaltsverzeichnis

1. [Ziel von Phase 1](#1-ziel-von-phase-1)
2. [Datei-Übersicht](#2-datei-übersicht)
3. [Implementierungsreihenfolge](#3-implementierungsreihenfolge)
4. [Aufgaben je Datei](#4-aufgaben-je-datei)
5. [Testplan](#5-testplan)
6. [Manuelle Tests (Smoke-Test-Checkliste)](#6-manuelle-tests-smoke-test-checkliste)
7. [Risiken und Mitigationen](#7-risiken-und-mitigationen)
8. [Definition of Done — Phase 1](#8-definition-of-done--phase-1)

---

## 1. Ziel von Phase 1

**Was am Ende von Phase 1 existiert:**
- Eine funktionierende Web-App unter `ernaehrung.html` mit Multi-File-Architektur
- Profil editierbar in der App (alle Körperwerte, Ziele, neue Felder aus v1.2)
- Daten überleben Browser-Neustart (localStorage + IndexedDB-Skelett)
- Export als JSON-Datei, Import von JSON-Datei
- Backup-Erinnerung nach 7+ Tagen
- Defizit-Warnung wenn Kaloriendefizit zu aggressiv
- Heute-Tab mit Mahlzeitenplan basierend auf Live-Profildaten
- Alle Sync-Felder (`Syncable`) im Datenmodell vorhanden — aber kein Sync

**Was Phase 1 ausdrücklich NICHT enthält:**
- Tracker (Lebensmittel eintragen) → Phase 3
- Barcode-Scan → Phase 3
- Rezepte mit Schritten → Phase 4
- Kühlschrank-Matching / Vorschläge → Phase 5
- Claude Vision / AI → Phase 6
- PWA-Installation / Service Worker → Phase 2
- Supabase / Cloud-Sync → nach Phase 6

---

## 2. Datei-Übersicht

### Neue Dateien (werden in Phase 1 erstellt)

```
poc/                                     ← Proof of Concept (R-01 testen, Schritt 0)
  index.html                             ← minimale Shell mit CDN + Babel
  js/
    app.js                               ← importiert aus test.js, rendert React
    test.js                              ← exportiert greet(name)
ernaehrung.html                          ← wird stark vereinfacht (Shell)
js/
  app.js                                 ← Einstiegspunkt
  version.js                             ← APP_VERSION Konstante
  storage/
    localStorage.js                      ← Profil / Settings / UiState
    indexeddb.js                         ← DB öffnen, Phase-1-Stores anlegen (log, week)
    migrations.js                        ← Schema-Versioning, runMigrations()
    exportImport.js                      ← exportAll() / importAll()
  sync/
    deviceId.js                          ← lokale Geräte-ID (kein Sync)
  calc/
    bmr.js                               ← calcBMR, calcLeanMass
    macros.js                            ← calcTDEE, calcMacros, calcProteinTarget, calcGap
    nutritionLogic.js                    ← assessDeficit (aktiv), Rest: Stubs
  data/
    mealTemplates.js                     ← MEAL_TEMPLATES (aus alt extrahiert)
    tips.js                              ← POSTMENOPAUSAL_TIPS (aus alt extrahiert)
  hooks/
    useProfile.js                        ← Profil laden/speichern + berechnete Werte
    useSettings.js                       ← Settings laden/speichern
    useUiState.js                        ← UI-State laden/speichern
  ui/
    theme.js                             ← Style-Konstanten (aus alt extrahiert)
    Navigation.js                        ← TopTabs (Phase 1, BottomNav kommt in Phase 2)
    Modal.js                             ← Wiederverwendbares Modal
    KcalRing.js                          ← SVG-Kalorienring (aus alt extrahiert)
    MacroBar.js                          ← Makro-Fortschrittsbalken (aus alt extrahiert)
    Toast.js                             ← Kurze Statusmeldungen
    BackupReminderBanner.js              ← Banner wenn 7+ Tage kein Export
  tabs/
    heute/
      HeuteTab.js                        ← Wrapper
      DayTypeSwitch.js                   ← Trainingstag / Ruhetag Toggle
      DaySummary.js                      ← Kcal-Ring + Makro-Balken (Plan-Werte)
      MealPlanList.js                    ← Liste der Soll-Mahlzeiten
      MealPlanEntry.js                   ← Eine Mahlzeit-Zeile
    tracker/
      TrackerTab.js                      ← Platzhalter "kommt in Phase 3"
    rezepte/
      RezepteTab.js                      ← Platzhalter "kommt in Phase 4"
    woche/
      WocheTab.js                        ← Grundgerüst (nur Ansicht, keine Einträge)
      WeekGrid.js                        ← 7-Tage-Raster (leer, aber strukturiert)
    profil/
      ProfilTab.js                       ← Wrapper
      ProfileEditor.js                   ← Alle Felder editierbar + Defizit-Warnung
      ErststartAssistent.js              ← Erststart-Wizard (läuft statt ProfilTab wenn kein Profil)
      DataManagement.js                  ← Export / Import / Backup-Reminder
      SettingsPanel.js                   ← Settings-Felder
      PostmenopausalInfo.js              ← 5 Hinweise (aus alt extrahiert)
docs/
  implementierungsplan-phase-1.md       ← DIESES DOKUMENT
tests/
  manual-checklist-phase-1.md           ← Smoke-Test-Checkliste (wird nach Implementierung befüllt)
```

### Bestehende Datei (wird stark verändert)

| Datei | Alt | Phase 1 neu |
|---|---|---|
| `ernaehrung.html` | 641 Zeilen, alles inline | ~30 Zeilen Shell, lädt nur CDN + `js/app.js` |

---

## 3. Implementierungsreihenfolge

Die Reihenfolge folgt dem Dependency-Graphen: jede Schicht baut auf der darunterliegenden auf. Keine Datei wird geöffnet bevor ihre Abhängigkeiten existieren.

### Schritt 0 — Proof of Concept: Babel + ES Modules (R-01)

> **Erst dieser Schritt. Wenn er scheitert, wird der Rest der Architektur angepasst — bevor eine einzige echte Datei gebaut wird.**

R-01 aus dem Risiko-Register lautet: `data-type="module"` mit Babel-Standalone könnte relative Imports nicht auflösen. Das prüfen wir jetzt mit drei Dateien:

```
poc/
  index.html   ← minimale Shell mit CDN + Babel, lädt js/app.js
  js/app.js    ← importiert aus ./test.js, rendert React-Komponente
  js/test.js   ← exportiert eine Funktion (z.B. greet(name))
```

**`poc/index.html`** (minimal):
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="env,react" src="./js/app.js"></script>
</body>
</html>
```

**`poc/js/test.js`**:
```javascript
export function greet(name) {
  return `Hallo ${name}`;
}
```

**`poc/js/app.js`**:
```javascript
import { greet } from './test.js';
const msg = greet('Stephanie');
ReactDOM.render(
  React.createElement('h1', null, msg),
  document.getElementById('root')
);
```

**Kriterien für Erfolg**:
- `index.html` zeigt im Browser "Hallo Stephanie"
- Keine Konsolen-Fehler
- Kein CORS-Fehler (→ muss über lokalen Webserver laufen, z.B. `python -m http.server 8080` im `poc/`-Ordner)

**Bei Misserfolg (Fallback)**:
Babel-Standalone unterstützt `data-type="module"` nicht vollständig → Lösung: alle JS-Dateien werden per `<script type="text/babel">` in `ernaehrung.html` inline geladen, logisch aber in separate `<script>`-Blöcke aufgeteilt. React-Globals (`window.React`, `window.ReactDOM`) werden weiterhin genutzt, nur keine `import`/`export`-Syntax. In diesem Fall wird der Plan vor Schritt 1 angepasst.

**Checkpoint 0**: PoC funktioniert → weiter mit Schritt 1. PoC scheitert → Fallback-Ansatz dokumentieren und Plan aktualisieren.

---

### Schritt 1 — Vorbereitung und Fundament (kein React)

```
1.1  version.js            — APP_VERSION, SCHEMA_VERSION Konstanten
1.2  sync/deviceId.js      — generateDeviceId(), getDeviceId()
1.3  storage/migrations.js — CURRENT_SCHEMA_VERSION, Migrations-Registry (nur Version 1)
1.4  storage/indexeddb.js  — openDb(), Phase-1-Stores anlegen (log, week)
1.5  storage/localStorage.js — loadProfile(), saveProfile(), loadSettings() usw.
1.6  storage/exportImport.js — exportAll(), importAll()
```

**Checkpoint 1**: In der Browser-Konsole manuell prüfen: `openDb()` läuft durch, Stores `log` und `week` existieren (F12 → Application → IndexedDB), `loadProfile()` gibt Default-Profil zurück.

### Schritt 2 — Berechnungsschicht (pure Funktionen, kein React)

```
2.1  calc/bmr.js            — calcBMR(), calcLeanMass()
2.2  calc/macros.js         — calcTDEE(), calcMacros(), calcProteinTarget(), calcGap()
2.3  calc/nutritionLogic.js — assessDeficit() [aktiv], rateMealProtein() + assessDayStructure() [Stubs]
```

**Checkpoint 2**: Funktionen in Browser-Konsole aufrufen, Werte gegen bekannte Referenzwerte (Stephanie: LBM 54,92 → BMR ~1556 kcal) prüfen.

### Schritt 3 — Statische Daten extrahieren

```
3.1  data/mealTemplates.js  — MEAL_TEMPLATES aus alter ernaehrung.html extrahieren
3.2  data/tips.js           — POSTMENOPAUSAL_TIPS aus alter ernaehrung.html extrahieren
```

### Schritt 4 — React-Hooks (Adapter zwischen Storage und UI)

```
4.1  hooks/useProfile.js    — Profil laden, speichern, calculated-Werte
4.2  hooks/useSettings.js   — Settings laden, speichern
4.3  hooks/useUiState.js    — UI-State laden, speichern
```

**Checkpoint 3**: Hooks in einer Minimal-React-Seite einbinden, Profil ändern, nach Reload prüfen ob Wert erhalten blieb.

### Schritt 5 — Gemeinsame UI-Komponenten

```
5.1  ui/theme.js             — Style-Konstanten aus alter HTML extrahieren
5.2  ui/KcalRing.js          — SVG-Ring aus alt extrahieren + auf neue Props anpassen
5.3  ui/MacroBar.js          — Balkenelement aus alt extrahieren
5.4  ui/Modal.js             — Neu: generisches Modal (Overlay + Content + Schließen)
5.5  ui/Toast.js             — Neu: kurze Statusmeldungen (3 Sek. sichtbar)
5.6  ui/Navigation.js        — TopTabs (5 Tabs, aktiver Tab per activeTab-State)
5.7  ui/BackupReminderBanner.js — Banner wenn Settings.lastBackupAt > 7 Tage zurück
```

### Schritt 6 — Tab-Komponenten

```
6.1  tabs/heute/MealPlanEntry.js    — einzelne Mahlzeit-Zeile (Zeit, Makros, Hinweis)
6.2  tabs/heute/MealPlanList.js     — Liste aller Mahlzeiten + Tagestyp-Logik
6.3  tabs/heute/DayTypeSwitch.js    — Trainingstag / Ruhetag / Trainingszeit-Toggle
6.4  tabs/heute/DaySummary.js       — Kcal-Ring + Makro-Balken (Plan-Werte, kein Tracking)
6.5  tabs/heute/HeuteTab.js         — Zusammensetzen aus 6.1–6.4
6.6  tabs/tracker/TrackerTab.js     — Platzhalter-Komponente mit Hinweis "Phase 3"
6.7  tabs/rezepte/RezepteTab.js     — Platzhalter "Phase 4" (bestehende 8 Rezepte als Liste)
6.8  tabs/woche/WeekGrid.js         — 7-Tage-Raster (strukturiert, leer)
6.9  tabs/woche/WocheTab.js         — Wrapper
6.10 tabs/profil/PostmenopausalInfo.js   — 5 Hinweise aus alt extrahieren
6.11 tabs/profil/SettingsPanel.js        — Settings-Felder + operatingMode (fixiert auf 'local')
6.12 tabs/profil/DataManagement.js       — Export / Import / Backup-Reminder
6.13 tabs/profil/ProfileEditor.js        — Alle Felder + Defizit-Warnung-Anzeige
6.14 tabs/profil/ErststartAssistent.js   — Erststart-Wizard (Gewicht, Größe, Alter, Körperfett optional)
6.15 tabs/profil/ProfilTab.js            — Wrapper, entscheidet ob ErststartAssistent oder normale Ansicht
```

### Schritt 7 — App-Einstiegspunkt und HTML-Shell

```
7.1  js/app.js              — App-Komponente, Tab-Routing, React.render()
7.2  ernaehrung.html        — auf Shell reduzieren, lädt js/app.js via Babel-Modul-Tag
```

**Checkpoint 4**: App im Browser öffnen, alle 5 Tabs navigierbar, Heute-Tab zeigt Mahlzeitenplan.

### Schritt 8 — Feinschliff und Tests

```
8.1  Migration vom alten Tool testen (alte Daten aus bestehender ernaehrung.html übernehmen)
8.2  Export/Import Roundtrip testen
8.3  Alle Akzeptanzkriterien der Definition of Done durchgehen
8.4  tests/manual-checklist-phase-1.md ausfüllen
```

---

## 4. Aufgaben je Datei

### `js/version.js`

```javascript
// Exports:
export const APP_VERSION = '1.0.0';
export const SCHEMA_VERSION = 1;   // IndexedDB + Migration-Registry synchron
```

Einfachste Datei — single source of truth für beide Versionen. Wird von `migrations.js`, `exportImport.js` und `service-worker.js` (Phase 2) importiert.

---

### `js/sync/deviceId.js`

**Aufgabe**: Stabile, gerätelokale ID erzeugen und persistent halten.

```javascript
// Exports:
export function getDeviceId(): string
// intern: localStorage liest 'ernaehrung_device_id'; wenn leer, UUID erzeugen + speichern
```

**Regeln**:
- UUID v4 erzeugen (crypto.randomUUID() falls verfügbar, sonst einfache Fallback-Implementierung)
- Einmal erzeugt, nie überschreiben
- Bei Export wird die deviceId **nicht** mit-exportiert (jedes Gerät hat seine eigene)
- Bei Import wird die deviceId des importierenden Geräts beibehalten; importierte Datensätze behalten ihre ursprüngliche deviceId (Herkunfts-Nachvollziehbarkeit)

---

### `js/storage/migrations.js`

**Aufgabe**: Schema-Versioning für localStorage und IndexedDB.

```javascript
// Exports:
export { CURRENT_SCHEMA_VERSION }   // === SCHEMA_VERSION aus version.js

export const LOCAL_STORAGE_MIGRATIONS = {
  1: seedDefaults   // Migration 0→1: Defaults aus altem Hardcode-Profil übernehmen
}

// Schema-Versions-Plan:
//   v1 (Phase 1): log, week
//   v2 (Phase 3): foodsCustom, meals
//   v3 (Phase 4): recipesCustom, recipePhotos
//   v4 (Phase 5): fridge
//   v5 (Phase 6): apiCache

export const INDEXED_DB_MIGRATIONS = {
  1: (db) => {
    // Phase 1: nur die Stores, die Phase 1 wirklich braucht
    const log = db.createObjectStore('log', { keyPath: 'date' });
    log.createIndex('dayType', 'dayType');
    log.createIndex('updatedAt', 'updatedAt');

    const week = db.createObjectStore('week', { keyPath: 'weekKey' });
    week.createIndex('year', 'year');
    week.createIndex('updatedAt', 'updatedAt');
  }
  // 2, 3, 4, 5 kommen in Phase 3–6
}

export async function runMigrations(): Promise<{ ok: boolean; appliedVersions: number[]; error?: string }>
export function seedDefaults(): void
```

**`seedDefaults()` im Detail**:
- Schreibt `ernaehrung_schema_version = 1` in localStorage (falls nicht vorhanden)
- Schreibt Default-`Settings` und Default-`UiState` in localStorage (falls nicht vorhanden)
- **Kein Default-Profil** — das ist jetzt Aufgabe des Erststart-Assistenten. `ernaehrung_profile` bleibt `null` bis der Wizard abgeschlossen ist.
- `app.js` prüft nach `runMigrations()` ob ein Profil vorhanden ist → wenn nicht: `ErststartAssistent` rendern

**Fehlerbehandlung**: Bei fehlgeschlagener Migration gibt `runMigrations()` `{ ok: false, error: "..." }` zurück — der Aufrufer (`app.js`) rendert dann einen Fehler-Bildschirm statt der App.

---

### `js/storage/indexeddb.js`

**Aufgabe**: Datenbankverbindung (Singleton) + alle CRUD-Operationen.

**`openDb()`**: Öffnet die DB mit `idb`-Wrapper, übergibt `onupgradeneeded` an die Migration-Registry. Singleton: zweiter Aufruf gibt dasselbe Versprechen zurück.

**Object Stores und Operationen** (alle async):

| Store | Funktionen |
|---|---|
| `foodsCustom` | `getAllCustomFoods()`, `getCustomFoodByBarcode(code)`, `searchCustomFoods(query)`, `saveCustomFood(food)`, `deleteCustomFood(id)` |
| `meals` | `getAllMeals()`, `getMealById(id)`, `saveMeal(meal)`, `deleteMeal(id)` |
| `recipesCustom` | `getAllCustomRecipes()`, `saveCustomRecipe(r)`, `deleteCustomRecipe(id)` |
| `fridge` | `getAllFridgeItems()`, `saveFridgeItem(item)`, `deleteFridgeItem(id)`, `clearFridge()` |
| `log` | `getLogForDate(date)`, `saveLogEntry(entry)`, `getLogsBetween(from, to)` |
| `week` | `getWeek(weekKey)`, `saveWeek(entry)`, `getWeeksByYear(year)` |
| `recipePhotos` | `getRecipePhoto(id)`, `saveRecipePhoto(photo)`, `deleteRecipePhoto(id)` |
| `apiCache` | `getCacheEntry(key)`, `setCacheEntry(key, data, ttlMs)`, `pruneExpiredCache()` |

**Phase-1-Stores**: Nur `log` und `week` werden in Phase 1 angelegt und genutzt. Alle anderen Stores (`foodsCustom`, `meals`, `recipesCustom`, `recipePhotos`, `fridge`, `apiCache`) kommen in den jeweiligen späteren Phasen — zusammen mit einem Schema-Version-Bump.

**Syncable-Felder**: Jede Schreib-Funktion ergänzt automatisch `createdAt` (wenn neu), `updatedAt` (immer), `deviceId` (aus `getDeviceId()`). Wenn der übergebene Datensatz bereits `createdAt` hat, wird es nicht überschrieben.

---

### `js/storage/localStorage.js`

**Aufgabe**: Synchrone Lese-/Schreibzugriffe auf die drei localStorage-Bereiche.

```javascript
// Profil
export function loadProfile(): Profile          // gibt Defaults zurück wenn nicht vorhanden
export function saveProfile(p: Profile): void   // setzt updatedAt automatisch

// Settings
export function loadSettings(): Settings        // mit Defaults
export function saveSettings(patch: Partial<Settings>): void  // merge (nicht replace)

// UiState
export function loadUiState(): UiState          // mit Defaults
export function saveUiState(patch: Partial<UiState>): void    // merge

// Schema-Version
export function getSchemaVersion(): number      // 0 wenn nicht gesetzt
export function setSchemaVersion(v: number): void
```

**Defaults** (wenn localStorage leer):
- `Profile`: wird von `seedDefaults()` gesetzt, nicht hier
- `Settings.enablePostmenopauseGuidance`: `true`
- `Settings.backupReminderDays`: `7`
- `Settings.operatingMode`: `'local'` (fest, kein Toggle in Phase 1)
- `UiState.activeTab`: `'heute'`
- `UiState.preferredDayType`: `'training'`
- `UiState.preferredTrainingTime`: `'08:00'`

---

### `js/storage/exportImport.js`

**`exportAll()`**:
1. Liest Profil, Settings (mit `claudeApiKey = null` und `operatingMode` as-is), UiState aus localStorage
2. Liest alle Einträge aus den in Phase 1 vorhandenen IndexedDB-Stores (`log`, `week`) — weitere Stores werden in späteren Phasen ergänzt
3. **Schreibt `claudeApiKey` immer als `null`** — keine Ausnahme, kein Parameter
4. Erstellt Export-JSON mit `exportedAt`, `appVersion`, `schemaVersion`
5. Gibt `Blob` mit `application/json` zurück
6. Aktualisiert `Settings.lastBackupAt` auf aktuellen Timestamp

**`importAll(file, options)`**:
1. Liest und parsed JSON-Datei
2. Versions-Check: `schemaVersion` der Datei > eigene → Fehler-Response
3. Wenn `schemaVersion` der Datei < eigene → Daten aufwerten (additive Felder ergänzen)
4. Bei `mode: 'replace'`: Bestätigung erwartet vom Aufrufer (UI zeigt Dialog, dann erst Aufruf)
5. Schreibt alle Daten; Profil + Settings + UiState nach localStorage; Rest in IndexedDB
6. **Importierter `claudeApiKey`** ist immer `null` — falls er in der Datei steht (alter Export), wird er ignoriert
7. Gibt `{ ok: boolean, warnings: string[], error?: string }` zurück

**`copyApiKeyToClipboard()`**: Liest `claudeApiKey` aus Settings, schreibt in Zwischenablage via `navigator.clipboard.writeText()`. Gibt `boolean` zurück (Erfolg/Misserfolg).

---

### `js/calc/bmr.js`

```javascript
export function calcLeanMass(weight, bodyFat):
  // weight * (1 - bodyFat / 100)
  // Beispiel: 100 * (1 - 0.466) = 53.4 kg

export function calcBMR(leanMass):
  // Katch-McArdle: 370 + 21.6 * leanMass
  // Beispiel: 370 + 21.6 * 53.4 = 1523 kcal
```

**Referenzwerte für Tests** (aus Übergabe-Dokument):
- LBM: 54,92 kg → BMR: 370 + 21,6 × 54,92 = **1.556 kcal** ✓

---

### `js/calc/macros.js`

```javascript
export function calcTDEE(bmr, factor):
  // Math.round(bmr * factor)

export type ProteinTargetMode = 'perKgBodyweight' | 'perKgLeanMass' | 'fixed'

export function calcProteinTarget(profile):
  // perKgBodyweight: Math.round(profile.weight * profile.proteinPerKg)
  // perKgLeanMass:   Math.round(profile.leanMass * profile.proteinPerKg)
  // fixed:           Math.round(profile.proteinPerKg)  // proteinPerKg als absoluter Wert in g

export function calcMacros(profile, totalKcal):
  // protein = calcProteinTarget(profile)
  // fat = Math.round((totalKcal * profile.fatPercent) / 9)
  // carbs = Math.max(0, Math.round((totalKcal - protein * 4 - fat * 9) / 4))
  // Reihenfolge: Protein fest, Fett %, KH als Rest

export function distributeMacrosPerMeal(mealTemplates, totalMacros):
  // kP/pP/cP/fP Prozentsätze aus MEAL_TEMPLATES auf totale Makros anwenden
  // Rückgabe: Array mit { label, time, icon, note, kcal, protein, carbs, fat }

export function calcGap(target, consumed):
  // { kcal, protein, carbs, fat } = target - consumed (kann negativ werden)
```

---

### `js/calc/nutritionLogic.js`

**Phase 1 aktiv**: `assessDeficit()`

```javascript
export function assessDeficit(profile, tdee):
  // deficit = tdee - (tdee - profile.deficit)  →  eigentlich: profile.deficit ist das Defizit
  // Severity-Stufen:
  //   safe:       deficit ≤ 20 % von TDEE
  //   moderate:   deficit 21–25 % von TDEE
  //   aggressive: deficit 26–35 % von TDEE  → Warnung
  //   dangerous:  deficit > 35 % von TDEE   → starke Warnung
  //
  // Spezialfall postmenopausale Frauen: Schwellen sind ENGER als Standard
  // (wegen anaboler Resistenz verliert man schneller Muskelmasse bei Defizit)
  // Standard: aggressive ab 500 kcal / 25%; hier: aggressive ab ~300 kcal / 18%
  // Exakte Schwellen:
  //   safe:       deficit/tdee ≤ 0.17  (≈ 300 kcal bei TDEE 1800)
  //   moderate:   0.17 < deficit/tdee ≤ 0.22
  //   aggressive: 0.22 < deficit/tdee ≤ 0.30  → warning anzeigen
  //   dangerous:  deficit/tdee > 0.30           → starke Warnung, Profil-Editor-Hinweis
```

**Phase 1 Stubs** (Funktionen vorhanden aber geben Dummy zurück):
```javascript
export function rateMealProtein(mealProteinG, isMainMeal, profile):
  // STUB Phase 1: gibt { proteinG, leucineLikelihood: 'high', rating: 'good' } zurück
  // Volle Implementierung kommt in Phase 3

export function assessDayStructure(dayLog, profile, dayType):
  // STUB Phase 1: gibt leeres Assessment zurück
  // Volle Implementierung kommt in Phase 3
```

**Warum Stubs?** Die Datei existiert ab Phase 1 mit korrektem Interface — Phase-3-Code kann die Stubs einfach durch echte Implementierungen ersetzen, ohne andere Dateien zu ändern.

---

### `js/data/mealTemplates.js`

Extrahiert aus der bestehenden `ernaehrung.html` (Funktion `getMeals()`). Format bleibt gleich:

```javascript
export const MEAL_TEMPLATES = {
  rest: [ /* 4 Mahlzeiten */ ],
  training_0800: [ /* 4 Mahlzeiten */ ],
  training_1430: [ /* 4 Mahlzeiten */ ]
}
export function getMealTemplate(dayType, trainingTime): MealTemplate[]
```

Keine inhaltlichen Änderungen an den bestehenden Templates.

---

### `js/data/tips.js`

Extrahiert aus der bestehenden `ernaehrung.html` (Profil-Tab-Bereich). 5 postmenopausale Hinweise als Array von `{ title, text }`.

---

### `js/hooks/useProfile.js`

```javascript
export function useProfile() {
  // State: profile (aus localStorage)
  // Berechnet bei jeder Profil-Änderung:
  //   leanMass = calcLeanMass(profile.weight, profile.bodyFat)
  //   bmr      = calcBMR(leanMass)
  //   tdee_training = calcTDEE(bmr, profile.trainingFactor)
  //   tdee_rest     = calcTDEE(bmr, profile.restFactor)
  //   macros_training = calcMacros(profile, tdee_training - profile.deficit)
  //   macros_rest     = calcMacros(profile, tdee_rest - profile.deficit)
  //   proteinTarget   = calcProteinTarget(profile)
  //   deficitAssessment = assessDeficit(profile, tdee_training)
  //
  // Gibt zurück: [profile, setProfile, calculated]
  // setProfile schreibt sofort nach localStorage + aktualisiert deviceId + updatedAt
}
```

---

### `js/hooks/useSettings.js` / `useUiState.js`

Einfach: laden aus localStorage beim Mount, `update(patch)`-Funktion merged patch und schreibt zurück.

---

### `js/ui/theme.js`

Alle Style-Konstanten aus dem alten `const S = { ... }` Block sowie die Farbvariablen extrahieren. Format:

```javascript
export const COLORS = { bg: '#111', surface: '#1a1a1a', gold: '#c0b283', text: '#f0ece4', subtle: '#888' }
export const S = { /* alle bestehenden Style-Objekte */ }
```

---

### `js/ui/Modal.js`

Neue Komponente. Props: `open`, `onClose`, `title?`, `children`.
Rendert ein Overlay mit zentriertem Dialog-Fenster im App-Design (dunkel, gold-Akzent).

---

### `js/ui/Toast.js`

Neue Komponente. Wird einmal in `app.js` gemountet. Stellt `showToast(message, type?)` global bereit (via Context oder einfach als Prop). Blendet Meldung nach 3 Sekunden aus.

---

### `js/ui/BackupReminderBanner.js`

Prüft `Settings.lastBackupAt`. Wenn `null` oder > `backupReminderDays` Tage her: zeigt schlankes Banner am oberen Bildschirmrand mit "Letztes Backup: vor X Tagen — [Jetzt sichern]". Der Link öffnet `DataManagement`-Export direkt.

---

### `js/ui/Navigation.js`

**Phase 1**: Nur TopTabs (Desktop-Layout). BottomNav kommt in Phase 2 mit dem PWA-Setup.

5 Tabs: Heute | Tracker | Rezepte | Woche | Profil.
Aktiver Tab hervorgehoben (gold). Klick → `setActiveTab(tab)` im UiState.

---

### `tabs/profil/ErststartAssistent.js`

Wird angezeigt, wenn **noch kein Profil** in localStorage vorhanden ist (`loadProfile()` gibt `null` zurück). Danach nie mehr — der normale `ProfileEditor` übernimmt.

**Flow**: 3 Pflicht-Schritte + 1 optionaler Schritt, jeweils eine Frage pro Bildschirm:

| Schritt | Frage | Typ | Validierung | Pflicht? |
|---|---|---|---|---|
| 1 | „Wie viel wiegst du aktuell?" | Zahl + Einheit (kg) | 30–300 | ✅ |
| 2 | „Wie groß bist du?" | Zahl + Einheit (cm) | 100–250 | ✅ |
| 3 | „Wie alt bist du?" | Zahl (Jahre) | 18–100 | ✅ |
| 4 | „Kennst du deinen Körperfettanteil?" (optional, mit „Überspringen"-Link) | Zahl (%) | 5–70 | ❌ |

**Kein Name nötig** — das Profil ist anonym, Name ist rein kosmetisch und kann im ProfileEditor ergänzt werden.

**Wenn Körperfett übersprungen**: `bodyFat` wird auf einen Schätzwert gesetzt (für postmenopausale Frauen typisch: 40 %). `leanMass` wird daraus berechnet. Ein dezenter Hinweis "Du kannst deinen KFA später im Profil ergänzen" erscheint.

**Danach**: Profil wird mit den eingegebenen Werten und sinnvollen Defaults für alle anderen Felder gespeichert:

```javascript
// Defaults nach Erststart-Wizard:
{
  weight: [eingegeben],
  height: [eingegeben],
  age: [eingegeben],
  bodyFat: [eingegeben oder 40.0 als Schätzwert],
  leanMass: calcLeanMass(weight, bodyFat),
  deficit: 300,
  proteinPerKg: 1.9,
  proteinTargetMode: 'perKgBodyweight',
  trainingFactor: 1.55,
  restFactor: 1.35,
  fatPercent: 0.25,
  strengthTrainingDaysPerWeek: 3,
}
```

**Weiterleitung nach Wizard**: App springt zum Heute-Tab, der Mahlzeitenplan ist sofort sichtbar.

---

### `tabs/profil/ProfileEditor.js`

Vollständiger Editor für alle Profilfelder (erscheint im Profil-Tab wenn bereits ein Profil existiert).

| Feld | Typ | Validierung |
|---|---|---|
| `name` | Text | max 50 Zeichen, optional |
| `weight` | Zahl | 30–300 kg |
| `height` | Zahl | 100–250 cm |
| `age` | Zahl | 18–100 |
| `bodyFat` | Zahl | 5–70 % |
| `deficit` | Zahl | 0–1000 kcal (Defizit-Warnung ab `aggressive`) |
| `proteinPerKg` | Zahl | 0.8–3.0 g/kg (oder absolut wenn `fixed`) |
| `proteinTargetMode` | Select | perKgBodyweight / perKgLeanMass / fixed |
| `trainingFactor` | Zahl | 1.2–2.0 |
| `restFactor` | Zahl | 1.2–2.0 |
| `fatPercent` | Zahl | 15–45 % |
| `strengthTrainingDaysPerWeek` | Zahl | 0–7 |

**Live-Vorschau**: Nach jeder Eingabe werden BMR / TDEE / Proteinziel / Makros sofort neu berechnet.

**Speichern**: Expliziter "Speichern"-Button. Schreibt in localStorage. Zeigt Toast "Profil gespeichert".

**Defizit-Warnung**: Wenn `assessDeficit()` → `aggressive` oder `dangerous`, erscheint ein farbiger Hinweis-Block direkt unter dem Defizit-Feld.

---

### `js/app.js`

```javascript
// Importiert alle CDN-Globals (React, ReactDOM als window.React/ReactDOM)
// Importiert alle eigenen Module
// Führt beim Start aus:
//   1. runMigrations() → bei Fehler: Fehler-Screen rendern, nicht weiter
//   2. React.render(<App />, document.getElementById('root'))

// App-Komponente:
//   - useProfile, useSettings, useUiState laden
//   - Wenn profile === null → ErststartAssistent rendern (kein Tab-Layout)
//   - Wenn profile vorhanden → normales Tab-Layout:
//       BackupReminderBanner
//       Navigation (TopTabs)
//       Tab-Switch: Heute | Tracker | Rezepte | Woche | Profil
```

---

### `ernaehrung.html` (neue Shell)

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <title>Ernährungs-Tool · Stephanie Meurer</title>
  <link href="[Fonts-URL]" rel="stylesheet"/>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/idb@8/build/umd.js"></script>
  <style>
    /* Minimaler Reset */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; }
    body { background: #111; color: #f0ece4; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="env,react" src="./js/app.js"></script>
</body>
</html>
```

**Achtung CDN-Reihenfolge**: `react`, `react-dom`, `babel`, `idb` müssen geladen sein bevor `app.js` ausgeführt wird. Babel-Standalone mit `data-type="module"` löst die Imports in `app.js` auf.

---

## 5. Testplan

### Teststrategie Phase 1

Phase 1 nutzt **ausschließlich manuelle Tests** im Browser. Kein automatisiertes Test-Framework in Phase 1 — der Overhead übersteigt den Nutzen bei einem einzelnen Entwickler. Unit-Tests werden ab Phase 3 für die komplexere Vorschlags-Logik eingeführt.

**Ausnahme**: Die reinen Berechnungsfunktionen (`calc/bmr.js`, `calc/macros.js`) werden per Browser-Konsole mit Referenzwerten verifiziert — das ist in ca. 5 Minuten erledigt und verhindert die häufigsten Fehler.

### Referenzwerte für Berechnungen

| Berechnung | Eingabe | Erwartetes Ergebnis |
|---|---|---|
| `calcLeanMass(100, 46.6)` | weight 100, bodyFat 46.6% | 53.40 kg |
| `calcBMR(53.40)` | LBM 53.40 | 1.523 kcal |
| `calcTDEE(1523, 1.55)` | Trainingstag | 2.361 kcal |
| `calcTDEE(1523, 1.35)` | Ruhetag | 2.056 kcal |
| `calcProteinTarget({weight:100, proteinPerKg:1.9, proteinTargetMode:'perKgBodyweight'})` | | 190 g |
| `assessDeficit({deficit:300,...}, 2056)` | 300 kcal bei TDEE 2056 | severity: 'safe' (14.6%) |
| `assessDeficit({deficit:700,...}, 2056)` | 700 kcal bei TDEE 2056 | severity: 'aggressive' (34%) |

*Hinweis: Die Referenzwerte im Übergabedokument verwenden LBM 54,92 — das kommt von einer älteren Messung. Der Code soll korrekt rechnen, nicht die alten Werte replizieren.*

### Test-Bereiche

| Bereich | Was wird getestet |
|---|---|
| **Berechnungen** | BMR/TDEE/Makros mit Referenzwerten (Konsole) |
| **Storage** | Profil speichern → Browser-Reload → Profil laden (visuell) |
| **Migration** | Erststart ohne Daten → Defaults korrekt |
| **Export** | JSON enthält korrekte Felder, kein API-Key |
| **Import** | Roundtrip: Export → leere DB → Import → identischer Zustand |
| **Defizit-Warnung** | Defizit-Schwellen korrekt auslösen |
| **Heute-Tab** | Mahlzeitenplan korrekt für alle 3 Tagestypen |
| **Navigation** | Alle 5 Tabs navigierbar, UiState persistiert |
| **Backup-Banner** | Banner erscheint nach simulierten 7+ Tagen |

---

## 6. Manuelle Tests (Smoke-Test-Checkliste)

*Diese Checkliste wird nach Implementierung abgearbeitet und in `tests/manual-checklist-phase-1.md` als ausgefüllt gespeichert.*

### T-00 Proof of Concept (vor allem anderen)

- [ ] `poc/index.html` über lokalen Webserver geöffnet (z.B. `python -m http.server 8080`)
- [ ] Seite zeigt "Hallo Stephanie" im Browser
- [ ] Keine Konsolen-Fehler
- [ ] Kein CORS-Fehler
- [ ] **Ergebnis dokumentiert**: PoC erfolgreich → weiter | PoC gescheitert → Fallback-Plan aktiviert

### T-01 App-Start

- [ ] App öffnet im Browser ohne Konsolen-Fehler (F12 → Console: 0 errors, 0 unhandled rejections)
- [ ] Keine Netzwerk-Requests an Supabase, api.anthropic.com, oder fremde Domains (F12 → Network-Tab prüfen, nur Google Fonts + CDN-Scripts erlaubt)
- [ ] IndexedDB angelegt (F12 → Application → IndexedDB → `ernaehrung_db` existiert mit den 2 Phase-1-Stores: `log` und `week`)
- [ ] localStorage enthält `ernaehrung_schema_version = 1` — aber **noch kein** `ernaehrung_profile` (Erststart-Wizard soll erscheinen)

### T-02 Erststart-Assistent

- [ ] Erster App-Start (leerer localStorage): Erststart-Wizard erscheint statt normaler App
- [ ] Schritt 1 „Gewicht": Eingabe 100, Weiter-Button aktiv
- [ ] Schritt 1: Eingabe 20 (zu wenig) → Weiter-Button gesperrt oder Fehlermeldung
- [ ] Schritt 2 „Größe": Eingabe 178, Weiter-Button aktiv
- [ ] Schritt 3 „Alter": Eingabe 59, Weiter-Button aktiv
- [ ] Schritt 4 „Körperfett": „Überspringen"-Link sichtbar und funktioniert
- [ ] Schritt 4: Eingabe 46.6, Fertig-Button aktiv
- [ ] Nach Abschluss: App öffnet Heute-Tab, kein Wizard mehr
- [ ] localStorage enthält jetzt `ernaehrung_profile` mit den eingegebenen Werten
- [ ] Wenn Körperfett übersprungen: `bodyFat = 40.0` als Schätzwert gespeichert
- [ ] Browser-Reload nach Wizard: Wizard erscheint **nicht** erneut, normale App läuft

### T-03 Migration / normaler Start (nach Wizard)

- [ ] BMR / TDEE / Proteinziel werden korrekt aus Wizard-Werten berechnet angezeigt
- [ ] Alle 5 Tabs navigierbar
- [ ] Heute-Tab zeigt Mahlzeitenplan (Trainingstag 08:00 als Default)

### T-04 Profil-Editor

- [ ] Alle Felder editierbar
- [ ] Live-Vorschau aktualisiert sich bei Eingabe (BMR / TDEE / Makros)
- [ ] "Speichern"-Button schreibt Werte
- [ ] Browser-Reload: geänderte Werte erhalten
- [ ] Defizit = 300 kcal → KEIN Warnhinweis
- [ ] Defizit = 700 kcal → Warnung "aggressiv" sichtbar
- [ ] Defizit = 900 kcal → Warnung "gefährlich" sichtbar
- [ ] Defizit zurück auf 300 → Warnung verschwindet
- [ ] Proteinziel-Modus 'perKgLeanMass' → Proteinziel ändert sich (kleiner als perKgBodyweight)
- [ ] Validierung: Gewicht < 30 kg → Fehlermeldung oder Eingabe blockiert

### T-05 Export / Import

- [ ] Export-Button → JSON-Datei wird heruntergeladen
- [ ] Datei öffnen: `claudeApiKey` ist `null`
- [ ] Datei öffnen: `schemaVersion: 1`
- [ ] Datei öffnen: `profile` enthält geänderte Werte aus T-03
- [ ] `Settings.lastBackupAt` aktualisiert sich nach Export
- [ ] Profil auf anderem Gerät / Inkognito-Fenster importieren → identische Werte
- [ ] Import mit einer Datei einer neueren Schema-Version → Fehlermeldung (simulierbar mit manuellem Edit der JSON)

### T-06 Backup-Reminder-Banner

- [ ] Direkt nach Export: kein Banner sichtbar
- [ ] `Settings.lastBackupAt` in localStorage auf Wert vor 8 Tagen setzen → App-Reload → Banner erscheint
- [ ] Banner-Button "Jetzt sichern" → startet Export, Banner verschwindet

### T-07 Heute-Tab — alle 3 Tagestypen

- [ ] Trainingstag 08:00: Pre-Workout, Post-Workout, Mittagessen, Abendessen — korrekte Zeiten und Makros
- [ ] Trainingstag 14:30: Frühstück, Pre-Workout, Post-Workout, Abendessen
- [ ] Ruhetag: Frühstück, Mittagessen, Nachmittagssnack, Abendessen
- [ ] Kcal-Ring zeigt Plan-Tagesziel (kein Tracking, Ring bleibt "leer" / zeigt 0 von Ziel)
- [ ] Makro-Balken zeigen Tagesziel-Werte

### T-08 Woche-Tab

- [ ] Tab öffnet ohne Fehler
- [ ] 7-Tage-Raster sichtbar (leer, strukturiert)

### T-09 Tracker / Rezepte (Platzhalter)

- [ ] Tracker-Tab zeigt Hinweis "folgt in Phase 3" (kein Absturz)
- [ ] Rezepte-Tab zeigt die 8 bestehenden Rezepte als einfache Liste (kein Absturz)

### T-10 Navigation und UiState

- [ ] Aktiver Tab wird korrekt hervorgehoben
- [ ] Browser-Reload: zuletzt aktiver Tab bleibt aktiv (UiState persistiert)

### T-11 Profil-Tab — Weitere Bereiche

- [ ] Postmenopausale Hinweise alle 5 sichtbar
- [ ] Settings-Panel: `enablePostmenopauseGuidance` Toggle vorhanden und speichert
- [ ] `operatingMode` wird als "Lokal (Phase 1)" angezeigt, nicht editierbar

---

## 7. Risiken und Mitigationen

| # | Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|---|---|---|---|---|
| R-01 | **Babel + ES Modules Inkompatibilität**: `data-type="module"` mit Babel-Standalone funktioniert nicht wie erwartet — relative Imports werden nicht aufgelöst | Mittel | Kritisch | **Wird als Schritt 0 (PoC) vor allem anderen getestet** — `poc/index.html` + `poc/js/app.js` + `poc/js/test.js`. Erst bei erfolgreichem PoC wird die vollständige Struktur gebaut. Fallback: alle JS per `<script type="text/babel">` inline in `ernaehrung.html`, logisch durch Kommentar-Trenner gegliedert, keine `import`/`export`-Syntax. |
| R-02 | **idb ESM/UMD Konflikt**: `idb` über CDN als UMD geladen, aber als ESM importiert | Mittel | Kritisch | Prüfen ob `window.idb` bei UMD-Build verfügbar ist. Alternativ: eigene minimale IndexedDB-Wrapper-Funktion ohne `idb` (20 Zeilen). |
| R-03 | **IndexedDB auf iOS Safari**: Private-Browsing-Modus blockiert IndexedDB | Niedrig | Mittel | Beim Öffnen prüfen, ob IndexedDB verfügbar ist; Fallback-Meldung "Bitte normalen Browser-Modus verwenden". |
| R-04 | **Migration schlägt fehl bei korrupten Daten**: Wenn jemand den localStorage manuell editiert hat | Niedrig | Mittel | `runMigrations()` in try/catch — bei Fehler: Fehler-Screen mit "Daten zurücksetzen"-Button, der localStorage + IndexedDB leert und neu startet. |
| R-05 | **Scope Creep**: Versuche, Tracker-Features früher einzubauen | Mittel | Mittel | Platzhalter-Tabs explizit mit "Phase 3" markieren. Jede neue Feature-Idee → erst Spec-Update, dann Plan, dann Code. |
| R-06 | **Performance von Babel-Standalone**: Transpilierung von 20+ Dateien macht App-Start spürbar langsam | Mittel | Niedrig | Akzeptabel in Phase 1. Service Worker (Phase 2) löst das durch Caching. Wenn zu langsam: Module zusammenfassen. |
| R-07 | **Veraltete ernaehrung.html** läuft noch auf GitHub Pages und verwirrt bei Tests | Niedrig | Niedrig | Erst nach vollständigem lokalen Test hochladen. Old File explizit ersetzen (nicht umbenennen). |

---

## 8. Definition of Done — Phase 1

Phase 1 gilt als **abgeschlossen**, wenn **alle** der folgenden Kriterien erfüllt sind:

### Voraussetzung (muss zuerst erfüllt sein)

- [ ] **Proof of Concept (T-00) erfolgreich**: `poc/index.html` lädt `poc/js/app.js` via Babel-Modul, importiert aus `poc/js/test.js`, zeigt "Hallo Stephanie" ohne Fehler. Oder: Fallback-Ansatz gewählt und Plan entsprechend aktualisiert.

### Code-Qualität

- [ ] Alle Dateien aus Abschnitt 2 existieren im Repository (inkl. `poc/`-Ordner)
- [ ] `ernaehrung.html` ist auf Shell reduziert (< 40 Zeilen)
- [ ] Keine `console.error` oder unbehandelte Promise-Rejections beim App-Start
- [ ] Kein Netzwerk-Request außer Google Fonts + CDN-Scripts (kein Supabase, kein api.anthropic.com)
- [ ] `log` und `week` Stores haben `updatedAt`-Index
- [ ] Jeder neu geschriebene Datensatz trägt `deviceId` (aus `getDeviceId()`)

### Funktionalität

- [ ] Alle manuellen Tests T-00 bis T-11 aus Abschnitt 6 bestanden ✓
- [ ] Referenzwerte aus Abschnitt 5 für BMR/TDEE/Makros korrekt berechnet
- [ ] **Erststart-Assistent**: Wizard erscheint bei leerem localStorage, fragt Gewicht / Größe / Alter / Körperfett (optional), erzeugt Profil, springt zum Heute-Tab
- [ ] Erststart-Assistent erscheint nach Wizard-Abschluss **nie wieder** (Browser-Reload getestet)
- [ ] Körperfett-Überspringen setzt `bodyFat = 40.0` als Schätzwert
- [ ] Defizit-Warnung zeigt korrekte Severity-Stufen (safe / moderate / aggressive / dangerous)
- [ ] Export-JSON enthält niemals einen echten `claudeApiKey`-Wert
- [ ] Import-Roundtrip funktioniert (Export auf Gerät A → Import auf Gerät B → identischer Zustand)
- [ ] Backup-Reminder erscheint korrekt nach 7+ Tagen

### Datenintegrität

- [ ] Schema-Version 1 korrekt gesetzt
- [ ] Migration von Erststart (leerer localStorage) funktioniert → Defaults korrekt
- [ ] Browser-Reload nach Profil-Änderung → Werte erhalten
- [ ] `seedDefaults()` setzt keine Profil-Daten (das macht ausschließlich der Erststart-Wizard)

### Dokumentation

- [ ] `tests/manual-checklist-phase-1.md` ausgefüllt, alle Checkboxen markiert
- [ ] `docs/projekt-spezifikation.md` Version 1.2.1 liegt im Repository

### Übergabe an Phase 2

- [ ] Stephanie hat die App auf ihrem Smartphone im Browser (nicht installiert — das ist Phase 2) getestet
- [ ] Stephanie hat einen Export erstellt und diesen als Backup gespeichert
- [ ] Explizites "OK für Phase 2" von Stephanie

---

*Ende des Implementierungsplans Phase 1.*
*Phase-2-Plan wird erstellt, nachdem Phase 1 die Definition of Done vollständig erfüllt.*
