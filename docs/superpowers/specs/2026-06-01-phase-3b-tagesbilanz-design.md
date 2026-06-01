# Phase 3B — Tagesbilanz: Design-Spec

**Datum:** 2026-06-01  
**Status:** Freigegeben  
**APP_VERSION nach Umsetzung:** 1.2.2  

---

## Ziel

Den Heute-Tab mit echten Ist-Werten füllen: `DaySummary` zeigt Gesamt-Istwerte gegen den Tagesplan, jeder `MealPlanEntry` zeigt das tatsächlich eingetragene Protein für diesen Mahlzeit-Slot.

---

## Scope

- Keine neue IndexedDB-Store, kein SCHEMA_VERSION-Bump
- Kein neuer Hook — `useLog` existiert bereits
- Keine neue Datei — alles in bestehenden Modulen
- Nur abgeleitete Darstellung aus vorhandenen Log-Daten

---

## Neue pure Funktionen — `js/calc/tracker.js`

### `sumConsumed(entries)`

Aggregiert alle `TrackedFood`-Einträge eines Tages zu Gesamt-Istwerten.  
Übersetzt interne Feldnamen (`p/c/f`) in das `DaySummary`-Format (`protein/carbs/fat`).

```js
export function sumConsumed(entries) {
  return entries.reduce((acc, e) => ({
    kcal:    acc.kcal    + (e.kcal ?? 0),
    protein: acc.protein + (e.p    ?? 0),
    carbs:   acc.carbs   + (e.c    ?? 0),
    fat:     acc.fat     + (e.f    ?? 0),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}
```

- Liefert rohe Summen (kein Runden) — Darstellungsschicht entscheidet über Rundung
- Fehlende Felder (`?? 0`) — robust gegen alte Einträge ohne vollständige Makros

### `groupProteinBySlot(entries)`

Gibt ein Objekt `{ [slotName]: proteinG }` zurück.

```js
export function groupProteinBySlot(entries) {
  return entries.reduce((acc, e) => {
    const slot = e.mealSlot || 'Sonstiges';
    return { ...acc, [slot]: (acc[slot] ?? 0) + (e.p ?? 0) };
  }, {});
}
```

- Entries ohne `mealSlot` → landen unter `"Sonstiges"` (kein Crash, kein Verlust)
- Lookup-Key entspricht `meal.label` in `MealPlanEntry` (z.B. `"Frühstück"`)

**Tests:** Beide Funktionen werden in `tests/unit/calc/tracker.test.js` ergänzt.

---

## Datenfluss

```
HeuteTab
  ├── today = new Date().toISOString().split('T')[0]
  ├── useLog(today, { dayType, trainingTime }) → { entries, loading }
  ├── sumConsumed(entries)       → consumed { kcal, protein, carbs, fat }
  ├── groupProteinBySlot(entries) → consumedBySlot { [slotName]: proteinG }
  │
  ├── DaySummary(macros, consumed)
  └── MealPlanList(dayType, trainingTime, macros, consumedBySlot)
        └── MealPlanEntry(meal, consumedProtein)
```

---

## Komponenten-Änderungen

### `HeuteTab.js`

- Importiert `useLog`, `sumConsumed`, `groupProteinBySlot`
- Berechnet `today` per `new Date().toISOString().split('T')[0]`
- Leitet `consumed` an `DaySummary` weiter
- Leitet `consumedBySlot` an `MealPlanList` weiter

### `DaySummary.js`

- Keine Struktur-Änderung — empfängt jetzt echtes `consumed` statt Default `{ kcal:0, … }`
- `KcalRing` und `MacroBar`s füllen sich automatisch

### `MealPlanList.js`

- Erhält neues Prop `consumedBySlot`
- Reicht `consumedBySlot[meal.label]` als `consumedProtein` an jedes `MealPlanEntry` weiter

### `MealPlanEntry.js`

Neue Protein-Zeile unterhalb der bestehenden Makro-Chips.

**Sichtbarkeit:** Zeile erscheint wenn `consumedProtein !== undefined` (0 ist gültig).

**Darstellung:**

| Zustand | Anzeige | Farbe |
|---|---|---|
| `consumedProtein === 0` | `Protein: Noch nicht erfasst` | `COLORS.textSubtle` |
| `> 0` und `< 90 %` von `meal.protein` | `Protein: 28 g / 35 g` | `COLORS.textMuted` |
| `>= 90 %` bis `<= 110 %` | `Protein: 32 g / 35 g` | `#5cb85c` (grün) |
| `> 110 %` | `Protein: 41 g / 35 g` | `#c8a96e` (gold) |

- Kein Rot/Fehler-Farbe — Protein-Erfassung ist kein Fehlerzustand
- Werte im UI: `Math.round(consumedProtein)` g

---

## Versionierung

- `APP_VERSION` → `1.2.2` (js/version.js + service-worker.js)
- Keine neuen Dateien → keine neuen Einträge in `LOCAL_ASSETS` nötig
- SCHEMA_VERSION bleibt `2`

---

## Tests

Neue Tests in `tests/unit/calc/tracker.test.js`:

- `sumConsumed([])` → `{ kcal:0, protein:0, carbs:0, fat:0 }`
- `sumConsumed([...])` → korrekte Aggregation mit `p → protein` Mapping
- Einträge mit fehlenden Feldern crashen nicht
- `groupProteinBySlot([])` → `{}`
- `groupProteinBySlot([...])` → korrekte Slot-Zuweisung
- Entries ohne `mealSlot` → `"Sonstiges"`
