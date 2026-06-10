import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../js/storage/indexeddb.js', () => ({
  getAllLogs:          vi.fn(),
  getAllWeeks:         vi.fn(),
  getAllCustomRecipes: vi.fn(),
  getAllFavoriteFoods: vi.fn(),
  saveLogEntry:       vi.fn(),
  saveWeek:           vi.fn(),
  getAllMeals:        vi.fn(),
  saveCustomRecipe:   vi.fn(),
  saveFavoriteFood:   vi.fn(),
  saveMeal:           vi.fn(),
}));

vi.mock('../../../js/storage/localStorage.js', () => ({
  loadProfile:  vi.fn(() => ({ name: 'Test' })),
  loadSettings: vi.fn(() => ({ lastBackupAt: null, claudeApiKey: 'secret-key' })),
  loadUiState:  vi.fn(() => ({ activeTab: 'heute' })),
  saveProfile:  vi.fn(),
  saveSettings: vi.fn(),
  saveUiState:  vi.fn(),
}));

import { exportAll, importAll } from '../../../js/storage/exportImport.js';
import * as idb from '../../../js/storage/indexeddb.js';

const TEST_RECIPE = {
  id: 'test-r1', name: 'Testrezept', mealSlot: 'Frühstück', servings: 2,
  ingredients: [{ name: 'Quark', amount: 200, unit: 'g', isMain: true }],
  steps: ['Quark abwiegen.'],
  kcal: 300, protein: 30, carbs: 20, fat: 5,
  source: 'manual', createdAt: 1000, updatedAt: 1000,
};

const TEST_FOOD = {
  id: 'fav-1', name: 'Hüttenkäse', kcal100: 90, p100: 11, c100: 3, f100: 3,
  source: 'manual', createdAt: 1000, updatedAt: 1000,
};

const TEST_LOG = {
  date: '2026-06-01', entries: [],
  createdAt: 1000, updatedAt: 1000,
};

const TEST_WEEK = {
  weekKey: '2026-W22', year: 2026,
  createdAt: 1000, updatedAt: 1000,
};

const TEST_MEAL = {
  id: 'meal-1', name: 'Mein Frühstücksquark', defaultSlot: 'Frühstück',
  items: [{ foodRef: 'fav-1', foodName: 'Magerquark', gramm: 250, kcal: 168, p: 30, c: 10, f: 0.5 }],
  totalMacros: { kcal: 168, p: 30, c: 10, f: 0.5 },
  lastUsed: null, createdAt: 1000, updatedAt: 1000,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(idb.getAllLogs).mockResolvedValue([]);
  vi.mocked(idb.getAllWeeks).mockResolvedValue([]);
  vi.mocked(idb.getAllCustomRecipes).mockResolvedValue([]);
  vi.mocked(idb.getAllFavoriteFoods).mockResolvedValue([]);
  vi.mocked(idb.saveLogEntry).mockResolvedValue(undefined);
  vi.mocked(idb.saveWeek).mockResolvedValue(undefined);
  vi.mocked(idb.saveCustomRecipe).mockResolvedValue(undefined);
  vi.mocked(idb.saveFavoriteFood).mockResolvedValue(undefined);
  vi.mocked(idb.getAllMeals).mockResolvedValue([]);
  vi.mocked(idb.saveMeal).mockResolvedValue(undefined);
});

describe('exportAll / importAll — meals (Favoriten-Mahlzeiten)', () => {
  it('enthält data.meals als leeres Array wenn keine Mahlzeiten vorhanden', async () => {
    const blob = await exportAll();
    const json = JSON.parse(await blob.text());
    expect(Array.isArray(json.data.meals)).toBe(true);
    expect(json.data.meals).toHaveLength(0);
  });

  it('enthält gespeicherte Mahlzeiten in data.meals', async () => {
    vi.mocked(idb.getAllMeals).mockResolvedValue([TEST_MEAL]);
    const blob = await exportAll();
    const json = JSON.parse(await blob.text());
    expect(json.data.meals).toHaveLength(1);
    expect(json.data.meals[0].name).toBe('Mein Frühstücksquark');
  });

  it('ruft saveMeal für jede Mahlzeit in data.meals auf', async () => {
    const file = new Blob([JSON.stringify({
      exportedAt: Date.now(), appVersion: '1.6.0', schemaVersion: 3,
      data: { profile: null, settings: null, uiState: null, meals: [TEST_MEAL] },
    })], { type: 'application/json' });

    await importAll(file);

    expect(vi.mocked(idb.saveMeal)).toHaveBeenCalledOnce();
    expect(vi.mocked(idb.saveMeal)).toHaveBeenCalledWith(TEST_MEAL);
  });

  it('Altdaten-Export ohne meals-Feld importiert ohne Fehler', async () => {
    const file = new Blob([JSON.stringify({
      exportedAt: Date.now(), appVersion: '1.4.1', schemaVersion: 3,
      data: { profile: null, settings: null, uiState: null },
    })], { type: 'application/json' });

    const result = await importAll(file);
    expect(result.ok).toBe(true);
    expect(vi.mocked(idb.saveMeal)).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// exportAll
// ---------------------------------------------------------------------------

describe('exportAll — recipesCustom', () => {
  it('enthält data.recipesCustom als leeres Array wenn keine Rezepte vorhanden', async () => {
    const blob = await exportAll();
    const json = JSON.parse(await blob.text());
    expect(Array.isArray(json.data.recipesCustom)).toBe(true);
    expect(json.data.recipesCustom).toHaveLength(0);
  });

  it('enthält eigenes Rezept in data.recipesCustom', async () => {
    vi.mocked(idb.getAllCustomRecipes).mockResolvedValue([TEST_RECIPE]);
    const blob = await exportAll();
    const json = JSON.parse(await blob.text());
    expect(json.data.recipesCustom).toHaveLength(1);
    expect(json.data.recipesCustom[0].name).toBe('Testrezept');
  });
});

describe('exportAll — foodsCustom (Favoriten)', () => {
  it('enthält data.foodsCustom als leeres Array wenn keine Favoriten vorhanden', async () => {
    const blob = await exportAll();
    const json = JSON.parse(await blob.text());
    expect(Array.isArray(json.data.foodsCustom)).toBe(true);
    expect(json.data.foodsCustom).toHaveLength(0);
  });

  it('enthält Favorit-Lebensmittel in data.foodsCustom', async () => {
    vi.mocked(idb.getAllFavoriteFoods).mockResolvedValue([TEST_FOOD]);
    const blob = await exportAll();
    const json = JSON.parse(await blob.text());
    expect(json.data.foodsCustom).toHaveLength(1);
    expect(json.data.foodsCustom[0].name).toBe('Hüttenkäse');
  });
});

describe('exportAll — log', () => {
  it('enthält data.log als leeres Array wenn keine Einträge vorhanden', async () => {
    const blob = await exportAll();
    const json = JSON.parse(await blob.text());
    expect(Array.isArray(json.data.log)).toBe(true);
    expect(json.data.log).toHaveLength(0);
  });

  it('enthält alle Log-Einträge in data.log', async () => {
    vi.mocked(idb.getAllLogs).mockResolvedValue([TEST_LOG]);
    const blob = await exportAll();
    const json = JSON.parse(await blob.text());
    expect(json.data.log).toHaveLength(1);
    expect(json.data.log[0].date).toBe('2026-06-01');
  });
});

describe('exportAll — week', () => {
  it('enthält data.week als leeres Array wenn keine Einträge vorhanden', async () => {
    const blob = await exportAll();
    const json = JSON.parse(await blob.text());
    expect(Array.isArray(json.data.week)).toBe(true);
    expect(json.data.week).toHaveLength(0);
  });

  it('enthält alle Wochen-Einträge in data.week', async () => {
    vi.mocked(idb.getAllWeeks).mockResolvedValue([TEST_WEEK]);
    const blob = await exportAll();
    const json = JSON.parse(await blob.text());
    expect(json.data.week).toHaveLength(1);
    expect(json.data.week[0].weekKey).toBe('2026-W22');
  });
});

describe('exportAll — claudeApiKey wird nicht exportiert', () => {
  it('setzt settings.claudeApiKey immer auf null', async () => {
    const blob = await exportAll();
    const json = JSON.parse(await blob.text());
    expect(json.data.settings.claudeApiKey).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// importAll — recipesCustom
// ---------------------------------------------------------------------------

describe('importAll — recipesCustom', () => {
  it('ruft saveCustomRecipe für jedes Rezept in data.recipesCustom auf', async () => {
    const file = new Blob([JSON.stringify({
      exportedAt: Date.now(), appVersion: '1.3.0', schemaVersion: 3,
      data: { profile: null, settings: null, uiState: null, recipesCustom: [TEST_RECIPE] },
    })], { type: 'application/json' });

    await importAll(file);

    expect(vi.mocked(idb.saveCustomRecipe)).toHaveBeenCalledOnce();
    expect(vi.mocked(idb.saveCustomRecipe)).toHaveBeenCalledWith(TEST_RECIPE);
  });

  it('crasht nicht wenn data.recipesCustom fehlt (Altdaten)', async () => {
    const file = new Blob([JSON.stringify({
      exportedAt: Date.now(), appVersion: '1.2.7', schemaVersion: 2,
      data: { profile: null, settings: null, uiState: null },
    })], { type: 'application/json' });

    await expect(importAll(file)).resolves.not.toThrow();
    expect(vi.mocked(idb.saveCustomRecipe)).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// importAll — foodsCustom (Favoriten)
// ---------------------------------------------------------------------------

describe('importAll — foodsCustom (Favoriten)', () => {
  it('ruft saveFavoriteFood für jeden Favoriten in data.foodsCustom auf', async () => {
    const file = new Blob([JSON.stringify({
      exportedAt: Date.now(), appVersion: '1.4.0', schemaVersion: 3,
      data: { profile: null, settings: null, uiState: null, foodsCustom: [TEST_FOOD] },
    })], { type: 'application/json' });

    await importAll(file);

    expect(vi.mocked(idb.saveFavoriteFood)).toHaveBeenCalledOnce();
    expect(vi.mocked(idb.saveFavoriteFood)).toHaveBeenCalledWith(TEST_FOOD);
  });

  it('crasht nicht wenn data.foodsCustom fehlt (Altdaten)', async () => {
    const file = new Blob([JSON.stringify({
      exportedAt: Date.now(), appVersion: '1.3.0', schemaVersion: 3,
      data: { profile: null, settings: null, uiState: null },
    })], { type: 'application/json' });

    await expect(importAll(file)).resolves.not.toThrow();
    expect(vi.mocked(idb.saveFavoriteFood)).not.toHaveBeenCalled();
  });
});
