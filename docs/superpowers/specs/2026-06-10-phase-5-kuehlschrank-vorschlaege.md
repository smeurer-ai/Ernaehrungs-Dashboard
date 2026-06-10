# Phase 5 — Kühlschrank + proteinpriorisierte Vorschläge — Design-Spec

**Datum:** 2026-06-10  
**Status:** Spec · Umsetzung in 3 Häppchen (5b/5c/5d)  
**Ziel-APP_VERSION:** 1.8.0 (5b) → 1.9.0 (5d)  
**SCHEMA_VERSION:** **4** (neuer Store `fridge` — erste Migration seit Phase 4!)

---

## Ziel

Die App weiß, was da ist (Kühlschrank + Notvorrat ⭐), und schlägt bei Tagesziel-Lücken **proteinpriorisiert** vor, was Stephanie essen kann — statt dass sie abends selbst rechnet. Litmus-Test: ✅ Kernfunktion der ursprünglichen Vision (§1.4: „intelligente, proteinpriorisierte Vorschläge aus Vorrat und Kühlschrank").

---

## Häppchen

| # | Inhalt | Version |
|---|---|---|
| **5b** | Schema v4 + Migration, `fridge`-CRUD, Hook, Export/Import, Kühlschrank-Modal im Tracker | 1.8.0 |
| **5c** | `recipeMatchesFridge` (calc/matching.js) + Filter „❄ Kühlschrank-passend" im Rezepte-Tab | 1.8.x |
| **5d** | `computeGapSuggestions` (calc/suggestions.js) + Vorschlags-Karte im Heute-Tab ab 17 Uhr | 1.9.0 |

---

## 5b — Kühlschrank

### Datenmodell (`fridge`, Schema v4 — exakt nach Projekt-Spec §4.2.4)

```javascript
// FridgeItem
{
  id:       string,    // UUID (keyPath)
  foodRef:  string,    // 'fav:<id>' | 'manual'
  foodName: string,    // "Skyr", "Brokkoli"
  gramm:    number|null, // optionale Mengenangabe
  createdAt, updatedAt, deviceId,   // Syncable
}
```

Migration v4 (`migrations.js`): Store `fridge` (keyPath `id`) + Indizes `createdAt`, `updatedAt`. Migrations-Test mit Mock-Altdaten (Pflicht-Regel §4.4).

### UX

- Schnellzugriff-Leiste im Tracker bekommt dritten Button: `★ Mahlzeiten · 🧺 Lebensmittel · ❄ Kühlschrank`
- **FridgeModal:** Eingabefeld mit Favoriten-Vorschlägen (wie Baukasten — `filterFavorites`) **plus Freitext** (Brokkoli muss kein Favorit sein); optionales Gramm-Feld; Liste der Items mit ×; Button „Kühlschrank leeren" (mit Rückfrage)
- Kein Ablaufdatum, keine Kategorien — bewusst minimal (Spec §2 #28: „mit/ohne Mengenangabe")

### Storage

`getAllFridgeItems()` (sortiert createdAt desc), `saveFridgeItem`, `deleteFridgeItem` (hart, kein Soft-Delete — Kühlschrank ist Verbrauchsliste), `clearFridge()`. Hook `useFridge`. Export/Import inkl. `fridge` (+ Tests).

---

## 5c — Rezept-Matching

### `recipeMatchesFridge(recipe, fridgeItems)` — pure, calc/matching.js

- Betrachtet nur Zutaten mit `isMain: true` (● aus dem Rezept-Editor)
- Eine Hauptzutat „ist da", wenn ihr Name (normalisiert: lowercase, trim) als Substring in einem FridgeItem-Namen vorkommt **oder umgekehrt** („Hähnchenbrust" ↔ „Hähnchen")
- Rückgabe: `{ matches: boolean, missingMain: string[] }` — matches = alle Hauptzutaten vorhanden
- Rezept ohne Hauptzutaten → `matches: false` (kein Treffer „aus Versehen")

### UX Rezepte-Tab

Toggle-Chip neben dem Suchfeld: „❄ Kühlschrank-passend". Aktiv → nur Rezepte mit `matches: true`; auf jeder Karte optional klein „fehlt: X, Y" bei fast-passenden (max 1 fehlende) — v1 nur Filter, fehlt-Anzeige nice-to-have.

---

## 5d — Smarte Vorschläge (Herzstück)

### `computeGapSuggestions({ gap, isEvening, favorites, meals, fridgeItems })` — pure, calc/suggestions.js

**Wann:** Heute-Tab, ab 17:00 lokaler Zeit, wenn `gap.p >= 10` (sonst keine Karte — kein Rauschen).

**Kandidaten:** Favoriten-Lebensmittel (Portionsannahme 100g bzw. 150g bei Quark/Skyr-Kategorien? — nein, einfach 100g-Basis anzeigen) + Favoriten-Mahlzeiten (totalMacros).

**Scoring (Protein-Priorität, Spec-Funktionen #42/#43):**

```
score = proteinDichte (p100 bzw. p/100kcal)        // Basis
      + 30  wenn isNotvorrat (⭐)                   // Funktion #31
      + 30  wenn im Kühlschrank (Namens-Match)      // Funktion #31
      + 20  wenn isEvening und Casein-Quelle        // Funktion #42: Abend-Casein
      − 50  wenn kcal des Kandidaten > 1.3 × gap.kcal  // sprengt das Tagesziel nicht
```

Casein-Quellen-Heuristik: Name enthält quark/skyr/casein/hüttenkäse/cottage (lowercase).

**Rückgabe:** Top 4, je `{ kind: 'favorite'|'meal', item, reason }` — reason als Klartext-Badge: „⭐ Notvorrat", „❄ im Kühlschrank", „🌙 Casein für die Nacht", „💪 proteinreich".

### UX Heute-Tab

Karte „Vorschläge für Deine Lücke" zwischen DaySummary und Mahlzeitenplan (nur wenn Vorschläge vorhanden): Lücke in einer Zeile (`Noch offen: P 26g · 410 kcal`), darunter die Kandidaten mit Badge + Makros. v1 ohne Direkt-Eintragen-Knopf (Folge-Feature) — Eintragen läuft über den Tracker.

---

## Geänderte/neue Dateien (gesamt Phase 5)

| Datei | Häppchen |
|---|---|
| `js/version.js` (SCHEMA_VERSION 4), `js/storage/migrations.js` (+Migration 4 + Test) | 5b |
| `js/storage/indexeddb.js` (fridge-CRUD), `js/storage/exportImport.js` (+Tests) | 5b |
| `js/hooks/useFridge.js`, `js/tabs/tracker/FridgeModal.js`, `TrackerTab.js` | 5b |
| `js/calc/matching.js` (+Tests), `js/tabs/rezepte/RezepteTab.js` (Filter-Chip) | 5c |
| `js/calc/suggestions.js` (+Tests), `js/tabs/heute/GapSuggestions.js`, `HeuteTab.js` | 5d |
| `service-worker.js` (neue Dateien + Versionen) | alle |

## Entscheidungen

1. **fridge hart löschen** statt Soft-Delete — Verbrauchsliste, kein Sync-relevanter Bestand (Sync-Konflikt schlimmstenfalls: Item taucht wieder auf, harmlos)
2. **Namens-Substring-Matching** statt foodRef-Pflicht — Kühlschrank füllt man schnell per Freitext; robust genug (gleiche Philosophie wie `isMainMealSlot`)
3. **Vorschläge ohne 1-Klick-Eintrag in v1** — erst Vorschlagsqualität validieren, dann Komfort
4. **17-Uhr-Schwelle hart codiert** (Spec #30) — konfigurierbar erst wenn Bedarf entsteht

---

*Erstellt: 2026-06-10 · Status: Spec · Häppchen 5b → 5c → 5d*
