# HydrationReminder — Logik + Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trainings-bezogene Trink-Erinnerungen als pure Berechnungsfunktion implementieren und vollständig testen — kein Tracking, kein State, keine UI.

**Architecture:** `generateHydrationReminders({ dayType, trainingTime })` in `js/calc/hydration.js` berechnet aus Tagestyp und Trainingszeit ein Array von `HydrationReminder`-Objekten. Frühe Trainingszeiten (T−2h vor 05:00) werden geclampt und mit angepasstem Label versehen. TDD: Tests werden vor der Implementierung geschrieben.

**Tech Stack:** Vitest (bereits eingerichtet in `package.json`), native ES Modules.

---

## Kontext

**Projekt-Root:** `D:\Claude Projekte\Ernährungs-Dashboard\`
**Branch:** `phase-3-tracker`
**Vitest:** bereits in `package.json` konfiguriert, läuft mit `npm test`
**63 bestehende Tests** müssen nach dieser Implementierung weiterhin grün sein.

### Muster aus bestehendem Code

`js/calc/bmr.js` und `js/calc/macros.js` dienen als Stil-Vorlage:
- JSDoc mit `@module calc/hydration`
- Named exports (kein default export)
- Hilfsfunktionen `toMin`, `toStr`, `clamp` — werden in `hydration.js` lokal neu definiert (kein Import aus anderen Dateien, kein Shared-State)

### Versionierungsregel (bindend)

Jede neue Datei in `js/` erfordert:
1. `APP_VERSION` in `js/version.js` hochzählen
2. `APP_VERSION` in `service-worker.js` synchron anpassen
3. Neue Datei in `LOCAL_ASSETS`-Array in `service-worker.js` eintragen

---

## Neue Dateien

| Datei | Zweck |
|---|---|
| `js/calc/hydration.js` | Pure Berechnungsfunktion `generateHydrationReminders` |
| `tests/unit/calc/hydration.test.js` | 22 Unit-Tests |

## Geänderte Dateien

| Datei | Änderung |
|---|---|
| `js/version.js` | 1.1.0 → 1.1.1 |
| `service-worker.js` | APP_VERSION 1.1.0 → 1.1.1 + `hydration.js` in LOCAL_ASSETS |

---

## Das Schema (Referenz für beide Tasks)

```javascript
/**
 * @typedef {Object} HydrationReminder
 * @property {string} id                            - 'pre-0' | 'pre-1' | 'during-0..2' | 'post-0' | 'rest-0..1'
 * @property {string} label                         - Anzeige-Text
 * @property {string} time                          - "HH:MM"
 * @property {{ min: number, max: number }} amountMl - Trinkmenge als Bereich
 * @property {'preWorkout'|'duringWorkout'|'postWorkout'|'restDay'} context
 * @property {string} note                          - Erläuterung / Tipp
 */
```

**Trainingstag — 6 Einträge:**

| id | Zeit | amountMl | context | Sonderfall |
|---|---|---|---|---|
| `pre-0` | T − 2h (min 05:00) | {min:400, max:600} | preWorkout | Wenn T−2h < 05:00: label "Direkt nach dem Aufstehen" |
| `pre-1` | T − 15min | {min:200, max:300} | preWorkout | |
| `during-0` | T | {min:150, max:250} | duringWorkout | |
| `during-1` | T + 20min | {min:150, max:250} | duringWorkout | |
| `during-2` | T + 40min | {min:150, max:250} | duringWorkout | |
| `post-0` | T + 90min | {min:400, max:600} | postWorkout | |

**Ruhetag — 2 Einträge:**

| id | Zeit | amountMl | context |
|---|---|---|---|
| `rest-0` | 08:30 | {min:300, max:500} | restDay |
| `rest-1` | 14:00 | {min:300, max:500} | restDay |

---

## Task 1: TDD — Tests zuerst, dann Implementierung

**Files:**
- Create: `tests/unit/calc/hydration.test.js`
- Create: `js/calc/hydration.js`

### Schritt 1.1: Testdatei erstellen (ergibt Fehler — Funktion existiert noch nicht)

`tests/unit/calc/hydration.test.js` anlegen:

```javascript
import { describe, it, expect } from 'vitest';
import { generateHydrationReminders } from '../../../js/calc/hydration.js';

// ── Ruhetag ───────────────────────────────────────────────────────────────────

describe('generateHydrationReminders — Ruhetag', () => {
  it('gibt genau 2 Einträge zurück', () => {
    expect(generateHydrationReminders({ dayType: 'rest' })).toHaveLength(2);
  });

  it('IDs sind rest-0 und rest-1', () => {
    const result = generateHydrationReminders({ dayType: 'rest' });
    expect(result[0].id).toBe('rest-0');
    expect(result[1].id).toBe('rest-1');
  });

  it('Zeiten sind 08:30 und 14:00', () => {
    const result = generateHydrationReminders({ dayType: 'rest' });
    expect(result[0].time).toBe('08:30');
    expect(result[1].time).toBe('14:00');
  });

  it('amountMl ist ein Bereich mit min: 300 und max: 500', () => {
    const result = generateHydrationReminders({ dayType: 'rest' });
    expect(result[0].amountMl).toEqual({ min: 300, max: 500 });
    expect(result[1].amountMl).toEqual({ min: 300, max: 500 });
  });

  it('context ist restDay für beide Einträge', () => {
    const result = generateHydrationReminders({ dayType: 'rest' });
    expect(result[0].context).toBe('restDay');
    expect(result[1].context).toBe('restDay');
  });
});

// ── Trainingstag — Struktur ───────────────────────────────────────────────────

describe('generateHydrationReminders — Trainingstag Struktur', () => {
  const result = generateHydrationReminders({ dayType: 'training', trainingTime: '08:00' });

  it('gibt genau 6 Einträge zurück', () => {
    expect(result).toHaveLength(6);
  });

  it('IDs sind in der richtigen Reihenfolge', () => {
    expect(result.map(r => r.id)).toEqual([
      'pre-0', 'pre-1', 'during-0', 'during-1', 'during-2', 'post-0',
    ]);
  });

  it('jeder Eintrag hat alle Pflichtfelder', () => {
    for (const entry of result) {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('label');
      expect(entry).toHaveProperty('time');
      expect(entry).toHaveProperty('amountMl');
      expect(entry).toHaveProperty('context');
      expect(entry).toHaveProperty('note');
    }
  });

  it('amountMl ist immer ein Objekt mit min und max', () => {
    for (const entry of result) {
      expect(typeof entry.amountMl.min).toBe('number');
      expect(typeof entry.amountMl.max).toBe('number');
      expect(entry.amountMl.max).toBeGreaterThan(entry.amountMl.min);
    }
  });
});

// ── Trainingstag — Zeiten (08:00) ─────────────────────────────────────────────

describe('generateHydrationReminders — Zeiten bei Training 08:00', () => {
  // T = 08:00 = 480 Minuten
  const result = generateHydrationReminders({ dayType: 'training', trainingTime: '08:00' });

  it('pre-0: T − 2h = 06:00', () => {
    expect(result.find(r => r.id === 'pre-0').time).toBe('06:00');
  });

  it('pre-1: T − 15min = 07:45', () => {
    expect(result.find(r => r.id === 'pre-1').time).toBe('07:45');
  });

  it('during-0: T = 08:00', () => {
    expect(result.find(r => r.id === 'during-0').time).toBe('08:00');
  });

  it('during-1: T + 20min = 08:20', () => {
    expect(result.find(r => r.id === 'during-1').time).toBe('08:20');
  });

  it('during-2: T + 40min = 08:40', () => {
    expect(result.find(r => r.id === 'during-2').time).toBe('08:40');
  });

  it('post-0: T + 90min = 09:30', () => {
    expect(result.find(r => r.id === 'post-0').time).toBe('09:30');
  });
});

// ── Trainingstag — Mengen ─────────────────────────────────────────────────────

describe('generateHydrationReminders — Mengen bei Training 08:00', () => {
  const result = generateHydrationReminders({ dayType: 'training', trainingTime: '08:00' });

  it('pre-0: 400–600 ml', () => {
    expect(result.find(r => r.id === 'pre-0').amountMl).toEqual({ min: 400, max: 600 });
  });

  it('pre-1: 200–300 ml', () => {
    expect(result.find(r => r.id === 'pre-1').amountMl).toEqual({ min: 200, max: 300 });
  });

  it('during-Einträge: alle 150–250 ml', () => {
    const during = result.filter(r => r.context === 'duringWorkout');
    for (const d of during) {
      expect(d.amountMl).toEqual({ min: 150, max: 250 });
    }
  });

  it('post-0: 400–600 ml', () => {
    expect(result.find(r => r.id === 'post-0').amountMl).toEqual({ min: 400, max: 600 });
  });
});

// ── Trainingstag — Clamp-Logik (frühes Training) ─────────────────────────────

describe('generateHydrationReminders — Clamp-Logik', () => {
  it('frühes Training 06:00: pre-0 wird auf 05:00 geclamppt', () => {
    // T = 06:00 = 360 min. T-120 = 240 < 300 (05:00) → clamp to 05:00
    const result = generateHydrationReminders({ dayType: 'training', trainingTime: '06:00' });
    expect(result.find(r => r.id === 'pre-0').time).toBe('05:00');
  });

  it('frühes Training 06:00: pre-0 label = "Direkt nach dem Aufstehen"', () => {
    const result = generateHydrationReminders({ dayType: 'training', trainingTime: '06:00' });
    expect(result.find(r => r.id === 'pre-0').label).toBe('Direkt nach dem Aufstehen');
  });

  it('normales Training 08:00: pre-0 label = "Vor dem Training"', () => {
    const result = generateHydrationReminders({ dayType: 'training', trainingTime: '08:00' });
    expect(result.find(r => r.id === 'pre-0').label).toBe('Vor dem Training');
  });

  it('Grenzfall Training 07:00: T-120 = 05:00 exakt — NICHT geclamppt, label "Vor dem Training"', () => {
    // T = 7*60 = 420, T-120 = 300 = 5*60. (300 < 300) = false → nicht geclamppt
    const result = generateHydrationReminders({ dayType: 'training', trainingTime: '07:00' });
    const pre0 = result.find(r => r.id === 'pre-0');
    expect(pre0.time).toBe('05:00');
    expect(pre0.label).toBe('Vor dem Training');
  });

  it('sehr frühes Training 05:30: pre-0 geclamppt auf 05:00, label "Direkt nach dem Aufstehen"', () => {
    // T = 5*60+30 = 330, T-120 = 210 < 300 → clamp
    const result = generateHydrationReminders({ dayType: 'training', trainingTime: '05:30' });
    const pre0 = result.find(r => r.id === 'pre-0');
    expect(pre0.time).toBe('05:00');
    expect(pre0.label).toBe('Direkt nach dem Aufstehen');
  });
});
```

- [ ] **Step 1.2: Tests ausführen — müssen FEHLSCHLAGEN (Datei existiert noch nicht)**

```bash
cd "D:\Claude Projekte\Ernährungs-Dashboard" && npm test
```

Erwartete Ausgabe: `FAIL tests/unit/calc/hydration.test.js` mit Fehler wie "Cannot find module" oder "Failed to resolve import". Die anderen 63 Tests müssen weiterhin grün sein.

- [ ] **Step 1.3: Implementierung schreiben**

`js/calc/hydration.js` erstellen:

```javascript
/**
 * Trainingsbezogene Trink-Erinnerungen für den Heute-Tab.
 * Kein Tracking, kein State — reine Berechnung aus Trainingszeit und Tagestyp.
 *
 * Trainingstag (6 Einträge):
 *   pre-0:    T − 2h      400–600 ml  (bei T−2h < 05:00: auf 05:00 geclamppt, Label angepasst)
 *   pre-1:    T − 15min   200–300 ml
 *   during-0: T + 0       150–250 ml
 *   during-1: T + 20min   150–250 ml
 *   during-2: T + 40min   150–250 ml
 *   post-0:   T + 90min   400–600 ml
 *
 * Ruhetag (2 Einträge):
 *   rest-0: 08:30  300–500 ml
 *   rest-1: 14:00  300–500 ml
 *
 * @module calc/hydration
 */

/** "HH:MM" → Minuten seit Mitternacht */
function toMin(timeStr) {
  const [h, m] = (timeStr || '08:00').split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Minuten seit Mitternacht → "HH:MM" */
function toStr(minutes) {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Generiert Trink-Erinnerungen für den Tag.
 *
 * @param {{ dayType: 'training'|'rest', trainingTime?: string }} options
 * @returns {HydrationReminder[]}
 *
 * @example
 * generateHydrationReminders({ dayType: 'rest' })
 * // → [ { id: 'rest-0', time: '08:30', ... }, { id: 'rest-1', time: '14:00', ... } ]
 *
 * @example
 * generateHydrationReminders({ dayType: 'training', trainingTime: '08:00' })
 * // → 6 Einträge: pre-0 (06:00), pre-1 (07:45), during-0..2 (08:00/20/40), post-0 (09:30)
 */
export function generateHydrationReminders({ dayType, trainingTime }) {
  // ── Ruhetag ────────────────────────────────────────────────────────────────
  if (dayType === 'rest') {
    return [
      {
        id: 'rest-0',
        label: 'Morgenhydrierung',
        time: '08:30',
        amountMl: { min: 300, max: 500 },
        context: 'restDay',
        note: 'Starte den Tag gut hydriert.',
      },
      {
        id: 'rest-1',
        label: 'Nachmittagshydrierung',
        time: '14:00',
        amountMl: { min: 300, max: 500 },
        context: 'restDay',
        note: 'Regelmäßig über den Tag trinken.',
      },
    ];
  }

  // ── Trainingstag ───────────────────────────────────────────────────────────
  const T = clamp(toMin(trainingTime || '08:00'), 5 * 60, 22 * 60);

  // pre-0: T − 2h, mindestens 05:00
  const preEarlyMin = T - 120;
  const isEarlyClamped = preEarlyMin < 5 * 60;
  const preEarly = clamp(preEarlyMin, 5 * 60, 22 * 60);

  return [
    {
      id: 'pre-0',
      label: isEarlyClamped ? 'Direkt nach dem Aufstehen' : 'Vor dem Training',
      time: toStr(preEarly),
      amountMl: { min: 400, max: 600 },
      context: 'preWorkout',
      note: isEarlyClamped
        ? 'Frühes Training: direkt nach dem Aufstehen ausreichend trinken.'
        : '2 Stunden vor dem Training: Körper optimal hydrieren.',
    },
    {
      id: 'pre-1',
      label: 'Letzte Hydrierung',
      time: toStr(clamp(T - 15, 5 * 60, 22 * 60)),
      amountMl: { min: 200, max: 300 },
      context: 'preWorkout',
      note: '15 Minuten vor dem Training: kleine Menge, kein volles Gefühl.',
    },
    {
      id: 'during-0',
      label: 'Training beginnt',
      time: toStr(T),
      amountMl: { min: 150, max: 250 },
      context: 'duringWorkout',
      note: 'Flasche bereit. Kleine Schlucke, nicht zu viel auf einmal.',
    },
    {
      id: 'during-1',
      label: 'Trinken (20 min)',
      time: toStr(clamp(T + 20, 5 * 60, 23 * 60)),
      amountMl: { min: 150, max: 250 },
      context: 'duringWorkout',
      note: 'Regelmäßige kleine Mengen während dem Training.',
    },
    {
      id: 'during-2',
      label: 'Trinken (40 min)',
      time: toStr(clamp(T + 40, 5 * 60, 23 * 60)),
      amountMl: { min: 150, max: 250 },
      context: 'duringWorkout',
      note: 'Regelmäßige kleine Mengen während dem Training.',
    },
    {
      id: 'post-0',
      label: 'Post-Workout',
      time: toStr(clamp(T + 90, 6 * 60, 23 * 60)),
      amountMl: { min: 400, max: 600 },
      context: 'postWorkout',
      note: 'Mit der Post-Workout-Mahlzeit: Flüssigkeit und Elektrolyte ersetzen.',
    },
  ];
}
```

- [ ] **Step 1.4: Tests ausführen — müssen ALLE grün sein**

```bash
npm test
```

Erwartete Ausgabe:
```
✓ tests/unit/calc/bmr.test.js
✓ tests/unit/calc/macros.test.js
✓ tests/unit/calc/nutritionLogic.test.js
✓ tests/unit/calc/hydration.test.js (22)
Test Files  4 passed (4)
Tests       85 passed (85)
```

Falls ein Test fehlschlägt: Ursache in der Implementierung finden (kein Test anpassen solange die Logik laut Spec korrekt ist). Berechnungen prüfen:
- Training 08:00 (T=480): pre-0 = 480-120 = 360 = 06:00 ✓
- Training 06:00 (T=360): pre-0 = 360-120 = 240 < 300 → clamp zu 300 = 05:00, isEarlyClamped=true ✓
- Training 07:00 (T=420): pre-0 = 420-120 = 300, (300 < 300) = false → NICHT geclamppt ✓

- [ ] **Step 1.5: Commit**

```bash
git add js/calc/hydration.js tests/unit/calc/hydration.test.js
git commit -m "feat: add HydrationReminder logic + 22 unit tests (pure calc, no UI, no tracking)"
```

---

## Task 2: Service Worker + Version bump

**Files:**
- Modify: `js/version.js`
- Modify: `service-worker.js`

Per Versionsregel: jede neue `js/`-Datei erfordert synchronen Version-Bump in beiden Dateien.

- [ ] **Step 2.1: js/version.js aktualisieren**

```javascript
export const APP_VERSION = '1.1.1';
export const SCHEMA_VERSION = 1; // Identisch mit IndexedDB-Version
```

- [ ] **Step 2.2: service-worker.js aktualisieren**

Zwei Änderungen:

**A) APP_VERSION Zeile 4:**
```javascript
const APP_VERSION = '1.1.1';
```

**B) LOCAL_ASSETS-Array:** `'./js/calc/hydration.js'` nach `'./js/calc/nutritionLogic.js'` einfügen:
```javascript
  './js/calc/bmr.js',
  './js/calc/macros.js',
  './js/calc/nutritionLogic.js',
  './js/calc/hydration.js',        // ← neu
  './js/data/mealTemplates.js',
```

- [ ] **Step 2.3: Versions-Konsistenz prüfen**

```bash
grep "APP_VERSION\|1.1.1" service-worker.js js/version.js
```

Erwartete Ausgabe: beide Dateien zeigen `1.1.1`.

- [ ] **Step 2.4: Tests nochmals ausführen (Regression-Check)**

```bash
npm test
```

Erwartete Ausgabe: alle 85 Tests grün.

- [ ] **Step 2.5: Commit + Push**

```bash
git add js/version.js service-worker.js
git commit -m "chore: bump version to 1.1.1, add hydration.js to SW cache"
git push
```

---

## Spec-Coverage-Check

| Anforderung | Task | Abgedeckt |
|---|---|---|
| `generateHydrationReminders({ dayType, trainingTime })` | Task 1 | ✅ |
| Ruhetag: 2 Einträge (rest-0, rest-1) | Task 1 | ✅ |
| Trainingstag: 6 Einträge (pre-0..1, during-0..2, post-0) | Task 1 | ✅ |
| `amountMl: { min, max }` als Bereich | Task 1 | ✅ |
| Deterministische IDs | Task 1 | ✅ |
| Clamp T-2h auf 05:00 + Label "Direkt nach dem Aufstehen" | Task 1 | ✅ |
| Grenzfall T=07:00: nicht geclamppt | Task 1 | ✅ |
| Kein Tracking, kein State, keine UI | Task 1 | ✅ (pure function) |
| Service Worker + Version | Task 2 | ✅ |
| Alle bestehenden Tests weiterhin grün | beide | ✅ |

**Nicht in diesem Plan (eigener Folge-Task):**
- UI-Karte im Heute-Tab
- Push-Notifications

---

*Plan erstellt: 2026-06-01 · Branch: phase-3-tracker*
