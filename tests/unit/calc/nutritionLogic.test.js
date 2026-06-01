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
