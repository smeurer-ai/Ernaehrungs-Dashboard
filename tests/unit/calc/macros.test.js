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

  it('nutzt einen defensiven Fallback bei unbekanntem Modus', () => {
    expect(calcProteinTarget({
      proteinTargetMode: 'invalid',
      proteinPerKg: 120,
    })).toBe(120);
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
