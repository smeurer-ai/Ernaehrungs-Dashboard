# Übergabedokument — Ernährungs-Dashboard PWA
**Zuletzt aktualisiert:** 2026-06-04  
**Stand:** Phase 3A + 3B + 3C + 3D + CDN-Vendoring/CSP + Mahlzeitenanker abgeschlossen · Phase 3E als nächstes  
**App-URL:** https://smeurer-ai.github.io/Ernaehrungs-Dashboard/ernaehrung.html  
**Repository:** https://github.com/smeurer-ai/Ernaehrungs-Dashboard  
**Branch:** `master` · Letzter Push: `9e2acd8`  
**APP_VERSION:** `1.2.7` · **SCHEMA_VERSION:** `2`

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
| **Trainingsdauer pro Tag wählbar** | ✅ | Dropdown „Trainingsdauer heute" (45–120 Min) im Heute-Tab; Tagesauswahl überschreibt Profil-Default; Vorschau + Mahlzeitenplan + Tracker synchron; 153 Tests grün |
| **Phase 3E — OFD + Barcode** | ⏳ | Open Food Facts, Barcode-Scanner |
| **Phase 4 — Rezepte** | ⏳ | Rezeptdatenbank mit Schritten, eigene Rezepte |
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
- ✅ **Tagesbilanz:** KcalRing + MacroBars mit echten Ist-Werten; Protein je Mahlzeit-Slot mit Farbkodierung
- ✅ Export/Import JSON, Backup-Erinnerung
- ✅ 8 Initial-Rezepte, Wochenübersicht (Grundgerüst)
- ❌ Lebensmittelsuche / Barcode → Phase 3E
- ❌ Tagesübersicht MPS-Wirksamkeit → Phase 3E

---

## 2. Architektur-Kurzreferenz

```
ernaehrung.html          ← PWA-Shell (CSP: script-src 'self', keine CDN-Quellen)
  └── js/app.js          ← React-Root, migrations, SW, UpdateBanner
       ├── js/lib.js     ← React 18 + htm + idb (lokal aus assets/vendor/)
       ├── js/calc/      ← bmr, macros, nutritionLogic, hydration, tracker
       ├── js/storage/   ← localStorage (Profil/Settings) + IndexedDB (log/week/foodsCustom/meals)
       ├── js/hooks/     ← useProfile, useSettings, useUiState, useLog, useFavoriteFoods
       ├── js/pwa/       ← registerServiceWorker
       ├── js/ui/        ← Theme, Navigation, Modal, UpdateBanner, ...
       ├── js/data/      ← mealTemplates, tips
       └── js/tabs/      ← heute, tracker (vollständig), rezepte, woche, profil
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
| (Phase 4) Eigene Rezepte | IndexedDB | `recipesCustom` |
| (Phase 5) Kühlschrank | IndexedDB | `fridge` |
| (Phase 6) API-Cache | IndexedDB | `apiCache` |

### Schema-Versionsplan

| Version | Phase | Stores |
|---|---|---|
| **1** | Phase 1 | `log`, `week` |
| **2** (aktuell) | Phase 3A | + `foodsCustom`, `meals` |
| 3 | Phase 4 | + `recipesCustom`, `recipePhotos` |
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
| Leucin-Felder TrackedFood | `leucineEstimateG?`, `proteinQualityScore?`, `mpsTriggered?` — im JSDoc dokumentiert, erst Phase 3E befüllt |
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
tests/unit/calc/tracker.test.js            15 Tests
tests/unit/calc/mealTemplates.test.js      39 Tests  (Mahlzeitenanker, wakeUpTime, trainingDurationMin, null-Fallbacks)
tests/unit/security/htmlSecurity.test.js    4 Tests  (CDN-Blocklist + CSP-Härtung)
──────────────────────────────────────────────────
Gesamt                                    153 Tests — alle grün
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
6. **Phase 3E**: Open Food Facts + Barcode-Scanner
   - Produktsuche nach Name oder Barcode-Scan
   - Leucin-Schätzung aus Produktkategorie verfeinern (bessere Basis als nur Proteinmenge)
   - `leucineEstimateG`, `mpsTriggered` in TrackedFood befüllen (SCHEMA_VERSION bleibt 2 — optionale Felder)
   - Tagesübersicht „X von Y Mahlzeiten MPS-wirksam" im Heute-Tab

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

*Zuletzt aktualisiert: 2026-06-04 · APP_VERSION 1.2.7 · SCHEMA_VERSION 2*
