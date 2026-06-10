import { describe, it, expect } from 'vitest';
import { computeMealTotals, mealItemsToTrackedFoods } from '../../../js/calc/meals.js';

const ITEMS = [
  { foodRef: 'fav:1', foodName: 'Magerquark',  gramm: 250, kcal: 168, p: 30,   c: 10,  f: 0.5 },
  { foodRef: 'manual', foodName: 'Blaubeeren', gramm: 100, kcal: 46,  p: 0.7,  c: 8,   f: 0.3 },
];

describe('computeMealTotals', () => {
  it('summiert kcal/p/c/f aller Items', () => {
    expect(computeMealTotals(ITEMS)).toEqual({ kcal: 214, p: 30.7, c: 18, f: 0.8 });
  });

  it('leeres Array → Nullwerte', () => {
    expect(computeMealTotals([])).toEqual({ kcal: 0, p: 0, c: 0, f: 0 });
  });

  it('undefined → Nullwerte (defensiv)', () => {
    expect(computeMealTotals(undefined)).toEqual({ kcal: 0, p: 0, c: 0, f: 0 });
  });

  it('rundet p/c/f auf 1 Dezimalstelle, kcal ganzzahlig', () => {
    const r = computeMealTotals([
      { kcal: 100.4, p: 1.11, c: 2.22, f: 3.33 },
      { kcal: 100.4, p: 1.11, c: 2.22, f: 3.33 },
    ]);
    expect(r.kcal).toBe(201);
    expect(r.p).toBe(2.2);
  });

  it('fehlende Felder werden als 0 behandelt', () => {
    expect(computeMealTotals([{ kcal: 50 }]).p).toBe(0);
  });
});

describe('mealItemsToTrackedFoods', () => {
  it('erzeugt je Item einen TrackedFood-Rohling mit dem Ziel-Slot', () => {
    const r = mealItemsToTrackedFoods({ items: ITEMS }, 'Frühstück');
    expect(r).toHaveLength(2);
    expect(r[0]).toEqual({
      mealSlot: 'Frühstück', foodRef: 'fav:1', foodName: 'Magerquark',
      gramm: 250, kcal: 168, p: 30, c: 10, f: 0.5,
    });
    expect(r[1].mealSlot).toBe('Frühstück');
  });

  it('fehlender foodRef → manual', () => {
    const r = mealItemsToTrackedFoods({ items: [{ foodName: 'X', gramm: 10, kcal: 5, p: 1, c: 1, f: 0 }] }, 'Snack');
    expect(r[0].foodRef).toBe('manual');
  });

  it('Mahlzeit ohne Items → leeres Array', () => {
    expect(mealItemsToTrackedFoods({}, 'Snack')).toEqual([]);
  });
});
