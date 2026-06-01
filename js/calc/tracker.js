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
export function calcTrackedFoodMacros(food, gramm) {
  const factor = gramm / 100;
  return {
    kcal: Math.round(food.kcal100 * factor),
    p:    Math.round(food.p100 * factor * 10) / 10,
    c:    Math.round(food.c100 * factor * 10) / 10,
    f:    Math.round(food.f100 * factor * 10) / 10,
  };
}
