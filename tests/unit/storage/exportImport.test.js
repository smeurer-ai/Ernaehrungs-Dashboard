import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../js/storage/indexeddb.js', () => ({
  getAllCustomRecipes: vi.fn(),
  saveCustomRecipe:   vi.fn(),
  saveLogEntry:       vi.fn(),
  saveWeek:           vi.fn(),
  getAllFavoriteFoods: vi.fn(),
  saveFavoriteFood:   vi.fn(),
}));

vi.mock('../../../js/storage/localStorage.js', () => ({
  loadProfile:  vi.fn(() => ({ name: 'Test' })),
  loadSettings: vi.fn(() => ({ lastBackupAt: null, claudeApiKey: null })),
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(idb.getAllCustomRecipes).mockResolvedValue([]);
  vi.mocked(idb.getAllFavoriteFoods).mockResolvedValue([]);
  vi.mocked(idb.saveLogEntry).mockResolvedValue(undefined);
  vi.mocked(idb.saveWeek).mockResolvedValue(undefined);
  vi.mocked(idb.saveCustomRecipe).mockResolvedValue(undefined);
});

describe('exportAll — recipesCustom', () => {
  it('enthält data.recipesCustom als leeres Array wenn keine Rezepte vorhanden', async () => {
    vi.mocked(idb.getAllCustomRecipes).mockResolvedValue([]);
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
