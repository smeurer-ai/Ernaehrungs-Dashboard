# Implementierungsplan: Tracker Universal-Suche

**Datum:** 2026-06-14  
**Basis-Spec:** `docs/superpowers/specs/2026-06-14-tracker-universal-suche.md`  
**Branch:** `feature/tracker-universal-suche`  
**Ziel-Version:** `APP_VERSION 1.10.0`

---

## Freigegebene Entscheidungen (F1–F4)

| # | Entscheidung |
|---|---|
| F1 | Rezept-Übernahme mit Portionswahl-Modal (RecipeToTrackerModal); kein direktes 1-Portion-Eintragen |
| F2 | `FavoritePicker.js` bleibt liegen (nicht löschen); wird im neuen Flow einfach nicht mehr aufgerufen |
| F3 | Leer: „Schnellauswahl" — Top-3 Mahlzeiten nach `lastUsed` desc (Label „Zuletzt genutzte Mahlzeiten") + Top-3 Lebensmittel nach `updatedAt` desc (Label „Häufige Lebensmittel"), keine Rezepte. Hintergrund: Mealprep → gleiche Mahlzeiten an 2 Tagen hintereinander. Ab 2 Zeichen: normale gruppierte Suche über alle 3 Typen. |
| F4 | `maxPerGroup = 3` einheitlich; bei mehr Treffern: „X weitere — Suche eingrenzen" |

---

## Übersicht Tasks

| # | Titel | Dateien (neu/geändert) | Tests | Status |
|---|-------|------------------------|-------|--------|
| 1 | `trackerSearch.js` + Unit-Tests | `js/calc/trackerSearch.js` (NEU), `tests/unit/calc/trackerSearch.test.js` (NEU) | 10 neue Tests | — |
| 2 | OFFSearchPanel `initialQuery` | `js/tabs/tracker/OFFSearchPanel.js` | — | — |
| 3 | `UniversalSearchPicker.js` | `js/tabs/tracker/UniversalSearchPicker.js` (NEU) | — | — |
| 4 | FoodEntryModal Integration | `js/tabs/tracker/FoodEntryModal.js` | — | — |
| 5 | TrackerTab Props verdrahten | `js/tabs/tracker/TrackerTab.js` | — | — |
| 6 | RecipeToTrackerModal Slot-Prop | `js/tabs/rezepte/RecipeToTrackerModal.js` | — | — |
| 7 | Abschluss: Tests / Version / Doku | `js/version.js`, `docs/uebergabedokument-aktuell.md` | Gesamt-Suite | — |

---

## Task 1 — `js/calc/trackerSearch.js` + Unit-Tests

**Ziel:** Reine, testbare Suchfunktion. Kein DOM, kein React.

### Datei: `js/calc/trackerSearch.js` (NEU)

Signatur:

```javascript
/**
 * @param {{
 *   query: string,
 *   favorites: Array<{id,name,updatedAt?}>,
 *   meals:     Array<{id,name,lastUsed?,updatedAt?}>,
 *   recipes:   Array<{id,name}>,
 *   maxPerGroup?: number,
 * }} opts
 * @returns {{
 *   foods:        typeof favorites,
 *   meals:        typeof meals,
 *   recipes:      typeof recipes,
 *   foodsTotal:   number,
 *   mealsTotal:   number,
 *   recipesTotal: number,
 * }}
 */
export function filterTrackerSearch({ query, favorites, meals, recipes, maxPerGroup = 3 })
```

Kernlogik:

```
q = query.trim().toLowerCase()

MODUS A — Schnellauswahl (q === '' oder q.length === 1):
  Mahlzeiten: sortiert nach (lastUsed ?? updatedAt ?? 0) desc, slice(0, maxPerGroup)
  Lebensmittel: sortiert nach (updatedAt ?? 0) desc, slice(0, maxPerGroup)
  Rezepte: immer []

MODUS B — Suche (q.length >= 2):
  Mahlzeiten: filter name.includes(q), slice(0, maxPerGroup)
  Lebensmittel: filter name.includes(q), slice(0, maxPerGroup)
  Rezepte: filter name.includes(q), slice(0, maxPerGroup)

  Hinweis: 1-Zeichen-Query zeigt Schnellauswahl (kein Filtern bei 1 Zeichen),
  damit kurze Tippvorgänge kein leeres Ergebnis zeigen.

*Total-Felder enthalten die ungekürzte Treffermenge (vor slice).
```

Rückgabe enthält zusätzlich `mode: 'quick' | 'search'` — damit die UI die
richtigen Gruppen-Label rendern kann.

### Datei: `tests/unit/calc/trackerSearch.test.js` (NEU)

10 Tests:

```
filterTrackerSearch
  ✓  leere Query → mode 'quick', Top-3 Lebensmittel nach updatedAt, keine Rezepte
  ✓  leere Query → mode 'quick', Top-3 Mahlzeiten nach lastUsed
  ✓  1-Zeichen-Query → mode 'quick' (Schnellauswahl, kein Filtern), keine Rezepte
  ✓  2-Zeichen-Query → mode 'search', alle 3 Gruppen gefiltert
  ✓  Lebensmittel-Filter case-insensitiv (mode 'search')
  ✓  Mahlzeiten-Filter case-insensitiv (mode 'search')
  ✓  Rezepte-Filter case-insensitiv (mode 'search')
  ✓  maxPerGroup begrenzt jede Gruppe; *Total enthält echte Gesamtmenge
  ✓  Query ohne Treffer → alle Gruppen leer, alle Totals 0
  ✓  Treffer in nur einer Gruppe → andere Gruppen leer, nicht undefined
```

**Done-Kriterium Task 1:** `npm test` läuft durch; alle neuen Tests grün.

---

## Task 2 — OFFSearchPanel `initialQuery`

**Ziel:** Suchtext aus dem zentralen Suchfeld automatisch in OFD übernehmen.

### Datei: `js/tabs/tracker/OFFSearchPanel.js`

Additive Änderung:

```javascript
// VORHER
export function OFFSearchPanel({ onSelect, onClose }) {
  const [query, setQuery] = useState('');

// NACHHER
export function OFFSearchPanel({ onSelect, onClose, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => { setQuery(initialQuery); }, [initialQuery]);
```

Kein Test nötig (UI-only, kein eigener Calc-Pfad).

**Done-Kriterium Task 2:** Wenn `initialQuery="Quark"` übergeben wird, steht „Quark" im OFD-Suchfeld. Code-Review ausreichend.

---

## Task 3 — `UniversalSearchPicker.js`

**Ziel:** Neue UI-Komponente mit zentralem Suchfeld, gruppierten Ergebnissen und dauerhaften Aktionsbuttons.

### Datei: `js/tabs/tracker/UniversalSearchPicker.js` (NEU)

Props:

```javascript
UniversalSearchPicker({
  favorites,       // FavoriteFood[]
  meals,           // SavedMeal[]
  recipes,         // Recipe[]
  onSelectFood,    // (fav) => void  — füllt das manuelle Formular
  onApplyMeal,     // (meal) => void — Slot kommt vom Modal
  onApplyRecipe,   // (recipe) => void — öffnet RecipeToTrackerModal
  onOpenOFF,       // (query: string) => void
  onOpenBarcode,   // () => void
})
```

Interner State: `query` (string).

Rendering-Logik:

```
1. Suchfeld: placeholder „Suchen…" (type="search")

2. Ergebnisbereich (maxHeight 220px, overflowY auto):

   MODUS 'quick' (leer oder 1 Zeichen):
   - Abschnitts-Label „Schnellauswahl" (klein, gedimmt)
   - Gruppe „Zuletzt genutzte Mahlzeiten" wenn meals.length > 0:
       max 3 Einträge: Name + Anzahl Items + defaultSlot (Info-Text)
       Click → onApplyMeal(meal)
       wenn mealsTotal > 3: „X weitere — Suche eingrenzen"
   - Gruppe „Häufige Lebensmittel" wenn foods.length > 0:
       max 3 Einträge: Name + Makros/100g
       Click → onSelectFood(fav)
       wenn foodsTotal > 3: „X weitere — Suche eingrenzen"
   - Beide leer: nichts anzeigen (kein Fehlertext — leere Datenbank ist normal)

   MODUS 'search' (ab 2 Zeichen):
   - Gruppe „Lebensmittel" wenn foods.length > 0
   - Gruppe „Mahlzeiten" wenn meals.length > 0
   - Gruppe „Rezepte" wenn recipes.length > 0
   - Alle leer: „Keine lokalen Treffer."

3. Aktionsbuttons (AUSSERHALB Scroll-Container, immer sichtbar):
   [🔍 In Open Food Facts suchen]  → onOpenOFF(query)
   [🔢 Barcode]                    → onOpenBarcode()
```

Kein Trennstrich „— oder manuell eingeben —" hier — der bleibt in FoodEntryModal.

**Done-Kriterium Task 3:** Komponente rendert ohne Fehler; Gruppen erscheinen korrekt. Manueller Smoke-Test im Browser (kein Commit von Smoke-Test-Artefakten).

---

## Task 4 — FoodEntryModal Integration

**Ziel:** FavoritePicker und separate Toggle-Buttons durch UniversalSearchPicker ersetzen.

### Datei: `js/tabs/tracker/FoodEntryModal.js`

Änderungen:

**Props-Erweiterung:**

```javascript
// VORHER
export function FoodEntryModal({ open, onClose, onSave, favorites, initialEntry,
                                 defaultSlot, mealSlots, slotTargets, consumedBySlot })

// NACHHER
export function FoodEntryModal({ open, onClose, onSave, favorites, initialEntry,
                                 defaultSlot, mealSlots, slotTargets, consumedBySlot,
                                 meals,         // SavedMeal[]   — für Universal-Suche
                                 recipes,       // Recipe[]      — für Universal-Suche
                                 onApplyMeal,   // (meal) => void
                                 onApplyRecipe, // (recipe) => void
                               })
```

**State-Änderungen:**

```javascript
// VORHER
const [searchMode, setSearchMode] = useState(null); // null | 'search' | 'barcode'

// NACHHER
const [searchMode, setSearchMode] = useState(null);   // null | 'off' | 'barcode'
const [searchQuery, setSearchQuery] = useState('');   // NEU — zentraler Suchtext
```

**Template-Änderungen (nur im !isEdit-Block):**

```
ENTFERNT:
  - <${FavoritePicker} ...>
  - Label „Aus Favoriten"
  - Toggle-Buttons „🔍 OFD Suche" | „🔢 Barcode"

ERSETZT DURCH:
  <${UniversalSearchPicker}
    favorites=${favorites}
    meals=${meals ?? []}
    recipes=${recipes ?? []}
    onSelectFood=${fav => { handleFavSelect(fav); setSearchQuery(''); }}
    onApplyMeal=${meal => { onApplyMeal?.(meal); onClose(); }}
    onApplyRecipe=${recipe => { onApplyRecipe?.(recipe); onClose(); }}
    onOpenOFF=${q => { setSearchQuery(q); setSearchMode('off'); }}
    onOpenBarcode=${() => setSearchMode('barcode')}
  />
  ${searchMode === 'off' && html`<${OFFSearchPanel}
    initialQuery=${searchQuery}
    onSelect=${handleOFFSelect}
    onClose=${() => setSearchMode(null)}
  />`}
  ${searchMode === 'barcode' && html`<${BarcodePanel} ... />`}
```

**Import-Änderungen:**

```javascript
// ENTFERNT
import { FavoritePicker } from './FavoritePicker.js';

// HINZUGEFÜGT
import { UniversalSearchPicker } from './UniversalSearchPicker.js';
```

`useEffect`-Reset: `setSearchQuery('')` und `setSearchMode(null)` wenn Modal schließt (bereits vorhanden für `searchMode`; `searchQuery` ergänzen).

**Done-Kriterium Task 4:** Im Browser: Suchfeld sichtbar, Favoriten erscheinen, OFD öffnet sich mit vorausgefülltem Text, Barcode erreichbar.

---

## Task 5 — TrackerTab Props verdrahten

**Ziel:** `meals` und `recipes` aus bestehenden Hooks an FoodEntryModal weitergeben.

### Datei: `js/tabs/tracker/TrackerTab.js`

**Neue Imports:**

```javascript
import { useRecipes } from '../../hooks/useRecipes.js';
import { INITIAL_RECIPES } from '../../data/initialRecipes.js';
```

**Neuer Hook-Aufruf** (nach den bestehenden Hooks):

```javascript
const { recipes: customRecipes } = useRecipes();
const allRecipes = useMemo(
  () => [...INITIAL_RECIPES, ...customRecipes],
  [customRecipes],
);
```

**Neue Callback-Funktion:**

```javascript
function handleApplyRecipe(recipe, defaultSlot) {
  setTrackerRecipe(recipe);
  setTrackerRecipeDefaultSlot(defaultSlot ?? slot); // slot = aktueller Slot im Modal
}
```

Da `slot` in FoodEntryModal ein interner State ist, kennt TrackerTab ihn nicht direkt. Lösung: `onApplyRecipe(recipe)` wird aufgerufen wenn Nutzerin auf Rezept klickt — zu diesem Zeitpunkt ist der aktuelle Slot bereits im RecipeToTrackerModal-Workflow. TrackerTab setzt nur `trackerRecipe`; RecipeToTrackerModal zeigt dann die Slot-Auswahl.

**State-Ergänzung:**

```javascript
const [trackerRecipeDefaultSlot, setTrackerRecipeDefaultSlot] = useState(null);
```

**FoodEntryModal-Props-Erweiterung:**

```javascript
<${FoodEntryModal}
  // ... bestehende Props ...
  meals=${meals}
  recipes=${allRecipes}
  onApplyMeal=${handleApplyMeal}  // existiert bereits
  onApplyRecipe=${recipe => setTrackerRecipe(recipe)}
/>
```

**RecipeToTrackerModal-Übergabe** (Task 6 baut darauf auf):

```javascript
<${RecipeToTrackerModal}
  open=${!!trackerRecipe}
  recipe=${trackerRecipe}
  onClose=${() => setTrackerRecipe(null)}
  onSave=${handleAddToTracker}
  mealSlots=${mealSlots}            // NEU — dynamische Slots
/>
```

**Done-Kriterium Task 5:** Gespeicherte Mahlzeiten erscheinen in der Universal-Suche; Rezepte ab 2 Zeichen.

---

## Task 6 — RecipeToTrackerModal Slot-Prop

**Ziel:** Statt statischer `RECIPE_MEAL_SLOTS` die dynamischen Tracker-Slots verwenden.

### Datei: `js/tabs/rezepte/RecipeToTrackerModal.js`

Additive Prop-Erweiterung (rückwärtskompatibel):

```javascript
// VORHER
export function RecipeToTrackerModal({ open, recipe, onClose, onSave })

// NACHHER
export function RecipeToTrackerModal({ open, recipe, onClose, onSave, mealSlots })
```

Im Body:

```javascript
// VORHER
const slotsToUse = RECIPE_MEAL_SLOTS;

// NACHHER
const slotsToUse = (mealSlots?.length > 0) ? mealSlots : RECIPE_MEAL_SLOTS;
```

`useEffect` für Slot-Initialisierung bleibt:

```javascript
useEffect(() => {
  if (!open || !recipe) return;
  setSlot(slotsToUse.includes(recipe.mealSlot) ? recipe.mealSlot : slotsToUse[0]);
  setPortions('1');
}, [open, recipe]);
```

`RECIPE_MEAL_SLOTS`-Import bleibt als Fallback — kein toter Code.

**Done-Kriterium Task 6:** Rezept aus Universal-Suche → RecipeToTrackerModal zeigt Frühstück/Pre-WO/Post-WO etc. (dynamische Liste), nicht mehr die statische.

---

## Task 7 — Abschluss

### 7a. Vollständiger Test-Lauf

```
npm test
```

Erwartetes Ergebnis: **351 Tests** (341 vorher + 10 neue trackerSearch-Tests), alle grün.  
`npm audit --audit-level=moderate` → 0 Vulnerabilities.

### 7b. APP_VERSION erhöhen

**Datei: `js/version.js`**

```javascript
// VORHER
export const APP_VERSION = '1.9.1';

// NACHHER
export const APP_VERSION = '1.10.0';
```

`SCHEMA_VERSION` bleibt `4` — keine IndexedDB-Migration.

### 7c. Übergabedokument aktualisieren

**Datei: `docs/uebergabedokument-aktuell.md`**

- Datum: 2026-06-14 (bereits gesetzt)
- Version: `1.9.1` → `1.10.0`
- Branch: `feature/tracker-universal-suche` → PR #18
- Neue Zeile in Phasentabelle: „Universal-Suche im Tracker-Modal ✅"
- Test-Zähler: 341 → 351
- Neue Dateien: `js/calc/trackerSearch.js`, `js/tabs/tracker/UniversalSearchPicker.js`

### 7d. Commit + PR

Branch: `feature/tracker-universal-suche`  
PR-Basis: `master`  
PR-Titel: `feat: Universal-Suche im Tracker-Modal (v1.10.0)`

---

## Abhängigkeiten zwischen Tasks

```
Task 1 (trackerSearch.js)
    │
    ├── Task 3 (UniversalSearchPicker) — importiert filterTrackerSearch
    │       │
    │       └── Task 4 (FoodEntryModal) — importiert UniversalSearchPicker
    │               │
    │               └── Task 5 (TrackerTab) — verdrahtet Props
    │
    └── unabhängig:
        Task 2 (OFFSearchPanel initialQuery) — wird in Task 4 genutzt
        Task 6 (RecipeToTrackerModal) — wird in Task 5 genutzt
```

**Empfohlene Reihenfolge:** 1 → 2 → 3 → 4 → 5 → 6 → 7  
(Task 2 und 6 könnten parallel zu 3/4/5 erledigt werden, aber sequenziell ist sicherer.)

---

## Was nicht geändert wird

- IndexedDB-Schema (keine Migration, SCHEMA_VERSION bleibt 4)
- `FavoritePicker.js` — bleibt, wird nur nicht mehr importiert
- `SavedMealsModal.js` — bleibt vollständig (weiterhin über „★ Mahlzeiten"-Button)
- `FavoriteFoodsModal.js`, `FridgeModal.js`, `MealBuilderModal.js` — unverändert
- `BarcodePanel.js` — unverändert
- Alle bestehenden Tests

---

## Abnahmekriterien (Browser, manuell)

- [ ] Leer: Top-3 Lebensmittel + Top-3 Mahlzeiten sichtbar, keine Rezepte
- [ ] 1 Zeichen: Lebensmittel + Mahlzeiten gefiltert, noch keine Rezepte
- [ ] 2+ Zeichen: alle 3 Gruppen gefiltert
- [ ] Lebensmittel-Klick → Name + Makros im Formular, Gramm leer
- [ ] Mahlzeiten-Klick → direkt in aktuellen Slot eingetragen, Modal schließt
- [ ] Rezept-Klick → RecipeToTrackerModal öffnet, Slot aus dynamischer Liste
- [ ] „In Open Food Facts suchen" → OFD-Panel mit Suchtext vorausgefüllt
- [ ] Barcode-Button → BarcodePanel, auch bei leerem Suchfeld
- [ ] Slot wechseln → nächste Mahlzeit-Übernahme nutzt neuen Slot
- [ ] Edit-Modus → Universal-Suche nicht sichtbar (wie bisher)
- [ ] Keine JS-Fehler in der Browser-Konsole
