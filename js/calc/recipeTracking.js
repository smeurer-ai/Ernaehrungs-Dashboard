/**
 * Skaliert Rezept-Makros auf eine gegebene Portionszahl.
 *
 * Die gespeicherten Makros (kcal, protein, carbs, fat) eines Rezepts beziehen
 * sich immer auf das Gesamtrezept (alle recipe.servings Portionen).
 *
 * @param {{ kcal: number, protein: number, carbs: number, fat: number, servings?: number }} recipe
 * @param {number} portions - Anzahl der zu loggenden Portionen
 * @returns {{ kcal: number, p: number, c: number, f: number }}
 */
export function scaleRecipeMacros(recipe, portions) {
  const factor = portions / (recipe.servings ?? 1);
  return {
    kcal: Math.round(recipe.kcal * factor),
    p:    Math.round(recipe.protein * factor * 10) / 10,
    c:    Math.round(recipe.carbs   * factor * 10) / 10,
    f:    Math.round(recipe.fat     * factor * 10) / 10,
  };
}
