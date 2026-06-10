/**
 * Reine Funktionen für Favoriten-Mahlzeiten (SavedMeal).
 * Kein DOM, kein State — direkt testbar.
 * @module calc/meals
 */

/**
 * Summiert die Makros aller MealItems.
 * Rundung wie calcTrackedFoodMacros: kcal ganzzahlig, p/c/f 1 Dezimalstelle.
 *
 * @param {Array<{kcal?:number,p?:number,c?:number,f?:number}>} items
 * @returns {{kcal:number,p:number,c:number,f:number}}
 */
export function computeMealTotals(items) {
  let kcal = 0, p = 0, c = 0, f = 0;
  for (const it of items ?? []) {
    kcal += it.kcal ?? 0;
    p    += it.p    ?? 0;
    c    += it.c    ?? 0;
    f    += it.f    ?? 0;
  }
  return {
    kcal: Math.round(kcal),
    p:    Math.round(p * 10) / 10,
    c:    Math.round(c * 10) / 10,
    f:    Math.round(f * 10) / 10,
  };
}

/**
 * Wandelt die Items einer SavedMeal in TrackedFood-Rohlinge für einen Slot um.
 * id und timestamp ergänzt der Aufrufer (UI-Schicht).
 *
 * @param {{items?:Array}} meal
 * @param {string} slot - Mahlzeit-Slot, in den eingetragen wird
 * @returns {Array<object>}
 */
export function mealItemsToTrackedFoods(meal, slot) {
  return (meal?.items ?? []).map(item => ({
    mealSlot: slot,
    foodRef:  item.foodRef || 'manual',
    foodName: item.foodName,
    gramm:    item.gramm,
    kcal:     item.kcal,
    p:        item.p,
    c:        item.c,
    f:        item.f,
  }));
}
