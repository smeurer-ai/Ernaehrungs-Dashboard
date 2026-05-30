/**
 * Kernlogik für postmenopausale Ernährungsoptimierung.
 * Spezialisiert auf Muscle-Preservation und anabole-Resistenz-Management.
 * @module calc/nutritionLogic
 */

/**
 * Bewertet das Kaloriendefizit auf Muskelschutz-Risiko.
 *
 * Postmenopausale Frauen haben eine anabole Resistenz, die restriktivere Defizite
 * erforderlich macht als bei jüngeren Frauen. Diese Funktion nutzt engere Schwellen:
 *
 * Schwellenwerte:
 *   ≤ 17%:     safe (minimal Muskelabbau-Risiko)
 *   17-22%:    moderate (akzeptabel mit ausreichend Protein + Training)
 *   22-30%:    aggressive (Warnung, erhöhtes Muskelabbau-Risiko)
 *   > 30%:     dangerous (kritisch, signifikanter Muskelabbau zu erwarten)
 *
 * @param {Object} profile - Nutzerprofil
 * @param {number} profile.deficit - Kaloriendefizit in kcal/Tag
 * @param {number} tdee - Tagesumsatz in kcal/Tag
 * @returns {Object} Bewertungsergebnis
 * @returns {number} returns.deficitKcal - Das berechnete Defizit in kcal
 * @returns {number} returns.percentOfTDEE - Defizit als Prozentsatz des TDEE (0-1)
 * @returns {string} returns.severity - Risiko-Level: 'safe' | 'moderate' | 'aggressive' | 'dangerous'
 * @returns {string} [returns.warning] - Warnung, falls severity nicht 'safe' oder 'moderate'
 *
 * @example
 * // TDEE = 2000 kcal, Defizit = 300 kcal (15%, safe)
 * assessDeficit({ deficit: 300 }, 2000)
 * // → { deficitKcal: 300, percentOfTDEE: 0.15, severity: 'safe' }
 *
 * @example
 * // TDEE = 2000 kcal, Defizit = 500 kcal (25%, aggressive)
 * assessDeficit({ deficit: 500 }, 2000)
 * // → {
 * //   deficitKcal: 500,
 * //   percentOfTDEE: 0.25,
 * //   severity: 'aggressive',
 * //   warning: "Defizit von 500 kcal (25% des Tagesumsatzes) ist für postmenopausale Frauen zu hoch..."
 * // }
 */
export function assessDeficit(profile, tdee) {
  const deficitKcal = profile.deficit;
  const percentOfTDEE = deficitKcal / tdee;

  // Postmenopausale Schwellen (enger als Standard-Empfehlungen)
  let severity, warning;

  if (percentOfTDEE <= 0.17) {
    severity = 'safe';
  } else if (percentOfTDEE <= 0.22) {
    severity = 'moderate';
  } else if (percentOfTDEE <= 0.30) {
    severity = 'aggressive';
    warning = `Defizit von ${deficitKcal} kcal (${Math.round(percentOfTDEE * 100)}% des Tagesumsatzes) ist für postmenopausale Frauen zu hoch. Risiko für Muskelabbau steigt. Empfehlung: max. ${Math.round(tdee * 0.20)} kcal Defizit.`;
  } else {
    severity = 'dangerous';
    warning = `Achtung: Defizit von ${deficitKcal} kcal (${Math.round(percentOfTDEE * 100)}% des Tagesumsatzes) ist gefährlich hoch. Bei postmenopausaler anaboler Resistenz droht erheblicher Muskelabbau. Bitte auf max. ${Math.round(tdee * 0.20)} kcal reduzieren.`;
  }

  const result = { deficitKcal, percentOfTDEE, severity };
  if (warning) {
    result.warning = warning;
  }
  return result;
}

/**
 * Bewertet die Protein-Qualität einer Einzelmahlzeit.
 *
 * STUB für Phase 1: Rückgabe mit Dummy-Daten.
 * Phase 3: Wird Leucin-Gehalt analysieren und detailliertes Feedback geben.
 *
 * @param {number} mealProteinG - Protein in dieser Mahlzeit in Gramm
 * @param {boolean} isMainMeal - true=Hauptmahlzeit (Frühstück/Mittag/Abendessen), false=Snack
 * @param {Object} profile - Nutzerprofil mit Protein-Schwellen
 * @returns {Object} Bewertungsergebnis
 * @returns {number} returns.proteinG - Input Protein-Menge
 * @returns {string} returns.leucineLikelihood - Stub: 'high' | 'medium' | 'low'
 * @returns {string} returns.rating - Stub: 'good' | 'borderline' | 'insufficient'
 * @returns {string} [returns.hint] - Stub: undefined in Phase 1
 *
 * @example
 * // Hauptmahlzeit mit 35g Protein
 * rateMealProtein(35, true, {})
 * // → { proteinG: 35, leucineLikelihood: 'high', rating: 'good', hint: undefined }
 */
export function rateMealProtein(mealProteinG, isMainMeal, profile) {
  return {
    proteinG: mealProteinG,
    leucineLikelihood: 'high',
    rating: mealProteinG >= 25 ? 'good' : mealProteinG >= 15 ? 'borderline' : 'insufficient',
    hint: undefined
  };
}

/**
 * Bewertet die tägliche Mahlzeit-Struktur auf Protein-Verteilung und Muskelschutz.
 *
 * STUB für Phase 1: Rückgabe mit Dummy-Daten (alle Werte 0, Array leer).
 * Phase 3: Wird analysieren:
 *   - Protein-Verteilung über Mahlzeiten (ideal: ≥ 30g in 3-4 Hauptmahlzeiten)
 *   - Abendprotein (kritisch für nächtliche Proteinsynthese)
 *   - Anzahl Mahlzeiten mit ausreichend Protein (≥ 25g)
 *   - Mahlzeitabstände und Timing
 *
 * @param {Array<Object>} dayLog - Array von Mahlzeiten-Log-Einträgen
 * @param {number} dayLog[].protein - Protein in dieser Mahlzeit (g)
 * @param {string} dayLog[].time - Zeitstempel
 * @param {Object} profile - Nutzerprofil
 * @param {string} dayType - Tagestyp: 'workout' | 'rest'
 * @returns {Object} Struktur-Bewertung
 * @returns {number} returns.totalProteinG - Stub: Gesamtprotein (wird in Phase 3 berechnet)
 * @returns {number} returns.proteinTargetG - Stub: Protein-Ziel
 * @returns {number} returns.mealsReachingThreshold - Stub: Anzahl Mahlzeiten mit ≥25g Protein
 * @returns {number} returns.totalMainMeals - Stub: Anzahl erkannter Hauptmahlzeiten
 * @returns {number} returns.eveningProteinG - Stub: Protein nach 17:00 Uhr
 * @returns {number} returns.proteinDistributionScore - Stub: Score 0-100
 * @returns {Array<string>} returns.flags - Stub: Leer in Phase 1
 *
 * @example
 * assessDayStructure([], {}, 'workout')
 * // → {
 * //   totalProteinG: 0,
 * //   proteinTargetG: 0,
 * //   mealsReachingThreshold: 0,
 * //   totalMainMeals: 0,
 * //   eveningProteinG: 0,
 * //   proteinDistributionScore: 0,
 * //   flags: []
 * // }
 */
export function assessDayStructure(dayLog, profile, dayType) {
  return {
    totalProteinG: 0,
    proteinTargetG: 0,
    mealsReachingThreshold: 0,
    totalMainMeals: 0,
    eveningProteinG: 0,
    proteinDistributionScore: 0,
    flags: []
  };
}
