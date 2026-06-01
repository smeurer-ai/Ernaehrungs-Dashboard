# Phase 3B — Tagesbilanz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den Heute-Tab mit echten Ist-Werten füllen: DaySummary zeigt Gesamt-Istwerte gegen den Tagesplan, jeder MealPlanEntry zeigt das tatsächlich eingetragene Protein für den jeweiligen Slot.

**Architecture:** Zwei neue pure Funktionen in `tracker.js` (testbar via Vitest) aggregieren Log-Einträge zu Gesamt-Istwerten und Slot-Protein. `HeuteTab` verbindet `useLog` mit diesen Funktionen und leitet die Ergebnisse an `DaySummary` und `MealPlanList` weiter. `MealPlanEntry` zeigt eine neue Protein-Zeile mit dezenter Farbkodierung.

**Tech Stack:** React 18 + htm (kein JSX, kein Build), Vitest, IndexedDB via `useLog`

---

## File Map

| Datei | Aktion | Was ändert sich |
|---|---|---|
| `js/calc/tracker.js` | Modify | `sumConsumed` + `groupProteinBySlot` hinzufügen |
| `tests/unit/calc/tracker.test.js` | Modify | Tests für beide neue Funktionen |
| `js/tabs/heute/HeuteTab.js` | Modify | `useLog` einbinden, `consumed` + `consumedBySlot` ableiten, weitergeben |
| `js/tabs/heute/MealPlanList.js` | Modify | `consumedBySlot` Prop + `consumedProtein` Berechnung |
| `js/tabs/heute/MealPlanEntry.js` | Modify | Protein-Zeile mit Farbkodierung |
| `js/version.js` | Modify | `1.2.1` → `1.2.2` |
| `service-worker.js` | Modify | `1.2.1` → `1.2.2` (keine neuen Assets) |

---

## Task 1: `sumConsumed` — Tests zuerst

**Files:**
- Modify: `tests/unit/calc/tracker.test.js`
- Modify: `js/calc/tracker.js`

- [ ] **Schritt 1: Failing Tests für `sumConsumed` schreiben**

Ans Ende von `tests/unit/calc/tracker.test.js` anhängen:

```js
import { describe, it, expect } from 'vitest';
import { calcTrackedFoodMacros, sumConsumed } from '../../../js/calc/tracker.js';
// ... bestehende Tests ...

describe('sumConsumed', () => {
  it('gibt Nullen zurück bei leerer Liste', () => {
    expect(sumConsumed([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('summiert kcal, p→protein, c→carbs, f→fat korrekt', () => {
    const entries = [
      { kcal: 144, p: 24,   c: 8,    f: 0.4 },
      { kcal: 296, p: 10.4, c: 47.2, f: 5.6 },
    ];
    expect(sumConsumed(entries)).toEqual({
      kcal: 440, protein: 34.4, carbs: 55.2, fat: 6.0,
    });
  });

  it('behandelt fehlende Felder (p/c/f/kcal) ohne Absturz', () => {
    expect(sumConsumed([{ kcal: 100 }])).toEqual({
      kcal: 100, protein: 0, carbs: 0, fat: 0,
    });
  });

  it('behandelt vollständig leere Objekte', () => {
    expect(sumConsumed([{}])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
});
```

- [ ] **Schritt 2: Tests laufen lassen — müssen fehlschlagen**

```
npm test
```

Erwartetes Ergebnis: `sumConsumed is not a function` oder ähnlich.

- [ ] **Schritt 3: `sumConsumed` in `js/calc/tracker.js` implementieren**

Nach der bestehenden `calcTrackedFoodMacros`-Funktion einfügen:

```js
/**
 * Aggregiert TrackedFood-Einträge zu Tages-Istwerten.
 * Übersetzt p/c/f → protein/carbs/fat für DaySummary-Kompatibilität.
 * Liefert rohe Summen ohne Rundung.
 *
 * @param {Array<{kcal?: number, p?: number, c?: number, f?: number}>} entries
 * @returns {{ kcal: number, protein: number, carbs: number, fat: number }}
 */
export function sumConsumed(entries) {
  return entries.reduce((acc, e) => ({
    kcal:    acc.kcal    + (e.kcal ?? 0),
    protein: acc.protein + (e.p    ?? 0),
    carbs:   acc.carbs   + (e.c    ?? 0),
    fat:     acc.fat     + (e.f    ?? 0),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}
```

- [ ] **Schritt 4: Tests laufen lassen — müssen grün sein**

```
npm test
```

Erwartetes Ergebnis: Alle bisherigen Tests + 4 neue `sumConsumed`-Tests grün.

- [ ] **Schritt 5: Commit**

```
git add js/calc/tracker.js tests/unit/calc/tracker.test.js
git commit -m "feat(calc): sumConsumed — Tages-Istwerte aus TrackedFood-Einträgen aggregieren"
```

---

## Task 2: `groupProteinBySlot` — Tests zuerst

**Files:**
- Modify: `tests/unit/calc/tracker.test.js`
- Modify: `js/calc/tracker.js`

- [ ] **Schritt 1: Failing Tests für `groupProteinBySlot` schreiben**

Import in `tracker.test.js` erweitern:

```js
import { calcTrackedFoodMacros, sumConsumed, groupProteinBySlot } from '../../../js/calc/tracker.js';
```

Ans Ende anhängen:

```js
describe('groupProteinBySlot', () => {
  it('gibt leeres Objekt bei leerer Liste zurück', () => {
    expect(groupProteinBySlot([])).toEqual({});
  });

  it('summiert Protein korrekt nach Slot', () => {
    const entries = [
      { mealSlot: 'Frühstück',  p: 24   },
      { mealSlot: 'Frühstück',  p: 10   },
      { mealSlot: 'Mittagessen', p: 30  },
    ];
    expect(groupProteinBySlot(entries)).toEqual({
      'Frühstück':   34,
      'Mittagessen': 30,
    });
  });

  it('ordnet Einträge ohne mealSlot unter "Sonstiges" ein', () => {
    const entries = [
      { p: 15 },
      { mealSlot: undefined, p: 10 },
    ];
    expect(groupProteinBySlot(entries)).toEqual({ 'Sonstiges': 25 });
  });

  it('behandelt fehlende p-Felder ohne Absturz', () => {
    expect(groupProteinBySlot([{ mealSlot: 'Frühstück' }])).toEqual({ 'Frühstück': 0 });
  });

  it('mehrere Slots in einem Durchlauf', () => {
    const entries = [
      { mealSlot: 'Pre-Workout', p: 20 },
      { mealSlot: 'Pre-Workout', p: 5  },
      { mealSlot: 'Abendessen',  p: 35 },
      { p: 8 },
    ];
    expect(groupProteinBySlot(entries)).toEqual({
      'Pre-Workout': 25,
      'Abendessen':  35,
      'Sonstiges':   8,
    });
  });
});
```

- [ ] **Schritt 2: Tests laufen lassen — müssen fehlschlagen**

```
npm test
```

Erwartetes Ergebnis: `groupProteinBySlot is not a function`.

- [ ] **Schritt 3: `groupProteinBySlot` in `js/calc/tracker.js` implementieren**

Nach `sumConsumed` einfügen:

```js
/**
 * Gibt Protein-Summe je Mahlzeit-Slot zurück.
 * Lookup-Key entspricht meal.label in MealPlanEntry (z.B. "Frühstück").
 * Einträge ohne mealSlot landen unter "Sonstiges".
 *
 * @param {Array<{mealSlot?: string, p?: number}>} entries
 * @returns {Record<string, number>}
 */
export function groupProteinBySlot(entries) {
  return entries.reduce((acc, e) => {
    const slot = e.mealSlot || 'Sonstiges';
    return { ...acc, [slot]: (acc[slot] ?? 0) + (e.p ?? 0) };
  }, {});
}
```

- [ ] **Schritt 4: Tests laufen lassen — müssen grün sein**

```
npm test
```

Erwartetes Ergebnis: Alle Tests grün (93 + 9 neue = 102).

- [ ] **Schritt 5: Commit**

```
git add js/calc/tracker.js tests/unit/calc/tracker.test.js
git commit -m "feat(calc): groupProteinBySlot — Protein je Mahlzeit-Slot aggregieren"
```

---

## Task 3: `HeuteTab.js` — useLog einbinden

**Files:**
- Modify: `js/tabs/heute/HeuteTab.js`

- [ ] **Schritt 1: Imports erweitern**

Bestehende Imports:
```js
import { html } from '../../lib.js';
import { DayTypeSwitch } from './DayTypeSwitch.js';
import { DaySummary } from './DaySummary.js';
import { MealPlanList } from './MealPlanList.js';
import { HydrationCard } from './HydrationCard.js';
import { useUiState } from '../../hooks/useUiState.js';
import { S, COLORS } from '../../ui/theme.js';
```

Ersetzen durch:
```js
import { html } from '../../lib.js';
import { DayTypeSwitch } from './DayTypeSwitch.js';
import { DaySummary } from './DaySummary.js';
import { MealPlanList } from './MealPlanList.js';
import { HydrationCard } from './HydrationCard.js';
import { useUiState } from '../../hooks/useUiState.js';
import { useLog } from '../../hooks/useLog.js';
import { sumConsumed, groupProteinBySlot } from '../../calc/tracker.js';
import { S, COLORS } from '../../ui/theme.js';
```

- [ ] **Schritt 2: `useLog`-Ableitungen und Props gezielt einbauen**

**a) Ableitungen einfügen** — direkt nach `const { preferredDayType: dayType, preferredTrainingTime: trainingTime } = uiState;`:

```js
  const today = new Date().toISOString().split('T')[0];
  const { entries, loading } = useLog(today, { dayType, trainingTime });
  const consumed = loading
    ? { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    : sumConsumed(entries);
  const consumedBySlot = loading ? undefined : groupProteinBySlot(entries);
```

`loading ? undefined` für `consumedBySlot` verhindert Flackern: Protein-Zeilen erscheinen erst wenn IndexedDB fertig geladen ist.

**b) `DaySummary`-Zeile anpassen** (bestehende Zeile ersetzen):

```js
      <${DaySummary} macros=${macros} consumed=${consumed} />
```

**c) `MealPlanList`-Aufruf anpassen** (bestehende Zeile ersetzen):

```js
      <${MealPlanList}
        dayType=${dayType}
        trainingTime=${trainingTime}
        macros=${macros}
        consumedBySlot=${consumedBySlot}
      />
```

Alle anderen Teile der Datei (`DayTypeSwitch`, `HydrationCard`, Early-Return) bleiben unverändert.

- [ ] **Schritt 3: App manuell prüfen**

`ernaehrung.html` im Browser öffnen → Heute-Tab: KcalRing und MacroBars sollten sich mit echten Werten füllen sobald Einträge im Tracker vorhanden sind. Bei leerm Log: alle Werte 0.

- [ ] **Schritt 4: Commit**

```
git add js/tabs/heute/HeuteTab.js
git commit -m "feat(heute): HeuteTab — useLog einbinden, consumed + consumedBySlot ableiten"
```

---

## Task 4: `MealPlanList.js` — consumedBySlot weiterreichen

**Files:**
- Modify: `js/tabs/heute/MealPlanList.js`

- [ ] **Schritt 1: MealPlanList komplett ersetzen**

```js
import { html } from '../../lib.js';
import { MealPlanEntry } from './MealPlanEntry.js';
import { getMealTemplate } from '../../data/mealTemplates.js';
import { distributeMacrosPerMeal } from '../../calc/macros.js';

export function MealPlanList({ dayType, trainingTime, macros, consumedBySlot }) {
  const template = getMealTemplate(dayType, trainingTime);
  const meals = distributeMacrosPerMeal(template, macros);

  return html`
    <div>
      ${meals.map((meal, i) => {
        const consumedProtein = consumedBySlot
          ? (consumedBySlot[meal.label] ?? 0)
          : undefined;
        return html`<${MealPlanEntry} key=${i} meal=${meal} consumedProtein=${consumedProtein} />`;
      })}
    </div>
  `;
}
```

**Wichtig:** `consumedBySlot` vorhanden → `consumedProtein` ist immer eine Zahl (0 wenn Slot leer). `consumedBySlot` fehlt (`undefined`) → `consumedProtein` ist `undefined` → keine Protein-Zeile in `MealPlanEntry`.

- [ ] **Schritt 2: Im Browser prüfen**

Heute-Tab → Mahlzeitenkärtchen sollten noch keine Protein-Zeile zeigen (erst nach Task 5).

- [ ] **Schritt 3: Commit**

```
git add js/tabs/heute/MealPlanList.js
git commit -m "feat(heute): MealPlanList — consumedBySlot Prop + consumedProtein je Slot berechnen"
```

---

## Task 5: `MealPlanEntry.js` — Protein-Zeile mit Farbkodierung

**Files:**
- Modify: `js/tabs/heute/MealPlanEntry.js`

- [ ] **Schritt 1: Hilfsfunktion + Protein-Zeile einfügen**

`MealPlanEntry.js` komplett ersetzen:

```js
import { html } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';

function proteinLineColor(consumed, planned) {
  if (consumed === 0) return COLORS.textSubtle;
  const ratio = consumed / planned;
  if (ratio > 1.1)  return COLORS.gold;      // über Plan
  if (ratio >= 0.9) return '#5cb85c';         // erreicht
  return COLORS.textMuted;                    // im Gange
}

export function MealPlanEntry({ meal, consumedProtein }) {
  return html`
    <div style=${S.mealCard}>
      <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style=${{ fontSize: '18px' }}>${meal.icon}</span>
          <div>
            <div style=${{ fontSize: '13px', fontWeight: 600, color: COLORS.text }}>${meal.label}</div>
            <div style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>${meal.time}</div>
          </div>
        </div>
        <div style=${{ textAlign: 'right' }}>
          <div style=${{ fontSize: '14px', fontWeight: 700, color: COLORS.gold, fontFamily: FONTS.display }}>${meal.kcal}</div>
          <div style=${{ fontSize: '9px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>kcal</div>
        </div>
      </div>
      <div style=${{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
        ${[
          { label: 'P', value: meal.protein, color: '#7eb8f7' },
          { label: 'KH', value: meal.carbs,   color: '#f7c47e' },
          { label: 'F',  value: meal.fat,     color: '#f77eb8' },
        ].map(macro => html`
          <div key=${macro.label} style=${S.chip(macro.color)}>
            ${macro.label} ${macro.value}g
          </div>
        `)}
      </div>
      ${meal.note && html`
        <div style=${{ fontSize: '10px', color: COLORS.textSubtle, fontFamily: FONTS.mono, borderTop: '1px solid #1e1e1e', paddingTop: '6px', marginTop: '4px' }}>
          ${meal.note}
        </div>
      `}
      ${consumedProtein !== undefined && html`
        <div style=${{
          fontSize: '11px',
          fontFamily: FONTS.mono,
          marginTop: '6px',
          borderTop: '1px solid #1e1e1e',
          paddingTop: '6px',
          color: proteinLineColor(consumedProtein, meal.protein),
        }}>
          ${consumedProtein === 0
            ? 'Protein: Noch nicht erfasst'
            : `Protein: ${Math.round(consumedProtein)} g / ${meal.protein} g`
          }
        </div>
      `}
    </div>
  `;
}
```

**Farbkodierung:**
| Zustand | Bedingung | Farbe |
|---|---|---|
| Noch nicht erfasst | `consumedProtein === 0` | `COLORS.textSubtle` (#999) |
| Im Gange | `> 0` und `< 90%` von Plan | `COLORS.textMuted` (#aaa) |
| Erreicht | `≥ 90%` bis `≤ 110%` | `#5cb85c` (grün) |
| Über Plan | `> 110%` | `COLORS.gold` (#c8a96e) |

- [ ] **Schritt 2: Im Browser prüfen**

Heute-Tab → jedes Mahlzeit-Kärtchen zeigt eine Protein-Zeile:
- Ohne Tracker-Einträge für heute: „Protein: Noch nicht erfasst" (gedimmt)
- Mit Einträgen: Zahl + Farbkodierung

Eintrag im Tracker-Tab hinzufügen → zurück zum Heute-Tab → Protein-Zeile aktualisiert sich.

- [ ] **Schritt 3: Commit**

```
git add js/tabs/heute/MealPlanEntry.js
git commit -m "feat(heute): MealPlanEntry — Protein-Zeile mit Ist/Plan und Farbkodierung"
```

---

## Task 6: APP_VERSION bumpen

**Files:**
- Modify: `js/version.js`
- Modify: `service-worker.js`

- [ ] **Schritt 1: `js/version.js` aktualisieren**

```js
export const APP_VERSION = '1.2.2';
export const SCHEMA_VERSION = 2; // Phase 3A: foodsCustom + meals
```

- [ ] **Schritt 2: `service-worker.js` aktualisieren**

Erste Zeile:
```js
const APP_VERSION = '1.2.2';
```

Keine neuen Dateien → `LOCAL_ASSETS` bleibt unverändert.

- [ ] **Schritt 3: Alle Tests laufen lassen**

```
npm test
```

Erwartetes Ergebnis: 102 Tests grün (93 bestehend + 9 neue).

- [ ] **Schritt 4: Commit + Push**

```
git add js/version.js service-worker.js
git commit -m "chore: APP_VERSION 1.2.2 — Phase 3B Tagesbilanz abgeschlossen"
git push
```

---

## Task 7: Dokumentation aktualisieren

**Files:**
- Modify: `docs/uebergabedokument-aktuell.md`

- [ ] **Schritt 1: Übergabedokument aktualisieren**

Änderungen:
1. Phase 3B Status → `✅`
2. `APP_VERSION` → `1.2.2`
3. „Was die App aktuell kann" → Tagesbilanz-Eintrag hinzufügen
4. Nächste Schritte: Phase 3B als erledigt, Phase 3C als nächstes
5. Footer-Zeile: aktueller Commit-Hash

- [ ] **Schritt 2: Commit + Push**

```
git add docs/uebergabedokument-aktuell.md
git commit -m "docs: Übergabedokument — Phase 3B abgeschlossen, APP_VERSION 1.2.2"
git push
```
