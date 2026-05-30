# Phase-1-Abschlussbericht: Fundament

**Projekt**: Ernährungs-Dashboard PWA  
**Phase**: 1 von 6  
**Zeitraum**: 2026-05-30  
**Branch**: `phase-1-fundament`  
**Status**: ✅ Abgeschlossen, getestet, auf GitHub gepusht

---

## 1. Umgesetzte Dateien

### Architektur-Entscheidung

Ursprünglich geplant: Babel Standalone + `data-type="module"` (ES Modules)  
Tatsächlich umgesetzt: **htm + native ES Modules** (nach R-01-Risiko-Bestätigung)  
Begründung: Babel Standalone verarbeitete relative Imports in externen Dateien nicht zuverlässig. Das PoC bestätigte das Risiko. Fallback aktiviert: `htm` (500 Bytes) als JSX-Ersatz, `esm.sh` für React-CDN.

### Produktions-Dateien (39)

| Datei | Funktion |
|---|---|
| `ernaehrung.html` | App-Shell (31 Zeilen, kein CDN-Inline mehr) |
| `js/lib.js` | Zentrale Bibliotheks-Exporte: React, htm, idb, createRoot, Hooks |
| `js/version.js` | APP_VERSION + SCHEMA_VERSION (single source of truth) |
| `js/sync/deviceId.js` | Geräte-UUID generieren/lesen (Sync-Vorbereitung) |
| `js/storage/migrations.js` | Schema-Versioning + Migration-Registry (v1: log + week) |
| `js/storage/indexeddb.js` | IndexedDB-Singleton + CRUD für log + week |
| `js/storage/localStorage.js` | Profil / Settings / UiState synchron |
| `js/storage/exportImport.js` | JSON-Export (API-Key immer null) + Import + Versionsprüfung |
| `js/calc/bmr.js` | Katch-McArdle: calcBMR, calcLeanMass |
| `js/calc/macros.js` | calcTDEE, calcMacros, calcProteinTarget (3 Modi), calcGap |
| `js/calc/nutritionLogic.js` | assessDeficit (aktiv) + Stubs für Phase 3 |
| `js/data/mealTemplates.js` | MEAL_TEMPLATES + getMealTemplate() |
| `js/data/tips.js` | POSTMENOPAUSAL_TIPS (5 wissenschaftliche Hinweise) |
| `js/hooks/useProfile.js` | Profil laden/speichern + live berechnete Werte |
| `js/hooks/useSettings.js` | Settings laden/speichern (merge) |
| `js/hooks/useUiState.js` | UI-State laden/speichern (merge) |
| `js/ui/theme.js` | Design-Konstanten: COLORS, FONTS, S (Style-Objekte) |
| `js/ui/MacroBar.js` | Makro-Fortschrittsbalken |
| `js/ui/KcalRing.js` | SVG-Kalorienring |
| `js/ui/Modal.js` | Bottom-Sheet Modal |
| `js/ui/Toast.js` | Toast-Benachrichtigungen (Context + Provider) |
| `js/ui/Navigation.js` | 5-Tab-Navigation (TopTabs, Phase 2: BottomNav) |
| `js/ui/BackupReminderBanner.js` | Banner nach 7+ Tagen ohne Backup |
| `js/tabs/heute/DayTypeSwitch.js` | Trainingstag/Ruhetag + Trainingszeit Toggle |
| `js/tabs/heute/DaySummary.js` | Tagesbilanz-Karte (Ring + Balken) |
| `js/tabs/heute/MealPlanEntry.js` | Einzelne Mahlzeit-Karte |
| `js/tabs/heute/MealPlanList.js` | Mahlzeitenplan-Liste |
| `js/tabs/heute/HeuteTab.js` | Heute-Tab (vollständig) |
| `js/tabs/tracker/TrackerTab.js` | Platzhalter "Phase 3" |
| `js/tabs/rezepte/RezepteTab.js` | 8 Initial-Rezepte als aufklappbare Karten |
| `js/tabs/woche/WeekGrid.js` | 7-Tage-Raster (Grundgerüst) |
| `js/tabs/woche/WocheTab.js` | Woche-Tab Wrapper |
| `js/tabs/profil/ErststartAssistent.js` | 4-Schritt-Wizard (Gewicht/Größe/Alter/KFA) |
| `js/tabs/profil/ProfileEditor.js` | Vollständiger Profil-Editor + Defizit-Warnung |
| `js/tabs/profil/DataManagement.js` | Export / Import / Backup-Erinnerung |
| `js/tabs/profil/SettingsPanel.js` | App-Einstellungen |
| `js/tabs/profil/PostmenopausalInfo.js` | Wissenschaftliche Hinweise (Accordion) |
| `js/tabs/profil/ProfilTab.js` | Profil-Tab (vollständig) |
| `js/app.js` | Einstiegspunkt: Migration → Wizard/App, Tab-Routing |

### Dokumentations- und Test-Dateien (3)

| Datei | Inhalt |
|---|---|
| `docs/implementierungsplan-phase-1.md` | Detaillierter Plan mit Dateien, Funktionen, Testfällen |
| `tests/manual-checklist-phase-1.md` | Smoke-Test-Checkliste (T-00 bis T-11) |
| `docs/phase-1-abschlussbericht.md` | Dieses Dokument |

### Proof-of-Concept-Dateien (5, archiviert in `poc/`)

`poc/index.html`, `poc/js/app.js`, `poc/js/test.js` — erster Babel-Test (bestätigte R-01-Risiko)  
`poc/index-v2.html`, `poc/js/app-v2.js` — htm-Test (bestätigte funktionierende Architektur)

---

## 2. Tatsächlich behobene Bugs

### R-01 — Babel Standalone + ES Modules (Architektur-Wechsel)

**Problem**: `data-type="module"` in Babel Standalone verarbeitete relative Imports nicht korrekt. Erste PoC: MIME-Typ-Fehler (server-seitig, Umlaut im Pfad). Zweite PoC: weißer Bildschirm ohne Fehler.  
**Ursache**: Babel injiziert transpilierten Code als anonymes Inline-Modul. Relative Imports werden gegen die HTML-Seite aufgelöst, nicht die Original-Datei. Fehlermeldungen werden verschluckt.  
**Fix**: Architektur-Wechsel auf `htm` (tagged template literals als JSX-Ersatz) + native `<script type="module">`. Kein Babel mehr nötig.

### R-01b — React-Versions-Konflikt (zwei React-Instanzen)

**Problem**: `import { html } from 'htm/react'` über importmap brachte eine zweite React-Instanz aus esm.sh mit → React-Fehler #31 ("Objects are not valid as a React child").  
**Fix**: `htm` ohne `/react`-Binding importieren, manuell an unsere React-Instanz binden: `const html = htm.bind(React.createElement)`. Alle Imports aus demselben esm.sh-Endpunkt.

### ProfileEditor — Input verliert sofort den Fokus

**Problem**: Jedes Tippen in ein Profil-Feld war unmöglich — nach einem Buchstaben verlor das Input-Feld den Fokus.  
**Ursache**: Die Hilfsfunktion `Field` war innerhalb der `ProfileEditor`-Komponente definiert. React erzeugt bei jedem Re-Render eine neue Funktionsreferenz → sieht es als neuen Komponenten-Typ → unmountet + remountet den Input → Fokus verloren.  
**Fix**: `Field` auf Modul-Ebene verschoben (außerhalb von `ProfileEditor`). `form` und `update` werden als Props übergeben.

### fatPercent — falsche Validierungsgrenzen

**Problem**: `fatPercent` wird intern als Dezimal gespeichert (0.25 = 25%), aber die Input-Validierung hatte `min="15" max="45"`. Der Wert 0.25 war kleiner als min=15 → Browser blockierte Eingabe.  
**Fix**: Korrekte Grenzen für Dezimalformat gesetzt: `min="0.10" max="0.55"`.

### indexeddb.js — potenzielle zirkuläre Abhängigkeit

**Problem**: `indexeddb.js` importierte `CURRENT_SCHEMA_VERSION` aus `migrations.js`, das seinerseits `openDB` importiert. Beide öffnen die Datenbank.  
**Fix**: `indexeddb.js` importiert `SCHEMA_VERSION` direkt aus `version.js` und leitet ihn als lokale Konstante weiter.

### Cursor unsichtbar auf dunklem Hintergrund

**Problem**: Mauszeiger war auf dem dunklen App-Hintergrund schwer sichtbar.  
**Fix**: `caret-color: #c8a96e` für Inputs, explizite `cursor`-Regeln in `ernaehrung.html`.

---

## 3. Bekannte offene Probleme

### P1 — fatPercent-Anzeige nicht benutzerfreundlich (Niedrig)

Der Fettanteil wird als Dezimalwert (0.25) im Editor angezeigt statt als Prozent (25%). Nutzerführung ist der Hinweis-Text "z.B. 0.25 = 25%". UX-Verbesserung steht aus: Eingabe als Prozent, intern als Dezimal speichern.

### P2 — Tagesbilanz zeigt immer 0 (Erwartet, Phase 3)

Die Tagesbilanz im Heute-Tab zeigt 0 gegessene Kalorien, da der Tracker in Phase 3 kommt. Das ist kein Bug, sondern dokumentierter Platzhalter.

### P3 — Wochentag-Markierung im WeekGrid ungenau (Niedrig)

Die Berechnung `((i + 1) % 7) === (today % 7)` für den heutigen Tag im 7-Tage-Raster ist eine Näherung. Kann bei bestimmten Wochentagen falsch markieren. Wird in Phase 3 zusammen mit echten Wochenprotokoll-Daten korrigiert.

### P4 — activeTab nach Wizard-Abschluss (Kosmetisch)

Nach dem Erststart-Wizard springt die App auf den Heute-Tab, aber `ernaehrung_ui_state.activeTab` speichert den letzten aktiven Tab. Bei erneutem Laden kann `profil` als aktiver Tab erscheinen. Keine Datenverlust, nur leichte UX-Inkonsistenz.

---

## 4. Technische Schulden

### TS-01 — Keine automatisierten Tests (Mittel)

Phase 1 wird ausschließlich manuell getestet. Es gibt keine Unit-Tests für `calc/`-Funktionen (bmr, macros, nutritionLogic), obwohl diese deterministisch und einfach testbar wären. Empfehlung: vor Phase 3 Vitest für die `calc/`-Schicht einrichten.

### TS-02 — Kein React Error Boundary (Mittel)

Ein JavaScript-Fehler in einer Komponente führt zu einer komplett weißen Seite ohne hilfreiche Fehlermeldung. Ein Error Boundary um die App würde stattdessen einen lesbaren Fehler-Bildschirm zeigen. Aufwand: ~20 Zeilen.

### TS-03 — esm.sh CDN-Abhängigkeit beim Erstladen (Niedrig nach Phase 2)

Beim allerersten Aufruf ohne Internet-Verbindung sind React, htm und idb nicht verfügbar (müssen von esm.sh geladen werden). Ab Phase 2 werden alle CDN-Ressourcen durch den Service Worker gecacht → dann kein Problem mehr.

### TS-04 — fatPercent intern als Dezimal, extern als Dezimal angezeigt (Niedrig)

Inkonsistenz zwischen Speicherformat (0.25) und erwarteter Nutzereingabe (25%). Sollte vor Phase 3 bereinigt werden: im UI immer als %-Wert, Konvertierung beim Speichern/Laden.

### TS-05 — IndexedDB-Doppelöffnung (Niedrig)

`migrations.js` und `indexeddb.js` öffnen beide die Datenbank über `openDB`. Das `idb`-Paket dedupliziert Verbindungen, aber der Upgrade-Handler wird in beiden Dateien definiert. Könnten bei Schema-Bumps zu Konflikten führen. Langfristig: `openDb()` und Migration-Schema an einen einzigen Ort zentralisieren.

### TS-06 — Toast außerhalb Provider schlägt lautlos fehl (Niedrig)

`useToast()` gibt `null` zurück wenn es außerhalb des `ToastProvider` aufgerufen wird. `ProfilTab` prüft `if (showToast)` — das verhindert Fehler, aber ohne Feedback für den Entwickler.

---

## 5. Empfehlungen vor Phase 2

### 🔴 Vor Phase 2 — Pflicht

**1. fatPercent-Anzeige reparieren**  
Kleine Änderung in `ProfileEditor.js`: beim Laden mit 100 multiplizieren, beim Speichern durch 100 dividieren. So sieht die Nutzerin "25" statt "0.25". Aufwand: ~10 Zeilen.

**2. Phase-1-Branch in Master mergen**  
`phase-1-fundament` sollte vor Phase 2 in `master` gemergt werden. Phase 2 baut auf Phase 1 auf — ein sauberer `master` als gemeinsame Basis.

**3. Error Boundary hinzufügen**  
Vor dem Einbinden weiterer komplexer Features (Phase 3: Barcode-Scanner, IndexedDB-Operationen) sollte ein Error Boundary die App absichern. Verhindert "weiße Seite" bei unerwarteten Fehlern.

### 🟡 Vor Phase 2 — Empfohlen

**4. README.md erstellen**  
Kurze Beschreibung: Was ist die App, wie lokal testen, wie auf GitHub Pages deployen. Macht das Repo für Dritte verständlich.

**5. CDN-Versionen in lib.js fixieren**  
Aktuelle Imports: `esm.sh/react@18.2.0`, `esm.sh/htm@3.1.1`, `idb@8`. Diese Versionen sind bereits fixiert — gut so. Aber vor jedem Phase-Release prüfen ob Breaking Changes vorliegen.

**6. `fatPercent`-Default in ErststartAssistent prüfen**  
Aktuell wird `fatPercent: 0.25` als Default gesetzt. Nach der Profil-Editor-Korrektur muss auch der Assistent `bodyFat`-Eingabe korrekt zu `fatPercent` umrechnen. Heute: keine explizite Berechnung im Wizard.

### 🟢 Mittelfristig (Phase 2–3)

**7. Vitest für `calc/`-Schicht**  
`bmr.js`, `macros.js` und `nutritionLogic.js` sind pure Funktionen — ideal für Unit-Tests. Referenzwerte aus dem Übergabedokument können als Testfälle dienen (BMR 1.556 kcal bei LBM 54,92 kg etc.).

**8. GitHub Pages erst nach Phase 2 aktivieren**  
Phase 2 bringt den Service Worker und das Manifest. Erst dann macht GitHub Pages Sinn — die App ist dann wirklich installierbar und offline-fähig.

---

## Zusammenfassung

| Kennzahl | Wert |
|---|---|
| Dateien erstellt/geändert | 47 |
| JavaScript-Zeilen (neu) | ~2.400 |
| Behobene Bugs | 6 |
| Bekannte offene Probleme | 4 |
| Technische Schulden | 6 |
| Test-Ergebnis | ✅ App läuft, Daten persistieren, kein kritischer Fehler |
| Architektur-Entscheidung | htm + native ES Modules (kein Babel, kein Build) |
| Nächster Schritt | Phase 2: PWA, Service Worker, App-Icon, BottomNav |

---

*Bericht erstellt: 2026-05-30 · Phase-1-Branch: `phase-1-fundament` · Commit: `1e7dbaf`*
