import { describe, it, expect } from 'vitest';
import {
  assessDeficit,
  rateMealProtein,
  assessDayStructure,
  isMainMealSlot,
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

  // ── Defensiver Fallback bei fehlendem/ungültigem tdee ─────────────────────

  it('gibt severity unknown zurück wenn tdee 0 ist', () => {
    const result = assessDeficit({ deficit: 300 }, 0);
    expect(result.severity).toBe('unknown');
    expect(result.percentOfTDEE).toBe(0);
    expect(result.deficitKcal).toBe(300);
    expect(result).not.toHaveProperty('warning');
  });

  it('gibt severity unknown zurück wenn tdee undefined ist', () => {
    const result = assessDeficit({ deficit: 400 }, undefined);
    expect(result.severity).toBe('unknown');
    expect(result.percentOfTDEE).toBe(0);
    expect(result.deficitKcal).toBe(400);
    expect(result).not.toHaveProperty('warning');
  });
});

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

  it('klassifiziert Nachmittagssnack als Snack-Mahlzeit (echter Produktions-Slot)', () => {
    expect(isMainMealSlot('Nachmittagssnack')).toBe(false);
  });

  it('klassifiziert Casein als Snack-Mahlzeit', () => {
    expect(isMainMealSlot('Casein')).toBe(false);
  });

  it('behandelt unbekannte Slots konservativ als Hauptmahlzeit', () => {
    expect(isMainMealSlot('UnbekannterSlot')).toBe(true);
  });
});

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

  it('gibt insufficient zurück bei undefined ohne Crash', () => {
    const r = rateMealProtein(undefined, true, {});
    expect(r.rating).toBe('insufficient');
    expect(r.leucineLikelihood).toBe('low');
  });

  it('gibt insufficient zurück bei NaN ohne Crash', () => {
    const r = rateMealProtein(NaN, true, {});
    expect(r.rating).toBe('insufficient');
    expect(r.leucineLikelihood).toBe('low');
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
