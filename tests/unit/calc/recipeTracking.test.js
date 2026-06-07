import { describe, it, expect } from 'vitest';
import { scaleRecipeMacros } from '../../../js/calc/recipeTracking.js';

const r1 = { kcal: 400, protein: 40, carbs: 30, fat: 10, servings: 1 };
const r2 = { kcal: 400, protein: 40, carbs: 30, fat: 10, servings: 2 };

describe('scaleRecipeMacros', () => {
  it('1 Portion eines 1-Portionen-Rezepts gibt dieselben Werte zurück', () => {
    const r = scaleRecipeMacros(r1, 1);
    expect(r.kcal).toBe(400);
    expect(r.p).toBe(40);
    expect(r.c).toBe(30);
    expect(r.f).toBe(10);
  });

  it('1 Portion eines 2-Portionen-Rezepts halbiert die Makros', () => {
    const r = scaleRecipeMacros(r2, 1);
    expect(r.kcal).toBe(200);
    expect(r.p).toBe(20);
    expect(r.c).toBe(15);
    expect(r.f).toBe(5);
  });

  it('2 Portionen eines 2-Portionen-Rezepts liefern Gesamtmakros', () => {
    const r = scaleRecipeMacros(r2, 2);
    expect(r.kcal).toBe(400);
    expect(r.p).toBe(40);
    expect(r.c).toBe(30);
    expect(r.f).toBe(10);
  });

  it('3 Portionen eines 1-Portionen-Rezepts verdreifacht die Makros', () => {
    const r = scaleRecipeMacros(r1, 3);
    expect(r.kcal).toBe(1200);
    expect(r.p).toBe(120);
    expect(r.c).toBe(90);
    expect(r.f).toBe(30);
  });

  it('kcal ist immer ganzzahlig gerundet', () => {
    const r = scaleRecipeMacros({ kcal: 100, protein: 10, carbs: 10, fat: 10, servings: 3 }, 1);
    expect(r.kcal).toBe(33);
    expect(Number.isInteger(r.kcal)).toBe(true);
  });

  it('Makros werden auf 1 Dezimalstelle gerundet', () => {
    const r = scaleRecipeMacros({ kcal: 100, protein: 10, carbs: 10, fat: 10, servings: 3 }, 1);
    expect(r.p).toBe(3.3);
    expect(r.c).toBe(3.3);
    expect(r.f).toBe(3.3);
  });

  it('fehlendes servings wird als 1 behandelt', () => {
    const r = scaleRecipeMacros({ kcal: 200, protein: 20, carbs: 20, fat: 10 }, 1);
    expect(r.kcal).toBe(200);
    expect(r.p).toBe(20);
  });
});
