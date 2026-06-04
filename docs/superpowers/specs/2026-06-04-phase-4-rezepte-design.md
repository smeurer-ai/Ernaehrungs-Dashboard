# Phase 4 — Rezepte: Design-Spec

**Datum:** 2026-06-04  
**Status:** Implementiert · APP_VERSION 1.3.0 · SCHEMA_VERSION 3  
**APP_VERSION nach Umsetzung:** 1.3.0  
**SCHEMA_VERSION:** 3 (neu: `recipesCustom` + `recipePhotos`)

---

## Ziel

Die bestehenden 8 Rezepte erhalten eine vollständige Datenstruktur (Zutaten, Zubereitungsschritte, strukturierter Mahlzeiten-Slot). Die Detailansicht klappt innerhalb der Karte auf. Eigene Rezepte können manuell angelegt und bearbeitet werden — mit direkter Makro-Eingabe, ohne Berechnung aus Zutaten. Die IndexedDB erhält Schema v3 mit zwei neuen Stores.

---

## Scope Phase 4

| Feature | In Phase 4 | Bewusst raus |
|---|---|---|
| Datenstruktur `InitialRecipe` + `RecipeIngredient` | ✅ | |
| Bestehende 8 Rezepte vollständig befüllt (Zutaten + Schritte) | ✅ | |
| Expandable RecipeCard (Zutaten / Schritte / Tipp / Makros) | ✅ | |
| Custom Recipe Editor (anlegen + bearbeiten + löschen) | ✅ | |
| `recipesCustom` + `recipePhotos` Stores (Schema v3) | ✅ | |
| `useRecipes`-Hook für CRUD | ✅ | |
| Weitere Initial-Rezepte (~30 neue) | ❌ separates Datenpaket | |
| Makro-Berechnung aus Zutaten | ❌ Phase 3E (Open Food Facts) | |
| Kühlschrank-Matching-Filter | ❌ Phase 5 | |
| Rezept-Foto-Erkennung (Claude Vision) | ❌ Phase 6 | |
| `recipePhotos`-Store UI | ❌ Phase 6 | |

---

## Datenstrukturen

### `MealSlotType` — gemeinsamer Typ für beide Rezept-Typen

```javascript
// js/data/mealSlots.js (neu — einmalige Definition, von beiden genutzt)
export const RECIPE_MEAL_SLOTS = [
  'Frühstück',
  'Mittagessen',
  'Abendessen',
  'Pre-Workout',
  'Post-Workout',
  'Snack',
  'Casein',
];
```

### `RecipeIngredient` — Zutatenzeile (kein Pflicht-Makro)

```typescript
interface RecipeIngredient {
  name:   string;   // "Magerquark"
  amount: number;   // 200
  unit:   string;   // freier string; UI schlägt Standardoptionen vor (siehe unten)
  isMain: boolean;  // true = Hauptzutat (später Kühlschrank-Matching)
}
```

`unit` ist bewusst ein freier `string`, damit z.B. "Packung", "Scheibe", "Dose", "Portion" oder andere Einheiten ohne Code-Änderung funktionieren. Der Editor bietet ein `<datalist>` mit Standardvorschlägen an:

```javascript
// js/data/mealSlots.js (oder eigene Datei)
export const INGREDIENT_UNIT_SUGGESTIONS = [
  'g', 'ml', 'Stk', 'EL', 'TL',
  'Packung', 'Portion', 'Scheibe', 'Dose',
];
```

Default im Editor: `'g'`.

### `InitialRecipe` — statische Daten (`js/data/initialRecipes.js`, neu)

Initial-Rezepte sind unveränderliche Anzeige-Daten. Sie leben nicht in IndexedDB.

```typescript
interface InitialRecipe {
  id:           string;           // "initial-001" bis "initial-008"
  name:         string;
  mealSlot:     MealSlotType;     // ein Slot — primärer Einsatzzweck
  prepTime:     string;           // "10 min" (Zubereitungszeit für Anzeige)
  servings:     number;           // Portionen
  ingredients:  RecipeIngredient[];
  steps:        string[];         // Zubereitungsschritte als Sätze
  tip?:         string;           // optionaler Tipp (Ernährungswissen)
  kcal:         number;
  protein:      number;
  carbs:        number;
  fat:          number;
  icon:         string;           // Emoji
}
```

**Wichtig:** `prepTime` ist die Zubereitungszeit ("10 min"), nicht die Trainingszeit. Das bisherige `meal`-Feld (freier Text wie "Frühstück / Post-Workout") entfällt. `mealSlot` ist ein einzelner Wert aus `RECIPE_MEAL_SLOTS`.

### `CustomRecipe` — IndexedDB `recipesCustom`

```typescript
interface CustomRecipe {
  id:          string;            // UUID
  name:        string;
  mealSlot:    MealSlotType;
  prepTime?:   string;            // optional, freie Eingabe
  servings:    number;
  ingredients: RecipeIngredient[];
  steps:       string[];
  tip?:        string;
  kcal:        number;
  protein:     number;
  carbs:       number;
  fat:         number;
  source:      'manual';          // Phase 6 ergänzt 'photo-claude'
  createdAt:   number;            // Date.now()
  updatedAt:   number;
  deletedAt?:  number;            // Soft-Delete für spätere Sync-Kompatibilität
}
```

---

## Storage — Schema v3

### Neue Stores in `js/storage/migrations.js`

```javascript
// Migration v3 (Phase 4)
if (oldVersion < 3) {
  const recipes = db.createObjectStore('recipesCustom', { keyPath: 'id' });
  recipes.createIndex('name',      'name');
  recipes.createIndex('mealSlot',  'mealSlot');
  recipes.createIndex('updatedAt', 'updatedAt');

  const photos = db.createObjectStore('recipePhotos', { keyPath: 'id' });
  photos.createIndex('recipeId', 'recipeId');
  // recipePhotos bleibt in Phase 4 leer — Store nur anlegen
}
```

`SCHEMA_VERSION` in `js/version.js`: `2` → `3`

### Neue Funktionen in `js/storage/indexeddb.js`

```javascript
// Custom Recipes
export async function getAllCustomRecipes()
export async function saveCustomRecipe(recipe)        // insert + update
export async function deleteCustomRecipe(id)          // Soft-Delete: setzt deletedAt

// Recipe Photos (Store vorhanden, aber noch nicht befüllt)
// Funktionen werden erst in Phase 6 implementiert
```

### Export/Import (`js/storage/exportImport.js`)

`exportAll()` wird um `recipesCustom` erweitert:

```javascript
// exportAll() — bisherige Felder + neu:
{
  version: APP_VERSION,
  profile: { ... },
  log: [ ... ],
  week: [ ... ],
  foodsCustom: [ ... ],
  meals: [ ... ],
  recipesCustom: [ ... ],   // NEU in Phase 4 — alle nicht-gelöschten CustomRecipes
  // recipePhotos: absichtlich weggelassen — kommt in Phase 6
}
```

`importAll()` liest `recipesCustom` aus der JSON-Datei und speichert alle Einträge via `saveCustomRecipe()`. Fehlende Felder beim Import (z.B. Altdaten ohne `recipesCustom`) werden lautlos übersprungen — kein Crash.

**Hinweis:** `recipePhotos` wird erst in Phase 6 exportiert/importiert. Bis dahin wird im Export-Objekt kein `recipePhotos`-Key gesetzt, damit der Unterschied zwischen "leer" und "nicht exportiert" eindeutig bleibt.

---

## Hook: `useRecipes` (`js/hooks/useRecipes.js`, neu)

```javascript
export function useRecipes() {
  // recipes: CustomRecipe[] — nur nicht-gelöschte, nach updatedAt desc sortiert
  // saveRecipe(recipe) — upsert inkl. updatedAt: Date.now()
  // deleteRecipe(id)   — Soft-Delete
  return [recipes, saveRecipe, deleteRecipe];
}
```

---

## UI-Komponenten

### `RecipeCard.js` (`js/tabs/rezepte/RecipeCard.js`, neu)

Zeigt ein Rezept (Initial oder Custom) als kollabierbare Karte.

**Collapsed:**
```
[icon] Name                           42g P
       mealSlot · prepTime           420 kcal
```

**Expanded:**
```
[icon] Name                           42g P
       mealSlot · prepTime · X Portionen   420 kcal
──────────────────────────────────────────
ZUTATEN
• 200g Magerquark (●)               ← isMain = ●
• 50g Haferflocken
• 100ml Milch

ZUBEREITUNG
1. Quark mit Milch verrühren.
2. Haferflocken unterrühren.
3. Mit Beeren garnieren.

─────────────
Tipp: Quark liefert Casein…

MAKROS
420 kcal   42g P   38g KH   8g F
```

Für CustomRecipes zusätzlich: [Bearbeiten]-Button, [Löschen]-Button.

**Props:**
```javascript
RecipeCard({ recipe, isCustom = false, onEdit, onDelete })
```

### `RecipeEditor.js` (`js/tabs/rezepte/RecipeEditor.js`, neu)

Modal-Formular für Anlegen + Bearbeiten eigener Rezepte. Öffnet sich über `Modal` aus `js/ui/Modal.js`.

**Felder:**
- Name (Text, Pflicht)
- Mahlzeit-Slot (Select aus `RECIPE_MEAL_SLOTS`, Pflicht)
- Zubereitungszeit (Text, optional, z.B. "20 min")
- Portionen (Number, 1–12, Standard: 2)
- **Makros (direkte Eingabe):** kcal, Protein (g), Kohlenhydrate (g), Fett (g)
- **Zutaten:** dynamische Liste — jede Zeile: `name`, `amount`, `unit` (Select), `isMain` (Checkbox). Zeilen hinzufügen / entfernen.
- **Schritte:** dynamische Liste — jeder Schritt als Textarea-Zeile, nummeriert. Zeilen hinzufügen / entfernen / verschieben (hoch/runter).
- Tipp (Textarea, optional)

**Validierung:**
- Name: nicht leer
- kcal, protein, carbs, fat: ≥ 0, Zahlen
- Zutaten: name + amount Pflicht wenn Zeile nicht leer; unit hat Defaultwert 'g'
- Schritte: mindestens 1 nicht-leerer Schritt

### `RezepteTab.js` (überarbeitet)

```javascript
export function RezepteTab() {
  const [recipes, saveRecipe, deleteRecipe] = useRecipes();
  const [expanded, setExpanded] = useState(null);   // "initial-003" | "uuid-xyz"
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  const allRecipes = [
    ...INITIAL_RECIPES,                              // statisch
    ...recipes.filter(r => !r.deletedAt),            // aus IndexedDB
  ];

  // ... Render: Listenheader + "Eigenes Rezept +" Button + allRecipes.map(RecipeCard) + RecipeEditor-Modal
}
```

**Layout-Reihenfolge:** Initial-Rezepte zuerst, dann Custom-Rezepte (nach updatedAt desc).

---

## Neue + geänderte Dateien

| Datei | Änderung |
|---|---|
| `js/data/mealSlots.js` | neu — `RECIPE_MEAL_SLOTS` Konstante |
| `js/data/initialRecipes.js` | neu — 8 Rezepte mit vollständiger Struktur |
| `js/hooks/useRecipes.js` | neu — CRUD-Hook für `recipesCustom` |
| `js/tabs/rezepte/RecipeCard.js` | neu — kollabierbare Rezeptkarte |
| `js/tabs/rezepte/RecipeEditor.js` | neu — Modal-Formular für eigene Rezepte |
| `js/tabs/rezepte/RezepteTab.js` | überarbeitet — neue Komponenten-Integration |
| `js/storage/indexeddb.js` | erweitert — `getAllCustomRecipes`, `saveCustomRecipe`, `deleteCustomRecipe` |
| `js/storage/exportImport.js` | erweitert — `recipesCustom` in Export + Import |
| `js/storage/migrations.js` | erweitert — v3-Migration (`recipesCustom`, `recipePhotos`) |
| `js/version.js` | `SCHEMA_VERSION` 2→3, `APP_VERSION` 1.2.7→1.3.0 |
| `service-worker.js` | `APP_VERSION` 1.3.0, neue Dateien in `LOCAL_ASSETS` |
| `tests/unit/data/initialRecipes.test.js` | neu — Struktur-Tests für alle 8 Rezepte |
| `tests/unit/storage/migrations.test.js` | erweitert — v3-Migration |

---

## Tests

### `tests/unit/data/initialRecipes.test.js` (neu)

- Alle 8 Rezepte haben `id`, `name`, `mealSlot`, `prepTime`, `servings`, `ingredients`, `steps`
- `mealSlot` liegt in `RECIPE_MEAL_SLOTS`
- Jedes Rezept hat mindestens 1 Zutat und mindestens 1 Schritt
- Jedes Rezept hat mindestens eine `isMain: true` Zutat
- `kcal`, `protein`, `carbs`, `fat` sind positive Zahlen

### `tests/unit/storage/migrations.test.js` (erweitert)

- Nach v3-Migration existieren Stores `recipesCustom` und `recipePhotos`
- Bestehende Daten aus v2 bleiben erhalten

### `tests/unit/storage/exportImport.test.js` (erweitert)

Automatisierter Unit-Test: Export → Import → Daten vorhanden.

```javascript
it('exportiert und importiert ein eigenes Rezept vollständig', async () => {
  const recipe = {
    id: 'test-uuid-1',
    name: 'Testrezept',
    mealSlot: 'Frühstück',
    servings: 2,
    ingredients: [{ name: 'Quark', amount: 200, unit: 'g', isMain: true }],
    steps: ['Quark abwiegen.'],
    kcal: 300, protein: 30, carbs: 20, fat: 5,
    source: 'manual',
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  await saveCustomRecipe(recipe);

  const blob = await exportAll();
  const json = JSON.parse(await blob.text());

  expect(json.recipesCustom).toHaveLength(1);
  expect(json.recipesCustom[0].name).toBe('Testrezept');

  // DB leeren, dann reimportieren
  await deleteCustomRecipe('test-uuid-1');
  await importAll(blob);

  const restored = await getAllCustomRecipes();
  expect(restored.find(r => r.id === 'test-uuid-1')?.name).toBe('Testrezept');
});

it('importAll() ohne recipesCustom-Key crasht nicht', async () => {
  const legacyBlob = new Blob([JSON.stringify({ version: '1.2.7', profile: {} })],
    { type: 'application/json' });
  await expect(importAll(legacyBlob)).resolves.not.toThrow();
});
```

---

## APP_VERSION-Sprung

`1.2.7 → 1.3.0`: Minor-Bump, da neues IndexedDB-Schema + sichtbares Feature (eigene Rezepte). Kein Breaking Change für bestehende Profile.

---

## Was Phase 4 bewusst nicht tut

- Keine Makro-Berechnung aus Zutaten (kommt mit Open Food Facts, Phase 3E)
- Keine ~30 weiteren Initial-Rezepte (separates Datenpaket nach Phase 4)
- Kein Kühlschrank-Matching (Phase 5)
- Kein `recipePhotos`-UI (Phase 6)
- Kein mealSlot-Filter in der Listenansicht (ggf. als Mini-Feature nach Phase 4)

---

*Erstellt: 2026-06-04 · APP_VERSION 1.3.0 · SCHEMA_VERSION 3*
