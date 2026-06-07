/**
 * Open Food Facts API — Wrapper für Produktsuche und Barcode-Lookup.
 * mapOFFProduct, parseOFFSearchResults, rankOFFResults, classifyOFFError: pure, testbar.
 * searchOFF, fetchOFFByBarcode: Netzwerk-Requests mit Timeout + 1 Retry.
 * @module api/openFoodFacts
 */

const OFF_FIELDS = 'code,product_name,product_name_de,brands,nutriments,categories_tags';
const OFF_TIMEOUT_MS = 9000;

/** Kategorien, die auf stark verarbeitete Produkte oder Getränke hinweisen. */
const PROCESSED_PATTERNS = [
  'juice', 'nectar', 'beverage', 'soda', 'soft-drink', 'energy-drink',
  'compote', 'jam', 'marmelade', 'syrup', 'jelly',
];

/**
 * Entfernt Leerzeichen, Bindestriche und Scan-Artefakte aus Barcode-Eingaben.
 * @param {string} barcode
 * @returns {string}
 */
export function normalizeBarcode(barcode) {
  return String(barcode ?? '').replace(/\D/g, '');
}

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
 * Berechnet einen Relevanz-Score für ein gemapptes OFD-Produkt.
 * Exakte/Präfix-Treffer werden bevorzugt; Getränke/Verarbeitetes abgestraft.
 *
 * @param {{ name: string, categoriesTags: string[] }} product
 * @param {string} queryLower - Suchbegriff in Kleinbuchstaben
 * @returns {number}
 */
function scoreOFFProduct(product, queryLower) {
  const nameLower = product.name.toLowerCase();
  let score = 0;

  if (nameLower === queryLower) score += 100;
  else if (nameLower.startsWith(queryLower)) score += 60;
  else if (nameLower.split(/[\s,\-]/)[0] === queryLower) score += 50;
  else if (nameLower.includes(queryLower)) score += 20;

  const cats = product.categoriesTags.join(' ').toLowerCase();
  if (PROCESSED_PATTERNS.some(p => cats.includes(p))) score -= 30;

  return score;
}

/**
 * Sortiert OFD-Produkte nach Relevanz zum Suchbegriff (immutabel).
 * Exakte und anfangsbasierte Treffer nach oben; Säfte/Kompotte nach unten.
 *
 * @param {ReturnType<typeof mapOFFProduct>[]} products
 * @param {string} query - Originaler Suchbegriff
 * @returns {ReturnType<typeof mapOFFProduct>[]}
 */
export function rankOFFResults(products, query) {
  if (products.length === 0) return products;
  const q = query.trim().toLowerCase();
  return [...products].sort((a, b) => scoreOFFProduct(b, q) - scoreOFFProduct(a, q));
}

/**
 * Klassifiziert einen OFD-Fehler für die UI-Anzeige.
 *
 * @param {Error} err
 * @returns {'too_short' | 'timeout' | 'server' | 'network' | 'unknown'}
 */
export function classifyOFFError(err) {
  const msg = err?.message ?? '';
  if (msg === 'OFD_QUERY_TOO_SHORT') return 'too_short';
  if (msg === 'OFD_TIMEOUT') return 'timeout';
  if (msg.startsWith('OFD_SERVER_ERROR')) return 'server';
  if (msg === 'OFD_NETWORK') return 'network';
  return 'unknown';
}

/**
 * Führt einen fetch mit 9s-Timeout und 1 automatischem Retry durch.
 * Wirft typisierte OFD_*-Fehler für die UI-Klassifizierung.
 *
 * @param {string} url
 * @returns {Promise<Response>}
 */
async function fetchOFF(url) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(OFF_TIMEOUT_MS) });
      if (resp.ok) return resp;
      if (resp.status >= 500 && attempt === 0) { lastErr = resp.status; continue; }
      lastErr = resp.status;
      break;
    } catch (err) {
      lastErr = err;
      if (attempt === 0) continue; // 1 Retry bei Netzwerk-/Timeout-Fehler
    }
  }
  if (lastErr?.name === 'AbortError' || lastErr?.name === 'TimeoutError') throw new Error('OFD_TIMEOUT');
  if (typeof lastErr === 'number' && lastErr >= 500) throw new Error(`OFD_SERVER_ERROR:${lastErr}`);
  if (typeof lastErr === 'number') throw new Error(`OFD_HTTP_ERROR:${lastErr}`);
  throw new Error('OFD_NETWORK');
}

/**
 * Sucht Produkte nach Name über die Open Food Facts API.
 * Wirft typisierte OFD_*-Fehler; Ergebnisse sind nach Relevanz sortiert.
 *
 * @param {string} query - Suchbegriff (mindestens 2 Zeichen)
 * @returns {Promise<ReturnType<typeof mapOFFProduct>[]>}
 */
export async function searchOFF(query) {
  const q = query.trim();
  if (q.length < 2) throw new Error('OFD_QUERY_TOO_SHORT');
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&lc=de&fields=${OFF_FIELDS}`;
  const resp = await fetchOFF(url);
  const products = parseOFFSearchResults(await resp.json());
  return rankOFFResults(products, q);
}

/**
 * Lädt ein Produkt anhand seines Barcodes von Open Food Facts.
 * Wirft typisierte OFD_*-Fehler oder 'Produkt nicht gefunden'.
 *
 * @param {string} barcode - EAN-13, EAN-8, UPC-A oder UPC-E
 * @returns {Promise<ReturnType<typeof mapOFFProduct>>}
 */
export async function fetchOFFByBarcode(barcode) {
  const normalized = normalizeBarcode(barcode);
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(normalized)}.json?fields=${OFF_FIELDS}`;
  const resp = await fetchOFF(url);
  const json = await resp.json();
  if (json.status !== 1) throw new Error('Produkt nicht gefunden');
  return mapOFFProduct(json.product);
}
