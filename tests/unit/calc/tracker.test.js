import { describe, it, expect } from 'vitest';
import { calcTrackedFoodMacros, sumConsumed, groupProteinBySlot } from '../../../js/calc/tracker.js';

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
