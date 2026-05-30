/**
 * Katch-McArdle Berechnungen für Grundumsatz (BMR).
 * Spezialisiert auf postmenopausale Frauen mit höherer Genauigkeit.
 * @module calc/bmr
 */

/**
 * Berechnet die fettfreie Masse (Lean Body Mass, LBM).
 * Formel: LBM = Körpergewicht × (1 - Körperfettanteil/100)
 *
 * @param {number} weight - Körpergewicht in Kilogramm
 * @param {number} bodyFat - Körperfettanteil in Prozent (z.B. 46.6)
 * @returns {number} Fettfreie Masse in kg, gerundet auf 2 Dezimalstellen
 *
 * @example
 * calcLeanMass(100, 46.6) // → 53.40 kg
 */
export function calcLeanMass(weight, bodyFat) {
  return Math.round(weight * (1 - bodyFat / 100) * 100) / 100;
}

/**
 * Berechnet den Grundumsatz (Basal Metabolic Rate, BMR) nach Katch-McArdle.
 * Diese Formel ist exakt und berücksichtigt nur die fettfreie Masse,
 * nicht Alter oder Geschlecht, weshalb sie für heterogene Gruppen ideal ist.
 *
 * Formel: BMR = 370 + 21.6 × LBM
 * Einheit: kcal pro Tag
 *
 * @param {number} leanMass - Fettfreie Masse in Kilogramm
 * @returns {number} Grundumsatz in kcal/Tag, ganzzahlig gerundet
 *
 * @example
 * calcBMR(53.40)  // → 1523 kcal
 * calcBMR(54.92)  // → 1556 kcal
 */
export function calcBMR(leanMass) {
  return Math.round(370 + 21.6 * leanMass);
}
