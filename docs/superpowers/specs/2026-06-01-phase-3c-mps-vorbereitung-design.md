# Phase 3C — MPS-Vorbereitung: Design-Spec

**Datum:** 2026-06-01  
**Status:** Genehmigt, bereit zur Implementierung  
**APP_VERSION nach Umsetzung:** 1.2.3  
**SCHEMA_VERSION:** 2 (unverändert)

---

## Ziel

Den `rateMealProtein()`-Stub aus Phase 1 durch echte Logik ersetzen und pro Mahlzeit-Slot im Tracker-Tab ein kleines MPS-Badge anzeigen. Die Nutzerin sieht auf einen Blick, welche Mahlzeiten die Leucin-Schwelle wahrscheinlich erreicht haben — ohne dass neue Datenfelder gespeichert oder migriert werden müssen.

---

## Wissenschaftliche Grundlage

Aus den projektinternen Studien (NotebookLM, Notebook "Ernaehrungs-Dashboard"):

- **3 g Leucin/Mahlzeit** = bestätigte Trigger-Schwelle für ältere/postmenopausale Frauen, um die anabole Resistenz zu überwinden
- **~30–35 g Protein/Mahlzeit** entspricht bei hochwertigen tierischen Quellen ca. 3 g Leucin
- **Tierische Proteine** (Whey, Milchprodukte, Fleisch) sind leucinreicher; **pflanzliche** (Soja, Linsen) leucinärmer und schlechter bioverfügbar
- Leucin-Gramm-Angaben sind in keiner öffentlichen Lebensmitteldatenbank (inkl. Open Food Facts) verfügbar → Schätzung aus Proteinmenge ist die einzig praktikable Methode
- Gleichmäßige Verteilung über den Tag (alle 3–4 h) ist für MPS-Wirksamkeit entscheidend

---

## Scope

- Keine neue IndexedDB-Store
- Kein SCHEMA_VERSION-Bump
- Keine neuen Pflichtfelder in `TrackedFood`
- Keine Migration
- Kein Umbau des Heute-Tabs (Tagesübersicht → Phase 3E)
- Kein neues UI im FoodEntryModal

---

## 1. Calc-Logik — `js/calc/nutritionLogic.js`

### 1.1 Neue Funktion: `isMainMealSlot(slotName)`

Klassifiziert einen Mahlzeit-Slot als Haupt- oder Snack-Mahlzeit.

```js
/**
 * Gibt true zurück wenn der Slot als Hauptmahlzeit gilt.
 * Unbekannte Slots werden konservativ als Hauptmahlzeit bewertet
 * (strengere Leucin-Schwelle, sicherer für die Nutzerin).
 *
 * @param {string} slotName
 * @returns {boolean}
 */
export function isMainMealSlot(slotName) {
  const SNACK_SLOTS = new Set(['Snack', 'Casein']);
  return !SNACK_SLOTS.has(slotName);
}
```

**Klassifizierung:**

| Hauptmahlzeiten (`true`) | Snacks (`false`) |
|---|---|
| Frühstück | Snack |
| Mittagessen | Casein |
| Abendessen | |
| Pre-Workout | |
| Post-Workout | |
| Unbekannte Slots | |

**Begründung Pre-Workout als Hauptmahlzeit:** Fachlich korrekt — der Slot ist im Plan proteinrelevant. Wenn Pre-Workout-Mahlzeiten oft klein sind, ist die Warnung sinnvoll und motiviert zur richtigen Portionierung.

**Begründung konservative Unbekannte:** Lieber eine unnötige Warnung als eine ausbleibende. Rückwärtskompatibel mit alten Einträgen, die keinen Slot haben.

---

### 1.2 Aktualisierte Funktion: `rateMealProtein(mealProteinG, isMainMeal, profile)`

Ersetzt den Phase-1-Stub durch echte Schwellenlogik.

**Schwellen (aus Studiendaten):**

| Mahlzeittyp | `good` | `borderline` | `insufficient` |
|---|---|---|---|
| Hauptmahlzeit | ≥ 30 g | 20–29 g | < 20 g |
| Snack | ≥ 15 g | 10–14 g | < 10 g |

**Rückgabewerte:**

- `leucineLikelihood`: `'high'` | `'medium'` | `'low'` — spiegelt `good`/`borderline`/`insufficient`
- `rating`: `'good'` | `'borderline'` | `'insufficient'`
- `hint`: deutschsprachiger Hinweistext bei `borderline` und `insufficient`, enthält immer den Zusatz `"(Schätzung aus Proteinmenge)"`. Bei `good` → `undefined` (kein Text nötig, Badge reicht)

**Beispiel-Hints:**

```
borderline, Hauptmahlzeit, 25 g:
"Proteinmenge grenzwertig — noch ~5 g fehlen für die Leucin-Schwelle (Schätzung aus Proteinmenge)"

insufficient, Hauptmahlzeit, 12 g:
"Zu wenig Protein für MPS-Auslösung — mind. 30 g anstreben (Schätzung aus Proteinmenge)"

insufficient, Snack, 5 g:
"Zu wenig Protein — mind. 15 g für einen wirksamen Snack (Schätzung aus Proteinmenge)"
```

**Robustheit:**
- `mealProteinG` ist `null`, `undefined` oder `NaN` → gibt `insufficient`/`low` zurück, kein Crash
- `profile` wird aktuell nicht ausgewertet, bleibt aber in der Signatur für spätere Personalisierung (z.B. individuelle Schwellen bei höherem Proteinziel)

---

## 2. UI — `js/tabs/tracker/DayLogList.js`

### Badge pro Slot-Header

Pro Mahlzeit-Slot wird rechts im Header ein kleines Badge eingeblendet — **nur wenn der Slot mindestens einen Eintrag hat.**

```
┌─────────────────────────────────────────────────┐
│ 🌅 Frühstück                  ~✓ Leucin  ℹ️   │  ← good
│ ⚡ Pre-Workout                 ~⚠ Leucin  ℹ️   │  ← borderline
│ 🍽 Snack                       ~✗ Leucin  ℹ️   │  ← insufficient
│ 🌙 Casein                                       │  ← leer, kein Badge
└─────────────────────────────────────────────────┘
```

**Badge-Varianten:**

| Interner Wert | Anzeige | Farbe |
|---|---|---|
| `good` | `~✓ Leucin` | grün |
| `borderline` | `~⚠ Leucin` | orange |
| `insufficient` | `~✗ Leucin` | rot/grau |

Das `~` signalisiert visuell "Schätzung" ohne Erklärungstext.

**ℹ️-Icon:**  
Öffnet einen Tooltip mit festem Text:  
*"Leucin-Gehalt wird aus der Proteinmenge geschätzt. Keine Lebensmitteldatenbank liefert aktuell Leucin-Werte."*

**Datenfluss:**
1. `groupProteinBySlot(entries)` liefert `{ [slot]: proteinG }` (existiert bereits in `calc/tracker.js`)
2. Pro Slot: `isMainMealSlot(slot)` → `rateMealProtein(slotProteinG, isMain, {})` → Badge-Variante

**`profile` in Phase 3C:** `DayLogList` bekommt kein Profil-Prop (aktuell: `entries`, `mealSlots`, `onDelete`, `onEdit`, `onAdd`). `rateMealProtein()` wird bewusst mit leerem Objekt `{}` aufgerufen — die festen Schwellen aus Abschnitt 1.2 gelten. Profil-Prop und individuelle Schwellen folgen in einer späteren Phase.

### Was unverändert bleibt

- `FoodEntryModal` — keine neuen Felder
- `TrackedFood`-Typedef — JSDoc wird um die optionalen Felder `leucineEstimateG?`, `proteinQualityScore?`, `mpsTriggered?` erweitert (Dokumentation der geplanten Struktur). Gespeicherte Einträge bleiben unverändert; keine automatische Befüllung in Phase 3C. Die Felder werden erst in Phase 3E genutzt, wenn bessere Leucin-Schätzungen aus Produkt-, Kategorie- und Proteinqualitätsdaten möglich sind.
- `useLog`-Hook — unverändert
- Heute-Tab / `DaySummary` — unverändert (Tagesübersicht folgt in Phase 3E)

---

## 3. Tests — `tests/unit/calc/nutritionLogic.test.js`

Die 9 bestehenden `rateMealProtein()`-Stub-Tests in `nutritionLogic.test.js` werden **ersetzt** (nicht ergänzt), da sie gegen die neue Logik kollidieren. Neu: 5 `isMainMealSlot()`-Tests + 8 `rateMealProtein()`-Tests = 13 Tests gesamt für Phase 3C.

**Gesamtrechnung:** 93 (bisher) − 9 (Stub-Tests entfallen) + 13 (neue Tests) = **97 Tests**

### `isMainMealSlot()` — 5 Tests

| Eingabe | Erwartet |
|---|---|
| `"Frühstück"` | `true` |
| `"Post-Workout"` | `true` |
| `"Snack"` | `false` |
| `"Casein"` | `false` |
| `"UnbekannterSlot"` | `true` (konservativ) |

### `rateMealProtein()` — 8 Tests

| Szenario | Erwartet |
|---|---|
| Hauptmahlzeit, 35 g | `good`, `high`, hint `undefined` |
| Hauptmahlzeit, 25 g | `borderline`, `medium`, hint enthält `"Schätzung"` |
| Hauptmahlzeit, 12 g | `insufficient`, `low`, hint enthält `"Schätzung"` |
| Snack, 18 g | `good`, `high`, hint `undefined` |
| Snack, 12 g | `borderline`, `medium`, hint |
| Snack, 5 g | `insufficient`, `low`, hint |
| `null` übergeben | `insufficient`, kein Crash |
| Genau 30 g (Hauptmahlzeit) | `good` (Grenzfall inklusiv) |

**Gesamtzahl nach Phase 3C: 97 Tests**

---

## 4. Versionierung

| Datei | Änderung |
|---|---|
| `js/version.js` | `APP_VERSION` 1.2.2 → **1.2.3** |
| `service-worker.js` | `APP_VERSION` synchron anpassen |
| `SCHEMA_VERSION` | bleibt **2** |
| `service-worker.js LOCAL_ASSETS` | keine neuen Dateien, keine Änderung nötig |

---

## 5. Abgrenzung zu späteren Phasen

| Feature | Phase |
|---|---|
| Tagesübersicht "X von Y Mahlzeiten MPS-wirksam" | Phase 3E |
| Bessere Leucin-Schätzung aus Produkt-/Kategorie-/Proteinqualitätsdaten (Open Food Facts liefert keine Leucin-Werte) | Phase 3E |
| `leucineEstimateG`, `mpsTriggered` in TrackedFood befüllen | Phase 3E |
| Individuelle Schwellen aus `profile` in `rateMealProtein()` | Phase 3E oder später |
| Casein-Abend-Priorisierung | Phase 5 |

---

*Spec erstellt: 2026-06-01 · Genehmigt durch: Stephanie Meurer*
