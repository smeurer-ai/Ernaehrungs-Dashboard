/**
 * Reine Datums-Hilfsfunktionen.
 * Kein DOM, kein State — direkt testbar.
 * @module calc/dates
 */

/**
 * Liefert ein Datum als YYYY-MM-DD in LOKALER Zeit.
 *
 * Fix TS-08: `new Date().toISOString()` rechnet in UTC — kurz nach Mitternacht
 * (z.B. 00:30 deutscher Zeit) ergab das noch das Datum des Vortags, und
 * Tracker-Einträge landeten am falschen Tag.
 *
 * @param {Date} [date] - Default: jetzt
 * @returns {string} z.B. "2026-06-10"
 */
export function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
