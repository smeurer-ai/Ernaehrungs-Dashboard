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
