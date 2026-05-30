/**
 * Device-ID Verwaltung.
 * Einmal gesetzt, wird die ID nie überschrieben.
 * Wird beim Export NICHT mitexportiert.
 */

const STORAGE_KEY = 'ernaehrung_device_id';

/**
 * Generiert eine UUID. Nutzt crypto.randomUUID() falls verfügbar,
 * sonst einen Math.random()-basierten Fallback.
 * @returns {string}
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback für ältere Browser
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gibt die persistente Device-ID zurück.
 * Wird beim ersten Aufruf generiert und in localStorage gespeichert.
 * @returns {string}
 */
export function getDeviceId() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
