import { getDeviceId } from '../sync/deviceId.js';

// ---------------------------------------------------------------------------
// Schlüssel-Konstanten
// ---------------------------------------------------------------------------
const PROFILE_KEY = 'ernaehrung_profile';
const SETTINGS_KEY = 'ernaehrung_settings';
const UI_STATE_KEY = 'ernaehrung_ui_state';
const SCHEMA_VERSION_KEY = 'ernaehrung_schema_version';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/** @returns {Object} Settings-Defaults */
function defaultSettings() {
  return {
    claudeApiKey: null,
    showAiFeatures: true,
    enablePostmenopauseGuidance: true,
    lastBackupAt: null,
    backupReminderDays: 7,
    installPromptShown: false,
    cacheStrategy: 'cache-first',
    operatingMode: 'local',
  };
}

/** @returns {Object} UiState-Defaults */
function defaultUiState() {
  return {
    activeTab: 'heute',
    collapsedSections: [],
    preferredDayType: 'training',
    preferredTrainingTime: '08:00',
    lastVisitedAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Profil
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} UserProfile
 * @property {string} [name]
 * @property {number} [birthYear]
 * @property {number} updatedAt
 * @property {string} deviceId
 */

/**
 * Lädt das Profil aus localStorage.
 * Gibt null zurück wenn kein Profil gesetzt (kein Default — das macht der Wizard).
 * @returns {UserProfile | null}
 */
export function loadProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Speichert das Profil in localStorage.
 * Setzt updatedAt und deviceId automatisch.
 * @param {Partial<UserProfile>} profile
 * @returns {void}
 */
export function saveProfile(profile) {
  const toSave = {
    ...profile,
    updatedAt: Date.now(),
    deviceId: getDeviceId(),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(toSave));
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/**
 * Lädt die Settings aus localStorage.
 * Gibt Defaults zurück wenn nichts gespeichert.
 * @returns {Object}
 */
export function loadSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings();
  try {
    return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultSettings();
  }
}

/**
 * Speichert Settings — merge, kein Replace.
 * @param {Partial<Object>} patch
 * @returns {void}
 */
export function saveSettings(patch) {
  const current = loadSettings();
  const merged = { ...current, ...patch };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
}

// ---------------------------------------------------------------------------
// UiState
// ---------------------------------------------------------------------------

/**
 * Lädt den UI-Zustand aus localStorage.
 * Gibt Defaults zurück wenn nichts gespeichert.
 * @returns {Object}
 */
export function loadUiState() {
  const raw = localStorage.getItem(UI_STATE_KEY);
  if (!raw) return defaultUiState();
  try {
    return { ...defaultUiState(), ...JSON.parse(raw) };
  } catch {
    return defaultUiState();
  }
}

/**
 * Speichert den UI-Zustand — merge, kein Replace.
 * @param {Partial<Object>} patch
 * @returns {void}
 */
export function saveUiState(patch) {
  const current = loadUiState();
  const merged = { ...current, ...patch };
  localStorage.setItem(UI_STATE_KEY, JSON.stringify(merged));
}

// ---------------------------------------------------------------------------
// Schema-Version
// ---------------------------------------------------------------------------

/**
 * Liest die aktuell gespeicherte Schema-Version.
 * @returns {number} 0 wenn nicht gesetzt
 */
export function getSchemaVersion() {
  const raw = localStorage.getItem(SCHEMA_VERSION_KEY);
  if (!raw) return 0;
  const v = parseInt(raw, 10);
  return isNaN(v) ? 0 : v;
}

/**
 * Setzt die Schema-Version in localStorage.
 * @param {number} v
 * @returns {void}
 */
export function setSchemaVersion(v) {
  localStorage.setItem(SCHEMA_VERSION_KEY, String(v));
}
