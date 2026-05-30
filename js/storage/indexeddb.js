import { openDB } from '../lib.js';
import { SCHEMA_VERSION } from '../version.js';
import { INDEXED_DB_MIGRATIONS } from './migrations.js';
import { getDeviceId } from '../sync/deviceId.js';

const DB_NAME = 'ernaehrung-db';
const CURRENT_SCHEMA_VERSION = SCHEMA_VERSION;

/**
 * Singleton-Promise für die IndexedDB-Verbindung.
 * @type {Promise<import('idb').IDBPDatabase> | null}
 */
let dbPromise = null;

/**
 * Gibt das Singleton-DB-Promise zurück.
 * @returns {Promise<import('idb').IDBPDatabase>}
 */
function openDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, CURRENT_SCHEMA_VERSION, {
      upgrade(db, oldVersion) {
        for (let v = oldVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
          if (INDEXED_DB_MIGRATIONS[v]) {
            INDEXED_DB_MIGRATIONS[v](db);
          }
        }
      },
    });
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// log-Store
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} LogEntry
 * @property {string} date - ISO-Datum "YYYY-MM-DD" (keyPath)
 * @property {string} dayType - z.B. 'training' | 'rest' | 'easy'
 * @property {number} createdAt - Unix-Timestamp ms
 * @property {number} updatedAt - Unix-Timestamp ms
 * @property {string} deviceId - Geräte-UUID
 */

/**
 * Gibt den Tageseintrag für ein bestimmtes Datum zurück.
 * @param {string} date - "YYYY-MM-DD"
 * @returns {Promise<LogEntry | null>}
 */
export async function getLogForDate(date) {
  const db = await openDb();
  const entry = await db.get('log', date);
  return entry ?? null;
}

/**
 * Speichert einen Tageseintrag. Setzt createdAt/updatedAt/deviceId automatisch.
 * @param {Partial<LogEntry> & {date: string}} entry
 * @returns {Promise<void>}
 */
export async function saveLogEntry(entry) {
  const db = await openDb();
  const now = Date.now();
  const existing = await db.get('log', entry.date);

  const toSave = {
    ...existing,
    ...entry,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deviceId: getDeviceId(),
  };

  await db.put('log', toSave);
}

/**
 * Gibt alle Tageseinträge zwischen zwei Daten zurück (inklusive Grenzen).
 * @param {string} fromDate - "YYYY-MM-DD"
 * @param {string} toDate - "YYYY-MM-DD"
 * @returns {Promise<LogEntry[]>}
 */
export async function getLogsBetween(fromDate, toDate) {
  const db = await openDb();
  const range = globalThis.IDBKeyRange.bound(fromDate, toDate);
  return db.getAll('log', range);
}

// ---------------------------------------------------------------------------
// week-Store
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} WeekEntry
 * @property {string} weekKey - "YYYY-WWW" z.B. "2026-W22" (keyPath)
 * @property {number} year - Vierstelliges Jahr
 * @property {number} createdAt - Unix-Timestamp ms
 * @property {number} updatedAt - Unix-Timestamp ms
 * @property {string} deviceId - Geräte-UUID
 */

/**
 * Gibt den Wocheneintrag für einen weekKey zurück.
 * @param {string} weekKey - "YYYY-WWW"
 * @returns {Promise<WeekEntry | null>}
 */
export async function getWeek(weekKey) {
  const db = await openDb();
  const entry = await db.get('week', weekKey);
  return entry ?? null;
}

/**
 * Speichert einen Wocheneintrag. Setzt createdAt/updatedAt/deviceId automatisch.
 * @param {Partial<WeekEntry> & {weekKey: string}} entry
 * @returns {Promise<void>}
 */
export async function saveWeek(entry) {
  const db = await openDb();
  const now = Date.now();
  const existing = await db.get('week', entry.weekKey);

  const toSave = {
    ...existing,
    ...entry,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deviceId: getDeviceId(),
  };

  await db.put('week', toSave);
}

/**
 * Gibt alle Wocheneinträge für ein bestimmtes Jahr zurück.
 * @param {number} year - Vierstelliges Jahr
 * @returns {Promise<WeekEntry[]>}
 */
export async function getWeeksByYear(year) {
  const db = await openDb();
  const index = db.transaction('week').store.index('year');
  return index.getAll(year);
}
