import { describe, it, expect } from 'vitest';
import { filterTrackerSearch } from '../../../js/calc/trackerSearch.js';

// ── Fixtures ────────────────────────────────────────────────────────────────

const FOODS = [
  { id: 'f1', name: 'Magerquark',    updatedAt: 4000 },
  { id: 'f2', name: 'Haferflocken',  updatedAt: 3000 },
  { id: 'f3', name: 'Eier',          updatedAt: 2000 },
  { id: 'f4', name: 'Hähnchenbrust', updatedAt: 1000 },
];

const MEALS = [
  { id: 'm1', name: 'Protein-Frühstück', lastUsed: 4000 },
  { id: 'm2', name: 'Mittag Bowl',       lastUsed: 3000 },
  { id: 'm3', name: 'Abend-Snack',       lastUsed: 2000 },
  { id: 'm4', name: 'Pre-Workout Shake', lastUsed: 1000 },
];

const RECIPES = [
  { id: 'r1', name: 'Haferbrei mit Früchten', ingredients: [{ name: 'Haferflocken', isMain: true }] },
  { id: 'r2', name: 'Hähnchen Bowl',          ingredients: [{ name: 'Hähnchenbrust', isMain: true }] },
  { id: 'r3', name: 'Quark-Parfait',          ingredients: [{ name: 'Magerquark', isMain: true }] },
];

function run(query, opts = {}) {
  return filterTrackerSearch({
    query,
    favorites: opts.favorites ?? FOODS,
    meals:     opts.meals     ?? MEALS,
    recipes:   opts.recipes   ?? RECIPES,
    maxPerGroup: opts.maxPerGroup,
  });
}

// ── Quick-Modus (0–1 Zeichen) ───────────────────────────────────────────────

describe('filterTrackerSearch — Quick-Modus', () => {
  it('leere Query → mode quick', () => {
    expect(run('').mode).toBe('quick');
  });

  it('1-Zeichen-Query → mode quick (kein Filtern bei kurzer Eingabe)', () => {
    expect(run('Q').mode).toBe('quick');
  });

  it('leere Query → Lebensmittel sortiert nach updatedAt desc, max 3', () => {
    const { foods, foodsTotal } = run('');
    expect(foods.map(f => f.id)).toEqual(['f1', 'f2', 'f3']);
    expect(foodsTotal).toBe(4);
  });

  it('leere Query → Mahlzeiten sortiert nach lastUsed desc, max 3', () => {
    const { meals, mealsTotal } = run('');
    expect(meals.map(m => m.id)).toEqual(['m1', 'm2', 'm3']);
    expect(mealsTotal).toBe(4);
  });

  it('leere Query → keine Rezepte', () => {
    const { recipes, recipesTotal } = run('');
    expect(recipes).toEqual([]);
    expect(recipesTotal).toBe(0);
  });

  it('1-Zeichen-Query → weiterhin keine Rezepte', () => {
    expect(run('H').recipes).toEqual([]);
  });

  it('Mahlzeit ohne lastUsed fällt auf updatedAt zurück', () => {
    const meals = [
      { id: 'mx', name: 'Neu', updatedAt: 9999 },
      { id: 'my', name: 'Alt', lastUsed: 1 },
    ];
    const { meals: result } = run('', { meals });
    expect(result[0].id).toBe('mx');
  });

  it('Lebensmittel ohne updatedAt fällt auf createdAt zurück', () => {
    const favorites = [
      { id: 'fx', name: 'Neu', createdAt: 9999 },
      { id: 'fy', name: 'Alt', updatedAt: 1 },
    ];
    const { foods } = run('', { favorites });
    expect(foods[0].id).toBe('fx');
  });

  it('leere Datenbank → leere Ergebnisse ohne Fehler', () => {
    const result = run('', { favorites: [], meals: [], recipes: [] });
    expect(result.foods).toEqual([]);
    expect(result.meals).toEqual([]);
    expect(result.recipes).toEqual([]);
    expect(result.foodsTotal).toBe(0);
    expect(result.mealsTotal).toBe(0);
    expect(result.recipesTotal).toBe(0);
  });
});

// ── Such-Modus (ab 2 Zeichen) ───────────────────────────────────────────────

describe('filterTrackerSearch — Such-Modus', () => {
  it('2-Zeichen-Query → mode search', () => {
    expect(run('Qu').mode).toBe('search');
  });

  it('Lebensmittel-Filter case-insensitiv', () => {
    const { foods } = run('quark');
    expect(foods.map(f => f.id)).toEqual(['f1']); // Magerquark
  });

  it('Mahlzeiten-Filter case-insensitiv', () => {
    const { meals } = run('protein');
    expect(meals.map(m => m.id)).toEqual(['m1']); // Protein-Frühstück
  });

  it('Rezepte-Filter case-insensitiv nach Rezeptname', () => {
    const { recipes } = run('hähnchen');
    expect(recipes.map(r => r.id)).toEqual(['r2']); // Hähnchen Bowl
  });

  it('Rezepte-Filter nach Zutatennamen wenn Name kein Treffer', () => {
    // "Magerquark" ist Zutatenname von Quark-Parfait, aber kein Rezeptname
    const { recipes } = run('magerquark');
    const ids = recipes.map(r => r.id);
    expect(ids).toContain('r3'); // Quark-Parfait via Zutat
  });

  it('maxPerGroup begrenzt jede Gruppe; Total enthält echte Gesamtmenge', () => {
    const { foods, foodsTotal } = run('e', { maxPerGroup: 2 });
    // "Haferflocken", "Eier", "Hähnchenbrust" enthalten alle 'e' — 3 Treffer, max 2 zurück
    expect(foods.length).toBe(2);
    expect(foodsTotal).toBeGreaterThan(2);
  });

  it('Query ohne Treffer → alle Gruppen leer, alle Totals 0', () => {
    const { foods, meals, recipes, foodsTotal, mealsTotal, recipesTotal } = run('zzzzz');
    expect(foods).toEqual([]);
    expect(meals).toEqual([]);
    expect(recipes).toEqual([]);
    expect(foodsTotal).toBe(0);
    expect(mealsTotal).toBe(0);
    expect(recipesTotal).toBe(0);
  });

  it('Treffer in nur einer Gruppe → andere Gruppen leer, nicht undefined', () => {
    const { foods, meals, recipes } = run('Workout');
    // Nur Mahlzeit "Pre-Workout Shake" trifft
    expect(meals.length).toBeGreaterThan(0);
    expect(foods).toEqual([]);
    expect(recipes).toEqual([]);
  });

  it('Query trifft Whitespace-bereinigt (trim)', () => {
    expect(run('  quark  ').mode).toBe('search');
    expect(run('  quark  ').foods[0]?.id).toBe('f1');
  });
});
