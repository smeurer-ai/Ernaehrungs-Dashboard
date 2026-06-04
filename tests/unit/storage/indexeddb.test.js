import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';

vi.mock('../../../js/lib.js', () => ({ openDB: vi.fn() }));
vi.mock('../../../js/version.js', () => ({ SCHEMA_VERSION: 3 }));
vi.mock('../../../js/sync/deviceId.js', () => ({ getDeviceId: () => 'test-device' }));

import { openDB } from '../../../js/lib.js';
import {
  getAllCustomRecipes,
  saveCustomRecipe,
  deleteCustomRecipe,
} from '../../../js/storage/indexeddb.js';

const store = {};
const mockDb = {
  get:    vi.fn(async (_, key) => store[key]),
  put:    vi.fn(async (_, item) => { store[item.id] = { ...item }; }),
  getAll: vi.fn(async () => Object.values(store)),
};

beforeAll(() => {
  vi.mocked(openDB).mockResolvedValue(mockDb);
});

afterEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
  vi.mocked(openDB).mockResolvedValue(mockDb);
  mockDb.get.mockImplementation(async (_, key) => store[key]);
  mockDb.put.mockImplementation(async (_, item) => { store[item.id] = { ...item }; });
  mockDb.getAll.mockImplementation(async () => Object.values(store));
});

const RECIPE = {
  id: 'r-test-1', name: 'Testrezept', mealSlot: 'Frühstück', servings: 2,
  ingredients: [], steps: ['Schritt 1'],
  kcal: 300, protein: 30, carbs: 20, fat: 5,
  source: 'manual',
};

describe('saveCustomRecipe', () => {
  it('speichert ein neues Rezept in der DB', async () => {
    await saveCustomRecipe(RECIPE);
    expect(mockDb.put).toHaveBeenCalledOnce();
    const saved = mockDb.put.mock.calls[0][1];
    expect(saved.id).toBe('r-test-1');
    expect(saved.name).toBe('Testrezept');
    expect(saved.deviceId).toBe('test-device');
    expect(typeof saved.createdAt).toBe('number');
    expect(typeof saved.updatedAt).toBe('number');
  });

  it('überschreibt ein bestehendes Rezept ohne createdAt zu ändern', async () => {
    const original = { ...RECIPE, createdAt: 1000, updatedAt: 1000 };
    store[RECIPE.id] = original;
    mockDb.get.mockResolvedValueOnce(original);

    await saveCustomRecipe({ ...RECIPE, name: 'Geändert' });

    const saved = mockDb.put.mock.calls[0][1];
    expect(saved.name).toBe('Geändert');
    expect(saved.createdAt).toBe(1000);
    expect(saved.updatedAt).toBeGreaterThan(1000);
  });
});

describe('getAllCustomRecipes', () => {
  it('gibt leeres Array zurück wenn keine Rezepte', async () => {
    const result = await getAllCustomRecipes();
    expect(result).toEqual([]);
  });

  it('gibt nur nicht-gelöschte Rezepte zurück', async () => {
    store['r1'] = { ...RECIPE, id: 'r1', updatedAt: 1000 };
    store['r2'] = { ...RECIPE, id: 'r2', updatedAt: 2000, deletedAt: Date.now() };
    const result = await getAllCustomRecipes();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r1');
  });

  it('sortiert nach updatedAt absteigend', async () => {
    store['r1'] = { ...RECIPE, id: 'r1', updatedAt: 1000 };
    store['r2'] = { ...RECIPE, id: 'r2', updatedAt: 3000 };
    store['r3'] = { ...RECIPE, id: 'r3', updatedAt: 2000 };
    const result = await getAllCustomRecipes();
    expect(result.map(r => r.id)).toEqual(['r2', 'r3', 'r1']);
  });
});

describe('deleteCustomRecipe (Soft-Delete)', () => {
  it('setzt deletedAt und überschreibt den Eintrag', async () => {
    const recipe = { ...RECIPE, createdAt: 1000, updatedAt: 1000 };
    store[RECIPE.id] = recipe;
    mockDb.get.mockResolvedValueOnce(recipe);

    await deleteCustomRecipe(RECIPE.id);

    const saved = mockDb.put.mock.calls[0][1];
    expect(saved.id).toBe(RECIPE.id);
    expect(typeof saved.deletedAt).toBe('number');
  });

  it('tut nichts wenn id nicht existiert', async () => {
    mockDb.get.mockResolvedValueOnce(undefined);
    await deleteCustomRecipe('nicht-vorhanden');
    expect(mockDb.put).not.toHaveBeenCalled();
  });

  it('nach Soft-Delete erscheint Rezept nicht mehr in getAllCustomRecipes', async () => {
    store[RECIPE.id] = { ...RECIPE, updatedAt: 1000 };
    mockDb.get.mockResolvedValueOnce(store[RECIPE.id]);

    await deleteCustomRecipe(RECIPE.id);
    const result = await getAllCustomRecipes();
    const found = result.find(r => r.id === RECIPE.id);
    expect(found).toBeUndefined();
  });
});
