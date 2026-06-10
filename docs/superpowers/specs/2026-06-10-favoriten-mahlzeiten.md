# Favoriten-Mahlzeiten (6b) — Design-Spec

**Datum:** 2026-06-10  
**Status:** Spec · noch nicht implementiert  
**Ziel-APP_VERSION nach Umsetzung:** 1.6.0  
**SCHEMA_VERSION:** 3 (unverändert — `meals`-Store existiert leer seit Schema v2)

---

## Ziel

Wiederkehrende Mahlzeiten („Mein Frühstücksquark" = Quark + Beeren + Leinsamen + Walnüsse) einmal zusammenstellen, speichern und künftig **mit einem Tipp** in den Tracker eintragen. Beim Zusammenstellen sind die **Slot-Zielwerte sichtbar** (Ziel / Live-Summe / Lücke) — Stephanies Pflicht-Anforderung: „rumprobieren, was man essen kann".

Litmus-Test: ✅ Schnellere, vollständigere Protein-Erfassung im Alltag = bessere MPS-Abdeckung. Erfolgskriterium „Eingabezeit < 30 Sekunden" wird für Standard-Mahlzeiten erst hiermit erreichbar.

---

## Scope

| Feature | In diesem Feature | Bewusst raus |
|---|---|---|
| `meals`-Store CRUD (`getAllMeals`, `saveMeal`, `deleteMeal`) | ✅ | |
| Mahlzeiten-Baukasten: Items per Suche (Favoriten + OFD + manuell) | ✅ | |
| Slot-Ziel-Panel im Baukasten (Ziel / Summe / Lücke / MPS) | ✅ | |
| Zentrale Verwaltung „Meine Mahlzeiten" (Liste, eintragen, bearbeiten, löschen) | ✅ | |
| 1-Tipp-Eintrag: alle Items landen als einzelne TrackedFoods im Slot | ✅ | |
| `lastUsed`-Sortierung (zuletzt verwendete zuerst) | ✅ | |
| Export/Import inkl. `meals` (+ Tests) | ✅ | |
| Portions-Skalierung (halbe/doppelte Mahlzeit) | ❌ Folge-Feature | |
| Mahlzeit aus bestehenden Tages-Einträgen „zusammenfassen" | ❌ Folge-Feature | |
| Icons/Emojis pro Mahlzeit | ❌ Folge-Feature | |

---

## Datenmodell (Store `meals`, existiert seit Schema v2)

Entspricht der Projekt-Spezifikation §4.2.2, ergänzt um `defaultSlot`:

```javascript
// SavedMeal
{
  id:          string,        // UUID (keyPath)
  name:        string,        // "Mein Frühstücksquark"
  defaultSlot: string,        // z.B. "Frühstück" — Vorauswahl beim Eintragen + Ziel-Referenz im Baukasten
  items:       MealItem[],
  totalMacros: { kcal, p, c, f },  // Cache der Summe (beim Speichern berechnet)
  lastUsed:    number|null,   // für Sortierung
  createdAt, updatedAt, deviceId,  // Syncable (wie foodsCustom/recipesCustom)
}

// MealItem
{
  foodRef:  string,   // 'fav:<id>' | 'off:<barcode>' | 'manual'
  foodName: string,
  gramm:    number,
  kcal:     number,   // absolute Werte für DIESE Menge (wie TrackedFood)
  p: number, c: number, f: number,
}
```

Kein Schema-Bump: Store + Indizes (`lastUsed`, `updatedAt`) existieren seit Migration v2.

---

## Neue pure Funktionen (`js/calc/meals.js`, mit Tests)

```javascript
// Summiert die Makros aller Items: { kcal, p, c, f }
// kcal ganzzahlig, p/c/f 1 Dezimalstelle (Konvention calcTrackedFoodMacros)
export function computeMealTotals(items)

// Wandelt SavedMeal-Items in TrackedFood-Einträge für einen Slot um
// (je Item ein Eintrag; id/timestamp werden vom Aufrufer ergänzt)
export function mealItemsToTrackedFoods(meal, slot)
```

Slot-Lücken-Vergleich: bestehendes `computeSlotGap` wird wiederverwendet.

---

## UI

### Einstiegspunkt (Tracker-Tab)

Unter „+ Mahlzeit eintragen" ein zweiter Button:

```
[ + Mahlzeit eintragen ]
[ ★ Meine Mahlzeiten   ]
```

### Modal „Meine Mahlzeiten" (`SavedMealsModal`)

```
┌──────────────────────────────────────────────┐
│ MEINE MAHLZEITEN                          ×  │
│ ┌──────────────────────────────────────────┐ │
│ │ Mein Frühstücksquark      412 kcal · 38P │ │
│ │ Frühstück · 4 Lebensmittel               │ │
│ │ [▶ Eintragen]                    [✏] [×] │ │
│ └──────────────────────────────────────────┘ │
│ … weitere (sortiert nach zuletzt verwendet)  │
│                                              │
│ [+ Neue Mahlzeit zusammenstellen]            │
└──────────────────────────────────────────────┘
```

- **▶ Eintragen:** kleine Slot-Auswahl erscheint (Dropdown, `defaultSlot` vorausgewählt, nur Slots des aktuellen Tagesplans) + „Jetzt eintragen" → alle Items landen als einzelne TrackedFoods im Slot, `lastUsed` wird gesetzt, Toast „4 Lebensmittel eingetragen", Modal schließt.
- **✏ / ×:** öffnet den Baukasten zum Bearbeiten / löscht nach Rückfrage.

### Baukasten (`MealBuilderModal`)

Wie der Rezept-Editor, aber schlanker — und mit dem Ziel-Panel oben:

```
┌──────────────────────────────────────────────┐
│ MAHLZEIT ZUSAMMENSTELLEN                  ×  │
│ Name:  [Mein Frühstücksquark_____________]   │
│ Slot:  [Frühstück ▼]                         │
│ ┌──────────────────────────────────────────┐ │
│ │ Ziel Frühstück: 620 kcal · P 38 · KH 55  │ │
│ │ Diese Mahlzeit: 412 kcal · P 38 · KH 30  │ │
│ │ Noch offen: 208 kcal · KH 25 · F 2       │ │
│ │ ✓ MPS: ~30g Protein erreicht (38g)       │ │
│ └──────────────────────────────────────────┘ │
│ LEBENSMITTEL                                 │
│ [Magerquark__________🔍] [250] g  [×]        │
│   → 168 kcal · 30g P · 10g KH · 0,5g F      │
│ [Blaubeeren__________🔍] [100] g  [×]        │
│   → 46 kcal · 0,7g P · 8g KH · 0,3g F       │
│ [+ Lebensmittel hinzufügen]                  │
│            [Abbrechen]  [Mahlzeit speichern] │
└──────────────────────────────────────────────┘
```

- **Item-Zeile = Suchfeld** (gleiche Mechanik wie Rezept-Zutaten-Suche v1.5.0): ab 2 Zeichen Favoriten-Vorschläge + „🌐 In Open Food Facts suchen…"; Auswahl übernimmt Name + Makros/100g, Gramm-Feld daneben; Makros des Items = per 100g × Gramm (`calcTrackedFoodMacros`). Manuelle Makro-Eingabe über kleines „✏ Details" wie im Rezept-Editor.
- **Ziel-Panel** aktualisiert sich live bei jeder Änderung (Slot-Wechsel ändert das Ziel). Datenquelle: `slotTargets` + `computeSlotGap` — identisch zu v1.5.2.
- **Speichern:** mindestens 1 Item mit Name + Gramm + Makros; `totalMacros` als Snapshot.

### Abgrenzung zu Favoriten (foodsCustom)

- **Favorit** = EIN Lebensmittel mit Makros pro 100g.
- **Mahlzeit** = Kombination mehrerer Lebensmittel mit festen Mengen.
- Items referenzieren Favoriten nur als Quelle (`foodRef: 'fav:<id>'`), speichern aber eigene Werte — späteres Löschen eines Favoriten zerstört keine Mahlzeit (Cache-Prinzip wie in der Projekt-Spec §4.2.2).

---

## Storage / Export

- `js/storage/indexeddb.js`: `getAllMeals()`, `saveMeal(meal)` (createdAt/updatedAt/deviceId wie saveFavoriteFood), `deleteMeal(id)`
- `js/hooks/useSavedMeals.js`: neuer Hook (Muster: useFavoriteFoods)
- `js/storage/exportImport.js`: `meals` in `exportAll` (Promise.all-Block) + `importAll` (Merge per id) — **+ Tests** wie bei foodsCustom

---

## Geänderte/neue Dateien

| Datei | Änderung |
|---|---|
| `js/calc/meals.js` | **neu** — computeMealTotals, mealItemsToTrackedFoods |
| `js/hooks/useSavedMeals.js` | **neu** |
| `js/tabs/tracker/SavedMealsModal.js` | **neu** — Liste + Eintragen |
| `js/tabs/tracker/MealBuilderModal.js` | **neu** — Baukasten mit Ziel-Panel |
| `js/tabs/tracker/TrackerTab.js` | Button „★ Meine Mahlzeiten"; applyMeal-Handler (addEntry je Item) |
| `js/storage/indexeddb.js` | meals-CRUD |
| `js/storage/exportImport.js` | meals in Export/Import |
| `tests/unit/calc/meals.test.js` | **neu** |
| `tests/unit/storage/exportImport.test.js` | + meals-Tests |
| `service-worker.js` | neue Dateien in LOCAL_ASSETS, Version 1.6.0 |
| `js/version.js` | 1.6.0 |

---

## Getroffene Design-Entscheidungen (zur Bestätigung)

1. **Zentrale Verwaltung in einem Modal** („Meine Mahlzeiten" im Tracker) statt Vermischung mit dem Einzel-Eintrag-Dialog — der bleibt unverändert schlank.
2. **Items speichern absolute Werte** (Cache) statt Live-Referenz auf Favoriten — robust gegen gelöschte/geänderte Favoriten, konsistent mit Projekt-Spec.
3. **`defaultSlot` pro Mahlzeit** — dient als Ziel-Referenz im Baukasten und Vorauswahl beim Eintragen; beim Eintragen jederzeit änderbar.
4. **Keine Portions-Skalierung in v1** — die Mahlzeit wird eingetragen wie zusammengestellt; Skalierung (×0,5/×2) ist ein sauberes Folge-Feature.

---

*Erstellt: 2026-06-10 · Status: Spec · APP_VERSION-Ziel: 1.6.0*
