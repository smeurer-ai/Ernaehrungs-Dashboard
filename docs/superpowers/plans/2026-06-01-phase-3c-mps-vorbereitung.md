# Phase 3C — MPS-Vorbereitung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `rateMealProtein()` durch echte Leucin-Schätzlogik ersetzen und pro Mahlzeit-Slot im Tracker-Tab ein MPS-Badge anzeigen.

**Architecture:** Zwei reine Funktionen in `js/calc/nutritionLogic.js` (`isMainMealSlot` neu, `rateMealProtein` Stub → Echtlogik). UI-Badge als eigenständige React-Komponente `LeucineBadge` direkt in `DayLogList.js`. Alle Werte werden dynamisch berechnet — kein Persistieren, kein SCHEMA_VERSION-Bump.

**Tech Stack:** React 18 + htm (kein JSX, kein Build), Vitest für Unit-Tests, IndexedDB bleibt unverändert.

---

## Dateien-Übersicht

| Datei | Änderung |
|---|---|
| `tests/unit/calc/nutritionLogic.test.js` | 9 Stub-Tests ersetzen + 13 neue Tests hinzufügen (5 × `isMainMealSlot`, 8 × `rateMealProtein`) |
| `js/calc/nutritionLogic.js` | `isMainMealSlot()` neu, `rateMealProtein()` Stub → echte Logik |
| `js/tabs/tracker/DayLogList.js` | `LeucineBadge`-Komponente + Integration in Slot-Header |
| `js/storage/indexeddb.js` | `TrackedFood`-JSDoc um optionale Felder erweitern |
| `js/version.js` | `APP_VERSION` 1.2.2 → 1.2.3 |
| `service-worker.js` | `APP_VERSION` synchron anpassen |

---

## Task 1: Tests vorbereiten (TDD — erst rot, dann grün)

**Files:**
- Modify: `tests/unit/calc/nutritionLogic.test.js`

Ziel: Die 9 alten Stub-Tests von `rateMealProtein` werden entfernt und durch 13 neue Tests ersetzt, die die echte Logik prüfen. Da `isMainMealSlot` und die neue `rateMealProtein`-Logik noch nicht existieren, laufen die Tests danach rot — das ist korrekt.

- [ ] **Schritt 1: Import-Zeile erweitern**

Die erste Zeile des Imports in `tests/unit/calc/nutritionLogic.test.js` um `isMainMealSlot` ergänzen:

```js
import {
  assessDeficit,
  rateMealProtein,
  assessDayStructure,
  isMainMealSlot,
} from '../../../js/calc/nutritionLogic.js';
```

- [ ] **Schritt 2: Alten `rateMealProtein`-describe-Block entfernen**

Den gesamten Block von Zeile 109 bis Zeile 150 (Kommentar + `describe('rateMealProtein', ...)`) löschen:

```
// ── rateMealProtein ───────────────────────────────────────────────────────────
// Stub Phase 1: rating basiert nur auf Gramm-Schwellen
// Phase 3 wird echte Leucin-Schätzung einbauen

describe('rateMealProtein', () => {
  ...  // alle 9 Tests
});
```

- [ ] **Schritt 3: Neuen `isMainMealSlot`-describe-Block einfügen**

Nach dem `assessDeficit`-Block (vor `assessDayStructure`) einfügen:

```js
// ── isMainMealSlot ────────────────────────────────────────────────────────────
// Klassifiziert Slots als Haupt- oder Snack-Mahlzeit.
// Unbekannte Slots → true (konservativ, strengere Schwelle).

describe('isMainMealSlot', () => {
  it('klassifiziert Frühstück als Hauptmahlzeit', () => {
    expect(isMainMealSlot('Frühstück')).toBe(true);
  });

  it('klassifiziert Post-Workout als Hauptmahlzeit', () => {
    expect(isMainMealSlot('Post-Workout')).toBe(true);
  });

  it('klassifiziert Snack als Snack-Mahlzeit', () => {
    expect(isMainMealSlot('Snack')).toBe(false);
  });

  it('klassifiziert Casein als Snack-Mahlzeit', () => {
    expect(isMainMealSlot('Casein')).toBe(false);
  });

  it('behandelt unbekannte Slots konservativ als Hauptmahlzeit', () => {
    expect(isMainMealSlot('UnbekannterSlot')).toBe(true);
  });
});
```

- [ ] **Schritt 4: Neuen `rateMealProtein`-describe-Block einfügen**

Direkt nach dem `isMainMealSlot`-Block einfügen:

```js
// ── rateMealProtein ───────────────────────────────────────────────────────────
// Schwellen (aus Studiendaten, 3g Leucin ≈ 30g hochwertiges Protein):
//   Hauptmahlzeit: ≥30g good, 20–29g borderline, <20g insufficient
//   Snack:         ≥15g good, 10–14g borderline, <10g insufficient
// hint ist undefined bei good, deutschsprachiger String mit "(Schätzung…)" sonst.

describe('rateMealProtein', () => {
  it('bewertet Hauptmahlzeit mit 35g als good/high ohne hint', () => {
    const r = rateMealProtein(35, true, {});
    expect(r.rating).toBe('good');
    expect(r.leucineLikelihood).toBe('high');
    expect(r.hint).toBeUndefined();
  });

  it('bewertet Hauptmahlzeit mit genau 30g als good (Grenzfall inklusiv)', () => {
    const r = rateMealProtein(30, true, {});
    expect(r.rating).toBe('good');
  });

  it('bewertet Hauptmahlzeit mit 25g als borderline/medium mit hint', () => {
    const r = rateMealProtein(25, true, {});
    expect(r.rating).toBe('borderline');
    expect(r.leucineLikelihood).toBe('medium');
    expect(r.hint).toContain('Schätzung');
  });

  it('bewertet Hauptmahlzeit mit 12g als insufficient/low mit hint', () => {
    const r = rateMealProtein(12, true, {});
    expect(r.rating).toBe('insufficient');
    expect(r.leucineLikelihood).toBe('low');
    expect(r.hint).toContain('Schätzung');
  });

  it('bewertet Snack mit 18g als good/high ohne hint', () => {
    const r = rateMealProtein(18, false, {});
    expect(r.rating).toBe('good');
    expect(r.leucineLikelihood).toBe('high');
    expect(r.hint).toBeUndefined();
  });

  it('bewertet Snack mit 12g als borderline/medium mit hint', () => {
    const r = rateMealProtein(12, false, {});
    expect(r.rating).toBe('borderline');
    expect(r.leucineLikelihood).toBe('medium');
    expect(r.hint).toContain('Schätzung');
  });

  it('bewertet Snack mit 5g als insufficient/low mit hint', () => {
    const r = rateMealProtein(5, false, {});
    expect(r.rating).toBe('insufficient');
    expect(r.leucineLikelihood).toBe('low');
    expect(r.hint).toContain('Schätzung');
  });

  it('gibt insufficient zurück bei null ohne Crash', () => {
    const r = rateMealProtein(null, true, {});
    expect(r.rating).toBe('insufficient');
    expect(r.leucineLikelihood).toBe('low');
  });
});
```

- [ ] **Schritt 5: Tests ausführen und Rot bestätigen**

```bash
npm test
```

Erwartetes Ergebnis: **Fehler** — `isMainMealSlot is not a function` sowie mehrere `rateMealProtein`-Failures (alte Schwellen stimmen nicht). Das ist korrekt so.

---

## Task 2: Calc-Logik implementieren

**Files:**
- Modify: `js/calc/nutritionLogic.js`

- [ ] **Schritt 1: `isMainMealSlot()` am Ende von `nutritionLogic.js` hinzufügen**

```js
/**
 * Klassifiziert einen Mahlzeit-Slot als Haupt- oder Snack-Mahlzeit.
 *
 * Hauptmahlzeiten (true):  alle Slots außer Snack und Casein.
 * Snack-Mahlzeiten (false): Snack, Casein.
 * Unbekannte Slots:         true (konservativ — strengere Leucin-Schwelle,
 *                           lieber eine unnötige Warnung als eine fehlende).
 *
 * @param {string} slotName
 * @returns {boolean}
 */
export function isMainMealSlot(slotName) {
  const SNACK_SLOTS = new Set(['Snack', 'Casein']);
  return !SNACK_SLOTS.has(slotName);
}
```

- [ ] **Schritt 2: `rateMealProtein()` Stub durch echte Logik ersetzen**

Den kompletten bisherigen `rateMealProtein()`-Block (inkl. JSDoc) ersetzen:

```js
/**
 * Bewertet die Protein-/Leucin-Wahrscheinlichkeit einer Einzelmahlzeit.
 *
 * Schwellen (aus Studiendaten: 3 g Leucin ≈ 30 g hochwertiges Protein):
 *   Hauptmahlzeit: ≥ 30 g → good,  20–29 g → borderline,  < 20 g → insufficient
 *   Snack:         ≥ 15 g → good,  10–14 g → borderline,  < 10 g → insufficient
 *
 * leucineLikelihood spiegelt das rating: high/medium/low.
 * hint ist undefined bei good; enthält bei borderline/insufficient einen
 * deutschsprachigen Hinweis mit dem Zusatz "(Schätzung aus Proteinmenge)".
 *
 * profile wird aktuell nicht ausgewertet — bleibt in der Signatur für
 * spätere Personalisierung (individuelle Schwellen, Phase 3E+).
 *
 * @param {number|null} mealProteinG - Protein in g (null/undefined/NaN → insufficient)
 * @param {boolean} isMainMeal       - true = Hauptmahlzeit, false = Snack
 * @param {Object}  profile          - Nutzerprofil (aktuell ungenutzt)
 * @returns {{ proteinG: number|null, leucineLikelihood: string, rating: string, hint: string|undefined }}
 */
export function rateMealProtein(mealProteinG, isMainMeal, profile) {
  const g = (mealProteinG == null || isNaN(mealProteinG)) ? 0 : mealProteinG;

  const thresholds = isMainMeal
    ? { good: 30, borderline: 20 }
    : { good: 15, borderline: 10 };

  let rating, leucineLikelihood, hint;

  if (g >= thresholds.good) {
    rating = 'good';
    leucineLikelihood = 'high';
    hint = undefined;
  } else if (g >= thresholds.borderline) {
    rating = 'borderline';
    leucineLikelihood = 'medium';
    const missing = Math.round(thresholds.good - g);
    hint = isMainMeal
      ? `Proteinmenge grenzwertig — noch ~${missing} g fehlen für die Leucin-Schwelle (Schätzung aus Proteinmenge)`
      : `Proteinmenge grenzwertig — noch ~${missing} g fehlen (Schätzung aus Proteinmenge)`;
  } else {
    rating = 'insufficient';
    leucineLikelihood = 'low';
    hint = isMainMeal
      ? `Zu wenig Protein für MPS-Auslösung — mind. ${thresholds.good} g anstreben (Schätzung aus Proteinmenge)`
      : `Zu wenig Protein — mind. ${thresholds.good} g für einen wirksamen Snack (Schätzung aus Proteinmenge)`;
  }

  return { proteinG: mealProteinG, leucineLikelihood, rating, hint };
}
```

- [ ] **Schritt 3: Tests ausführen und Grün bestätigen**

```bash
npm test
```

Erwartetes Ergebnis: **97 Tests, alle grün.**  
Falls Fehler: Schwellenwerte und Set-Schreibweise (`'Snack'`, `'Casein'`) prüfen.

- [ ] **Schritt 4: Committen**

```bash
git add js/calc/nutritionLogic.js tests/unit/calc/nutritionLogic.test.js
git commit -m "feat(calc): isMainMealSlot + echte rateMealProtein-Leucin-Schätzlogik (Phase 3C)"
```

---

## Task 3: MPS-Badge im Tracker-Tab

**Files:**
- Modify: `js/tabs/tracker/DayLogList.js`

- [ ] **Schritt 1: Import-Zeilen anpassen**

Den bestehenden Import am Dateianfang von:
```js
import { html } from '../../lib.js';
```
ersetzen durch:
```js
import { html, useState, Fragment } from '../../lib.js';
import { groupProteinBySlot } from '../../calc/tracker.js';
import { isMainMealSlot, rateMealProtein } from '../../calc/nutritionLogic.js';
```

- [ ] **Schritt 2: `LeucineBadge`-Komponente vor `DayLogList` einfügen**

Den folgenden Code direkt **vor** der `export function DayLogList(...)` einfügen:

```js
/**
 * Kleines MPS-Badge für den Slot-Header.
 * Zeigt Leucin-Wahrscheinlichkeit als farbiges Tag (~✓/~⚠/~✗ Leucin).
 * ℹ️-Button klappt einen Erklärungstext auf (Schätzungs-Hinweis).
 *
 * @param {{ slotProteinG: number, isMain: boolean }} props
 */
function LeucineBadge({ slotProteinG, isMain }) {
  const [showInfo, setShowInfo] = useState(false);
  const { rating } = rateMealProtein(slotProteinG, isMain, {});

  const COLOR = rating === 'good'       ? '#5cb85c'
              : rating === 'borderline' ? '#d97706'
              :                           '#e05c5c';
  const ICON  = rating === 'good' ? '✓' : rating === 'borderline' ? '⚠' : '✗';

  return html`
    <span style=${{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span style=${{
        fontSize: '9px', padding: '2px 7px', borderRadius: '12px',
        background: COLOR + '22', color: COLOR,
        fontFamily: "'DM Mono', monospace", fontWeight: 600,
      }}>
        ~${ICON} Leucin
      </span>
      <button
        onClick=${(e) => { e.stopPropagation(); setShowInfo(s => !s); }}
        style=${{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '12px', padding: 0, lineHeight: 1, color: '#aaa',
        }}
        aria-label="Info zur Leucin-Schätzung"
      >ℹ️</button>
      ${showInfo && html`
        <div
          onClick=${(e) => { e.stopPropagation(); setShowInfo(false); }}
          style=${{
            position: 'absolute', top: '100%', right: 0, zIndex: 20,
            marginTop: '4px', padding: '8px 10px',
            background: '#222', border: '1px solid #333', borderRadius: '8px',
            fontSize: '11px', color: '#aaa', lineHeight: 1.4,
            width: '260px', boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          Leucin-Gehalt wird aus der Proteinmenge geschätzt. Keine Lebensmitteldatenbank liefert aktuell Leucin-Werte.
        </div>
      `}
    </span>
  `;
}
```

- [ ] **Schritt 3: Slot-Totals berechnen und Header anpassen**

In `DayLogList()` direkt nach der `grouped`-Berechnung (nach Zeile 25) folgende Zeile einfügen:

```js
const slotTotals = groupProteinBySlot(entries);
```

Dann den aktuellen Slot-Header (die innere `<div>` mit `fontSize: '10px'`, `letterSpacing` etc.) ersetzen:

Aktuell:
```js
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
```

Ersetzen durch:
```js
<div style=${{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px',
  paddingLeft: '2px',
}}>
  <div style=${{
    fontSize: '10px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: COLORS.gold,
    fontFamily: FONTS.mono,
    fontWeight: 600,
  }}>
    ${slot}
  </div>
  <${LeucineBadge}
    slotProteinG=${slotTotals[slot] ?? 0}
    isMain=${isMainMealSlot(slot)}
  />
</div>
```

- [ ] **Schritt 4: Im Browser manuell testen**

App öffnen → Tracker-Tab → Datum mit eingetragenen Mahlzeiten wählen.

Prüfen:
- [ ] Leere Slots zeigen **kein** Badge
- [ ] Slot mit ≥ 30 g Protein: grünes `~✓ Leucin`-Badge
- [ ] Slot mit 20–29 g: oranges `~⚠ Leucin`-Badge
- [ ] Slot mit < 20 g: rotes `~✗ Leucin`-Badge
- [ ] Klick auf ℹ️ öffnet Schätzungs-Hinweis
- [ ] Klick auf Hinweis selbst schließt ihn wieder
- [ ] "Snack"- und "Casein"-Slots nutzen niedrigere Schwellen (≥ 15 g für grün)

- [ ] **Schritt 5: Committen**

```bash
git add js/tabs/tracker/DayLogList.js
git commit -m "feat(ui): MPS-Badge pro Mahlzeit-Slot im Tracker (Phase 3C)"
```

---

## Task 4: JSDoc + Versionierung

**Files:**
- Modify: `js/storage/indexeddb.js`
- Modify: `js/version.js`
- Modify: `service-worker.js`

- [ ] **Schritt 1: `TrackedFood`-JSDoc in `indexeddb.js` erweitern**

Den aktuellen `@typedef TrackedFood`-Block (ab Zeile 39) um drei optionale Felder erweitern. Das `@property {number} timestamp` bleibt die letzte Pflicht-Property, danach:

```js
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
 * @property {number}  [leucineEstimateG]    - Geschätzter Leucin-Gehalt in g (Phase 3E)
 * @property {number}  [proteinQualityScore] - Qualitätsscore 0–1 (Phase 3E)
 * @property {boolean} [mpsTriggered]        - Leucin-Schwelle wahrscheinlich erreicht (Phase 3E)
 */
```

**Hinweis:** Gespeicherte Einträge bleiben unverändert. Die neuen Felder werden erst in Phase 3E befüllt, wenn bessere Proteinqualitätsdaten verfügbar sind.

- [ ] **Schritt 2: APP_VERSION in `js/version.js` hochzählen**

```js
export const APP_VERSION = '1.2.3';
export const SCHEMA_VERSION = 2; // Phase 3A: foodsCustom + meals
```

- [ ] **Schritt 3: APP_VERSION in `service-worker.js` synchron anpassen**

Zeile 4 in `service-worker.js`:
```js
const APP_VERSION = '1.2.3';
```

- [ ] **Schritt 4: Tests ein letztes Mal ausführen**

```bash
npm test
```

Erwartetes Ergebnis: **97 Tests, alle grün.**

- [ ] **Schritt 5: Final-Commit**

```bash
git add js/storage/indexeddb.js js/version.js service-worker.js
git commit -m "chore: TrackedFood-JSDoc + APP_VERSION 1.2.3 (Phase 3C)"
```

---

## Abschluss-Checkliste

- [ ] 97 Tests grün (`npm test`)
- [ ] Badge erscheint korrekt für alle Slot-Typen
- [ ] Leere Slots zeigen kein Badge
- [ ] ℹ️-Tooltip öffnet/schließt korrekt
- [ ] `isMainMealSlot('Snack')` → `false`, alle anderen bekannten Slots → `true`
- [ ] `APP_VERSION` in `version.js` und `service-worker.js` identisch (1.2.3)
- [ ] Keine neuen Pflichtfelder in `TrackedFood`, keine Migration

---

*Plan erstellt: 2026-06-01 · Spec: `docs/superpowers/specs/2026-06-01-phase-3c-mps-vorbereitung-design.md`*
