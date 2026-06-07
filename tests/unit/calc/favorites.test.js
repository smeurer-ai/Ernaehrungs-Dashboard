import { describe, it, expect } from 'vitest';
import { filterFavorites } from '../../../js/calc/favorites.js';

// Hilfsfunktion: Favorit mit sinnvollen Defaults
function fav(name, updatedAt = 1000) {
  return { id: name, name, kcal100: 100, p100: 10, c100: 20, f100: 5, updatedAt };
}

const EIGHT_FAVS = [
  fav('Apfel',         1001),
  fav('Banane',        1002),
  fav('Erdbeere',      1003),
  fav('Haferflocken',  1004),
  fav('Joghurt',       1005),
  fav('Käse',          1006),
  fav('Magerquark',    1007),
  fav('Tofu',          1008),
];
const NINE_FAVS = [...EIGHT_FAVS, fav('Walnuss', 1009)];

describe('filterFavorites — leere Liste', () => {
  it('gibt 0 Treffer ohne Suche zurück', () => {
    const r = filterFavorites([], '');
    expect(r.items).toHaveLength(0);
    expect(r.hasMore).toBe(false);
    expect(r.total).toBe(0);
  });

  it('gibt 0 Treffer mit Suche zurück', () => {
    const r = filterFavorites([], 'Apfel');
    expect(r.items).toHaveLength(0);
    expect(r.hasMore).toBe(false);
  });
});

describe('filterFavorites — wenige Favoriten (≤ 8)', () => {
  it('gibt ohne Suche alle Favoriten zurück, neueste zuerst', () => {
    const favs = [fav('Alt', 1000), fav('Neu', 2000)];
    const r = filterFavorites(favs, '');
    expect(r.items[0].name).toBe('Neu');
    expect(r.items[1].name).toBe('Alt');
    expect(r.hasMore).toBe(false);
  });

  it('gibt mit passendem Suchbegriff nur Treffer zurück', () => {
    const r = filterFavorites(EIGHT_FAVS, 'quark');
    expect(r.items).toHaveLength(1);
    expect(r.items[0].name).toBe('Magerquark');
    expect(r.hasMore).toBe(false);
  });

  it('filtert case-insensitiv', () => {
    const r = filterFavorites(EIGHT_FAVS, 'APFEL');
    expect(r.items[0].name).toBe('Apfel');
  });
});

describe('filterFavorites — viele Favoriten (> 8)', () => {
  it('begrenzt Ergebnisse auf 8 ohne Suche', () => {
    const r = filterFavorites(NINE_FAVS, '');
    expect(r.items).toHaveLength(8);
    expect(r.hasMore).toBe(true);
    expect(r.total).toBe(9);
  });

  it('begrenzt auch gefilterte Ergebnisse auf maxResults', () => {
    const favs = Array.from({ length: 10 }, (_, i) => fav(`Apfel ${i}`, i));
    const r = filterFavorites(favs, 'Apfel');
    expect(r.items).toHaveLength(8);
    expect(r.hasMore).toBe(true);
    expect(r.total).toBe(10);
  });

  it('respektiert custom maxResults', () => {
    const r = filterFavorites(NINE_FAVS, '', 5);
    expect(r.items).toHaveLength(5);
    expect(r.hasMore).toBe(true);
  });
});

describe('filterFavorites — kein Treffer', () => {
  it('gibt leere Liste bei Suche ohne Treffer zurück', () => {
    const r = filterFavorites(EIGHT_FAVS, 'Zzz');
    expect(r.items).toHaveLength(0);
    expect(r.hasMore).toBe(false);
    expect(r.total).toBe(0);
  });
});

describe('filterFavorites — Immutabilität', () => {
  it('verändert die Originalliste nicht', () => {
    const favs = [fav('B', 2000), fav('A', 1000)];
    filterFavorites(favs, '');
    expect(favs[0].name).toBe('B'); // Original unverändert
  });
});
