import { SCHEMA_VERSION } from '../version.js';
import { openDB } from '../lib.js';

export const CURRENT_SCHEMA_VERSION = SCHEMA_VERSION;

const DB_NAME = 'ernaehrung-db';

/**
 * IndexedDB-Migrationen pro Versionsnummer.
 * Jede Funktion erhält das IDBDatabase-Objekt aus dem upgrade-Callback.
 */
export const INDEXED_DB_MIGRATIONS = {
  /**
   * v1: Grundstruktur — log- und week-Stores
   * @param {import('idb').IDBPDatabase} db
   */
  1: (db) => {
    // log-Store: Tageseinträge, keyPath = ISO-Datum "YYYY-MM-DD"
    const logStore = db.createObjectStore('log', { keyPath: 'date' });
    logStore.createIndex('dayType', 'dayType', { unique: false });
    logStore.createIndex('updatedAt', 'updatedAt', { unique: false });

    // week-Store: Wocheneinträge, keyPath = "YYYY-WWW" z.B. "2026-W22"
    const weekStore = db.createObjectStore('week', { keyPath: 'weekKey' });
    weekStore.createIndex('year', 'year', { unique: false });
    weekStore.createIndex('updatedAt', 'updatedAt', { unique: false });
  },

  // v2: kommt in Phase 3 (Mahlzeiten-Details)
  // v3: kommt in Phase 4 (Rezepte)
  // v4: kommt in Phase 5 (Körperwerte)
  // v5: kommt in Phase 6 (Sync-Metadaten)
};

/**
 * localStorage-Migrationen pro Versionsnummer.
 */
export const LOCAL_STORAGE_MIGRATIONS = {
  /**
   * v1: Default-Settings und Default-UiState schreiben.
   * Kein Profil — das übernimmt der Erststart-Wizard.
   */
  1: () => {
    seedDefaults();
  },
};

/**
 * Schreibt Default-Settings und Default-UiState in localStorage,
 * sofern noch nicht vorhanden.
 */
function seedDefaults() {
  const SETTINGS_KEY = 'ernaehrung_settings';
  const UI_STATE_KEY = 'ernaehrung_ui_state';

  if (!localStorage.getItem(SETTINGS_KEY)) {
    const defaultSettings = {
      claudeApiKey: null,
      showAiFeatures: true,
      enablePostmenopauseGuidance: true,
      lastBackupAt: null,
      backupReminderDays: 7,
      installPromptShown: false,
      cacheStrategy: 'cache-first',
      operatingMode: 'local',
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
  }

  if (!localStorage.getItem(UI_STATE_KEY)) {
    const defaultUiState = {
      activeTab: 'heute',
      collapsedSections: [],
      preferredDayType: 'training',
      preferredTrainingTime: '08:00',
      lastVisitedAt: Date.now(),
    };
    localStorage.setItem(UI_STATE_KEY, JSON.stringify(defaultUiState));
  }
}

/**
 * Führt alle ausstehenden Migrationen durch (localStorage + IndexedDB).
 * @returns {Promise<{ok: boolean, appliedVersions: number[], error?: string}>}
 */
export async function runMigrations() {
  const appliedVersions = [];

  try {
    // Aktuelle Schema-Version aus localStorage lesen
    const stored = localStorage.getItem('ernaehrung_schema_version');
    const currentVersion = stored ? parseInt(stored, 10) : 0;

    // localStorage-Migrationen anwenden
    for (let v = currentVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
      if (LOCAL_STORAGE_MIGRATIONS[v]) {
        LOCAL_STORAGE_MIGRATIONS[v]();
        appliedVersions.push(v);
      }
    }

    // IndexedDB öffnen und Upgrade-Migrationen anwenden
    await openDB(DB_NAME, CURRENT_SCHEMA_VERSION, {
      upgrade(db, oldVersion) {
        for (let v = oldVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
          if (INDEXED_DB_MIGRATIONS[v]) {
            INDEXED_DB_MIGRATIONS[v](db);
          }
        }
      },
    });

    // Schema-Version in localStorage aktualisieren
    localStorage.setItem('ernaehrung_schema_version', String(CURRENT_SCHEMA_VERSION));

    return { ok: true, appliedVersions };
  } catch (err) {
    console.error('[migrations] runMigrations fehlgeschlagen:', err);
    return { ok: false, appliedVersions, error: err.message };
  }
}
