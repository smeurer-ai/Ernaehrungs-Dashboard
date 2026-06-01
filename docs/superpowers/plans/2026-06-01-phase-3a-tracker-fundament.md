# Phase 3A: Tracker-Fundament Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tracker-Tab funktionsfähig machen: manuelle Mahlzeit-Eingabe, minimale Favoriten-Lebensmittel, Tagesliste mit Löschen/Editieren.

**Architecture:** Schema-Version 1→2 (neue IndexedDB-Stores `foodsCustom` + `meals`). Pure Berechnungsfunktion `calcTrackedFoodMacros` in `js/calc/tracker.js`. Zwei neue Hooks (`useLog`, `useFavoriteFoods`). TrackerTab mit Modal-Pattern für Eingabe. Keine Open-Food-Facts-Integration (kommt Phase 3E). Kein Bilanz-Vergleich (kommt Phase 3B).

**Tech Stack:** React 18 + htm (bestehend), IndexedDB via idb, Vitest für pure functions.

---

## Kontext

**Projekt-Root:** `D:\Claude Projekte\Ernährungs-Dashboard\`  
**Branch:** `phase-3-tracker`  
**Aktuelle Version:** `1.1.1` · **Schema:** `1`  
**87 bestehende Tests** müssen durchgehend grün bleiben.

### Wichtige Bestandscode-Fakten

- `js/version.js`: `APP_VERSION` + `SCHEMA_VERSION` — beides muss synchron gebumpt werden
- `js/storage/migrations.js`: `CURRENT_SCHEMA_VERSION = SCHEMA_VERSION` (kein eigener Wert!) — Migration-2-Eintrag ist nur Kommentar, muss implementiert werden
- `js/storage/indexeddb.js`: hat `getLogForDate`, `saveLogEntry`, `getLogsBetween` — aber `LogEntry` hat noch **kein `entries`-Feld**
- `service-worker.js`: `APP_VERSION` muss ebenfalls angepasst werden + neue Dateien in `LOCAL_ASSETS`
- `js/app.js`: `TrackerTab` bekommt aktuell keine Props — muss in Task 6 geändert werden

### Muster befolgen

- `js/calc/bmr.js` als Stil-Vorlage für neue calc-Dateien
- `js/hooks/useProfile.js` als Stil-Vorlage für neue Hooks
- Alle Styles über `S.xyz` aus `js/ui/theme.js` — kein Inline-CSS direkt

---

## Neue Dateien

| Datei | Zweck |
|---|---|
| `js/calc/tracker.js` | Pure: `calcTrackedFoodMacros(food, gramm)` |
| `tests/unit/calc/tracker.test.js` | Unit-Tests für tracker.js |
| `js/hooks/useLog.js` | React-Hook: Tages-Einträge laden/speichern/löschen |
| `js/hooks/useFavoriteFoods.js` | React-Hook: Favoriten-Lebensmittel CRUD |
| `js/tabs/tracker/DayLogList.js` | Heutiges Log anzeigen (nach Mahlzeit gruppiert) |
| `js/tabs/tracker/DayLogEntry.js` | Einzelner Eintrag mit Edit/Löschen-Buttons |
| `js/tabs/tracker/FoodEntryModal.js` | Eingabe-Modal: manuell oder aus Favoriten |
| `js/tabs/tracker/FavoritePicker.js` | Chips zum Auswählen gespeicherter Favoriten |
| `js/tabs/tracker/TrackerTab.js` | Haupt-Komponente (ersetzt Platzhalter) |

## Geänderte Dateien

| Datei | Änderung |
|---|---|
| `js/version.js` | `APP_VERSION` 1.1.1→1.2.0, `SCHEMA_VERSION` 1→2 |
| `js/storage/migrations.js` | Migration 2 implementieren (foodsCustom + meals) |
| `js/storage/indexeddb.js` | `LogEntry`-Typedef ergänzen + `foodsCustom`-CRUD hinzufügen |
| `js/app.js` | TrackerTab Props übergeben |
| `service-worker.js` | Version 1.2.0 + neue Dateien in LOCAL_ASSETS |

---

## Schemas (Referenz für alle Tasks)

```javascript
/**
 * @typedef {Object} FavoriteFood
 * @property {string}  id       - UUID
 * @property {string}  name     - "Magerquark"
 * @property {number}  kcal100  - kcal pro 100g
 * @property {number}  p100     - Protein pro 100g
 * @property {number}  c100     - KH pro 100g
 * @property {number}  f100     - Fett pro 100g
 * @property {'manual'} source  - immer 'manual' in Phase 3A
 * @property {number}  createdAt
 * @property {number}  updatedAt
 * @property {string}  deviceId
 */

/**
 * @typedef {Object} TrackedFood
 * @property {string}  id        - UUID des Eintrags
 * @property {string}  mealSlot  - "Frühstück" | "Pre-Workout" | etc.
 * @property {string}  foodName  - Anzeigename
 * @property {string}  [foodRef] - 'fav:{id}' | 'manual'
 * @property {number}  gramm     - Gewicht in g
 * @property {number}  kcal      - berechnet
 * @property {number}  p         - Protein in g (1 Dezimalstelle)
 * @property {number}  c         - KH in g (1 Dezimalstelle)
 * @property {number}  f         - Fett in g (1 Dezimalstelle)
 * @property {number}  timestamp - Unix ms
 */

/**
 * @typedef {Object} LogEntry  (erweitertes Schema)
 * @property {string}        date         - "YYYY-MM-DD" (keyPath)
 * @property {string}        dayType      - 'training' | 'rest'
 * @property {string}        [trainingTime] - "HH:MM"
 * @property {TrackedFood[]} entries      - Mahlzeit-Einträge (NEU)
 * @property {number}        createdAt
 * @property {number}        updatedAt
 * @property {string}        deviceId
 */
```

---

## Task 1: Schema v2 + IndexedDB-Erweiterungen

**Files:**
- Modify: `js/version.js`
- Modify: `js/storage/migrations.js`
- Modify: `js/storage/indexeddb.js`

### Schritt 1.1: version.js bumpen

```javascript
export const APP_VERSION = '1.2.0';
export const SCHEMA_VERSION = 2; // Phase 3A: foodsCustom + meals
```

### Schritt 1.2: migrations.js — Migration 2 implementieren

Den Kommentar `// v2: kommt in Phase 3 (Mahlzeiten-Details)` ersetzen mit:

```javascript
  /**
   * v2: Phase 3A — Favoriten-Lebensmittel + Mahlzeit-Vorlagen
   * @param {import('idb').IDBPDatabase} db
   */
  2: (db) => {
    // foodsCustom: manuell angelegte Lieblingslebensmittel
    const foodsStore = db.createObjectStore('foodsCustom', { keyPath: 'id' });
    foodsStore.createIndex('name', 'name', { unique: false });
    foodsStore.createIndex('updatedAt', 'updatedAt', { unique: false });

    // meals: Favoriten-Mahlzeiten (Kombis aus mehreren Lebensmitteln, Phase 3B+)
    const mealsStore = db.createObjectStore('meals', { keyPath: 'id' });
    mealsStore.createIndex('lastUsed', 'lastUsed', { unique: false });
    mealsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
  },
```

### Schritt 1.3: indexeddb.js — LogEntry-Typedef erweitern + foodsCustom-CRUD

**A) LogEntry-Typedef** (den bestehenden Block ersetzen):

```javascript
/**
 * @typedef {Object} TrackedFood
 * @property {string}  id        - UUID des Eintrags
 * @property {string}  mealSlot  - "Frühstück" | "Pre-Workout" | etc.
 * @property {string}  foodName
 * @property {string}  [foodRef] - 'fav:{id}' | 'manual'
 * @property {number}  gramm
 * @property {number}  kcal
 * @property {number}  p         - Protein in g
 * @property {number}  c         - KH in g
 * @property {number}  f         - Fett in g
 * @property {number}  timestamp
 */

/**
 * @typedef {Object} LogEntry
 * @property {string}        date           - "YYYY-MM-DD" (keyPath)
 * @property {string}        dayType        - 'training' | 'rest'
 * @property {string}        [trainingTime] - "HH:MM"
 * @property {TrackedFood[]} entries        - Mahlzeit-Einträge (leer wenn noch nichts eingetragen)
 * @property {number}        createdAt
 * @property {number}        updatedAt
 * @property {string}        deviceId
 */
```

**B) foodsCustom-CRUD** am Ende der Datei (nach dem week-Store-Block) einfügen:

```javascript
// ---------------------------------------------------------------------------
// foodsCustom-Store (Favoriten-Lebensmittel, Phase 3A)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} FavoriteFood
 * @property {string}  id
 * @property {string}  name
 * @property {number}  kcal100
 * @property {number}  p100
 * @property {number}  c100
 * @property {number}  f100
 * @property {'manual'} source
 * @property {number}  createdAt
 * @property {number}  updatedAt
 * @property {string}  deviceId
 */

/**
 * Gibt alle gespeicherten Favoriten-Lebensmittel zurück, sortiert nach Name.
 * @returns {Promise<FavoriteFood[]>}
 */
export async function getAllFavoriteFoods() {
  const db = await openDb();
  const all = await db.getAll('foodsCustom');
  return all.sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

/**
 * Speichert ein Favoriten-Lebensmittel (neu oder Update).
 * Setzt createdAt/updatedAt/deviceId automatisch.
 * @param {Omit<FavoriteFood, 'createdAt'|'updatedAt'|'deviceId'>} food
 * @returns {Promise<void>}
 */
export async function saveFavoriteFood(food) {
  const db = await openDb();
  const now = Date.now();
  const existing = await db.get('foodsCustom', food.id);

  await db.put('foodsCustom', {
    ...food,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deviceId: getDeviceId(),
  });
}

/**
 * Löscht ein Favoriten-Lebensmittel anhand der ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteFavoriteFood(id) {
  const db = await openDb();
  await db.delete('foodsCustom', id);
}
```

- [ ] **Step 1.4: Manuelle Prüfung**

```bash
cd "D:\Claude Projekte\Ernährungs-Dashboard"
node -e "
import('./js/storage/migrations.js').then(m => {
  console.log('SCHEMA_VERSION:', m.CURRENT_SCHEMA_VERSION);
  console.log('Migration 2 vorhanden:', typeof m.INDEXED_DB_MIGRATIONS[2]);
}).catch(e => console.error(e));
" 2>&1
```

Erwartete Ausgabe: `SCHEMA_VERSION: 2`, `Migration 2 vorhanden: function`

- [ ] **Step 1.5: Tests ausführen (alle 87 müssen grün sein)**

```bash
npm test
```

- [ ] **Step 1.6: Commit**

```bash
git add js/version.js js/storage/migrations.js js/storage/indexeddb.js
git commit -m "feat(schema): bump to v2 — foodsCustom + meals stores, TrackedFood typedef"
```

---

## Task 2: calcTrackedFoodMacros + Tests (TDD)

**Files:**
- Create: `js/calc/tracker.js`
- Create: `tests/unit/calc/tracker.test.js`

### Schritt 2.1: Test schreiben (wird zuerst fehlschlagen)

`tests/unit/calc/tracker.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { calcTrackedFoodMacros } from '../../../js/calc/tracker.js';

// Referenz-Lebensmittel für Tests
const QUARK   = { kcal100: 72,  p100: 12,  c100: 4,   f100: 0.2 };
const HAFERFLOCKEN = { kcal100: 370, p100: 13,  c100: 59,  f100: 7   };
const WHEY    = { kcal100: 380, p100: 75,  c100: 8,   f100: 6   };

describe('calcTrackedFoodMacros', () => {
  it('berechnet Makros für 200g Magerquark korrekt', () => {
    // kcal: Math.round(72 * 2) = 144
    // p:    Math.round(12 * 2 * 10) / 10 = 24.0
    // c:    Math.round(4 * 2 * 10) / 10 = 8.0
    // f:    Math.round(0.2 * 2 * 10) / 10 = 0.4
    expect(calcTrackedFoodMacros(QUARK, 200)).toEqual({
      kcal: 144, p: 24, c: 8, f: 0.4,
    });
  });

  it('berechnet Makros für 80g Haferflocken korrekt', () => {
    // kcal: Math.round(370 * 0.8) = 296
    // p:    Math.round(13 * 0.8 * 10) / 10 = 10.4
    // c:    Math.round(59 * 0.8 * 10) / 10 = 47.2
    // f:    Math.round(7 * 0.8 * 10) / 10 = 5.6
    expect(calcTrackedFoodMacros(HAFERFLOCKEN, 80)).toEqual({
      kcal: 296, p: 10.4, c: 47.2, f: 5.6,
    });
  });

  it('berechnet Makros für 30g Whey-Protein korrekt', () => {
    // kcal: Math.round(380 * 0.3) = 114
    // p:    Math.round(75 * 0.3 * 10) / 10 = 22.5
    // c:    Math.round(8 * 0.3 * 10) / 10 = 2.4
    // f:    Math.round(6 * 0.3 * 10) / 10 = 1.8
    expect(calcTrackedFoodMacros(WHEY, 30)).toEqual({
      kcal: 114, p: 22.5, c: 2.4, f: 1.8,
    });
  });

  it('gibt Nullen zurück bei 0 Gramm', () => {
    expect(calcTrackedFoodMacros(QUARK, 0)).toEqual({
      kcal: 0, p: 0, c: 0, f: 0,
    });
  });

  it('kcal ist immer eine ganze Zahl', () => {
    const result = calcTrackedFoodMacros(QUARK, 75);
    expect(Number.isInteger(result.kcal)).toBe(true);
  });

  it('p, c, f haben maximal 1 Dezimalstelle', () => {
    const result = calcTrackedFoodMacros(HAFERFLOCKEN, 33);
    // Prüft dass keine mehr als 1 Dezimalstelle vorkommt
    const toDecimals = (n) => (n.toString().split('.')[1] || '').length;
    expect(toDecimals(result.p)).toBeLessThanOrEqual(1);
    expect(toDecimals(result.c)).toBeLessThanOrEqual(1);
    expect(toDecimals(result.f)).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2.2: Test ausführen → MUSS fehlschlagen**

```bash
npm test -- tests/unit/calc/tracker.test.js
```

Erwartete Ausgabe: `FAIL` — "Cannot find module"

### Schritt 2.3: Implementierung schreiben

`js/calc/tracker.js`:

```javascript
/**
 * Berechnungsfunktionen für den Tracker-Tab.
 * Alle Funktionen sind pure — kein State, kein DOM.
 *
 * @module calc/tracker
 */

/**
 * Berechnet die Makronährstoffe eines Lebensmitteleintrags.
 *
 * Rundungsregeln:
 *   kcal → ganzzahlig (Math.round)
 *   p, c, f → 1 Dezimalstelle (Math.round(x * 10) / 10)
 *
 * @param {{ kcal100: number, p100: number, c100: number, f100: number }} food
 * @param {number} gramm - Menge in Gramm
 * @returns {{ kcal: number, p: number, c: number, f: number }}
 *
 * @example
 * calcTrackedFoodMacros({ kcal100: 72, p100: 12, c100: 4, f100: 0.2 }, 200)
 * // → { kcal: 144, p: 24, c: 8, f: 0.4 }
 */
export function calcTrackedFoodMacros(food, gramm) {
  const factor = gramm / 100;
  return {
    kcal: Math.round(food.kcal100 * factor),
    p:    Math.round(food.p100 * factor * 10) / 10,
    c:    Math.round(food.c100 * factor * 10) / 10,
    f:    Math.round(food.f100 * factor * 10) / 10,
  };
}
```

- [ ] **Step 2.4: Alle Tests ausführen → müssen grün sein**

```bash
npm test
```

Erwartete Ausgabe: `93 passed` (87 + 6 neue).

- [ ] **Step 2.5: Commit**

```bash
git add js/calc/tracker.js tests/unit/calc/tracker.test.js
git commit -m "feat: add calcTrackedFoodMacros + 6 unit tests"
```

---

## Task 3: Hooks (useLog + useFavoriteFoods)

**Files:**
- Create: `js/hooks/useLog.js`
- Create: `js/hooks/useFavoriteFoods.js`

### Schritt 3.1: useLog.js

```javascript
import { useState, useEffect, useCallback } from '../lib.js';
import { getLogForDate, saveLogEntry } from '../storage/indexeddb.js';
import { getDeviceId } from '../sync/deviceId.js';

/**
 * React-Hook für das Tages-Tagebuch.
 *
 * Gibt die Einträge für `date` zurück und Funktionen zum Hinzufügen,
 * Aktualisieren und Löschen einzelner TrackedFood-Einträge.
 *
 * @param {string} date - "YYYY-MM-DD"
 * @param {{ dayType: string, trainingTime?: string }} dayMeta
 */
export function useLog(date, dayMeta) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Log für heute laden
  useEffect(() => {
    setLoading(true);
    getLogForDate(date).then(log => {
      setEntries(log?.entries ?? []);
      setLoading(false);
    });
  }, [date]);

  // Hilfsfunktion: aktuelle LogEntry-Struktur bauen
  async function buildAndSave(updatedEntries) {
    const existing = await getLogForDate(date);
    await saveLogEntry({
      date,
      dayType: dayMeta.dayType,
      trainingTime: dayMeta.trainingTime,
      ...existing,
      entries: updatedEntries,
    });
    setEntries(updatedEntries);
  }

  const addEntry = useCallback(async (trackedFood) => {
    const current = await getLogForDate(date);
    const updated = [...(current?.entries ?? []), trackedFood];
    await buildAndSave(updated);
  }, [date, dayMeta]);

  const removeEntry = useCallback(async (entryId) => {
    const current = await getLogForDate(date);
    const updated = (current?.entries ?? []).filter(e => e.id !== entryId);
    await buildAndSave(updated);
  }, [date, dayMeta]);

  const updateEntry = useCallback(async (entryId, changes) => {
    const current = await getLogForDate(date);
    const updated = (current?.entries ?? []).map(e =>
      e.id === entryId ? { ...e, ...changes } : e
    );
    await buildAndSave(updated);
  }, [date, dayMeta]);

  return { entries, loading, addEntry, removeEntry, updateEntry };
}
```

### Schritt 3.2: useFavoriteFoods.js

```javascript
import { useState, useEffect, useCallback } from '../lib.js';
import {
  getAllFavoriteFoods,
  saveFavoriteFood,
  deleteFavoriteFood,
} from '../storage/indexeddb.js';

/**
 * React-Hook für Favoriten-Lebensmittel.
 * Lädt alle gespeicherten Favoriten und bietet CRUD-Operationen.
 */
export function useFavoriteFoods() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    getAllFavoriteFoods().then(foods => {
      setFavorites(foods);
      setLoading(false);
    });
  }, []);

  useEffect(() => { reload(); }, []);

  const addFavorite = useCallback(async (food) => {
    await saveFavoriteFood(food);
    reload();
  }, [reload]);

  const removeFavorite = useCallback(async (id) => {
    await deleteFavoriteFood(id);
    reload();
  }, [reload]);

  return { favorites, loading, addFavorite, removeFavorite };
}
```

- [ ] **Step 3.3: Tests laufen lassen (Regression-Check)**

```bash
npm test
```

Erwartete Ausgabe: `93 passed` — unverändert.

- [ ] **Step 3.4: Commit**

```bash
git add js/hooks/useLog.js js/hooks/useFavoriteFoods.js
git commit -m "feat: add useLog and useFavoriteFoods hooks"
```

---

## Task 4: DayLogList + DayLogEntry

**Files:**
- Create: `js/tabs/tracker/DayLogList.js`
- Create: `js/tabs/tracker/DayLogEntry.js`

### Schritt 4.1: DayLogEntry.js

Einzelner Eintrag mit Makro-Anzeige + Löschen-Button.

```javascript
import { html } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';

/**
 * Einzelner TrackedFood-Eintrag mit Löschen-Option.
 *
 * @param {{ entry: TrackedFood, onDelete: function, onEdit: function }} props
 */
export function DayLogEntry({ entry, onDelete, onEdit }) {
  return html`
    <div style=${{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 10px',
      borderRadius: '8px',
      background: '#141414',
      marginBottom: '4px',
      gap: '8px',
    }}>
      <div style=${{ flex: 1, minWidth: 0 }}>
        <div style=${{
          fontSize: '13px',
          color: COLORS.text,
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          ${entry.foodName}
          <span style=${{ fontSize: '11px', color: COLORS.textMuted, fontWeight: 400, marginLeft: '6px' }}>
            ${entry.gramm}g
          </span>
        </div>
        <div style=${{
          fontSize: '11px',
          color: COLORS.textMuted,
          fontFamily: FONTS.mono,
          marginTop: '2px',
        }}>
          ${entry.kcal} kcal
          · ${entry.p}P · ${entry.c}KH · ${entry.f}F
        </div>
      </div>
      <div style=${{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button
          onClick=${() => onEdit(entry)}
          style=${{
            background: 'transparent',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '11px',
            color: COLORS.textMuted,
            cursor: 'pointer',
            fontFamily: FONTS.mono,
          }}
          aria-label="Eintrag bearbeiten"
        >✏️</button>
        <button
          onClick=${() => onDelete(entry.id)}
          style=${{
            background: 'transparent',
            border: '1px solid #3a1515',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '11px',
            color: '#e05c5c',
            cursor: 'pointer',
            fontFamily: FONTS.mono,
          }}
          aria-label="Eintrag löschen"
        >🗑</button>
      </div>
    </div>
  `;
}
```

### Schritt 4.2: DayLogList.js

Einträge nach `mealSlot` gruppiert anzeigen.

```javascript
import { html } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { DayLogEntry } from './DayLogEntry.js';

/**
 * Zeigt alle Tages-Einträge gruppiert nach Mahlzeit-Slot.
 *
 * @param {{
 *   entries: TrackedFood[],
 *   mealSlots: string[],
 *   onDelete: function,
 *   onEdit: function,
 *   onAdd: function
 * }} props
 */
export function DayLogList({ entries, mealSlots, onDelete, onEdit, onAdd }) {
  // Einträge nach mealSlot gruppieren
  const grouped = {};
  for (const slot of mealSlots) {
    grouped[slot] = [];
  }
  for (const entry of entries) {
    if (!grouped[entry.mealSlot]) grouped[entry.mealSlot] = [];
    grouped[entry.mealSlot].push(entry);
  }

  if (entries.length === 0) {
    return html`
      <div style=${{ ...S.card, textAlign: 'center', padding: '24px' }}>
        <div style=${{ fontSize: '28px', marginBottom: '8px' }}>🍽</div>
        <div style=${{ fontSize: '13px', color: COLORS.textMuted }}>
          Noch nichts eingetragen
        </div>
        <button
          onClick=${onAdd}
          style=${{ ...S.btn(), marginTop: '14px', width: '100%' }}
        >
          + Erste Mahlzeit eintragen
        </button>
      </div>
    `;
  }

  return html`
    <div>
      ${mealSlots.map(slot => {
        const slotEntries = grouped[slot] || [];
        if (slotEntries.length === 0) return null;

        return html`
          <div key=${slot} style=${{ marginBottom: '12px' }}>
            <div style=${{
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.gold,
              fontFamily: FONTS.mono,
              fontWeight: 600,
              marginBottom: '6px',
              paddingLeft: '2px',
            }}>
              ${slot}
            </div>
            ${slotEntries.map(entry => html`
              <${DayLogEntry}
                key=${entry.id}
                entry=${entry}
                onDelete=${onDelete}
                onEdit=${onEdit}
              />
            `)}
          </div>
        `;
      })}
    </div>
  `;
}
```

- [ ] **Step 4.3: Tests laufen lassen**

```bash
npm test
```

Erwartete Ausgabe: `93 passed`.

- [ ] **Step 4.4: Commit**

```bash
git add js/tabs/tracker/DayLogEntry.js js/tabs/tracker/DayLogList.js
git commit -m "feat: add DayLogEntry and DayLogList components"
```

---

## Task 5: FavoritePicker + FoodEntryModal

**Files:**
- Create: `js/tabs/tracker/FavoritePicker.js`
- Create: `js/tabs/tracker/FoodEntryModal.js`

### Schritt 5.1: FavoritePicker.js

Chips zum Schnellauswählen gespeicherter Favoriten.

```javascript
import { html } from '../../lib.js';
import { COLORS, FONTS } from '../../ui/theme.js';

/**
 * Chip-Liste gespeicherter Favoriten.
 * Klick auf Chip → onSelect(favorite) aufrufen.
 *
 * @param {{ favorites: FavoriteFood[], onSelect: function }} props
 */
export function FavoritePicker({ favorites, onSelect }) {
  if (favorites.length === 0) {
    return html`
      <div style=${{
        fontSize: '11px',
        color: COLORS.textMuted,
        fontFamily: FONTS.mono,
        padding: '6px 0',
      }}>
        Noch keine Favoriten gespeichert
      </div>
    `;
  }

  return html`
    <div style=${{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
      ${favorites.map(fav => html`
        <button
          key=${fav.id}
          onClick=${() => onSelect(fav)}
          style=${{
            background: '#1e1e1e',
            border: '1px solid #333',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '12px',
            color: COLORS.text,
            cursor: 'pointer',
            fontFamily: FONTS.mono,
            whiteSpace: 'nowrap',
          }}
        >
          ${fav.name}
        </button>
      `)}
    </div>
  `;
}
```

### Schritt 5.2: FoodEntryModal.js

Modal für manuelle Eingabe oder Favoriten-Auswahl.

```javascript
import { html, useState, useMemo } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { Modal } from '../../ui/Modal.js';
import { FavoritePicker } from './FavoritePicker.js';
import { calcTrackedFoodMacros } from '../../calc/tracker.js';

/** Generiert eine einfache, eindeutige ID */
function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const MEAL_SLOTS = [
  'Frühstück', 'Pre-Workout', 'Post-Workout',
  'Mittagessen', 'Nachmittagssnack', 'Abendessen', 'Snack',
];

/**
 * Modal für Mahlzeit-Eingabe (manuell oder aus Favoriten).
 *
 * @param {{
 *   open: boolean,
 *   onClose: function,
 *   onSave: function,           // (trackedFood, saveFavorite?) => void
 *   favorites: FavoriteFood[],
 *   initialEntry?: TrackedFood, // wenn gesetzt: Edit-Modus
 *   defaultSlot?: string
 * }} props
 */
export function FoodEntryModal({ open, onClose, onSave, favorites, initialEntry, defaultSlot }) {
  const isEdit = !!initialEntry;

  const [slot, setSlot] = useState(initialEntry?.mealSlot ?? defaultSlot ?? 'Frühstück');
  const [name, setName] = useState(initialEntry?.foodName ?? '');
  const [gramm, setGramm] = useState(String(initialEntry?.gramm ?? ''));
  const [kcal100, setKcal100] = useState('');
  const [p100, setP100] = useState('');
  const [c100, setC100] = useState('');
  const [f100, setF100] = useState('');
  const [saveFav, setSaveFav] = useState(false);

  // Beim Öffnen im Edit-Modus: Per-100g-Werte zurückrechnen (Näherung)
  // Beim Öffnen neu: Felder leeren (falls Modal wiederholt geöffnet wird)
  // → Reset wenn open sich ändert und kein initialEntry
  const handleFavSelect = (fav) => {
    setName(fav.name);
    setKcal100(String(fav.kcal100));
    setP100(String(fav.p100));
    setC100(String(fav.c100));
    setF100(String(fav.f100));
    setSaveFav(false);
  };

  // Live-Vorschau der Makros
  const preview = useMemo(() => {
    const g = parseFloat(gramm);
    const k = parseFloat(kcal100);
    const p = parseFloat(p100);
    const c = parseFloat(c100);
    const f = parseFloat(f100);
    if (!g || !k || isNaN(g) || isNaN(k)) return null;
    return calcTrackedFoodMacros(
      { kcal100: k, p100: p || 0, c100: c || 0, f100: f || 0 },
      g,
    );
  }, [gramm, kcal100, p100, c100, f100]);

  const canSave = name.trim() && parseFloat(gramm) > 0 && parseFloat(kcal100) >= 0 && preview;

  function handleSave() {
    if (!canSave) return;

    const entry = {
      id: initialEntry?.id ?? generateId(),
      mealSlot: slot,
      foodName: name.trim(),
      foodRef: 'manual',
      gramm: parseFloat(gramm),
      kcal: preview.kcal,
      p: preview.p,
      c: preview.c,
      f: preview.f,
      timestamp: initialEntry?.timestamp ?? Date.now(),
    };

    const favData = saveFav ? {
      id: generateId(),
      name: name.trim(),
      kcal100: parseFloat(kcal100),
      p100: parseFloat(p100) || 0,
      c100: parseFloat(c100) || 0,
      f100: parseFloat(f100) || 0,
      source: 'manual',
    } : null;

    onSave(entry, favData);
    onClose();
  }

  if (!open) return null;

  return html`
    <${Modal} onClose=${onClose}>
      <div style=${{ padding: '4px 0' }}>
        <!-- Titel -->
        <div style=${{ ...S.cardTitle, fontSize: '12px', marginBottom: '14px' }}>
          ${isEdit ? 'Eintrag bearbeiten' : 'Mahlzeit eintragen'}
        </div>

        <!-- Mahlzeit-Slot -->
        <label style=${S.label}>Mahlzeit</label>
        <select
          value=${slot}
          onChange=${e => setSlot(e.target.value)}
          style=${{ ...S.input, marginBottom: '14px' }}
        >
          ${MEAL_SLOTS.map(s => html`<option key=${s} value=${s}>${s}</option>`)}
        </select>

        <!-- Favoriten-Picker -->
        ${!isEdit && html`
          <label style=${{ ...S.label, marginBottom: '6px' }}>Aus Favoriten</label>
          <${FavoritePicker} favorites=${favorites} onSelect=${handleFavSelect} />
          <div style=${{
            textAlign: 'center',
            fontSize: '10px',
            color: COLORS.textMuted,
            fontFamily: FONTS.mono,
            margin: '10px 0 12px',
            letterSpacing: '0.08em',
          }}>— oder manuell eingeben —</div>
        `}

        <!-- Name -->
        <label style=${S.label}>Name</label>
        <input
          type="text"
          value=${name}
          placeholder="z.B. Magerquark"
          onInput=${e => setName(e.target.value)}
          style=${{ ...S.input, marginBottom: '10px' }}
        />

        <!-- Gramm -->
        <label style=${S.label}>Menge (g)</label>
        <input
          type="number"
          value=${gramm}
          placeholder="z.B. 200"
          min="1"
          onInput=${e => setGramm(e.target.value)}
          style=${{ ...S.input, marginBottom: '10px' }}
        />

        <!-- Makros pro 100g -->
        <label style=${{ ...S.label, marginBottom: '6px' }}>Makros pro 100g</label>
        <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          ${[
            ['kcal/100g', kcal100, setKcal100],
            ['P/100g',    p100,    setP100],
            ['KH/100g',   c100,    setC100],
            ['F/100g',    f100,    setF100],
          ].map(([lbl, val, set]) => html`
            <div key=${lbl}>
              <label style=${{ ...S.label, fontSize: '10px' }}>${lbl}</label>
              <input
                type="number"
                value=${val}
                min="0"
                step="0.1"
                onInput=${e => set(e.target.value)}
                style=${S.input}
              />
            </div>
          `)}
        </div>

        <!-- Vorschau -->
        ${preview && html`
          <div style=${{
            background: '#1a1a12',
            border: `1px solid ${COLORS.gold}33`,
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '14px',
            fontFamily: FONTS.mono,
            fontSize: '12px',
            color: COLORS.text,
          }}>
            ${preview.kcal} kcal · ${preview.p}g P · ${preview.c}g KH · ${preview.f}g F
          </div>
        `}

        <!-- Als Favorit speichern -->
        ${!isEdit && html`
          <label style=${{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            cursor: 'pointer',
            fontSize: '12px',
            color: COLORS.textMuted,
            fontFamily: FONTS.mono,
          }}>
            <input
              type="checkbox"
              checked=${saveFav}
              onChange=${e => setSaveFav(e.target.checked)}
              style=${{ accentColor: COLORS.gold }}
            />
            Als Favorit speichern
          </label>
        `}

        <!-- Buttons -->
        <div style=${{ display: 'flex', gap: '8px' }}>
          <button
            onClick=${onClose}
            style=${{ ...S.btn('#222', COLORS.text), flex: 1 }}
          >
            Abbrechen
          </button>
          <button
            onClick=${handleSave}
            disabled=${!canSave}
            style=${{
              ...S.btn(canSave ? COLORS.gold : '#333', canSave ? '#111' : '#666'),
              flex: 1,
            }}
          >
            ${isEdit ? 'Speichern' : 'Eintragen'}
          </button>
        </div>
      </div>
    </${Modal}>
  `;
}
```

- [ ] **Step 5.3: Tests laufen lassen**

```bash
npm test
```

Erwartete Ausgabe: `93 passed`.

- [ ] **Step 5.4: Commit**

```bash
git add js/tabs/tracker/FavoritePicker.js js/tabs/tracker/FoodEntryModal.js
git commit -m "feat: add FavoritePicker and FoodEntryModal components"
```

---

## Task 6: TrackerTab + app.js + Service Worker

**Files:**
- Modify: `js/tabs/tracker/TrackerTab.js` (Platzhalter → vollständig)
- Modify: `js/app.js` (Props an TrackerTab übergeben)
- Modify: `service-worker.js` (Version + LOCAL_ASSETS)

### Schritt 6.1: TrackerTab.js komplett ersetzen

```javascript
import { html, useState, useMemo } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { useLog } from '../../hooks/useLog.js';
import { useFavoriteFoods } from '../../hooks/useFavoriteFoods.js';
import { getMealTemplate } from '../../data/mealTemplates.js';
import { DayLogList } from './DayLogList.js';
import { FoodEntryModal } from './FoodEntryModal.js';

/**
 * Tracker-Tab — Tages-Mahlzeiten manuell erfassen.
 *
 * @param {{
 *   dayType: 'training'|'rest',
 *   trainingTime: string,
 * }} props
 */
export function TrackerTab({ dayType, trainingTime }) {
  const today = new Date().toISOString().slice(0, 10);
  const dayMeta = { dayType, trainingTime };

  const { entries, loading, addEntry, removeEntry, updateEntry } = useLog(today, dayMeta);
  const { favorites, addFavorite } = useFavoriteFoods();

  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [defaultSlot, setDefaultSlot] = useState('Frühstück');

  // Mahlzeit-Slots aus aktuellem Tagesplan
  const mealSlots = useMemo(() => {
    const meals = getMealTemplate(dayType, trainingTime);
    return meals.map(m => m.label);
  }, [dayType, trainingTime]);

  function openAddModal(slot) {
    setEditEntry(null);
    setDefaultSlot(slot || mealSlots[0] || 'Frühstück');
    setModalOpen(true);
  }

  function openEditModal(entry) {
    setEditEntry(entry);
    setModalOpen(true);
  }

  async function handleSave(trackedFood, favData) {
    if (editEntry) {
      await updateEntry(trackedFood.id, trackedFood);
    } else {
      await addEntry(trackedFood);
    }
    if (favData) {
      await addFavorite(favData);
    }
  }

  // Datum formatieren
  const dateLabel = new Date(today + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return html`
    <div style=${S.content}>
      <!-- Header -->
      <div style=${{ marginBottom: '14px' }}>
        <div style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>
          ${dateLabel}
        </div>
        <div style=${{
          fontSize: '12px',
          color: dayType === 'training' ? COLORS.gold : COLORS.textMuted,
          fontFamily: FONTS.mono,
          letterSpacing: '0.06em',
          marginTop: '2px',
        }}>
          ${dayType === 'training' ? `💪 Trainingstag · ${trainingTime}` : '🌿 Ruhetag'}
        </div>
      </div>

      <!-- Log-Liste -->
      ${loading
        ? html`<div style=${{ color: COLORS.textMuted, fontSize: '12px', textAlign: 'center', padding: '24px' }}>Lade…</div>`
        : html`
          <${DayLogList}
            entries=${entries}
            mealSlots=${mealSlots}
            onDelete=${removeEntry}
            onEdit=${openEditModal}
            onAdd=${() => openAddModal(null)}
          />
        `
      }

      <!-- Floating Add-Button -->
      ${!loading && entries.length > 0 && html`
        <button
          onClick=${() => openAddModal(null)}
          style=${{
            ...S.btn(),
            width: '100%',
            marginTop: '12px',
          }}
        >
          + Mahlzeit eintragen
        </button>
      `}

      <!-- Eingabe-Modal -->
      <${FoodEntryModal}
        open=${modalOpen}
        onClose=${() => setModalOpen(false)}
        onSave=${handleSave}
        favorites=${favorites}
        initialEntry=${editEntry}
        defaultSlot=${defaultSlot}
      />
    </div>
  `;
}
```

### Schritt 6.2: app.js — TrackerTab Props übergeben

In `js/app.js`, den case `'tracker'` in `renderTab()` ändern:

```javascript
case 'tracker': return html`
  <${TrackerTab}
    dayType=${uiState.preferredDayType}
    trainingTime=${uiState.preferredTrainingTime}
  />
`;
```

### Schritt 6.3: service-worker.js — Version + LOCAL_ASSETS

**A) APP_VERSION Zeile 4:**
```javascript
const APP_VERSION = '1.2.0';
```

**B) LOCAL_ASSETS:** Folgende Einträge nach `'./js/calc/hydration.js'` hinzufügen:

```javascript
  './js/calc/tracker.js',
  './js/hooks/useLog.js',
  './js/hooks/useFavoriteFoods.js',
  './js/tabs/tracker/TrackerTab.js',
  './js/tabs/tracker/DayLogList.js',
  './js/tabs/tracker/DayLogEntry.js',
  './js/tabs/tracker/FoodEntryModal.js',
  './js/tabs/tracker/FavoritePicker.js',
```

- [ ] **Step 6.4: Versions-Konsistenz prüfen**

```bash
grep "APP_VERSION\|1.2.0" service-worker.js js/version.js
```

Erwartete Ausgabe: beide Dateien zeigen `1.2.0`.

- [ ] **Step 6.5: Tests nochmals ausführen (alle 93 müssen grün sein)**

```bash
npm test
```

- [ ] **Step 6.6: Commit + Push**

```bash
git add js/tabs/tracker/TrackerTab.js js/app.js service-worker.js
git commit -m "feat(tracker): TrackerTab vollständig — manuelle Eingabe + Favoriten + Tagesliste"
git push
```

---

## Spec-Coverage-Check

| Anforderung (Phase 3A) | Task | Abgedeckt |
|---|---|---|
| IndexedDB log-CRUD prüfen/erweitern | Task 1 + Task 3 | ✅ |
| TrackedFood-Schema definieren | Task 1 | ✅ |
| Manuelle Eingabe bauen | Task 5 + 6 | ✅ |
| Tagesliste anzeigen | Task 4 + 6 | ✅ |
| Löschen / Editieren | Task 4 + 3 | ✅ |
| Minimale Favoriten (FavoriteFood) | Task 1 + 5 | ✅ |
| Schema-Version 2 (foodsCustom + meals) | Task 1 | ✅ |
| Service Worker + Version 1.2.0 | Task 6 | ✅ |
| calcTrackedFoodMacros getestet | Task 2 | ✅ (6 Tests) |
| `npm test` bleibt grün | alle | ✅ (93 Tests) |

**Bewusst nicht in Phase 3A:**
- Open Food Facts / Barcode → Phase 3E
- Tagesbilanz (Ist vs. Plan) → Phase 3B
- MPS / Leucin-Felder → Phase 3C
- Hydration-Karte im Heute-Tab → Phase 3D

---

*Plan erstellt: 2026-06-01 · Branch: phase-3-tracker · APP_VERSION Ziel: 1.2.0 · SCHEMA_VERSION Ziel: 2*
