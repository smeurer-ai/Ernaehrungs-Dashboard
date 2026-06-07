import { describe, it, expect } from 'vitest';
import { calcTrackedFoodMacros, sumConsumed, groupProteinBySlot, computeMpsSummary } from '../../../js/calc/tracker.js';

// Referenz-Lebensmittel für Tests
const QUARK        = { kcal100: 72,  p100: 12,  c100: 4,  f100: 0.2 };
const HAFERFLOCKEN = { kcal100: 370, p100: 13,  c100: 59, f100: 7   };
const WHEY         = { kcal100: 380, p100: 75,  c100: 8,  f100: 6   };

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
    const toDecimals = (n) => (n.toString().split('.')[1] || '').length;
    expect(toDecimals(result.p)).toBeLessThanOrEqual(1);
    expect(toDecimals(result.c)).toBeLessThanOrEqual(1);
    expect(toDecimals(result.f)).toBeLessThanOrEqual(1);
  });
});

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

describe('groupProteinBySlot', () => {
  it('gibt leeres Objekt bei leerer Liste zurück', () => {
    expect(groupProteinBySlot([])).toEqual({});
  });

  it('summiert Protein korrekt nach Slot', () => {
    const entries = [
      { mealSlot: 'Frühstück',   p: 24 },
      { mealSlot: 'Frühstück',   p: 10 },
      { mealSlot: 'Mittagessen', p: 30 },
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

describe('computeMpsSummary', () => {
  const SLOTS = ['Frühstück', 'Mittagessen', 'Snack'];

  it('gibt 0/0 zurück wenn keine Einträge vorhanden', () => {
    const r = computeMpsSummary([], SLOTS);
    expect(r.mpsSlotsCount).toBe(0);
    expect(r.totalActiveSlotsCount).toBe(0);
  });

  it('zählt nur Slots mit mindestens einem Eintrag', () => {
    const entries = [{ id: '1', mealSlot: 'Frühstück', p: 35, kcal: 300, c: 20, f: 10 }];
    const r = computeMpsSummary(entries, SLOTS);
    expect(r.totalActiveSlotsCount).toBe(1);
  });

  it('OFD-Eintrag mit ausreichend Leucin (leucineEstimateG ≥ 3g) → Slot wirksam', () => {
    const entries = [{ id: '1', mealSlot: 'Frühstück', p: 5, kcal: 80, c: 5, f: 2, leucineEstimateG: 3.2, mpsTriggered: true }];
    const r = computeMpsSummary(entries, SLOTS);
    expect(r.mpsSlotsCount).toBe(1);
  });

  it('Hohe Proteinmenge überschreibt nicht-triggerndes OFD-Leucin → Slot wirksam', () => {
    // OFD-Leucin einzeln zu gering, aber 50g Gesamtprotein im Slot reicht protein-basiert
    const entries = [{ id: '1', mealSlot: 'Frühstück', p: 50, kcal: 400, c: 30, f: 15, leucineEstimateG: 1.5, mpsTriggered: false }];
    const r = computeMpsSummary(entries, SLOTS);
    expect(r.mpsSlotsCount).toBe(1);
  });

  it('Mehrere OFD-Einträge: Leucinsumme ≥ 3g → Slot wirksam (auch wenn einzelne < 3g)', () => {
    const entries = [
      { id: '1', mealSlot: 'Frühstück', p: 10, kcal: 80, c: 4, f: 1, leucineEstimateG: 1.5, mpsTriggered: false },
      { id: '2', mealSlot: 'Frühstück', p: 8,  kcal: 60, c: 2, f: 1, leucineEstimateG: 1.8, mpsTriggered: false },
    ];
    const r = computeMpsSummary(entries, SLOTS);
    // leucineSum = 3.3g >= 3.0g → wirksam; Protein 18g allein reicht nicht für Hauptmahlzeit
    expect(r.mpsSlotsCount).toBe(1);
  });

  it('Mix aus manuellem und OFD-Eintrag: Gesamtprotein reicht → Slot wirksam', () => {
    const entries = [
      { id: '1', mealSlot: 'Snack', p: 15, kcal: 100, c: 5, f: 2 },                                  // manuell
      { id: '2', mealSlot: 'Snack', p: 8,  kcal: 60,  c: 3, f: 1, leucineEstimateG: 0.7, mpsTriggered: false }, // OFD
    ];
    const r = computeMpsSummary(entries, SLOTS);
    // Gesamtprotein 23g im Snack-Slot → wirksam (Leucinsumme 0.7g reicht nicht allein)
    expect(r.mpsSlotsCount).toBe(1);
  });

  it('OFD-Einträge: zu wenig Leucin und zu wenig Protein → nicht wirksam', () => {
    const entries = [{ id: '1', mealSlot: 'Frühstück', p: 5, kcal: 40, c: 3, f: 1, leucineEstimateG: 0.4, mpsTriggered: false }];
    const r = computeMpsSummary(entries, SLOTS);
    expect(r.mpsSlotsCount).toBe(0);
    expect(r.totalActiveSlotsCount).toBe(1);
  });

  it('Fallback auf Protein-Schätzung wenn kein mpsTriggered: 35g in Hauptmahlzeit → wirksam', () => {
    const entries = [{ id: '1', mealSlot: 'Frühstück', p: 35, kcal: 300, c: 20, f: 10 }];
    const r = computeMpsSummary(entries, SLOTS);
    expect(r.mpsSlotsCount).toBe(1);
  });

  it('Snack-Slot: 15g Protein → wirksam (niedrigere Schwelle)', () => {
    const entries = [{ id: '1', mealSlot: 'Snack', p: 15, kcal: 150, c: 8, f: 5 }];
    const r = computeMpsSummary(entries, SLOTS);
    expect(r.mpsSlotsCount).toBe(1);
  });

  it('Snack-Slot: 8g Protein → nicht wirksam', () => {
    const entries = [{ id: '1', mealSlot: 'Snack', p: 8, kcal: 80, c: 5, f: 2 }];
    const r = computeMpsSummary(entries, SLOTS);
    expect(r.mpsSlotsCount).toBe(0);
    expect(r.totalActiveSlotsCount).toBe(1);
  });
});
