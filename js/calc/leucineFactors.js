/**
 * Leucin-Schätzfaktoren aus Open-Food-Facts-Produktkategorien.
 * Alle Funktionen sind pure — kein DOM, kein State.
 * @module calc/leucineFactors
 */

/**
 * Regeln werden in Prioritätsreihenfolge geprüft. Erste Übereinstimmung gewinnt.
 * Höhere Proteinqualität → früher in der Liste.
 */
export const LEUCINE_CATEGORY_RULES = [
  { match: 'dairy',    leucinePct: 0.105, qualityScore: 0.95 },
  { match: 'cheese',   leucinePct: 0.105, qualityScore: 0.95 },
  { match: 'milk',     leucinePct: 0.105, qualityScore: 0.95 },
  { match: 'yogurt',   leucinePct: 0.105, qualityScore: 0.95 },
  { match: 'quark',    leucinePct: 0.105, qualityScore: 0.95 },
  { match: 'egg',      leucinePct: 0.088, qualityScore: 0.92 },
  { match: 'meat',     leucinePct: 0.095, qualityScore: 0.95 },
  { match: 'poultry',  leucinePct: 0.095, qualityScore: 0.95 },
  { match: 'chicken',  leucinePct: 0.095, qualityScore: 0.95 },
  { match: 'beef',     leucinePct: 0.095, qualityScore: 0.95 },
  { match: 'pork',     leucinePct: 0.095, qualityScore: 0.95 },
  { match: 'fish',     leucinePct: 0.092, qualityScore: 0.90 },
  { match: 'seafood',  leucinePct: 0.092, qualityScore: 0.90 },
  { match: 'soy',      leucinePct: 0.082, qualityScore: 0.78 },
  { match: 'tofu',     leucinePct: 0.082, qualityScore: 0.78 },
  { match: 'legume',   leucinePct: 0.078, qualityScore: 0.75 },
  { match: 'bean',     leucinePct: 0.078, qualityScore: 0.75 },
  { match: 'lentil',   leucinePct: 0.078, qualityScore: 0.75 },
  { match: 'grain',    leucinePct: 0.068, qualityScore: 0.50 },
  { match: 'bread',    leucinePct: 0.068, qualityScore: 0.50 },
  { match: 'cereal',   leucinePct: 0.068, qualityScore: 0.50 },
  { match: 'pasta',    leucinePct: 0.068, qualityScore: 0.50 },
  { match: 'rice',     leucinePct: 0.065, qualityScore: 0.45 },
];

/** Fallback wenn keine Kategorie erkannt wird. */
export const LEUCINE_DEFAULT = { leucinePct: 0.080, qualityScore: 0.70 };

/**
 * Gibt Leucin-Faktor und Proteinqualitäts-Score für eine Produktkategorie-Liste zurück.
 *
 * @param {string[]} categoriesTags - z.B. ["en:dairy", "en:fermented-foods"]
 * @returns {{ leucinePct: number, qualityScore: number }}
 */
export function estimateLeucineFactor(categoriesTags) {
  if (!categoriesTags || categoriesTags.length === 0) return LEUCINE_DEFAULT;
  const joined = categoriesTags.join(' ').toLowerCase();
  for (const rule of LEUCINE_CATEGORY_RULES) {
    if (joined.includes(rule.match)) {
      return { leucinePct: rule.leucinePct, qualityScore: rule.qualityScore };
    }
  }
  return LEUCINE_DEFAULT;
}

/**
 * Berechnet Leucin-Schätzung und MPS-Status für einen TrackedFood-Eintrag.
 *
 * @param {number} proteinG - Protein in g (für die eingetragene Portion)
 * @param {string[]} categoriesTags - Produktkategorien aus Open Food Facts
 * @returns {{ leucineEstimateG: number, proteinQualityScore: number, mpsTriggered: boolean }}
 */
export function computeMpsFields(proteinG, categoriesTags) {
  const { leucinePct, qualityScore } = estimateLeucineFactor(categoriesTags);
  const leucineEstimateG = Math.round(proteinG * leucinePct * 10) / 10;
  return {
    leucineEstimateG,
    proteinQualityScore: qualityScore,
    mpsTriggered: leucineEstimateG >= 3.0,
  };
}
