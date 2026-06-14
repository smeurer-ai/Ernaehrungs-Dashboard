# Design-Spec: Tracker Universal-Suche im Mahlzeit-eintragen-Modal

**Datum:** 2026-06-14  
**Status:** Draft — wartet auf Freigabe  
**Version:** 1.9.1 (Basis), Ziel-Version: 1.10.0  
**Branch (geplant):** `feature/tracker-universal-suche`

---

## 1. Problem

Aktueller Stand in `FoodEntryModal.js`:

| Schritt | Aufwand |
|---------|---------|
| Favoriten-Lebensmittel finden | Eigenes Suchfeld im FavoritePicker (inline) |
| OFD-Suche starten | Toggle-Button → Panel öffnet sich mit **neuem, leeren** Suchfeld |
| Barcode | Toggle-Button — visuell gleichwertig mit OFD, aber logisch immer erreichbar |
| Gespeicherte Mahlzeiten | Nur über „★ Mahlzeiten"-Button **außerhalb** des Modals (SavedMealsModal) |
| Rezepte | Nur über „Rezepte"-Tab, eigenes RecipeToTrackerModal |

→ Suchbegriff muss mehrfach getippt werden; Mahlzeiten und Rezepte sind aus dem Modal nicht erreichbar.

---

## 2. Ziel

Ein **zentrales Suchfeld** im FoodEntryModal durchsucht gleichzeitig:
- Favoriten-Lebensmittel (lokal, IndexedDB)
- Gespeicherte Mahlzeiten / Favoriten-Mahlzeiten (lokal, IndexedDB)
- Eigene und initiale Rezepte (lokal, IndexedDB + Bundled Data)

Barcode und OFD-Suche bleiben als **dauerhaft sichtbare Aktionen** unterhalb der Ergebnisliste erreichbar. OFD übernimmt automatisch den eingetippten Suchtext.

---

## 3. Slot-Bindung — Klarstellung

Dies ist eine häufig missverstandene Stelle im Code. Stand nach Code-Analyse:

| Datentyp | Slot-Feld | Bedeutung |
|----------|-----------|-----------|
| `FavoriteFood` | **keines** | Slot-unabhängig; kann in jeden Slot eingetragen werden |
| `SavedMeal` | `defaultSlot` (optional) | Nur Anzeigehinweis im MealBuilder; beim Eintragen gilt der **aktuell gewählte Slot** |
| `Recipe` | `mealSlot` | Vorauswahl in RecipeToTrackerModal; Nutzerin kann überschreiben |

**Konsequenz für die Implementierung:**  
- Beim Übernehmen einer Mahlzeit: `mealItemsToTrackedFoods(meal, currentSlot)` — `currentSlot` kommt aus dem Slot-Selektor des Modals, nicht aus `meal.defaultSlot`.  
- Beim Übernehmen eines Rezepts: `scaleRecipeMacros(recipe, portions)` + TrackedFood mit `mealSlot: currentSlot`.  
- `defaultSlot` / `mealSlot` dürfen in der Ergebnisliste als **Info-Text** angezeigt werden, steuern aber nicht den Eintrag.

---

## 4. UX-Flow (neu)

```
┌─────────────────────────────────────┐
│ Mahlzeit eintragen            [X]   │
│─────────────────────────────────────│
│ Mahlzeit  [Frühstück         ▾]     │
│ Slot-Ziel-Zeile (falls vorhanden)   │
│─────────────────────────────────────│
│ 🔍 Suchen…  [___________________]   │  ← zentrales Suchfeld
│                                     │
│ ┌─ Lebensmittel ─────────────────┐  │
│ │ Magerquark  150 kcal / 100g    │  │  ← Favorit → füllt Formular
│ │ Hüttenkäse  98 kcal / 100g     │  │
│ └────────────────────────────────┘  │
│ ┌─ Mahlzeiten ───────────────────┐  │
│ │ ★ Protein-Frühstück  3 Items   │  │  ← direkt in currentSlot eintragen
│ └────────────────────────────────┘  │
│ ┌─ Rezepte ──────────────────────┐  │
│ │ 🍽 Haferflocken Bowl  380 kcal  │  │  ← Portionswahl → eintragen
│ └────────────────────────────────┘  │
│                                     │
│ [🔍 In Open Food Facts suchen]      │  ← dauerhaft, übernimmt Suchtext
│ [🔢 Barcode]                        │  ← dauerhaft, auch bei leerem Feld
│─────────────────────────────────────│
│ — oder manuell eingeben —           │
│ [Name] [Gramm] [Makros…]            │
│ [Abbrechen]   [Eintragen]           │
└─────────────────────────────────────┘
```

### Suchfeld-Verhalten

| Zustand | Lebensmittel | Mahlzeiten | Rezepte |
|---------|--------------|------------|---------|
| Leer | Top-5 nach `updatedAt` | Top-3 nach `lastUsed` | keine |
| Mit Query (≥1 Zeichen) | Filter `name.includes(q)`, max 3 | Filter `name.includes(q)`, max 3 | Filter `name.includes(q)`, max 3 |

Gruppen ohne Treffer werden **nicht angezeigt** (kein leerer Abschnitt).  
Wenn eine Gruppe mehr Treffer hat als `maxPerGroup`, zeigt sie einen Hinweis „X weitere — Suche verfeinern".

### Scroll-Kontrolle

Die Ergebnisliste bekommt `maxHeight: 220px; overflowY: auto` — damit bleibt das manuelle Formular darunter ohne Scrollen erreichbar. OFD und Barcode-Buttons stehen **unterhalb** der Ergebnisliste, aber **oberhalb** des manuellen Formulars und sind nie abgeschnitten.

---

## 5. Übernehmen-Aktionen

### 5.1 Lebensmittel (FavoriteFood)

Identisch zu bisherigem `handleFavSelect`:

```
→ setName / setKcal100 / setP100 / setC100 / setF100
→ Formular scrollt nach unten, Nutzerin gibt Gramm ein und trägt ein
```

### 5.2 Mahlzeit (SavedMeal)

```
→ onApplyMeal(meal, currentSlot)  [neuer Callback-Prop]
→ FoodEntryModal ruft onClose()
→ TrackerTab.handleApplyMeal(meal, slot) — existierende Logik
```

`currentSlot` kommt aus dem Slot-Selektor des Modals (state `slot`).  
`meal.defaultSlot` wird nur als Info-Text angezeigt (graue Schrift unter dem Mahlzeitennamen).

### 5.3 Rezept

Da Portionswahl sinnvoll ist, und RecipeToTrackerModal dafür gebaut wurde:

```
→ setTrackerRecipe(recipe) in TrackerTab
→ RecipeToTrackerModal öffnet sich
→ Slot vorbelegt mit currentSlot statt recipe.mealSlot
```

**Problem:** RecipeToTrackerModal verwendet `RECIPE_MEAL_SLOTS` (statische Liste), nicht die dynamischen `mealSlots` aus `getMealTemplate()`.  
**Lösung in dieser Spec:** RecipeToTrackerModal bekommt optionales Prop `mealSlots?: string[]` — wenn übergeben, wird es statt `RECIPE_MEAL_SLOTS` verwendet. Rückwärtskompatibler Change (kein breaking change).

Für den Slot-Vorschlag: FoodEntryModal gibt `onApplyRecipe(recipe, currentSlot)` zurück; TrackerTab setzt `trackerRecipe` + `trackerRecipeDefaultSlot`.

---

## 6. OFD-Integration

`OFFSearchPanel.js` bekommt ein neues optionales Prop:

```javascript
// VORHER
export function OFFSearchPanel({ onSelect, onClose })

// NACHHER
export function OFFSearchPanel({ onSelect, onClose, initialQuery = '' })
```

Im `useState` für query:

```javascript
const [query, setQuery] = useState(initialQuery);
```

In `useEffect` (wenn `initialQuery` sich ändert):

```javascript
useEffect(() => { setQuery(initialQuery); }, [initialQuery]);
```

FoodEntryModal übergibt `initialQuery=${searchQuery}` (lokaler State des Suchfelds) wenn OFD geöffnet wird.

---

## 7. Neue Dateien

### 7.1 `js/calc/trackerSearch.js`

Reine Suchfunktion — kein DOM, kein React, direkt testbar.

```javascript
/**
 * @param {{
 *   query: string,
 *   favorites: FavoriteFood[],
 *   meals: SavedMeal[],
 *   recipes: Recipe[],
 *   maxPerGroup?: number,
 * }} opts
 * @returns {{
 *   foods: FavoriteFood[],
 *   meals: SavedMeal[],
 *   recipes: Recipe[],
 *   foodsTotal: number,
 *   mealsTotal: number,
 *   recipesTotal: number,
 * }}
 */
export function filterTrackerSearch({ query, favorites, meals, recipes, maxPerGroup = 3 }) {
  const q = query.trim().toLowerCase();

  // Lebensmittel
  const allFoods = q
    ? favorites.filter(f => f.name.toLowerCase().includes(q))
    : [...favorites].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

  // Mahlzeiten
  const allMeals = q
    ? meals.filter(m => m.name.toLowerCase().includes(q))
    : [...meals].sort((a, b) => (b.lastUsed ?? b.updatedAt ?? 0) - (a.lastUsed ?? a.updatedAt ?? 0));

  // Rezepte — ohne Query keine Anzeige (zu viele Initial-Rezepte)
  const allRecipes = q
    ? recipes.filter(r => r.name.toLowerCase().includes(q))
    : [];

  return {
    foods:        allFoods.slice(0, maxPerGroup),
    meals:        allMeals.slice(0, maxPerGroup),
    recipes:      allRecipes.slice(0, maxPerGroup),
    foodsTotal:   allFoods.length,
    mealsTotal:   allMeals.length,
    recipesTotal: allRecipes.length,
  };
}
```

### 7.2 `js/tabs/tracker/UniversalSearchPicker.js`

UI-Komponente mit Suchfeld + gruppierter Ergebnisliste + OFD/Barcode-Buttons.  
Props:

```javascript
UniversalSearchPicker({
  favorites,         // FavoriteFood[]
  meals,             // SavedMeal[]
  recipes,           // Recipe[]
  onSelectFood,      // (fav) => void
  onApplyMeal,       // (meal) => void — Slot kommt vom Modal
  onApplyRecipe,     // (recipe) => void — Portionswahl im nachgelagerten Modal
  onOpenOFF,         // (query) => void
  onOpenBarcode,     // () => void
})
```

Interner State: `query` (string).

---

## 8. Zu ändernde Komponenten

| Datei | Art der Änderung | Kritikalität |
|-------|-----------------|--------------|
| `js/calc/trackerSearch.js` | **NEU** — reine Suchfunktion | — |
| `js/tabs/tracker/UniversalSearchPicker.js` | **NEU** — UI-Komponente | — |
| `js/tabs/tracker/FoodEntryModal.js` | Mittel — FavoritePicker ersetzen, neue Props aufnehmen, OFD/Barcode bleiben als Panel | Hoch |
| `js/tabs/tracker/TrackerTab.js` | Klein — useRecipes() + INITIAL_RECIPES importieren, neue Props weitergeben | Mittel |
| `js/tabs/tracker/OFFSearchPanel.js` | Klein — `initialQuery` Prop additiv | Niedrig |
| `js/tabs/rezepte/RecipeToTrackerModal.js` | Klein — optionales `mealSlots` Prop + `defaultSlot` Prop | Niedrig |
| `js/tabs/tracker/FavoritePicker.js` | **Deprecated** — wird durch UniversalSearchPicker abgelöst; nach Abnahme löschen | — |

**Nicht geändert:** IndexedDB-Schema, Datenmodelle, MealBuilderModal, SavedMealsModal, FavoriteFoodsModal, FridgeModal, alle Calc-Funktionen außer neue.

---

## 9. Tests

### 9.1 Neue Unit-Tests: `tests/unit/calc/trackerSearch.test.js`

```
filterTrackerSearch
  ✓ leere Query → Recent-Lebensmittel nach updatedAt, keine Rezepte
  ✓ leere Query → Recent-Mahlzeiten nach lastUsed
  ✓ Query matcht Lebensmittel case-insensitiv
  ✓ Query matcht Mahlzeiten
  ✓ Query matcht Rezepte
  ✓ maxPerGroup begrenzt jede Gruppe separat
  ✓ foodsTotal / mealsTotal / recipesTotal enthält die echte Gesamtzahl (vor slice)
  ✓ Query mit Treffer in 2 Gruppen → beide zurückgegeben
  ✓ Query ohne Treffer → alle Gruppen leer
```

Erwartung: ~9 Tests → Gesamtzahl 341 → **350 Tests**.

### 9.2 Keine neuen UI-Tests

UniversalSearchPicker ist eine reine Render-Komponente (kein DOM-Test ohne JSDOM-Setup).  
Integration wird manuell im Browser getestet (Golden-Path-Checkliste in Abnahmekriterien).

---

## 10. Abnahmekriterien (manueller Browser-Test)

- [ ] Suchfeld leer → Top-5 Favoriten-Lebensmittel + Top-3 Mahlzeiten sichtbar
- [ ] „Quark" eingeben → Treffer in Lebensmittel UND evtl. Mahlzeiten; Rezepte nur wenn passend
- [ ] Lebensmittel-Treffer klicken → Name, kcal/P/KH/F im Formular vorausgefüllt; Gramm-Feld leer
- [ ] Mahlzeiten-Treffer klicken → direkt in aktuell gewählten Slot eingetragen, Modal schließt
- [ ] Rezept-Treffer klicken → RecipeToTrackerModal öffnet sich mit aktuell gewähltem Slot vorbelegt
- [ ] „In Open Food Facts suchen" → OFFSearchPanel mit Suchtext vorausgefüllt
- [ ] Barcode-Button → BarcodePanel — auch bei leerem Suchfeld erreichbar
- [ ] Slot wechseln → nächste Mahlzeit-Übernahme nutzt den neuen Slot
- [ ] Edit-Modus (Eintrag bearbeiten) → Suche nicht angezeigt (wie bisher)

---

## 11. Offene Entscheidungen (zur Freigabe)

**F1:** RecipeToTrackerModal — Portionswahl behalten (wie bisher) oder direkt 1 Portion eintragen ohne extra Modal?  
→ Empfehlung: **Portionswahl behalten** (RecipeToTrackerModal öffnen), aber Slot aus FoodEntryModal vorbelegen.

**F2:** FavoritePicker.js löschen oder als toter Code belassen?  
→ Empfehlung: **löschen** wenn UniversalSearchPicker fertig und abgenommen, da kein anderer Aufrufer.

**F3:** Rezepte ohne Query — sollten initiale Rezepte bei leerem Suchfeld angezeigt werden?  
→ Empfehlung: **Nein** (23 Initial-Rezepte wären zu lang). Nur bei aktiver Suche.

**F4:** `maxPerGroup` — 3 pro Gruppe oder unterschiedlich (z.B. 5 Lebensmittel, 3 Mahlzeiten, 3 Rezepte)?  
→ Empfehlung: **3 pro Gruppe** als Start; leicht in `filterTrackerSearch` anpassbar.

---

## 12. Nicht in Scope

- Barcode-Scanning-Änderungen (BarcodePanel bleibt unverändert)
- Neue IndexedDB-Stores oder Schema-Migrationen
- OFD-Offline-Cache
- Rezept-Suche in Open Food Facts
- Mahlzeiten-Bearbeitung direkt aus der Suche (→ weiterhin über „★ Mahlzeiten"-Button)
- Kühlschrank-Filter in der Universal-Suche
