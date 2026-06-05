# Design-Spec: Phase 3E — Open Food Facts + Barcode

**Datum:** 2026-06-04  
**APP_VERSION nach dieser Phase:** 1.3.1  
**SCHEMA_VERSION:** bleibt 3 (neue TrackedFood-Felder sind optional, kein neuer IDB-Store)

---

## Ziel

Produktsuche über Open Food Facts (OFD) direkt im Tracker-Modal — nach Name oder Barcode. Gefundene Produkte füllen die Makro-Felder automatisch aus. Leucin-Schätzung verbessert sich durch Produktkategorie. MPS-Tagesübersicht im Heute-Tab.

---

## User Story

> Stephanie scannt oder tippt einen Barcode/Produktnamen, wählt das passende Produkt, und trägt es mit einem Tap ein. Leucin und MPS-Status werden automatisch aus der Produktkategorie berechnet und gespeichert. Im Heute-Tab sieht sie: „3 von 4 Mahlzeiten MPS-wirksam."

---

## Neue Dateien

| Datei | Verantwortlichkeit |
|---|---|
| `js/calc/leucineFactors.js` | Kategorie → Leucin-Faktor + Qualitätsscore; `computeMpsFields()` |
| `js/api/openFoodFacts.js` | `mapOFFProduct()`, `parseOFFSearchResults()`, `searchOFF()`, `fetchOFFByBarcode()` |
| `js/tabs/tracker/OFFSearchPanel.js` | Textsuch-UI mit Ergebnisliste |
| `js/tabs/tracker/BarcodePanel.js` | Barcode-Texteingabe + optionaler BarcodeDetector-Kamera-Scan |
| `js/tabs/heute/MpsSummaryCard.js` | „X von Y Mahlzeiten MPS-wirksam" Tageskarte |

---

## Geänderte Dateien

| Datei | Änderung |
|---|---|
| `js/calc/tracker.js` | + `computeMpsSummary(entries, mealSlots)` |
| `js/tabs/tracker/FoodEntryModal.js` | + OFD-Suche, Barcode-Panel, offData-State, MPS-Felder in handleSave |
| `js/tabs/heute/HeuteTab.js` | + `<MpsSummaryCard>` nach HydrationCard |
| `ernaehrung.html` | CSP `connect-src` + `https://world.openfoodfacts.org` |
| `js/version.js` | 1.3.0 → 1.3.1 |
| `service-worker.js` | APP_VERSION sync + 5 neue Dateien in LOCAL_ASSETS |

---

## Open Food Facts API

**Suche nach Name:**
```
GET https://world.openfoodfacts.org/cgi/search.pl
  ?search_terms=<query>&search_simple=1&action=process&json=1
  &page_size=10&lc=de
  &fields=code,product_name,product_name_de,brands,nutriments,categories_tags
```

**Barcode-Lookup:**
```
GET https://world.openfoodfacts.org/api/v2/product/<barcode>.json
  ?fields=code,product_name,product_name_de,brands,nutriments,categories_tags
```

Keine API-Keys erforderlich. Antwortfelder:  
- `nutriments['energy-kcal_100g']`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`  
- `categories_tags` — Array von Strings wie `["en:dairy", "en:fermented-foods"]`  
- `product_name_de` hat Vorrang vor `product_name`

---

## Leucin-Schätzung aus Kategorie

**Logik:** `estimateLeucineFactor(categoriesTags)` durchsucht `categories_tags` nach bekannten Substrings. Erste Regel gewinnt (Priorität absteigend nach Proteinqualität).

| Kategorie-Substring | Leucin-Faktor | Qualitätsscore |
|---|---|---|
| dairy, cheese, milk, yogurt, quark | 10,5% | 0,95 |
| egg | 8,8% | 0,92 |
| meat, poultry, chicken, beef, pork | 9,5% | 0,95 |
| fish, seafood | 9,2% | 0,90 |
| soy, tofu | 8,2% | 0,78 |
| legume, bean, lentil | 7,8% | 0,75 |
| grain, bread, cereal, pasta | 6,8% | 0,50 |
| rice | 6,5% | 0,45 |
| Default (kein Match) | 8,0% | 0,70 |

**`computeMpsFields(proteinG, categoriesTags)`:**  
- `leucineEstimateG = round(proteinG × leucinePct, 1)`  
- `mpsTriggered = leucineEstimateG >= 3.0`  
- `proteinQualityScore = qualityScore`

---

## TrackedFood: neue optionale Felder (bereits im JSDoc, jetzt befüllt)

```typescript
leucineEstimateG?:    number   // nur wenn OFD-Produkt gewählt
proteinQualityScore?: number   // nur wenn OFD-Produkt gewählt
mpsTriggered?:        boolean  // nur wenn OFD-Produkt gewählt
foodRef:              string   // 'off:<code>' statt 'manual' bei OFD
```

Manuelle Einträge und Favoriten bleiben unverändert (keine `mpsTriggered`-Felder).

---

## computeMpsSummary

Neue Funktion in `js/calc/tracker.js`:

```
computeMpsSummary(entries, mealSlots) → { mpsSlotsCount, totalActiveSlotsCount }
```

**Logik pro Slot:**
1. Wenn `entries.mpsTriggered` definiert → verwende `mpsTriggered` direkt (OFD-Daten haben Priorität)
2. Fallback: `rateMealProtein(slotProteinG, isMainMealSlot(slot), {}).rating === 'good'`
3. Slots ohne Einträge werden nicht gezählt

---

## UX: FoodEntryModal

Nur im Neueingabe-Modus (nicht im Edit-Modus) erscheinen zwei neue Buttons nach dem FavoritePicker:

```
[ 🔍 OFD Suche ]  [ 🔢 Barcode ]
```

Klick togglet das jeweilige Panel. Bei Produktauswahl → Panel schließt + Felder gefüllt.

**OFFSearchPanel:** Texteingabe + Suche-Button + Ergebnisliste. Jedes Ergebnis zeigt Name + kcal/P/KH/F. Klick → Felder füllen.

**BarcodePanel:** Text-Input für Barcode (type="text", inputmode="numeric"). Optional: Kamera-Scan via BarcodeDetector-API (nur wenn `'BarcodeDetector' in window`). Automatisches Produkt-Lookup nach Scan.

---

## CSP-Änderung

`ernaehrung.html` Zeile 10: `connect-src 'self'` → `connect-src 'self' https://world.openfoodfacts.org`

Der SW lässt externe Requests bereits durch (Network-First), braucht keine Änderung.

---

## MpsSummaryCard im Heute-Tab

Position: nach `<HydrationCard>`. Zeigt sich nur wenn `totalActiveSlotsCount > 0`.

```
MPS-WIRKSAM HEUTE                        3 / 4
██████████████████░░░░░                  75%
Alle 4 Mahlzeiten MPS-wirksam ✓
```

Farbe: ≥75% grün, ≥50% orange, <50% rot.

---

## Tests

| Neue Testdatei | Anzahl Tests |
|---|---|
| `tests/unit/calc/leucineFactors.test.js` | ~12 |
| `tests/unit/api/openFoodFacts.test.js` | ~8 |
| `tests/unit/calc/tracker.test.js` (Erweiterung) | ~6 |

Netzwerk-Funktionen (`searchOFF`, `fetchOFFByBarcode`) werden nicht direkt getestet — nur die puren Mapping-Funktionen.

---

## SCHEMA_VERSION bleibt 3

Keine neuen IDB-Stores. Die neuen TrackedFood-Felder sind optional und werden im bestehenden `log`-Store gespeichert. Keine Migration nötig.

---

## Branch

```
codex/phase-3e-open-food-facts
```
