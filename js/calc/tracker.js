/**
 * Berechnungsfunktionen für den Tracker-Tab.
 * Alle Funktionen sind pure — kein State, kein DOM.
 *
 * @module calc/tracker
 */

/**
 * Berechnet die Makronährstoffe eines Lebensmitteleintrags.
 *
 * Rundungsregeln:
 *   kcal → ganzzahlig (Math.round)
 *   p, c, f → 1 Dezimalstelle (Math.round(x * 10) / 10)
 *
 * @param {{ kcal100: number, p100: number, c100: number, f100: number }} food
 * @param {number} gramm - Menge in Gramm
 * @returns {{ kcal: number, p: number, c: number, f: number }}
 *
 * @example
 * calcTrackedFoodMacros({ kcal100: 72, p100: 12, c100: 4, f100: 0.2 }, 200)
 * // → { kcal: 144, p: 24, c: 8, f: 0.4 }
 */
/**
 * Aggregiert TrackedFood-Einträge zu Tages-Istwerten.
 * Übersetzt p/c/f → protein/carbs/fat für DaySummary-Kompatibilität.
 * Liefert rohe Summen ohne Rundung.
 *
 * @param {Array<{kcal?: number, p?: number, c?: number, f?: number}>} entries
 * @returns {{ kcal: number, protein: number, carbs: number, fat: number }}
 */
export function sumConsumed(entries) {
  return entries.reduce((acc, e) => ({
    kcal:    acc.kcal    + (e.kcal ?? 0),
    protein: acc.protein + (e.p    ?? 0),
    carbs:   acc.carbs   + (e.c    ?? 0),
    fat:     acc.fat     + (e.f    ?? 0),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}

/**
 * Gibt Protein-Summe je Mahlzeit-Slot zurück.
 * Lookup-Key entspricht meal.label in MealPlanEntry (z.B. "Frühstück").
 * Einträge ohne mealSlot landen unter "Sonstiges".
 *
 * @param {Array<{mealSlot?: string, p?: number}>} entries
 * @returns {Record<string, number>}
 */
export function groupProteinBySlot(entries) {
  return entries.reduce((acc, e) => {
    const slot = e.mealSlot || 'Sonstiges';
    return { ...acc, [slot]: (acc[slot] ?? 0) + (e.p ?? 0) };
  }, {});
}

export function calcTrackedFoodMacros(food, gramm) {
  const factor = gramm / 100;
  return {
    kcal: Math.round(food.kcal100 * factor),
    p:    Math.round(food.p100 * factor * 10) / 10,
    c:    Math.round(food.c100 * factor * 10) / 10,
    f:    Math.round(food.f100 * factor * 10) / 10,
  };
}
