/**
 * Rezept-Matching gegen den Kühlschrank-Inhalt (Phase 5c).
 * Pure Funktionen — kein DOM, kein State.
 * @module calc/matching
 */

function normalize(s) {
  return String(s ?? '').trim().toLowerCase();
}

/**
 * Prüft, ob die Hauptzutaten (●, isMain) eines Rezepts im Kühlschrank sind.
 * Substring-Matching in beide Richtungen („Hähnchenbrust" ↔ „Hähnchen") —
 * gleiche robuste Philosophie wie isMainMealSlot().
 *
 * @param {{ingredients?: Array<{name:string, isMain?:boolean}>}} recipe
 * @param {Array<{foodName:string}>} fridgeItems
 * @returns {{matches: boolean, missingMain: string[]}}
 *   matches=false wenn das Rezept keine Hauptzutaten hat (kein Treffer „aus Versehen")
 */
export function recipeMatchesFridge(recipe, fridgeItems) {
  const mains = (recipe?.ingredients ?? []).filter(i => i.isMain);
  if (mains.length === 0) return { matches: false, missingMain: [] };

  const fridgeNames = (fridgeItems ?? []).map(f => normalize(f.foodName)).filter(Boolean);
  const missingMain = [];

  for (const ing of mains) {
    const n = normalize(ing.name);
    const found = n !== '' && fridgeNames.some(fn => fn.includes(n) || n.includes(fn));
    if (!found) missingMain.push(ing.name);
  }

  return { matches: missingMain.length === 0, missingMain };
}
