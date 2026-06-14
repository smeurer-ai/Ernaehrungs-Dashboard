/**
 * Bestimmt den initialen Slot für RecipeToTrackerModal.
 * Priorität: defaultSlot → recipe.mealSlot → slotsToUse[0]
 */
export function resolveRecipeSlot(slotsToUse, defaultSlot, recipeMealSlot) {
  if (defaultSlot && slotsToUse.includes(defaultSlot)) return defaultSlot;
  if (recipeMealSlot && slotsToUse.includes(recipeMealSlot)) return recipeMealSlot;
  return slotsToUse[0];
}

export const UNIT_GRAM_DEFAULTS = {
  'ml':      1.0,
  'EL':      15,
  'TL':       5,
  'Stk':     null,
  'Packung': null,
  'Scheibe': 25,
  'Dose':    400,
  'Portion': null,
};

/**
 * Berechnet Makros einer einzelnen Zutat.
 * Gibt null zurück wenn Makros oder Gramm-Äquivalent fehlen.
 */
export function calcIngredientMacros(ingredient) {
  const { amount, unit, kcal100, p100, c100, f100, grammEquivalent } = ingredient;
  if (kcal100 == null || p100 == null || c100 == null || f100 == null) return null;

  let gramm;
  if (unit === 'g') {
    gramm = amount;
  } else if (unit === 'ml') {
    gramm = amount * 1.0;
  } else {
    const equiv = grammEquivalent ?? UNIT_GRAM_DEFAULTS[unit] ?? null;
    if (equiv == null) return null;
    gramm = amount * equiv;
  }

  const factor = gramm / 100;
  return {
    kcal:  Math.round((kcal100 ?? 0) * factor),
    p:     Math.round((p100   ?? 0) * factor * 10) / 10,
    c:     Math.round((c100   ?? 0) * factor * 10) / 10,
    f:     Math.round((f100   ?? 0) * factor * 10) / 10,
    gramm: Math.round(gramm),
  };
}

/**
 * Summiert Makros aller Zutaten mit bekannten Makros.
 * Gibt null zurück wenn keine Zutat Makros hat.
 */
export function calcRecipeMacrosFromIngredients(ingredients) {
  let kcal = 0, protein = 0, carbs = 0, fat = 0, totalGramm = 0;
  let countWith = 0, countWithout = 0;

  for (const ing of ingredients) {
    const m = calcIngredientMacros(ing);
    if (m == null) {
      countWithout++;
    } else {
      kcal       += m.kcal;
      protein    += m.p;
      carbs      += m.c;
      fat        += m.f;
      totalGramm += m.gramm;
      countWith++;
    }
  }

  if (countWith === 0) return null;

  return {
    kcal:         Math.round(kcal),
    protein:      Math.round(protein * 10) / 10,
    carbs:        Math.round(carbs   * 10) / 10,
    fat:          Math.round(fat     * 10) / 10,
    totalGramm:   Math.round(totalGramm),
    missingCount: countWithout,
  };
}

/**
 * Beschreibt, warum eine Zutat (nicht) in die Makro-Summe eingeht.
 * Grundlage für die Status-Zeile pro Zutat im RecipeEditor.
 * @returns {{ status: 'ok'|'no-macros'|'missing-gram-equivalent', macros: ?object }}
 */
export function ingredientMacroStatus(ingredient) {
  const hasMacros = ingredient.kcal100 != null && ingredient.p100 != null
                 && ingredient.c100   != null && ingredient.f100 != null;
  if (!hasMacros) return { status: 'no-macros', macros: null };

  const macros = calcIngredientMacros(ingredient);
  if (macros == null) return { status: 'missing-gram-equivalent', macros: null };
  return { status: 'ok', macros };
}

/**
 * Liefert effektive Makros eines Rezepts.
 * Abstrahiert über macroMode — Aufrufer muss macroMode nicht kennen.
 */
export function getRecipeMacros(recipe) {
  if (recipe.macroMode === 'ingredients') {
    const calc = calcRecipeMacrosFromIngredients(recipe.ingredients ?? []);
    if (calc) return calc;
  }
  return {
    kcal:        recipe.kcal    ?? 0,
    protein:     recipe.protein ?? 0,
    carbs:       recipe.carbs   ?? 0,
    fat:         recipe.fat     ?? 0,
    totalGramm:  null,
    missingCount: 0,
  };
}

/**
 * Skaliert Rezept-Makros auf eine gegebene Portionszahl.
 * Bestehende Aufrufer sind kompatibel (additiv: grammPerPortion ist neues Feld).
 */
export function scaleRecipeMacros(recipe, portions) {
  const macros = getRecipeMacros(recipe);
  const factor = portions / (recipe.servings ?? 1);
  return {
    kcal: Math.round(macros.kcal    * factor),
    p:    Math.round(macros.protein * factor * 10) / 10,
    c:    Math.round(macros.carbs   * factor * 10) / 10,
    f:    Math.round(macros.fat     * factor * 10) / 10,
    grammPerPortion: macros.totalGramm != null
      ? Math.round(macros.totalGramm / (recipe.servings ?? 1) * portions)
      : null,
  };
}
