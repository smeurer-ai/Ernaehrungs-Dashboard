import { describe, it, expect } from 'vitest';
import { mapOFFProduct, normalizeBarcode, parseOFFSearchResults, rankOFFResults, classifyOFFError } from '../../../js/api/openFoodFacts.js';

describe('mapOFFProduct', () => {
  it('mappt deutsche Produktbezeichnung bevorzugt', () => {
    const product = {
      code: '3017620425035',
      product_name: 'Nutella',
      product_name_de: 'Nutella Brotaufstrich',
      brands: 'Ferrero',
      nutriments: {
        'energy-kcal_100g': 539,
        'proteins_100g': 6.3,
        'carbohydrates_100g': 57.5,
        'fat_100g': 30.9,
      },
      categories_tags: ['en:sweet-spreads', 'en:chocolate-spreads'],
    };
    const r = mapOFFProduct(product);
    expect(r.name).toBe('Nutella Brotaufstrich');
    expect(r.kcal100).toBe(539);
    expect(r.p100).toBe(6.3);
    expect(r.c100).toBe(57.5);
    expect(r.f100).toBe(30.9);
    expect(r.offCode).toBe('3017620425035');
    expect(r.source).toBe('off');
    expect(r.categoriesTags).toEqual(['en:sweet-spreads', 'en:chocolate-spreads']);
  });

  it('fällt auf product_name zurück wenn kein product_name_de', () => {
    const product = {
      product_name: 'Magerquark',
      nutriments: { 'energy-kcal_100g': 72, 'proteins_100g': 12, 'carbohydrates_100g': 4, 'fat_100g': 0.2 },
      categories_tags: [],
    };
    expect(mapOFFProduct(product).name).toBe('Magerquark');
  });

  it('gibt Fallback-Name für Produkte ohne Namen', () => {
    const product = { nutriments: {}, categories_tags: [] };
    expect(mapOFFProduct(product).name).toBe('Unbekanntes Produkt');
  });

  it('behandelt fehlende nutriments ohne Fehler', () => {
    const product = { product_name: 'Test', categories_tags: [] };
    const r = mapOFFProduct(product);
    expect(r.kcal100).toBe(0);
    expect(r.p100).toBe(0);
    expect(r.c100).toBe(0);
    expect(r.f100).toBe(0);
  });

  it('rundet kcal ganzzahlig', () => {
    const product = {
      product_name: 'Test',
      nutriments: { 'energy-kcal_100g': 72.6, 'proteins_100g': 12, 'carbohydrates_100g': 4, 'fat_100g': 0.2 },
      categories_tags: [],
    };
    expect(mapOFFProduct(product).kcal100).toBe(73);
  });

  it('rundet Makros auf 1 Dezimalstelle', () => {
    const product = {
      product_name: 'Test',
      nutriments: { 'energy-kcal_100g': 100, 'proteins_100g': 12.34, 'carbohydrates_100g': 5.67, 'fat_100g': 2.15 },
      categories_tags: [],
    };
    const r = mapOFFProduct(product);
    expect(r.p100).toBe(12.3);
    expect(r.c100).toBe(5.7);
    expect(r.f100).toBe(2.2);
  });

  it('füllt leeres categoriesTags-Array wenn categories_tags fehlt', () => {
    const product = { product_name: 'Test', nutriments: {} };
    expect(mapOFFProduct(product).categoriesTags).toEqual([]);
  });
});

describe('parseOFFSearchResults', () => {
  it('gibt leeres Array für leere Produktliste', () => {
    expect(parseOFFSearchResults({ products: [] })).toEqual([]);
  });

  it('gibt leeres Array für null oder fehlende products', () => {
    expect(parseOFFSearchResults(null)).toEqual([]);
    expect(parseOFFSearchResults({})).toEqual([]);
    expect(parseOFFSearchResults({ products: null })).toEqual([]);
  });

  it('filtert Produkte ohne Namen heraus', () => {
    const json = {
      products: [
        { product_name: 'Mit Name', nutriments: { 'energy-kcal_100g': 100, 'proteins_100g': 5 }, categories_tags: [] },
        { nutriments: { 'energy-kcal_100g': 50 }, categories_tags: [] },
      ],
    };
    const r = parseOFFSearchResults(json);
    expect(r).toHaveLength(1);
    expect(r[0].name).toBe('Mit Name');
  });

  it('filtert Produkte ohne Nährstoffwerte heraus', () => {
    const json = {
      products: [
        { product_name: 'Mit Nährwerten', nutriments: { 'energy-kcal_100g': 100, 'proteins_100g': 5 }, categories_tags: [] },
        { product_name: 'Ohne Nährwerte', nutriments: {}, categories_tags: [] },
      ],
    };
    const r = parseOFFSearchResults(json);
    expect(r).toHaveLength(1);
    expect(r[0].name).toBe('Mit Nährwerten');
  });
});

describe('normalizeBarcode', () => {
  it('entfernt Leerzeichen und Bindestriche aus Barcode-Eingaben', () => {
    expect(normalizeBarcode('3017 6204-25035')).toBe('3017620425035');
  });

  it('entfernt Scan-Artefakte und behält nur Ziffern', () => {
    expect(normalizeBarcode('EAN: 400-8400 402225')).toBe('4008400402225');
  });
});

// Hilfsfunktion: minimales gemapptes OFD-Produkt für Ranking-Tests
function p(name, categoriesTags = []) {
  return { name, categoriesTags, kcal100: 50, p100: 5, c100: 10, f100: 2, offCode: name, source: 'off' };
}

describe('rankOFFResults', () => {
  it('gibt leere Liste unverändert zurück', () => {
    expect(rankOFFResults([], 'Apfel')).toEqual([]);
  });

  it('verändert die Originalliste nicht (immutabel)', () => {
    const orig = [p('Apfelsaft', ['en:juices']), p('Apfel', ['en:fruits'])];
    rankOFFResults(orig, 'Apfel');
    expect(orig[0].name).toBe('Apfelsaft');
  });

  it('exakter Namenstrefffer landet auf Platz 1', () => {
    const products = [p('Apfelsaft', ['en:juices']), p('Apfel', ['en:fruits']), p('Apfelkompott', ['en:compote'])];
    const ranked = rankOFFResults(products, 'Apfel');
    expect(ranked[0].name).toBe('Apfel');
  });

  it('Präfix-Treffer vor enthaltenem Treffer', () => {
    const products = [p('Rote Äpfel Kompott', ['en:compote']), p('Äpfel frisch', ['en:fruits'])];
    const ranked = rankOFFResults(products, 'Äpfel');
    expect(ranked[0].name).toBe('Äpfel frisch');
  });

  it('Saft/Kompott/Getränk wird gegenüber gleichwertigem Treffer abgestraft', () => {
    const products = [p('Apfelsaft', ['en:fruit-juices', 'en:beverages']), p('Apfel Snack', ['en:fruits'])];
    const ranked = rankOFFResults(products, 'Apfel');
    expect(ranked[0].name).toBe('Apfel Snack');
  });

  it('Reihenfolge stabil wenn Scores gleich sind', () => {
    const products = [p('Banane A', ['en:fruits']), p('Banane B', ['en:fruits'])];
    const ranked = rankOFFResults(products, 'Banane');
    expect(ranked.map(r => r.name)).toEqual(['Banane A', 'Banane B']);
  });
});

describe('classifyOFFError', () => {
  it('klassifiziert OFD_QUERY_TOO_SHORT', () => {
    expect(classifyOFFError(new Error('OFD_QUERY_TOO_SHORT'))).toBe('too_short');
  });

  it('klassifiziert OFD_TIMEOUT', () => {
    expect(classifyOFFError(new Error('OFD_TIMEOUT'))).toBe('timeout');
  });

  it('klassifiziert OFD_SERVER_ERROR (mit Status-Code)', () => {
    expect(classifyOFFError(new Error('OFD_SERVER_ERROR:503'))).toBe('server');
  });

  it('klassifiziert OFD_NETWORK', () => {
    expect(classifyOFFError(new Error('OFD_NETWORK'))).toBe('network');
  });

  it('klassifiziert unbekannte Fehler als unknown', () => {
    expect(classifyOFFError(new Error('Etwas anderes'))).toBe('unknown');
  });

  it('behandelt null/undefined ohne Absturz', () => {
    expect(classifyOFFError(null)).toBe('unknown');
    expect(classifyOFFError(undefined)).toBe('unknown');
  });
});
