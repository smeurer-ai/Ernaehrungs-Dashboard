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
