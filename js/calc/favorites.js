/**
 * Reine Hilfsfunktionen für Favoriten-Filterung und -Sortierung.
 * Kein DOM, kein React — direkt testbar.
 * @module calc/favorites
 */

const MAX_RESULTS = 8;

/**
 * Filtert und sortiert Favoriten für den FavoritePicker.
 *
 * - Ohne Suchbegriff: die zuletzt aktualisierten Favoriten, max maxResults.
 * - Mit Suchbegriff: nach Name gefiltert (case-insensitiv), max maxResults.
 *
 * @param {Array<{id: string, name: string, updatedAt?: number}>} favorites
 * @param {string} query - Suchbegriff (ggf. leer)
 * @param {number} [maxResults]
 * @returns {{ items: typeof favorites, hasMore: boolean, total: number }}
 */
export function filterFavorites(favorites, query, maxResults = MAX_RESULTS) {
  const q = query.trim().toLowerCase();
  let candidates;

  if (!q) {
    candidates = [...favorites].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  } else {
    candidates = favorites.filter(f => f.name.toLowerCase().includes(q));
  }

  return {
    items: candidates.slice(0, maxResults),
    hasMore: candidates.length > maxResults,
    total: candidates.length,
  };
}
