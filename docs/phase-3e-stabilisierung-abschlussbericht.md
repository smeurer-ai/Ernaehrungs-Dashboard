# Abschlussbericht: Stabilisierungsrunde nach Phase 3E

**Datum:** 2026-06-07  
**APP_VERSION:** `1.3.5` · **SCHEMA_VERSION:** `3`  
**Teststand:** 252/252 Tests grün (15 Test-Dateien)  
**Branch:** `fix/mps-summary-slot-logic` → gemergt in `master` als PR #4

---

## Anlass

Nach dem Abschluss von Phase 3E (OFD-Suche, Barcode-Scanner, Leucin-Schätzung, MPS-Tagesübersicht) zeigte Testfeedback eine Reihe von UX-Problemen und einer Logik-Fehler, die vor dem Beginn von Phase 5 (Supabase) behoben werden sollten.

---

## Umgesetzte Stabilisierung (Tasks 1–6)

### Task 1 — MPS-Slot-Logik korrigiert (`1.3.3`)

**Problem:** `computeMpsSummary` blockierte MPS-wirksame Slots, weil ein einziger OFD-Eintrag mit `mpsTriggered: false` Vorrang hatte — auch wenn der Slot ausreichend Protein enthielt.

**Lösung:** Protein-Schätzung via `rateMealProtein` ist jetzt immer die Baseline. OFD-Leucinsumme (≥ 3g über alle Einträge des Slots) kann einen Slot zusätzlich als MPS-wirksam markieren, aber niemals blockieren.

**Dateien:** `js/calc/tracker.js`, `tests/unit/calc/tracker.test.js`

---

### Task 2 — Makro-Ist/Ziel (P/KH/F) im Heute-Tab (`1.3.3`)

**Problem:** `MealPlanEntry` zeigte pro Slot nur `Protein: X/Y g` — Kohlenhydrate und Fett fehlten.

**Lösung:** Kompaktes Format `P 30/35 · KH 45/50 · F 10/12 g` mit Farb-Feedback pro Makro. Neue reine Funktion `groupMacrosBySlot` (ersetzt `groupProteinBySlot`).

**Dateien:** `js/calc/tracker.js`, `js/tabs/heute/HeuteTab.js`, `js/tabs/heute/MealPlanList.js`, `js/tabs/heute/MealPlanEntry.js`

---

### Task 3 — OFD-Suche robuster (`1.3.3`)

**Problem:** Netzwerkfehler und API-Auszeiten wurden undifferenziert als „keine Verbindung" gemeldet; Suchergebnisse zeigten Säfte/Kompott vor frischen Produkten.

**Lösung:**
- 9s Timeout via `AbortSignal.timeout`, 1 automatischer Retry bei 5xx/Netzwerk
- `classifyOFFError`: differenzierte Fehlermeldungen (network / server / timeout / too_short / unknown)
- `rankOFFResults`: Score-basiertes Ranking (exakt +100, Präfix +60, erstes Wort +50, contains +20; Getränke/Säfte/processed −30)
- Enter-Guard während Ladezustand; page_size 10 → 20

**Dateien:** `js/api/openFoodFacts.js`, `js/tabs/tracker/OFFSearchPanel.js`, `tests/unit/api/openFoodFacts.test.js`

---

### Task 4 — Favoriten-Picker mit Suche (`1.3.3`)

**Problem:** Alle Favoriten als Chips angezeigt — bei vielen Favoriten unübersichtlich und nicht scrollbar.

**Lösung:** Suchfeld oben, scrollbare Liste (max 220px), max 8 Treffer; zuletzt aktualisierte Favoriten als Default; „N weitere — Suche eingrenzen" bei `hasMore`. Neue reine Funktion `filterFavorites` in `js/calc/favorites.js`.

**Dateien:** `js/calc/favorites.js` (neu), `js/tabs/tracker/FavoritePicker.js`, `tests/unit/calc/favorites.test.js` (neu), `service-worker.js`

---

### Task 5 — Favorit speichern auch im Edit-Modus (`1.3.4`)

**Problem:** Die Checkbox „Als Favorit speichern" war im Bearbeiten-Modus ausgeblendet.

**Lösung:** Checkbox jetzt in Neu- und Bearbeiten-Modus sichtbar. Duplikat-Check via `trim().toLowerCase()`-Vergleich — kein zweiter Favorit, wenn Name identisch. OFD-Produkte übernehmen `source: off` und `offCode`.

**Dateien:** `js/tabs/tracker/FoodEntryModal.js`

---

### Task 6 — Rezepte suchen und in Tracker übernehmen (`1.3.5`)

**Problem:** Rezepte konnten nicht aus dem Rezepte-Tab heraus ins Tracking übernommen werden; keine Suchfunktion.

**Lösung:**
- Suchfeld im Rezepte-Tab filtert Initial- und eigene Rezepte
- „In Tracker übernehmen"-Button im aufgeklappten Bereich jeder Rezeptkarte
- `RecipeToTrackerModal`: Slot vorbelegt aus `recipe.mealSlot`, Portionen-Eingabe (min 0.5, step 0.5), skalierte Makro-Vorschau
- Eintrag im Tracker: `foodRef: initial-recipe:<id>` / `recipe:<id>`, `gramm=100` als technischer Platzhalter (Einheitensystem folgt)
- Neue reine Funktion `scaleRecipeMacros(recipe, portions)` in `js/calc/recipeTracking.js`

**Dateien:** `js/calc/recipeTracking.js` (neu), `js/tabs/rezepte/RecipeToTrackerModal.js` (neu), `js/tabs/rezepte/RecipeCard.js`, `js/tabs/rezepte/RezepteTab.js`, `tests/unit/calc/recipeTracking.test.js` (neu), `service-worker.js`

---

## Neue reine Funktionen (alle mit Tests)

| Funktion | Datei | Tests |
|---|---|---|
| `groupMacrosBySlot` | `js/calc/tracker.js` | 4 Tests (in tracker.test.js) |
| `filterFavorites` | `js/calc/favorites.js` | 10 Tests |
| `rankOFFResults` | `js/api/openFoodFacts.js` | 6 Tests (in openFoodFacts.test.js) |
| `classifyOFFError` | `js/api/openFoodFacts.js` | 6 Tests (in openFoodFacts.test.js) |
| `scaleRecipeMacros` | `js/calc/recipeTracking.js` | 7 Tests |

---

## Teststand

```
tests/unit/calc/tracker.test.js            29 Tests
tests/unit/calc/favorites.test.js          10 Tests  (neu)
tests/unit/calc/recipeTracking.test.js      7 Tests  (neu)
tests/unit/api/openFoodFacts.test.js       25 Tests  (erweitert)
... (11 weitere Test-Dateien unverändert)
──────────────────────────────────────────────────
Gesamt                                    252 Tests — alle grün
```

---

## Bewusst offen gelassen

Diese Punkte wurden absichtlich nicht in diese Runde gezogen:

| Thema | Begründung |
|---|---|
| iOS-tauglicher Kamera-Scanner | Erfordert eigene Recherche zur WKWebView-Unterstützung; kein schneller Fix |
| Einheiten-/Portionensystem (Stück, TL, EL, Scheibe …) | Größere Datenmodell-Änderung; `gramm=100`-Platzhalter dokumentiert |
| Outline-Icons | Rein visuell, kein funktionaler Nutzen |
| Supabase-Vorbereitung | Gehört zu Phase 5; keine Supabase-Logik in dieser Runde |

---

*Erstellt: 2026-06-07 · Stabilisierungsrunde nach Phase 3E · APP_VERSION 1.3.5*
