import { describe, it, expect } from 'vitest';
import { scaleRecipeMacros, calcIngredientMacros, calcRecipeMacrosFromIngredients, getRecipeMacros, ingredientMacroStatus, resolveRecipeSlot } from '../../../js/calc/recipeTracking.js';

describe('resolveRecipeSlot', () => {
  const slots = ['Frühstück', 'Mittagessen', 'Abendessen'];

  it('defaultSlot hat höchste Priorität wenn in slotsToUse enthalten', () => {
    expect(resolveRecipeSlot(slots, 'Mittagessen', 'Abendessen')).toBe('Mittagessen');
  });

  it('defaultSlot nicht in slotsToUse → Fallback auf recipeMealSlot', () => {
    expect(resolveRecipeSlot(slots, 'Snack', 'Abendessen')).toBe('Abendessen');
  });

  it('weder defaultSlot noch recipeMealSlot in slotsToUse → slotsToUse[0]', () => {
    expect(resolveRecipeSlot(slots, 'Snack', 'Pre-Workout')).toBe('Frühstück');
  });

  it('kein defaultSlot → recipeMealSlot wenn vorhanden', () => {
    expect(resolveRecipeSlot(slots, undefined, 'Abendessen')).toBe('Abendessen');
  });

  it('kein defaultSlot, kein recipeMealSlot → slotsToUse[0]', () => {
    expect(resolveRecipeSlot(slots, undefined, undefined)).toBe('Frühstück');
  });

  it('defaultSlot = leerer String → Fallback auf recipeMealSlot', () => {
    expect(resolveRecipeSlot(slots, '', 'Mittagessen')).toBe('Mittagessen');
  });
});

describe('ingredientMacroStatus', () => {
  it('keine Makros hinterlegt → no-macros', () => {
    const r = ingredientMacroStatus({ name: 'Salz', amount: 1, unit: 'TL' });
    expect(r.status).toBe('no-macros');
    expect(r.macros).toBeNull();
  });

  it('einzelnes fehlendes Makro-Feld → no-macros (Alle-vier-Felder-Regel)', () => {
    const r = ingredientMacroStatus({ name: 'X', amount: 100, unit: 'g', kcal100: 50, p100: 4, c100: 3 });
    expect(r.status).toBe('no-macros');
  });

  it('Makros da, aber Stk ohne Gramm-Äquivalent → missing-gram-equivalent', () => {
    const r = ingredientMacroStatus({ name: 'Ei', amount: 2, unit: 'Stk', kcal100: 143, p100: 12, c100: 1, f100: 10 });
    expect(r.status).toBe('missing-gram-equivalent');
    expect(r.macros).toBeNull();
  });

  it('Stk mit Gramm-Äquivalent → ok mit berechneten Makros', () => {
    const r = ingredientMacroStatus({ name: 'Ei', amount: 2, unit: 'Stk', grammEquivalent: 55, kcal100: 143, p100: 12, c100: 1, f100: 10 });
    expect(r.status).toBe('ok');
    expect(r.macros.gramm).toBe(110);
    expect(r.macros.kcal).toBe(157);
  });

  it('EL nutzt Default 15g → ok', () => {
    const r = ingredientMacroStatus({ name: 'Öl', amount: 2, unit: 'EL', kcal100: 884, p100: 0, c100: 0, f100: 100 });
    expect(r.status).toBe('ok');
    expect(r.macros.gramm).toBe(30);
    expect(r.macros.f).toBe(30);
  });

  it('Makros mit Wert 0 gelten als gesetzt → ok', () => {
    const r = ingredientMacroStatus({ name: 'Wasser', amount: 100, unit: 'ml', kcal100: 0, p100: 0, c100: 0, f100: 0 });
    expect(r.status).toBe('ok');
    expect(r.macros.kcal).toBe(0);
  });
});

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

describe('calcIngredientMacros', () => {
  it('g-Einheit: direkte Gramm-Berechnung', () => {
    const r = calcIngredientMacros({ name: 'X', amount: 200, unit: 'g', kcal100: 50, p100: 4, c100: 3, f100: 1 });
    expect(r).toEqual({ kcal: 100, p: 8.0, c: 6.0, f: 2.0, gramm: 200 });
  });

  it('EL-Einheit mit Default 15g/EL', () => {
    const r = calcIngredientMacros({ name: 'Öl', amount: 2, unit: 'EL', kcal100: 884, p100: 0, c100: 0, f100: 100 });
    expect(r).toEqual({ kcal: 265, p: 0.0, c: 0.0, f: 30.0, gramm: 30 });
  });

  it('EL-Einheit mit explizitem grammEquivalent', () => {
    const r = calcIngredientMacros({ name: 'Honig', amount: 1, unit: 'EL', grammEquivalent: 21, kcal100: 304, p100: 0.3, c100: 82, f100: 0 });
    expect(r).toEqual({ kcal: 64, p: 0.1, c: 17.2, f: 0.0, gramm: 21 });
  });

  it('keine Makros → null', () => {
    expect(calcIngredientMacros({ name: 'Salz', amount: 1, unit: 'TL' })).toBeNull();
  });

  it('Stk ohne grammEquivalent → null (kein Default)', () => {
    expect(calcIngredientMacros({ name: 'X', amount: 1, unit: 'Stk', kcal100: 100, p100: 5, c100: 10, f100: 2 })).toBeNull();
  });

  it('Stk mit explizitem grammEquivalent → berechnet', () => {
    const r = calcIngredientMacros({ name: 'Ei', amount: 1, unit: 'Stk', grammEquivalent: 55, kcal100: 143, p100: 12, c100: 1, f100: 10 });
    expect(r).toEqual({ kcal: 79, p: 6.6, c: 0.6, f: 5.5, gramm: 55 });
  });

  it('nur kcal100 vorhanden, p100/c100/f100 fehlen → null', () => {
    expect(calcIngredientMacros({ name: 'X', amount: 100, unit: 'g', kcal100: 100 })).toBeNull();
  });

  it('kcal100 + p100 vorhanden, c100/f100 fehlen → null', () => {
    expect(calcIngredientMacros({ name: 'X', amount: 100, unit: 'g', kcal100: 100, p100: 5 })).toBeNull();
  });
});

describe('calcRecipeMacrosFromIngredients', () => {
  const ingMit = { name: 'A', amount: 100, unit: 'g', kcal100: 100, p100: 10, c100: 20, f100: 5 };
  const ingOhne = { name: 'Salz', amount: 5, unit: 'g' };

  it('alle mit Makros → vollständige Summe, missingCount 0', () => {
    const r = calcRecipeMacrosFromIngredients([
      { name: 'A', amount: 100, unit: 'g', kcal100: 100, p100: 10, c100: 20, f100: 5 },
      { name: 'B', amount: 200, unit: 'g', kcal100: 50,  p100: 5,  c100: 10, f100: 2 },
    ]);
    expect(r.kcal).toBe(200);        // 100 + 100
    expect(r.protein).toBe(20.0);   // 10 + 10
    expect(r.carbs).toBe(40.0);     // 20 + 20
    expect(r.fat).toBe(9.0);        // 5 + 4
    expect(r.totalGramm).toBe(300);
    expect(r.missingCount).toBe(0);
  });

  it('Mischung mit/ohne Makros → missingCount > 0', () => {
    const r = calcRecipeMacrosFromIngredients([ingMit, ingOhne]);
    expect(r.kcal).toBe(100);
    expect(r.missingCount).toBe(1);
    expect(r.totalGramm).toBe(100);
  });

  it('keine Zutat mit Makros → null', () => {
    expect(calcRecipeMacrosFromIngredients([ingOhne, ingOhne])).toBeNull();
  });

  it('leeres Array → null', () => {
    expect(calcRecipeMacrosFromIngredients([])).toBeNull();
  });

  it('Zutat mit nur kcal100 (fehlende p/c/f) → missingCount 1', () => {
    const r = calcRecipeMacrosFromIngredients([
      { name: 'A', amount: 100, unit: 'g', kcal100: 100, p100: 10, c100: 20, f100: 5 },
      { name: 'B', amount: 50, unit: 'g', kcal100: 80 },
    ]);
    expect(r.kcal).toBe(100);   // nur A berechnet
    expect(r.missingCount).toBe(1);
  });
});

describe('getRecipeMacros', () => {
  it('Legacy-Rezept (kein macroMode) → recipe.kcal etc., totalGramm null', () => {
    const r = getRecipeMacros({ kcal: 400, protein: 30, carbs: 50, fat: 10 });
    expect(r).toEqual({ kcal: 400, protein: 30, carbs: 50, fat: 10, totalGramm: null, missingCount: 0 });
  });

  it('macroMode manual → recipe.kcal etc.', () => {
    const r = getRecipeMacros({ kcal: 300, protein: 25, carbs: 40, fat: 8, macroMode: 'manual' });
    expect(r.kcal).toBe(300);
    expect(r.totalGramm).toBeNull();
  });

  it('macroMode ingredients mit Zutaten-Makros → Berechnung', () => {
    const recipe = {
      macroMode: 'ingredients',
      kcal: 0, protein: 0, carbs: 0, fat: 0,
      ingredients: [
        { name: 'A', amount: 100, unit: 'g', kcal100: 100, p100: 10, c100: 20, f100: 5 },
      ],
    };
    const r = getRecipeMacros(recipe);
    expect(r.kcal).toBe(100);
    expect(r.protein).toBe(10);
    expect(r.totalGramm).toBe(100);
    expect(r.missingCount).toBe(0);
  });

  it('macroMode ingredients ohne Zutaten-Makros → Fallback auf recipe.kcal', () => {
    const recipe = {
      macroMode: 'ingredients',
      kcal: 250, protein: 20, carbs: 30, fat: 7,
      ingredients: [{ name: 'Salz', amount: 5, unit: 'g' }],
    };
    const r = getRecipeMacros(recipe);
    expect(r.kcal).toBe(250);
    expect(r.totalGramm).toBeNull();
  });
});

describe('scaleRecipeMacros — grammPerPortion', () => {
  it('Legacy-Rezept → grammPerPortion null', () => {
    const r = scaleRecipeMacros({ kcal: 400, protein: 40, carbs: 30, fat: 10, servings: 1 }, 1);
    expect(r.grammPerPortion).toBeNull();
  });

  it('ingredients-Rezept → grammPerPortion berechnet', () => {
    const recipe = {
      macroMode: 'ingredients',
      servings: 2,
      kcal: 0, protein: 0, carbs: 0, fat: 0,
      ingredients: [
        { name: 'A', amount: 200, unit: 'g', kcal100: 100, p100: 10, c100: 20, f100: 5 },
      ],
    };
    // totalGramm = 200, servings = 2 → grammPerPortion = 100 pro Portion
    const r = scaleRecipeMacros(recipe, 1);
    expect(r.grammPerPortion).toBe(100);

    const r2 = scaleRecipeMacros(recipe, 2);
    expect(r2.grammPerPortion).toBe(200);
  });
});
