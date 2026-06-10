import {
  loadProfile,
  loadSettings,
  loadUiState,
  saveProfile,
  saveSettings,
  saveUiState,
} from './localStorage.js';
import {
  getAllLogs,
  getAllWeeks,
  getAllFavoriteFoods,
  getAllMeals,
  getAllFridgeItems,
  saveLogEntry,
  saveWeek,
  getAllCustomRecipes,
  saveCustomRecipe,
  saveFavoriteFood,
  saveMeal,
  saveFridgeItem,
} from './indexeddb.js';
import { APP_VERSION, SCHEMA_VERSION } from '../version.js';

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Exportiert alle lokalen Daten als JSON-Blob.
 * - claudeApiKey wird IMMER als null gesetzt
 * - Aktualisiert settings.lastBackupAt
 * @returns {Promise<Blob>}
 */
export async function exportAll() {
  const profile = loadProfile();
  const settings = { ...loadSettings(), claudeApiKey: null };
  const uiState = loadUiState();

  const [log, week, recipesCustom, foodsCustom, meals, fridge] = await Promise.all([
    getAllLogs(),
    getAllWeeks(),
    getAllCustomRecipes(),
    getAllFavoriteFoods(),
    getAllMeals(),
    getAllFridgeItems(),
  ]);

  const exportData = {
    exportedAt: Date.now(),
    appVersion: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    data: {
      profile,
      settings,
      uiState,
      log,
      week,
      recipesCustom,
      foodsCustom,
      meals,
      fridge,
    },
  };

  // lastBackupAt aktualisieren
  saveSettings({ lastBackupAt: exportData.exportedAt });

  return new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ImportOptions
 * @property {'merge'} [mode] - 'merge' führt importierte Daten per Schlüssel mit vorhandenen zusammen
 */

/**
 * @typedef {Object} ImportResult
 * @property {boolean} ok
 * @property {string[]} warnings
 * @property {string} [error]
 */

/**
 * Importiert Daten aus einer JSON-Datei.
 * - Versions-Check: schemaVersion in Datei > eigene → Error
 * - claudeApiKey wird aus importierten Daten ignoriert (lokal gesetzter bleibt)
 * - Schreibt Profil/Settings/UiState nach localStorage; log/week/recipesCustom/foodsCustom
 *   werden per Schlüssel in IndexedDB zusammengeführt (Merge, kein Ersetzen)
 * @param {File} file
 * @param {ImportOptions} [options]
 * @returns {Promise<ImportResult>}
 */
export async function importAll(file, options = { mode: 'merge' }) {
  const warnings = [];

  try {
    const text = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, warnings, error: 'Datei ist kein gültiges JSON.' };
    }

    // Versions-Check
    if (typeof parsed.schemaVersion === 'number' && parsed.schemaVersion > SCHEMA_VERSION) {
      return {
        ok: false,
        warnings,
        error: `Import-Datei hat Schema-Version ${parsed.schemaVersion}, App unterstützt nur bis ${SCHEMA_VERSION}.`,
      };
    }

    const data = parsed.data ?? {};

    // Profil schreiben
    if (data.profile) {
      saveProfile(data.profile);
    } else {
      warnings.push('Kein Profil in der Import-Datei gefunden.');
    }

    // Settings schreiben — claudeApiKey aus Import ignorieren
    if (data.settings) {
      const currentSettings = loadSettings();
      const { claudeApiKey: _ignored, ...importedSettings } = data.settings;
      saveSettings({ ...importedSettings, claudeApiKey: currentSettings.claudeApiKey });
    } else {
      warnings.push('Keine Settings in der Import-Datei gefunden.');
    }

    // UiState schreiben
    if (data.uiState) {
      saveUiState(data.uiState);
    } else {
      warnings.push('Kein UiState in der Import-Datei gefunden.');
    }

    // log nach IndexedDB schreiben
    if (Array.isArray(data.log) && data.log.length > 0) {
      for (const entry of data.log) {
        await saveLogEntry(entry);
      }
    }

    // week nach IndexedDB schreiben
    if (Array.isArray(data.week) && data.week.length > 0) {
      for (const entry of data.week) {
        await saveWeek(entry);
      }
    }

    // recipesCustom nach IndexedDB schreiben
    if (Array.isArray(data.recipesCustom) && data.recipesCustom.length > 0) {
      for (const recipe of data.recipesCustom) {
        await saveCustomRecipe(recipe);
      }
    }

    // foodsCustom (Favoriten) nach IndexedDB schreiben
    if (Array.isArray(data.foodsCustom) && data.foodsCustom.length > 0) {
      for (const food of data.foodsCustom) {
        await saveFavoriteFood(food);
      }
    }

    // meals (Favoriten-Mahlzeiten) nach IndexedDB schreiben
    if (Array.isArray(data.meals) && data.meals.length > 0) {
      for (const meal of data.meals) {
        await saveMeal(meal);
      }
    }

    // fridge (Kühlschrank) nach IndexedDB schreiben
    if (Array.isArray(data.fridge) && data.fridge.length > 0) {
      for (const item of data.fridge) {
        await saveFridgeItem(item);
      }
    }

    return { ok: true, warnings };
  } catch (err) {
    console.error('[exportImport] importAll fehlgeschlagen:', err);
    return { ok: false, warnings, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// API-Key in Zwischenablage kopieren
// ---------------------------------------------------------------------------

/**
 * Kopiert den gespeicherten Claude API-Key in die Zwischenablage.
 * @returns {Promise<boolean>} true wenn erfolgreich
 */
export async function copyApiKeyToClipboard() {
  try {
    const settings = loadSettings();
    const key = settings.claudeApiKey;
    if (!key) return false;
    await navigator.clipboard.writeText(key);
    return true;
  } catch {
    return false;
  }
}
