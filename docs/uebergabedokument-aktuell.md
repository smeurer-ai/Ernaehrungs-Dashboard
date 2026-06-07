# Übergabedokument — Ernährungs-Dashboard PWA
**Zuletzt aktualisiert:** 2026-06-07
**Stand:** Stabilisierungsrunde nach Phase 3E abgeschlossen · Phase 5 als nächstes  
**App-URL:** https://smeurer-ai.github.io/Ernaehrungs-Dashboard/ernaehrung.html  
**Repository:** https://github.com/smeurer-ai/Ernaehrungs-Dashboard  
**Branch:** `master` · Stabilisierungsrunde gemerged (PR #4)
**APP_VERSION:** `1.3.5` · **SCHEMA_VERSION:** `3`

---

## 1. Projektstatus

| Phase | Status | Inhalt |
|---|---|---|
| **Phase 1 — Fundament** | ✅ | Multi-File-Architektur, Profil, localStorage/IndexedDB, Export/Import, Heute-Tab |
| **Phase 2 — PWA + Nav** | ✅ | Service Worker, Manifest, Icons, Bottom-Navigation, UpdateBanner |
| **Vitest + Tests** | ✅ | 108 Unit-Tests für calc/-Schicht (bmr, macros, nutritionLogic, hydration, tracker) |
| **HydrationReminder** | ✅ | `generateHydrationReminders()` in `js/calc/hydration.js` — kein UI noch |
| **Phase 3A — Tracker-Fundament** | ✅ | Manuelle Eingabe, Favoriten, Tagesliste, Schema v2 |
| **Phase 3B — Tagesbilanz** | ✅ | Ist-Werte aus Log summieren, DaySummary gefüllt, Protein je Slot in MealPlanEntry |
| **Phase 3C — MPS-Vorbereitung** | ✅ | `rateMealProtein()` echte Logik, `isMainMealSlot()`, Leucin-Badge im Tracker |
| **Phase 3D — Hydration-Karte** | ✅ | HydrationCard im Heute-Tab — zeitbasiert abgeblendet/hervorgehoben |
| **CDN-Vendoring + CSP-Härtung** | ✅ | Keine externen JS-CDNs mehr; React/htm/idb lokal unter `assets/vendor/`; Google Fonts lokal unter `assets/fonts/`; CSP auf `script-src 'self'` verschärft; SW cached nur noch lokale Assets |
| **Mahlzeitenanker flexibilisiert** | ✅ | `wakeUpTime` + `trainingDurationMin` im Profil; Frühstück = wakeUpTime + 60 Min; Post-Workout = T + Dauer + 30 Min; Frühstück bei Mittvormittags-Training wieder sichtbar |
| **Trainingsdauer pro Tag wählbar** | ✅ | Dropdown „Trainingsdauer heute" (45–120 Min) im Heute-Tab; Tagesauswahl überschreibt Profil-Default; Vorschau + Mahlzeitenplan + Tracker synchron |
| **Phase 4 — Rezepte** | ✅ | 8 Initialrezepte mit Zutaten/Schritten; expandierbare Karten; eigene Rezepte anlegen/bearbeiten/löschen; Schema v3 (recipesCustom + recipePhotos); Export/Import |
| **Phase 3E — OFD + Barcode** | ✅ | OFD-Suche + Barcode-Scanner, Leucin-Schätzung aus Produktkategorie, MPS-Tagesübersicht (v1.3.1); Barcode-UX-Fix (v1.3.2) |
| **Stabilisierungsrunde nach 3E** | ✅ | MPS-Slot-Logik, Makro-Ist/Ziel P/KH/F, OFD-Robustheit, Favoriten-Picker, Favorit im Edit-Modus, Rezepte→Tracker (v1.3.3–1.3.5) |
| **Phase 5 — Vorschläge** | ⏳ | Kühlschrank, Matching, proteinpriorisierte Lücken-Vorschläge |
| **Phase 6 — AI** | ⏳ | Claude Vision, Foto-Rezepterkennung |

### Was die App aktuell kann

- ✅ Installierbar als PWA, offline-fähig
- ✅ Bottom-Navigation (5 Tabs)
- ✅ Mahlzeitenplan (Trainings-/Ruhetag, dynamische Trainingszeit + Trainingsdauer)
- ✅ Profil editierbar (Katch-McArdle, drei Protein-Modi, Defizit-Warnung, Aufwachzeit, Standard-Trainingsdauer)
- ✅ **Tracker-Tab:** Mahlzeiten manuell eintragen, Favoriten anlegen, Tagesliste, Bearbeiten/Löschen
- ✅ **MPS-Badge:** Pro Mahlzeit-Slot `~✓ / ~⚠ / ~✗ Leucin` mit ℹ️-Schätzungs-Hinweis (Phase 3C)
- ✅ **Hydration-Karte:** Trink-Erinnerungen im Heute-Tab (zeitbasiert: vergangen = abgeblendet, nächste = hervorgehoben)
- ✅ **Tagesbilanz:** KcalRing + MacroBars mit echten Ist-Werten; P/KH/F je Mahlzeit-Slot mit Farb-Feedback
- ✅ **Rezepte-Tab:** 8 Initialrezepte + eigene Rezepte; Suchfeld; „In Tracker übernehmen" mit Slot- und Portionswahl; Export/Import
- ✅ Export/Import JSON, Backup-Erinnerung
- ✅ **OFD-Suche + Barcode:** 9s Timeout, 1 Retry, Relevanz-Ranking, differenzierte Fehlermeldungen; Leucin-Schätzung aus Produktkategorie; MPS-Felder in TrackedFood
- ✅ **MPS-Tagesübersicht:** „X von Y Mahlzeiten MPS-wirksam" (Protein-Baseline; OFD-Leucin nur additiv)
- ✅ **Favoriten-Picker:** Suchfeld, max 8 Treffer, zuletzt-aktualisiert als Default; „Als Favorit speichern" auch im Edit-Modus mit Duplikat-Check

---

## 2. Architektur-Kurzreferenz

```
ernaehrung.html          ← PWA-Shell (CSP: script-src 'self', keine CDN-Quellen)
  └── js/app.js          ← React-Root, migrations, SW, UpdateBanner
       ├── js/lib.js     ← React 18 + htm + idb (lokal aus assets/vendor/)
       ├── js/calc/      ← bmr, macros, nutritionLogic, hydration, tracker
       ├── js/storage/   ← localStorage (Profil/Settings) + IndexedDB (log/week/foodsCustom/meals)
       ├── js/hooks/     ← useProfile, useSettings, useUiState, useLog, useFavoriteFoods, useRecipes
       ├── js/pwa/       ← registerServiceWorker
       ├── js/ui/        ← Theme, Navigation, Modal, UpdateBanner, ...
       ├── js/data/      ← mealTemplates, tips, mealSlots, initialRecipes
       └── js/tabs/      ← heute, tracker (vollständig), rezepte (Phase 4), woche, profil
assets/vendor/           ← react.js, htm.js, idb.js (lokal gebündelt mit esbuild)
assets/fonts/            ← fonts.css, DM Mono, DM Sans, Playfair Display (lokal)
```

### Lokale Vendor-Abhängigkeiten (js/lib.js — keine CDN-Requests mehr)
```javascript
import React, { createRoot } from '../assets/vendor/react.js';
import htm                   from '../assets/vendor/htm.js';
import { openDB }            from '../assets/vendor/idb.js';
```

### Trainingszeit-Anker (2 Ebenen)

| Feld | Wo gespeichert | Bedeutung |
|---|---|---|
| `profile.wakeUpTime` | localStorage (Profil) | Aufwachzeit — Profilanker; Frühstück = wakeUpTime + 60 Min |
| `profile.trainingDurationMin` | localStorage (Profil) | Standard-Trainingsdauer (z.B. 60 Min) |
| `uiState.preferredTrainingDurationMin` | localStorage (UiState) | Tages-Override; `null` = Profil-Default verwenden |

```javascript
// effectiveDurationMin — wird in HeuteTab berechnet und an alle Komponenten übergeben
const effectiveDurationMin =
  uiState.preferredTrainingDurationMin ?? profile.trainingDurationMin ?? 60;
```

DayTypeSwitch-Vorschau, MealPlanList und TrackerTab verwenden immer `effectiveDurationMin` — nie hardcoded T + 90.

### Wichtige Konventionen
- **htm statt JSX:** `` html`<div>...</div>` `` — kein Babel, kein Build
- **Keine default exports:** immer `export function`, `export const`
- **API-Key:** niemals automatisch exportieren
- **Makro-Proportionen:** kP/pP/cP/fP müssen zu 1,00 summieren
- **calc/-Funktionen:** immer pure (kein DOM, kein State) → testbar mit Vitest

---

## 3. Versionierungsregel (bindend)

`APP_VERSION` und `SCHEMA_VERSION` sind **unabhängig**:
- `APP_VERSION` (semver): steuert den Service-Worker-Cache-Namen
- `SCHEMA_VERSION` (Integer): steuert die IndexedDB-Version

Bei jeder Änderung an JS-Dateien:
1. `APP_VERSION` in `js/version.js` hochzählen
2. `APP_VERSION` in `service-worker.js` **synchron** anpassen
3. Neue Dateien in `LOCAL_ASSETS`-Array in `service-worker.js` eintragen

Bei neuen IndexedDB-Stores:
4. `SCHEMA_VERSION` in `js/version.js` erhöhen
5. Migration in `js/storage/migrations.js` implementieren

---

## 4. Storage-Aufteilung

| Was | Wo | Store / Schlüssel |
|---|---|---|
| Profil | localStorage | `ernaehrung_profile` |
| Settings | localStorage | `ernaehrung_settings` |
| UI-Zustand | localStorage | `ernaehrung_ui_state` |
| Schema-Version | localStorage | `ernaehrung_schema_version` |
| Esstagebuch | IndexedDB | `log` (keyPath: date) |
| Wochenprotokoll | IndexedDB | `week` (keyPath: weekKey) |
| **Favoriten-Lebensmittel** | **IndexedDB** | **`foodsCustom`** (Phase 3A, neu) |
| **Favoriten-Mahlzeiten** | **IndexedDB** | **`meals`** (Phase 3A, angelegt, noch leer) |
| **Eigene Rezepte** | **IndexedDB** | **`recipesCustom`** (Phase 4) |
| (Phase 5) Kühlschrank | IndexedDB | `fridge` |
| (Phase 6) API-Cache | IndexedDB | `apiCache` |

### Schema-Versionsplan

| Version | Phase | Stores |
|---|---|---|
| **1** | Phase 1 | `log`, `week` |
| **2** | Phase 3A | + `foodsCustom`, `meals` |
| **3** (aktuell) | Phase 4 | + `recipesCustom`, `recipePhotos` |
| 4 | Phase 5 | + `fridge` |
| 5 | Phase 6 | + `apiCache` |

---

## 5. Ernährungskonzept — aktuelle Werte

- **BMR:** Katch-McArdle (`370 + 21.6 × LBM`)
- **Protein-Standard:** `perKgLeanMass`, 2,0 g/kg (seit 2026-06-01)
- **Pre-Workout:** T − 1h15 · **Post-Workout:** T + 1h30
- **Frühstück = größte Mahlzeit** (Kalorienfrontloading, postmenopausal)
- **Pre-Workout KH:** 28 % (Frauen verbrennen mehr Fett)
- **Casein-Hinweis:** 30–40g ~30min vor dem Schlafen
- **Leucin-Hinweis:** ~3g pro Mahlzeit (MPS-Trigger) — Schwelle aus Studiendaten bestätigt

---

## 6. Architekturentscheidungen (bindend)

| Entscheidung | Inhalt |
|---|---|
| Protein-Standard | `perKgLeanMass` / 2,0 g/kg |
| Flexible Mahlzeitenanzahl | Bereits generisch (3/4/5 ohne Refactoring) |
| Leucin-Schätzung | Dynamisch berechnet aus `p` + `isMainMealSlot()`, nie persistiert (Phase 3C) |
| Leucin-Felder TrackedFood | `leucineEstimateG?`, `proteinQualityScore?`, `mpsTriggered?` — befüllt bei OFD-Produkten (Phase 3E) |
| OFD-Suche CSP | `connect-src 'self' https://world.openfoodfacts.org` — in ernaehrung.html Zeile 10 |
| Barcode-Kamera | Native BarcodeDetector-API (kein externes Library) — guard: `BarcodeDetector` + `mediaDevices`; manueller Barcode-Fallback immer sichtbar |
| computeMpsSummary Priorität | Protein-Schätzung via `rateMealProtein` ist immer die Baseline; OFD-Leucinsumme (≥ 3g/Slot) kann nur verbessern, nie blockieren |
| groupMacrosBySlot | Ersetzt `groupProteinBySlot`; gibt `{ slot: { p, c, f } }` zurück statt nur Protein-Zahl |
| Favoriten-Duplikat-Check | `trim().toLowerCase()`-Vergleich in `FoodEntryModal.handleSave` — kein zweiter Favorit wenn Name identisch |
| Rezept→Tracker gramm | `gramm=100` technischer Platzhalter (kein Gesamtgewicht bekannt); skalierte Makros direkt gespeichert; Einheitensystem folgt |
| Rezept→Tracker foodRef | `initial-recipe:<id>` für Initialrezepte · `recipe:<id>` für eigene Rezepte |
| `isMainMealSlot()` | Substring-Matching (`toLowerCase().includes()`), nicht exakte Set-Prüfung — robust für neue Slot-Namen |
| `rateMealProtein()` Schwellen | Hauptmahlzeit: 30/20g · Snack: 15/10g · Basis: 3g Leucin ≈ 30g hochwertiges Protein |
| Produktleitfragen | Beide müssen Ja sein: Muskelerhalt/Fettabbau UND MPS im Alltag |
| Plan vs. Log | `MealWithMacros` und `TrackedFood` bleiben getrennt |
| TrackedFood-Makros | kcal ganzzahlig, p/c/f 1 Dezimalstelle (`calcTrackedFoodMacros`) |

---

## 7. Tests

```
tests/unit/calc/bmr.test.js                10 Tests
tests/unit/calc/macros.test.js             23 Tests
tests/unit/calc/nutritionLogic.test.js     38 Tests
tests/unit/calc/hydration.test.js          24 Tests
tests/unit/calc/tracker.test.js            29 Tests  (computeMpsSummary, groupMacrosBySlot — Tasks 1+2)
tests/unit/calc/favorites.test.js          10 Tests  (filterFavorites — Task 4, neu)
tests/unit/calc/recipeTracking.test.js      7 Tests  (scaleRecipeMacros — Task 6, neu)
tests/unit/calc/mealTemplates.test.js      39 Tests  (Mahlzeitenanker, wakeUpTime, trainingDurationMin, null-Fallbacks)
tests/unit/security/htmlSecurity.test.js    4 Tests  (CDN-Blocklist + CSP-Härtung)
tests/unit/storage/migrations.test.js       5 Tests  (Schema v3 Migration)
tests/unit/storage/indexeddb.test.js        8 Tests  (CRUD recipesCustom — saveCustomRecipe, getAllCustomRecipes, deleteCustomRecipe)
tests/unit/storage/exportImport.test.js     4 Tests  (recipesCustom Export/Import + Altdaten-Robustheit)
tests/unit/data/initialRecipes.test.js      8 Tests  (Struktur aller 8 Rezepte)
tests/unit/calc/leucineFactors.test.js     18 Tests  (Phase 3E: estimateLeucineFactor, computeMpsFields)
tests/unit/api/openFoodFacts.test.js       25 Tests  (mapOFFProduct, parseOFFSearchResults, normalizeBarcode, rankOFFResults, classifyOFFError — Task 3)
──────────────────────────────────────────────────
Gesamt                                    252 Tests — alle grün
```

Ausführen: `npm test` im Projekt-Root.

---

## 8. Technische Schulden

| ID | Beschreibung | Wann |
|---|---|---|
| TS-01 | Keine Tests für IndexedDB-Hooks (fake-indexeddb nötig) | Vor Phase 3B (weiterhin offen) |
| TS-05 | IndexedDB-Doppelöffnung (migrations.js + indexeddb.js) | Phase 3B |
| TS-06 | Toast außerhalb Provider schlägt lautlos fehl | Phase 3B |
| ~~TS-07~~ | ~~Google Fonts nicht offline-fähig~~ | ✅ erledigt — Fonts lokal unter `assets/fonts/` |
| TS-08 | `new Date().toISOString()` nutzt UTC → kurz nach Mitternacht falsches Datum | Gemeinsamer Fix HeuteTab + Tracker |

---

## 9. Nächste Schritte

**Empfohlene Reihenfolge:**

1. ~~**Phase 3D**~~ ✅ erledigt
2. ~~**Phase 3B**~~ ✅ erledigt
3. ~~**Phase 3C**~~ ✅ erledigt
4. ~~**CDN-Vendoring + CSP**~~ ✅ erledigt (v1.2.5, Push `9e2acd8`)
5. ~~**Mahlzeitenanker flexibilisiert**~~ ✅ erledigt (v1.2.6)
6. ~~**Phase 4 — Rezepte**~~ ✅ erledigt (v1.3.0) — 8 Initialrezepte, eigene Rezepte, Schema v3
7. ~~**Phase 3E**~~ ✅ erledigt (v1.3.2) — OFD-Suche + Barcode-Scanner, Leucin-Schätzung, MPS-Tagesübersicht, Barcode-UX-Fix
8. ~~**Stabilisierungsrunde nach 3E**~~ ✅ erledigt (v1.3.3–1.3.5, PR #4) — MPS-Logik, Makro-Ist/Ziel, OFD-Robustheit, Favoriten-Picker, Favorit im Edit-Modus, Rezepte→Tracker
9. **Phase 5**: Kühlschrank-Matching — proteinpriorisierte Vorschläge

**Branch-Workflow ab jetzt:**
- Jede Phase auf eigenem Feature-Branch
- PR nach master nach Abschluss
- Aktuell: `master` ist synchron; nächste Phase auf neuem Feature-Branch starten

---

## 10. Dokumentenverzeichnis

| Datei | Inhalt |
|---|---|
| `docs/projekt-spezifikation.md` | Vollständige Spezifikation |
| `docs/phase-1-abschlussbericht.md` | Phase-1-Abschlussbericht |
| `docs/phase-2-abschlussbericht.md` | Phase-2-Abschlussbericht |
| `docs/phase-3a-abschlussbericht.md` | Phase-3A-Abschlussbericht |
| `docs/phase-3c-abschlussbericht.md` | Phase-3C-Abschlussbericht |
| `docs/vor-phase-4-mahlzeitenanker.md` | Mahlzeitenanker-Entscheidungen vor Phase 4 |
| `docs/uebergabedokument-aktuell.md` | **Dieses Dokument** |
| `docs/superpowers/plans/` | Alle Implementierungspläne |
| `docs/superpowers/specs/` | Alle Design-Specs |
| `Ernaehrungskonzept_fuer_Coach.md` | Ernährungskonzept für Coach-Gespräch |
| `tests/manual-checklist-phase-2.md` | Phase-2-Smoke-Tests |

---

*Zuletzt aktualisiert: 2026-06-07 · APP_VERSION 1.3.5 · SCHEMA_VERSION 3 · Stabilisierungsrunde nach Phase 3E abgeschlossen*
