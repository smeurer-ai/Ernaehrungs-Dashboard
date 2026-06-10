# Rezept-Zutaten als Lebensmittel suchen — Makro-Eingabe vereinfachen — Design-Spec

**Datum:** 2026-06-10  
**Status:** Spec · noch nicht implementiert  
**Ziel-APP_VERSION nach Umsetzung:** 1.5.0  
**SCHEMA_VERSION:** 3 (unverändert — Datenmodell bleibt komplett gleich)

---

## Ziel

Die Eingabe von Zutaten-Makros im RecipeEditor wird radikal vereinfacht: **Statt Makros pro Zutat nachzutragen, wird die Zutat direkt als Lebensmittel gesucht** (Favoriten sofort, OFD auf Wunsch) — ein Tipp auf den Treffer übernimmt Name + Makros + Quelle in einem Schritt. Zusätzlich werden drei bekannte Bugs/UX-Fallen behoben.

---

## Probleme heute (v1.4.x)

| # | Problem | Art |
|---|---|---|
| P1 | **Manuell-Modus springt zurück:** Wählt die Nutzerin bei einem neuen Rezept bewusst „Manuell" und ändert danach eine Zutat, schaltet der `useEffect` (RecipeEditor.js, Auto-Switch) den Modus wieder auf „Berechnet aus Zutaten" — die manuelle Wahl wird überschrieben. | Bug |
| P2 | **Zutaten fallen stillschweigend aus der Summe:** Eine Zutat zählt nur mit, wenn alle vier Makro-Felder gesetzt sind UND (bei Stk/Packung/Portion) ein Gramm-Äquivalent existiert. Die Warnung nennt nur eine Anzahl („2 Zutaten ohne Makros"), nicht welche Zutat und nicht warum. | UX |
| P3 | **Zu viele Schritte pro Zutat:** `+M` aufklappen → Favorit suchen ODER OFD-Panel öffnen ODER vier Zahlen tippen → ggf. Gramm-Äquivalent. Bei 6 Zutaten sehr mühsam, alles in verschachtelten Panels. | UX |
| P4 | **OFD-Produkte mit Lücken:** `setIngMacrosFromOFF` schreibt `?? ''` — fehlt z.B. `c100` beim OFD-Produkt, bleibt das Feld leer und die ganze Zutat fällt wegen der Alle-vier-Felder-Regel aus der Summe (stillschweigend, siehe P2). | Bug |

---

## Scope

| Feature | In diesem Feature | Bewusst raus |
|---|---|---|
| Zutat-Suchfeld mit Sofort-Vorschlägen aus Favoriten | ✅ | |
| OFD-Suche pro Zutat (bestehendes Panel, ein Knopf) | ✅ | |
| Status-/Makro-Zeile pro Zutat mit konkretem Grund bei Problemen | ✅ | |
| Gramm-Äquivalent-Feld direkt in der Zeile (bei Stk/Packung/…) | ✅ | |
| Bugfix P1: Auto-Switch respektiert explizite Modus-Wahl | ✅ | |
| Bugfix P4: OFD/Favoriten-Übernahme füllt fehlende Werte mit 0 | ✅ | |
| Neue pure Funktion `ingredientMacroStatus` (testbar) | ✅ | |
| Zutaten-Gedächtnis über Rezepte hinweg (eigener Store) | ❌ Folge-Feature | |
| Vollständiges Einheiten-/Portionssystem | ❌ Folge-Feature | |
| Initialrezepte mit Zutaten-Makros befüllen | ❌ separates Datenpaket | |

---

## Datenmodell

**Unverändert.** `RecipeIngredient` behält exakt das Shape aus v1.4.0 (`name, amount, unit, isMain, kcal100?, p100?, c100?, f100?, grammEquivalent?, sourceRef?`). Kein neuer Store, kein Index, SCHEMA_VERSION bleibt 3.

Die bindende Regel „Zutaten-Makros nur speichern wenn alle vier Felder gesetzt" bleibt bestehen — sie wird aber durch die UI praktisch immer erfüllt, weil Favoriten-/OFD-Übernahme alle vier Felder garantiert füllt (fehlende Werte → `0`, siehe P4-Fix).

---

## UI-Redesign RecipeEditor

### Zutat-Zeile: Suchfeld statt Freitext + verstecktem Panel

```
┌──────────────────────────────────────────────────────────┐
│ [Magerquark____________🔍] [200] [g▼] [●] [×]            │
│   ▼ Vorschläge (während Tippen, max 5):                  │
│     ★ Magerquark (Favorit)          67 kcal/100g         │
│     ★ Quark 40% (Favorit)          143 kcal/100g         │
│     🌐 In Open Food Facts suchen…                        │
│ → 134 kcal · 22,4g P · 8,2g KH · 0,6g F   [✏ Details]   │
└──────────────────────────────────────────────────────────┘
```

**Verhalten:**
- Das Namensfeld ist zugleich Suchfeld. Ab 2 Zeichen erscheinen darunter max. 5 Favoriten-Treffer (`filterFavorites` aus `js/calc/favorites.js` — existiert bereits) plus der Eintrag „🌐 In Open Food Facts suchen…".
- **Tipp auf Favorit:** Name, kcal100/p100/c100/f100 (fehlende → `0`) und `sourceRef: 'fav:<id>'` werden gesetzt. Vorschläge schließen.
- **Tipp auf OFD-Eintrag:** bestehendes `OFFSearchPanel` öffnet sich (wie heute), Auswahl setzt Makros (fehlende → `0`) + `sourceRef: 'off:<barcode>'`.
- **Freitext ohne Auswahl** bleibt erlaubt — Zutat ohne Makros (Salz, Gewürze). Kein Zwang.
- Vorschläge erscheinen nur solange das Feld fokussiert ist; Auswahl per Tipp (mobile-first).

### Status-Zeile pro Zutat (ersetzt die anonyme Sammel-Warnung)

Unter jeder Zutat-Zeile steht genau einer dieser Zustände:

| Zustand | Anzeige |
|---|---|
| Makros berechenbar | `→ 134 kcal · 22,4g P · 8,2g KH · 0,6g F` (gedämpft, mono) |
| Keine Makros hinterlegt | `· ohne Makros` (neutral, kein Alarm — für Gewürze normal) |
| Makros da, Gramm-Äquivalent fehlt | `⚠ zählt nicht mit: bitte angeben, wieviel Gramm 1 Stk hat` |

Die bisherige Sammel-Warnung „X Zutat(en) ohne Makros" in der Gesamt-Box bleibt als Zusammenfassung, ist aber dank der Zeilen-Status nun nachvollziehbar.

### Gramm-Äquivalent direkt in der Zeile

Wenn die Einheit nicht `g`/`ml` ist **und** die Zutat Makros hat, erscheint das Feld `1 Stk = [__] g` direkt unter der Zeile (nicht mehr im aufklappbaren Panel). Bei Einheiten mit Default (EL/TL/Scheibe/Dose) ist es mit dem Default vorbelegt und änderbar — so sieht die Nutzerin erstmals, mit welchem Wert gerechnet wird.

### „Details"-Knopf (ersetzt `+M`)

Der bisherige `+M`-Bereich schrumpft auf einen `✏ Details`-Knopf in der Status-Zeile: aufgeklappt zeigt er die vier Makro-Felder (pro 100g) zum manuellen Eingeben/Korrigieren plus die Quelle (`sourceRef`). FavoritePicker und OFD-Knopf wandern aus dem Panel ins Suchfeld (siehe oben) — das Panel wird dadurch deutlich kleiner.

### Bugfix P1 — Auto-Switch respektiert Nutzer-Wahl

Neuer Form-State `macroModeChosenByUser: boolean` (nur im Editor-State, nicht persistiert):
- Klick auf „⚡ Berechnet aus Zutaten" oder „✏ Manuell" → `true`.
- Der Auto-Switch-`useEffect` läuft nur, wenn `macroModeChosenByUser === false` **und** `!recipe?.macroMode` (wie bisher: nie bei bestehenden Rezepten mit gespeichertem Modus).
- Damit gilt: Automatik nur als Erstvorschlag, nie gegen eine bewusste Entscheidung.

### Bugfix P4 — Übernahme füllt mit 0 statt leer

`setIngMacrosFromFav` und `setIngMacrosFromOFF`: `String(x ?? '')` → `String(x ?? 0)`. Eine aus Favorit/OFD übernommene Zutat hat danach **immer** alle vier Felder → zählt immer mit.

---

## Neue pure Funktion (testbar)

```javascript
// js/calc/recipeTracking.js

/**
 * Beschreibt, warum eine Zutat (nicht) in die Makro-Summe eingeht.
 * @returns {{ status: 'ok'|'no-macros'|'missing-gram-equivalent', macros: object|null }}
 */
export function ingredientMacroStatus(ingredient) {
  const hasMacros = ingredient.kcal100 != null && ingredient.p100 != null
                 && ingredient.c100   != null && ingredient.f100 != null;
  if (!hasMacros) return { status: 'no-macros', macros: null };

  const macros = calcIngredientMacros(ingredient);
  if (macros == null) return { status: 'missing-gram-equivalent', macros: null };
  return { status: 'ok', macros };
}
```

Die Status-Zeile im Editor rendert ausschließlich auf Basis dieser Funktion — keine doppelte Logik in der Komponente.

---

## Geänderte Dateien (Übersicht)

| Datei | Änderung |
|---|---|
| `js/calc/recipeTracking.js` | + `ingredientMacroStatus` (rein additiv) |
| `js/tabs/rezepte/RecipeEditor.js` | Zutat-Suchfeld mit Favoriten-Vorschlägen; Status-Zeile; Gramm-Äquivalent inline; Details-Panel verschlankt; P1- und P4-Fix |
| `tests/unit/calc/recipeTracking.test.js` | + Tests für `ingredientMacroStatus` (3 Status-Fälle, Defaults, Override) |
| `js/version.js` + `service-worker.js` | APP_VERSION → 1.5.0 (synchron) |

**Nicht geändert:** Datenmodell, Storage, Export/Import, `calcIngredientMacros`/`calcRecipeMacrosFromIngredients`/`getRecipeMacros`/`scaleRecipeMacros`, RecipeCard, RecipeToTrackerModal, Initialrezepte.

---

## Tests

```javascript
// ingredientMacroStatus
{ name: 'Salz', amount: 1, unit: 'TL' }                                  // → no-macros
{ name: 'Ei', amount: 2, unit: 'Stk', kcal100: 143, p100: 12, c100: 1, f100: 10 }
                                                                          // → missing-gram-equivalent
{ ...wie oben, grammEquivalent: 55 }                                      // → ok, macros berechnet
{ name: 'Öl', amount: 2, unit: 'EL', kcal100: 884, p100: 0, c100: 0, f100: 100 }
                                                                          // → ok (EL-Default 15g greift)
```

UI-Verhalten (Suchfeld, Auto-Switch, 0-Füllung) wird über die manuelle Mobile-Checkliste geprüft — wie bei den bisherigen Editor-Features.

### Manuelle Checkliste (Mobile-Test nach Implementierung)

1. Neues Rezept → „Quark" tippen → Favorit antippen → Makros gefüllt, Status-Zeile zeigt Berechnung
2. Zutat „Salz, 1 TL" ohne Auswahl → Status „ohne Makros", Summe trotzdem da
3. Zutat „Ei, 2 Stk" mit Makros → Warnung „zählt nicht mit" → `1 Stk = 55 g` eingeben → zählt mit
4. „Manuell" wählen, danach Zutat-Menge ändern → Modus bleibt Manuell (P1)
5. OFD-Produkt mit Makro-Lücke übernehmen → alle vier Felder gefüllt (0 statt leer), zählt mit (P4)
6. Bestehendes v1.4-Rezept öffnen/speichern → Werte unverändert (Abwärtskompatibilität)

---

## Offene Fragen (für Implementierung klären)

1. **Vorschlags-Dropdown vs. FavoritePicker:** Eigene schlanke Dropdown-Liste unter dem Namensfeld (empfohlen, da `filterFavorites` schon alles liefert) oder Wiederverwendung des FavoritePicker-Layouts?
2. **OFD-Treffer-Name übernehmen?** Wenn die Nutzerin „Quark" tippt und ein OFD-Produkt „Speisequark Magerstufe 0,2%" wählt — Produktname übernehmen (empfohlen: ja, sie kann ihn danach editieren)?

---

*Erstellt: 2026-06-10 · Status: Spec · noch nicht implementiert · APP_VERSION-Ziel: 1.5.0*
