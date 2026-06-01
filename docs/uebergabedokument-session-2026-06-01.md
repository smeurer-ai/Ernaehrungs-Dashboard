# Übergabedokument — Ernährungs-Dashboard PWA
**Session:** 2026-06-01  
**Stand:** Phase 1 abgeschlossen · Phase 2 geplant, noch nicht ausgeführt  
**App-URL:** https://smeurer-ai.github.io/Ernaehrungs-Dashboard/ernaehrung.html  
**Repository:** https://github.com/smeurer-ai/Ernaehrungs-Dashboard  
**Aktueller Branch:** `master` · Letzter Commit: `1eaad93`

---

## 1. Was in dieser Session gemacht wurde

### 1.1 Fixes & Verbesserungen (committed + gepusht)

| Commit | Was | Dateien |
|---|---|---|
| `3bebf8e` | Kontrast erhöht (textMuted #555→#aaa, textSubtle #444→#999) + dynamische Trainingszeit (Post-Workout T+30min statt fest 14:30) | `theme.js`, `mealTemplates.js`, `DayTypeSwitch.js` |
| `eb5307c` | Post-Workout T+90min (war T+30min); Tabs größer + kontrastreicher (#555→#d4d0c8, 10→12px); Labels, Buttons, Inputs verbessert; MacroBar-Labels aufgehellt | `theme.js`, `mealTemplates.js`, `DayTypeSwitch.js`, `MacroBar.js` |
| `1eaad93` | Makros + Notizen für postmenopausale Frauen (studienbassiert via NotebookLM); Frühstück = größte Mahlzeit; Pre-Workout KH 40→28%; Leucin-Hinweise (~3g/Mahlzeit); Casein-Timing präzisiert (30–40g ~30min vor Schlaf) | `mealTemplates.js` |

### 1.2 Neue Dokumente erstellt

| Datei | Inhalt |
|---|---|
| `Ernaehrungskonzept_fuer_Coach.md` | Erläuterung des Ernährungskonzepts für Ernährungscoach (Berechnungsmethoden, Mahlzeitentabellen, postmenopausale Besonderheiten, Fragen an den Coach) |
| `docs/superpowers/plans/2026-06-01-phase-2-pwa-bottomnav.md` | Vollständiger Implementierungsplan für Phase 2 (11 Tasks mit Code) |
| `docs/uebergabedokument-session-2026-06-01.md` | Dieses Dokument |

### 1.3 Architekturentscheidungen getroffen (noch nicht implementiert)

Fünf fachliche Punkte wurden diskutiert und bewertet → siehe Abschnitt 3.

---

## 2. Aktueller Projektstatus

### Phase-Übersicht

| Phase | Status | Inhalt |
|---|---|---|
| **Phase 1 — Fundament** | ✅ Abgeschlossen | Multi-File-Architektur, Profil, localStorage/IndexedDB, Export/Import, Heute-Tab |
| **Phase 2 — PWA + Nav** | 📋 Geplant (Plan vorhanden, nicht ausgeführt) | Service Worker, Manifest, Icons, Bottom-Navigation, UpdateBanner |
| **Phase 3 — Tracker** | ⏳ Ausstehend | Lebensmittel-Suche, Barcode, eigene Foods, Tagesbuch-Einträge |
| **Phase 4 — Rezepte** | ⏳ Ausstehend | Vollständige Rezeptdatenbank mit Schritten, eigene Rezepte |
| **Phase 5 — Vorschläge** | ⏳ Ausstehend | Kühlschrank, Matching, proteinpriorisierte Lücken-Vorschläge |
| **Phase 6 — AI** | ⏳ Ausstehend | Claude Vision, Foto-Rezepterkennung (nur mit API-Key) |

### Was die App aktuell kann

- ✅ Mahlzeitenplan (Trainingstag/Ruhetag) mit dynamischer Trainingszeit (T−1h15 / T+1h30)
- ✅ Drei Trainingsszenarien: Früh-, Mittel-, Spättraining (automatisch erkannt)
- ✅ Profil editierbar: Gewicht, Körperfett, Alter, Defizit, Proteinfaktor, Trainingstage
- ✅ BMR/TDEE-Berechnung (Katch-McArdle auf fettfreier Masse)
- ✅ Drei Protein-Berechnungsmodi: per kg KG / per kg LBM / fester Wert
- ✅ Defizit-Warnung (safe/moderate/aggressive/dangerous)
- ✅ Export/Import als JSON
- ✅ Backup-Erinnerung nach 7+ Tagen
- ✅ 8 Initial-Rezepte
- ✅ Wochenübersicht (Grundgerüst)
- ✅ Postmenopausale Hinweise im Profil-Tab
- ❌ Lebensmittel tracken (Phase 3)
- ❌ Offline / Als App installierbar (Phase 2)

---

## 3. Architekturentscheidungen aus dieser Session

Diese Entscheidungen sind bindend für alle zukünftigen Phasen.

### 3.1 Protein-Standard: LBM statt Körpergewicht

**Entscheidung:** Default `proteinTargetMode` wird von `'perKgBodyweight'` auf `'perKgLeanMass'` geändert. Default `proteinPerKg` von 1,9 auf 2,0 g/kg LBM.

**Begründung:** Bei postmenopausalen Frauen mit typisch > 40% Körperfettanteil führt Körpergewicht-Berechnung zu unrealistisch hohen Proteinzielen. Beispiel: 100 kg / 46% KFA → 150g (per KG) vs. 108g (per LBM). Muskelmasse ist der physiologisch relevante Faktor.

**Umsetzung:** Task 0 in Phase-2-Plan (2 Zeilen in `ErststartAssistent.js`, 1 Zeile in Migrations-Defaults).

**Betroffene Dateien:**
- `js/tabs/profil/ErststartAssistent.js` — Default-Werte beim Wizard-Abschluss
- `js/storage/migrations.js` — `seedDefaults()` Funktion

---

### 3.2 Flexible Mahlzeitenanzahl

**Entscheidung:** Keine Architekturveränderung nötig — die Berechnungslogik ist bereits flexibel.

**Begründung:** `distributeMacrosPerMeal()` in `macros.js` arbeitet mit beliebig langen Arrays. Die Proportionen (kP, pP, cP, fP) summieren zu 1,00 — das funktioniert unabhängig von der Anzahl. Neue Mahlzeiten-Anzahl = neues Template-Array, kein Refactoring.

**Was nicht getan wird:** Keine konfigurierbare Einstellung "3 / 4 / 5 Mahlzeiten" in der UI — YAGNI. Wenn der Bedarf kommt, ist es eine reine Daten-Erweiterung in `mealTemplates.js`.

**Dokumentationshinweis:** Kommentar in `mealTemplates.js` (Task 0 in Phase 2).

---

### 3.3 Leucin-Architektur für MPS-Optimierung

**Entscheidung:** Optionale Leucin/MPS-Felder werden ab Phase 3 in `TrackedFood` angelegt — NICHT als neues Interface, NICHT als Pflichtfelder.

**Datenmodell:**
```typescript
interface TrackedFood {
  // ... bestehende Pflichtfelder (id, mealSlot, foodRef, foodName, gramm, kcal, p, c, f, timestamp) ...

  // Phase 3+ optional — nie required, keine Migration nötig
  leucineEstimateG?: number;      // Schätzwert: ~8% von p bei tierischen Quellen, ~6% pflanzlich
  proteinQualityScore?: number;   // 0–100, abgeleitet aus Lebensmittel-Kategorie
  mpsTriggered?: boolean;         // true wenn leucineEstimateG >= 2.5g
}
```

**Einschränkung:** Open Food Facts liefert keine Aminosäure-Daten. `leucineEstimateG` ist immer eine Schätzung, nie ein exakter Wert. Das wird in der UI klar kommuniziert.

**Schätzformel:** `leucineEstimateG = protein_g × leucineFactor`, wobei:
- Tierische Quellen (Fleisch, Fisch, Ei, Milch): `leucineFactor = 0.088`
- Pflanzliche Quellen (Hülsenfrüchte, Getreide): `leucineFactor = 0.065`
- Whey-Protein: `leucineFactor = 0.115`
- Casein (Quark): `leucineFactor = 0.095`

**Umsetzung:** Phase 3 — beim Anlegen des `foodsCustom`-Stores.

---

### 3.4 Produktausrichtung — doppelte Leitfrage (Ergänzung zu §1.8 der Spezifikation)

Jede zukünftige Funktion muss BEIDE Fragen mit Ja beantworten:

**Frage 1 (aus Spezifikation §1.8):**
> „Hilft diese Funktion einer postmenopausalen Frau dabei, Fett zu verlieren und gleichzeitig Muskulatur zu erhalten oder aufzubauen?"

**Frage 2 (neu):**
> „Hilft diese Funktion dabei, die Muskelproteinsynthese (MPS) im Alltag besser zu erreichen?"

Wenn eine der beiden Fragen **Nein** lautet → Funktion gehört nicht in den Kern.

**Konsequenz:** `docs/projekt-spezifikation.md` §1.8 wird um Frage 2 ergänzt (in Phase 2 als Dokumentations-Commit).

---

### 3.5 Kein Super-Interface für Mahlzeiten

**Entscheidung:** Bewusst KEINE Zusammenführung von Plan-Daten und Log-Daten in einem Interface.

**Begründung:** `MealWithMacros` (Soll-Plan) und `TrackedFood` (Ist-Log) haben unterschiedliche Lebenszyklen. Der Plan wird täglich neu berechnet, das Log wächst dauerhaft. Eine Zusammenführung würde Migrations-Komplexität erzeugen ohne Mehrwert.

**Was bleibt wie es ist:**
- `MealWithMacros` (aus `distributeMacrosPerMeal`) — nur Plan
- `TrackedFood` (im `log`-Store) — nur Tagesbuch, mit optionalen Leucin-Feldern ab Phase 3

---

## 4. Ernährungskonzept — Änderungen seit Phase 1

Folgende Änderungen wurden durch NotebookLM-Rechercheabgleich (18 Studien) vorgenommen und in `mealTemplates.js` umgesetzt:

### Mahlzeiten-Timing (Trainingstag)
| Parameter | Vorher | Jetzt | Begründung |
|---|---|---|---|
| Post-Workout Timing | T+30min | T+90min | Training ~1h + Heimfahrt + Zubereitung |
| Pre-Workout KH-Anteil | cP: 0,40 | cP: 0,28 | Frauen oxidieren mehr Fett beim Training (hormonell) |

### Kalorienverteilung (Ruhetag + Trainingstag)
| Parameter | Vorher | Jetzt | Begründung |
|---|---|---|---|
| Frühstück Kalorien | kP: 0,28 (zweitkleinste) | kP: 0,32 (größte) | Kalorienfrontloading verbessert Insulinsensitivität postmenopausal |
| Mittagessen Kalorien | kP: 0,32 (größte) | kP: 0,28 | Entsprechend reduziert |

### Hinweise in Mahlzeit-Notizen
| Hinweis | Begründung |
|---|---|
| ~3g Leucin pro Mahlzeit (z.B. Eier + Quark, 30g Whey) | Anabole Resistenz: ohne ausreichend Leucin kein MPS-Trigger |
| 30–40g Casein ~30min vor dem Schlafen | Präzisierung: statt nur „casein-reich" konkrete Menge + Timing |
| Pre-Workout: „Frauen verbrennen beim Training mehr Fett" | Edukationshinweis für niedrigeren KH-Bedarf |

### Makro-Summen-Checks (alle Szenarien)
Alle kP/pP/cP/fP-Verteilungen wurden nach den Änderungen geprüft und summieren jeweils exakt zu 1,00:

| Szenario | kP | pP | cP | fP |
|---|---|---|---|---|
| Ruhetag | .32+.28+.15+.25 | .32+.28+.15+.25 | .25+.25+.20+.30 | .28+.30+.12+.30 |
| Frühtraining | .22+.30+.28+.20 | .22+.30+.26+.22 | .28+.38+.24+.10 | .12+.18+.35+.35 |
| Mitteltraining | .28+.20+.28+.24 | .28+.20+.28+.24 | .28+.28+.34+.10 | .22+.12+.18+.48 |
| Spättraining | .30+.24+.20+.26 | .28+.22+.18+.32 | .28+.28+.28+.16 | .22+.18+.12+.48 |

---

## 5. Phase-2-Plan — Zusammenfassung

**Plan-Datei:** `docs/superpowers/plans/2026-06-01-phase-2-pwa-bottomnav.md`

### Scope

| Feature | Task |
|---|---|
| App-Icons (192×192, 512×512, maskable) | Task 2 |
| manifest.json | Task 3 |
| service-worker.js (Cache-First + Update-Pattern) | Task 4 |
| js/pwa/registerServiceWorker.js | Task 5 |
| js/ui/UpdateBanner.js | Task 6 |
| Bottom-Navigation (Navigation.js + theme.js) | Task 7 |
| ernaehrung.html (manifest-Link, apple-touch-icon, theme-color) | Task 8 |
| app.js (SW verdrahten + UpdateBanner) | Task 9 |
| Manual Smoke-Test-Checkliste | Task 10 |

**Zu ergänzen (Task 0 — aus Architekturentscheidung 3.1):**
- Default `proteinTargetMode` → `'perKgLeanMass'` in `ErststartAssistent.js`
- Default `proteinPerKg` → `2.0` (statt 1,9 per KG)
- Kommentar Mahlzeiten-Flexibilität in `mealTemplates.js`
- §1.8 Spezifikation um zweite Leitfrage ergänzen

### Nicht in Phase 2 (bewusst)
- Custom Install-Prompt (`installPrompt.js`): Browser-Prompt ist ausreichend
- Vitest Unit-Tests: TS-01-Schuld, vor Phase 3 angehen

### Service Worker — kritische Details
```javascript
// service-worker.js
const APP_VERSION = '1.1.0';  // MUSS mit js/version.js synchron sein
// Kein skipWaiting() in install → UpdateBanner-Pattern
// skipWaiting() nur auf SKIP_WAITING-Message vom Client
```

### Versions-Regel (für alle zukünftigen Änderungen)
Wenn Service Worker oder JS-Dateien geändert werden:
1. `APP_VERSION` in `js/version.js` hochzählen (Patch/Minor/Major)
2. `APP_VERSION` in `service-worker.js` **synchron** anpassen
3. `LOCAL_ASSETS`-Array in `service-worker.js` prüfen — neue Dateien eintragen

---

## 6. Technisches Referenz-Wissen

### Architektur-Kurzreferenz
```
ernaehrung.html          ← Shell (kein Build, kein Bundler)
  └── js/app.js          ← React-Root, migrations, SW-Registration
       ├── js/lib.js     ← React 18 + htm + idb (alle von esm.sh/jsdelivr)
       ├── js/calc/      ← reine Berechnungsfunktionen (bmr, macros, nutritionLogic)
       ├── js/storage/   ← localStorage (Profil/Settings) + IndexedDB (log/week)
       ├── js/hooks/     ← React-Adapter für Storage
       ├── js/ui/        ← Theme + UI-Komponenten
       ├── js/data/      ← mealTemplates, tips
       └── js/tabs/      ← heute, tracker, rezepte, woche, profil
```

### CDN-Abhängigkeiten (fest versioniert)
```javascript
// js/lib.js
import React from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';
import htm from 'https://esm.sh/htm@3.1.1';
import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';
```

### Storage-Aufteilung
| Was | Wo | Schlüssel |
|---|---|---|
| Profil | localStorage | `ernaehrung_profile` |
| Settings | localStorage | `ernaehrung_settings` |
| UI-Zustand | localStorage | `ernaehrung_ui_state` |
| Schema-Version | localStorage | `ernaehrung_schema_version` |
| Esstagebuch | IndexedDB | Store `log` |
| Wochenprotokoll | IndexedDB | Store `week` |
| (Phase 3+) eigene Lebensmittel | IndexedDB | Store `foodsCustom` |
| (Phase 3+) Favoriten-Mahlzeiten | IndexedDB | Store `meals` |

### Schema-Versionen
| Version | Phase | Neue Stores |
|---|---|---|
| 1 (aktuell) | Phase 1 | `log`, `week` |
| 2 | Phase 3 | `foodsCustom`, `meals` |
| 3 | Phase 4 | `recipesCustom`, `recipePhotos` |
| 4 | Phase 5 | `fridge` |
| 5 | Phase 6 | `apiCache` |

### Berechnung — Datenpfad (Beispiel)
```
Profil (weight: 100, bodyFat: 46.6, deficit: 300, trainingFactor: 1.55)
  → calcLeanMass(100, 46.6) = 53.4 kg
  → calcBMR(53.4) = 370 + 21.6 × 53.4 = 1523 kcal
  → calcTDEE(1523, 1.55) = 2361 kcal
  → Ziel = 2361 - 300 = 2061 kcal
  → calcMacros(profile, 2061) = { kcal: 2061, protein: 107g, fat: 57g, carbs: 274g }
  → getMealTemplate('training', '10:00') → 4 Mahlzeiten mit kP/pP/cP/fP
  → distributeMacrosPerMeal(template, macros) → Mahlzeiten mit g-Werten
```

### Wichtige Konventionen
- **htm statt JSX:** `html\`<div>...</div>\`` (kein Babel, kein Build)
- **Keine default exports:** immer `export function`, `export const`
- **Styles inline:** über `S.xyz` aus `js/ui/theme.js`
- **API-Key:** niemals automatisch exportieren (fixe Regel, nicht verhandelbar)
- **Makro-Proportionen:** müssen immer exakt zu 1,00 summieren (Invariante)

---

## 7. Offene Punkte & Technische Schulden

### Vor Phase 2 umzusetzen (aus dieser Session)
- [ ] Default `proteinTargetMode` auf `'perKgLeanMass'` ändern (Task 0 in Phase-2-Plan)
- [ ] §1.8 Spezifikation um zweite Leitfrage ergänzen

### Bekannte technische Schulden (aus Phase-1-Abschlussbericht)
| ID | Beschreibung | Priorität | Wann |
|---|---|---|---|
| TS-01 | Keine automatisierten Tests für `calc/` | Mittel | Vor Phase 3 |
| TS-03 | CDN-Abhängigkeit beim Erstladen (offline fix erst mit SW) | Niedrig | Behoben in Phase 2 |
| TS-05 | IndexedDB-Doppelöffnung (migrations.js + indexeddb.js) | Niedrig | Phase 3 |

### Bekannte fachliche Lücken
- Pre-Workout Timing T−75min (1h15) ist untere Grenze laut Studien (1–4h empfohlen) → Kompromiss für praktischen Alltag, bewusst so belassen
- Leucin kann nicht exakt berechnet werden (Open Food Facts liefert keine Aminosäure-Daten) → Schätzwert-Ansatz in Phase 3

---

## 8. Nächste Schritte

**Sofort (vor Phase-2-Ausführung):**
1. Entscheidung über Ausführungsmodus treffen (Subagent-gesteuert vs. Inline)
2. Task 0 ergänzen: LBM als Default + Kommentar mealTemplates + §1.8 Spec

**Phase 2 ausführen** (Plan: `docs/superpowers/plans/2026-06-01-phase-2-pwa-bottomnav.md`):
- 11 Tasks (+ Task 0 = 12)
- Ergebnis: App installierbar auf Homescreen, offline-fähig, Bottom-Navigation

**Nach Phase 2:**
- Phase 3 planen: Tracker, Lebensmittel-Suche, Barcode, `foodsCustom`-Store

---

*Erstellt: 2026-06-01 · Branch: master · Commit-Stand: 1eaad93*
