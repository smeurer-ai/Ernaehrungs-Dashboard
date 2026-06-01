/**
 * Makronährstoff-Berechnungen für Ernährungsplanung.
 * Berechnet TDEE, Protein-Ziele und Makro-Verteilung nach Profil.
 * @module calc/macros
 */

/**
 * Berechnet den Tagesumsatz (Total Daily Energy Expenditure, TDEE).
 * TDEE = BMR × Aktivitätsfaktor
 *
 * Typische Faktoren:
 *   1.2-1.3: Sedentär (wenig Bewegung)
 *   1.4-1.5: Leicht aktiv (2-3×/Woche Training)
 *   1.6-1.7: Moderat aktiv (4-5×/Woche)
 *   1.8-1.9: Sehr aktiv (tägliches Training)
 *
 * @param {number} bmr - Grundumsatz in kcal/Tag
 * @param {number} factor - Aktivitätsfaktor (1.2-1.9)
 * @returns {number} Tagesumsatz in kcal, ganzzahlig gerundet
 *
 * @example
 * calcTDEE(1523, 1.5) // → 2285  (Math.round(2284.5) = 2285, nicht 2284)
 * calcTDEE(1000, 1.5) // → 1500
 */
export function calcTDEE(bmr, factor) {
  return Math.round(bmr * factor);
}

/**
 * Berechnet das individuelle Protein-Zielgewicht basierend auf Profil-Modus.
 *
 * @param {Object} profile - Profil-Objekt mit Protein-Einstellungen
 * @param {string} profile.proteinTargetMode - Berechnungsmodus:
 *   'perKgBodyweight': g/kg Körpergewicht
 *   'perKgLeanMass': g/kg fettfreie Masse (besser für Muskelaufbau/-schutz)
 *   'fixed': Absoluter Wert in Gramm
 * @param {number} profile.weight - Körpergewicht in kg (benötigt für 'perKgBodyweight')
 * @param {number} profile.leanMass - Fettfreie Masse in kg (benötigt für 'perKgLeanMass')
 * @param {number} profile.proteinPerKg - Protein pro kg oder Gesamtwert
 * @returns {number} Protein-Zielgewicht in Gramm, ganzzahlig gerundet
 *
 * @example
 * // Szenario 1: 1.8 g/kg Körpergewicht bei 100 kg
 * calcProteinTarget({
 *   proteinTargetMode: 'perKgBodyweight',
 *   weight: 100,
 *   proteinPerKg: 1.8
 * }) // → 180 g
 *
 * // Szenario 2: 2.2 g/kg fettfreie Masse bei 53.4 kg LBM
 * calcProteinTarget({
 *   proteinTargetMode: 'perKgLeanMass',
 *   leanMass: 53.4,
 *   proteinPerKg: 2.2
 * }) // → 117 g
 *
 * // Szenario 3: Festes Ziel 130 g/Tag
 * calcProteinTarget({
 *   proteinTargetMode: 'fixed',
 *   proteinPerKg: 130
 * }) // → 130 g
 */
export function calcProteinTarget(profile) {
  const { proteinTargetMode, weight, leanMass, proteinPerKg } = profile;

  switch (proteinTargetMode) {
    case 'perKgBodyweight':
      return Math.round(weight * proteinPerKg);
    case 'perKgLeanMass':
      return Math.round(leanMass * proteinPerKg);
    case 'fixed':
      return Math.round(proteinPerKg);
    default:
      throw new Error(`Unbekannter proteinTargetMode: ${proteinTargetMode}`);
  }
}

/**
 * Berechnet die tägliche Makro-Verteilung (Protein, Fett, Kohlenhydrate).
 * Reihenfolge der Berechnung:
 *   1. Protein fest (nach Profil)
 *   2. Fett nach % der restlichen Kalorien
 *   3. Kohlenhydrate als Rest
 *
 * @param {Object} profile - Profil mit Protein- und Fetteinstellungen
 * @param {number} totalKcal - Gesamte verfügbare Kalorien
 * @returns {Object} Makro-Verteilung
 * @returns {number} returns.kcal - Gesamtkalorien
 * @returns {number} returns.protein - Protein in Gramm
 * @returns {number} returns.fat - Fett in Gramm
 * @returns {number} returns.carbs - Kohlenhydrate in Gramm
 *
 * @example
 * calcMacros({
 *   proteinTargetMode: 'perKgLeanMass',
 *   leanMass: 53.4,
 *   proteinPerKg: 2.2,
 *   fatPercent: 0.28
 * }, 2000)
 * // → { kcal: 2000, protein: 117, fat: 62, carbs: 244 }
 * //   protein: Math.round(53.4 × 2.2) = 117g → 468 kcal
 * //   fat:     Math.round(2000 × 0.28 / 9) = 62g → 558 kcal
 * //   carbs:   Math.round((2000 - 468 - 558) / 4) = 244g
 */
export function calcMacros(profile, totalKcal) {
  const protein = calcProteinTarget(profile);
  const proteinKcal = protein * 4;

  const fat = Math.round((totalKcal * profile.fatPercent) / 9);
  const fatKcal = fat * 9;

  const carbsKcal = totalKcal - proteinKcal - fatKcal;
  const carbs = Math.max(0, Math.round(carbsKcal / 4));

  return {
    kcal: totalKcal,
    protein,
    fat,
    carbs
  };
}

/**
 * Verteilt die täglichen Makros auf einzelne Mahlzeiten basierend auf Templates.
 * Jedes Template definiert seinen Anteil (in %) an den Gesamtmakros.
 *
 * @param {Array<Object>} mealTemplates - Array von Mahlzeit-Templates
 * @param {string} mealTemplates[].label - Mahlzeit-Name (z.B. "Frühstück")
 * @param {string} mealTemplates[].time - Uhrzeit (z.B. "07:00")
 * @param {string} mealTemplates[].icon - Icon-Name
 * @param {string} [mealTemplates[].note] - Optionale Notiz
 * @param {number} mealTemplates[].kP - Kalorienanteil (0-1)
 * @param {number} mealTemplates[].pP - Protein-Anteil (0-1)
 * @param {number} mealTemplates[].cP - Kohlenhydrat-Anteil (0-1)
 * @param {number} mealTemplates[].fP - Fett-Anteil (0-1)
 * @param {Object} totalMacros - Tägliche Makros
 * @param {number} totalMacros.kcal - Gesamtkalorien
 * @param {number} totalMacros.protein - Gesamt-Protein in g
 * @param {number} totalMacros.carbs - Gesamt-Kohlenhydrate in g
 * @param {number} totalMacros.fat - Gesamt-Fett in g
 * @returns {Array<Object>} Array von Mahlzeiten mit berechneten Makros
 * @returns {string} returns[].label - Mahlzeit-Name
 * @returns {string} returns[].time - Uhrzeit
 * @returns {string} returns[].icon - Icon
 * @returns {string} [returns[].note] - Notiz
 * @returns {number} returns[].kcal - Kalorienanteil der Mahlzeit
 * @returns {number} returns[].protein - Protein in g für diese Mahlzeit
 * @returns {number} returns[].carbs - Kohlenhydrate in g
 * @returns {number} returns[].fat - Fett in g
 *
 * @example
 * const templates = [
 *   { label: 'Frühstück', time: '07:00', icon: 'breakfast', kP: 0.25, pP: 0.22, cP: 0.28, fP: 0.25 },
 *   { label: 'Mittag', time: '12:30', icon: 'lunch', kP: 0.35, pP: 0.35, cP: 0.35, fP: 0.35 }
 * ];
 * const macros = { kcal: 2000, protein: 130, carbs: 220, fat: 70 };
 * distributeMacrosPerMeal(templates, macros)
 * // → [
 * //   { label: 'Frühstück', time: '07:00', icon: 'breakfast', kcal: 500, protein: 29, carbs: 62, fat: 18 },
 * //   { label: 'Mittag', time: '12:30', icon: 'lunch', kcal: 700, protein: 46, carbs: 77, fat: 25 }
 * // ]
 */
export function distributeMacrosPerMeal(mealTemplates, totalMacros) {
  return mealTemplates.map(template => ({
    label: template.label,
    time: template.time,
    icon: template.icon,
    ...(template.note && { note: template.note }),
    kcal: Math.round(totalMacros.kcal * template.kP),
    protein: Math.round(totalMacros.protein * template.pP),
    carbs: Math.round(totalMacros.carbs * template.cP),
    fat: Math.round(totalMacros.fat * template.fP)
  }));
}

/**
 * Berechnet die Differenz zwischen Ziel und Konsum für alle Makros.
 * Positive Werte = noch verfügbar, negative = überschritten.
 *
 * @param {Object} target - Ziel-Makros
 * @param {number} target.kcal - Ziel-Kalorien
 * @param {number} target.protein - Ziel-Protein in g
 * @param {number} target.carbs - Ziel-Kohlenhydrate in g
 * @param {number} target.fat - Ziel-Fett in g
 * @param {Object} consumed - Konsumierte Makros (gleiche Struktur)
 * @returns {Object} Differenz-Objekt (target - consumed)
 * @returns {number} returns.kcal - Verbleibende Kalorien
 * @returns {number} returns.protein - Verbleibendes Protein in g
 * @returns {number} returns.carbs - Verbleibende Kohlenhydrate in g
 * @returns {number} returns.fat - Verbleibendes Fett in g
 *
 * @example
 * calcGap(
 *   { kcal: 2000, protein: 130, carbs: 220, fat: 70 },
 *   { kcal: 1200, protein: 85, carbs: 140, fat: 42 }
 * )
 * // → { kcal: 800, protein: 45, carbs: 80, fat: 28 }
 *
 * // Wenn überschritten:
 * calcGap(
 *   { kcal: 2000, protein: 130, carbs: 220, fat: 70 },
 *   { kcal: 2100, protein: 140, carbs: 250, fat: 75 }
 * )
 * // → { kcal: -100, protein: -10, carbs: -30, fat: -5 }
 */
export function calcGap(target, consumed) {
  return {
    kcal: target.kcal - consumed.kcal,
    protein: target.protein - consumed.protein,
    carbs: target.carbs - consumed.carbs,
    fat: target.fat - consumed.fat
  };
}
