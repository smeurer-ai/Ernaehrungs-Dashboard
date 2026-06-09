# Rezept-Makros aus Zutaten berechnen — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eigene Rezepte können Gesamt-Makros automatisch aus Zutaten berechnen; bestehende Rezepte bleiben unverändert nutzbar.

**Architecture:** Additive Erweiterung — neue optionale Felder in `RecipeIngredient` + `Recipe.macroMode`. Snapshot-Strategie: Berechnete Makros werden beim Speichern in `kcal/protein/carbs/fat` geschrieben, damit RecipeCard und Tracker nichts über `macroMode` wissen müssen. SCHEMA_VERSION bleibt 3.

**Tech Stack:** React 18 + htm (no JSX/no build), Vitest, IndexedDB (idb), ES-Module

---

## Datei-Übersicht

| Datei | Aktion | Was sich ändert |
|---|---|---|
| `js/calc/recipeTracking.js` | Erweitern | `UNIT_GRAM_DEFAULTS` + 3 neue Funktionen + `scaleRecipeMacros` update |
| `tests/unit/calc/recipeTracking.test.js` | Erweitern | ~18 neue Tests (7 bestehende bleiben) |
| `js/tabs/rezepte/RecipeToTrackerModal.js` | Kleine Änderung | `gramm: macros.grammPerPortion ?? 100` |
| `js/tabs/rezepte/RecipeCard.js` | Kleine Änderung | `⚡`-Icon wenn `macroMode === 'ingredients'` |
| `js/tabs/rezepte/RecipeEditor.js` | Größte Änderung | Zutat-Makros-Abschnitt, Gesamt-Anzeige, `macroMode`-Toggle |
| `js/tabs/rezepte/RezepteTab.js` | Kleine Änderung | `useFavoriteFoods` importieren, `favorites` an `RecipeEditor` weitergeben |
| `js/version.js` | Bump | `1.3.7` → `1.4.0` |
| `service-worker.js` | Bump | `1.3.7` → `1.4.0` (Cache-Name) |

**Nicht geändert:** `js/data/initialRecipes.js`, `js/storage/migrations.js`, `js/storage/exportImport.js`, `js/storage/indexeddb.js`

---

## Wichtige Codebase-Konventionen (lesen vor dem ersten Task)

- **Kein JSX, kein Build:** Alle Komponenten nutzen `` html`...` `` aus `../../lib.js` (preact + htm)
- **Keine default exports:** Immer `export function` oder `export const`
- **React = preact/compat:** `useState`, `useEffect`, `useMemo` kommen aus `../../lib.js`
- **Styles als Inline-Objekte:** `style=${{ ... }}` (htm-Syntax). Farben aus `COLORS`, Fonts aus `FONTS`, vordefinierte Styles aus `S` (alle in `js/ui/theme.js`)
- **Tests:** Nur reine Funktionen testbar (Vitest, `environment: 'node'`). Keine React-Komponenten importieren.
- **Branches:** Vor jedem Task auf Feature-Branch arbeiten (`git checkout -b feat/rezept-makros-aus-zutaten`)

---

## Task 1: Calc-Funktionen (TDD)

**Files:**
- Modify: `js/calc/recipeTracking.js`
- Modify: `tests/unit/calc/recipeTracking.test.js`

### Aktueller Stand

`js/calc/recipeTracking.js` enthält nur:
```javascript
export function scaleRecipeMacros(recipe, portions) {
  const factor = portions / (recipe.servings ?? 1);
  return {
    kcal: Math.round(recipe.kcal * factor),
    p:    Math.round(recipe.protein * factor * 10) / 10,
    c:    Math.round(recipe.carbs   * factor * 10) / 10,
    f:    Math.round(recipe.fat     * factor * 10) / 10,
  };
}
```

Die 7 bestehenden Tests testen diese Funktion. **Alle 7 Tests müssen auch nach dem Update noch grün sein.**

---

- [ ] **Schritt 1: Feature-Branch anlegen**

```bash
git checkout -b feat/rezept-makros-aus-zutaten
```

---

- [ ] **Schritt 2: Failing Tests schreiben (calcIngredientMacros)**

Datei `tests/unit/calc/recipeTracking.test.js` — nach dem bestehenden `describe('scaleRecipeMacros', ...)` Block einfügen:

```javascript
import { scaleRecipeMacros, calcIngredientMacros, calcRecipeMacrosFromIngredients, getRecipeMacros } from '../../../js/calc/recipeTracking.js';

// (bestehende imports bleiben — nur den import um die neuen Funktionen erweitern)
```

Neuen describe-Block anhängen:

```javascript
describe('calcIngredientMacros', () => {
  it('g-Einheit: direkte Gramm-Berechnung', () => {
    const r = calcIngredientMacros({ name: 'X', amount: 200, unit: 'g', kcal100: 50, p100: 4, c100: 3, f100: 1 });
    expect(r).toEqual({ kcal: 100, p: 8.0, c: 6.0, f: 2.0, gramm: 200 });
  });

  it('EL-Einheit mit Default 15g/EL', () => {
    const r = calcIngredientMacros({ name: 'Öl', amount: 2, unit: 'EL', kcal100: 884, p100: 0, c100: 0, f100: 100 });
    expect(r).toEqual({ kcal: 265, p: 0.0, c: 0.0, f: 30.0, gramm: 30 });
  });

  it('EL-Einheit mit explizitem grammEquivalent', () => {
    const r = calcIngredientMacros({ name: 'Honig', amount: 1, unit: 'EL', grammEquivalent: 21, kcal100: 304, p100: 0.3, c100: 82, f100: 0 });
    expect(r).toEqual({ kcal: 64, p: 0.1, c: 17.2, f: 0.0, gramm: 21 });
  });

  it('keine Makros → null', () => {
    expect(calcIngredientMacros({ name: 'Salz', amount: 1, unit: 'TL' })).toBeNull();
  });

  it('Stk ohne grammEquivalent → null (kein Default)', () => {
    expect(calcIngredientMacros({ name: 'X', amount: 1, unit: 'Stk', kcal100: 100, p100: 5, c100: 10, f100: 2 })).toBeNull();
  });

  it('Stk mit explizitem grammEquivalent → berechnet', () => {
    const r = calcIngredientMacros({ name: 'Ei', amount: 1, unit: 'Stk', grammEquivalent: 55, kcal100: 143, p100: 12, c100: 1, f100: 10 });
    expect(r).toEqual({ kcal: 79, p: 6.6, c: 0.6, f: 5.5, gramm: 55 });
  });
});
```

---

- [ ] **Schritt 3: Test laufen lassen — Fehler bestätigen**

```
npm.cmd test tests/unit/calc/recipeTracking.test.js
```

Erwartet: 6 Fails (neue Tests) + 7 Pass (bestehende)

---

- [ ] **Schritt 4: `UNIT_GRAM_DEFAULTS` und `calcIngredientMacros` implementieren**

`js/calc/recipeTracking.js` komplett ersetzen:

```javascript
export const UNIT_GRAM_DEFAULTS = {
  'ml':      1.0,
  'EL':      15,
  'TL':       5,
  'Stk':     null,
  'Packung': null,
  'Scheibe': 25,
  'Dose':    400,
  'Portion': null,
};

/**
 * Berechnet Makros einer einzelnen Zutat.
 * Gibt null zurück wenn Makros oder Gramm-Äquivalent fehlen.
 */
export function calcIngredientMacros(ingredient) {
  const { amount, unit, kcal100, p100, c100, f100, grammEquivalent } = ingredient;
  if (kcal100 == null) return null;

  let gramm;
  if (unit === 'g') {
    gramm = amount;
  } else if (unit === 'ml') {
    gramm = amount * 1.0;
  } else {
    const equiv = grammEquivalent ?? UNIT_GRAM_DEFAULTS[unit] ?? null;
    if (equiv == null) return null;
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

/**
 * Skaliert Rezept-Makros auf eine gegebene Portionszahl.
 */
export function scaleRecipeMacros(recipe, portions) {
  const factor = portions / (recipe.servings ?? 1);
  return {
    kcal: Math.round(recipe.kcal * factor),
    p:    Math.round(recipe.protein * factor * 10) / 10,
    c:    Math.round(recipe.carbs   * factor * 10) / 10,
    f:    Math.round(recipe.fat     * factor * 10) / 10,
  };
}
```

---

- [ ] **Schritt 5: Tests für calcIngredientMacros grün**

```
npm.cmd test tests/unit/calc/recipeTracking.test.js
```

Erwartet: 13 Pass (7 alt + 6 neu)

---

- [ ] **Schritt 6: Failing Tests für calcRecipeMacrosFromIngredients schreiben**

Nach dem `calcIngredientMacros` describe-Block:

```javascript
describe('calcRecipeMacrosFromIngredients', () => {
  const ingMit = { name: 'A', amount: 100, unit: 'g', kcal100: 100, p100: 10, c100: 20, f100: 5 };
  const ingOhne = { name: 'Salz', amount: 5, unit: 'g' };

  it('alle mit Makros → vollständige Summe, missingCount 0', () => {
    const r = calcRecipeMacrosFromIngredients([
      { name: 'A', amount: 100, unit: 'g', kcal100: 100, p100: 10, c100: 20, f100: 5 },
      { name: 'B', amount: 200, unit: 'g', kcal100: 50,  p100: 5,  c100: 10, f100: 2 },
    ]);
    expect(r.kcal).toBe(200);        // 100 + 100
    expect(r.protein).toBe(20.0);   // 10 + 10
    expect(r.carbs).toBe(40.0);     // 20 + 20
    expect(r.fat).toBe(9.0);        // 5 + 4
    expect(r.totalGramm).toBe(300);
    expect(r.missingCount).toBe(0);
  });

  it('Mischung mit/ohne Makros → missingCount > 0', () => {
    const r = calcRecipeMacrosFromIngredients([ingMit, ingOhne]);
    expect(r.kcal).toBe(100);
    expect(r.missingCount).toBe(1);
    expect(r.totalGramm).toBe(100);
  });

  it('keine Zutat mit Makros → null', () => {
    expect(calcRecipeMacrosFromIngredients([ingOhne, ingOhne])).toBeNull();
  });

  it('leeres Array → null', () => {
    expect(calcRecipeMacrosFromIngredients([])).toBeNull();
  });
});
```

---

- [ ] **Schritt 7: `calcRecipeMacrosFromIngredients` implementieren**

Nach `calcIngredientMacros` in `js/calc/recipeTracking.js` einfügen:

```javascript
/**
 * Summiert Makros aller Zutaten mit bekannten Makros.
 * Gibt null zurück wenn keine Zutat Makros hat.
 */
export function calcRecipeMacrosFromIngredients(ingredients) {
  let kcal = 0, protein = 0, carbs = 0, fat = 0, totalGramm = 0;
  let countWith = 0, countWithout = 0;

  for (const ing of ingredients) {
    const m = calcIngredientMacros(ing);
    if (m == null) {
      countWithout++;
    } else {
      kcal       += m.kcal;
      protein    += m.p;
      carbs      += m.c;
      fat        += m.f;
      totalGramm += m.gramm;
      countWith++;
    }
  }

  if (countWith === 0) return null;

  return {
    kcal:         Math.round(kcal),
    protein:      Math.round(protein * 10) / 10,
    carbs:        Math.round(carbs   * 10) / 10,
    fat:          Math.round(fat     * 10) / 10,
    totalGramm:   Math.round(totalGramm),
    missingCount: countWithout,
  };
}
```

---

- [ ] **Schritt 8: calcRecipeMacrosFromIngredients-Tests grün**

```
npm.cmd test tests/unit/calc/recipeTracking.test.js
```

Erwartet: 17 Pass

---

- [ ] **Schritt 9: Failing Tests für getRecipeMacros schreiben**

```javascript
describe('getRecipeMacros', () => {
  it('Legacy-Rezept (kein macroMode) → recipe.kcal etc., totalGramm null', () => {
    const r = getRecipeMacros({ kcal: 400, protein: 30, carbs: 50, fat: 10 });
    expect(r).toEqual({ kcal: 400, protein: 30, carbs: 50, fat: 10, totalGramm: null, missingCount: 0 });
  });

  it('macroMode manual → recipe.kcal etc.', () => {
    const r = getRecipeMacros({ kcal: 300, protein: 25, carbs: 40, fat: 8, macroMode: 'manual' });
    expect(r.kcal).toBe(300);
    expect(r.totalGramm).toBeNull();
  });

  it('macroMode ingredients mit Zutaten-Makros → Berechnung', () => {
    const recipe = {
      macroMode: 'ingredients',
      kcal: 0, protein: 0, carbs: 0, fat: 0,
      ingredients: [
        { name: 'A', amount: 100, unit: 'g', kcal100: 100, p100: 10, c100: 20, f100: 5 },
      ],
    };
    const r = getRecipeMacros(recipe);
    expect(r.kcal).toBe(100);
    expect(r.protein).toBe(10);
    expect(r.totalGramm).toBe(100);
    expect(r.missingCount).toBe(0);
  });

  it('macroMode ingredients ohne Zutaten-Makros → Fallback auf recipe.kcal', () => {
    const recipe = {
      macroMode: 'ingredients',
      kcal: 250, protein: 20, carbs: 30, fat: 7,
      ingredients: [{ name: 'Salz', amount: 5, unit: 'g' }],
    };
    const r = getRecipeMacros(recipe);
    expect(r.kcal).toBe(250);
    expect(r.totalGramm).toBeNull();
  });
});
```

---

- [ ] **Schritt 10: `getRecipeMacros` implementieren**

```javascript
/**
 * Liefert effektive Makros eines Rezepts.
 * Abstrahiert über macroMode — Aufrufer muss macroMode nicht kennen.
 */
export function getRecipeMacros(recipe) {
  if (recipe.macroMode === 'ingredients') {
    const calc = calcRecipeMacrosFromIngredients(recipe.ingredients ?? []);
    if (calc) return calc;
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

---

- [ ] **Schritt 11: Failing Tests für aktualisiertes scaleRecipeMacros schreiben**

```javascript
describe('scaleRecipeMacros — grammPerPortion', () => {
  it('Legacy-Rezept → grammPerPortion null', () => {
    const r = scaleRecipeMacros({ kcal: 400, protein: 40, carbs: 30, fat: 10, servings: 1 }, 1);
    expect(r.grammPerPortion).toBeNull();
  });

  it('ingredients-Rezept → grammPerPortion berechnet', () => {
    const recipe = {
      macroMode: 'ingredients',
      servings: 2,
      kcal: 0, protein: 0, carbs: 0, fat: 0,
      ingredients: [
        { name: 'A', amount: 200, unit: 'g', kcal100: 100, p100: 10, c100: 20, f100: 5 },
      ],
    };
    // totalGramm = 200, servings = 2 → grammPerPortion = 100 pro Portion
    const r = scaleRecipeMacros(recipe, 1);
    expect(r.grammPerPortion).toBe(100);

    const r2 = scaleRecipeMacros(recipe, 2);
    expect(r2.grammPerPortion).toBe(200);
  });
});
```

---

- [ ] **Schritt 12: `scaleRecipeMacros` auf `getRecipeMacros` umstellen**

```javascript
/**
 * Skaliert Rezept-Makros auf eine gegebene Portionszahl.
 * Bestehende Aufrufer sind kompatibel (additiv: grammPerPortion ist neues Feld).
 */
export function scaleRecipeMacros(recipe, portions) {
  const macros = getRecipeMacros(recipe);
  const factor = portions / (recipe.servings ?? 1);
  return {
    kcal: Math.round(macros.kcal    * factor),
    p:    Math.round(macros.protein * factor * 10) / 10,
    c:    Math.round(macros.carbs   * factor * 10) / 10,
    f:    Math.round(macros.fat     * factor * 10) / 10,
    grammPerPortion: macros.totalGramm != null
      ? Math.round(macros.totalGramm / (recipe.servings ?? 1) * portions)
      : null,
  };
}
```

**Achtung:** Die bestehenden 7 Tests prüfen `r.kcal`, `r.p`, `r.c`, `r.f` — sie prüfen `grammPerPortion` **nicht**. Die Rückgabe ist additiv — alle 7 Tests bleiben grün.

---

- [ ] **Schritt 13: Alle Tests grün**

```
npm.cmd test
```

Erwartet: 252 + ~18 = ~270 Tests, alle grün.

---

- [ ] **Schritt 14: Commit**

```bash
git add js/calc/recipeTracking.js tests/unit/calc/recipeTracking.test.js
git commit -m "feat: calcIngredientMacros, calcRecipeMacrosFromIngredients, getRecipeMacros, scaleRecipeMacros+grammPerPortion"
```

---

## Task 2: RecipeToTrackerModal — gramm aus grammPerPortion

**Files:**
- Modify: `js/tabs/rezepte/RecipeToTrackerModal.js`

`scaleRecipeMacros` gibt jetzt `grammPerPortion` zurück. Die einzige Änderung: `gramm: 100` wird zu `gramm: scaled.grammPerPortion ?? 100`.

---

- [ ] **Schritt 1: Datei lesen**

```
Read: js/tabs/rezepte/RecipeToTrackerModal.js
```

---

- [ ] **Schritt 2: gramm-Zeile ändern**

In `handleSave()`, Zeile:
```javascript
      gramm: 100,
```
ersetzen durch:
```javascript
      gramm: scaled.grammPerPortion ?? 100,
```

Den Kommentar darüber anpassen:
```javascript
      // gramm: echtes Portionsgewicht wenn aus Zutaten berechenbar, sonst 100g-Platzhalter.
```

---

- [ ] **Schritt 3: Tests laufen lassen**

```
npm.cmd test
```

Alle Tests müssen grün bleiben (keine neuen Tests — Komponente nicht unit-testbar).

---

- [ ] **Schritt 4: Commit**

```bash
git add js/tabs/rezepte/RecipeToTrackerModal.js
git commit -m "feat: RecipeToTrackerModal nutzt grammPerPortion aus Zutaten-Berechnung"
```

---

## Task 3: RecipeCard — ⚡ Icon für berechnete Makros

**Files:**
- Modify: `js/tabs/rezepte/RecipeCard.js`

Kleine visuelle Änderung: Wenn `recipe.macroMode === 'ingredients'`, wird ein `⚡` neben den Makros angezeigt.

---

- [ ] **Schritt 1: Datei lesen**

```
Read: js/tabs/rezepte/RecipeCard.js
```

---

- [ ] **Schritt 2: ⚡ Icon in collapsed Header einfügen**

Im collapsed Header, wo `recipe.protein` und `recipe.kcal` angezeigt werden (Zeile ~20):
```javascript
        <div style=${{ textAlign: 'right' }}>
          <div style=${{ fontSize: '13px', fontWeight: 700, color: COLORS.gold }}>${recipe.protein}g P</div>
          <div style=${{ fontSize: '12px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>${recipe.kcal} kcal</div>
        </div>
```

Ersetzen durch:
```javascript
        <div style=${{ textAlign: 'right' }}>
          <div style=${{ fontSize: '13px', fontWeight: 700, color: COLORS.gold }}>
            ${recipe.protein}g P
            ${recipe.macroMode === 'ingredients' ? html`<span title="Makros aus Zutaten berechnet" style=${{ fontSize: '10px', marginLeft: '4px', opacity: 0.7 }}>⚡</span>` : null}
          </div>
          <div style=${{ fontSize: '12px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>${recipe.kcal} kcal</div>
        </div>
```

---

- [ ] **Schritt 3: Tests laufen lassen**

```
npm.cmd test
```

---

- [ ] **Schritt 4: Commit**

```bash
git add js/tabs/rezepte/RecipeCard.js
git commit -m "feat: RecipeCard zeigt ⚡ Icon wenn Makros aus Zutaten berechnet"
```

---

## Task 4: RecipeEditor — Makro-Abschnitt pro Zutat + macroMode-Toggle

**Files:**
- Modify: `js/tabs/rezepte/RecipeEditor.js`
- Modify: `js/tabs/rezepte/RezepteTab.js`

Das ist die größte Änderung. Lies beide Dateien vollständig bevor du anfängst.

### Überblick der Änderungen an RecipeEditor

1. **Neue Imports:** `calcRecipeMacrosFromIngredients` aus `../../calc/recipeTracking.js`, `useMemo` aus `../../lib.js`, `FavoritePicker` aus `../tracker/FavoritePicker.js`, `OFFSearchPanel` aus `../tracker/OFFSearchPanel.js`
2. **Neues Prop:** `favorites` (Array, default `[]`)
3. **`initForm` erweitern:** `macroMode: recipe?.macroMode ?? 'manual'` + Ingredient-Felder beibehalten (der Spread `...i` reicht bereits)
4. **Neuer State:** `expandedIngMacros` — `useState({})` (Index → boolean-Map)
5. **Neuer berechneter Wert:** `computedMacros` per `useMemo` aus `calcRecipeMacrosFromIngredients`
6. **`validate()` anpassen:** Makro-Felder nur prüfen wenn `macroMode === 'manual'`
7. **`handleSave()` erweitern:** Ingredient-Felder retten, `macroMode` mitschreiben, Snapshot-Makros bei `'ingredients'`
8. **Neue UI-Abschnitte:** Per-Zutat Makro-Toggle + Makro-Inputs, Gesamt-Makros-Anzeige unter Zutaten

---

- [ ] **Schritt 1: Beide Dateien lesen**

```
Read: js/tabs/rezepte/RecipeEditor.js
Read: js/tabs/rezepte/RezepteTab.js
```

---

- [ ] **Schritt 2: Imports erweitern**

Am Anfang von `RecipeEditor.js`:
```javascript
import { html, useState, useEffect, useMemo } from '../../lib.js';
import { Modal } from '../../ui/Modal.js';
import { RECIPE_MEAL_SLOTS, INGREDIENT_UNIT_SUGGESTIONS } from '../../data/mealSlots.js';
import { COLORS, FONTS, S } from '../../ui/theme.js';
import { calcRecipeMacrosFromIngredients } from '../../calc/recipeTracking.js';
import { FavoritePicker } from '../tracker/FavoritePicker.js';
import { OFFSearchPanel } from '../tracker/OFFSearchPanel.js';
```

---

- [ ] **Schritt 3: `initForm` um `macroMode` ergänzen**

In `initForm(recipe)`:
```javascript
function initForm(recipe) {
  return {
    name:        recipe?.name     ?? '',
    mealSlot:    recipe?.mealSlot ?? RECIPE_MEAL_SLOTS[0],
    prepTime:    recipe?.prepTime ?? '',
    servings:    recipe?.servings != null ? String(recipe.servings) : '1',
    kcal:        recipe?.kcal     != null ? String(recipe.kcal)    : '',
    protein:     recipe?.protein  != null ? String(recipe.protein) : '',
    carbs:       recipe?.carbs    != null ? String(recipe.carbs)   : '',
    fat:         recipe?.fat      != null ? String(recipe.fat)     : '',
    tip:         recipe?.tip      ?? '',
    macroMode:   recipe?.macroMode ?? 'manual',
    ingredients: recipe?.ingredients?.length > 0
      ? recipe.ingredients.map(i => ({
          ...i,                           // bestehende + neue Felder erhalten
          amount: String(i.amount),       // amount als String für Input
          kcal100: i.kcal100 != null ? String(i.kcal100) : '',
          p100:    i.p100    != null ? String(i.p100)    : '',
          c100:    i.c100    != null ? String(i.c100)    : '',
          f100:    i.f100    != null ? String(i.f100)    : '',
          grammEquivalent: i.grammEquivalent != null ? String(i.grammEquivalent) : '',
          sourceRef: i.sourceRef ?? '',
        }))
      : [emptyIngredient()],
    steps: recipe?.steps?.length > 0
      ? [...recipe.steps]
      : [''],
  };
}
```

`emptyIngredient()` erweitern:
```javascript
function emptyIngredient() {
  return { name: '', amount: '', unit: 'g', isMain: false, kcal100: '', p100: '', c100: '', f100: '', grammEquivalent: '', sourceRef: '' };
}
```

---

- [ ] **Schritt 4: State und berechnete Werte in RecipeEditor hinzufügen**

In `export function RecipeEditor({ open, onClose, recipe, onSave, favorites = [] })`:

Nach den bestehenden States:
```javascript
  const [expandedIngMacros, setExpandedIngMacros] = useState({});
  const [ingOffSearchIdx, setIngOffSearchIdx] = useState(null);  // Index der Zutat mit offenem OFD-Panel, oder null

  // Berechnete Makros aus Zutaten (live, für Anzeige)
  const computedMacros = useMemo(() => {
    const ings = form.ingredients.map(ing => ({
      ...ing,
      amount: Number(ing.amount) || 0,
      kcal100: ing.kcal100 !== '' ? Number(ing.kcal100) : undefined,
      p100:    ing.p100    !== '' ? Number(ing.p100)    : undefined,
      c100:    ing.c100    !== '' ? Number(ing.c100)    : undefined,
      f100:    ing.f100    !== '' ? Number(ing.f100)    : undefined,
      grammEquivalent: ing.grammEquivalent !== '' ? Number(ing.grammEquivalent) : undefined,
    }));
    return calcRecipeMacrosFromIngredients(ings);
  }, [form.ingredients]);
```

`expandedIngMacros` beim Reset zurücksetzen — in `useEffect`:
```javascript
  useEffect(() => {
    if (!open) return;
    setForm(initForm(recipe));
    setErrors([]);
    setExpandedIngMacros({});
    setIngOffSearchIdx(null);
  }, [open, recipe]);
```

---

- [ ] **Schritt 5: Helper-Funktionen für expandedIngMacros und Ingredient-Makro-Felder**

```javascript
  function toggleIngMacros(i) {
    setExpandedIngMacros(prev => ({ ...prev, [i]: !prev[i] }));
  }

  function setIngMacrosFromFav(i, fav) {
    setIngredient(i, 'kcal100', String(fav.kcal100 ?? ''));
    setIngredient(i, 'p100',    String(fav.p100    ?? ''));
    setIngredient(i, 'c100',    String(fav.c100    ?? ''));
    setIngredient(i, 'f100',    String(fav.f100    ?? ''));
    setIngredient(i, 'sourceRef', fav.id ? `fav:${fav.id}` : 'manual');
  }

  function setIngMacrosFromOFF(i, product) {
    setIngredient(i, 'kcal100', String(product.kcal100 ?? ''));
    setIngredient(i, 'p100',    String(product.p100    ?? ''));
    setIngredient(i, 'c100',    String(product.c100    ?? ''));
    setIngredient(i, 'f100',    String(product.f100    ?? ''));
    setIngredient(i, 'sourceRef', product.offCode ? `off:${product.offCode}` : 'off:search');
  }
```

---

- [ ] **Schritt 6: `validate()` anpassen**

```javascript
function validate(form) {
  const errors = [];
  if (!form.name.trim())
    errors.push('Name ist Pflicht.');
  if (!RECIPE_MEAL_SLOTS.includes(form.mealSlot))
    errors.push('Ungültiger Mahlzeit-Slot.');
  // Makros nur prüfen im manuellen Modus
  if (form.macroMode === 'manual') {
    if (form.kcal === '' || isNaN(Number(form.kcal)) || Number(form.kcal) < 0)
      errors.push('kcal muss eine Zahl ≥ 0 sein.');
    if (form.protein === '' || isNaN(Number(form.protein)) || Number(form.protein) < 0)
      errors.push('Protein muss eine Zahl ≥ 0 sein.');
    if (form.carbs === '' || isNaN(Number(form.carbs)) || Number(form.carbs) < 0)
      errors.push('KH muss eine Zahl ≥ 0 sein.');
    if (form.fat === '' || isNaN(Number(form.fat)) || Number(form.fat) < 0)
      errors.push('Fett muss eine Zahl ≥ 0 sein.');
  }
  if (!form.steps.some(s => s.trim()))
    errors.push('Mindestens 1 Zubereitungsschritt ist Pflicht.');
  return errors;
}
```

---

- [ ] **Schritt 7: `handleSave()` erweitern**

```javascript
  function handleSave() {
    const errs = validate(form);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    // Snapshot-Makros: bei ingredients-Modus berechnete Werte; sonst manuelle Felder
    const snapshotKcal    = form.macroMode === 'ingredients' && computedMacros ? computedMacros.kcal     : Number(form.kcal)    || 0;
    const snapshotProtein = form.macroMode === 'ingredients' && computedMacros ? computedMacros.protein  : Number(form.protein) || 0;
    const snapshotCarbs   = form.macroMode === 'ingredients' && computedMacros ? computedMacros.carbs    : Number(form.carbs)   || 0;
    const snapshotFat     = form.macroMode === 'ingredients' && computedMacros ? computedMacros.fat      : Number(form.fat)     || 0;

    onSave({
      id:          recipe?.id ?? generateId(),
      name:        form.name.trim(),
      mealSlot:    form.mealSlot,
      prepTime:    form.prepTime.trim() || undefined,
      servings:    Number(form.servings) || 1,
      kcal:        snapshotKcal,
      protein:     snapshotProtein,
      carbs:       snapshotCarbs,
      fat:         snapshotFat,
      macroMode:   form.macroMode,
      tip:         form.tip.trim() || undefined,
      ingredients: form.ingredients
        .filter(ing => ing.name.trim())
        .map(ing => {
          const base = {
            name:   ing.name.trim(),
            amount: Number(ing.amount) || 0,
            unit:   ing.unit || 'g',
            isMain: !!ing.isMain,
          };
          // optionale Makro-Felder nur schreiben wenn gesetzt
          if (ing.kcal100 !== '') {
            base.kcal100 = Number(ing.kcal100) || 0;
            base.p100    = Number(ing.p100)    || 0;
            base.c100    = Number(ing.c100)    || 0;
            base.f100    = Number(ing.f100)    || 0;
          }
          if (ing.grammEquivalent !== '') base.grammEquivalent = Number(ing.grammEquivalent);
          if (ing.sourceRef)              base.sourceRef       = ing.sourceRef;
          return base;
        }),
      steps:     form.steps.filter(s => s.trim()).map(s => s.trim()),
      source:    'manual',
      createdAt: recipe?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    });
    onClose();
  }
```

---

- [ ] **Schritt 8: Per-Zutat Makro-Abschnitt in der JSX ergänzen**

Die Zutat-Zeile (im `form.ingredients.map((ing, i) => ...)` Block) erhält nach dem `×`-Button einen Expand-Toggle und einen aufklappbaren Makro-Abschnitt:

```javascript
      ${form.ingredients.map((ing, i) => html`
        <div key=${i} style=${{ marginBottom: expandedIngMacros[i] ? '12px' : '6px' }}>
          <!-- Zutat-Zeile (unverändert außer i wird für toggleIngMacros verwendet) -->
          <div style=${{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              style=${{ ...inp, flex: 3, minWidth: 0 }}
              value=${ing.name}
              onInput=${e => setIngredient(i, 'name', e.target.value)}
              placeholder="Zutat"
            />
            <input
              style=${{ ...inp, flex: 1, minWidth: 0, textAlign: 'right' }}
              type="number"
              min="0"
              value=${ing.amount}
              onInput=${e => setIngredient(i, 'amount', e.target.value)}
              placeholder="Menge"
            />
            <input
              style=${{ ...inp, flex: 1, minWidth: 0 }}
              list=${UNIT_LIST_ID}
              value=${ing.unit}
              onInput=${e => setIngredient(i, 'unit', e.target.value)}
            />
            <input
              type="checkbox"
              checked=${ing.isMain}
              onChange=${e => setIngredient(i, 'isMain', e.target.checked)}
              title="Hauptzutat"
              style=${{ accentColor: COLORS.gold, width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
            />
            <button
              onClick=${() => toggleIngMacros(i)}
              title=${expandedIngMacros[i] ? 'Makros ausblenden' : 'Makros eingeben'}
              style=${{
                background: 'none', border: `1px solid ${ing.kcal100 ? COLORS.gold : '#333'}`,
                borderRadius: '4px', color: ing.kcal100 ? COLORS.gold : COLORS.textMuted,
                cursor: 'pointer', fontSize: '10px', padding: '2px 5px', flexShrink: 0, fontFamily: FONTS.mono,
              }}
            >${expandedIngMacros[i] ? '−M' : '+M'}</button>
            <button onClick=${() => removeIngredient(i)} style=${removeBtnStyle}>×</button>
          </div>

          <!-- Aufklappbarer Makro-Abschnitt -->
          ${expandedIngMacros[i] && html`
            <div style=${{
              background: '#141414', border: '1px solid #2a2a2a', borderRadius: '8px',
              padding: '10px', marginTop: '6px',
            }}>
              <!-- Favoriten-Picker -->
              <div style=${{ marginBottom: '8px' }}>
                <label style=${{ ...S.label, fontSize: '10px', marginBottom: '4px' }}>Makros aus Favoriten übernehmen</label>
                <${FavoritePicker} favorites=${favorites} onSelect=${fav => setIngMacrosFromFav(i, fav)} />
              </div>

              <!-- OFD-Suche (Toggle, damit Panel nicht in jeder Zeile immer offen ist) -->
              <div style=${{ marginBottom: '8px' }}>
                <button
                  onClick=${() => setIngOffSearchIdx(ingOffSearchIdx === i ? null : i)}
                  style=${{
                    ...S.btn(ingOffSearchIdx === i ? COLORS.gold : '#1e1e1e',
                             ingOffSearchIdx === i ? '#111' : COLORS.textMuted),
                    fontSize: '11px', marginBottom: '6px',
                  }}
                >🔍 OFD Suche ${ingOffSearchIdx === i ? '(schließen)' : ''}</button>
                ${ingOffSearchIdx === i && html`
                  <${OFFSearchPanel}
                    onSelect=${product => { setIngMacrosFromOFF(i, product); setIngOffSearchIdx(null); }}
                    onClose=${() => setIngOffSearchIdx(null)}
                  />
                `}
              </div>

              <!-- Manuelle Makro-Eingabe -->
              <label style=${{ ...S.label, fontSize: '10px' }}>Makros pro 100g (manuell)</label>
              <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
                ${[['kcal100','kcal'],['p100','P g'],['c100','KH g'],['f100','F g']].map(([key, lbl]) => html`
                  <div key=${key}>
                    <label style=${{ ...S.label, fontSize: '9px' }}>${lbl}</label>
                    <input
                      type="number" min="0" step="0.1"
                      value=${ing[key]}
                      onInput=${e => setIngredient(i, key, e.target.value)}
                      style=${{ ...inp, textAlign: 'center', padding: '6px 4px' }}
                      placeholder="0"
                    />
                  </div>
                `)}
              </div>

              <!-- Gramm-Äquivalent (nur bei non-g Einheiten) -->
              ${ing.unit && ing.unit !== 'g' && html`
                <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style=${{ ...S.label, fontSize: '10px', margin: 0, whiteSpace: 'nowrap' }}>
                    1 ${ing.unit} = 
                  </label>
                  <input
                    type="number" min="0" step="1"
                    value=${ing.grammEquivalent}
                    onInput=${e => setIngredient(i, 'grammEquivalent', e.target.value)}
                    placeholder="g"
                    style=${{ ...inp, width: '70px', textAlign: 'right', padding: '6px 8px' }}
                  />
                  <span style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>g</span>
                </div>
              `}

              ${ing.sourceRef && html`
                <div style=${{ fontSize: '10px', color: COLORS.textSubtle, fontFamily: FONTS.mono, marginTop: '6px' }}>
                  Quelle: ${ing.sourceRef}
                </div>
              `}
            </div>
          `}
        </div>
      `)}
```

---

- [ ] **Schritt 9: Gesamt-Makros-Anzeige unter den Zutaten**

Nach dem `<button onClick=${addIngredient} ...>+ Zutat hinzufügen</button>` und **vor** dem Schritte-Abschnitt:

```javascript
      <!-- Makros Gesamt -->
      <div style=${{ ...S.cardTitle, marginBottom: '8px', marginTop: '4px' }}>
        Makros (gesamt)
        ${computedMacros ? html`<span style=${{ fontWeight: 400, color: COLORS.textMuted, fontSize: '11px', marginLeft: '8px' }}>⚡ aus Zutaten</span>` : null}
      </div>

      ${computedMacros && html`
        <div style=${{
          background: '#1a1a12', border: `1px solid ${COLORS.gold}33`,
          borderRadius: '8px', padding: '8px 12px', marginBottom: '10px',
          fontFamily: FONTS.mono, fontSize: '12px', color: COLORS.text,
        }}>
          ${computedMacros.kcal} kcal · ${computedMacros.protein}g P · ${computedMacros.carbs}g KH · ${computedMacros.fat}g F
          ${computedMacros.missingCount > 0 && html`
            <div style=${{ fontSize: '11px', color: '#c8a830', marginTop: '4px' }}>
              ⚠ ${computedMacros.missingCount} Zutat(en) ohne Makros — Summe unvollständig
            </div>
          `}
        </div>

        <!-- macroMode-Toggle -->
        <div style=${{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick=${() => set('macroMode', 'ingredients')}
            style=${{
              ...S.btn(form.macroMode === 'ingredients' ? COLORS.gold : '#1e1e1e',
                       form.macroMode === 'ingredients' ? '#111' : COLORS.textMuted),
              flex: 1, fontSize: '11px',
            }}
          >⚡ Berechnet aus Zutaten</button>
          <button
            onClick=${() => {
              // Beim Wechsel auf manuell: berechnete Werte als Startwert vorbelegen
              if (form.macroMode === 'ingredients' && computedMacros) {
                set('kcal',    String(computedMacros.kcal));
                set('protein', String(computedMacros.protein));
                set('carbs',   String(computedMacros.carbs));
                set('fat',     String(computedMacros.fat));
              }
              set('macroMode', 'manual');
            }}
            style=${{
              ...S.btn(form.macroMode === 'manual' ? '#3a2a1a' : '#1e1e1e',
                       form.macroMode === 'manual' ? '#c8a830' : COLORS.textMuted),
              flex: 1, fontSize: '11px', border: form.macroMode === 'manual' ? `1px solid #c8a830` : undefined,
            }}
          >✏ Manuell</button>
        </div>
      `}

      <!-- Makro-Eingabefelder (immer sichtbar wenn kein computedMacros, sonst nur im manual Modus) -->
      ${(!computedMacros || form.macroMode === 'manual') && html`
        <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
          ${[['kcal','kcal'],['protein','Protein g'],['carbs','KH g'],['fat','Fett g']].map(([key, lbl]) => html`
            <div key=${key}>
              <label style=${{ ...S.label, fontSize: '9px' }}>${lbl}</label>
              <input
                style=${{ ...inp, textAlign: 'center' }}
                type="number"
                min="0"
                value=${form[key]}
                onInput=${e => set(key, e.target.value)}
                placeholder="0"
              />
            </div>
          `)}
        </div>
      `}
```

**Hinweis:** Den bisherigen `<!-- Makros -->` Block (mit dem `S.cardTitle` „Makros (gesamt) *") **komplett entfernen** — er wird durch diesen neuen Block ersetzt.

---

- [ ] **Schritt 10: RezepteTab.js — favorites wiring**

`RezepteTab.js` lesen. Änderungen:

1. Import hinzufügen:
```javascript
import { useFavoriteFoods } from '../../hooks/useFavoriteFoods.js';
```

2. In `RezepteTab()`:
```javascript
  const { favorites } = useFavoriteFoods();
```

3. An `RecipeEditor` übergeben:
```javascript
      <${RecipeEditor}
        open=${editorOpen}
        onClose=${() => setEditorOpen(false)}
        recipe=${editRecipe}
        onSave=${saveRecipe}
        favorites=${favorites}
      />
```

**Hinweis:** `useFavoriteFoods` hook zurückgeben — kurz lesen um sicherzustellen dass es `{ favorites }` zurückgibt.

---

- [ ] **Schritt 11: Tests laufen lassen**

```
npm.cmd test
```

Alle Tests grün.

---

- [ ] **Schritt 12: Commit**

```bash
git add js/tabs/rezepte/RecipeEditor.js js/tabs/rezepte/RezepteTab.js
git commit -m "feat: RecipeEditor Makros aus Zutaten — per-Zutat Makro-Abschnitt, Gesamt-Anzeige, macroMode-Toggle"
```

---

## Task 5: APP_VERSION 1.4.0 + abschließende Tests + PR

**Files:**
- Modify: `js/version.js`
- Modify: `service-worker.js`

---

- [ ] **Schritt 1: Beide Dateien lesen**

```
Read: js/version.js
Read: service-worker.js (nur Zeile 1-5 nötig)
```

---

- [ ] **Schritt 2: version.js bump**

```javascript
export const APP_VERSION = '1.4.0';
export const SCHEMA_VERSION = 3; // Phase 4: recipesCustom + recipePhotos
```

---

- [ ] **Schritt 3: service-worker.js bump**

Nur erste Zeile nach dem Kommentar:
```javascript
const APP_VERSION = '1.4.0';
```

---

- [ ] **Schritt 4: Alle Tests laufen lassen**

```
npm.cmd test
```

Alle Tests grün. Erwartet: ca. 270 Tests.

---

- [ ] **Schritt 5: Commit**

```bash
git add js/version.js service-worker.js
git commit -m "chore: APP_VERSION 1.4.0 (Rezept-Makros aus Zutaten)"
```

---

- [ ] **Schritt 6: PR erstellen**

```bash
gh pr create \
  --title "feat: Rezept-Makros aus Zutaten berechnen (v1.4.0)" \
  --body "## Summary
- Per-Zutat Makro-Felder im RecipeEditor (manuell, Favorit oder OFD-Suche)
- Neue Calc-Funktionen: calcIngredientMacros, calcRecipeMacrosFromIngredients, getRecipeMacros
- scaleRecipeMacros gibt jetzt grammPerPortion zurück — kein 100g-Platzhalter mehr bei bekanntem Gewicht
- macroMode-Toggle: berechnete Makros oder manueller Override
- RecipeCard zeigt ⚡ Icon bei berechneten Makros
- Vollständige Legacy-Kompatibilität (bestehende Rezepte unverändert)
- SCHEMA_VERSION bleibt 3

## Dateien
- js/calc/recipeTracking.js
- tests/unit/calc/recipeTracking.test.js (~18 neue Tests)
- js/tabs/rezepte/RecipeEditor.js
- js/tabs/rezepte/RezepteTab.js
- js/tabs/rezepte/RecipeToTrackerModal.js
- js/tabs/rezepte/RecipeCard.js
- js/version.js + service-worker.js

## Test plan
- [ ] npm.cmd test → alle grün
- [ ] Neues Rezept anlegen → Zutaten mit Makros → Live-Summe erscheint
- [ ] macroMode-Toggle wechseln → manuelle Felder erscheinen/verschwinden
- [ ] Rezept speichern (ingredients-Modus) → kcal/protein etc. als Snapshot geschrieben
- [ ] Bestehendes Initialrezept → unverändert, kein ⚡ Icon
- [ ] Tracker-Übernahme → gramm korrekt (grammPerPortion)"
```

---

## Abgrenzung (nicht in diesem Plan)

- Barcode-Scan aus Zutat-Zeile — Folge-Feature
- Zutaten-Auto-Vervollständigung aus Favoriten-Namen — Folge-Feature  
- Initialrezepte mit Zutaten-Makros befüllen — separates Datenpaket
- Vollständiges Einheitensystem (Stk mit Gewicht, Flüssig-Dichte) — Folge-Feature
- Supabase-Integration — Phase 5

---

*Erstellt: 2026-06-09 · Basis: docs/superpowers/specs/2026-06-09-rezept-makros-aus-zutaten.md · Ziel: APP_VERSION 1.4.0*
