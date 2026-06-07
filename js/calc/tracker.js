/**
 * Berechnungsfunktionen für den Tracker-Tab.
 * Alle Funktionen sind pure — kein State, kein DOM.
 *
 * @module calc/tracker
 */

import { isMainMealSlot, rateMealProtein } from './nutritionLogic.js';

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

/**
 * Gibt P/KH/F-Summen je Mahlzeit-Slot zurück.
 * Lookup-Key entspricht meal.label in MealPlanEntry (z.B. "Frühstück").
 * Einträge ohne mealSlot landen unter "Sonstiges".
 *
 * @param {Array<{mealSlot?: string, p?: number, c?: number, f?: number}>} entries
 * @returns {Record<string, {p: number, c: number, f: number}>}
 */
export function groupMacrosBySlot(entries) {
  return entries.reduce((acc, e) => {
    const slot = e.mealSlot || 'Sonstiges';
    const cur = acc[slot] ?? { p: 0, c: 0, f: 0 };
    return { ...acc, [slot]: { p: cur.p + (e.p ?? 0), c: cur.c + (e.c ?? 0), f: cur.f + (e.f ?? 0) } };
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

/**
 * Berechnet die MPS-Tages-Zusammenfassung aus den Tracker-Einträgen.
 *
 * Logik pro Slot:
 * 1. Wenn mindestens ein Eintrag `mpsTriggered` definiert hat → verwende diese OFD-Daten
 * 2. Fallback: schätze via rateMealProtein aus der Slot-Protein-Summe
 *
 * @param {Array<{mealSlot?: string, p?: number, mpsTriggered?: boolean}>} entries
 * @param {string[]} mealSlots - Sortierte Liste der Mahlzeit-Slots des Tages
 * @returns {{ mpsSlotsCount: number, totalActiveSlotsCount: number }}
 */
export function computeMpsSummary(entries, mealSlots) {
  const slotTotals = groupProteinBySlot(entries);
  let totalActiveSlotsCount = 0;
  let mpsSlotsCount = 0;

  for (const slot of mealSlots) {
    const slotEntries = entries.filter(e => e.mealSlot === slot);
    if (slotEntries.length === 0) continue;
    totalActiveSlotsCount++;

    // Protein-Basisschätzung: immer maßgebend — OFD kann nur verbessern, nie blockieren
    const protein = slotTotals[slot] ?? 0;
    const { rating } = rateMealProtein(protein, isMainMealSlot(slot), {});
    if (rating === 'good') { mpsSlotsCount++; continue; }

    // Protein nicht ausreichend → Leucin-Summe aus OFD-Einträgen als Verbesserung prüfen
    const offEntries = slotEntries.filter(e => e.leucineEstimateG !== undefined);
    if (offEntries.length > 0) {
      const leucineSum = offEntries.reduce((s, e) => s + (e.leucineEstimateG ?? 0), 0);
      if (leucineSum >= 3.0) mpsSlotsCount++;
    }
  }

  return { mpsSlotsCount, totalActiveSlotsCount };
}
