/**
 * Reine Suchfunktion für die Tracker Universal-Suche.
 * Kein DOM, kein React — direkt testbar.
 *
 * Modus 'quick'  (query.trim().length < 2):
 *   Mahlzeiten  — sortiert nach lastUsed ?? updatedAt ?? 0 desc, max maxPerGroup
 *   Lebensmittel — sortiert nach updatedAt ?? createdAt ?? 0 desc, max maxPerGroup
 *   Rezepte     — immer leer
 *
 * Modus 'search' (query.trim().length >= 2):
 *   Alle 3 Gruppen case-insensitiv nach Namen gefiltert;
 *   Rezepte zusätzlich auch nach Zutatennamen.
 *
 * @param {{
 *   query:       string,
 *   favorites:   Array<{id: string, name: string, updatedAt?: number, createdAt?: number}>,
 *   meals:       Array<{id: string, name: string, lastUsed?: number, updatedAt?: number}>,
 *   recipes:     Array<{id: string, name: string, ingredients?: Array<{name?: string}>}>,
 *   maxPerGroup?: number,
 * }} opts
 * @returns {{
 *   mode:         'quick' | 'search',
 *   foods:        object[],
 *   meals:        object[],
 *   recipes:      object[],
 *   foodsTotal:   number,
 *   mealsTotal:   number,
 *   recipesTotal: number,
 * }}
 */
export function filterTrackerSearch({ query, favorites, meals, recipes, maxPerGroup = 3 }) {
  const q = query.trim().toLowerCase();

  if (q.length < 2) {
    const sortedFoods = [...favorites].sort(
      (a, b) => (b.updatedAt ?? b.createdAt ?? 0) - (a.updatedAt ?? a.createdAt ?? 0),
    );
    const sortedMeals = [...meals].sort(
      (a, b) => (b.lastUsed ?? b.updatedAt ?? 0) - (a.lastUsed ?? a.updatedAt ?? 0),
    );
    return {
      mode: 'quick',
      foods:        sortedFoods.slice(0, maxPerGroup),
      meals:        sortedMeals.slice(0, maxPerGroup),
      recipes:      [],
      foodsTotal:   sortedFoods.length,
      mealsTotal:   sortedMeals.length,
      recipesTotal: 0,
    };
  }

  const matchFoods   = favorites.filter(f => f.name.toLowerCase().includes(q));
  const matchMeals   = meals.filter(m => m.name.toLowerCase().includes(q));
  const matchRecipes = recipes.filter(r =>
    r.name.toLowerCase().includes(q) ||
    (r.ingredients ?? []).some(ing => ing.name?.toLowerCase().includes(q)),
  );

  return {
    mode: 'search',
    foods:        matchFoods.slice(0, maxPerGroup),
    meals:        matchMeals.slice(0, maxPerGroup),
    recipes:      matchRecipes.slice(0, maxPerGroup),
    foodsTotal:   matchFoods.length,
    mealsTotal:   matchMeals.length,
    recipesTotal: matchRecipes.length,
  };
}
