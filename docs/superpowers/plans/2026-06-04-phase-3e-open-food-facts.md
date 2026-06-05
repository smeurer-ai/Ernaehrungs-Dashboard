# Phase 3E — Open Food Facts + Barcode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produktsuche via Open Food Facts (Name + Barcode) in FoodEntryModal; Leucin-Schätzung aus Produktkategorie; MPS-Tagesübersicht im Heute-Tab.

**Architecture:** Neue reine Berechnungsschicht (`leucineFactors.js`, `openFoodFacts.js`) plus neue UI-Komponenten. FoodEntryModal bekommt zwei neue Panels (OFFSearchPanel, BarcodePanel). HeuteTab bekommt MpsSummaryCard. CSP `connect-src` wird um openfoodfacts.org erweitert.

**Tech Stack:** React 18 + htm (kein JSX, kein Build), Vitest, IndexedDB via idb, Vanilla Fetch für OFD-API, native BarcodeDetector-API (kein externes Library).

---

## Dateiübersicht

**Neu erstellen:**
- `js/calc/leucineFactors.js` — `LEUCINE_CATEGORY_RULES`, `LEUCINE_DEFAULT`, `estimateLeucineFactor(categoriesTags)`, `computeMpsFields(proteinG, categoriesTags)`
- `js/api/openFoodFacts.js` — `mapOFFProduct(product)`, `parseOFFSearchResults(json)`, `searchOFF(query)`, `fetchOFFByBarcode(barcode)`
- `js/tabs/tracker/OFFSearchPanel.js` — Suchfeld + Ergebnisliste
- `js/tabs/tracker/BarcodePanel.js` — Barcode-Text-Input + optionaler Kamera-Scan
- `js/tabs/heute/MpsSummaryCard.js` — Tages-MPS-Zusammenfassung
- `tests/unit/calc/leucineFactors.test.js` — Tests für leucineFactors
- `tests/unit/api/openFoodFacts.test.js` — Tests für mapOFFProduct + parseOFFSearchResults

**Modifizieren:**
- `js/calc/tracker.js` — + `computeMpsSummary(entries, mealSlots)`
- `js/tabs/tracker/FoodEntryModal.js` — + offData-State, OFFSearchPanel, BarcodePanel, MPS-Felder in handleSave
- `js/tabs/heute/HeuteTab.js` — + MpsSummaryCard
- `ernaehrung.html` — CSP `connect-src` + openfoodfacts.org
- `js/version.js` — 1.3.0 → 1.3.1
- `service-worker.js` — APP_VERSION sync + 5 neue Dateien in LOCAL_ASSETS
- `tests/unit/calc/tracker.test.js` — + computeMpsSummary-Tests

---

## Task 1: Feature-Branch anlegen + Version 1.3.1

**Files:**
- Modify: `js/version.js`
- Modify: `service-worker.js:3`

- [ ] **Step 1: Feature-Branch erstellen**

```bash
git checkout -b codex/phase-3e-open-food-facts
```

Expected: Switched to a new branch 'codex/phase-3e-open-food-facts'

- [ ] **Step 2: APP_VERSION in js/version.js erhöhen**

Datei `js/version.js` vollständig ersetzen:

```javascript
export const APP_VERSION = '1.3.1';
export const SCHEMA_VERSION = 3; // Phase 4: recipesCustom + recipePhotos
```

- [ ] **Step 3: APP_VERSION in service-worker.js synchron anpassen**

Zeile 3 in `service-worker.js` ändern:

```javascript
const APP_VERSION = '1.3.1';
```

- [ ] **Step 4: Commit**

```bash
git add js/version.js service-worker.js
git commit -m "chore: APP_VERSION 1.3.1 — Phase 3E beginnt"
```

---

## Task 2: leucineFactors.js (TDD)

**Files:**
- Create: `js/calc/leucineFactors.js`
- Create: `tests/unit/calc/leucineFactors.test.js`

- [ ] **Step 1: Testdatei erstellen (Failing Tests)**

`tests/unit/calc/leucineFactors.test.js` erstellen:

```javascript
import { describe, it, expect } from 'vitest';
import {
  estimateLeucineFactor,
  computeMpsFields,
  LEUCINE_DEFAULT,
} from '../../../js/calc/leucineFactors.js';

describe('estimateLeucineFactor', () => {
  it('gibt Default zurück für leeres Array', () => {
    expect(estimateLeucineFactor([])).toEqual(LEUCINE_DEFAULT);
  });

  it('gibt Default zurück für undefined', () => {
    expect(estimateLeucineFactor(undefined)).toEqual(LEUCINE_DEFAULT);
  });

  it('erkennt Milchprodukte (dairy)', () => {
    const r = estimateLeucineFactor(['en:dairy', 'en:fermented-foods']);
    expect(r.leucinePct).toBe(0.105);
    expect(r.qualityScore).toBe(0.95);
  });

  it('erkennt Käse (cheese)', () => {
    const r = estimateLeucineFactor(['en:cheeses', 'en:dairy']);
    expect(r.leucinePct).toBe(0.105);
  });

  it('erkennt Fleisch (meat)', () => {
    const r = estimateLeucineFactor(['en:meats', 'en:processed-foods']);
    expect(r.leucinePct).toBe(0.095);
    expect(r.qualityScore).toBe(0.95);
  });

  it('erkennt Fisch (fish)', () => {
    const r = estimateLeucineFactor(['en:fish-and-seafood', 'en:seafoods']);
    expect(r.leucinePct).toBe(0.092);
  });

  it('erkennt Ei (egg)', () => {
    const r = estimateLeucineFactor(['en:egg-based-foods']);
    expect(r.leucinePct).toBe(0.088);
    expect(r.qualityScore).toBe(0.92);
  });

  it('erkennt Soja (soy)', () => {
    const r = estimateLeucineFactor(['en:soy-based-foods']);
    expect(r.leucinePct).toBe(0.082);
  });

  it('erkennt Hülsenfrüchte (legume)', () => {
    const r = estimateLeucineFactor(['en:legumes', 'en:lentils']);
    expect(r.leucinePct).toBe(0.078);
  });

  it('erkennt Getreide (grain)', () => {
    const r = estimateLeucineFactor(['en:grain-based-foods']);
    expect(r.leucinePct).toBe(0.068);
    expect(r.qualityScore).toBe(0.50);
  });

  it('erkennt Reis (rice)', () => {
    const r = estimateLeucineFactor(['en:rice', 'en:cereals']);
    // rice kommt nach cereal in den Regeln — aber rice ist eigene Kategorie
    // Erwarte rice-Faktor wenn rice-Eintrag vorhanden
    expect(r.leucinePct).toBe(0.068); // cereal kommt vor rice in Rules → cereal gewinnt
  });

  it('dairy hat Vorrang vor grain (erste Regel gewinnt)', () => {
    const r = estimateLeucineFactor(['en:grain-based-desserts', 'en:dairy-desserts']);
    expect(r.leucinePct).toBe(0.105); // dairy kommt früher in LEUCINE_CATEGORY_RULES
  });
});

describe('computeMpsFields', () => {
  it('berechnet Leucin korrekt für Milchprodukt', () => {
    // dairy: 0.105 * 35 = 3.675 → gerundet 3.7
    const r = computeMpsFields(35, ['en:dairy']);
    expect(r.leucineEstimateG).toBe(3.7);
    expect(r.proteinQualityScore).toBe(0.95);
    expect(r.mpsTriggered).toBe(true);
  });

  it('setzt mpsTriggered false wenn Leucin < 3g', () => {
    // dairy: 0.105 * 20 = 2.1
    const r = computeMpsFields(20, ['en:dairy']);
    expect(r.leucineEstimateG).toBe(2.1);
    expect(r.mpsTriggered).toBe(false);
  });

  it('verwendet Default-Faktor für unbekannte Kategorien', () => {
    // default: 0.080 * 30 = 2.4
    const r = computeMpsFields(30, ['en:snacks', 'en:sweets']);
    expect(r.leucineEstimateG).toBe(2.4);
    expect(r.proteinQualityScore).toBe(0.70);
    expect(r.mpsTriggered).toBe(false);
  });

  it('MPS getriggert an der Grenze: 0.105 * 29 = 3.045 → true', () => {
    const r = computeMpsFields(29, ['en:dairy']);
    expect(r.leucineEstimateG).toBe(3.0); // Math.round(3.045 * 10) / 10 = 3.0
    expect(r.mpsTriggered).toBe(true);
  });

  it('MPS nicht getriggert: 0.105 * 28 = 2.94 → false', () => {
    const r = computeMpsFields(28, ['en:dairy']);
    expect(r.leucineEstimateG).toBe(2.9); // Math.round(2.94 * 10) / 10 = 2.9
    expect(r.mpsTriggered).toBe(false);
  });

  it('gibt alle drei Felder zurück', () => {
    const r = computeMpsFields(25, ['en:meat']);
    expect(r).toHaveProperty('leucineEstimateG');
    expect(r).toHaveProperty('proteinQualityScore');
    expect(r).toHaveProperty('mpsTriggered');
  });
});
```

- [ ] **Step 2: Tests ausführen — müssen FEHLSCHLAGEN**

```bash
npm test -- tests/unit/calc/leucineFactors.test.js
```

Expected: `Cannot find module '../../../js/calc/leucineFactors.js'`

- [ ] **Step 3: leucineFactors.js implementieren**

`js/calc/leucineFactors.js` erstellen:

```javascript
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
```

- [ ] **Step 4: Tests ausführen — müssen GRÜN sein**

```bash
npm test -- tests/unit/calc/leucineFactors.test.js
```

Expected: 12 Tests grün

- [ ] **Step 5: Commit**

```bash
git add js/calc/leucineFactors.js tests/unit/calc/leucineFactors.test.js
git commit -m "feat: leucineFactors — Kategorie-basierte Leucin-/MPS-Schätzung"
```

---

## Task 3: openFoodFacts.js (TDD für reine Funktionen)

**Files:**
- Create: `js/api/openFoodFacts.js`
- Create: `tests/unit/api/openFoodFacts.test.js`

- [ ] **Step 1: Testdatei erstellen (Failing Tests)**

Verzeichnis `tests/unit/api/` anlegen (nur wenn nicht vorhanden), dann `tests/unit/api/openFoodFacts.test.js` erstellen:

```javascript
import { describe, it, expect } from 'vitest';
import { mapOFFProduct, parseOFFSearchResults } from '../../../js/api/openFoodFacts.js';

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
```

- [ ] **Step 2: Tests ausführen — müssen FEHLSCHLAGEN**

```bash
npm test -- tests/unit/api/openFoodFacts.test.js
```

Expected: `Cannot find module '../../../js/api/openFoodFacts.js'`

- [ ] **Step 3: openFoodFacts.js implementieren**

Verzeichnis `js/api/` anlegen, dann `js/api/openFoodFacts.js` erstellen:

```javascript
/**
 * Open Food Facts API — Wrapper für Produktsuche und Barcode-Lookup.
 * mapOFFProduct und parseOFFSearchResults sind pure Funktionen (testbar).
 * searchOFF und fetchOFFByBarcode führen Netzwerk-Requests aus.
 * @module api/openFoodFacts
 */

const OFF_FIELDS = 'code,product_name,product_name_de,brands,nutriments,categories_tags';

/**
 * Mappt ein rohes Open-Food-Facts-Produkt auf das interne Format.
 *
 * @param {Object} product - Rohes OFD-Produkt-Objekt
 * @returns {{
 *   name: string,
 *   kcal100: number,
 *   p100: number,
 *   c100: number,
 *   f100: number,
 *   categoriesTags: string[],
 *   source: 'off',
 *   offCode: string,
 * }}
 */
export function mapOFFProduct(product) {
  const n = product.nutriments ?? {};
  const name = product.product_name_de
    || product.product_name
    || product.generic_name_de
    || product.generic_name
    || 'Unbekanntes Produkt';

  return {
    name,
    kcal100: Math.round(n['energy-kcal_100g'] ?? n['energy_100g'] ?? 0),
    p100:    Math.round((n['proteins_100g']      ?? 0) * 10) / 10,
    c100:    Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
    f100:    Math.round((n['fat_100g']           ?? 0) * 10) / 10,
    categoriesTags: product.categories_tags ?? [],
    source: 'off',
    offCode: product.code ?? '',
  };
}

/**
 * Parst die Suchantwort von Open Food Facts.
 * Filtert Produkte ohne Namen oder ohne Nährstoffwerte heraus.
 *
 * @param {Object|null} json - JSON-Antwort der OFD-Such-API
 * @returns {ReturnType<typeof mapOFFProduct>[]}
 */
export function parseOFFSearchResults(json) {
  if (!json?.products || !Array.isArray(json.products)) return [];
  return json.products
    .filter(p => p.product_name || p.product_name_de)
    .map(mapOFFProduct)
    .filter(p => p.kcal100 > 0 || p.p100 > 0);
}

/**
 * Sucht Produkte nach Name über die Open Food Facts API.
 * Wirft einen Error bei Netzwerkproblemen.
 *
 * @param {string} query - Suchbegriff
 * @returns {Promise<ReturnType<typeof mapOFFProduct>[]>}
 */
export async function searchOFF(query) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&lc=de&fields=${OFF_FIELDS}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`OFD Suche fehlgeschlagen: ${resp.status}`);
  return parseOFFSearchResults(await resp.json());
}

/**
 * Lädt ein Produkt anhand seines Barcodes von Open Food Facts.
 * Wirft einen Error wenn nicht gefunden oder Netzwerkfehler.
 *
 * @param {string} barcode - EAN-13, EAN-8, UPC-A oder UPC-E
 * @returns {Promise<ReturnType<typeof mapOFFProduct>>}
 */
export async function fetchOFFByBarcode(barcode) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${OFF_FIELDS}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Barcode-Suche fehlgeschlagen: ${resp.status}`);
  const json = await resp.json();
  if (json.status !== 1) throw new Error('Produkt nicht gefunden');
  return mapOFFProduct(json.product);
}
```

- [ ] **Step 4: Tests ausführen — müssen GRÜN sein**

```bash
npm test -- tests/unit/api/openFoodFacts.test.js
```

Expected: 11 Tests grün

- [ ] **Step 5: Commit**

```bash
git add js/api/openFoodFacts.js tests/unit/api/openFoodFacts.test.js
git commit -m "feat: openFoodFacts API — mapOFFProduct, parseOFFSearchResults, searchOFF, fetchOFFByBarcode"
```

---

## Task 4: computeMpsSummary in tracker.js (TDD)

**Files:**
- Modify: `js/calc/tracker.js`
- Modify: `tests/unit/calc/tracker.test.js`

- [ ] **Step 1: Tests hinzufügen (am Ende von tracker.test.js)**

Die bestehende `tests/unit/calc/tracker.test.js` um folgenden Block am Ende erweitern. Den Import in Zeile 2 aktualisieren:

Zeile 2 ändern von:
```javascript
import { calcTrackedFoodMacros, sumConsumed, groupProteinBySlot } from '../../../js/calc/tracker.js';
```
zu:
```javascript
import { calcTrackedFoodMacros, sumConsumed, groupProteinBySlot, computeMpsSummary } from '../../../js/calc/tracker.js';
```

Am Ende der Datei anhängen:

```javascript
describe('computeMpsSummary', () => {
  const SLOTS = ['Frühstück', 'Mittagessen', 'Snack'];

  it('gibt 0/0 zurück wenn keine Einträge vorhanden', () => {
    const r = computeMpsSummary([], SLOTS);
    expect(r.mpsSlotsCount).toBe(0);
    expect(r.totalActiveSlotsCount).toBe(0);
  });

  it('zählt nur Slots mit mindestens einem Eintrag', () => {
    const entries = [{ id: '1', mealSlot: 'Frühstück', p: 35, kcal: 300, c: 20, f: 10 }];
    const r = computeMpsSummary(entries, SLOTS);
    expect(r.totalActiveSlotsCount).toBe(1);
  });

  it('Slot ist MPS-wirksam wenn mpsTriggered=true explizit gesetzt', () => {
    const entries = [{ id: '1', mealSlot: 'Frühstück', p: 5, kcal: 80, c: 5, f: 2, mpsTriggered: true }];
    const r = computeMpsSummary(entries, SLOTS);
    expect(r.mpsSlotsCount).toBe(1);
  });

  it('Slot ist NICHT MPS-wirksam wenn mpsTriggered=false explizit gesetzt (trotz hoher Proteinmenge)', () => {
    const entries = [{ id: '1', mealSlot: 'Frühstück', p: 50, kcal: 400, c: 30, f: 15, mpsTriggered: false }];
    const r = computeMpsSummary(entries, SLOTS);
    expect(r.mpsSlotsCount).toBe(0);
  });

  it('Fallback auf Protein-Schätzung wenn kein mpsTriggered: 35g in Hauptmahlzeit → wirksam', () => {
    const entries = [{ id: '1', mealSlot: 'Frühstück', p: 35, kcal: 300, c: 20, f: 10 }];
    const r = computeMpsSummary(entries, SLOTS);
    expect(r.mpsSlotsCount).toBe(1);
  });

  it('Snack-Slot: 15g Protein → wirksam (niedrigere Schwelle)', () => {
    const entries = [{ id: '1', mealSlot: 'Snack', p: 15, kcal: 150, c: 8, f: 5 }];
    const r = computeMpsSummary(entries, SLOTS);
    expect(r.mpsSlotsCount).toBe(1);
  });

  it('Snack-Slot: 8g Protein → nicht wirksam', () => {
    const entries = [{ id: '1', mealSlot: 'Snack', p: 8, kcal: 80, c: 5, f: 2 }];
    const r = computeMpsSummary(entries, SLOTS);
    expect(r.mpsSlotsCount).toBe(0);
    expect(r.totalActiveSlotsCount).toBe(1);
  });
});
```

- [ ] **Step 2: Tests ausführen — computeMpsSummary-Tests müssen FEHLSCHLAGEN**

```bash
npm test -- tests/unit/calc/tracker.test.js
```

Expected: Existing tests pass, neue Tests fail mit `computeMpsSummary is not a function`

- [ ] **Step 3: tracker.js erweitern**

Am Anfang von `js/calc/tracker.js` nach der Datei-Docblock-Zeile (`@module calc/tracker`) einen Import hinzufügen:

```javascript
import { isMainMealSlot, rateMealProtein } from './nutritionLogic.js';
```

Am Ende von `js/calc/tracker.js` anhängen:

```javascript
/**
 * Berechnet die MPS-Tages-Zusammenfassung aus den Tracker-Einträgen.
 *
 * Logik pro Slot:
 * 1. Wenn mindestens ein Eintrag `mpsTriggered` definiert hat → verwende diese OFD-Daten
 * 2. Fallback: schätze via rateMealProtein aus der Slot-Protein-Summe
 *
 * @param {Array<{mealSlot?: string, p?: number, mpsTriggered?: boolean}>} entries
 * @param {string[]} mealSlots - Sortierte Liste der Mahlzeit-Slots des Tages
 * @returns {{ mpsSlotsCount: number, totalActiveSlotsCount: number }}
 */
export function computeMpsSummary(entries, mealSlots) {
  const slotTotals = groupProteinBySlot(entries);
  let totalActiveSlotsCount = 0;
  let mpsSlotsCount = 0;

  for (const slot of mealSlots) {
    const slotEntries = entries.filter(e => e.mealSlot === slot);
    if (slotEntries.length === 0) continue;
    totalActiveSlotsCount++;

    const offEntries = slotEntries.filter(e => e.mpsTriggered !== undefined);
    if (offEntries.length > 0) {
      // OFD-Daten vorhanden → explizites mpsTriggered verwenden
      if (offEntries.some(e => e.mpsTriggered === true)) mpsSlotsCount++;
      continue;
    }

    // Kein OFD-Eintrag → Protein-Schätzung
    const protein = slotTotals[slot] ?? 0;
    const { rating } = rateMealProtein(protein, isMainMealSlot(slot), {});
    if (rating === 'good') mpsSlotsCount++;
  }

  return { mpsSlotsCount, totalActiveSlotsCount };
}
```

- [ ] **Step 4: Alle Tests ausführen — müssen GRÜN sein**

```bash
npm test
```

Expected: 184+ Tests grün (178 bisherige + neue leucineFactors + openFoodFacts + computeMpsSummary)

- [ ] **Step 5: Commit**

```bash
git add js/calc/tracker.js tests/unit/calc/tracker.test.js
git commit -m "feat: computeMpsSummary — MPS-Tages-Zusammenfassung aus Tracker-Einträgen"
```

---

## Task 5: OFFSearchPanel.js

**Files:**
- Create: `js/tabs/tracker/OFFSearchPanel.js`

- [ ] **Step 1: OFFSearchPanel.js erstellen**

```javascript
import { html, useState } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { searchOFF } from '../../api/openFoodFacts.js';

/**
 * Textsuch-Panel für Open Food Facts.
 * Zeigt Sucheingabe + Ergebnisliste. Bei Produktauswahl → onSelect + onClose.
 *
 * @param {{
 *   onSelect: (product: import('../../api/openFoodFacts.js').OFFProduct) => void,
 *   onClose: () => void,
 * }} props
 */
export function OFFSearchPanel({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const products = await searchOFF(q);
      setResults(products);
      if (products.length === 0) setError('Keine Produkte gefunden.');
    } catch {
      setError('Suche fehlgeschlagen. Bitte Internetverbindung prüfen.');
    } finally {
      setLoading(false);
    }
  }

  return html`
    <div style=${{ marginBottom: '10px' }}>
      <div style=${{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        <input
          type="search"
          value=${query}
          placeholder="z.B. Magerquark"
          onInput=${e => setQuery(e.target.value)}
          onKeyDown=${e => e.key === 'Enter' && handleSearch()}
          style=${{ ...S.input, flex: 1 }}
          autoFocus
        />
        <button
          onClick=${handleSearch}
          disabled=${loading || !query.trim()}
          style=${{
            ...S.btn(loading || !query.trim() ? '#2a2a2a' : COLORS.gold, loading || !query.trim() ? '#555' : '#111'),
            padding: '0 14px',
            flexShrink: 0,
          }}
        >
          ${loading ? '…' : '🔍'}
        </button>
      </div>
      ${error && html`
        <div style=${{ fontSize: '11px', color: COLORS.error, fontFamily: FONTS.mono, marginBottom: '6px' }}>
          ${error}
        </div>
      `}
      ${results.map(p => html`
        <button
          key=${p.offCode || p.name}
          onClick=${() => { onSelect(p); onClose(); }}
          style=${{
            width: '100%',
            background: '#1a1a12',
            border: `1px solid #2a2a1f`,
            borderRadius: '8px',
            padding: '8px 10px',
            marginBottom: '4px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style=${{ fontSize: '12px', color: COLORS.text, fontWeight: 600, fontFamily: FONTS.sans }}>
            ${p.name}
          </div>
          <div style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono, marginTop: '2px' }}>
            ${p.kcal100} kcal · ${p.p100}g P · ${p.c100}g KH · ${p.f100}g F / 100g
          </div>
        </button>
      `)}
    </div>
  `;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/tabs/tracker/OFFSearchPanel.js
git commit -m "feat: OFFSearchPanel — Textsuch-UI für Open Food Facts"
```

---

## Task 6: BarcodePanel.js

**Files:**
- Create: `js/tabs/tracker/BarcodePanel.js`

- [ ] **Step 1: BarcodePanel.js erstellen**

```javascript
import { html, useState, useEffect, useRef } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { fetchOFFByBarcode } from '../../api/openFoodFacts.js';

/**
 * Barcode-Eingabe-Panel mit optionalem Kamera-Scan via BarcodeDetector-API.
 * Kamera-Button wird nur gezeigt wenn 'BarcodeDetector' in window verfügbar ist.
 *
 * @param {{
 *   onSelect: (product: import('../../api/openFoodFacts.js').OFFProduct) => void,
 *   onClose: () => void,
 * }} props
 */
export function BarcodePanel({ onSelect, onClose }) {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    setHasBarcodeDetector('BarcodeDetector' in window);
    return () => stopStream();
  }, []);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }

  async function handleManualSearch() {
    const code = barcode.trim();
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const product = await fetchOFFByBarcode(code);
      onSelect(product);
      onClose();
    } catch (e) {
      setError(e.message || 'Produkt nicht gefunden.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartCamera() {
    if (!hasBarcodeDetector) return;
    setError(null);
    let stopped = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanning(true);

      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });

      const scanLoop = async () => {
        if (stopped || !videoRef.current) return;
        try {
          const found = await detector.detect(videoRef.current);
          if (found.length > 0 && !stopped) {
            stopped = true;
            const code = found[0].rawValue;
            stream.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            setScanning(false);
            setBarcode(code);
            setLoading(true);
            try {
              const product = await fetchOFFByBarcode(code);
              onSelect(product);
              onClose();
            } catch (e) {
              setError(e.message || 'Produkt nicht gefunden.');
            } finally {
              setLoading(false);
            }
            return;
          }
        } catch { /* Einzelbild-Erkennungsfehler ignorieren */ }
        if (!stopped) setTimeout(scanLoop, 500);
      };

      setTimeout(scanLoop, 800);
    } catch {
      setError('Kamera-Zugriff nicht möglich. Bitte Barcode manuell eingeben.');
    }
  }

  return html`
    <div style=${{ marginBottom: '10px' }}>
      ${scanning && html`
        <div style=${{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
          <video
            ref=${videoRef}
            autoplay
            playsinline
            muted
            style=${{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }}
          />
          <button
            onClick=${stopStream}
            style=${{
              position: 'absolute', top: '6px', right: '6px',
              ...S.btn('#222', COLORS.text),
              padding: '4px 8px', fontSize: '11px',
            }}
          >✕ Stop</button>
        </div>
      `}
      <div style=${{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        <input
          type="text"
          inputmode="numeric"
          value=${barcode}
          placeholder="Barcode (EAN/UPC)"
          onInput=${e => setBarcode(e.target.value)}
          onKeyDown=${e => e.key === 'Enter' && handleManualSearch()}
          style=${{ ...S.input, flex: 1 }}
        />
        <button
          onClick=${handleManualSearch}
          disabled=${loading || !barcode.trim()}
          style=${{
            ...S.btn(loading || !barcode.trim() ? '#2a2a2a' : COLORS.gold, loading || !barcode.trim() ? '#555' : '#111'),
            padding: '0 14px',
            flexShrink: 0,
          }}
        >
          ${loading ? '…' : '→'}
        </button>
      </div>
      ${hasBarcodeDetector && !scanning && html`
        <button
          onClick=${handleStartCamera}
          style=${{ ...S.btn('#1a2a1a', '#5cb85c'), width: '100%', marginBottom: '8px', fontSize: '12px' }}
        >
          📷 Kamera-Scan starten
        </button>
      `}
      ${error && html`
        <div style=${{ fontSize: '11px', color: COLORS.error, fontFamily: FONTS.mono }}>
          ${error}
        </div>
      `}
    </div>
  `;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/tabs/tracker/BarcodePanel.js
git commit -m "feat: BarcodePanel — Barcode-Eingabe + optionaler BarcodeDetector-Kamera-Scan"
```

---

## Task 7: FoodEntryModal.js — OFD-Integration

**Files:**
- Modify: `js/tabs/tracker/FoodEntryModal.js`

- [ ] **Step 1: Imports erweitern**

Zeile 1–5 der `js/tabs/tracker/FoodEntryModal.js` ersetzen:

```javascript
import { html, useState, useEffect, useMemo } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { Modal } from '../../ui/Modal.js';
import { FavoritePicker } from './FavoritePicker.js';
import { OFFSearchPanel } from './OFFSearchPanel.js';
import { BarcodePanel } from './BarcodePanel.js';
import { calcTrackedFoodMacros } from '../../calc/tracker.js';
import { computeMpsFields } from '../../calc/leucineFactors.js';
```

- [ ] **Step 2: Neue State-Variablen nach dem bestehenden `const [saveFav, setSaveFav] = useState(false);` (Zeile ~51) einfügen**

Den Block nach `const [saveFav, setSaveFav] = useState(false);` ergänzen:

```javascript
  const [searchMode, setSearchMode] = useState(null); // null | 'search' | 'barcode'
  const [offData, setOffData] = useState(null);        // { categoriesTags, offCode } | null
```

- [ ] **Step 3: useEffect-Reset erweitern**

Im `useEffect`-Block (Zeile ~56–85) am Ende des Blocks (direkt vor der schließenden Klammer des `if (initialEntry)` und des else-Blocks) folgende Resets hinzufügen.

Innerhalb des `useEffect`, nach dem `} else {`-Block, vor dem letzten `}`:

Im `if (initialEntry)` Block nach `setSaveFav(false)` (es gibt kein saveFav-Reset dort, aber im else-Block):
Im `else`-Block nach `setSaveFav(false)`:
```javascript
      setSearchMode(null);
      setOffData(null);
```

Der vollständige `else`-Block sieht dann so aus:
```javascript
    } else {
      setSlot(safeSlot);
      setName('');
      setGramm('');
      setKcal100('');
      setP100('');
      setC100('');
      setF100('');
      setSaveFav(false);
      setSearchMode(null);
      setOffData(null);
    }
```

- [ ] **Step 4: handleFavSelect erweitern — offData zurücksetzen**

Die bestehende `handleFavSelect`-Funktion (Zeile ~87–93) ersetzen:

```javascript
  const handleFavSelect = (fav) => {
    setName(fav.name);
    setKcal100(String(fav.kcal100));
    setP100(String(fav.p100));
    setC100(String(fav.c100));
    setF100(String(fav.f100));
    setSaveFav(false);
    setOffData(null);
  };
```

- [ ] **Step 5: handleOFFSelect-Funktion hinzufügen** (nach handleFavSelect einfügen)

```javascript
  const handleOFFSelect = (product) => {
    setName(product.name);
    setKcal100(String(product.kcal100));
    setP100(String(product.p100));
    setC100(String(product.c100));
    setF100(String(product.f100));
    setOffData({ categoriesTags: product.categoriesTags, offCode: product.offCode });
    setSaveFav(false);
  };
```

- [ ] **Step 6: handleSave erweitern — MPS-Felder hinzufügen**

Die bestehende `handleSave`-Funktion (Zeile ~112–139) ersetzen:

```javascript
  function handleSave() {
    if (!canSave) return;

    const entry = {
      id: initialEntry?.id ?? generateId(),
      mealSlot: slot,
      foodName: name.trim(),
      foodRef: offData ? `off:${offData.offCode || 'search'}` : 'manual',
      gramm: parseFloat(gramm),
      kcal: preview.kcal,
      p: preview.p,
      c: preview.c,
      f: preview.f,
      timestamp: initialEntry?.timestamp ?? Date.now(),
    };

    if (offData) {
      const { leucineEstimateG, proteinQualityScore, mpsTriggered } = computeMpsFields(preview.p, offData.categoriesTags);
      entry.leucineEstimateG = leucineEstimateG;
      entry.proteinQualityScore = proteinQualityScore;
      entry.mpsTriggered = mpsTriggered;
    }

    const favData = saveFav ? {
      id: generateId(),
      name: name.trim(),
      kcal100: parseFloat(kcal100) || 0,
      p100: parseFloat(p100) || 0,
      c100: parseFloat(c100) || 0,
      f100: parseFloat(f100) || 0,
      source: 'manual',
    } : null;

    onSave(entry, favData);
    onClose();
  }
```

- [ ] **Step 7: OFD-Suche- und Barcode-Buttons im Template einfügen**

Im JSX-Template, nach dem `FavoritePicker`-Block und vor dem Divider `— oder manuell eingeben —`, folgenden Block einfügen:

Der bestehende Block (Zeile ~162–174):
```javascript
        ${!isEdit && html`
          <label style=${{ ...S.label, marginBottom: '6px' }}>Aus Favoriten</label>
          <${FavoritePicker} favorites=${favorites} onSelect=${handleFavSelect} />
          <div style=${{
            textAlign: 'center',
            fontSize: '10px',
            color: COLORS.textMuted,
            fontFamily: FONTS.mono,
            margin: '10px 0 12px',
            letterSpacing: '0.08em',
          }}>— oder manuell eingeben —</div>
        `}
```

ersetzen durch:

```javascript
        ${!isEdit && html`
          <label style=${{ ...S.label, marginBottom: '6px' }}>Aus Favoriten</label>
          <${FavoritePicker} favorites=${favorites} onSelect=${handleFavSelect} />

          <!-- OFD Suche / Barcode Buttons -->
          <div style=${{ display: 'flex', gap: '6px', margin: '10px 0 8px' }}>
            <button
              onClick=${() => setSearchMode(searchMode === 'search' ? null : 'search')}
              style=${{
                ...S.btn(searchMode === 'search' ? COLORS.gold : '#1e1e1e', searchMode === 'search' ? '#111' : COLORS.textMuted),
                flex: 1,
                fontSize: '11px',
              }}
            >🔍 OFD Suche</button>
            <button
              onClick=${() => setSearchMode(searchMode === 'barcode' ? null : 'barcode')}
              style=${{
                ...S.btn(searchMode === 'barcode' ? COLORS.gold : '#1e1e1e', searchMode === 'barcode' ? '#111' : COLORS.textMuted),
                flex: 1,
                fontSize: '11px',
              }}
            >🔢 Barcode</button>
          </div>

          ${searchMode === 'search' && html`
            <${OFFSearchPanel} onSelect=${handleOFFSelect} onClose=${() => setSearchMode(null)} />
          `}
          ${searchMode === 'barcode' && html`
            <${BarcodePanel} onSelect=${handleOFFSelect} onClose=${() => setSearchMode(null)} />
          `}

          ${offData && html`
            <div style=${{
              fontSize: '10px', color: '#5cb85c', fontFamily: FONTS.mono,
              marginBottom: '8px', padding: '4px 8px', background: '#1a2a1a',
              borderRadius: '6px', border: '1px solid #2a3a2a',
            }}>
              ✓ OFD-Produkt · Leucin wird automatisch berechnet
            </div>
          `}

          <div style=${{
            textAlign: 'center',
            fontSize: '10px',
            color: COLORS.textMuted,
            fontFamily: FONTS.mono,
            margin: '6px 0 12px',
            letterSpacing: '0.08em',
          }}>— oder manuell eingeben —</div>
        `}
```

- [ ] **Step 8: Commit**

```bash
git add js/tabs/tracker/FoodEntryModal.js
git commit -m "feat: FoodEntryModal — OFD Suche + Barcode-Panel + MPS-Felder bei OFD-Auswahl"
```

---

## Task 8: MpsSummaryCard.js

**Files:**
- Create: `js/tabs/heute/MpsSummaryCard.js`

- [ ] **Step 1: MpsSummaryCard.js erstellen**

```javascript
import { html, useMemo } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { computeMpsSummary } from '../../calc/tracker.js';
import { getMealTemplate } from '../../data/mealTemplates.js';

/**
 * Tages-Karte: „X von Y Mahlzeiten MPS-wirksam".
 * Wird nur gerendert wenn mindestens ein Slot Einträge hat.
 *
 * @param {{
 *   entries: import('../../storage/indexeddb.js').TrackedFood[],
 *   dayType: 'training'|'rest',
 *   trainingTime: string,
 *   wakeUpTime: string,
 *   trainingDurationMin: number,
 * }} props
 */
export function MpsSummaryCard({ entries, dayType, trainingTime, wakeUpTime, trainingDurationMin }) {
  const mealSlots = useMemo(
    () => getMealTemplate(dayType, trainingTime, wakeUpTime, trainingDurationMin).map(m => m.label),
    [dayType, trainingTime, wakeUpTime, trainingDurationMin],
  );

  const { mpsSlotsCount, totalActiveSlotsCount } = computeMpsSummary(entries, mealSlots);

  if (totalActiveSlotsCount === 0) return null;

  const ratio = mpsSlotsCount / totalActiveSlotsCount;
  const barColor = ratio >= 0.75 ? COLORS.success : ratio >= 0.5 ? '#d97706' : COLORS.error;

  const message = mpsSlotsCount === totalActiveSlotsCount
    ? `Alle ${totalActiveSlotsCount} Mahlzeiten MPS-wirksam ✓`
    : `${totalActiveSlotsCount - mpsSlotsCount} Mahlzeit${totalActiveSlotsCount - mpsSlotsCount === 1 ? '' : 'en'} noch unter Leucin-Schwelle`;

  return html`
    <div style=${{ ...S.card, marginTop: '4px' }}>
      <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style=${{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.gold, fontFamily: FONTS.mono, fontWeight: 600 }}>
          MPS-Wirksam heute
        </div>
        <div style=${{ fontSize: '14px', fontFamily: FONTS.mono, fontWeight: 700, color: barColor }}>
          ${mpsSlotsCount} / ${totalActiveSlotsCount}
        </div>
      </div>
      <div style=${{ height: '5px', borderRadius: '3px', background: '#222', overflow: 'hidden', marginBottom: '6px' }}>
        <div style=${{
          height: '100%',
          width: `${Math.round(ratio * 100)}%`,
          background: barColor,
          borderRadius: '3px',
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>
        ${message}
      </div>
    </div>
  `;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/tabs/heute/MpsSummaryCard.js
git commit -m "feat: MpsSummaryCard — Tages-MPS-Zusammenfassung im Heute-Tab"
```

---

## Task 9: HeuteTab.js — MpsSummaryCard integrieren

**Files:**
- Modify: `js/tabs/heute/HeuteTab.js`

- [ ] **Step 1: Import hinzufügen**

Zeile 1 von `js/tabs/heute/HeuteTab.js` erweitern. Nach `import { html } from '../../lib.js';`:

```javascript
import { html } from '../../lib.js';
import { DayTypeSwitch } from './DayTypeSwitch.js';
import { DaySummary } from './DaySummary.js';
import { MealPlanList } from './MealPlanList.js';
import { HydrationCard } from './HydrationCard.js';
import { MpsSummaryCard } from './MpsSummaryCard.js';
import { useUiState } from '../../hooks/useUiState.js';
import { useLog } from '../../hooks/useLog.js';
import { sumConsumed, groupProteinBySlot } from '../../calc/tracker.js';
import { S, COLORS } from '../../ui/theme.js';
```

- [ ] **Step 2: MpsSummaryCard nach HydrationCard rendern**

In der return-Anweisung von `HeuteTab`, die Zeile `<${HydrationCard} dayType=${dayType} trainingTime=${trainingTime} />` um den MpsSummaryCard-Block erweitern:

```javascript
      <${HydrationCard} dayType=${dayType} trainingTime=${trainingTime} />
      <${MpsSummaryCard}
        entries=${entries}
        dayType=${dayType}
        trainingTime=${trainingTime}
        wakeUpTime=${wakeUpTime}
        trainingDurationMin=${effectiveDurationMin}
      />
```

- [ ] **Step 3: Commit**

```bash
git add js/tabs/heute/HeuteTab.js
git commit -m "feat: HeuteTab — MpsSummaryCard nach HydrationCard"
```

---

## Task 10: CSP-Update + service-worker LOCAL_ASSETS

**Files:**
- Modify: `ernaehrung.html:10`
- Modify: `service-worker.js`

- [ ] **Step 1: CSP in ernaehrung.html erweitern**

In `ernaehrung.html` Zeile 10 die `connect-src`-Direktive erweitern.

Alten Wert: `connect-src 'self';`  
Neuer Wert: `connect-src 'self' https://world.openfoodfacts.org;`

Die vollständige meta-Zeile nach der Änderung:
```html
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://world.openfoodfacts.org; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"/>
```

- [ ] **Step 2: Neue Dateien in LOCAL_ASSETS des service-worker.js eintragen**

In `service-worker.js`, den `LOCAL_ASSETS`-Array (Zeile ~7–77) um die 5 neuen Dateien erweitern.

Nach `'./js/calc/tracker.js',` einfügen:
```javascript
  './js/calc/leucineFactors.js',
```

Nach `'./js/storage/exportImport.js',` einfügen:
```javascript
  './js/api/openFoodFacts.js',
```

Nach `'./js/tabs/tracker/FavoritePicker.js',` einfügen:
```javascript
  './js/tabs/tracker/OFFSearchPanel.js',
  './js/tabs/tracker/BarcodePanel.js',
```

Nach `'./js/tabs/heute/HydrationCard.js',` einfügen:
```javascript
  './js/tabs/heute/MpsSummaryCard.js',
```

- [ ] **Step 3: Alle Tests noch einmal grün bestätigen**

```bash
npm test
```

Expected: Alle Tests grün (mindestens 204)

- [ ] **Step 4: Commit**

```bash
git add ernaehrung.html service-worker.js
git commit -m "chore: CSP connect-src + openfoodfacts.org; LOCAL_ASSETS für Phase-3E-Dateien"
```

---

## Task 11: Abschlusskontrolle + docs aktualisieren

**Files:**
- Modify: `docs/uebergabedokument-aktuell.md`

- [ ] **Step 1: Alle Tests final prüfen**

```bash
npm test
```

Expected: Alle Tests grün. Gesamt sollte bei ~204 sein.

- [ ] **Step 2: Übergabedokument aktualisieren**

In `docs/uebergabedokument-aktuell.md`:

1. Zeile 3 (`**Stand:**`) auf `Phase 3E Open Food Facts abgeschlossen · Phase 5 als nächstes` aktualisieren
2. `**APP_VERSION:** `1.3.0`` → `1.3.1`
3. In der Phasen-Tabelle: `Phase 3E — OFD + Barcode | ⏳` → `| ✅ | OFD-Suche + Barcode-Scanner, Leucin-Schätzung, MPS-Tagesübersicht`
4. Tests-Tabelle um neue Zeilen erweitern:
```
tests/unit/calc/leucineFactors.test.js  12 Tests
tests/unit/api/openFoodFacts.test.js    11 Tests  
tests/unit/calc/tracker.test.js        21 Tests  (+ 6 computeMpsSummary)
```
5. Gesamtzahl auf 204 (oder tatsächlichen Stand) aktualisieren

- [ ] **Step 3: Abschluss-Commit**

```bash
git add docs/uebergabedokument-aktuell.md
git commit -m "docs: Phase 3E abgeschlossen — APP_VERSION 1.3.1, OFD + Barcode + MPS-Tagesübersicht"
```

---

## Self-Review

**Spec-Coverage-Check:**

| Anforderung | Task |
|---|---|
| Lebensmittelsuche nach Name über Open Food Facts | Task 3 + Task 5 + Task 7 |
| Barcode-Scanner oder Barcode-Eingabe | Task 6 + Task 7 |
| Produktdaten in Tracker-Einträge übernehmen | Task 7 (handleOFFSelect + handleSave) |
| Leucin-/MPS-Schätzung verbessern | Task 2 (leucineFactors) |
| leucineEstimateG?, proteinQualityScore?, mpsTriggered? befüllen | Task 7 (handleSave mit computeMpsFields) |
| Tagesübersicht „X von Y Mahlzeiten MPS-wirksam" im Heute-Tab | Task 8 + Task 9 |
| APP_VERSION 1.3.1 | Task 1 |
| CSP für OFD-API öffnen | Task 10 |
| Neue Dateien in LOCAL_ASSETS | Task 10 |

Alle Anforderungen abgedeckt. ✓

**Placeholder-Check:** Keine TBD/TODO/„ähnlich wie"-Stellen vorhanden. ✓

**Typ-Konsistenz:**
- `offData: { categoriesTags: string[], offCode: string }` — konsistent in Task 7 Steps 2, 5, 6, 7
- `computeMpsFields(proteinG, categoriesTags)` — definiert in Task 2, verwendet in Task 7 ✓
- `computeMpsSummary(entries, mealSlots)` — definiert in Task 4, verwendet in Task 8 ✓
- `OFFSearchPanel / BarcodePanel` — beide `onSelect` + `onClose` Props — konsistent ✓
