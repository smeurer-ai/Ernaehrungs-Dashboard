# Vitest Unit Tests — calc/-Schicht Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vollständige Unit-Test-Abdeckung der drei reinen Berechnungsmodule `bmr.js`, `macros.js` und `nutritionLogic.js` mit Vitest.

**Architecture:** Minimales `package.json` + `vitest.config.js` im Projekt-Root (nur für Tests, keine Auswirkung auf die Build-freie App). Testdateien in `tests/unit/calc/`. Die Calc-Funktionen sind pure functions (kein DOM, kein Browser-API) — kein Mocking nötig.

**Tech Stack:** Vitest 1.x, native ES Modules (`"type": "module"`), Node.js-Umgebung.

---

## Kontext

**Projekt-Root:** `D:\Claude Projekte\Ernährungs-Dashboard\`  
**Branch:** `phase-3-tracker`  
**Framework:** React 18 + htm, keine Build-Toolchain. Tests laufen **separat** über npm/Vitest — die App selbst läuft weiterhin ohne Build.

**Die drei zu testenden Module:**

| Datei | Funktionen |
|---|---|
| `js/calc/bmr.js` | `calcLeanMass`, `calcBMR` |
| `js/calc/macros.js` | `calcTDEE`, `calcProteinTarget`, `calcMacros`, `distributeMacrosPerMeal`, `calcGap` |
| `js/calc/nutritionLogic.js` | `assessDeficit`, `rateMealProtein`, `assessDayStructure` |

**Bekannte JSDoc-Fehler** (Tests testen echtes Verhalten, nicht falsche Doku):
- `calcTDEE(1523, 1.5)`: JSDoc sagt 2284, korrekt ist **2285** (Math.round(2284.5) = 2285)
- `calcMacros({leanMass:53.4, proteinPerKg:2.2, fatPercent:0.28}, 2000)`: JSDoc sagt carbs:254, korrekt ist **244**

---

## Neue Dateien

| Datei | Zweck |
|---|---|
| `package.json` | Minimales npm-Manifest — nur für Vitest, kein Build |
| `vitest.config.js` | Vitest-Konfiguration (ESM, node) |
| `tests/unit/calc/bmr.test.js` | Tests für `calcLeanMass` und `calcBMR` |
| `tests/unit/calc/macros.test.js` | Tests für alle 5 Funktionen in `macros.js` |
| `tests/unit/calc/nutritionLogic.test.js` | Tests für alle 3 Funktionen in `nutritionLogic.js` |

**Keine Änderungen** an bestehenden Quelldateien.

---

## Task 1: Vitest einrichten (package.json + vitest.config.js)

**Files:**
- Create: `package.json`
- Create: `vitest.config.js`

- [ ] **Step 1.1: package.json erstellen**

Im Projekt-Root `package.json` anlegen:

```json
{
  "name": "ernaehrungs-dashboard",
  "version": "1.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "devDependencies": {
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 1.2: vitest.config.js erstellen**

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js'],
  },
});
```

- [ ] **Step 1.3: Vitest installieren**

```bash
npm install
```

Erwartete Ausgabe: `node_modules/` wird angelegt, kein Fehler.

- [ ] **Step 1.4: Smoke-Test — leerer Lauf**

```bash
npm test
```

Erwartete Ausgabe: `No test files found` oder `0 tests passed` — kein Fehler.

- [ ] **Step 1.5: node_modules zu .gitignore ergänzen**

`.gitignore` öffnen und `node_modules/` hinzufügen:

```
.superpowers/
unpacked/
*.pdf
Übergabedokumente/
node_modules/
```

- [ ] **Step 1.6: Commit**

```bash
git add package.json vitest.config.js .gitignore
git commit -m "test: add Vitest setup for calc/ unit tests"
```

---

## Task 2: Tests für bmr.js

**Files:**
- Create: `tests/unit/calc/bmr.test.js`
- Reference: `js/calc/bmr.js`

- [ ] **Step 2.1: Testdatei erstellen**

```bash
mkdir -p tests/unit/calc
```

`tests/unit/calc/bmr.test.js` anlegen:

```javascript
import { describe, it, expect } from 'vitest';
import { calcLeanMass, calcBMR } from '../../../js/calc/bmr.js';

// ── calcLeanMass ─────────────────────────────────────────────────────────────
// Formel: LBM = weight × (1 - bodyFat/100), gerundet auf 2 Dezimalstellen

describe('calcLeanMass', () => {
  it('berechnet LBM korrekt für Referenzwert aus Spec (100 kg, 46.6% KFA)', () => {
    expect(calcLeanMass(100, 46.6)).toBe(53.40);
  });

  it('berechnet LBM korrekt für typische Werte (70 kg, 25% KFA)', () => {
    // 70 × (1 - 0.25) = 70 × 0.75 = 52.5
    expect(calcLeanMass(70, 25)).toBe(52.50);
  });

  it('gibt das Körpergewicht zurück wenn KFA = 0', () => {
    expect(calcLeanMass(80, 0)).toBe(80.00);
  });

  it('gibt 0 zurück wenn KFA = 100', () => {
    expect(calcLeanMass(80, 100)).toBe(0.00);
  });

  it('rundet korrekt auf 2 Dezimalstellen', () => {
    // 60 × (1 - 0.333) = 60 × 0.667 = 40.02
    expect(calcLeanMass(60, 33.3)).toBe(40.02);
  });
});

// ── calcBMR ───────────────────────────────────────────────────────────────────
// Formel: BMR = 370 + 21.6 × LBM, ganzzahlig gerundet

describe('calcBMR', () => {
  it('berechnet BMR korrekt für Referenzwert aus Spec (LBM 53.40 kg)', () => {
    // 370 + 21.6 × 53.40 = 370 + 1153.44 = 1523.44 → 1523
    expect(calcBMR(53.40)).toBe(1523);
  });

  it('berechnet BMR korrekt für zweiten Spec-Referenzwert (LBM 54.92 kg)', () => {
    // 370 + 21.6 × 54.92 = 370 + 1186.272 = 1556.272 → 1556
    expect(calcBMR(54.92)).toBe(1556);
  });

  it('gibt 370 zurück bei LBM = 0 (reines Fett)', () => {
    expect(calcBMR(0)).toBe(370);
  });

  it('berechnet BMR korrekt für runde Zahl (LBM 50 kg)', () => {
    // 370 + 21.6 × 50 = 370 + 1080 = 1450
    expect(calcBMR(50)).toBe(1450);
  });

  it('rundet auf ganze Zahl (kein Dezimalanteil)', () => {
    const result = calcBMR(53.40);
    expect(Number.isInteger(result)).toBe(true);
  });
});
```

- [ ] **Step 2.2: Tests ausführen — alle müssen PASS sein**

```bash
npm test
```

Erwartete Ausgabe:
```
✓ tests/unit/calc/bmr.test.js (9)
  ✓ calcLeanMass (5)
  ✓ calcBMR (4)
Test Files  1 passed (1)
Tests       9 passed (9)
```

Falls ein Test fehlschlägt: Berechnungen in den `it`-Kommentaren prüfen.

- [ ] **Step 2.3: Commit**

```bash
git add tests/unit/calc/bmr.test.js
git commit -m "test: add unit tests for calcLeanMass and calcBMR"
```

---

## Task 3: Tests für macros.js

**Files:**
- Create: `tests/unit/calc/macros.test.js`
- Reference: `js/calc/macros.js`

- [ ] **Step 3.1: Testdatei erstellen**

`tests/unit/calc/macros.test.js` anlegen:

```javascript
import { describe, it, expect } from 'vitest';
import {
  calcTDEE,
  calcProteinTarget,
  calcMacros,
  distributeMacrosPerMeal,
  calcGap,
} from '../../../js/calc/macros.js';

// ── calcTDEE ──────────────────────────────────────────────────────────────────
// Formel: Math.round(bmr × factor)
// HINWEIS: JSDoc-Beispiel calcTDEE(1523, 1.5) → 2284 ist FALSCH.
//          Korrekt: Math.round(2284.5) = 2285 (JS rundet .5 aufwärts)

describe('calcTDEE', () => {
  it('berechnet TDEE korrekt (Werte ohne .5-Grenzfall)', () => {
    // 1000 × 1.5 = 1500 (exakt)
    expect(calcTDEE(1000, 1.5)).toBe(1500);
  });

  it('rundet bei .5 aufwärts (Math.round-Verhalten)', () => {
    // 1523 × 1.5 = 2284.5 → Math.round = 2285
    // Achtung: JSDoc sagt fälschlicherweise 2284
    expect(calcTDEE(1523, 1.5)).toBe(2285);
  });

  it('berechnet TDEE mit Faktor 1.2 korrekt', () => {
    // 1500 × 1.2 = 1800
    expect(calcTDEE(1500, 1.2)).toBe(1800);
  });

  it('gibt BMR zurück bei Faktor 1.0', () => {
    expect(calcTDEE(1523, 1.0)).toBe(1523);
  });
});

// ── calcProteinTarget ────────────────────────────────────────────────────────
// Drei Modi: perKgBodyweight, perKgLeanMass, fixed

describe('calcProteinTarget', () => {
  it('berechnet Protein per kg Körpergewicht', () => {
    // 100 × 1.8 = 180
    expect(calcProteinTarget({
      proteinTargetMode: 'perKgBodyweight',
      weight: 100,
      proteinPerKg: 1.8,
    })).toBe(180);
  });

  it('berechnet Protein per kg fettfreie Masse (Standard für postmenopausale Frauen)', () => {
    // 53.4 × 2.2 = 117.48 → 117
    expect(calcProteinTarget({
      proteinTargetMode: 'perKgLeanMass',
      leanMass: 53.4,
      proteinPerKg: 2.2,
    })).toBe(117);
  });

  it('berechnet Protein per kg LBM mit dem App-Standard (2.0 g/kg)', () => {
    // 53.4 × 2.0 = 106.8 → 107
    expect(calcProteinTarget({
      proteinTargetMode: 'perKgLeanMass',
      leanMass: 53.4,
      proteinPerKg: 2.0,
    })).toBe(107);
  });

  it('gibt festen Wert zurück bei Modus fixed', () => {
    expect(calcProteinTarget({
      proteinTargetMode: 'fixed',
      proteinPerKg: 130,
    })).toBe(130);
  });

  it('wirft Fehler bei unbekanntem Modus', () => {
    expect(() => calcProteinTarget({
      proteinTargetMode: 'invalid',
    })).toThrow('Unbekannter proteinTargetMode: invalid');
  });

  it('gibt ganzzahligen Wert zurück', () => {
    const result = calcProteinTarget({
      proteinTargetMode: 'perKgLeanMass',
      leanMass: 53.4,
      proteinPerKg: 2.2,
    });
    expect(Number.isInteger(result)).toBe(true);
  });
});

// ── calcMacros ────────────────────────────────────────────────────────────────
// Reihenfolge: 1. Protein fest, 2. Fett nach %, 3. KH als Rest

describe('calcMacros', () => {
  it('berechnet Makros korrekt für Spec-Referenzprofil', () => {
    // protein: Math.round(53.4 × 2.2) = 117g → 468 kcal
    // fat:     Math.round(2000 × 0.28 / 9) = Math.round(62.22) = 62g → 558 kcal
    // carbs:   Math.round((2000 - 468 - 558) / 4) = Math.round(243.5) = 244g
    // HINWEIS: JSDoc-Beispiel sagt carbs: 254 — das ist FALSCH. Korrekt: 244.
    expect(calcMacros({
      proteinTargetMode: 'perKgLeanMass',
      leanMass: 53.4,
      proteinPerKg: 2.2,
      fatPercent: 0.28,
    }, 2000)).toEqual({ kcal: 2000, protein: 117, fat: 62, carbs: 244 });
  });

  it('gibt Gesamtkalorien unverändert zurück', () => {
    const result = calcMacros({
      proteinTargetMode: 'fixed',
      proteinPerKg: 120,
      fatPercent: 0.25,
    }, 1800);
    expect(result.kcal).toBe(1800);
  });

  it('KH werden nie negativ (Math.max(0, ...))', () => {
    // Protein 500g = 2000 kcal, übersteigt Gesamtkalorien
    const result = calcMacros({
      proteinTargetMode: 'fixed',
      proteinPerKg: 500,
      fatPercent: 0.50,
    }, 1000);
    expect(result.carbs).toBe(0);
    expect(result.carbs).toBeGreaterThanOrEqual(0);
  });

  it('berechnet Makros mit Fettanteil 0.25 korrekt', () => {
    // fixed 100g Protein = 400 kcal
    // fat: Math.round(2000 × 0.25 / 9) = Math.round(55.55) = 56g → 504 kcal
    // carbs: Math.round((2000 - 400 - 504) / 4) = Math.round(274) = 274g
    const result = calcMacros({
      proteinTargetMode: 'fixed',
      proteinPerKg: 100,
      fatPercent: 0.25,
    }, 2000);
    expect(result.protein).toBe(100);
    expect(result.fat).toBe(56);
    expect(result.carbs).toBe(274);
  });
});

// ── distributeMacrosPerMeal ───────────────────────────────────────────────────
// Verteilt tägliche Makros auf Mahlzeiten anhand von Proportionen

describe('distributeMacrosPerMeal', () => {
  const totalMacros = { kcal: 2000, protein: 120, carbs: 200, fat: 60 };

  it('berechnet Mahlzeit-Makros korrekt anhand von Proportionen', () => {
    const templates = [
      { label: 'Frühstück', time: '08:00', icon: '🌅', kP: 0.32, pP: 0.32, cP: 0.25, fP: 0.28 },
    ];
    const [meal] = distributeMacrosPerMeal(templates, totalMacros);
    // kcal:    Math.round(2000 × 0.32) = 640
    // protein: Math.round(120  × 0.32) = 38
    // carbs:   Math.round(200  × 0.25) = 50
    // fat:     Math.round(60   × 0.28) = 17
    expect(meal.kcal).toBe(640);
    expect(meal.protein).toBe(38);
    expect(meal.carbs).toBe(50);
    expect(meal.fat).toBe(17);
  });

  it('kopiert label, time und icon aus dem Template', () => {
    const templates = [
      { label: 'Abendessen', time: '19:00', icon: '🌙', kP: 0.25, pP: 0.25, cP: 0.30, fP: 0.30 },
    ];
    const [meal] = distributeMacrosPerMeal(templates, totalMacros);
    expect(meal.label).toBe('Abendessen');
    expect(meal.time).toBe('19:00');
    expect(meal.icon).toBe('🌙');
  });

  it('überträgt note wenn im Template vorhanden', () => {
    const templates = [
      { label: 'Post-Workout', time: '11:30', icon: '💪', note: 'Protein + KH', kP: 0.30, pP: 0.30, cP: 0.38, fP: 0.18 },
    ];
    const [meal] = distributeMacrosPerMeal(templates, totalMacros);
    expect(meal.note).toBe('Protein + KH');
  });

  it('enthält kein note-Feld wenn Template kein note hat', () => {
    const templates = [
      { label: 'Snack', time: '16:00', icon: '🫐', kP: 0.15, pP: 0.15, cP: 0.20, fP: 0.12 },
    ];
    const [meal] = distributeMacrosPerMeal(templates, totalMacros);
    expect(meal).not.toHaveProperty('note');
  });

  it('gibt für jedes Template-Element eine Mahlzeit zurück', () => {
    const templates = [
      { label: 'M1', time: '08:00', icon: '🌅', kP: 0.32, pP: 0.32, cP: 0.25, fP: 0.28 },
      { label: 'M2', time: '12:30', icon: '🌿', kP: 0.28, pP: 0.28, cP: 0.25, fP: 0.30 },
      { label: 'M3', time: '16:00', icon: '🫐', kP: 0.15, pP: 0.15, cP: 0.20, fP: 0.12 },
      { label: 'M4', time: '19:00', icon: '🌙', kP: 0.25, pP: 0.25, cP: 0.30, fP: 0.30 },
    ];
    const meals = distributeMacrosPerMeal(templates, totalMacros);
    expect(meals).toHaveLength(4);
  });
});

// ── calcGap ───────────────────────────────────────────────────────────────────
// Berechnet target - consumed. Positive = noch verfügbar, negative = überschritten

describe('calcGap', () => {
  it('berechnet verbleibende Makros korrekt (Normalfall aus Spec)', () => {
    const target   = { kcal: 2000, protein: 130, carbs: 220, fat: 70 };
    const consumed = { kcal: 1200, protein:  85, carbs: 140, fat: 42 };
    expect(calcGap(target, consumed)).toEqual({ kcal: 800, protein: 45, carbs: 80, fat: 28 });
  });

  it('gibt negative Werte zurück wenn Ziel überschritten (Overshoot aus Spec)', () => {
    const target   = { kcal: 2000, protein: 130, carbs: 220, fat: 70 };
    const consumed = { kcal: 2100, protein: 140, carbs: 250, fat: 75 };
    expect(calcGap(target, consumed)).toEqual({ kcal: -100, protein: -10, carbs: -30, fat: -5 });
  });

  it('gibt das Ziel zurück wenn noch nichts gegessen wurde', () => {
    const target   = { kcal: 1800, protein: 110, carbs: 200, fat: 55 };
    const consumed = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    expect(calcGap(target, consumed)).toEqual({ kcal: 1800, protein: 110, carbs: 200, fat: 55 });
  });

  it('gibt Nullen zurück wenn genau das Ziel erreicht wurde', () => {
    const target = { kcal: 2000, protein: 120, carbs: 210, fat: 65 };
    expect(calcGap(target, target)).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
});
```

- [ ] **Step 3.2: Tests ausführen — alle müssen PASS sein**

```bash
npm test
```

Erwartete Ausgabe:
```
✓ tests/unit/calc/bmr.test.js (9)
✓ tests/unit/calc/macros.test.js (20)
Test Files  2 passed (2)
Tests       29 passed (29)
```

- [ ] **Step 3.3: Commit**

```bash
git add tests/unit/calc/macros.test.js
git commit -m "test: add unit tests for macros.js (calcTDEE, calcProteinTarget, calcMacros, distributeMacrosPerMeal, calcGap)"
```

---

## Task 4: Tests für nutritionLogic.js

**Files:**
- Create: `tests/unit/calc/nutritionLogic.test.js`
- Reference: `js/calc/nutritionLogic.js`

- [ ] **Step 4.1: Testdatei erstellen**

`tests/unit/calc/nutritionLogic.test.js` anlegen:

```javascript
import { describe, it, expect } from 'vitest';
import {
  assessDeficit,
  rateMealProtein,
  assessDayStructure,
} from '../../../js/calc/nutritionLogic.js';

// ── assessDeficit ─────────────────────────────────────────────────────────────
// Schwellen: ≤17% safe, ≤22% moderate, ≤30% aggressive, >30% dangerous
// warning nur bei aggressive und dangerous

describe('assessDeficit', () => {
  // ── Severity-Klassifizierung ──────────────────────────────────────────────

  it('klassifiziert als safe bei Defizit ≤ 17% (Beispiel: 15%)', () => {
    const result = assessDeficit({ deficit: 300 }, 2000); // 300/2000 = 15%
    expect(result.severity).toBe('safe');
  });

  it('klassifiziert als safe an der exakten 17%-Grenze', () => {
    const result = assessDeficit({ deficit: 340 }, 2000); // 340/2000 = 17%
    expect(result.severity).toBe('safe');
  });

  it('klassifiziert als moderate knapp über 17%', () => {
    const result = assessDeficit({ deficit: 341 }, 2000); // ~17.05%
    expect(result.severity).toBe('moderate');
  });

  it('klassifiziert als moderate an der exakten 22%-Grenze', () => {
    const result = assessDeficit({ deficit: 440 }, 2000); // 440/2000 = 22%
    expect(result.severity).toBe('moderate');
  });

  it('klassifiziert als aggressive knapp über 22%', () => {
    const result = assessDeficit({ deficit: 441 }, 2000); // ~22.05%
    expect(result.severity).toBe('aggressive');
  });

  it('klassifiziert als aggressive an der exakten 30%-Grenze', () => {
    const result = assessDeficit({ deficit: 600 }, 2000); // 600/2000 = 30%
    expect(result.severity).toBe('aggressive');
  });

  it('klassifiziert als dangerous knapp über 30%', () => {
    const result = assessDeficit({ deficit: 601 }, 2000); // ~30.05%
    expect(result.severity).toBe('dangerous');
  });

  it('klassifiziert als dangerous bei sehr hohem Defizit (50%)', () => {
    const result = assessDeficit({ deficit: 1000 }, 2000); // 50%
    expect(result.severity).toBe('dangerous');
  });

  // ── Rückgabefelder ────────────────────────────────────────────────────────

  it('gibt deficitKcal korrekt zurück', () => {
    const result = assessDeficit({ deficit: 300 }, 2000);
    expect(result.deficitKcal).toBe(300);
  });

  it('gibt percentOfTDEE als Dezimalzahl zurück', () => {
    const result = assessDeficit({ deficit: 300 }, 2000);
    expect(result.percentOfTDEE).toBeCloseTo(0.15, 5);
  });

  // ── Warning-Feld ──────────────────────────────────────────────────────────

  it('enthält kein warning bei safe', () => {
    const result = assessDeficit({ deficit: 300 }, 2000);
    expect(result).not.toHaveProperty('warning');
  });

  it('enthält kein warning bei moderate', () => {
    const result = assessDeficit({ deficit: 400 }, 2000);
    expect(result).not.toHaveProperty('warning');
  });

  it('enthält warning bei aggressive', () => {
    const result = assessDeficit({ deficit: 500 }, 2000); // 25%
    expect(result).toHaveProperty('warning');
    expect(typeof result.warning).toBe('string');
    expect(result.warning.length).toBeGreaterThan(0);
  });

  it('warning bei aggressive enthält die Defizit-Menge in kcal', () => {
    const result = assessDeficit({ deficit: 500 }, 2000);
    expect(result.warning).toContain('500');
  });

  it('enthält warning bei dangerous', () => {
    const result = assessDeficit({ deficit: 700 }, 2000); // 35%
    expect(result).toHaveProperty('warning');
    expect(result.warning.length).toBeGreaterThan(0);
  });

  it('warning bei dangerous enthält die Defizit-Menge in kcal', () => {
    const result = assessDeficit({ deficit: 700 }, 2000);
    expect(result.warning).toContain('700');
  });

  it('warning enthält eine Empfehlung (max. X kcal)', () => {
    const result = assessDeficit({ deficit: 500 }, 2000);
    // Empfehlung: max. Math.round(2000 × 0.20) = 400 kcal
    expect(result.warning).toContain('400');
  });
});

// ── rateMealProtein ───────────────────────────────────────────────────────────
// Stub Phase 1: rating basiert nur auf Gramm-Schwellen
// Phase 3 wird echte Leucin-Schätzung einbauen

describe('rateMealProtein', () => {
  it('bewertet ≥ 25g Protein als good', () => {
    expect(rateMealProtein(25, true, {}).rating).toBe('good');
  });

  it('bewertet 35g Protein als good', () => {
    expect(rateMealProtein(35, true, {}).rating).toBe('good');
  });

  it('bewertet 24g Protein als borderline', () => {
    expect(rateMealProtein(24, true, {}).rating).toBe('borderline');
  });

  it('bewertet 15g Protein als borderline', () => {
    expect(rateMealProtein(15, false, {}).rating).toBe('borderline');
  });

  it('bewertet 14g Protein als insufficient', () => {
    expect(rateMealProtein(14, false, {}).rating).toBe('insufficient');
  });

  it('bewertet 0g Protein als insufficient', () => {
    expect(rateMealProtein(0, false, {}).rating).toBe('insufficient');
  });

  it('gibt immer leucineLikelihood: "high" zurück (Stub)', () => {
    expect(rateMealProtein(30, true, {}).leucineLikelihood).toBe('high');
    expect(rateMealProtein(10, false, {}).leucineLikelihood).toBe('high');
  });

  it('gibt immer hint: undefined zurück (Stub)', () => {
    expect(rateMealProtein(30, true, {}).hint).toBeUndefined();
  });

  it('gibt proteinG gleich dem Input zurück', () => {
    expect(rateMealProtein(42, true, {}).proteinG).toBe(42);
  });
});

// ── assessDayStructure ────────────────────────────────────────────────────────
// Stub Phase 1: gibt immer Null-Werte / leeres Array zurück

describe('assessDayStructure', () => {
  it('gibt die korrekte Stub-Struktur zurück', () => {
    const result = assessDayStructure([], {}, 'rest');
    expect(result).toEqual({
      totalProteinG: 0,
      proteinTargetG: 0,
      mealsReachingThreshold: 0,
      totalMainMeals: 0,
      eveningProteinG: 0,
      proteinDistributionScore: 0,
      flags: [],
    });
  });

  it('ignoriert dayLog-Inhalt (Stub gibt immer Nullen)', () => {
    const log = [
      { protein: 35, time: '08:00' },
      { protein: 42, time: '12:30' },
    ];
    const result = assessDayStructure(log, {}, 'workout');
    expect(result.totalProteinG).toBe(0);
  });

  it('ignoriert dayType (Stub gibt immer Nullen)', () => {
    const training = assessDayStructure([], {}, 'workout');
    const rest     = assessDayStructure([], {}, 'rest');
    expect(training).toEqual(rest);
  });

  it('flags ist ein leeres Array', () => {
    const result = assessDayStructure([], {}, 'rest');
    expect(Array.isArray(result.flags)).toBe(true);
    expect(result.flags).toHaveLength(0);
  });
});
```

- [ ] **Step 4.2: Tests ausführen — alle müssen PASS sein**

```bash
npm test
```

Erwartete Ausgabe:
```
✓ tests/unit/calc/bmr.test.js (9)
✓ tests/unit/calc/macros.test.js (20)
✓ tests/unit/calc/nutritionLogic.test.js (22)
Test Files  3 passed (3)
Tests       51 passed (51)
```

- [ ] **Step 4.3: Commit**

```bash
git add tests/unit/calc/nutritionLogic.test.js
git commit -m "test: add unit tests for assessDeficit, rateMealProtein, assessDayStructure"
```

---

## Task 5: Abschluss — JSDoc-Fehler korrigieren

Die Tests haben zwei Fehler in den JSDoc-Kommentaren aufgedeckt. Diese jetzt korrigieren.

**Files:**
- Modify: `js/calc/macros.js` (Zeilen 21–25 und Zeilen 93–100)

- [ ] **Step 5.1: calcTDEE-Beispiel in macros.js korrigieren**

In `js/calc/macros.js`, den `@example`-Kommentar für `calcTDEE` ändern:

```javascript
 * @example
 * calcTDEE(1523, 1.5) // → 2285  (nicht 2284 — Math.round(2284.5) = 2285)
 * calcTDEE(1000, 1.5) // → 1500
```

- [ ] **Step 5.2: calcMacros-Beispiel in macros.js korrigieren**

Den `@example`-Kommentar für `calcMacros` ändern:

```javascript
 * @example
 * calcMacros({
 *   proteinTargetMode: 'perKgLeanMass',
 *   leanMass: 53.4,
 *   proteinPerKg: 2.2,
 *   fatPercent: 0.28
 * }, 2000)
 * // → { kcal: 2000, protein: 117, fat: 62, carbs: 244 }
 * //   protein: Math.round(53.4 × 2.2) = 117 → 468 kcal
 * //   fat:     Math.round(2000 × 0.28 / 9) = 62 → 558 kcal
 * //   carbs:   Math.round((2000 - 468 - 558) / 4) = 244
```

- [ ] **Step 5.3: Tests nochmals ausführen — müssen weiterhin PASS sein**

```bash
npm test
```

Erwartete Ausgabe:
```
Test Files  3 passed (3)
Tests       51 passed (51)
```

- [ ] **Step 5.4: Finaler Commit**

```bash
git add js/calc/macros.js
git commit -m "fix: correct JSDoc examples in macros.js (calcTDEE: 2285 not 2284, calcMacros: carbs 244 not 254)"
```

---

## Spec-Coverage-Check

| Funktion | Tests |
|---|---|
| `calcLeanMass` | 5 (Referenzwert, typische Werte, Grenzen, Rundung) |
| `calcBMR` | 4 (beide Spec-Werte, Nullfall, ganzzahlig) |
| `calcTDEE` | 4 (Grenzen, .5-Rundung, Faktor 1.0) |
| `calcProteinTarget` | 6 (alle 3 Modi, Fehlerfall, Ganzzahligkeit) |
| `calcMacros` | 4 (Spec-Wert, Gesamtkalorien, KH≥0-Invariante, weiteres Beispiel) |
| `distributeMacrosPerMeal` | 5 (Proportionen, Felder, note, kein note, Länge) |
| `calcGap` | 4 (Spec-Beispiele, Nullkonsum, Nulllücke) |
| `assessDeficit` | 16 (alle Grenzwerte, Felder, Warning-Inhalt) |
| `rateMealProtein` | 9 (alle Schwellen, Stub-Felder) |
| `assessDayStructure` | 4 (Stub-Struktur, Invarianten) |
| **Gesamt** | **51 Tests** |

---

*Plan erstellt: 2026-06-01 · Branch: phase-3-tracker · Nächste Phase nach Tests: Phase 3 Tracker-Implementierung*
