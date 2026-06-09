# Rezept-Makros aus Zutaten berechnen — Design-Spec

**Datum:** 2026-06-09  
**Status:** Spec · noch nicht implementiert  
**Ziel-APP_VERSION nach Umsetzung:** 1.4.0  
**SCHEMA_VERSION:** 3 (unverändert — kein neuer Store, kein Index-Umbau)

---

## Ziel

Eigene Rezepte sollen ihre Gesamt-Makros (kcal / Protein / KH / Fett) automatisch aus den Zutaten berechnen können — statt sie manuell einzutragen. Bestehende Initialrezepte und bereits gespeicherte eigene Rezepte bleiben ohne Änderung nutzbar.

---

## Scope

| Feature | In diesem Feature | Bewusst raus |
|---|---|---|
| Ingredient-Erweiterung: optionale Makros + gramm-Äquivalent | ✅ | |
| Calc-Funktion `calcIngredientMacros` | ✅ | |
| Calc-Funktion `calcRecipeMacrosFromIngredients` | ✅ | |
| Compat-Funktion `getRecipeMacros` (Legacy-Fallback) | ✅ | |
| Aktualisiertes `scaleRecipeMacros` (mit `totalGrammPerServing`) | ✅ | |
| RecipeEditor: Makros pro Zutat erfassen (OFD / Favorit / manuell) | ✅ | |
| RecipeEditor: berechnete Gesamt-Makros live anzeigen | ✅ | |
| RecipeEditor: manueller Override mit Kennzeichnung | ✅ | |
| Tracking: `gramm` aus Zutaten-Summe statt `100`-Platzhalter | ✅ | |
| Legacy-Kompatibilität: bestehende Rezepte ohne Makro-Zutaten | ✅ | |
| Vollständiges Einheiten-/Portionssystem (Stk mit Gewicht, Flüssig-Dichte) | ❌ Folge-Feature | |
| OFD-Barcode-Lookup direkt aus Zutat | ❌ Folge-Feature | |
| Zutaten-Datenbank / Auto-Vervollständigung aus Favoriten-Namen | ❌ Folge-Feature | |
| Initialrezepte mit Makros pro Zutat befüllen | ❌ separates Datenpaket | |

---

## Datenmodell

### Erweitertes `RecipeIngredient`

Bestehende Felder bleiben unverändert. Die vier Makro-Felder und `grammEquivalent` sind **optional** — fehlen sie, wird die Zutat bei der Makro-Berechnung übersprungen.

```javascript
// Bestehendes Shape (unverändert, abwärtskompatibel):
// { name, amount, unit, isMain }

// Erweitertes Shape:
{
  name:             string,   // Anzeigename
  amount:           number,   // Menge in der gewählten Einheit
  unit:             string,   // 'g' | 'ml' | 'EL' | 'TL' | 'Stk' | 'Packung' | ...
  isMain:           boolean,  // Haupt-Zutat (Display-Hervorhebung)

  // NEU — alle optional; fehlen sie → Zutat ohne Makros
  grammEquivalent?: number,   // 1 Einheit = X Gramm; nur nötig bei non-g/ml Einheiten
  kcal100?:         number,   // kcal pro 100g
  p100?:            number,   // Protein pro 100g
  c100?:            number,   // Kohlenhydrate pro 100g
  f100?:            number,   // Fett pro 100g
  sourceRef?:       string,   // 'manual' | 'fav:<uuid>' | 'off:<barcode>'
}
```

### Erweitertes `Recipe` / `CustomRecipe`

```javascript
{
  // Bestehende Felder (unverändert):
  id, name, mealSlot, prepTime, servings, icon, tip, steps, ingredients,
  kcal, protein, carbs, fat,   // ← bleiben als Fallback für Legacy + manuelle Mode

  // NEU — optional, default = 'manual' wenn fehlt
  macroMode?: 'manual' | 'ingredients',
  // 'manual':      kcal/protein/carbs/fat wie bisher direkt gespeichert
  // 'ingredients': Makros werden aus Zutaten berechnet; kcal/protein/carbs/fat
  //                werden beim Speichern als berechnete Snapshot-Werte mitgeschrieben
  //                (für Anzeige ohne Neuberechnung, z.B. RecipeCard)
}
```

**Warum Snapshot-Werte mitschreiben?** RecipeCard, RecipeToTrackerModal und Tracking lesen `recipe.kcal` etc. direkt. Wenn wir die berechneten Werte beim Speichern mitschreiben, müssen diese Komponenten nichts über `macroMode` wissen — vollständige Abwärtskompatibilität ohne Props-Kaskade.

---

## Gram-Äquivalente für Nicht-Gramm-Einheiten

Standardwerte für die Berechnung, falls der Nutzer kein `grammEquivalent` eingetragen hat:

```javascript
// js/calc/recipeTracking.js
export const UNIT_GRAM_DEFAULTS = {
  'ml':      1.0,   // Wasser/Milch ≈ 1g/ml — für Öl/Sahne ungenau, aber vertretbar
  'EL':      15,    // Küchenstandard Esslöffel (15ml ≈ 15g Wasser, ~12g Öl)
  'TL':       5,    // Teelöffel
  'Stk':     null,  // kein sinnvoller Default → Nutzerin muss grammEquivalent angeben
  'Packung': null,  // variiert zu stark
  'Scheibe': 25,    // mittlere Brotscheibe
  'Dose':   400,    // typische kleine Dose (Tomaten, Bohnen)
  'Portion': null,  // keine Referenz ohne Kontext
};
```

`null`-Werte bedeuten: Zutat wird bei der Berechnung übersprungen, **sofern kein `grammEquivalent` gesetzt ist**. Im Editor wird ein Hinweis angezeigt: „Bitte Gramm-Äquivalent für diese Einheit angeben."

---

## Neue und geänderte Calc-Funktionen

Alle in `js/calc/recipeTracking.js`, alle rein/testbar.

### `calcIngredientMacros(ingredient)`

```javascript
/**
 * Berechnet Makros einer einzelnen Zutat.
 * Gibt null zurück wenn Makros oder Gramm-Äquivalent fehlen.
 */
export function calcIngredientMacros(ingredient) {
  const { amount, unit, kcal100, p100, c100, f100, grammEquivalent } = ingredient;
  if (kcal100 == null) return null;  // keine Makros hinterlegt

  let gramm;
  if (unit === 'g') {
    gramm = amount;
  } else if (unit === 'ml') {
    gramm = amount * 1.0;  // Näherung
  } else {
    const equiv = grammEquivalent ?? UNIT_GRAM_DEFAULTS[unit] ?? null;
    if (equiv == null) return null;  // kein Äquivalent bekannt
    gramm = amount * equiv;
  }

  const factor = gramm / 100;
  return {
    kcal:  Math.round((kcal100 ?? 0) * factor),
    p:     Math.round((p100   ?? 0) * factor * 10) / 10,
    c:     Math.round((c100   ?? 0) * factor * 10) / 10,
    f:     Math.round((f100   ?? 0) * factor * 10) / 10,
    gramm: Math.round(gramm),
  };
}
```

### `calcRecipeMacrosFromIngredients(ingredients)`

```javascript
/**
 * Summiert Makros aller Zutaten mit bekannten Makros.
 * Gibt null zurück wenn keine einzige Zutat Makros hat.
 * Gibt { kcal, protein, carbs, fat, totalGramm, missingCount } zurück.
 * missingCount > 0 bedeutet: Summe ist unvollständig.
 */
export function calcRecipeMacrosFromIngredients(ingredients) {
  let kcal = 0, protein = 0, carbs = 0, fat = 0, totalGramm = 0;
  let countWith = 0, countWithout = 0;

  for (const ing of ingredients) {
    const m = calcIngredientMacros(ing);
    if (m == null) {
      countWithout++;
    } else {
      kcal      += m.kcal;
      protein   += m.p;
      carbs     += m.c;
      fat       += m.f;
      totalGramm += m.gramm;
      countWith++;
    }
  }

  if (countWith === 0) return null;

  return {
    kcal:       Math.round(kcal),
    protein:    Math.round(protein * 10) / 10,
    carbs:      Math.round(carbs   * 10) / 10,
    fat:        Math.round(fat     * 10) / 10,
    totalGramm: Math.round(totalGramm),
    missingCount: countWithout,  // > 0 → Warnung im UI
  };
}
```

### `getRecipeMacros(recipe)` — Compatibility-Wrapper

```javascript
/**
 * Liefert die effektiven Makros eines Rezepts.
 * Abstrahiert über macroMode — Aufrufer muss macroMode nicht kennen.
 * Gibt immer { kcal, protein, carbs, fat, totalGramm, missingCount } zurück.
 * totalGramm ist null wenn nicht berechenbar (Legacy oder manual mode).
 */
export function getRecipeMacros(recipe) {
  if (recipe.macroMode === 'ingredients') {
    const calc = calcRecipeMacrosFromIngredients(recipe.ingredients ?? []);
    if (calc) return calc;
    // Fallback: berechnete Snapshot-Werte oder manuelle Felder
  }
  return {
    kcal:        recipe.kcal    ?? 0,
    protein:     recipe.protein ?? 0,
    carbs:       recipe.carbs   ?? 0,
    fat:         recipe.fat     ?? 0,
    totalGramm:  null,
    missingCount: 0,
  };
}
```

### Aktualisiertes `scaleRecipeMacros`

```javascript
/**
 * Skaliert Rezept-Makros auf eine gegebene Portionszahl.
 * Mit totalGramm: gramm pro Portion berechenbar (kein 100g-Platzhalter mehr).
 */
export function scaleRecipeMacros(recipe, portions) {
  const macros = getRecipeMacros(recipe);
  const factor = portions / (recipe.servings ?? 1);
  return {
    kcal:  Math.round(macros.kcal    * factor),
    p:     Math.round(macros.protein * factor * 10) / 10,
    c:     Math.round(macros.carbs   * factor * 10) / 10,
    f:     Math.round(macros.fat     * factor * 10) / 10,
    // gramm: berechnete Portion-Gramm wenn möglich, sonst null (→ 100g-Platzhalter bleibt)
    grammPerPortion: macros.totalGramm != null
      ? Math.round(macros.totalGramm / (recipe.servings ?? 1) * portions)
      : null,
  };
}
```

---

## RecipeEditor — UI-Änderungen

### Zutat-Zeile: expandierbarer Makro-Abschnitt

Jede Zutat-Zeile erhält einen kleinen Toggle-Button `[+ Makros]` / `[− Makros]`. Wenn aufgeklappt:

```
┌──────────────────────────────────────────────────────┐
│ Zutat: [Magerquark___________] [200] [g▼] [⭐] [×]  │
│ ▼ Makros                                             │
│   Quelle: [Aus Favoriten ▼]  [OFD Suche]            │
│   kcal/100g [___]  P [___]  KH [___]  F [___]       │
│   Gramm-Äquivalent: — (nur bei EL/TL/Stk etc.)      │
└──────────────────────────────────────────────────────┘
```

**Quell-Optionen:**
- `Manuell` — Makros direkt eingeben
- `Aus Favoriten` — Picker öffnet sich (wie in FoodEntryModal), Makros werden übernommen
- `OFD Suche` — OFFSearchPanel wie im Tracker; Makros + `sourceRef: 'off:<barcode>'` werden gesetzt

Wenn ein Favorit oder OFD-Produkt gewählt wird, füllen sich die vier Felder automatisch. Der Nutzer kann sie danach noch manuell überschreiben (kein Lock).

### Gesamt-Makros am Ende des Editors

Unterhalb der Zutaten-Liste, oberhalb der Zubereitungsschritte:

```
┌──────────────────────────────────────────────────────┐
│ MAKROS GESAMT (berechnet aus Zutaten)                │
│ 3 von 5 Zutaten mit Makros · ⚠ unvollständig        │
│ 380 kcal · 42g P · 28g KH · 8g F                    │
│ pro Portion (1 von 1): 380 kcal · 42g P · ...        │
│                                                      │
│ ○ Berechnet aus Zutaten   ● Manuell überschreiben   │
│   [kcal] [P] [KH] [F]  ← nur sichtbar wenn manuell │
└──────────────────────────────────────────────────────┘
```

**Verhalten:**
- Standard: `macroMode = 'ingredients'` sobald mindestens eine Zutat Makros hat
- Wenn keine Zutat Makros hat: `macroMode = 'manual'` (bisheriges Verhalten, kein visueller Unterschied)
- Toggle „Manuell überschreiben": setzt `macroMode = 'manual'`, füllt die Felder mit den zuletzt berechneten Werten vor (als Startwert)
- Beim Speichern im `'ingredients'`-Modus: berechnete Werte werden in `kcal/protein/carbs/fat` als Snapshot mitgeschrieben

**Warnung bei unvollständigen Makros:**
- `missingCount > 0` → gelber Hinweis „X Zutat(en) ohne Makros — Summe unvollständig"
- Speichern trotzdem möglich

### Anzeige in RecipeCard

Wenn `recipe.macroMode === 'ingredients'`:
- Kleines `⚡`-Icon neben den Makros in der Karte → „Makros aus Zutaten berechnet"
- Kein funktionaler Unterschied, nur visuelle Info

---

## Tracking-Übernahme (`RecipeToTrackerModal`)

```javascript
// Bisherige Logik:
const macros = scaleRecipeMacros(recipe, portions);
entry = {
  ...
  gramm: 100,  // ← Platzhalter
  kcal:  macros.kcal,
  p:     macros.p,
  // ...
};

// Neue Logik:
const macros = scaleRecipeMacros(recipe, portions);  // gibt jetzt grammPerPortion zurück
entry = {
  ...
  gramm: macros.grammPerPortion ?? 100,  // echtes Gewicht wenn berechenbar, sonst Platzhalter
  kcal:  macros.kcal,
  p:     macros.p,
  // ...
};
```

Wenn `gramm` weiterhin `100` ist (Legacy oder Stk/Packung ohne Äquivalent), bleibt der Eintrag exakt wie bisher. Kein Datenverlust, kein Breaking Change.

---

## Migration / Kompatibilität

### SCHEMA_VERSION: keine Änderung

Die neuen Felder (`macroMode`, `grammEquivalent`, `kcal100` usw. pro Ingredient) sind **optionale Ergänzungen** in bestehenden IndexedDB-Records. IndexedDB ist schemalos für Record-Inhalte — kein neuer Store, kein Index, keine Migration nötig.

SCHEMA_VERSION bleibt **3**.

### Bestehende Rezepte

| Szenario | Verhalten |
|---|---|
| Initialrezept ohne `macroMode` | `getRecipeMacros` liefert `recipe.kcal` etc. — exakt wie heute |
| Eigenes Rezept ohne `macroMode` | Gleich wie Initialrezept — kein Unterschied |
| Eigenes Rezept mit `macroMode: 'manual'` | Wie heute: manuelle `kcal/protein/carbs/fat` |
| Eigenes Rezept mit `macroMode: 'ingredients'` | `calcRecipeMacrosFromIngredients` — neu |
| Zutaten ohne `kcal100` | `calcIngredientMacros` gibt `null` → wird übersprungen |

### Export / Import

`exportAll` und `importAll` lesen/schreiben den vollen IndexedDB-Record. Die neuen Felder sind automatisch dabei — kein Export/Import-Code muss angepasst werden.

Ältere Exporte (ohne `macroMode`) können problemlos importiert werden — `macroMode` fehlt → wird als `'manual'` behandelt.

---

## Abgrenzung zum späteren Einheiten-/Portionssystem

Das geplante Einheitensystem (Stk mit wählbarem Gewicht, Flüssig-Dichte, Äpfel vs. Bananen) ist ein eigenständiges Feature. Diese Spec ist bewusst eng gehalten:

- `grammEquivalent` pro Ingredient ist ein **einfaches Override-Feld**, kein neues Einheitensystem.
- `UNIT_GRAM_DEFAULTS` ist eine **Annäherungstabelle**, kein Einheitenregister.
- Ein späteres Einheitensystem kann `grammEquivalent` pro Ingredient ersetzen oder ergänzen, ohne Breaking Change — das Feld ist optional.
- `totalGramm` in `RecipeResult` ist ein **berechneter Hilfswert** für das Tracking, keine persistierte Portionsgröße.

Die einzige Sackgasse wäre, `gramm` im TrackedFood als semantisch bedeutsam zu behandeln (z.B. für Rückrechnung auf 100g-Basis). Das tun wir nicht — `gramm` bleibt ein Convenience-Feld für die Anzeige.

---

## Tests

Alle in `tests/unit/calc/recipeTracking.test.js` (Datei existiert bereits mit 7 Tests).

### Neue Tests für `calcIngredientMacros`

```javascript
// g-Einheit: direkte Gramm-Umrechnung
calcIngredientMacros({ name: 'X', amount: 200, unit: 'g', kcal100: 50, p100: 4, c100: 3, f100: 1 })
// → { kcal: 100, p: 8.0, c: 6.0, f: 2.0, gramm: 200 }

// EL-Einheit mit Default (15g/EL)
calcIngredientMacros({ name: 'Öl', amount: 2, unit: 'EL', kcal100: 884, p100: 0, c100: 0, f100: 100 })
// → { kcal: 265, p: 0, c: 0, f: 30.0, gramm: 30 }

// EL-Einheit mit explizitem grammEquivalent
calcIngredientMacros({ name: 'Honig', amount: 1, unit: 'EL', grammEquivalent: 21, kcal100: 304, p100: 0.3, c100: 82, f100: 0 })
// → { kcal: 64, p: 0.1, c: 17.2, f: 0.0, gramm: 21 }

// Keine Makros → null
calcIngredientMacros({ name: 'Salz', amount: 1, unit: 'TL' })
// → null

// Unbekannte Einheit ohne grammEquivalent → null
calcIngredientMacros({ name: 'X', amount: 1, unit: 'Stk', kcal100: 100, p100: 5, c100: 10, f100: 2 })
// → null

// Unbekannte Einheit mit explizitem grammEquivalent → berechnet
calcIngredientMacros({ name: 'Ei', amount: 1, unit: 'Stk', grammEquivalent: 55, kcal100: 143, p100: 12, c100: 1, f100: 10 })
// → { kcal: 79, p: 6.6, c: 0.6, f: 5.5, gramm: 55 }
```

### Neue Tests für `calcRecipeMacrosFromIngredients`

```javascript
// Alle Zutaten mit Makros → vollständig, missingCount = 0
// Mischung: einige mit, einige ohne → missingCount > 0, Warnung
// Keine mit Makros → null
```

### Neue Tests für `getRecipeMacros`

```javascript
// Legacy-Rezept (kein macroMode): liefert recipe.kcal etc.
// macroMode: 'manual': liefert recipe.kcal etc.
// macroMode: 'ingredients' mit Makros in Zutaten: liefert Berechnung
// macroMode: 'ingredients' ohne Makros in Zutaten: Fallback auf recipe.kcal
```

### Aktualisierte Tests für `scaleRecipeMacros`

```javascript
// Legacy-Rezept: grammPerPortion = null (100g-Platzhalter bleibt)
// Ingredients-Rezept mit totalGramm: grammPerPortion = totalGramm / servings * portions
```

---

## Geänderte Dateien (Übersicht)

| Datei | Änderung |
|---|---|
| `js/calc/recipeTracking.js` | `UNIT_GRAM_DEFAULTS`, `calcIngredientMacros`, `calcRecipeMacrosFromIngredients`, `getRecipeMacros`, `scaleRecipeMacros` aktualisiert |
| `js/tabs/rezepte/RecipeEditor.js` | Zutat-Zeile: Makro-Abschnitt; Gesamt-Makros-Anzeige; `macroMode`-Toggle |
| `js/tabs/rezepte/RecipeToTrackerModal.js` | `gramm` aus `grammPerPortion` statt hartem `100` |
| `js/tabs/rezepte/RecipeCard.js` | Optional: `⚡`-Icon wenn `macroMode === 'ingredients'` |
| `tests/unit/calc/recipeTracking.test.js` | Neue Tests (bestehende 7 bleiben unverändert) |

**Nicht geändert:**
- `js/data/initialRecipes.js` — Initialrezepte bleiben ohne Makros pro Zutat
- `js/storage/migrations.js` — SCHEMA_VERSION bleibt 3
- `js/storage/exportImport.js` — kein Export/Import-Code nötig
- `js/storage/indexeddb.js` — kein Schema-Umbau
- `service-worker.js` — keine neuen Dateien (nur bestehende geändert)

---

## Offene Fragen (für Implementierung klären)

1. **OFD-Suche in Zutat:** Soll dieselbe `OFFSearchPanel`-Komponente aus dem Tracker wiederverwendet werden — oder eine schlankere Variante ohne `BarcodePanel`? Empfehlung: dieselbe Komponente, da kein Code-Duplikat entsteht.

2. **Favoriten-Picker in Zutat:** `FavoritePicker` ist bereits generisch (`favorites`, `onSelect`). Direkt wiederverwendbar.

3. **`macroMode`-Default beim Neuen Rezept:** Wenn die Nutzerin das erste Mal ein Rezept anlegt und keine Zutat-Makros einträgt — `macroMode` bleibt `'manual'`. Erst wenn sie Makros bei einer Zutat erfasst, wechselt der Default auf `'ingredients'`. Kein Hard-Switch ohne Makro-Daten.

4. **Snapshot-Zeitpunkt:** Berechnete `kcal/protein/carbs/fat` werden beim Speichern des Rezepts einmalig als Snapshot geschrieben. Bei nachträglichen Änderungen (Zutat-Menge geändert) werden sie beim nächsten Speichern automatisch aktualisiert. Kein Background-Sync nötig.

---

*Erstellt: 2026-06-09 · Status: Spec · noch nicht implementiert · APP_VERSION-Ziel: 1.4.0*
