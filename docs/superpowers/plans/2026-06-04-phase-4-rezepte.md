# Phase 4 — Rezepte: Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rezepte-Tab mit vollständiger Datenstruktur, expandierbaren Karten, eigenem Rezept-Editor und Schema v3 (recipesCustom + recipePhotos).

**Architecture:** Statische Initial-Rezepte in `js/data/initialRecipes.js` (kein Store), eigene Rezepte in IndexedDB `recipesCustom`. Expandable RecipeCard, RecipeEditor-Modal via bestehender Modal-Komponente. Export/Import um recipesCustom ergänzt.

**Tech Stack:** htm/React 18 (kein JSX, kein Build), idb v8, Vitest 1.x, vi.mock für Storage-Tests.

---

## Datei-Übersicht

| Datei | Neu/Geändert |
|---|---|
| `js/data/mealSlots.js` | neu |
| `js/data/initialRecipes.js` | neu |
| `js/hooks/useRecipes.js` | neu |
| `js/tabs/rezepte/RecipeCard.js` | neu |
| `js/tabs/rezepte/RecipeEditor.js` | neu |
| `js/tabs/rezepte/RezepteTab.js` | geändert |
| `js/storage/indexeddb.js` | erweitert |
| `js/storage/exportImport.js` | erweitert |
| `js/storage/migrations.js` | erweitert |
| `js/version.js` | SCHEMA_VERSION 2→3, APP_VERSION 1.2.7→1.3.0 |
| `service-worker.js` | APP_VERSION 1.3.0, LOCAL_ASSETS |
| `tests/unit/storage/migrations.test.js` | neu |
| `tests/unit/storage/indexeddb.test.js` | neu |
| `tests/unit/storage/exportImport.test.js` | neu |
| `tests/unit/data/initialRecipes.test.js` | neu |

---

## Task 1: Konstanten — `js/data/mealSlots.js`

**Files:**
- Create: `js/data/mealSlots.js`

Keine Tests nötig — reine Konstantendatei.

- [ ] **Schritt 1: Datei anlegen**

```javascript
// js/data/mealSlots.js
export const RECIPE_MEAL_SLOTS = [
  'Frühstück',
  'Mittagessen',
  'Abendessen',
  'Pre-Workout',
  'Post-Workout',
  'Snack',
  'Casein',
];

export const INGREDIENT_UNIT_SUGGESTIONS = [
  'g', 'ml', 'Stk', 'EL', 'TL',
  'Packung', 'Portion', 'Scheibe', 'Dose',
];
```

- [ ] **Schritt 2: Commit**

```bash
git add js/data/mealSlots.js
git commit -m "feat: RECIPE_MEAL_SLOTS und INGREDIENT_UNIT_SUGGESTIONS Konstanten"
```

---

## Task 2: Schema v3 Migration + SCHEMA_VERSION

**Files:**
- Modify: `js/storage/migrations.js`
- Modify: `js/version.js` (SCHEMA_VERSION 2→3)
- Create: `tests/unit/storage/migrations.test.js`

- [ ] **Schritt 1: Testverzeichnis anlegen und Testdatei schreiben (RED)**

```javascript
// tests/unit/storage/migrations.test.js
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
```

- [ ] **Schritt 2: Test laufen lassen — muss FAIL sein**

```bash
npm test tests/unit/storage/migrations.test.js
```

Erwartet: `INDEXED_DB_MIGRATIONS[3] ist als Funktion definiert` schlägt fehl — Funktion noch nicht definiert.

- [ ] **Schritt 3: Migration in `js/storage/migrations.js` implementieren**

Den Kommentar `// v3: kommt in Phase 4 (Rezepte)` ersetzen durch:

```javascript
  /**
   * v3: Phase 4 — Rezepte: eigene Rezepte + Foto-Store
   * @param {import('idb').IDBPDatabase} db
   */
  3: (db) => {
    const recipes = db.createObjectStore('recipesCustom', { keyPath: 'id' });
    recipes.createIndex('name',      'name',      { unique: false });
    recipes.createIndex('mealSlot',  'mealSlot',  { unique: false });
    recipes.createIndex('updatedAt', 'updatedAt', { unique: false });

    const photos = db.createObjectStore('recipePhotos', { keyPath: 'id' });
    photos.createIndex('recipeId', 'recipeId', { unique: false });
    // recipePhotos bleibt in Phase 4 leer — Store nur anlegen
  },
```

- [ ] **Schritt 4: SCHEMA_VERSION in `js/version.js` auf 3 setzen**

```javascript
export const APP_VERSION = '1.2.7';
export const SCHEMA_VERSION = 3; // Phase 4: recipesCustom + recipePhotos
```

- [ ] **Schritt 5: Test laufen lassen — muss PASS sein**

```bash
npm test tests/unit/storage/migrations.test.js
```

Erwartet: 5/5 grün.

- [ ] **Schritt 6: Alle Tests laufen lassen**

```bash
npm test
```

Erwartet: 153 Tests — alle grün (keine Regression).

- [ ] **Schritt 7: Commit**

```bash
git add js/storage/migrations.js js/version.js tests/unit/storage/migrations.test.js
git commit -m "feat: Schema v3 — recipesCustom + recipePhotos Stores anlegen"
```

---

## Task 3: CustomRecipe CRUD in `js/storage/indexeddb.js`

**Files:**
- Modify: `js/storage/indexeddb.js`
- Create: `tests/unit/storage/indexeddb.test.js`

- [ ] **Schritt 1: Testdatei schreiben (RED)**

```javascript
// tests/unit/storage/indexeddb.test.js
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
  // Implementations bleiben durch clearAllMocks erhalten (kein resetAllMocks)
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
    // store enthält jetzt die soft-deleted Version
    const result = await getAllCustomRecipes();
    const found = result.find(r => r.id === RECIPE.id);
    expect(found).toBeUndefined();
  });
});
```

- [ ] **Schritt 2: Test laufen lassen — muss FAIL sein**

```bash
npm test tests/unit/storage/indexeddb.test.js
```

Erwartet: Fehler — `getAllCustomRecipes` nicht definiert.

- [ ] **Schritt 3: JSDoc-Typedef und CRUD-Funktionen am Ende der Datei ergänzen**

Am Ende von `js/storage/indexeddb.js` hinzufügen:

```javascript
// ---------------------------------------------------------------------------
// recipesCustom-Store (Eigene Rezepte, Phase 4)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} RecipeIngredient
 * @property {string}  name
 * @property {number}  amount
 * @property {string}  unit     - freier string, z.B. 'g', 'ml', 'Packung'
 * @property {boolean} isMain   - Hauptzutat für späteres Kühlschrank-Matching
 */

/**
 * @typedef {Object} CustomRecipe
 * @property {string}             id
 * @property {string}             name
 * @property {string}             mealSlot   - Wert aus RECIPE_MEAL_SLOTS
 * @property {string}             [prepTime] - z.B. "20 min"
 * @property {number}             servings
 * @property {RecipeIngredient[]} ingredients
 * @property {string[]}           steps
 * @property {string}             [tip]
 * @property {number}             kcal
 * @property {number}             protein
 * @property {number}             carbs
 * @property {number}             fat
 * @property {'manual'}           source
 * @property {number}             createdAt
 * @property {number}             updatedAt
 * @property {number}             [deletedAt]
 */

/**
 * Gibt alle nicht-gelöschten eigenen Rezepte zurück, nach updatedAt absteigend.
 * @returns {Promise<CustomRecipe[]>}
 */
export async function getAllCustomRecipes() {
  const db = await openDb();
  const all = await db.getAll('recipesCustom');
  return all
    .filter(r => !r.deletedAt)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Speichert ein eigenes Rezept (neu oder Update).
 * Setzt createdAt/updatedAt/deviceId automatisch.
 * @param {Omit<CustomRecipe, 'createdAt'|'updatedAt'|'deviceId'>} recipe
 * @returns {Promise<void>}
 */
export async function saveCustomRecipe(recipe) {
  const db = await openDb();
  const now = Date.now();
  const existing = await db.get('recipesCustom', recipe.id);

  await db.put('recipesCustom', {
    ...recipe,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deviceId: getDeviceId(),
  });
}

/**
 * Soft-Delete: setzt deletedAt-Timestamp.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteCustomRecipe(id) {
  const db = await openDb();
  const existing = await db.get('recipesCustom', id);
  if (!existing) return;
  await db.put('recipesCustom', { ...existing, deletedAt: Date.now() });
}
```

- [ ] **Schritt 4: Test laufen lassen — muss PASS sein**

```bash
npm test tests/unit/storage/indexeddb.test.js
```

Erwartet: 9/9 grün.

- [ ] **Schritt 5: Alle Tests laufen lassen**

```bash
npm test
```

Erwartet: 162+ Tests — alle grün.

- [ ] **Schritt 6: Commit**

```bash
git add js/storage/indexeddb.js tests/unit/storage/indexeddb.test.js
git commit -m "feat: getAllCustomRecipes, saveCustomRecipe, deleteCustomRecipe"
```

---

## Task 4: Export/Import für `recipesCustom`

**Files:**
- Modify: `js/storage/exportImport.js`
- Create: `tests/unit/storage/exportImport.test.js`

- [ ] **Schritt 1: Testdatei schreiben (RED)**

```javascript
// tests/unit/storage/exportImport.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../js/storage/indexeddb.js', () => ({
  getAllCustomRecipes: vi.fn(),
  saveCustomRecipe:   vi.fn(),
  saveLogEntry:       vi.fn(),
  saveWeek:           vi.fn(),
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

beforeEach(() => { vi.clearAllMocks(); });

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
```

- [ ] **Schritt 2: Test laufen lassen — muss FAIL sein**

```bash
npm test tests/unit/storage/exportImport.test.js
```

Erwartet: `enthält data.recipesCustom` schlägt fehl — `json.data.recipesCustom` ist `undefined`.

- [ ] **Schritt 3: `exportImport.js` anpassen**

Importzeile am Anfang erweitern:

```javascript
import {
  getLogsBetween,
  getWeeksByYear,
  saveLogEntry,
  saveWeek,
  getAllCustomRecipes,
  saveCustomRecipe,
} from './indexeddb.js';
```

In `exportAll()` — `const exportData = { ... }` anpassen:

```javascript
  const recipesCustom = await getAllCustomRecipes();

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
    },
  };
```

In `importAll()` — nach dem `week`-Import-Block ergänzen:

```javascript
    // recipesCustom nach IndexedDB schreiben
    if (Array.isArray(data.recipesCustom) && data.recipesCustom.length > 0) {
      for (const recipe of data.recipesCustom) {
        await saveCustomRecipe(recipe);
      }
    }
```

- [ ] **Schritt 4: Test laufen lassen — muss PASS sein**

```bash
npm test tests/unit/storage/exportImport.test.js
```

Erwartet: 4/4 grün.

- [ ] **Schritt 5: Alle Tests laufen lassen**

```bash
npm test
```

Erwartet: 157+ Tests — alle grün.

- [ ] **Schritt 6: Commit**

```bash
git add js/storage/exportImport.js tests/unit/storage/exportImport.test.js
git commit -m "feat: recipesCustom in exportAll/importAll"
```

---

## Task 5: `js/data/initialRecipes.js` — 8 vollständige Rezepte

**Files:**
- Create: `js/data/initialRecipes.js`
- Create: `tests/unit/data/initialRecipes.test.js`

- [ ] **Schritt 1: Testdatei schreiben (RED)**

```javascript
// tests/unit/data/initialRecipes.test.js
import { describe, it, expect } from 'vitest';
import { INITIAL_RECIPES } from '../../../js/data/initialRecipes.js';
import { RECIPE_MEAL_SLOTS } from '../../../js/data/mealSlots.js';

describe('INITIAL_RECIPES — Vollständigkeit', () => {
  it('enthält genau 8 Rezepte', () => {
    expect(INITIAL_RECIPES).toHaveLength(8);
  });

  it('jedes Rezept hat eine eindeutige id im Format initial-00X', () => {
    const ids = INITIAL_RECIPES.map(r => r.id);
    expect(new Set(ids).size).toBe(8);
    ids.forEach(id => expect(id).toMatch(/^initial-00\d$/));
  });

  it('jedes Rezept hat name, mealSlot, prepTime, servings, icon', () => {
    INITIAL_RECIPES.forEach(r => {
      expect(typeof r.name).toBe('string');
      expect(r.name.length).toBeGreaterThan(0);
      expect(typeof r.mealSlot).toBe('string');
      expect(typeof r.prepTime).toBe('string');
      expect(typeof r.servings).toBe('number');
      expect(typeof r.icon).toBe('string');
    });
  });

  it('mealSlot jedes Rezepts liegt in RECIPE_MEAL_SLOTS', () => {
    INITIAL_RECIPES.forEach(r => {
      expect(RECIPE_MEAL_SLOTS).toContain(r.mealSlot);
    });
  });

  it('jedes Rezept hat mindestens 1 Zutat und 1 Zubereitungsschritt', () => {
    INITIAL_RECIPES.forEach(r => {
      expect(Array.isArray(r.ingredients)).toBe(true);
      expect(r.ingredients.length).toBeGreaterThan(0);
      expect(Array.isArray(r.steps)).toBe(true);
      expect(r.steps.length).toBeGreaterThan(0);
    });
  });

  it('jedes Rezept hat mindestens eine isMain-Zutat', () => {
    INITIAL_RECIPES.forEach(r => {
      const hasMain = r.ingredients.some(ing => ing.isMain === true);
      expect(hasMain, `Rezept "${r.name}" hat keine isMain-Zutat`).toBe(true);
    });
  });

  it('jede Zutat hat name (string), amount (number), unit (string), isMain (boolean)', () => {
    INITIAL_RECIPES.forEach(r => {
      r.ingredients.forEach(ing => {
        expect(typeof ing.name).toBe('string');
        expect(typeof ing.amount).toBe('number');
        expect(typeof ing.unit).toBe('string');
        expect(typeof ing.isMain).toBe('boolean');
      });
    });
  });

  it('kcal, protein, carbs, fat sind positive Zahlen', () => {
    INITIAL_RECIPES.forEach(r => {
      expect(r.kcal).toBeGreaterThan(0);
      expect(r.protein).toBeGreaterThan(0);
      expect(r.carbs).toBeGreaterThanOrEqual(0);
      expect(r.fat).toBeGreaterThanOrEqual(0);
    });
  });
});
```

- [ ] **Schritt 2: Test laufen lassen — muss FAIL sein**

```bash
npm test tests/unit/data/initialRecipes.test.js
```

Erwartet: Fehler — `initialRecipes.js` existiert noch nicht.

- [ ] **Schritt 3: `js/data/initialRecipes.js` implementieren**

```javascript
// js/data/initialRecipes.js
export const INITIAL_RECIPES = [
  {
    id: 'initial-001',
    name: 'Griechischer Joghurt Bowl',
    mealSlot: 'Post-Workout',
    prepTime: '5 min',
    servings: 1,
    icon: '🥛',
    kcal: 420, protein: 48, carbs: 32, fat: 9,
    ingredients: [
      { name: 'Magerquark',         amount: 200, unit: 'g',  isMain: true  },
      { name: 'Griechischer Joghurt (0%)', amount: 150, unit: 'g', isMain: false },
      { name: 'Haferflocken',       amount: 40,  unit: 'g',  isMain: false },
      { name: 'Beeren (TK)',        amount: 80,  unit: 'g',  isMain: false },
      { name: 'Proteinpulver (Whey)', amount: 20, unit: 'g', isMain: false },
    ],
    steps: [
      'Magerquark und Joghurt in einer Schüssel glatt rühren.',
      'Haferflocken untermengen.',
      'TK-Beeren kurz antauen lassen oder direkt aus der Tiefkühlung dazugeben.',
      'Proteinpulver untermischen und sofort servieren.',
    ],
    tip: 'Quark + Joghurt kombiniert langsames Casein mit schnellem Whey — optimal für die Post-Workout-Phase.',
  },
  {
    id: 'initial-002',
    name: 'Hüttenkäse-Lachs-Wrap',
    mealSlot: 'Mittagessen',
    prepTime: '10 min',
    servings: 1,
    icon: '🐟',
    kcal: 480, protein: 52, carbs: 28, fat: 14,
    ingredients: [
      { name: 'Räucherlachs',    amount: 100, unit: 'g',   isMain: true  },
      { name: 'Hüttenkäse',     amount: 150, unit: 'g',   isMain: false },
      { name: 'Vollkorn-Wrap',  amount: 60,  unit: 'g',   isMain: false },
      { name: 'Rucola',         amount: 30,  unit: 'g',   isMain: false },
      { name: 'Zitronensaft',   amount: 1,   unit: 'EL',  isMain: false },
      { name: 'Kapern',         amount: 1,   unit: 'EL',  isMain: false },
    ],
    steps: [
      'Hüttenkäse mit Zitronensaft und Kapern verrühren.',
      'Wrap flach ausbreiten und die Hüttenkäse-Mischung gleichmäßig verteilen.',
      'Rucola und Räucherlachs-Streifen darauflegen.',
      'Fest aufrollen und diagonal halbieren.',
    ],
    tip: 'Lachs liefert Omega-3 — wichtig für Entzündungsregulation bei intensivem Training.',
  },
  {
    id: 'initial-003',
    name: 'Hähnchen-Bowl mit Linsen',
    mealSlot: 'Mittagessen',
    prepTime: '20 min',
    servings: 2,
    icon: '🍗',
    kcal: 520, protein: 58, carbs: 35, fat: 12,
    ingredients: [
      { name: 'Hähnchenbrust',        amount: 300, unit: 'g',  isMain: true  },
      { name: 'Rote Linsen (gegart)', amount: 150, unit: 'g',  isMain: false },
      { name: 'Babyspinat',           amount: 80,  unit: 'g',  isMain: false },
      { name: 'Cherrytomaten',        amount: 100, unit: 'g',  isMain: false },
      { name: 'Olivenöl',             amount: 1,   unit: 'EL', isMain: false },
      { name: 'Zitronensaft',         amount: 1,   unit: 'EL', isMain: false },
      { name: 'Kreuzkümmel, Salz, Pfeffer', amount: 1, unit: 'Portion', isMain: false },
    ],
    steps: [
      'Hähnchenbrust in Streifen schneiden, mit Kreuzkümmel, Salz und Pfeffer würzen.',
      'In einer Pfanne mit Olivenöl bei mittlerer Hitze 6–8 Min pro Seite braten.',
      'Linsen, Spinat und Tomaten in Schalen anrichten.',
      'Hähnchen darauflegen, mit Zitronensaft beträufeln.',
    ],
    tip: 'Linsen liefern zusätzliches pflanzliches Protein + Ballaststoffe für langanhaltende Sättigung.',
  },
  {
    id: 'initial-004',
    name: 'Eiweiß-Omelette',
    mealSlot: 'Abendessen',
    prepTime: '10 min',
    servings: 1,
    icon: '🥚',
    kcal: 380, protein: 42, carbs: 8, fat: 18,
    ingredients: [
      { name: 'Eier',             amount: 3,   unit: 'Stk', isMain: true  },
      { name: 'Eiweiß (Glas)',   amount: 100, unit: 'ml',  isMain: false },
      { name: 'Hüttenkäse',      amount: 100, unit: 'g',   isMain: false },
      { name: 'Paprika (rot)',    amount: 80,  unit: 'g',   isMain: false },
      { name: 'Schnittlauch',    amount: 10,  unit: 'g',   isMain: false },
      { name: 'Olivenöl',        amount: 1,   unit: 'TL',  isMain: false },
    ],
    steps: [
      'Eier und Eiweiß verquirlen, mit Salz und Pfeffer würzen.',
      'Paprika fein würfeln.',
      'Pfanne mit Olivenöl bei mittlerer Hitze erhitzen.',
      'Eimasse eingiessen, Paprika daraufstreuen.',
      'Wenn die Unterseite fest ist, Hüttenkäse auf eine Hälfte geben und zuklappen.',
      'Weitere 2 Min garen, mit Schnittlauch bestreut servieren.',
    ],
    tip: 'Abends ideal: kaum KH, viel Protein. Hüttenkäse liefert Casein für nächtliche Regeneration.',
  },
  {
    id: 'initial-005',
    name: 'Skyr-Pfannkuchen',
    mealSlot: 'Pre-Workout',
    prepTime: '15 min',
    servings: 2,
    icon: '🥞',
    kcal: 440, protein: 38, carbs: 48, fat: 8,
    ingredients: [
      { name: 'Skyr',           amount: 200, unit: 'g',   isMain: true  },
      { name: 'Haferflocken',   amount: 60,  unit: 'g',   isMain: false },
      { name: 'Eier',           amount: 2,   unit: 'Stk', isMain: false },
      { name: 'Banane',         amount: 1,   unit: 'Stk', isMain: false },
      { name: 'Backpulver',     amount: 0.5, unit: 'TL',  isMain: false },
      { name: 'Kokosöl',        amount: 1,   unit: 'TL',  isMain: false },
    ],
    steps: [
      'Haferflocken in einem Mixer fein mahlen.',
      'Banane in einer Schüssel zerdrücken.',
      'Skyr, Eier, Haferflocken und Backpulver zur Banane geben und verrühren.',
      'Eine Pfanne mit Kokosöl erhitzen und bei mittlerer Hitze je 2–3 Min pro Seite backen.',
      'Stapeln und mit frischen Beeren oder einem TL Honig servieren.',
    ],
    tip: 'KH + Protein für Pre-Workout. Haferflocken = langsamer Glukoseanstieg, kein Energie-Einbruch.',
  },
  {
    id: 'initial-006',
    name: 'Thunfisch-Avocado-Bowl',
    mealSlot: 'Mittagessen',
    prepTime: '5 min',
    servings: 1,
    icon: '🥑',
    kcal: 460, protein: 44, carbs: 18, fat: 22,
    ingredients: [
      { name: 'Thunfisch (Dose, im eigenen Saft)', amount: 150, unit: 'g',  isMain: true  },
      { name: 'Avocado',                            amount: 1,   unit: 'Stk', isMain: false },
      { name: 'Cherrytomaten',                      amount: 100, unit: 'g',  isMain: false },
      { name: 'Gurke',                              amount: 80,  unit: 'g',  isMain: false },
      { name: 'Zitronensaft',                       amount: 1,   unit: 'EL', isMain: false },
      { name: 'Olivenöl',                           amount: 1,   unit: 'TL', isMain: false },
      { name: 'Salz, Pfeffer, Chiliflocken',        amount: 1,   unit: 'Portion', isMain: false },
    ],
    steps: [
      'Thunfisch abtropfen lassen und in eine Schüssel geben.',
      'Avocado halbieren, Kern entfernen, Fruchtfleisch würfeln.',
      'Tomaten halbieren, Gurke würfeln.',
      'Alles vermengen, mit Zitronensaft, Olivenöl, Salz, Pfeffer und Chiliflocken abschmecken.',
    ],
    tip: 'Schnell zubereitet, kein Kochen nötig. Avocado liefert gesunde Fette ohne KH-Spike.',
  },
  {
    id: 'initial-007',
    name: 'Abend-Casein-Quark',
    mealSlot: 'Casein',
    prepTime: '2 min',
    servings: 1,
    icon: '🌙',
    kcal: 280, protein: 38, carbs: 14, fat: 5,
    ingredients: [
      { name: 'Magerquark',          amount: 250, unit: 'g',  isMain: true  },
      { name: 'Milch (1,5%)',        amount: 50,  unit: 'ml', isMain: false },
      { name: 'Zimt',               amount: 1,   unit: 'TL', isMain: false },
      { name: 'Flohsamenschalen',   amount: 1,   unit: 'TL', isMain: false },
    ],
    steps: [
      'Quark mit Milch glatt rühren bis cremige Konsistenz erreicht ist.',
      'Zimt und Flohsamenschalen unterrühren.',
      'Ca. 30 Minuten vor dem Schlafengehen essen.',
    ],
    tip: 'Kasein wird langsam verdaut — ideal direkt vor dem Schlafen für nächtliche Muskelreparatur.',
  },
  {
    id: 'initial-008',
    name: 'Rindfleisch-Gemüse-Pfanne',
    mealSlot: 'Abendessen',
    prepTime: '20 min',
    servings: 2,
    icon: '🥩',
    kcal: 490, protein: 50, carbs: 15, fat: 22,
    ingredients: [
      { name: 'Rinderhackfleisch (mager)', amount: 300, unit: 'g',  isMain: true  },
      { name: 'Zucchini',                  amount: 200, unit: 'g',  isMain: false },
      { name: 'Paprika (gemischt)',         amount: 200, unit: 'g',  isMain: false },
      { name: 'Zwiebel',                   amount: 1,   unit: 'Stk', isMain: false },
      { name: 'Knoblauch',                 amount: 2,   unit: 'Stk', isMain: false },
      { name: 'Tomaten (stückig, Dose)',    amount: 200, unit: 'g',  isMain: false },
      { name: 'Olivenöl',                  amount: 1,   unit: 'EL', isMain: false },
      { name: 'Paprikapulver, Salz, Pfeffer', amount: 1, unit: 'Portion', isMain: false },
    ],
    steps: [
      'Zwiebel und Knoblauch fein hacken, Gemüse in Würfel schneiden.',
      'Olivenöl in einer großen Pfanne erhitzen, Zwiebel und Knoblauch 2 Min andünsten.',
      'Hackfleisch dazugeben, krümelig braten bis es gar ist (ca. 5 Min).',
      'Gemüse untermengen, 5 Min mitbraten.',
      'Tomaten dazugeben, Hitze reduzieren, 5 Min einkochen lassen.',
      'Mit Paprikapulver, Salz und Pfeffer abschmecken.',
    ],
    tip: 'Rotes Fleisch liefert Kreatin, Eisen und Zink — wichtig für Krafttraining und Hormonstatus.',
  },
];
```

- [ ] **Schritt 4: Test laufen lassen — muss PASS sein**

```bash
npm test tests/unit/data/initialRecipes.test.js
```

Erwartet: 8/8 grün.

- [ ] **Schritt 5: Alle Tests laufen lassen**

```bash
npm test
```

Erwartet: 165+ Tests — alle grün.

- [ ] **Schritt 6: Commit**

```bash
git add js/data/initialRecipes.js tests/unit/data/initialRecipes.test.js
git commit -m "feat: 8 Initialrezepte mit Zutaten und Zubereitungsschritten"
```

---

## ✅ Checkpoint 1 — Storage-Layer vollständig

Vor dem nächsten Task verifizieren:
- `npm test` → alle Tests grün
- `js/data/mealSlots.js` existiert mit `RECIPE_MEAL_SLOTS` und `INGREDIENT_UNIT_SUGGESTIONS`
- `js/data/initialRecipes.js` existiert mit 8 Rezepten
- `js/storage/migrations.js` enthält `INDEXED_DB_MIGRATIONS[3]`
- `js/version.js`: `SCHEMA_VERSION = 3`
- `js/storage/indexeddb.js`: `getAllCustomRecipes`, `saveCustomRecipe`, `deleteCustomRecipe` exportiert
- `js/storage/exportImport.js`: `exportAll` enthält `recipesCustom`, `importAll` importiert es

---

## Task 6: `useRecipes`-Hook

**Files:**
- Create: `js/hooks/useRecipes.js`

Kein Unit-Test — React-Hook, folgt exakt dem Muster von `useFavoriteFoods.js`.

- [ ] **Schritt 1: Hook implementieren**

```javascript
// js/hooks/useRecipes.js
import { useState, useEffect, useCallback } from '../lib.js';
import {
  getAllCustomRecipes,
  saveCustomRecipe,
  deleteCustomRecipe,
} from '../storage/indexeddb.js';

export function useRecipes() {
  const [recipes, setRecipes] = useState([]);

  const reload = useCallback(() => {
    getAllCustomRecipes().then(setRecipes);
  }, []);

  useEffect(() => { reload(); }, []);

  const saveRecipe = useCallback(async (recipe) => {
    await saveCustomRecipe(recipe);
    reload();
  }, [reload]);

  const removeRecipe = useCallback(async (id) => {
    await deleteCustomRecipe(id);
    reload();
  }, [reload]);

  return [recipes, saveRecipe, removeRecipe];
}
```

- [ ] **Schritt 2: Commit**

```bash
git add js/hooks/useRecipes.js
git commit -m "feat: useRecipes-Hook für CRUD auf recipesCustom"
```

---

## Task 7: `RecipeCard`-Komponente

**Files:**
- Create: `js/tabs/rezepte/RecipeCard.js`

- [ ] **Schritt 1: Komponente implementieren**

```javascript
// js/tabs/rezepte/RecipeCard.js
import { html } from '../../lib.js';
import { COLORS, FONTS, S } from '../../ui/theme.js';

export function RecipeCard({ recipe, isExpanded, onToggle, isCustom = false, onEdit, onDelete }) {
  const macroBar = html`
    <div style=${{ display: 'flex', gap: '12px', marginTop: '10px', fontFamily: FONTS.mono, fontSize: '11px' }}>
      <span style=${{ color: COLORS.gold, fontWeight: 700 }}>${recipe.kcal} kcal</span>
      <span style=${{ color: '#a8d8a8' }}>${recipe.protein}g P</span>
      <span style=${{ color: '#a8c8e8' }}>${recipe.carbs}g KH</span>
      <span style=${{ color: '#e8c8a8' }}>${recipe.fat}g F</span>
    </div>
  `;

  return html`
    <div style=${{ ...S.card, cursor: 'pointer' }} onClick=${onToggle}>
      <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style=${{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style=${{ fontSize: '22px' }}>${recipe.icon ?? '🍽️'}</span>
          <div>
            <div style=${{ fontSize: '13px', fontWeight: 600, color: COLORS.text }}>${recipe.name}</div>
            <div style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>
              ${recipe.mealSlot}${recipe.prepTime ? ` · ${recipe.prepTime}` : ''}
            </div>
          </div>
        </div>
        <div style=${{ textAlign: 'right' }}>
          <div style=${{ fontSize: '13px', fontWeight: 700, color: COLORS.gold }}>${recipe.protein}g P</div>
          <div style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>${recipe.kcal} kcal</div>
        </div>
      </div>

      ${isExpanded && html`
        <div style=${{ marginTop: '12px', borderTop: '1px solid #1e1e1e', paddingTop: '12px' }}>

          ${recipe.ingredients?.length > 0 && html`
            <div style=${{ marginBottom: '12px' }}>
              <div style=${{ fontSize: '10px', fontWeight: 700, color: COLORS.textMuted, fontFamily: FONTS.mono, letterSpacing: '0.08em', marginBottom: '6px' }}>
                ZUTATEN${recipe.servings > 1 ? ` (${recipe.servings} Portionen)` : ''}
              </div>
              ${recipe.ingredients.map((ing, i) => html`
                <div key=${i} style=${{ fontSize: '12px', color: COLORS.text, padding: '2px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style=${{ color: ing.isMain ? COLORS.gold : COLORS.textMuted, fontSize: '8px' }}>●</span>
                  ${ing.amount} ${ing.unit} ${ing.name}
                </div>
              `)}
            </div>
          `}

          ${recipe.steps?.length > 0 && html`
            <div style=${{ marginBottom: '12px' }}>
              <div style=${{ fontSize: '10px', fontWeight: 700, color: COLORS.textMuted, fontFamily: FONTS.mono, letterSpacing: '0.08em', marginBottom: '6px' }}>
                ZUBEREITUNG
              </div>
              ${recipe.steps.map((step, i) => html`
                <div key=${i} style=${{ fontSize: '12px', color: COLORS.text, padding: '3px 0', display: 'flex', gap: '8px' }}>
                  <span style=${{ color: COLORS.gold, fontFamily: FONTS.mono, minWidth: '16px' }}>${i + 1}.</span>
                  <span style=${{ lineHeight: 1.5 }}>${step}</span>
                </div>
              `)}
            </div>
          `}

          ${recipe.tip && html`
            <div style=${{ background: '#1a1a1a', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' }}>
              <div style=${{ fontSize: '11px', color: COLORS.textMuted, lineHeight: 1.6 }}>
                <span style=${{ color: COLORS.gold }}>Tipp: </span>${recipe.tip}
              </div>
            </div>
          `}

          ${macroBar}

          ${isCustom && html`
            <div style=${{ display: 'flex', gap: '8px', marginTop: '12px' }} onClick=${e => e.stopPropagation()}>
              <button
                onClick=${() => onEdit(recipe)}
                style=${{ flex: 1, background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: COLORS.text, padding: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: FONTS.mono }}
              >Bearbeiten</button>
              <button
                onClick=${() => onDelete(recipe.id)}
                style=${{ flex: 1, background: '#2a1515', border: '1px solid #5c2020', borderRadius: '8px', color: '#e05c5c', padding: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: FONTS.mono }}
              >Löschen</button>
            </div>
          `}
        </div>
      `}
    </div>
  `;
}
```

- [ ] **Schritt 2: Commit**

```bash
git add js/tabs/rezepte/RecipeCard.js
git commit -m "feat: RecipeCard-Komponente mit expandierbarer Detailansicht"
```

---

## Task 8: `RecipeEditor`-Komponente

**Files:**
- Create: `js/tabs/rezepte/RecipeEditor.js`

- [ ] **Schritt 1: Editor implementieren**

```javascript
// js/tabs/rezepte/RecipeEditor.js
import { html, useState } from '../../lib.js';
import { Modal } from '../../ui/Modal.js';
import { RECIPE_MEAL_SLOTS, INGREDIENT_UNIT_SUGGESTIONS } from '../../data/mealSlots.js';
import { COLORS, FONTS } from '../../ui/theme.js';

function initForm(recipe) {
  return {
    name:        recipe?.name     ?? '',
    mealSlot:    recipe?.mealSlot ?? RECIPE_MEAL_SLOTS[0],
    prepTime:    recipe?.prepTime ?? '',
    servings:    recipe?.servings ?? 2,
    kcal:        recipe?.kcal     ?? '',
    protein:     recipe?.protein  ?? '',
    carbs:       recipe?.carbs    ?? '',
    fat:         recipe?.fat      ?? '',
    tip:         recipe?.tip      ?? '',
    ingredients: recipe?.ingredients?.length > 0
      ? recipe.ingredients.map(i => ({ ...i }))
      : [{ name: '', amount: '', unit: 'g', isMain: false }],
    steps: recipe?.steps?.length > 0
      ? [...recipe.steps]
      : [''],
  };
}

function validate(form) {
  const errors = [];
  if (!form.name.trim()) errors.push('Name ist Pflicht.');
  if (form.kcal === '' || isNaN(Number(form.kcal)) || Number(form.kcal) < 0)
    errors.push('kcal muss eine Zahl ≥ 0 sein.');
  if (form.protein === '' || isNaN(Number(form.protein)) || Number(form.protein) < 0)
    errors.push('Protein muss eine Zahl ≥ 0 sein.');
  if (form.carbs === '' || isNaN(Number(form.carbs)) || Number(form.carbs) < 0)
    errors.push('KH muss eine Zahl ≥ 0 sein.');
  if (form.fat === '' || isNaN(Number(form.fat)) || Number(form.fat) < 0)
    errors.push('Fett muss eine Zahl ≥ 0 sein.');
  if (!form.steps.some(s => s.trim())) errors.push('Mindestens 1 Zubereitungsschritt Pflicht.');
  return errors;
}

const inputStyle = {
  width: '100%', background: '#222', border: '1px solid #333', borderRadius: '8px',
  color: '#f0ece4', padding: '10px 12px', fontSize: '13px', fontFamily: 'inherit',
  boxSizing: 'border-box',
};
const labelStyle = {
  fontSize: '10px', color: '#888', fontFamily: "'DM Mono',monospace",
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px', display: 'block',
};
const fieldWrap = { marginBottom: '14px' };

export function RecipeEditor({ open, onClose, recipe, onSave }) {
  const isEdit = !!recipe?.id;
  const [form, setForm] = useState(() => initForm(recipe));
  const [errors, setErrors] = useState([]);

  // Reset form when recipe prop changes
  const handleOpen = () => setForm(initForm(recipe));

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  // Ingredients
  function setIngredient(i, key, val) {
    setForm(f => {
      const ings = f.ingredients.map((ing, idx) =>
        idx === i ? { ...ing, [key]: val } : ing
      );
      return { ...f, ingredients: ings };
    });
  }
  function addIngredient() {
    setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: '', amount: '', unit: 'g', isMain: false }] }));
  }
  function removeIngredient(i) {
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }));
  }

  // Steps
  function setStep(i, val) {
    setForm(f => { const s = [...f.steps]; s[i] = val; return { ...f, steps: s }; });
  }
  function addStep() { setForm(f => ({ ...f, steps: [...f.steps, ''] })); }
  function removeStep(i) {
    setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));
  }
  function moveStep(i, dir) {
    setForm(f => {
      const s = [...f.steps];
      const j = i + dir;
      if (j < 0 || j >= s.length) return f;
      [s[i], s[j]] = [s[j], s[i]];
      return { ...f, steps: s };
    });
  }

  function handleSave() {
    const errs = validate(form);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    const saved = {
      id:          recipe?.id ?? crypto.randomUUID(),
      name:        form.name.trim(),
      mealSlot:    form.mealSlot,
      prepTime:    form.prepTime.trim() || undefined,
      servings:    Number(form.servings) || 1,
      kcal:        Number(form.kcal),
      protein:     Number(form.protein),
      carbs:       Number(form.carbs),
      fat:         Number(form.fat),
      tip:         form.tip.trim() || undefined,
      ingredients: form.ingredients
        .filter(ing => ing.name.trim())
        .map(ing => ({ name: ing.name.trim(), amount: Number(ing.amount) || 0, unit: ing.unit || 'g', isMain: !!ing.isMain })),
      steps:       form.steps.filter(s => s.trim()).map(s => s.trim()),
      source:      'manual',
      createdAt:   recipe?.createdAt ?? Date.now(),
      updatedAt:   Date.now(),
    };
    onSave(saved);
    onClose();
  }

  const unitlistId = 'ingredient-units';

  return html`
    <${Modal} open=${open} onClose=${onClose} title=${isEdit ? 'Rezept bearbeiten' : 'Eigenes Rezept'}>
      <datalist id=${unitlistId}>
        ${INGREDIENT_UNIT_SUGGESTIONS.map(u => html`<option key=${u} value=${u} />`)}
      </datalist>

      ${errors.length > 0 && html`
        <div style=${{ background: '#3a1515', border: '1px solid #e05c5c', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
          ${errors.map((e, i) => html`<div key=${i} style=${{ fontSize: '12px', color: '#e05c5c' }}>${e}</div>`)}
        </div>
      `}

      <div style=${fieldWrap}>
        <label style=${labelStyle}>Name *</label>
        <input style=${inputStyle} value=${form.name} onInput=${e => set('name', e.target.value)} placeholder="Rezeptname" />
      </div>

      <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <div>
          <label style=${labelStyle}>Mahlzeit-Slot *</label>
          <select style=${{ ...inputStyle }} value=${form.mealSlot} onChange=${e => set('mealSlot', e.target.value)}>
            ${RECIPE_MEAL_SLOTS.map(slot => html`<option key=${slot} value=${slot}>${slot}</option>`)}
          </select>
        </div>
        <div>
          <label style=${labelStyle}>Portionen</label>
          <input style=${inputStyle} type="number" min="1" max="12" value=${form.servings}
            onInput=${e => set('servings', e.target.value)} />
        </div>
      </div>

      <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <div>
          <label style=${labelStyle}>Zubereitungszeit</label>
          <input style=${inputStyle} value=${form.prepTime} onInput=${e => set('prepTime', e.target.value)} placeholder="20 min" />
        </div>
      </div>

      <div style=${{ fontSize: '10px', color: '#888', fontFamily: FONTS.mono, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Makros (pro Rezept gesamt) *</div>
      <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        ${[['kcal','kcal'],['protein','Protein g'],['carbs','KH g'],['fat','Fett g']].map(([key, label]) => html`
          <div key=${key}>
            <label style=${labelStyle}>${label}</label>
            <input style=${inputStyle} type="number" min="0" value=${form[key]}
              onInput=${e => set(key, e.target.value)} placeholder="0" />
          </div>
        `)}
      </div>

      <div style=${{ fontSize: '10px', color: '#888', fontFamily: FONTS.mono, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
        Zutaten <span style=${{ color: COLORS.gold }}>● = Hauptzutat</span>
      </div>
      ${form.ingredients.map((ing, i) => html`
        <div key=${i} style=${{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
          <input style=${{ ...inputStyle, flex: 3 }} value=${ing.name}
            onInput=${e => setIngredient(i, 'name', e.target.value)} placeholder="Zutat" />
          <input style=${{ ...inputStyle, flex: 1 }} type="number" min="0" value=${ing.amount}
            onInput=${e => setIngredient(i, 'amount', e.target.value)} placeholder="Menge" />
          <input style=${{ ...inputStyle, flex: 1 }} list=${unitlistId} value=${ing.unit}
            onInput=${e => setIngredient(i, 'unit', e.target.value)} />
          <input type="checkbox" checked=${ing.isMain}
            onChange=${e => setIngredient(i, 'isMain', e.target.checked)}
            title="Hauptzutat" style=${{ accentColor: COLORS.gold, width: '16px', height: '16px', cursor: 'pointer' }} />
          <button onClick=${() => removeIngredient(i)}
            style=${{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>×</button>
        </div>
      `)}
      <button onClick=${addIngredient}
        style=${{ background: '#1a1a1a', border: '1px dashed #333', borderRadius: '8px', color: '#888', width: '100%', padding: '8px', fontSize: '12px', cursor: 'pointer', marginBottom: '14px' }}>
        + Zutat hinzufügen
      </button>

      <div style=${{ fontSize: '10px', color: '#888', fontFamily: FONTS.mono, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Zubereitung *</div>
      ${form.steps.map((step, i) => html`
        <div key=${i} style=${{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: '6px' }}>
          <span style=${{ color: COLORS.gold, fontFamily: FONTS.mono, fontSize: '12px', paddingTop: '10px', minWidth: '18px' }}>${i + 1}.</span>
          <textarea
            style=${{ ...inputStyle, flex: 1, resize: 'vertical', minHeight: '52px' }}
            value=${step}
            onInput=${e => setStep(i, e.target.value)}
            placeholder="Schritt beschreiben…"
          />
          <div style=${{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button onClick=${() => moveStep(i, -1)} disabled=${i === 0}
              style=${{ background: 'none', border: '1px solid #333', borderRadius: '4px', color: '#888', cursor: 'pointer', padding: '2px 6px', fontSize: '11px' }}>▲</button>
            <button onClick=${() => moveStep(i, 1)} disabled=${i === form.steps.length - 1}
              style=${{ background: 'none', border: '1px solid #333', borderRadius: '4px', color: '#888', cursor: 'pointer', padding: '2px 6px', fontSize: '11px' }}>▼</button>
            <button onClick=${() => removeStep(i)}
              style=${{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '16px', padding: '0 2px' }}>×</button>
          </div>
        </div>
      `)}
      <button onClick=${addStep}
        style=${{ background: '#1a1a1a', border: '1px dashed #333', borderRadius: '8px', color: '#888', width: '100%', padding: '8px', fontSize: '12px', cursor: 'pointer', marginBottom: '14px' }}>
        + Schritt hinzufügen
      </button>

      <div style=${fieldWrap}>
        <label style=${labelStyle}>Tipp (optional)</label>
        <textarea style=${{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
          value=${form.tip}
          onInput=${e => set('tip', e.target.value)}
          placeholder="Ernährungswissen, Varianten, Hinweise…"
        />
      </div>

      <button onClick=${handleSave}
        style=${{ width: '100%', background: '#c8a96e', color: '#111', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        ${isEdit ? 'Änderungen speichern' : 'Rezept speichern'}
      </button>
    </${Modal}>
  `;
}
```

- [ ] **Schritt 2: Commit**

```bash
git add js/tabs/rezepte/RecipeEditor.js
git commit -m "feat: RecipeEditor-Modal für eigene Rezepte"
```

---

## Task 9: `RezepteTab.js` überarbeiten

**Files:**
- Modify: `js/tabs/rezepte/RezepteTab.js`

- [ ] **Schritt 1: RezepteTab.js vollständig ersetzen**

```javascript
// js/tabs/rezepte/RezepteTab.js
import { html, useState } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { INITIAL_RECIPES } from '../../data/initialRecipes.js';
import { useRecipes } from '../../hooks/useRecipes.js';
import { RecipeCard } from './RecipeCard.js';
import { RecipeEditor } from './RecipeEditor.js';

export function RezepteTab() {
  const [recipes, saveRecipe, removeRecipe] = useRecipes();
  const [expandedId, setExpandedId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  const activeCustom = recipes.filter(r => !r.deletedAt);

  const allRecipes = [
    ...INITIAL_RECIPES.map(r => ({ ...r, _type: 'initial' })),
    ...activeCustom.map(r => ({ ...r, _type: 'custom' })),
  ];

  function handleToggle(id) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  function handleEdit(recipe) {
    setEditingRecipe(recipe);
    setEditorOpen(true);
  }

  function handleDelete(id) {
    if (confirm('Rezept wirklich löschen?')) {
      removeRecipe(id);
      if (expandedId === id) setExpandedId(null);
    }
  }

  function handleNewRecipe() {
    setEditingRecipe(null);
    setEditorOpen(true);
  }

  return html`
    <div style=${S.content}>
      <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style=${{ ...S.cardTitle, marginBottom: 0 }}>Rezepte</div>
        <button
          onClick=${handleNewRecipe}
          style=${{ background: '#c8a96e', color: '#111', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: FONTS.mono }}
        >+ Eigenes</button>
      </div>

      ${allRecipes.map(r => html`
        <${RecipeCard}
          key=${r.id}
          recipe=${r}
          isExpanded=${expandedId === r.id}
          onToggle=${() => handleToggle(r.id)}
          isCustom=${r._type === 'custom'}
          onEdit=${handleEdit}
          onDelete=${handleDelete}
        />
      `)}

      <${RecipeEditor}
        open=${editorOpen}
        onClose=${() => setEditorOpen(false)}
        recipe=${editingRecipe}
        onSave=${saveRecipe}
      />
    </div>
  `;
}
```

- [ ] **Schritt 2: Commit**

```bash
git add js/tabs/rezepte/RezepteTab.js
git commit -m "feat: RezepteTab mit RecipeCard, RecipeEditor und useRecipes"
```

---

## Task 10: APP_VERSION 1.3.0 + Service Worker LOCAL_ASSETS

**Warum vor CP2:** Der Browser-Smoke-Test soll die reale App-Version testen und der Service Worker darf keine fehlenden Einträge haben.

**Files:**
- Modify: `js/version.js`
- Modify: `service-worker.js`

- [ ] **Schritt 1: `js/version.js` aktualisieren**

```javascript
export const APP_VERSION = '1.3.0';
export const SCHEMA_VERSION = 3; // Phase 4: recipesCustom + recipePhotos
```

- [ ] **Schritt 2: `service-worker.js` — VERSION und LOCAL_ASSETS**

Zeile 3 ändern:
```javascript
const APP_VERSION = '1.3.0';
```

In `LOCAL_ASSETS` folgende Einträge ergänzen (nach den bestehenden `./js/data/...`-Zeilen):

```javascript
  './js/data/mealSlots.js',
  './js/data/initialRecipes.js',
  './js/hooks/useRecipes.js',
  './js/tabs/rezepte/RecipeCard.js',
  './js/tabs/rezepte/RecipeEditor.js',
```

- [ ] **Schritt 3: Alle Tests laufen lassen**

```bash
npm test
```

Erwartet: alle Tests grün (gleiche Anzahl wie Checkpoint 1, keine Regression).

- [ ] **Schritt 4: Commit**

```bash
git add js/version.js service-worker.js
git commit -m "chore: APP_VERSION 1.3.0, neue Dateien in Service Worker LOCAL_ASSETS"
```

---

## ✅ Checkpoint 2 — Manueller Smoke-Test

Vor dem nächsten Task die App im Browser öffnen.

**Vorbereitung:**

```bash
# Lokalen Server starten (Python oder http-server oder ähnlich)
cd "d:/Claude Projekte/Ernährungs-Dashboard"
npx http-server . -p 8080 --cors
# Dann: http://localhost:8080/ernaehrung.html
```

**Prüfliste:**

- [ ] App lädt ohne Konsolenfehler (Version 1.3.0 im Titel oder Profil-Tab sichtbar)
- [ ] Rezepte-Tab zeigt 8 Initial-Rezepte (Icon, Name, mealSlot, Makros)
- [ ] Karte antippen → expandiert, zeigt Zutaten, Schritte, Tipp, Makros
- [ ] Karte erneut antippen → kollabiert
- [ ] `+ Eigenes`-Button → RecipeEditor-Modal öffnet sich
- [ ] Formular ausfüllen: Name + mealSlot + kcal/protein/carbs/fat + 1 Zutat + 1 Schritt
- [ ] Speichern → Modal schließt, neues Rezept erscheint unter den Initialrezepten
- [ ] Eigenes Rezept expandieren → Bearbeiten-Button vorhanden
- [ ] Bearbeiten → Modal öffnet mit vorausgefüllten Feldern → Speichern
- [ ] Löschen → Bestätigungsdialog → Rezept verschwindet
- [ ] Seite neu laden → eigenes Rezept ist noch vorhanden (IndexedDB)

---

## Task 11: Dokumentation

**Files:**
- Modify: `docs/uebergabedokument-aktuell.md`
- Modify: `docs/superpowers/specs/2026-06-04-phase-4-rezepte-design.md` (Status auf Fertig)

- [ ] **Schritt 1: Spec-Status aktualisieren**

In `docs/superpowers/specs/2026-06-04-phase-4-rezepte-design.md` Zeile 4 ändern:

```markdown
**Status:** Implementiert · APP_VERSION 1.3.0 · SCHEMA_VERSION 3
```

- [ ] **Schritt 2: Übergabedokument aktualisieren**

In `docs/uebergabedokument-aktuell.md` folgende Änderungen:

Zeile 6 (`**Branch:**`): letzten Push-Hash ergänzen nach Commit.

Zeile 7 (`**APP_VERSION:**`): `1.2.7` → `1.3.0`, `**SCHEMA_VERSION:** 2` → `**SCHEMA_VERSION:** 3`

In der Statustabelle (Abschnitt 1) eine Zeile ergänzen:

```markdown
| **Phase 4 — Rezepte** | ✅ | 8 Initialrezepte mit Zutaten/Schritten; expandierbare Karten; eigene Rezepte anlegen/bearbeiten/löschen; Schema v3 (recipesCustom + recipePhotos); Export/Import |
```

In „Was die App aktuell kann" ergänzen:

```markdown
- ✅ **Rezepte-Tab:** 8 Initialrezepte mit Zutaten und Schritten; eigene Rezepte anlegen/bearbeiten/löschen (in IndexedDB); Export/Import inklusive
```

Testtabelle (Abschnitt 7) aktualisieren:

```
tests/unit/storage/migrations.test.js     5 Tests  (Schema v3 Migration)
tests/unit/storage/exportImport.test.js   4 Tests  (recipesCustom Export/Import)
tests/unit/data/initialRecipes.test.js    8 Tests  (Struktur aller 8 Rezepte)
──────────────────────────────────────────────────
Gesamt                                  170 Tests — alle grün
```

In Abschnitt 9 (Nächste Schritte) Phase 4 als erledigt markieren:

```markdown
5. ~~**Phase 4**~~ ✅ erledigt (v1.3.0) — Rezepte mit Zutaten/Schritten, eigene Rezepte, Schema v3
6. **Phase 3E**: Open Food Facts + Barcode-Scanner
```

SCHEMA_VERSION-Tabelle (Abschnitt 4) aktualisieren:

```markdown
| **3** (aktuell) | Phase 4 | + `recipesCustom`, `recipePhotos` |
```

- [ ] **Schritt 3: Finaler Test-Lauf**

```bash
npm test
```

Erwartet: alle Tests grün.

- [ ] **Schritt 4: Abschluss-Commit**

```bash
git add docs/uebergabedokument-aktuell.md docs/superpowers/specs/2026-06-04-phase-4-rezepte-design.md
git commit -m "docs: Phase 4 Rezepte dokumentiert — APP_VERSION 1.3.0, SCHEMA_VERSION 3"
```

---

## Self-Review — Spec-Abgleich

| Spec-Anforderung | Task |
|---|---|
| `RECIPE_MEAL_SLOTS` + `INGREDIENT_UNIT_SUGGESTIONS` | Task 1 |
| Schema v3: `recipesCustom` + `recipePhotos` | Task 2 |
| `SCHEMA_VERSION` 2→3 | Task 2 |
| `getAllCustomRecipes`, `saveCustomRecipe`, `deleteCustomRecipe` | Task 3 |
| `exportAll()` enthält `recipesCustom` | Task 4 |
| `importAll()` liest `recipesCustom`, Altdaten-Robustheit | Task 4 |
| 8 Initial-Rezepte mit vollständiger Struktur | Task 5 |
| `useRecipes`-Hook | Task 6 |
| `RecipeCard` expandierbar (Zutaten/Schritte/Tipp/Makros) | Task 7 |
| Custom-Karte mit Bearbeiten/Löschen | Task 7 |
| `RecipeEditor`-Modal, alle Felder, Validierung | Task 8 |
| `RezepteTab` kombiniert Initial + Custom | Task 9 |
| `recipePhotos` Store leer, kein UI | Task 2 |
| `APP_VERSION` 1.3.0 | Task 10 |
| Service Worker `LOCAL_ASSETS` aktualisiert | Task 10 |
| Tests: migrations, exportImport, initialRecipes | Task 2/4/5 |

**Gefundene Lücke:** `unit` als freier string in `RecipeIngredient` — abgedeckt durch `INGREDIENT_UNIT_SUGGESTIONS` + `<datalist>` in Task 8. ✅

---

*Erstellt: 2026-06-04 · Phase 4 · APP_VERSION 1.3.0 · SCHEMA_VERSION 3*
