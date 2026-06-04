import { describe, it, expect } from 'vitest';
import { INDEXED_DB_MIGRATIONS } from '../../../js/storage/migrations.js';

function makeMockDb() {
  const stores = {};
  return {
    db: {
      createObjectStore(storeName, opts) {
        const indices = [];
        stores[storeName] = { opts, indices };
        return {
          createIndex(name) { indices.push(name); },
        };
      },
    },
    stores,
  };
}

describe('INDEXED_DB_MIGRATIONS[3] — v3 Schema', () => {
  it('ist als Funktion definiert', () => {
    expect(typeof INDEXED_DB_MIGRATIONS[3]).toBe('function');
  });

  it('erstellt recipesCustom mit keyPath "id"', () => {
    const { db, stores } = makeMockDb();
    INDEXED_DB_MIGRATIONS[3](db);
    expect(stores['recipesCustom']?.opts?.keyPath).toBe('id');
  });

  it('erstellt recipesCustom mit Indices name, mealSlot, updatedAt', () => {
    const { db, stores } = makeMockDb();
    INDEXED_DB_MIGRATIONS[3](db);
    expect(stores['recipesCustom']?.indices).toContain('name');
    expect(stores['recipesCustom']?.indices).toContain('mealSlot');
    expect(stores['recipesCustom']?.indices).toContain('updatedAt');
  });

  it('erstellt recipePhotos mit keyPath "id"', () => {
    const { db, stores } = makeMockDb();
    INDEXED_DB_MIGRATIONS[3](db);
    expect(stores['recipePhotos']?.opts?.keyPath).toBe('id');
  });

  it('erstellt recipePhotos mit Index recipeId', () => {
    const { db, stores } = makeMockDb();
    INDEXED_DB_MIGRATIONS[3](db);
    expect(stores['recipePhotos']?.indices).toContain('recipeId');
  });
});
