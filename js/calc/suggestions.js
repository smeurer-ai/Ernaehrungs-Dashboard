/**
 * Proteinpriorisierte Vorschläge bei Tagesziel-Lücken (Phase 5d).
 * Pure Funktionen — kein DOM, kein State.
 * Spec-Funktionen #30/#31/#42/#43: Notvorrat + Kühlschrank bevorzugt,
 * Abend-Casein hervorgehoben, Kalorienbremse gegen Tagesziel-Sprengung.
 * @module calc/suggestions
 */

const CASEIN_RE = /(quark|skyr|casein|hüttenkäse|huettenkaese|cottage)/;

/** Heuristik: ist das Lebensmittel eine Casein-Quelle (nächtliche MPS)? */
export function isCaseinSource(name) {
  return CASEIN_RE.test(String(name ?? '').toLowerCase());
}

function normalize(s) {
  return String(s ?? '').trim().toLowerCase();
}

/**
 * Berechnet die Top-Vorschläge für die verbleibende Tageslücke.
 *
 * @param {{
 *   gap: {kcal:number, p:number},          // verbleibende Tageslücke
 *   isEvening?: boolean,                    // ab 17 Uhr → Casein-Bonus
 *   favorites?: Array,                      // FavoriteFood[] (Makros/100g)
 *   meals?: Array,                          // SavedMeal[] (totalMacros absolut)
 *   fridgeItems?: Array,                    // FridgeItem[]
 *   maxResults?: number,
 * }} params
 * @returns {Array<{kind:'favorite'|'meal', item:object, reason:string, p:number, kcal:number, score:number}>}
 *   Leer wenn Protein-Lücke < 10g (kein Rauschen).
 */
export function computeGapSuggestions({ gap, isEvening = false, favorites = [], meals = [], fridgeItems = [], maxResults = 4 }) {
  if (!gap || (gap.p ?? 0) < 10) return [];

  const fridgeNames = fridgeItems.map(f => normalize(f.foodName)).filter(Boolean);
  const inFridge = (name) => {
    const n = normalize(name);
    return n !== '' && fridgeNames.some(fn => fn.includes(n) || n.includes(fn));
  };

  function scoreCandidate(kind, item, name, kcal, p, isNotvorrat) {
    // Basis: Proteindichte (g Protein pro 100 kcal) — proteinreich vor kalorienreich
    let score = kcal > 0 ? (p / kcal) * 100 : p;
    let reason = '💪 proteinreich';

    if (isEvening && isCaseinSource(name)) { score += 20; reason = '🌙 Casein für die Nacht'; }
    if (inFridge(name))                    { score += 30; reason = '❄ im Kühlschrank'; }
    if (isNotvorrat)                       { score += 30; reason = '⭐ Notvorrat'; }

    // Kalorienbremse: Kandidat sprengt die verbleibende Tageslücke deutlich
    if ((gap.kcal ?? 0) > 0 && kcal > 1.3 * gap.kcal) score -= 50;

    return { kind, item, reason, p, kcal, score };
  }

  const candidates = [];
  for (const fav of favorites) {
    const p = fav.p100 ?? 0;
    if (p <= 0) continue;
    candidates.push(scoreCandidate('favorite', fav, fav.name, fav.kcal100 ?? 0, p, !!fav.isNotvorrat));
  }
  for (const meal of meals) {
    const t = meal.totalMacros ?? {};
    const p = t.p ?? 0;
    if (p <= 0) continue;
    candidates.push(scoreCandidate('meal', meal, meal.name, t.kcal ?? 0, p, false));
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}
