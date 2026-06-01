# Übergabedokument — Ernährungs-Dashboard PWA
**Zuletzt aktualisiert:** 2026-06-01  
**Stand:** Phase 2 abgeschlossen · Phase 3 als nächstes  
**App-URL:** https://smeurer-ai.github.io/Ernaehrungs-Dashboard/ernaehrung.html  
**Repository:** https://github.com/smeurer-ai/Ernaehrungs-Dashboard  
**Branch:** `master` · Letzter Commit: `eca4188`  
**APP_VERSION:** `1.1.0` · **SCHEMA_VERSION:** `1`

---

## 1. Projektstatus

| Phase | Status | Inhalt |
|---|---|---|
| **Phase 1 — Fundament** | ✅ Abgeschlossen | Multi-File-Architektur, Profil, localStorage/IndexedDB, Export/Import, Heute-Tab |
| **Phase 2 — PWA + Nav** | ✅ Abgeschlossen | Service Worker, Manifest, Icons, Bottom-Navigation, UpdateBanner |
| **Phase 3 — Tracker** | ⏳ Als nächstes | Lebensmittel-Suche (Open Food Facts), Barcode, eigene Foods, Tagesbuch-Einträge |
| **Phase 4 — Rezepte** | ⏳ Ausstehend | Vollständige Rezeptdatenbank mit Schritten, eigene Rezepte |
| **Phase 5 — Vorschläge** | ⏳ Ausstehend | Kühlschrank, Matching, proteinpriorisierte Lücken-Vorschläge |
| **Phase 6 — AI** | ⏳ Ausstehend | Claude Vision, Foto-Rezepterkennung (nur mit API-Key) |

### Was die App aktuell kann

- ✅ Installierbar als PWA (Manifest + Service Worker + Icons)
- ✅ **Offline-fähig** (Service Worker cached alle lokalen Assets + CDN)
- ✅ Bottom-Navigation (5 Tabs mit Emoji-Icons, goldene Akzentlinie für aktiven Tab)
- ✅ Update-Benachrichtigung ("App-Update verfügbar — Jetzt laden")
- ✅ Mahlzeitenplan (Trainingstag/Ruhetag) mit dynamischer Trainingszeit
- ✅ Drei Trainingsszenarien (Früh-/Mittel-/Spättraining, automatisch erkannt)
- ✅ Profil editierbar: Gewicht, Körperfett, Alter, Defizit, Proteinfaktor
- ✅ BMR/TDEE (Katch-McArdle), drei Protein-Berechnungsmodi
- ✅ Defizit-Warnung (safe/moderate/aggressive/dangerous)
- ✅ Export/Import JSON, Backup-Erinnerung
- ✅ 8 Initial-Rezepte, Wochenübersicht (Grundgerüst), Postmenopausale Hinweise
- ❌ Lebensmittel tracken (Phase 3)
- ❌ Barcode-Scanner (Phase 3)

---

## 2. Architektur-Kurzreferenz

```
ernaehrung.html          ← PWA-Shell (manifest, apple-touch-icon, kein Build)
  └── js/app.js          ← React-Root, migrations, SW-Registration, UpdateBanner
       ├── js/lib.js     ← React 18 + htm + idb (alle von esm.sh/jsdelivr)
       ├── js/calc/      ← reine Berechnungsfunktionen (pure functions)
       ├── js/storage/   ← localStorage (Profil/Settings) + IndexedDB (log/week)
       ├── js/hooks/     ← React-Adapter für Storage
       ├── js/pwa/       ← registerServiceWorker.js (Phase 2)
       ├── js/ui/        ← Theme + UI-Komponenten + UpdateBanner
       ├── js/data/      ← mealTemplates, tips
       └── js/tabs/      ← heute, tracker, rezepte, woche, profil
service-worker.js        ← Cache-Logik (Projekt-Root, kein /js Unterordner)
manifest.json            ← PWA-Manifest
icons/                   ← 192, 512, maskable PNGs
```

### CDN-Abhängigkeiten (fest versioniert in js/lib.js)
```javascript
import React        from 'https://esm.sh/react@18.2.0';
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client';
import htm          from 'https://esm.sh/htm@3.1.1';
import { openDB }   from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';
```

### Wichtige Konventionen
- **htm statt JSX:** `` html`<div>...</div>` `` — kein Babel, kein Build
- **Keine default exports:** immer `export function`, `export const`
- **Styles inline:** über `S.xyz` aus `js/ui/theme.js`
- **API-Key:** niemals automatisch exportieren (fixe Regel)
- **Makro-Proportionen:** kP/pP/cP/fP müssen pro Szenario zu 1,00 summieren

---

## 3. Versionierungs-Regel (bindend)

Bei **jeder** Änderung an JS-Dateien oder neuem Feature:
1. `APP_VERSION` in `js/version.js` hochzählen
2. `APP_VERSION` in `service-worker.js` **synchron** anpassen (beide Dateien!)
3. Neue Dateien in `LOCAL_ASSETS`-Array in `service-worker.js` eintragen

Wenn diese Regel verletzt wird, laden Nutzer veraltete gecachte Versionen.

---

## 4. Storage-Aufteilung

| Was | Wo | Schlüssel / Store |
|---|---|---|
| Profil | localStorage | `ernaehrung_profile` |
| Settings | localStorage | `ernaehrung_settings` |
| UI-Zustand | localStorage | `ernaehrung_ui_state` |
| Schema-Version | localStorage | `ernaehrung_schema_version` |
| Esstagebuch | IndexedDB | Store `log` |
| Wochenprotokoll | IndexedDB | Store `week` |
| (Phase 3) Eigene Lebensmittel | IndexedDB | Store `foodsCustom` |
| (Phase 3) Favoriten-Mahlzeiten | IndexedDB | Store `meals` |

### Schema-Versionsplan

| Version | Phase | Neue Stores |
|---|---|---|
| **1** (aktuell) | Phase 1 | `log`, `week` |
| 2 | Phase 3 | `foodsCustom`, `meals` |
| 3 | Phase 4 | `recipesCustom`, `recipePhotos` |
| 4 | Phase 5 | `fridge` |
| 5 | Phase 6 | `apiCache` |

---

## 5. Ernährungskonzept — Aktuelle Werte

### Berechnungsmethode
- **BMR:** Katch-McArdle (`370 + 21.6 × LBM`)
- **TDEE:** `BMR × Aktivitätsfaktor`
- **Protein-Standard:** `perKgLeanMass` mit 2,0 g/kg (seit Session 2026-06-01)
- **Defizit-Schwellen:** safe ≤17%, moderate ≤22%, aggressive ≤30%, dangerous >30%

### Mahlzeiten-Timing (Trainingstag)
- **Pre-Workout:** T − 1h15min
- **Post-Workout:** T + 1h30min (Training ~1h + Heimfahrt + Zubereitung)
- **Drei Szenarien:** Frühtraining (Pre < 10:30), Mitteltraining (Pre 10:30–13:00), Spättraining (Pre ≥ 13:00)

### Postmenopausale Besonderheiten (in mealTemplates.js)
- Frühstück = größte Mahlzeit (Kalorienfrontloading → Insulinsensitivität ↑)
- Pre-Workout KH: 28% (nicht 40%) — Frauen verbrennen mehr Fett beim Training
- Casein-Hinweis: 30–40g ~30min vor dem Schlafen
- Leucin-Hinweis: ~3g pro Mahlzeit für MPS-Trigger

---

## 6. Architekturentscheidungen (bindend für alle Phasen)

### 6.1 Protein-Standard: LBM
Default `proteinTargetMode = 'perKgLeanMass'`, `proteinPerKg = 2.0`. Begründung: bei hohem KFA (>40%) liefert Körpergewicht-Berechnung unrealistisch hohe Proteinziele.

### 6.2 Flexible Mahlzeitenanzahl
Die Berechnungslogik (`distributeMacrosPerMeal`) ist generisch. 3/4/5 Mahlzeiten = neues Template-Array mit korrekten Summen. Keine Konfigurationsoption nötig (YAGNI).

### 6.3 Leucin-Felder in TrackedFood (ab Phase 3)
```typescript
interface TrackedFood {
  // ... bestehende Felder ...
  leucineEstimateG?: number;      // ~8-9% von p (tierisch), ~6% (pflanzlich)
  proteinQualityScore?: number;   // 0–100
  mpsTriggered?: boolean;         // true wenn leucineEstimateG >= 2.5g
}
```
Optional → keine Migration. Keine exakten Werte möglich (Open Food Facts hat keine AS-Daten).

### 6.4 Produktleitfragen (§1.8 Spec — beide müssen Ja sein)
1. „Hilft diese Funktion einer postmenopausalen Frau, Fett zu verlieren und Muskeln zu erhalten/aufzubauen?"
2. „Hilft diese Funktion, die Muskelproteinsynthese (MPS) im Alltag besser zu erreichen?"

### 6.5 Kein Super-Interface für Mahlzeiten
`MealWithMacros` (Plan-Daten) und `TrackedFood` (Log-Daten) bleiben getrennt. Unterschiedliche Lebenszyklen.

---

## 7. Offene Punkte & Technische Schulden

### Vor Phase 3 — Pflicht
- [ ] **Vitest für `calc/`-Schicht einrichten** (TS-01) — pure functions, ideal für Unit-Tests
- [ ] **Phase-2-Smoke-Tests durchführen** — `tests/manual-checklist-phase-2.md`

### Bekannte technische Schulden
| ID | Beschreibung | Wann |
|---|---|---|
| TS-01 | Keine Unit-Tests für `calc/` | Vor Phase 3 |
| TS-05 | IndexedDB-Doppelöffnung (migrations + indexeddb) | Phase 3 |
| TS-06 | Toast außerhalb Provider schlägt lautlos fehl | Phase 3 |
| TS-07 | Google Fonts nicht offline-fähig (System-Font-Fallback) | Phase 3+ optional |

### Bekannte fachliche Einschränkungen
- Pre-Workout T−75min ist untere Grenze laut Studien (1–4h empfohlen) — bewusster Alltagskompromiss
- Leucin-Berechnung ist immer Schätzwert (keine exakten AS-Daten verfügbar)

---

## 8. Nächste Schritte (Phase 3)

**Phase 3 — Tracker** bringt:
- Open Food Facts API (Lebensmittel-Suche)
- Barcode-Scanner (html5-qrcode)
- Eigene Lebensmittel anlegen (`foodsCustom`-Store, Schema-Version → 2)
- Favoriten-Mahlzeiten (`meals`-Store)
- Tagesbuch-Einträge (TrackerTab wird funktionsfähig)
- Protein-Rating pro Mahlzeit (`rateMealProtein` in nutritionLogic.js — jetzt noch Stub)
- TrackedFood mit optionalen Leucin-Feldern anlegen

**Schema-Bump auf Version 2** nötig (neue Stores foodsCustom + meals).

---

## 9. Dokumentenverzeichnis

| Datei | Inhalt |
|---|---|
| `docs/projekt-spezifikation.md` | Vollständige Spezifikation (alle Phasen, Datenmodell, API) |
| `docs/implementierungsplan-phase-1.md` | Detaillierter Phase-1-Plan |
| `docs/phase-1-abschlussbericht.md` | Phase-1-Abschlussbericht |
| `docs/superpowers/plans/2026-06-01-phase-2-pwa-bottomnav.md` | Phase-2-Implementierungsplan |
| `docs/phase-2-abschlussbericht.md` | Phase-2-Abschlussbericht |
| `docs/uebergabedokument-aktuell.md` | **Dieses Dokument** — immer aktueller Stand |
| `docs/uebergabedokument-session-2026-06-01.md` | Session-Übergabe vom 2026-06-01 |
| `Ernaehrungskonzept_fuer_Coach.md` | Ernährungskonzept für Ernährungscoach |
| `tests/manual-checklist-phase-1.md` | Phase-1-Smoke-Tests |
| `tests/manual-checklist-phase-2.md` | Phase-2-Smoke-Tests (⏳ ausstehend) |

---

*Zuletzt aktualisiert: 2026-06-01 · APP_VERSION 1.1.0 · Commit eca4188*
