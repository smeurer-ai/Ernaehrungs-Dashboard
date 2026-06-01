# Projekt-Spezifikation: Ernährungs-Dashboard PWA

**Version**: 1.2
**Datum**: 2026-05-30
**Eigentümerin**: Stephanie Meurer
**Status**: Design abgeschlossen, Implementierung Phase 1 ausstehend

**Änderungen 1.0 → 1.1**: Multi-File-Architektur statt Single-HTML; IndexedDB als Hauptspeicher; Schema-Migrations-Konzept; PWA-Cache-Versionierung; Phase-1-Fokus (eine Phase nach der anderen stabilisieren); API-Key-Härtung (nie automatischer Export).

**Änderungen 1.1 → 1.2**: Zielgruppe auf postmenopausale Frauen geschärft (Fettabbau + Muskelerhalt/-aufbau + Krafttraining) — kein generischer Kalorientracker; erweiterte Ernährungslogik (Proteinverteilung, anabole Resistenz, Leucin-Trigger, Muskelerhalt im Defizit, Trainings-/Ruhetag-Differenzierung); neue Profil-/Settings-Felder; Cloud-Strategie mit drei Betriebsarten (Local / Personal Sync / User Cloud) als Zukunftspfad; Sync-Vorbereitung im Datenmodell (id, createdAt, updatedAt, deletedAt, deviceId); neue Designmaxime (Postmenopause-Litmus-Test). **Phase 1 bleibt cloud-frei** — nur Datenmodell-Vorbereitung.

---

## Inhaltsverzeichnis

1. [PRD — Produktbeschreibung](#1-prd--produktbeschreibung)
2. [Funktionsliste](#2-funktionsliste)
3. [Architekturübersicht](#3-architekturübersicht)
4. [Datenbankschema](#4-datenbankschema)
5. [API-Konzept](#5-api-konzept)
6. [Verzeichnisstruktur](#6-verzeichnisstruktur)
7. [Phasen-Roadmap](#7-phasen-roadmap)
8. [Designentscheidungen mit Begründung](#8-designentscheidungen-mit-begründung)

---

## 1. PRD — Produktbeschreibung

### 1.1 Vision

Eine spezialisierte, smartphonefähige Ernährungs-App **für postmenopausale Frauen mit dem Ziel Fettabbau bei gleichzeitigem Muskelerhalt und Muskelaufbau durch Krafttraining**. Die App gleicht den Tagesplan live mit der tatsächlichen Aufnahme ab, bewertet die **Proteinverteilung und Tagesstruktur** (nicht nur die Gesamtkalorien) und gibt intelligente, proteinpriorisierte Vorschläge — basierend auf eigenem Vorrat und Kühlschrank-Inhalt.

**Die App ist ausdrücklich KEIN generischer Kalorientracker.** Ihre Ernährungslogik ist auf die physiologischen Besonderheiten postmenopausaler Frauen ausgerichtet (anabole Resistenz, Leucin-Schwelle, Insulinsensitivität, metabolische Adaptation).

### 1.2 Zielgruppe

**Primäre Zielgruppe**: Postmenopausale Frauen mit dem Ziel:
- **Fettabbau**
- **Muskelerhalt**
- **Muskelaufbau**
- **Krafttraining** als zentrale Trainingsform

| Rolle | Beschreibung |
|---|---|
| **Primär-Nutzerin** | Stephanie Meurer (Heilpraktikerin, 59 J., postmenopausal, Krafttraining) — tägliche Eigennutzung, Referenz-Persona der Zielgruppe |
| **Sekundär** | Andere postmenopausale Frauen (z.B. Stephanies Klientinnen), denen die App weitergegeben wird — eigenes Profil, eigene Daten, dieselbe spezialisierte Logik |

**Nicht** die Zielgruppe: Männer, prämenopausale Frauen, Ausdauer-fokussierte Sportler, Menschen ohne Krafttraining, generische Diät-Anwender. Die App darf für diese Gruppen funktionieren, wird aber **nicht** für sie optimiert oder erweitert.

### 1.3 Problem

Bestehende Tracker-Apps (MyFitnessPal etc.) sind generisch, datenschutzkritisch, abo-basiert und kennen die postmenopausale Stoffwechsellage nicht. Sie zählen Kalorien, ignorieren aber Proteinverteilung, Leucin-Schwellen und die anabole Resistenz nach der Menopause. Das aktuelle eigene Tool ist nur am Desktop gut nutzbar, hat ein hardcoded Profil und keine intelligenten Vorschläge.

### 1.4 Goals

- **Postmenopause-spezialisiert**: Ernährungslogik richtet sich an den Besonderheiten postmenopausaler Frauen aus (siehe §1.8 Designmaxime)
- **Proteinfokus**: Bewertung der Proteinverteilung pro Mahlzeit und über den Tag, nicht nur der Gesamtkalorien
- **Muskelschutz im Defizit**: Warnung bei zu aggressivem Kaloriendefizit, das Muskelmasse gefährdet
- **Smartphone-First**: PWA, installierbar als Icon, offline-fähig, Vollbild
- **Schnelle Eingabe**: Barcode-Scan, Favoriten-Mahlzeiten, eigene Lebensmittel
- **Intelligente Unterstützung**: proteinpriorisierte Vorschläge bei Tagesziel-Lücken aus Notvorrat + Kühlschrank
- **Rezept-Datenbank**: 30+ Rezepte mit Zubereitung, eigene Rezepte hinzufügbar, Foto-Erkennung via Claude AI
- **Personalisierbar**: Profil komplett editierbar in der App, Export/Import zur Weitergabe an andere
- **Wissenschaftlich fundiert**: Postmenopause-Logik (anabole Resistenz, Leucin-Trigger, Casein abends, Omega-3, metabolische Adaptation) ist Kern, nicht Beiwerk

### 1.5 Non-Goals

- **Kein generischer Kalorientracker** — die App ist auf eine eng definierte Zielgruppe und ihr Ziel spezialisiert
- **Keine Optimierung für andere Zielgruppen** — Männer, prämenopausale Frauen, Ausdauersportler werden nicht bedient
- **Kein App Store** — Distribution ausschließlich via GitHub Pages
- **Keine Coach/Community-Features** — kein soziales Netzwerk, kein Forum
- **Kein nativer Code** (Swift/Kotlin) — bleibt Web-Technologie
- **Cloud ist optionaler Zukunftspfad, kein Phase-1-Ziel** — siehe §3.9. Standard bleibt Local-Only. Cloud-Sync (Supabase) ist eine spätere, opt-in Betriebsart, kein Pflichtbestandteil.

### 1.6 Erfolgskriterien

- Stephanie nutzt die App täglich auf dem Smartphone ohne wieder auf Desktop wechseln zu müssen
- Eingabezeit pro Mahlzeit < 30 Sekunden (Barcode oder Favorit)
- Die App bewertet die **Proteinverteilung über den Tag**, nicht nur die Gesamtkalorien
- Proteinlücken (besonders abends) werden aktiv erkannt und mit proteinpriorisierten Vorschlägen versehen
- Ein zu aggressives Defizit wird erkannt und gewarnt (Muskelschutz)
- Mind. 50 eigene Rezepte sind in der Datenbank (eigene + Foto-Scan)
- App kann ohne Code-Anpassung an andere postmenopausale Frauen weitergegeben werden

### 1.7 Constraints

- **Tech**: HTML + React via CDN, **mehrere statische JS-Dateien als ES Modules** (kein Build-Prozess, kein npm, kein Bundler), läuft auf GitHub Pages
- **Datenhaltung Phase 1**: IndexedDB als Hauptspeicher (Log, Rezepte, Lebensmittel, Mahlzeiten, Kühlschrank, Fotos) + localStorage nur für Profil, Settings und UI-Zustand. Kein Backend, kein Server, **keine Cloud**.
- **Datenhaltung später (optional)**: Drei Betriebsarten (Local / Personal Sync via Supabase / User Cloud) — siehe §3.9. Das Datenmodell wird **ab Phase 1** sync-vorbereitet (§4.6), aber Cloud-Code kommt erst in einer späteren Phase.
- **Externe APIs**: Open Food Facts (Lebensmitteldatenbank, kostenlos) + Claude API (Rezept-Foto-Erkennung, vom Nutzer selbst bezahlt, **strikt optional** — App muss ohne API-Key voll funktionieren). Supabase erst ab Sync-Phase.
- **Browser-Kompatibilität**: Aktuelle Chrome, Safari, Edge, Firefox (alle PWA-fähig, alle ES-Module-fähig, alle IndexedDB-fähig)
- **Migrationssicherheit**: Jede Schema-Änderung muss bestehende Nutzerdaten verlustfrei migrieren; jede Phase darf vorherige Daten nicht zerstören
- **PWA-Cache-Versionierung**: Klare Versions-Strings im Service Worker, alte Caches werden bei Aktivierung gelöscht

### 1.8 Designmaxime (Postmenopause-Litmus-Test)

**Jede zukünftige Funktion muss diese Frage beantworten können:**

> *"Hilft diese Funktion einer postmenopausalen Frau dabei, Fett zu verlieren und gleichzeitig Muskulatur zu erhalten oder aufzubauen?"*

**Frage 2 (MPS-Fokus):**
> *"Hilft diese Funktion dabei, die Muskelproteinsynthese (MPS) im Alltag besser zu erreichen?"*

Wenn **beide** Fragen mit Nein beantwortet werden → Funktion gehört nicht in den Kern.

- Lautet die Antwort **nein**, gehört die Funktion **nicht in den Kern der App**.
- Diese Maxime ist bindend für alle Feature-Entscheidungen in allen Phasen.
- Bei Konflikten zwischen "wäre nett zu haben" und der Maxime gewinnt die Maxime.
- Generische Tracker-Features (z.B. Punkte-Systeme, Streak-Gamification, Makro-Counting ohne Proteinkontext) werden bewusst **nicht** aufgenommen, wenn sie diesen Test nicht bestehen.

---

## 2. Funktionsliste

Status-Legende: ✅ vorhanden im aktuellen Tool · 🆕 neu in dieser Erweiterung · 🔄 wird überarbeitet

| # | Funktion | Status | Phase | Beschreibung |
|---|---|---|---|---|
| 1 | BMR/TDEE-Berechnung (Katch-McArdle) | ✅ | — | Berechnet Grundumsatz und Tagesbedarf aus Profildaten |
| 2 | Makro-Berechnung (Protein-priorisiert) | ✅ | — | 1,9 g Protein/kg, 25 % Fett, Rest KH; Defizit konfigurierbar |
| 3 | Mahlzeitenplan Trainingstag 08:00 | ✅ | — | Pre-Workout, Post-Workout, Mittag, Abend |
| 4 | Mahlzeitenplan Trainingstag 14:30 | ✅ | — | Frühstück, Pre-Workout, Post-Workout, Abend |
| 5 | Mahlzeitenplan Ruhetag | ✅ | — | Frühstück, Mittag, Snack, Abend |
| 6 | Food-Tracker mit Open Food Facts Suche | ✅ | — | Lebensmittel suchen, Gramm eingeben, Tagesbilanz |
| 7 | Initial-Rezepte mit Zutaten + Tipp | ✅ | — | 8 Rezepte, derzeit ohne Zubereitungsschritte |
| 8 | Wochenprotokoll mit Adaptations-Check | ✅ | — | 7-Tage-Sicht, ab Woche 4 automatische Prüfung |
| 9 | Postmenopausale Hinweise im Profil | ✅ | — | 5 wissenschaftliche Hinweise als Lesematerial |
| 10 | **Multi-File-Architektur** (ES Modules statt Single-HTML) | 🆕🔄 | 1 | Quellcode in `js/`-Ordner aufgeteilt, keine Build-Schritte |
| 11 | **Profil komplett editierbar in App** | 🆕🔄 | 1 | Gewicht, Alter, KFA, Defizit, Proteinfaktor, Name |
| 12 | **Datenpersistenz** (localStorage für Profil/Settings, IndexedDB für Rest) | 🆕 | 1 | Alle Daten überleben Browser-Neustart, IndexedDB-Stores ab Tag 1 angelegt |
| 13 | **Schema-Versionierung + Migrations-Registry** | 🆕 | 1 | Jede Schema-Änderung migriert alte Daten verlustfrei |
| 14 | **Daten-Export/Import als JSON** (ohne API-Key) | 🆕 | 1 | Ein-Klick-Backup, Wiederherstellung auf neuem Gerät |
| 15 | **Backup-Erinnerung** | 🆕 | 1 | Hinweis nach 7+ Tagen ohne Export |
| 16 | **PWA-Installation** (Manifest, Service Worker mit Versions-Logik) | 🆕 | 2 | App-Icon auf Homescreen, Vollbild, offline, alte Caches werden bei Update gelöscht |
| 17 | **Bottom-Navigation auf Mobile** | 🆕🔄 | 2 | 5 Tabs am unteren Rand statt oben |
| 18 | **Offline-Modus** | 🆕 | 2 | App + gecachte Open-Food-Facts-Daten ohne Internet |
| 19 | **Update-Benachrichtigung** | 🆕 | 2 | Hinweis "App-Update verfügbar" beim Erkennen neuer Version |
| 20 | **App-Icon** | 🆕 | 2 | 192×192 + 512×512 PNG, App-Design (dunkel, gold) |
| 21 | **Favoriten-Mahlzeiten** (Kombi-Lebensmittel) | 🆕 | 3 | Mehrere Lebensmittel zu einer Mahlzeit bündeln, 1-Klick-Eintrag |
| 22 | **Eigene Lebensmittel anlegen** | 🆕 | 3 | Name, Marke, Barcode, Makros/100g, Notvorrat-Tag |
| 23 | **Notvorrat-Markierung** | 🆕 | 3 | Lebensmittel mit ⭐ als "Notvorrat" markieren |
| 24 | **Barcode-Scanner** (Browser-Kamera) | 🆕 | 3 | Scan → Open Food Facts → wenn unbekannt: Maske mit vorausgefülltem Code |
| 25 | **Rezepte mit Zubereitungsschritten** | 🔄 | 4 | Bestehende 8 Rezepte um Steps erweitern |
| 26 | **Erweiterte Rezeptdatenbank** (~30 zusätzliche) | 🆕 | 4 | Initial-Datenbank ausgebaut, alle mit Schritten + Hauptzutaten-Tags |
| 27 | **Eigene Rezepte manuell anlegen** | 🆕 | 4 | Name, Mahlzeit-Tag, Zutaten, Schritte, Hauptzutat-Flag |
| 28 | **Kühlschrank-Verwaltung im Tracker-Tab** | 🆕 | 5 | Eingabe aktueller Vorräte (mit/ohne Mengenangabe), als Sub-Sektion im Tracker |
| 29 | **Rezept-Matching aus Kühlschrank** | 🆕 | 5 | Filter im Rezepte-Tab "Nur Kühlschrank-passend" |
| 30 | **Smarte Vorschläge bei Tagesziel-Lücke** | 🆕 | 5 | Heute-Tab zeigt ab 17 Uhr Lebensmittel/Mahlzeiten/Rezepte, die fehlende Makros füllen |
| 31 | **Notvorrat-Priorisierung in Vorschlägen** | 🆕 | 5 | Notvorrat-Items + Kühlschrank-Items werden bevorzugt |
| 32 | **Claude API-Key Management** | 🆕 | 6 | Eingabe im Profil, lokal gespeichert, **niemals automatisch exportiert** |
| 33 | **Rezept-Foto-Erkennung via Claude Vision** | 🆕 | 6 | Foto → strukturierte Extraktion → Edit-Vorschau → Speichern, lazy-loaded |
| 34 | **Original-Foto-Anhang am Rezept** | 🆕 | 6 | Komprimiertes JPEG (~300 KB) in IndexedDB |
| 35 | **Auto-Makro-Summierung aus Zutaten** | 🆕 | 6 | Bekannte Zutaten → Makros automatisch, unbekannte → Nachfrage |
| 36 | **AI-Funktionen strikt feature-gated** | 🆕 | 6 | Ohne Key: keine UI, keine Buttons, keine Network-Requests, kein Code-Load |
| | **— Ernährungslogik: Postmenopause-Kern —** | | | |
| 37 | **Warnung bei zu aggressivem Kaloriendefizit** | 🆕 | 1 | Defizit, das Muskelmasse gefährdet (Schwellwert relativ zu BMR/LBM), wird im Profil-Editor markiert |
| 38 | **Proteinziel-Modus** (`proteinTargetMode`) | 🆕 | 1 | Berechnung des Proteinziels nach gewähltem Modus (z.B. pro kg KG, pro kg LBM, fester Wert) |
| 39 | **Bewertung der Proteinverteilung pro Mahlzeit** | 🆕 | 3 | Jede Mahlzeit wird gegen Leucin-Schwelle/Zielprotein bewertet (genug / grenzwertig / zu wenig) |
| 40 | **Hinweis bei Hauptmahlzeit mit zu wenig hochwertigem Protein** | 🆕 | 3 | Markierung wenn Hauptmahlzeit unter Schwellwert für MPS-Stimulation liegt |
| 41 | **Bewertung der Tagesstruktur** (nicht nur Gesamtkalorien) | 🆕 | 3 | Prüft Verteilung Protein/KH über den Tag, Trainings-/Ruhetag-Logik, nicht nur Tagessummen |
| 42 | **Proteinlücken am Abend priorisiert anzeigen** | 🆕 | 5 | Abend-Casein-Lücke wird besonders hervorgehoben (nächtliche Regeneration) |
| 43 | **Proteinpriorisierte Vorschlagslogik** | 🆕 | 5 | Vorschläge bei Lücken bevorzugen proteinreiche, leucinstarke Optionen vor reinen Kalorien-Füllern |

---

## 3. Architekturübersicht

### 3.1 Tech-Stack

| Schicht | Technologie | Begründung |
|---|---|---|
| **UI** | React 18 (via CDN, UMD-Build, als Global `window.React`) | Vertraut, bewährt, läuft direkt im Browser |
| **JSX-Transpilation** | Babel-Standalone mit `data-type="module"` für ES Modules | Erlaubt JSX in mehreren `.js`-Dateien ohne Bundler — siehe 3.6 |
| **Modul-System** | Native ES Modules (`import`/`export`), statisch von GitHub Pages ausgeliefert | Mehrere Dateien ohne Build-Prozess |
| **Styling** | Inline CSS-Konstanten + zentrale Theme-Datei `js/ui/theme.js` | Kein PostCSS/Tailwind nötig |
| **State** | React Hooks (useState, useEffect, useReducer) + Custom Hooks pro Datenbereich | Standard, kein Redux/Zustand für die Größe nötig |
| **Persistenz (Hauptspeicher)** | IndexedDB via [idb](https://github.com/jakearchibald/idb) (ESM-Import) | Praktisch unbegrenzter Speicher, asynchron, mit nativer Schema-Versionierung |
| **Persistenz (Settings/Profil)** | localStorage, JSON-Blob unter einem Versions-Key | Synchron, klein, ausreichend für selten geänderte Daten |
| **Barcode-Scan** | `html5-qrcode` (ESM-Import) | Browser-Kamera-API, unterstützt EAN/UPC/QR |
| **Bild-Verarbeitung** | Browser-eigene `canvas` API für JPEG-Kompression | Kein zusätzliches Paket nötig |
| **PWA** | Manifest + Service Worker (Vanilla JS) mit versionierter Cache-Strategie | Standard-Web-Plattform, klare Update-Logik (siehe 3.5) |
| **Externe Daten** | Open Food Facts REST API + Claude API | Offizielle APIs, gut dokumentiert |
| **Hosting** | GitHub Pages | Kostenlos, HTTPS automatisch (Pflicht für Kamera-Zugriff + Service Worker) |

### 3.2 Komponenten-Übersicht (Logische Sicht)

Die App ist in **logische Schichten** organisiert. Jede Schicht entspricht einem Unterordner unter `js/` (siehe Kapitel 6 für die physische Datei-Struktur).

```
┌────────────────────────────────────────────────────────────┐
│  ernaehrung.html (Shell — lädt Fonts, CDN-Scripts, App)    │
└──────────────────────────────┬─────────────────────────────┘
                               │
                ┌──────────────▼──────────────┐
                │  js/app.js (Einstiegspunkt) │
                │  - mountet React-Root       │
                │  - registriert Service Worker│
                └──────────────┬──────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────────┐    ┌──────────────────┐
│ STORAGE      │      │  CALC / LOGIC    │    │  EXTERNAL APIS   │
│              │      │                  │    │                  │
│ localStorage │      │  bmr.js          │    │  openFoodFacts.js│
│ indexeddb    │      │  macros.js       │    │  claudeVision.js │
│ migrations   │      │  suggestions.js  │    │                  │
│ exportImport │      │  matching.js     │    │                  │
└──────────────┘      └──────────────────┘    └──────────────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                ┌──────────────▼──────────────┐
                │   HOOKS (React-Adapter)     │
                │  useProfile, useSettings    │
                │  useFoods, useMeals         │
                │  useRecipes, useLog         │
                │  useFridge                  │
                └──────────────┬──────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────────┐    ┌──────────────────┐
│   UI/SHARED  │      │  TAB-COMPONENTS  │    │  PWA/INSTALL     │
│              │      │                  │    │                  │
│ theme.js     │      │  heute/          │    │  registerSW.js   │
│ Navigation   │      │  tracker/        │    │  installPrompt.js│
│ Modal        │      │  rezepte/        │    │                  │
│ KcalRing     │      │  woche/          │    │                  │
│ MacroBar     │      │  profil/         │    │                  │
│ Toast        │      │                  │    │                  │
└──────────────┘      └──────────────────┘    └──────────────────┘
```

### 3.3 Komponenten-Inventar (Was wo wohnt)

| Tab/Bereich | Komponenten | Phase |
|---|---|---|
| **App-Wurzel** | `App`, `Navigation` (BottomNav + TopTabs), `UpdateBanner`, `BackupReminderBanner` | 1, 2 |
| **Heute-Tab** | `DayTypeSwitch`, `DaySummary`, `MealPlanList`, `MealPlanEntry`, `GapSuggestions` | 1 (Plan), 5 (Suggestions) |
| **Tracker-Tab** | `FavoritesBar`, `SearchInput`, `BarcodeScannerButton`, `FoodList`, `CustomFoodModal`, `MealEditorModal`, `VorratSection` (mit `CustomFoodsList`, `NotvorratToggle`, `FridgeManager`), `BarcodeFallbackModal` | 3, 5 |
| **Rezepte-Tab** | `RecipeFilters`, `RecipeList`, `RecipeDetail`, `CreateRecipeButton`, `RecipeEditor`, `PhotoRecipeButton` (nur bei AI-Aktivierung), `FridgeMatchFilter` | 4, 5, 6 |
| **Woche-Tab** | `WeekGrid`, `WeekDayCell`, `AdaptationCheck`, `WeightInput` | 1 (Grundgerüst), 5 (Adaptation) |
| **Profil-Tab** | `ProfileEditor`, `DataManagement` (Export/Import), `SettingsPanel`, `PostmenopausalInfo`, `ApiKeyPanel` (nur bei AI-Phase) | 1, 6 |

(Component-Namen sind verbindlich für die Implementation — sie wandern später in entsprechende Dateien.)

### 3.4 Datenfluss

```
                            ┌─────────────────────┐
                            │   React UI State    │
                            └──────────▲──────────┘
                                       │ (Custom Hooks)
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌──────────────────┐        ┌──────────────────────┐       ┌─────────────────┐
│  localStorage    │        │     IndexedDB        │       │ Externe APIs    │
│  (synchron, klein)│       │     (async, groß)    │       │                 │
├──────────────────┤        ├──────────────────────┤       ├─────────────────┤
│ profile          │        │ foodsCustom          │       │ Open Food Facts │
│ settings         │        │ meals (Favoriten)    │       │ (Suche + Code)  │
│ uiState          │        │ recipesCustom        │       ├─────────────────┤
│ schemaVersion    │        │ fridge               │       │ Claude API      │
│                  │        │ log (Tagebuch)       │       │ (nur Foto-Scan, │
│                  │        │ week                 │       │  optional)      │
│                  │        │ recipePhotos (Blobs) │       └─────────────────┘
│                  │        │ apiCache             │
└──────────────────┘        └──────────────────────┘
```

### 3.5 Speicherkonzept

**Hauptregel** (vom Auftraggeber):
- **IndexedDB ist Hauptspeicher** für alle Nutzungsdaten: Log, Rezepte, Lebensmittel, Mahlzeiten, Kühlschrank, Fotos
- **localStorage nur für kleine Settings, Profil und UI-Zustand**

| Bereich | Speicher | Begründung |
|---|---|---|
| **Profil** | localStorage | Klein (<1 KB), bei jedem Tab-Wechsel gelesen, synchron-Zugriff praktisch |
| **Settings** (inkl. API-Key) | localStorage | Sehr klein, häufig gelesen, synchron-Zugriff praktisch |
| **UI-Zustand** (zuletzt aktiver Tab, expand/collapse-States) | localStorage | Sehr klein, sessionsübergreifend |
| **Schema-Version** | localStorage (Key `ernaehrung_schema_version`) | Migrations-Trigger beim Start |
| **Eigene Lebensmittel** (`foodsCustom`) | IndexedDB | Wachsen langfristig, häufige Suche profitiert von Indices |
| **Favoriten-Mahlzeiten** (`meals`) | IndexedDB | Mit anderen Bestandsdaten konsistent |
| **Eigene Rezepte** (`recipesCustom`) | IndexedDB | Wachsen mit Foto-Erkennung schnell |
| **Kühlschrank** (`fridge`) | IndexedDB | Konsistent mit Bestandsdaten |
| **Esstagebuch** (`log`) | IndexedDB | Wächst täglich, indiziert nach Datum |
| **Wochenprotokoll** (`week`) | IndexedDB | Wächst wöchentlich |
| **Rezept-Fotos** (`recipePhotos`) | IndexedDB | Binärdaten (~300 KB pro Foto) |
| **API-Cache** (`apiCache`) | IndexedDB | Open-Food-Facts-Antworten 30 Tage gecached |

### 3.6 Modul-Loading-Strategie (Multi-File ohne Build)

Die App nutzt **native ES Modules** in Kombination mit **Babel-Standalone** für JSX. Das funktioniert ohne Bundler:

```html
<!-- ernaehrung.html -->
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script type="text/babel" data-type="module" data-presets="env,react" src="./js/app.js"></script>
```

- `data-type="module"` aktiviert ES-Module-Semantik (import/export)
- Jede `.js`-Datei wird über `import` geladen, Babel transpiliert JSX im Browser
- React + ReactDOM sind als Globals verfügbar (klassischer UMD-Pfad)
- `idb` (IndexedDB Wrapper) wird per ESM-CDN importiert: `import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm'`
- Performance-Hinweis: Babel transpiliert bei jedem Page-Load. Bei App-Größe < 5.000 Zeilen unkritisch. Service Worker cached die JS-Dateien — kein wiederholter Download.

### 3.7 Sicherheits- und Datenschutz-Architektur

- **Keine externe Datenhaltung im Local Mode** (Standard, einziger Modus in Phase 1): Alle Nutzerdaten verlassen das Gerät ausschließlich auf explizite Anforderung (Export-Knopf, Rezept-Foto an Claude API)
- **Cloud-Modi sind opt-in** (Zukunftspfad, §3.9): Erst wenn die Nutzerin aktiv Personal Sync oder User Cloud aktiviert, werden Daten an die jeweils **eigene** Supabase-Instanz übertragen. Im User Cloud Mode landen niemals fremde Daten in einer geteilten Datenbank.
- **API-Key-Schutz** (verschärft): Claude API-Key liegt **nur** in localStorage des einzelnen Geräts. **Der Key wird nie automatisch mit-exportiert**. Wer ihn auf ein anderes Gerät bringen will, muss ihn dort manuell in die Settings eintippen oder über eine separate, explizit benannte "API-Key kopieren"-Aktion in die Zwischenablage kopieren.
- **HTTPS-Pflicht**: GitHub Pages liefert automatisch HTTPS — notwendig für Kamera-Zugriff, Service Worker, Vibration-API
- **Berechtigungen**: Kamera-Zugriff wird vom Browser einmalig erfragt, Nutzer entscheidet
- **AI-Funktionen sind strikt feature-gated** (siehe 5.3.3): ohne API-Key sind alle AI-bezogenen UI-Elemente unsichtbar, keine Buttons, keine Menü-Einträge, keine Fehlermeldungen

### 3.8 PWA-Cache-Versionslogik

Der Service Worker verwendet **versionierte Cache-Namen** und löscht alte Caches bei Aktivierung:

```javascript
// service-worker.js
const APP_VERSION = '1.0.0';                          // semver-Tag bei Releases
const CACHE_NAME = `ernaehrung-static-${APP_VERSION}`;
const RUNTIME_CACHE = `ernaehrung-runtime-${APP_VERSION}`;

const STATIC_ASSETS = [
  './',
  './ernaehrung.html',
  './manifest.json',
  './js/app.js',
  // ... alle JS-Dateien explizit gelistet
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(n => n.startsWith('ernaehrung-') && !n.endsWith(APP_VERSION))
          .map(n => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});
```

**Update-Flow für Nutzer**:
1. Beim App-Start prüft die Page, ob ein neuer SW verfügbar ist (`navigator.serviceWorker.controller` vs neuer SW)
2. Wenn ja: Banner "App-Update verfügbar — neu laden?" wird angezeigt
3. Klick → `postMessage({type:'skipWaiting'})` an SW → SW aktiviert sich → Page lädt neu mit neuen Assets

**Versions-Bump-Regel**:
- `APP_VERSION` wird bei jedem Release manuell hochgezählt (1.0.0 → 1.0.1 → 1.1.0 etc.)
- Schema-Version (siehe 4.4) wird **separat** verwaltet — sie steigt nur bei tatsächlichen Datenstruktur-Änderungen

### 3.9 Cloud-Strategie — drei Betriebsarten (Zukunftspfad)

**Wichtig**: Diese Strategie beschreibt den **Zielzustand**. **Phase 1 implementiert NICHTS davon** — kein Supabase, kein Login, kein Sync (siehe §7 Phase 1). Lediglich das Datenmodell ist sync-vorbereitet (§4.6). Cloud-Code kommt frühestens in einer dedizierten Sync-Phase nach Phase 6.

Die Betriebsart wird in `Settings.operatingMode` gespeichert und ist jederzeit umschaltbar.

#### Modus 1 — Local Mode (Standard)

| Aspekt | Verhalten |
|---|---|
| **Wer** | Alle Nutzerinnen, Standardeinstellung |
| **Cloud** | Keine |
| **Anmeldung** | Keine |
| **Datenhaltung** | Ausschließlich lokal (localStorage + IndexedDB) |
| **Sync** | Keiner — Backup nur via JSON-Export/Import |
| **Phase** | Ab Phase 1 (= der einzige Modus, der überhaupt in Phase 1 existiert) |

#### Modus 2 — Personal Sync Mode (für Stephanie)

| Aspekt | Verhalten |
|---|---|
| **Wer** | Stephanie selbst, Nutzung auf iPhone, iPad und Desktop |
| **Cloud** | Supabase (Stephanies eigene Instanz) |
| **Datenquelle** | Supabase ist die zentrale Quelle der Wahrheit |
| **Lokal** | IndexedDB bleibt lokaler Cache (Offline-First, Sync bei Verbindung) |
| **Anmeldung** | Login gegen Stephanies Supabase |
| **Konfliktauflösung** | Last-Write-Wins über `updatedAt` (siehe §4.6), Soft-Deletes via `deletedAt` |
| **Phase** | Spätere Sync-Phase, nicht Teil von Phase 1-6 |

#### Modus 3 — User Cloud Mode

Wird erst evaluiert, wenn die App tatsächlich an viele Nutzerinnen verteilt wird. Kein Design, kein Code, kein Zeitplan. Nicht Bestandteil dieser Spezifikation.

#### Architektur-Konsequenzen (jetzt schon beachtet)

- **Offline-First bleibt Pflicht**: Auch in den Sync-Modi ist IndexedDB der lokale Arbeitsspeicher; die App funktioniert ohne Verbindung weiter
- **Sync-Engine ist additiv**: `js/sync/` (syncEngine, supabaseClient, deviceId) wird ergänzt, ohne bestehende Storage-Module zu brechen — die Hooks lesen/schreiben weiter über IndexedDB, der Sync läuft im Hintergrund
- **Datenmodell-Stabilität**: Durch die `Syncable`-Felder ab Phase 1 ist kein Schema-Bruch beim Aktivieren von Sync nötig
- **Supabase-Schema spiegelt IndexedDB**: Jeder syncbare Object Store erhält eine korrespondierende Supabase-Tabelle mit denselben Feldern + `user_id` für Row-Level-Security

---

## 4. Datenbankschema

Zwei Speicher-Schichten:
- **localStorage**: nur Profil, Settings, UI-Zustand und Schema-Version (klein, synchron, immer geladen)
- **IndexedDB** (Database: `ernaehrung_db`): Hauptspeicher für alle Nutzungsdaten

### 4.1 localStorage

Drei separate Keys (nicht ein großer JSON-Blob — so kann jeder Bereich unabhängig versioniert und migriert werden):

| localStorage-Key | Inhalt |
|---|---|
| `ernaehrung_schema_version` | Eine Zahl: aktuelle Schema-Version (Trigger für Migrationen) |
| `ernaehrung_profile` | JSON: `Profile` |
| `ernaehrung_settings` | JSON: `Settings` |
| `ernaehrung_ui_state` | JSON: `UiState` |

#### 4.1.1 Profile

```typescript
interface Profile {
  // --- Sync-Felder (siehe 4.6) ---
  id: string;                    // UUID, stabil über Geräte
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;            // Soft-Delete (für Sync)
  deviceId: string;              // welches Gerät zuletzt geschrieben hat

  // --- Körperdaten ---
  name: string;                  // "Stephanie"
  weight: number;                // kg, z.B. 100
  height: number;                // cm, z.B. 178
  age: number;                   // Jahre, z.B. 59
  bodyFat: number;               // %, z.B. 46.6
  leanMass: number;              // kg, automatisch aus weight + bodyFat

  // --- Ziele / Berechnung ---
  deficit: number;               // kcal, z.B. 300
  proteinPerKg: number;          // g/kg, z.B. 1.9 (wird von proteinTargetMode interpretiert)
  trainingFactor: number;        // PAL Trainingstag, z.B. 1.55
  restFactor: number;            // PAL Ruhetag, z.B. 1.35
  fatPercent: number;            // Fett-Anteil an Kcal, z.B. 0.25

  // --- NEU in v1.2: Postmenopause-Spezifika ---
  // HINWEIS: menopauseStatus wird nicht gespeichert.
  // Die Zielgruppe ist per Definition postmenopausal — alle Logik rechnet darauf.
  // Keine Auswahl, keine Sonderlogik, keine Abweichungen.
  strengthTrainingDaysPerWeek: number;     // 0–7, beeinflusst Trainings-/Ruhetag-Erwartung
  proteinTargetMode: 'perKgBodyweight' | 'perKgLeanMass' | 'fixed';
                                 // wie das Proteinziel berechnet wird; Default 'perKgBodyweight'
}
```

> **Hinweis (v1.2.1)**: `strengthTrainingDaysPerWeek` und `proteinTargetMode` sind ab Phase 1 im Datenmodell vorhanden. Defizit-Check + Proteinziel-Modus aktiv ab Phase 1; Mahlzeit-Verteilungs-Bewertung ab Phase 3.

#### 4.1.2 Settings

```typescript
interface Settings {
  claudeApiKey?: string;         // optional, kommt erst in Phase 6 zum Einsatz
  showAiFeatures: boolean;       // Default true; false = AI-UI auch mit Key verstecken
  enablePostmenopauseGuidance: boolean;  // NEU v1.2: Postmenopause-Logik aktiv. Default true.
                                 // false = nur Basis-Makros ohne spezialisierte Hinweise/Warnungen
  lastBackupAt?: number;         // Unix-Timestamp, für Backup-Reminder
  backupReminderDays: number;    // Default 7
  installPromptShown: boolean;
  cacheStrategy: 'cache-first' | 'network-first'; // Default 'cache-first'
  operatingMode: 'local' | 'personal-sync' | 'user-cloud';  // NEU v1.2, siehe 3.9. Default 'local'
}
```

#### 4.1.3 UiState

```typescript
interface UiState {
  activeTab: 'heute' | 'tracker' | 'rezepte' | 'woche' | 'profil';
  collapsedSections: string[];   // IDs von eingeklappten Bereichen
  preferredDayType: 'training' | 'rest';
  preferredTrainingTime: '08:00' | '14:30';
  lastVisitedAt: number;
}
```

### 4.2 IndexedDB (`ernaehrung_db`)

**Database-Name**: `ernaehrung_db`
**Version-Strategie**: Wird beim Hochzählen via `indexedDB.open()` automatisch durch `onupgradeneeded` migriert. IndexedDB-Version ist **identisch** mit der Schema-Version aus 4.4.

**Store-Erstellungsplan**: Stores werden **phasengerecht** angelegt — jede Phase erstellt nur die Stores, die sie braucht. Neue Stores = Schema-Version-Bump.

| Schema-Version | Phase | Neue Stores |
|---|---|---|
| 1 | Phase 1 | `log`, `week` |
| 2 | Phase 3 | `foodsCustom`, `meals` |
| 3 | Phase 4 | `recipesCustom`, `recipePhotos` |
| 4 | Phase 5 | `fridge` |
| 5 | Phase 6 | `apiCache` |

**Sync-Vorbereitung (v1.2)**: Alle nutzerdaten-tragenden Stores implementieren das `Syncable`-Interface aus §4.6 (id, createdAt, updatedAt, deletedAt?, deviceId) — sobald sie angelegt werden, tragen sie diese Felder von Anfang an.

#### 4.2.1 Object Store `foodsCustom` (Eigene Lebensmittel)

```typescript
interface CustomFood extends Syncable {   // id, createdAt, updatedAt, deletedAt?, deviceId (siehe 4.6)
  name: string;                  // "Tante Marias Quark"
  brand?: string;                // "Hofladen"
  barcode?: string;              // EAN
  kcal100: number;               // pro 100g
  p100: number;
  c100: number;
  f100: number;
  isNotvorrat: boolean;          // true = bei Lücken vorschlagen
  note?: string;
}
```

**Indices**: `id` (primary), `barcode` (für Barcode-Lookup), `name` (für Suche), `isNotvorrat` (für Notvorrat-Liste), `updatedAt` (für Sync-Delta)

#### 4.2.2 Object Store `meals` (Favoriten-Mahlzeiten)

```typescript
interface SavedMeal extends Syncable {    // id, createdAt, updatedAt, deletedAt?, deviceId (siehe 4.6)
  name: string;
  icon?: string;
  items: MealItem[];
  totalMacros: Macros;           // Cache der summierten Werte
  lastUsed?: number;             // für Sortierung "zuletzt verwendet"
}

interface MealItem {
  foodRef: string;               // "off:7613034626844" | "custom:abc123"
  foodName: string;              // Cache des Namens (falls foodRef gelöscht wird)
  gramm: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
}

interface Macros { kcal: number; p: number; c: number; f: number; }
```

**Indices**: `id` (primary), `lastUsed` (für Sortierung), `updatedAt` (für Sync-Delta)

#### 4.2.3 Object Store `recipesCustom` (Eigene Rezepte)

```typescript
interface CustomRecipe extends Syncable {  // id, createdAt, updatedAt, deletedAt?, deviceId (siehe 4.6)
  name: string;
  meal: string;                  // "Mittag / Abendessen"
  time: string;                  // "20 min"
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  tip?: string;
  macros: Macros;
  photoId?: string;              // Verweis auf Object Store recipePhotos
  source: 'manual' | 'photo-claude';
}

interface RecipeIngredient {
  foodRef?: string;
  name: string;
  amount: number;
  unit: 'g' | 'ml' | 'Stk' | 'EL' | 'TL';
  isMain: boolean;               // Hauptzutat für Kühlschrank-Matching
  macros?: Macros;
}
```

**Indices**: `id` (primary), `name` (Suche), `source` (Filter "von Foto erstellt"), `updatedAt` (für Sync-Delta)

#### 4.2.4 Object Store `fridge` (Kühlschrank-Inhalt)

```typescript
interface FridgeItem extends Syncable {    // id, createdAt, updatedAt, deletedAt?, deviceId (siehe 4.6)
  foodRef: string;
  foodName: string;
  gramm?: number;
  // addedAt entfällt — createdAt aus Syncable übernimmt die Rolle
}
```

**Indices**: `id` (primary), `createdAt` (Sortierung), `updatedAt` (für Sync-Delta)

#### 4.2.5 Object Store `log` (Esstagebuch)

```typescript
interface LogEntry extends Syncable {      // id, createdAt, updatedAt, deletedAt?, deviceId (siehe 4.6)
  // Bei log ist id === date ("2026-05-30") — der Tag ist die natürliche, geräteübergreifend
  // stabile ID. date bleibt als sprechender Alias erhalten.
  date: string;                  // "2026-05-30" (primary key === id, YYYY-MM-DD)
  dayType: 'training' | 'rest';
  trainingTime?: '08:00' | '14:30';
  entries: TrackedFood[];
  notes?: string;
}

interface TrackedFood {
  id: string;                    // UUID des Eintrags
  mealSlot: string;              // "Frühstück" | "Mittag" | ... oder freier Text
  foodRef: string;
  foodName: string;
  gramm: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
  timestamp: number;
}
```

**Indices**: `date` (primary), `dayType` (für Statistik-Queries)

#### 4.2.6 Object Store `week` (Wochenprotokoll)

```typescript
interface WeekEntry extends Syncable {     // id, createdAt, updatedAt, deletedAt?, deviceId (siehe 4.6)
  // id === weekKey ("2026-W22") — die Woche ist die natürliche, stabile ID
  weekKey: string;               // "2026-W22" (ISO Year-Week, primary key === id)
  weekNumber: number;
  year: number;
  days: { [date: string]: DaySummary };
  weight?: number;
  notes?: string;
}

interface DaySummary {
  dayType: 'training' | 'rest';
  totalKcal: number;
  totalP: number;
  totalC: number;
  totalF: number;
}
```

**Indices**: `weekKey` (primary), `year` (Filter), `updatedAt` (für Sync-Delta)

#### 4.2.7 Object Store `recipePhotos`

```typescript
interface RecipePhoto {
  id: string;                    // primary, referenziert von CustomRecipe.photoId
  recipeId: string;              // Rückverweis (Index)
  blob: Blob;                    // komprimiertes JPEG, max ~500 KB
  mimeType: string;              // "image/jpeg"
  width: number;
  height: number;
  capturedAt: number;
  deviceId?: string;             // für späteren Foto-Sync (eigener Pfad, nicht Syncable)
}
```

**Indices**: `id` (primary), `recipeId` (für Lookup beim Rezept-Öffnen)

> `recipePhotos` ist **nicht** `Syncable`: Blobs werden nicht über den regulären JSON-Sync-Pfad übertragen (zu groß). Foto-Sync ist ein separater, späterer Mechanismus (z.B. Supabase Storage Buckets).

#### 4.2.8 Object Store `apiCache` (Open-Food-Facts-Cache)

```typescript
interface ApiCacheEntry {
  key: string;                   // z.B. "off:product:7613034626844" oder "off:search:quark" (primary)
  data: any;                     // API-Antwort
  cachedAt: number;              // Unix-Timestamp ms
  expiresAt: number;             // Unix-Timestamp ms — nach 30 Tagen
}
```

**Indices**: `key` (primary), `expiresAt` (für Cleanup-Job)

### 4.3 Initial-Daten (im Code, nicht in DB)

Statische Daten, die mit der App ausgeliefert werden und nicht editierbar sind:

- `INITIAL_RECIPES` (`js/data/initialRecipes.js`): ~30 vordefinierte Rezepte (8 bestehende erweitert + ca. 22 neue) — kommt ab Phase 4
- `MEAL_TEMPLATES` (`js/data/mealTemplates.js`): Mahlzeitenpläne für Training 08:00 / 14:30 / Ruhetag — ab Phase 1
- `POSTMENOPAUSAL_TIPS` (`js/data/tips.js`): 5 wissenschaftliche Hinweise — ab Phase 1

### 4.4 Schema-Versionierung und Migrationen

**Zentrale Konstante** im Code:

```javascript
// js/storage/migrations.js
export const CURRENT_SCHEMA_VERSION = 1;  // Phase 1: nur log + week
// Wird pro Phase hochgezählt wenn neue Stores hinzukommen:
//   2 → Phase 3 (foodsCustom, meals)
//   3 → Phase 4 (recipesCustom, recipePhotos)
//   4 → Phase 5 (fridge)
//   5 → Phase 6 (apiCache)
```

#### Wie ein Schema-Upgrade abläuft

```
App-Start
  │
  ├─→ localStorage lesen: ernaehrung_schema_version
  │
  ├─→ if (storedVersion < CURRENT_SCHEMA_VERSION):
  │     migrateLocalStorage(storedVersion, CURRENT_SCHEMA_VERSION)
  │     localStorage.setItem('ernaehrung_schema_version', CURRENT_SCHEMA_VERSION)
  │
  └─→ indexedDB.open('ernaehrung_db', CURRENT_SCHEMA_VERSION)
       └─→ onupgradeneeded(oldVersion, newVersion) automatisch durch idb
            └─→ migrateIndexedDB(db, oldVersion, newVersion)
```

#### Migration-Registry

```javascript
// js/storage/migrations.js
export const LOCAL_STORAGE_MIGRATIONS = {
  // Version 0 → 1: Erstinstallation — Defaults für Settings + UiState setzen; Profil wird NICHT gesetzt (das macht der Erststart-Assistent)
  1: () => {
    // Initial-Schema. Bei Update vom alten Tool (das hat keine localStorage-Daten):
    //   Migration vom hardcoded PROFILE-Konstante (siehe seedDefaults)
  },
  // 2: () => { /* zukünftige Migration */ },
};

// Jede Phase legt nur die Stores an, die sie tatsächlich braucht.
// Neue Stores = neuer Schema-Version-Bump.
// Schema-Version-Plan:
//   v1 (Phase 1): log, week
//   v2 (Phase 3): foodsCustom, meals
//   v3 (Phase 4): recipesCustom, recipePhotos
//   v4 (Phase 5): fridge
//   v5 (Phase 6): apiCache

export const INDEXED_DB_MIGRATIONS = {
  1: (db) => {
    // Phase 1 — nur Stores für Heute-Tab und Wochenprotokoll
    const log = db.createObjectStore('log', { keyPath: 'date' });  // date === id
    log.createIndex('dayType', 'dayType');
    log.createIndex('updatedAt', 'updatedAt');

    const week = db.createObjectStore('week', { keyPath: 'weekKey' }); // weekKey === id
    week.createIndex('year', 'year');
    week.createIndex('updatedAt', 'updatedAt');
  },
  2: (db) => {
    // Phase 3 — Tracker: eigene Lebensmittel + Favoriten-Mahlzeiten
    const foods = db.createObjectStore('foodsCustom', { keyPath: 'id' });
    foods.createIndex('barcode', 'barcode', { unique: false });
    foods.createIndex('name', 'name');
    foods.createIndex('isNotvorrat', 'isNotvorrat');
    foods.createIndex('updatedAt', 'updatedAt');

    const meals = db.createObjectStore('meals', { keyPath: 'id' });
    meals.createIndex('lastUsed', 'lastUsed');
    meals.createIndex('updatedAt', 'updatedAt');
  },
  3: (db) => {
    // Phase 4 — Rezepte: eigene Rezepte + Fotos
    const recipes = db.createObjectStore('recipesCustom', { keyPath: 'id' });
    recipes.createIndex('name', 'name');
    recipes.createIndex('source', 'source');
    recipes.createIndex('updatedAt', 'updatedAt');

    const photos = db.createObjectStore('recipePhotos', { keyPath: 'id' });
    photos.createIndex('recipeId', 'recipeId');
  },
  4: (db) => {
    // Phase 5 — Kühlschrank
    const fridge = db.createObjectStore('fridge', { keyPath: 'id' });
    fridge.createIndex('createdAt', 'createdAt');
    fridge.createIndex('updatedAt', 'updatedAt');
  },
  5: (db) => {
    // Phase 6 — API-Cache für Open Food Facts
    const cache = db.createObjectStore('apiCache', { keyPath: 'key' });
    cache.createIndex('expiresAt', 'expiresAt');
  },
};
```

#### Migrations-Regeln (verbindlich)

1. **Nur additive Änderungen ohne Bump**: Optionale Felder hinzufügen → kein Schema-Bump nötig.
2. **Schema-Bump für strukturelle Änderungen**: Object Store hinzufügen, Index ändern, Pflichtfeld ergänzen → Schema-Version hochzählen, Migration schreiben.
3. **Niemals Daten zerstörend migrieren**: Bei Feld-Umbenennung erst neues Feld einführen, Daten kopieren, im nächsten Schema-Bump altes Feld entfernen.
4. **Migrations-Tests sind Pflicht**: Vor jedem Release wird die Migration mit gemockten alten Daten getestet.
5. **Rollback-Strategie**: Bei fehlgeschlagener Migration zeigt die App einen Fehler-Banner "Migration fehlgeschlagen — bitte Export laden / Support kontaktieren" und blockiert den weiteren Zugriff, statt korrupte Daten zu erzeugen.

### 4.5 Export-Format (JSON-Datei)

```json
{
  "exportedAt": "2026-05-30T18:30:00Z",
  "appVersion": "1.0.0",
  "schemaVersion": 1,
  "data": {
    "profile": { ... },
    "settings": {
      "...alle Settings...":  "...",
      "claudeApiKey": null
    },
    "uiState": { ... },
    "foodsCustom": [ ... ],
    "meals": [ ... ],
    "recipesCustom": [ ... ],
    "fridge": [ ... ],
    "log": [ ... ],
    "week": [ ... ]
  }
}
```

**API-Key-Härtung**:
- Der `claudeApiKey` wird beim Standard-Export **immer auf `null` gesetzt** — es gibt keinen Toggle, ihn mit aufzunehmen
- Wer den Key auf ein anderes Gerät bringen will, verwendet die separate Aktion "API-Key in Zwischenablage kopieren" im Settings-Panel und fügt ihn dort manuell ein
- Diese Trennung verhindert versehentliches Weitergeben des Keys mit den Daten

**Rezept-Fotos**:
- Werden im Standard-Export **nicht** mit-exportiert (zu groß für JSON)
- Optional gibt es ab Phase 6 einen separaten Foto-Export als ZIP (eigene Aktion)

**Import-Verhalten**:
- Versions-Check: wenn `schemaVersion` der Datei > eigene Schema-Version → Fehler "Datei aus neuerer App-Version, bitte App aktualisieren"
- Wenn `schemaVersion` < eigene → Datei wird durch lokale Migration aufgewertet
- Konflikt-Strategie: Standard ist **vollständig ersetzen** (mit Vorab-Bestätigung); optional "nur neue Einträge ergänzen" als Phase-Ausbau

### 4.6 Sync-Vorbereitung (Architekturvorgabe v1.2)

Damit eine spätere Cloud-Synchronisation (§3.9) **ohne Datenmodell-Bruch** ergänzt werden kann, tragen alle synchronisierbaren Datensätze ab Phase 1 dieselben Basis-Felder:

```typescript
interface Syncable {
  id: string;          // global eindeutige, geräteübergreifend stabile ID (UUID v4 oder natürliche ID wie Datum/Woche)
  createdAt: number;   // Unix-Timestamp ms — wann zuerst erstellt
  updatedAt: number;   // Unix-Timestamp ms — wann zuletzt geändert (Basis für Last-Write-Wins)
  deletedAt?: number;  // Unix-Timestamp ms — Soft-Delete-Marker; gesetzt = gelöscht, aber für Sync erhalten
  deviceId: string;    // welches Gerät den Datensatz zuletzt geschrieben hat
}
```

**Welche Stores sind `Syncable`**: `foodsCustom`, `meals`, `recipesCustom`, `fridge`, `log`, `week`, sowie das `Profile` (in localStorage).

**Konzept der Felder**:
- **`id`**: Bei Stammdaten ein UUID; bei `log`/`week` die natürliche ID (Datum bzw. ISO-Woche), die ohnehin geräteübergreifend gleich ist
- **`updatedAt`**: zentral für Konfliktauflösung — bei Sync gewinnt der Datensatz mit dem höheren `updatedAt` (Last-Write-Wins)
- **`deletedAt`**: ermöglicht „Löschung synchronisieren" — ein lokal gelöschter Eintrag wird nicht hart entfernt, sondern als gelöscht markiert, damit andere Geräte die Löschung übernehmen. Lokale Aufräum-Jobs können endgültig gelöschte Soft-Deletes nach einer Karenzzeit physisch entfernen
- **`deviceId`**: einmalig pro Gerät erzeugt (`js/sync/deviceId.js`), in localStorage abgelegt — dient Debugging + Konflikt-Nachvollziehbarkeit

**Wichtig**:
- **`deviceId`** wird in Phase 1 lokal erzeugt und gespeichert, aber **nicht** für Sync verwendet
- **Es gibt in Phase 1 keinen Sync-Code, kein Supabase, kein Netzwerk**
- Jeder Store trägt diese Felder **ab dem Zeitpunkt seiner Erstellung** — kein Backfill je nötig
- Phase 1 schreibt `Syncable`-Felder nur in `log`, `week` und `Profile` (die einzigen in Phase 1 aktiven Bereiche)
- Soft-Delete in Phase 1: physische Löschung ist erlaubt (Local-Only, kein Sync nötig). `deletedAt` wird erst relevant, wenn Personal Sync Mode aktiviert wird.

---

## 5. API-Konzept

### 5.1 Externe APIs

#### 5.1.1 Open Food Facts

**Basis-URL**: `https://world.openfoodfacts.org/`

| Endpoint | Methode | Zweck |
|---|---|---|
| `/cgi/search.pl?search_terms={q}&search_simple=1&action=process&json=1&page_size=20` | GET | Textsuche, liefert Produktliste |
| `/api/v2/product/{barcode}.json` | GET | Barcode-Lookup, liefert ein Produkt |

**Verwendete Felder pro Produkt**:
```typescript
{
  code: string;                  // Barcode
  product_name: string;
  brands: string;
  nutriments: {
    'energy-kcal_100g': number;
    'proteins_100g': number;
    'carbohydrates_100g': number;
    'fat_100g': number;
  };
  image_thumb_url?: string;
}
```

**Cache-Strategie**: Erfolgreiche Antworten 30 Tage in IndexedDB cachen (Object Store `apiCache`).

**Fehlerfälle**:
- Kein Treffer: Maske "Lebensmittel anlegen" mit ggf. vorausgefülltem Barcode
- Netzwerkfehler: Hinweis "Offline — bitte mit Internet erneut versuchen oder manuell anlegen"

#### 5.1.2 Claude API (Anthropic)

**Basis-URL**: `https://api.anthropic.com/v1/messages`

**Headers**:
```
x-api-key: {nutzer-eigener Key}
anthropic-version: 2023-06-01
content-type: application/json
```

**Request-Body** (Rezept-Foto-Extraktion):
```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 2000,
  "system": "Du bist ein Assistent, der Rezepte aus Fotos extrahiert. Antworte ausschließlich mit gültigem JSON nach dem vorgegebenen Schema.",
  "messages": [{
    "role": "user",
    "content": [
      { "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": "..." }},
      { "type": "text", "text": "Bitte extrahiere dieses Rezept als JSON mit den Feldern: name (string), time (string z.B. '20 min'), servings (number), ingredients (array von {name, amount, unit, isMain}), steps (array von string), tip (string, optional). Antworte nur mit JSON, keine Erklärung." }
    ]
  }]
}
```

**Response-Verarbeitung**:
- Antwort-Text wird als JSON geparst
- Bei Parse-Fehler: Edit-Maske öffnet sich leer mit Foto als Anhang, Stephanie tippt manuell
- Erfolg: Edit-Maske wird mit Werten vorausgefüllt

**Kosten-Schätzung**: ~2.000 Input-Tokens (Bild + Text) + ~500 Output-Tokens pro Rezept = ca. 1-2 Cent bei Sonnet 4.6.

**Sicherheit**: API-Key wird ausschließlich client-seitig verwendet, nie an Dritte gesendet außer api.anthropic.com.

### 5.2 Interne Module (Multi-File-API)

Jedes Modul ist eine eigene `.js`-Datei mit ES-Module-Exporten. Aufrufer importieren über relative Pfade.

#### 5.2.1 Storage-Layer

**Datei `js/storage/localStorage.js`** (synchron, kleine Daten):

```typescript
export function loadProfile(): Profile | null
export function saveProfile(p: Profile): void
export function loadSettings(): Settings
export function saveSettings(s: Partial<Settings>): void  // merge
export function loadUiState(): UiState
export function saveUiState(u: Partial<UiState>): void    // merge
export function getSchemaVersion(): number
export function setSchemaVersion(v: number): void
```

**Datei `js/storage/indexeddb.js`** (async, große Daten, mit `idb`-Wrapper):

```typescript
export async function openDb(): Promise<IDBPDatabase>   // singleton

// Foods
export async function getAllCustomFoods(): Promise<CustomFood[]>
export async function getCustomFoodByBarcode(barcode: string): Promise<CustomFood | undefined>
export async function searchCustomFoods(query: string): Promise<CustomFood[]>
export async function saveCustomFood(food: CustomFood): Promise<void>
export async function deleteCustomFood(id: string): Promise<void>

// Meals (Favoriten)
export async function getAllMeals(): Promise<SavedMeal[]>
export async function getMealById(id: string): Promise<SavedMeal | undefined>
export async function saveMeal(meal: SavedMeal): Promise<void>
export async function deleteMeal(id: string): Promise<void>

// Recipes
export async function getAllCustomRecipes(): Promise<CustomRecipe[]>
export async function getCustomRecipeById(id: string): Promise<CustomRecipe | undefined>
export async function saveCustomRecipe(r: CustomRecipe): Promise<void>
export async function deleteCustomRecipe(id: string): Promise<void>

// Fridge
export async function getAllFridgeItems(): Promise<FridgeItem[]>
export async function addFridgeItem(item: FridgeItem): Promise<void>
export async function deleteFridgeItem(id: string): Promise<void>
export async function clearFridge(): Promise<void>

// Log
export async function getLogForDate(date: string): Promise<LogEntry | null>
export async function saveLogEntry(entry: LogEntry): Promise<void>
export async function getLogsBetween(from: string, to: string): Promise<LogEntry[]>

// Week
export async function getWeek(weekKey: string): Promise<WeekEntry | null>
export async function saveWeek(entry: WeekEntry): Promise<void>
export async function getWeeksByYear(year: number): Promise<WeekEntry[]>

// Recipe Photos
export async function getRecipePhoto(id: string): Promise<RecipePhoto | undefined>
export async function saveRecipePhoto(photo: RecipePhoto): Promise<void>
export async function deleteRecipePhoto(id: string): Promise<void>

// API Cache
export async function getCacheEntry(key: string): Promise<any | undefined>
export async function setCacheEntry(key: string, data: any, ttlMs: number): Promise<void>
export async function pruneExpiredCache(): Promise<number>  // returns count
```

**Datei `js/storage/migrations.js`** (Schema-Versionierung):

```typescript
export const CURRENT_SCHEMA_VERSION: number;
export const LOCAL_STORAGE_MIGRATIONS: { [version: number]: () => void };
export const INDEXED_DB_MIGRATIONS: { [version: number]: (db: IDBPDatabase, oldVersion: number) => void };
export async function runMigrations(): Promise<{ ok: boolean; appliedVersions: number[]; error?: string }>
export function seedDefaults(): void   // erstes Profil aus altem Hardcode-Wert
```

**Datei `js/storage/exportImport.js`**:

```typescript
export async function exportAll(): Promise<Blob>          // JSON-Blob, OHNE API-Key
export async function importAll(file: File, options: { mode: 'replace' | 'merge' }): Promise<{ ok: boolean; warnings: string[]; error?: string }>
export async function copyApiKeyToClipboard(): Promise<boolean>   // separate, explizite Aktion
```

#### 5.2.2 Berechnungs-Layer (`js/calc/*.js`)

**`js/calc/bmr.js`** — Grundberechnung:
```typescript
export function calcBMR(leanMass: number): number                    // Katch-McArdle
export function calcLeanMass(weight: number, bodyFat: number): number
```

**`js/calc/macros.js`** — Makro-Berechnung mit Proteinziel-Modi:
```typescript
export function calcTDEE(bmr: number, factor: number): number
export type ProteinTargetMode = 'perKgBodyweight' | 'perKgLeanMass' | 'fixed';
export function calcProteinTarget(profile: Profile): number          // wertet proteinTargetMode aus
export function calcMacros(profile: Profile, totalKcal: number): Macros
export function distributeMacrosPerMeal(meals: MealTemplate[], totalMacros: Macros): MealWithMacros[]
export function calcGap(target: Macros, consumed: Macros): Macros     // wie viel fehlt noch
```

**`js/calc/nutritionLogic.js`** — Postmenopause-Kernlogik (das Herz der App):
```typescript
// Defizit-Sicherheit (Phase 1) — schützt Muskelmasse
export interface DeficitAssessment {
  deficitKcal: number;
  percentOfTDEE: number;
  severity: 'safe' | 'moderate' | 'aggressive' | 'dangerous';
  warning?: string;            // z.B. "Defizit > 25 % gefährdet bei anaboler Resistenz die Muskulatur"
}
export function assessDeficit(profile: Profile, tdee: number): DeficitAssessment

// Proteinverteilung pro Mahlzeit (Phase 3) — Leucin-Trigger
// Hinweis: Open Food Facts liefert keine Leucin-Daten. Leucin wird NICHT als Gramm-Wert
// berechnet. Stattdessen: geschätzte Wahrscheinlichkeit auf Basis Proteinmenge + Mahlzeittyp.
// Faustregeln: >30 g Protein aus tierischen Quellen → hohe Wahrscheinlichkeit;
//              20–30 g → mittlere; <20 g oder hauptsächlich pflanzlich → niedrige.
export interface MealProteinRating {
  proteinG: number;
  leucineLikelihood: 'high' | 'medium' | 'low';  // geschätzte Wahrscheinlichkeit Leucin-Schwelle erreicht
  rating: 'good' | 'borderline' | 'insufficient';
  hint?: string;               // z.B. "Hauptmahlzeit mit < 25 g Protein — MPS evtl. nicht ausgelöst"
}
export function rateMealProtein(mealProteinG: number, isMainMeal: boolean, profile: Profile): MealProteinRating

// Tagesstruktur-Bewertung (Phase 3) — nicht nur Gesamtkalorien
export interface DayStructureAssessment {
  totalProteinG: number;
  proteinTargetG: number;
  mealsReachingThreshold: number;
  totalMainMeals: number;
  eveningProteinG: number;     // Casein-Fenster
  proteinDistributionScore: number;  // 0–100, wie gleichmäßig + schwellenwirksam
  flags: string[];             // z.B. "Abendmahlzeit casein-arm", "Protein zu sehr auf eine Mahlzeit konzentriert"
}
export function assessDayStructure(dayLog: LogEntry, profile: Profile, dayType: 'training' | 'rest'): DayStructureAssessment
```

**`js/calc/suggestions.js`** — `suggestForGap` (Phase 5), **proteinpriorisiert** (siehe 5.6)
**`js/calc/matching.js`** — `matchRecipesAgainstFridge` (Phase 5)

#### 5.2.3 Externe-API-Clients (`js/api/*.js`)

- `js/api/openFoodFacts.js`: `searchFoods(query)`, `getProductByBarcode(code)`, intern mit `apiCache`-Lookup
- `js/api/claudeVision.js` (Phase 6): `extractRecipeFromPhoto(blob, apiKey)`, `compressImage(file, maxBytes)`

#### 5.2.4 Hooks (`js/hooks/*.js`)

React-Adapter, die die Storage-Funktionen in `useState`/`useEffect` einwickeln:

- `useProfile()` — `[profile, setProfile, calculated]`; `calculated` enthält BMR, TDEE (Training/Ruhe), Makro-Ziele, **Proteinziel** (via `proteinTargetMode`) und **`deficitAssessment`** (Defizit-Severity + Warnung)
- `useSettings()` — `[settings, updateSettings]` (inkl. `enablePostmenopauseGuidance`, `operatingMode`)
- `useUiState()` — `[ui, updateUi]`
- `useFoods()` — `[allFoods, refresh, addFood, updateFood, deleteFood]`
- `useMeals()` — analog
- `useRecipes()` — vereint Initial + Custom
- `useLog(date)` — Tages-Tagebuch laden/schreiben
- `useFridge()` — analog
- `useAiEnabled()` — `boolean`, prüft Key + Setting (siehe 5.3.3)

#### 5.2.5 Barcode-Integration (`js/scan/barcode.js`, Phase 3)

```typescript
export async function lookupBarcode(code: string): Promise<{ source: 'custom' | 'off' | null; food?: Food }>
export async function startBarcodeScanner(onResult: (code: string) => void): Promise<() => void>
```

#### 5.2.6 PWA-Integration (`js/pwa/*.js`, Phase 2)

- `js/pwa/registerServiceWorker.js`: `registerServiceWorker()`, `checkForAppUpdate()`
- `js/pwa/installPrompt.js`: `showInstallPrompt()`, `dismissInstallPrompt()`

### 5.3 AI-Feature-Gating (verbindlich)

#### 5.3.1 Aktivierungs-Bedingung

```javascript
// js/hooks/useAiEnabled.js
export function useAiEnabled() {
  const [settings] = useSettings();
  const hasKey = typeof settings.claudeApiKey === 'string' && settings.claudeApiKey.length > 0;
  const userOptedIn = settings.showAiFeatures !== false;  // Default true
  return hasKey && userOptedIn;
}
```

#### 5.3.2 Konsequenzen wenn `useAiEnabled() === false`

| Bereich | Verhalten |
|---|---|
| **`PhotoRecipeButton`** | Wird **gar nicht** gerendert (kein deaktivierter Button, keine Tooltip-Erklärung) |
| **`ApiKeyPanel`** im Profil | Sichtbar (damit Nutzer Key überhaupt eintragen kann), aber zeigt klaren Hinweis "AI-Funktionen sind aus" |
| **Settings-Toggle "AI-Funktionen anzeigen"** | Sichtbar nur wenn Key gesetzt; Default-Wert ist `true` |
| **Console-Warnings** | Keine — die App soll ohne Key fehlerfrei und ohne Hinweise laufen |
| **Network-Requests** | Keine an `api.anthropic.com`, niemals |
| **Service Worker** | Cached keine Claude-bezogenen Endpoints |
| **Performance** | Kein Vorab-Laden der Claude-API-Module — `claudeVision.js` wird **lazy** importiert (`await import(...)`) erst beim ersten Foto-Klick |

#### 5.3.3 Hard-Failsafe

Selbst wenn UI-Code irrtümlich versucht, eine AI-Funktion aufzurufen ohne Key:

```javascript
// js/api/claudeVision.js
export async function extractRecipeFromPhoto(blob, apiKey) {
  if (!apiKey) {
    throw new Error('AI_DISABLED');  // wird vom Aufrufer abgefangen, kein User-Schaden
  }
  // ...
}
```

#### 5.3.4 API-Key niemals automatisch exportieren

Das `exportAll()` setzt `claudeApiKey` immer auf `null` in der Output-JSON. Es gibt **keinen Toggle**, der das aushebelt. Wer den Key auf ein anderes Gerät bringen will, nutzt die separate, explizit benannte Aktion `copyApiKeyToClipboard()` und fügt ihn dort manuell in die Settings ein.

### 5.4 Open Food Facts — Cache-Verhalten

- Erfolgreiche Antworten werden 30 Tage im `apiCache`-Store unter dem Key `off:product:{barcode}` bzw. `off:search:{normalized_query}` gespeichert
- Bei jedem Request: erst Cache prüfen → wenn Treffer & nicht abgelaufen → zurückgeben, sonst Live-Request
- Auto-Cleanup: einmal pro Woche werden abgelaufene Einträge gelöscht (`pruneExpiredCache()` beim App-Start, throttled via `lastCleanupAt` in Settings)

### 5.5 Claude Vision — Request-Details (Phase 6)

**Endpoint**: `POST https://api.anthropic.com/v1/messages`

**Headers**:
```
x-api-key: {nutzer-eigener Key}
anthropic-version: 2023-06-01
content-type: application/json
```

**Body**:
```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 2000,
  "system": "Du bist ein Assistent, der Rezepte aus Fotos extrahiert. Antworte ausschließlich mit gültigem JSON.",
  "messages": [{
    "role": "user",
    "content": [
      { "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": "..." }},
      { "type": "text", "text": "Extrahiere als JSON mit Feldern: name, time, servings, ingredients (array {name, amount, unit, isMain}), steps (array string), tip. Antworte nur mit JSON." }
    ]
  }]
}
```

**Verhalten**:
- Antwort-Text wird als JSON geparst; bei Parse-Fehler öffnet sich Edit-Maske leer mit Foto als Anhang
- Kosten: ~1-2 Cent pro Foto bei Sonnet 4.6
- Modul wird **lazy** importiert, damit App ohne Key keinen unnötigen Code lädt

### 5.6 Proteinpriorisierte Vorschlagslogik (Phase 5)

Die Vorschlags-Engine `suggestForGap` ist **kein** generischer Kalorien-Füller. Sie folgt der Postmenopause-Designmaxime und priorisiert Protein-Qualität vor Kalorien-Menge.

**Eingabe**: aktuelle Tageslücke (`calcGap`), Tageszeit, verfügbare Quellen (Notvorrat, Kühlschrank, Favoriten, Rezepte, Lebensmittel).

**Bewertungs-Reihenfolge (Sortier-Priorität)**:
1. **Proteinlücke zuerst**: Wenn Protein fehlt, werden proteinreiche Optionen oben einsortiert — unabhängig davon, ob auch KH/Fett fehlen
2. **Leucin-Wirksamkeit**: Optionen, die die Leucin-Schwelle in einer Portion erreichen, schlagen solche, die nur „etwas Protein" liefern
3. **Abend-Bonus für Casein**: Nach ~18 Uhr werden casein-reiche Optionen (Quark, Hüttenkäse) zusätzlich hochgewichtet (nächtliche Regeneration)
4. **Verfügbarkeit**: Notvorrat-/Kühlschrank-Items bekommen Bonuspunkte
5. **Kein Kalorien-Überschuss**: Optionen, die das Kalorienziel sprengen, werden abgewertet (Defizit-Schutz)

**Ausgabe je Vorschlag**:
```typescript
interface Suggestion {
  source: 'food' | 'meal' | 'recipe';
  ref: string;
  label: string;
  recommendedGramm?: number;
  fillsProteinG: number;        // wie viel Protein die empfohlene Menge liefert
  leucineLikelihood: 'high' | 'medium' | 'low';  // geschätzte Wahrscheinlichkeit, nicht exakt
  fillsKcal: number;
  availability: 'notvorrat' | 'fridge' | 'none';
  isCaseinRich: boolean;        // für Abend-Priorisierung
  score: number;                // Gesamt-Ranking
  badges: string[];             // z.B. ["Vorrat ✓", "Leucin ✓", "Casein"]
}
```

**Verbindlich**: Bei einer reinen Proteinlücke darf ein kalorienreicher, proteinarmer Snack **nie** über einer proteinreichen Option ranken — selbst wenn er die Kalorienlücke besser füllt.

---

## 6. Verzeichnisstruktur

### 6.1 Repository-Struktur (Zielzustand nach allen Phasen)

```
Ernährungs-Dashboard/                          # Projekt-Wurzel
│
├── ernaehrung.html                            # Schlanke Shell, lädt CDN-Scripts und js/app.js
├── manifest.json                              # PWA-Manifest
├── service-worker.js                          # Cache mit Versions-Logik
│
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
│
├── js/
│   ├── app.js                                 # Einstiegspunkt, React.render + SW-Registration
│   ├── version.js                             # exportiert APP_VERSION (single source of truth)
│   │
│   ├── storage/
│   │   ├── localStorage.js                    # Profil/Settings/UI-State synchron
│   │   ├── indexeddb.js                       # alle Object-Store-Operationen via idb
│   │   ├── migrations.js                      # CURRENT_SCHEMA_VERSION + Migration-Registry
│   │   └── exportImport.js                    # JSON-Export (ohne Key) + Import + Validierung
│   │
│   ├── calc/
│   │   ├── bmr.js                             # Katch-McArdle BMR + Lean-Mass
│   │   ├── macros.js                          # TDEE, Proteinziel-Modi, Makro-Verteilung, Gap
│   │   ├── nutritionLogic.js                  # Postmenopause-Kern: Defizit-Check, Protein-Rating, Tagesstruktur
│   │   ├── suggestions.js                     # proteinpriorisierte Vorschlags-Engine (Phase 5)
│   │   └── matching.js                        # Kühlschrank-Rezept-Matching (Phase 5)
│   │
│   ├── api/
│   │   ├── openFoodFacts.js                   # Suche + Barcode-Lookup, mit Cache
│   │   └── claudeVision.js                    # Phase 6, lazy-imported, gated
│   │
│   ├── sync/                                  # SPÄTER (nicht Phase 1) — Cloud-Betriebsarten
│   │   ├── syncEngine.js                      # Push/Pull, Last-Write-Wins via updatedAt
│   │   ├── supabaseClient.js                  # Personal/User Cloud Mode
│   │   └── deviceId.js                        # erzeugt + speichert lokale Geräte-ID
│   │
│   ├── scan/
│   │   └── barcode.js                         # html5-qrcode-Wrapper (Phase 3)
│   │
│   ├── pwa/
│   │   ├── registerServiceWorker.js
│   │   └── installPrompt.js
│   │
│   ├── hooks/
│   │   ├── useProfile.js
│   │   ├── useSettings.js
│   │   ├── useUiState.js
│   │   ├── useFoods.js                        # Phase 3
│   │   ├── useMeals.js                        # Phase 3
│   │   ├── useRecipes.js                      # Phase 4
│   │   ├── useLog.js                          # Phase 3 (Tracker schreibt rein)
│   │   ├── useFridge.js                       # Phase 5
│   │   └── useAiEnabled.js                    # Phase 6
│   │
│   ├── data/
│   │   ├── mealTemplates.js                   # MEAL_TEMPLATES (ab Phase 1)
│   │   ├── tips.js                            # POSTMENOPAUSAL_TIPS (ab Phase 1)
│   │   └── initialRecipes.js                  # INITIAL_RECIPES (ab Phase 4)
│   │
│   ├── ui/
│   │   ├── theme.js                           # Style-Konstanten (Farben, Spacing, Fonts)
│   │   ├── Navigation.js                      # BottomNav + TopTabs (responsiv)
│   │   ├── Modal.js
│   │   ├── KcalRing.js
│   │   ├── MacroBar.js
│   │   ├── Toast.js
│   │   ├── UpdateBanner.js                    # Phase 2
│   │   └── BackupReminderBanner.js            # Phase 1
│   │
│   └── tabs/
│       ├── heute/
│       │   ├── HeuteTab.js
│       │   ├── DayTypeSwitch.js
│       │   ├── DaySummary.js
│       │   ├── MealPlanList.js
│       │   ├── MealPlanEntry.js
│       │   └── GapSuggestions.js              # Phase 5
│       │
│       ├── tracker/
│       │   ├── TrackerTab.js                  # Phase 3 (Phase 1: Platzhalter)
│       │   ├── SearchInput.js
│       │   ├── FavoritesBar.js
│       │   ├── BarcodeScannerButton.js
│       │   ├── FoodList.js
│       │   ├── CustomFoodModal.js
│       │   ├── MealEditorModal.js
│       │   ├── BarcodeFallbackModal.js
│       │   └── VorratSection.js
│       │
│       ├── rezepte/
│       │   ├── RezepteTab.js                  # Phase 4 (Phase 1: Platzhalter)
│       │   ├── RecipeList.js
│       │   ├── RecipeDetail.js
│       │   ├── RecipeFilters.js
│       │   ├── CreateRecipeButton.js
│       │   ├── RecipeEditor.js
│       │   ├── FridgeMatchFilter.js           # Phase 5
│       │   └── PhotoRecipeButton.js           # Phase 6
│       │
│       ├── woche/
│       │   ├── WocheTab.js
│       │   ├── WeekGrid.js
│       │   ├── WeekDayCell.js
│       │   ├── WeightInput.js
│       │   └── AdaptationCheck.js             # Phase 5
│       │
│       └── profil/
│           ├── ProfilTab.js                   # Phase 1: vollständig
│           ├── ProfileEditor.js
│           ├── DataManagement.js              # Export/Import (Phase 1)
│           ├── SettingsPanel.js
│           ├── ApiKeyPanel.js                 # Phase 6
│           └── PostmenopausalInfo.js
│
├── docs/
│   ├── projekt-spezifikation.md               # DIESES Dokument
│   ├── implementierungsplan-phase-1.md        # nach Spec-Approval (eigenes Dokument)
│   ├── implementierungsplan-phase-2.md        # später, je Phase eigener Plan
│   └── …
│
├── tests/                                     # Phase 1: Test-Setup einrichten
│   ├── manual-checklist-phase-1.md            # manuelle Smoke-Tests
│   └── (optional) unit/                       # Vitest-Setup wenn Bedarf
│
├── Uebergabedokument-Ernaehrungs-Tool.docx
├── README.md
└── .gitignore                                 # .superpowers/, unpacked/, tmp/
```

### 6.2 Phase-1-Mindest-Struktur (was am Ende von Phase 1 existiert)

Nicht alle Dateien werden in Phase 1 erstellt. Phase 1 baut nur:

```
Ernährungs-Dashboard/
├── ernaehrung.html
├── js/
│   ├── app.js
│   ├── version.js
│   ├── storage/
│   │   ├── localStorage.js
│   │   ├── indexeddb.js
│   │   ├── migrations.js
│   │   └── exportImport.js
│   ├── sync/
│   │   └── deviceId.js          (Phase 1: NUR lokale Geräte-ID — kein Sync, kein Supabase)
│   ├── calc/
│   │   ├── bmr.js
│   │   ├── macros.js
│   │   └── nutritionLogic.js   (Phase 1: assessDeficit + Proteinziel-Modi; Rest stubbed)
│   ├── data/
│   │   ├── mealTemplates.js
│   │   └── tips.js
│   ├── hooks/
│   │   ├── useProfile.js
│   │   ├── useSettings.js
│   │   └── useUiState.js
│   ├── ui/
│   │   ├── theme.js
│   │   ├── Navigation.js
│   │   ├── Modal.js
│   │   ├── KcalRing.js
│   │   ├── MacroBar.js
│   │   ├── Toast.js
│   │   └── BackupReminderBanner.js
│   └── tabs/
│       ├── heute/  (vollständig)
│       ├── tracker/TrackerTab.js   (Platzhalter "Phase 3")
│       ├── rezepte/RezepteTab.js   (Platzhalter "Phase 4")
│       ├── woche/  (Grundgerüst)
│       └── profil/  (vollständig)
├── docs/projekt-spezifikation.md
├── docs/implementierungsplan-phase-1.md
└── tests/manual-checklist-phase-1.md
```

PWA-Schale (manifest, service-worker, Icons) kommt erst in Phase 2. Phase 1 läuft als reguläre Webseite ohne Installation.

### 6.3 Auslieferung an GitHub Pages

GitHub Pages serviert das Repository-Root statisch. Es ist **kein** Build-Schritt notwendig — alle Dateien liegen im Repo so wie sie ausgeliefert werden. Upload-Workflow:

1. Geänderte Dateien lokal speichern
2. `git add` + `git commit` + `git push` (oder Web-UI-Upload für einzelne Dateien)
3. GitHub Pages aktualisiert die ausgelieferten Dateien automatisch (Minuten-Latenz)

Bei Service-Worker-Updates (ab Phase 2) muss zusätzlich `APP_VERSION` in `js/version.js` und `service-worker.js` synchron hochgezählt werden — siehe 3.8.

### 6.4 ernaehrung.html — Inhalt der Shell

Die HTML-Datei ist nur noch ein **schlankes Shell-Dokument**:

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  <title>Ernährungs-Tool · Stephanie Meurer</title>
  <link rel="manifest" href="./manifest.json"/>           <!-- ab Phase 2 -->
  <link rel="icon" href="./icons/icon-192.png"/>           <!-- ab Phase 2 -->
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600&family=DM+Mono:wght@400;600&display=swap" rel="stylesheet"/>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    /* Minimaler Reset + body-Background. Restliche Styles in js/ui/theme.js. */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; }
    body { background: #111; color: #f0ece4; font-family: 'DM Sans', sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module" data-presets="env,react" src="./js/app.js"></script>
</body>
</html>
```

Alles andere wandert in JS-Module unter `js/`.

---

## 7. Phasen-Roadmap

Implementierung in **6 inkrementellen Phasen**. Phase **1 zuerst vollständig stabilisieren**, dann Approval einholen, dann Phase 2 angehen — usw. Jede Phase muss **migrationssicher** sein: bestehende Nutzerdaten dürfen durch ein Upgrade niemals verloren gehen oder beschädigt werden.

### Phasen-übergreifende Regeln

1. **Pro Phase ein separater Implementierungsplan** (`docs/implementierungsplan-phase-N.md`), erstellt **nach** Abschluss der vorherigen Phase
2. **Schema-Bump nur bei strukturellen Änderungen** (siehe 4.4); Migrations-Skript ist Pflichtbestandteil jeder Phase mit Schema-Bump
3. **APP_VERSION** in `js/version.js` + `service-worker.js` synchron hochzählen (Patch-Bump für Bugfixes, Minor-Bump für neue Features, Major-Bump für strukturelle Brüche)
4. **Manueller Smoke-Test-Checkliste** je Phase in `tests/manual-checklist-phase-N.md`
5. **Daten-Backup vor jedem Upload**: Stephanie führt vor neuem Code-Upload den Export aus

### Phase 1 — Fundament

**Schwerpunkt** (vom Auftraggeber): **Erst Phase 1 komplett stabilisieren, bevor an Phase 2 gedacht wird.**

> **Phase 1 ist strikt cloud-frei (v1.2-Klarstellung).**
> Kein Supabase-Code. Kein Login. Keine Synchronisation. Kein Netzwerk außer dem (optionalen) Laden statischer Assets.
> Es wird **nur das Datenmodell** so vorbereitet, dass später Sync ergänzt werden kann (`Syncable`-Felder aus §4.6, `operatingMode: 'local'` fest).

**Ziel**: Multi-File-Architektur etabliert, Profil editierbar (inkl. neuer v1.2-Felder), Daten persistent in localStorage + IndexedDB-Skelett (mit Sync-Feldern), Export/Import funktionsfähig, Defizit-Warnung + Proteinziel-Modus aktiv, Heute-Tab läuft auf neuer Architektur mit Plan-Anzeige (ohne Live-Tracking).

**Deliverables**:
- Multi-File-Struktur unter `js/` (alle in 6.2 gelisteten Phase-1-Dateien)
- Shell `ernaehrung.html` aufs Minimum reduziert, lädt `js/app.js` als Modul
- Style-Theme aus altem File in `js/ui/theme.js` extrahiert
- `js/storage/localStorage.js` mit Profile/Settings/UiState-Funktionen
- `js/storage/indexeddb.js` mit `openDb()` (Schema-Version 1, Phase-1-Stores: `log` + `week` — weitere Stores kommen pro Phase mit Schema-Bump)
- `js/storage/migrations.js` mit `CURRENT_SCHEMA_VERSION = 1` und `runMigrations()`
- `js/storage/exportImport.js` mit `exportAll()` (ohne API-Key) und `importAll()` mit Versions-Check
- `js/sync/deviceId.js` (nur die ID-Erzeugung/-Speicherung — **kein** Sync, kein Supabase!) — erzeugt lokale `deviceId` für die `Syncable`-Felder
- `js/calc/nutritionLogic.js` mit `assessDeficit()` (Defizit-Warnung) — Protein-Rating/Tagesstruktur als Stubs
- `js/calc/macros.js` mit `calcProteinTarget()` (wertet `proteinTargetMode` aus)
- **Erststart-Assistent** (`tabs/profil/ErststartAssistent.js`): erscheint beim allerersten Start wenn kein Profil vorhanden; fragt Gewicht / Größe / Alter / Körperfett (optional, Schätzwert 40 % wenn übersprungen); legt danach Profil mit sinnvollen Defaults an; springt zum Heute-Tab
- `ProfileEditor`-Komponente im Profil-Tab: alle Felder editierbar inkl. `menopauseStatus`, `strengthTrainingDaysPerWeek`, `proteinTargetMode`; Live-Neuberechnung von Lean Mass / BMR / TDEE / Proteinziel; **Defizit-Warnung** bei zu aggressivem Defizit
- `SettingsPanel`: u.a. `enablePostmenopauseGuidance`-Toggle (Default an); `operatingMode` wird angezeigt, ist aber auf `'local'` fixiert (Sync „kommt später")
- `DataManagement`-Komponente: Export-Button (Download JSON), Import-Button (Datei wählen + Bestätigung + Replace), Backup-Reminder-Banner
- `HeuteTab` läuft auf neuer Architektur, zeigt Plan basierend auf Live-Profilwerten (kein Tracker-Input noch — das kommt in Phase 3)
- Manual-Smoke-Test-Checkliste in `tests/manual-checklist-phase-1.md`

**Akzeptanzkriterien** (Detail kommt im Implementierungsplan Phase 1):
- App lädt unter `ernaehrung.html` ohne Konsolen-Fehler
- **Keine** Netzwerk-Requests an Supabase oder irgendeinen Sync-Endpoint (im DevTools-Network-Tab überprüfbar)
- Profil-Editor speichert Änderungen inkl. der neuen v1.2-Felder, Werte sind nach Browser-Neustart erhalten
- BMR/TDEE/Makro-Tagesziele + Proteinziel rechnen sich nach jeder Profil-Änderung neu
- Defizit-Warnung erscheint, wenn ein zu aggressives Defizit eingestellt wird (Severity-Stufen safe/moderate/aggressive/dangerous)
- `proteinTargetMode` ändert die Proteinziel-Berechnung korrekt (perKgBodyweight vs. perKgLeanMass vs. fixed)
- Heute-Tab zeigt Mahlzeitenplan passend zu aktuellem Profil + gewähltem Tagestyp
- Export erzeugt JSON-Datei ohne `claudeApiKey`-Wert; alle Records enthalten `Syncable`-Felder
- Import einer Export-Datei stellt identischen Zustand auf zweitem Gerät her
- Backup-Reminder erscheint nach 7+ Tagen ohne Export
- IndexedDB ist auf Schema-Version 1 angelegt, Stores `log` und `week` existieren mit korrekten Indices (`dayType`, `updatedAt` / `year`, `updatedAt`)
- Jeder neu geschriebene Datensatz trägt `id`, `createdAt`, `updatedAt`, `deviceId` korrekt
- Erststart-Assistent läuft beim ersten App-Start ohne Profil; nach Abschluss ist Profil vorhanden und Wizard erscheint nie mehr; Körperfett-Schätzwert (40 %) wird korrekt gesetzt wenn übersprungen

**Migrationssicherheit**:
- Bei einer zukünftigen Schema-Version 2 muss die Migration `1 → 2` in `js/storage/migrations.js` ohne Datenverlust laufen
- Schema-Version 1 ist als "Initialschema" festgenagelt — keine nachträglichen Änderungen daran (sondern immer neuer Schritt 2)
- Stores werden mit den `Syncable`-Feldern angelegt, wenn sie erstmals erstellt werden — kein Backfill nötig

### Phase 2 — PWA-Schale

**Ziel**: App auf Smartphone installierbar, offline-fähig, Mobile-Layout.

**Deliverables**:
- `manifest.json`
- `service-worker.js` mit versionierter Cache-Strategie (siehe 3.8)
- 3 App-Icons (192/512/512-maskable)
- BottomNav-Komponente, aktiv bei Viewport < 768px
- Install-Prompt-Logik (1× anzeigen, in Settings dauerhaft markiert)
- Update-Erkennung mit "neu laden"-Banner

**Migrationssicherheit**: Kein Schema-Bump nötig (keine Datenmodell-Änderung). APP_VERSION bump auf 1.1.0.

**Akzeptanzkriterien**:
- App lässt sich auf iOS und Android zum Homescreen hinzufügen
- Im Flugmodus startet die App und alle gespeicherten Daten sind nutzbar
- Nach Code-Update wird der alte Cache gelöscht und der neue aktiviert
- Update-Banner erscheint korrekt, "neu laden" lädt mit neuen Assets

### Phase 3 — Tracker reloaded

**Ziel**: Schnelles Eintragen via Favoriten, Custom-Lebensmittel, Barcode.

**Deliverables**:
- FavoritesBar im Tracker-Tab
- "Aktuelle Mahlzeit als Favorit speichern"-Button
- CustomFoodModal (anlegen + bearbeiten) — schreibt in IndexedDB `foodsCustom`
- MealEditorModal (Favorit-Mahlzeit komponieren) — schreibt in `meals`
- Barcode-Scanner-Integration (`html5-qrcode`)
- Notvorrat-Toggle pro Custom-Lebensmittel
- VorratSection im Tracker-Tab (Liste eigene Lebensmittel + Notvorrat-Markierung)
- Open-Food-Facts-Suche mit `apiCache`-Lookup

**Migrationssicherheit**: Phase 3 legt `foodsCustom` und `meals` neu an → **Schema-Bump auf Version 2** ist Pflicht. Migration `2` in `INDEXED_DB_MIGRATIONS` erstellen, `CURRENT_SCHEMA_VERSION = 2` setzen. APP_VERSION bump auf 1.2.0.

**Akzeptanzkriterien**:
- Barcode-Scan eines bekannten Produkts (Open Food Facts) trägt in < 5 Sek. ein
- Barcode-Scan eines unbekannten Produkts öffnet Maske mit vorausgefülltem Code
- Favorit-Mahlzeit "Mein Standard-Frühstück" lässt sich mit 1 Klick eintragen
- Eigene Lebensmittel sind in der Suche neben Open-Food-Facts-Treffern sichtbar
- Tracker-Einträge wandern korrekt ins `log` (Tages-Tagebuch)

### Phase 4 — Rezepte ausbauen

**Ziel**: Volle Rezeptdatenbank mit Zubereitung, eigene Rezepte manuell anlegbar.

**Deliverables**:
- `js/data/initialRecipes.js` mit den 8 bestehenden + ca. 22 neuen Rezepten (alle mit `steps[]` und `isMain`-Flags)
- RecipeDetail-Komponente zeigt Schritte
- CreateRecipeButton + RecipeEditor (manuell) — schreibt in `recipesCustom`
- Auto-Makro-Berechnung wenn Zutaten DB-Refs haben

**Migrationssicherheit**: Phase 4 legt `recipesCustom` und `recipePhotos` neu an → **Schema-Bump auf Version 3**. Migration `3` schreiben, `CURRENT_SCHEMA_VERSION = 3`. APP_VERSION bump auf 1.3.0.

**Akzeptanzkriterien**:
- Jedes Initial-Rezept hat mind. 3 Schritte und 1 Hauptzutat
- Eigene Rezepte erscheinen in derselben Liste wie Initial-Rezepte (gemischt)
- Bei manuellem Anlegen werden Makros aus Zutaten summiert

### Phase 5 — Intelligenz

**Ziel**: App denkt mit — Kühlschrank-Matching + Vorschläge bei Lücken.

**Deliverables**:
- FridgeManager im Tracker-Tab (Liste, Hinzufügen, Löschen) — schreibt in `fridge`
- Rezept-Filter "Nur aus Kühlschrank" im Rezepte-Tab
- Match-Score-Anzeige im Rezept (✓/⚠️ neben Zutaten)
- GapSuggestions-Komponente auf Heute-Tab
- `js/calc/suggestions.js` mit `suggestForGap`
- `js/calc/matching.js` mit `matchRecipesAgainstFridge`
- AdaptationCheck auf Woche-Tab

**Migrationssicherheit**: Phase 5 legt `fridge` neu an → **Schema-Bump auf Version 4**. Migration `4` schreiben, `CURRENT_SCHEMA_VERSION = 4`. APP_VERSION bump auf 1.4.0.

**Akzeptanzkriterien**:
- Bei einem Kühlschrank-Inhalt aus 5 Items werden mind. 3 passende Rezepte angezeigt
- Bei abendlicher Protein-Lücke werden Notvorrat-Items mit konkreter Gramm-Empfehlung vorgeschlagen
- Vorschläge schlagen nicht doppelt mit bereits eingetragenen Mahlzeiten an

### Phase 6 — AI-Rezept-Foto

**Ziel**: Alte Rezepte aus Kochbuch fotografieren → strukturiert in App.

**Deliverables**:
- `ApiKeyPanel` im Profil-Tab (Sichtbar/Verstecken-Toggle, Löschen, "in Zwischenablage kopieren")
- `js/api/claudeVision.js` (lazy-imported)
- AI-Funktionen-Toggle in Settings
- PhotoRecipeButton in Rezepte-Tab (gated via `useAiEnabled`)
- Foto-Capture (Kamera) + File-Upload + JPEG-Kompression (max 500 KB)
- Claude-Vision-API-Call mit System-Prompt
- Edit-Vorschau mit ausgefüllten Feldern
- Original-Foto-Speicherung in `recipePhotos` (IndexedDB)
- Foto-Anzeige im RecipeDetail

**Migrationssicherheit**: Phase 6 legt `apiCache` neu an → **Schema-Bump auf Version 5**. Migration `5` schreiben, `CURRENT_SCHEMA_VERSION = 5`. APP_VERSION bump auf 1.5.0.

**Verschärfte Sicherheits-Akzeptanzkriterien**:
- Ohne gesetzten API-Key sind alle AI-Elemente komplett unsichtbar (kein Button, kein Menüpunkt, keine Tooltip-Erklärung)
- Ohne Key gibt es keinerlei Netzwerk-Requests an `api.anthropic.com` (im DevTools-Network-Tab überprüfbar)
- `exportAll()` produziert eine JSON-Datei, in der `claudeApiKey` immer `null` ist — selbst wenn ein Key gesetzt war
- "API-Key kopieren" ist eine separate, klar benannte Aktion und kein Teil des Standard-Exports
- Foto eines gedruckten Rezepts wird in < 10 Sek. in ein vorausgefülltes Formular umgewandelt
- Original-Foto wird in IndexedDB unter `recipePhotos` mit Rückverweis auf `CustomRecipe` gespeichert

---

## 8. Designentscheidungen mit Begründung

### 8.1 Warum PWA statt nativer App?

**Entscheidung**: Progressive Web App auf GitHub Pages.

**Begründung**:
- Bestehender Workflow (Single-HTML auf GitHub Pages) bleibt erhalten — kein Bruch
- Keine App-Store-Anmeldung, keine wiederkehrenden Gebühren (Apple Developer 99 €/Jahr)
- Updates ohne Store-Review, sofort verfügbar
- Cross-Platform automatisch (iOS, Android, Desktop) ohne separate Builds
- Für eine 1-Personen-App ohne Push-Notifications oder native Sensoren ausreichend
- Kamera-Zugriff (Barcode + Rezept-Foto) funktioniert via Browser-API einwandfrei

**Verworfen**: Capacitor/Cordova (würde nativ-Builds und Store-Anmeldung erfordern, Mehraufwand ohne Mehrwert).

### 8.2 Warum IndexedDB als Hauptspeicher + localStorage nur für Settings?

**Entscheidung** (vom Auftraggeber): IndexedDB ist Hauptspeicher für Log, Rezepte, Lebensmittel, Mahlzeiten, Kühlschrank, Fotos. localStorage nur für Profil, Settings und UI-Zustand.

**Begründung**:
- **Größen-Sicherheit**: localStorage hat 5-10 MB Limit; bei Rezept-Fotos (~300 KB pro Foto) wären 20-30 Rezepte das Maximum. IndexedDB hat praktisch keine Größengrenze.
- **Strukturierte Abfragen**: IndexedDB unterstützt Indices (Suche nach Barcode, Datum, Name) — bei localStorage müsste man immer den ganzen JSON-Blob laden und filtern
- **Asynchrone Schreibvorgänge**: blockieren nicht den Main-Thread (wichtig bei größeren Datenmengen)
- **Atomare Transaktionen**: IndexedDB kann mehrere Schreibvorgänge in einer Transaktion bündeln — verhindert inkonsistente Zustände bei Crashes
- **Native Schema-Versionierung**: `onupgradeneeded` macht Migrationen sauber handhabbar
- **localStorage bleibt sinnvoll** für Profil/Settings: synchroner Zugriff beim App-Start ohne `await`, kleine Datenmenge, häufige Lese-Zugriffe

**Datenschutz-Aspekt**: Im Local Mode (Standard, Phase 1) bleiben beide gerätelokal, kein Cloud-Storage. Backup nur via expliziten JSON-Export. In den optionalen Sync-Modi (§3.9) bleibt IndexedDB der lokale Arbeitsspeicher und Offline-Cache; Supabase ist additiv.

**Verworfen**: Komplett localStorage (Größenproblem), Cloud als **Pflicht**-Speicher (Datenschutz + Komplexität — Cloud bleibt opt-in), geteilte serverseitige DB für alle Nutzerinnen (Backend-Wartung + Haftung für fremde Daten).

### 8.3 Warum Multi-File ES-Module-Architektur statt Single-HTML?

**Entscheidung** (vom Auftraggeber, in Spec-Revision 1.1): Mehrere statische `.js`-Dateien als ES Modules, kein Build-Prozess.

**Begründung**:
- **Wartbarkeit**: Eine 3.000+ Zeilen HTML-Datei ist unübersichtlich, Suchen erschwert, Konflikte beim Editieren wahrscheinlicher
- **Trennung der Verantwortlichkeiten**: Storage, Berechnung, UI und API sind klar getrennt — jede Datei hat ein einziges Thema
- **Testbarkeit**: einzelne Module können isoliert getestet werden (z.B. `calc/macros.js` ohne UI)
- **Lazy-Loading-Option**: Module wie `claudeVision.js` werden nur bei Bedarf geladen — App-Start bleibt schlank wenn Foto-Funktion nicht genutzt wird
- **Diff-freundliches Versioning**: Änderungen am Storage-Layer sind in einer Datei sichtbar, nicht versteckt in einem 3.000-Zeilen-Diff

**Trotzdem kein Build**:
- Native ES Modules sind in allen Ziel-Browsern unterstützt
- Babel-Standalone mit `data-type="module"` erlaubt JSX in Modul-Dateien — kein npm, kein Webpack
- Zur Auslieferung: einfach alle Files committen, GitHub Pages serviert sie statisch
- Performance: Service Worker cacht ab Phase 2 alle Module — wiederholte Lade-Zeit ist 0

**Verworfen**:
- Single-HTML (Wartungsproblem ab 2.000+ Zeilen)
- Vite/Webpack (würde npm, Node.js, build-Schritt vor jedem Deploy erfordern)
- ESM-only ohne Babel (würde JSX→createElement-Refactoring erfordern, paradigmatischer Bruch)

### 8.4 Warum 3 Kategorien (Lebensmittel / Mahlzeit / Rezept)?

**Entscheidung**: Strikte Trennung dieser drei Konzepte.

**Begründung**:
- **Lebensmittel**: ein Einzelprodukt mit Barcode/Marke/Makros pro 100g — fundamentale Einheit
- **Mahlzeit (Favorit)**: eine fixe Kombi für 1-Klick-Eintrag ohne Schritte/Anleitung — Geschwindigkeit
- **Rezept**: eine Mahlzeit MIT Zubereitung — für tatsächliches Kochen
- Klare mentale Trennung verhindert UI-Verwirrung ("ist das ein Rezept oder ein Favorit?")
- Datenmodell sauber: 3 unterschiedliche Entities mit unterschiedlichen Feldern

**Verworfen**: "Alles ist ein Eintrag mit optionalen Feldern" (würde Suchfilter komplizieren).

### 8.5 Warum Notvorrat-Konzept?

**Entscheidung**: Lebensmittel können als "Notvorrat" markiert werden, die App priorisiert sie bei Tagesziel-Lücken.

**Begründung**:
- Stephanie weiß intuitiv welche Lebensmittel sie als Lücken-Füller daheim hat (Whey, Magerquark, Hüttenkäse)
- Generische Vorschläge ("iss Lachs") sind nutzlos wenn das Produkt nicht greifbar ist
- Notvorrat = explizite Liste, die sie aktiv pflegt
- Kombination mit Kühlschrank-Check: doppelte Verfügbarkeitsgarantie

**Alternative**: Maschinell aus dem Esstagebuch lernen welche Lebensmittel häufig spät am Tag gegessen werden. **Verworfen**: zu indirekt, intransparent.

### 8.6 Warum Claude Vision (nicht Tesseract.js)?

**Entscheidung**: Claude API für Rezept-Foto-Erkennung.

**Begründung**:
- Tesseract.js liefert nur rohen Text, keine Struktur — Stephanie müsste manuell sortieren
- Claude erkennt nicht nur Text sondern verstehst Rezept-Struktur (Name vs Zutat vs Schritt)
- Funktioniert auf Handschrift, mehrsprachigen Texten, ungewöhnlichen Layouts
- Mehrwert rechtfertigt die Kosten (~1-2 Cent pro Foto) für die seltene Verwendung
- API-Key bleibt unter Stephanies Kontrolle, vor Weitergabe automatisch ausgeschlossen

**Verworfen**: Tesseract.js (Qualität reicht nicht), Google Vision (kein bestehender Account, andere Datenschutz-Frage).

### 8.7 Warum Bottom-Navigation auf Mobile?

**Entscheidung**: Bottom-Nav mit 5 Icons unter 768px Viewport, Top-Tabs darüber.

**Begründung**:
- Daumen-erreichbar auf großen Smartphones (alles über 5,5" ist mit Top-Tabs schwer einhändig zu bedienen)
- iOS- und Android-Standard — Nutzer kennen das Muster
- 5 Tabs passen ohne Overflow oder Scroll
- Desktop-Nutzer behalten Top-Tabs (Maus statt Finger)

**Verworfen**: Burger-Menü (versteckt Funktionen), Drawer (zu viele Klicks für häufige Navigation).

### 8.8 Warum inkrementelle Phasen (6 statt 1 Rewrite)?

**Entscheidung**: Schrittweise Erweiterung in 6 Phasen, **Phase 1 zuerst vollständig stabilisieren** vor Beginn der nächsten.

**Begründung**:
- Nach jeder Phase ist die App benutzbar — Stephanie kann das Erlebte sammeln und Feedback geben
- Risiko-Minimierung: wenn Phase 4 scheitert, bleibt 1-3 stabil
- Datenkompatibilität wird gewahrt (Schema-Migration nur additiv, jede Phase migrationssicher — siehe 4.4)
- Lernkurve verteilt: nicht alle neuen Konzepte auf einmal
- Jede Phase bekommt einen eigenen detaillierten Implementierungsplan, erstellt **nach** Approval der vorherigen Phase

**Verworfen**: Big-Bang-Rewrite (alles bricht gleichzeitig, schwer zu debuggen, lange ohne nutzbare App).

### 8.9 Warum Schema-Versionierung mit Migration-Registry?

**Entscheidung** (vom Auftraggeber): Jedes Schema-Upgrade hat einen Migrationspfad, alte Daten überleben jede Phase.

**Begründung**:
- Stephanie hat keine Möglichkeit, einen "Reset" durchzuführen ohne Datenverlust — die App muss alte Daten transparent migrieren
- IndexedDB hat dafür native Unterstützung (`onupgradeneeded`); localStorage braucht handgeschriebene Logik
- Migrations-Registry als zentrale Stelle macht Reviews + Tests einfach
- Schema-Version ist separat von APP_VERSION: nicht jeder Code-Update zieht ein Schema-Bump nach sich, nur strukturelle Änderungen
- Hard-Fail bei kaputter Migration: lieber den Nutzer warnen als korrupte Daten produzieren

**Verworfen**: Implizite Migration durch Default-Werte (führt schleichend zu Daten-Inkonsistenzen); "wer ein Update macht, verliert seine Daten" (inakzeptabel).

### 8.10 Warum PWA-Cache mit expliziter Versions-Logik?

**Entscheidung** (vom Auftraggeber): Service-Worker-Cache-Namen enthalten `APP_VERSION`, alte Caches werden bei Activation gelöscht.

**Begründung**:
- Ohne Versions-Logik kann ein veralteter Cache neue Bugs maskieren — Nutzer sieht alte JS-Datei, App verhält sich seltsam
- Versionierte Cache-Namen + Cleanup garantiert: nach SW-Activation sind nur Assets der aktuellen Version vorhanden
- Update-Banner erlaubt Stephanie zu entscheiden, wann sie neu lädt (statt unsichtbares Auto-Reload)
- `skipWaiting()` + `clients.claim()` machen das Update sofort wirksam ohne mehrfachen Tab-Refresh
- Klare Versions-Bump-Regel: bei jedem Code-Upload wird APP_VERSION manuell hochgezählt

**Verworfen**: Ein einziger Cache-Name, der überschrieben wird (führt zu schwer reproduzierbaren Stale-Cache-Bugs).

### 8.11 Warum AI-Key niemals automatisch exportieren?

**Entscheidung** (vom Auftraggeber): Beim Standard-Export ist `claudeApiKey` immer `null`, kein Toggle hebelt das aus.

**Begründung**:
- Stephanie will die App an Klientinnen weitergeben können, ohne dass ihr persönlicher API-Key (= ihre Geldbörse) mitgeschickt wird
- Ein Toggle wäre leicht zu vergessen → versehentlicher Key-Versand → unbekannte Kosten
- Manuelles Kopieren via separater "API-Key in Zwischenablage"-Aktion ist eindeutig und nicht automatisierbar
- Defense-in-Depth: selbst wenn UI-Code irrtümlich versucht zu exportieren, fügt `exportAll()` keinen Key hinzu
- Spec-getriebener Hard-Constraint: kein zukünftiges Feature kann diese Regel umgehen

**Verworfen**: Toggle "Key mit-exportieren" (zu leicht falsch geklickt); Key in separatem Backup-Format (verkompliziert UI ohne Mehrwert).

### 8.12 Warum Spezialisierung auf postmenopausale Frauen (kein generischer Tracker)?

**Entscheidung** (vom Auftraggeber, v1.2): Die App ist ausschließlich auf postmenopausale Frauen mit Ziel Fettabbau + Muskelerhalt/-aufbau durch Krafttraining ausgerichtet.

**Begründung**:
- **Differenzierung**: Generische Tracker (MyFitnessPal etc.) gibt es zuhauf; sie ignorieren anabole Resistenz, Leucin-Schwellen und postmenopausale Stoffwechsellage
- **Bessere Entscheidungen**: Eine enge Zielgruppe erlaubt klare, mutige Defaults (1,9 g Protein/kg, Casein abends, Defizit-Schutz) statt verwaschener Allgemein-Logik
- **Designmaxime als Filter** (§1.8): Jedes Feature wird am Nutzen für die Zielgruppe gemessen — verhindert Feature-Wildwuchs
- **Stephanies Doppelrolle**: Sie ist selbst Zielgruppe UND betreut Klientinnen derselben Gruppe — die Spezialisierung dient beidem
- **Proteinverteilung statt Kalorienzählen**: Der wissenschaftliche Kern (MPS-Stimulation pro Mahlzeit) ist genau das, was generische Tracker nicht leisten

**Verworfen**: Breiter Markt / generischer Tracker (austauschbar, kein Alleinstellungsmerkmal, würde die spezialisierte Logik verwässern).

### 8.13 Warum drei Cloud-Betriebsarten statt Local-Only oder Voll-Cloud?

**Entscheidung** (vom Auftraggeber, v1.2): Local Mode (Standard) / Personal Sync Mode / User Cloud Mode — als Zukunftspfad, nicht in Phase 1.

**Begründung**:
- **Local Mode** schützt Datenschutz und bleibt der Standard für weitergegebene Instanzen — keine Pflicht-Anmeldung
- **Personal Sync Mode** löst Stephanies konkretes Problem: dieselben Daten auf iPhone, iPad und Desktop ohne manuellen Export/Import
- **User Cloud Mode** erlaubt fortgeschrittenen Nutzerinnen eigene Datenhoheit, **ohne** dass deren Daten in Stephanies Datenbank landen (Haftung + Datenschutz + Kosten)
- **Offline-First bleibt überall**: IndexedDB ist immer der lokale Arbeitsspeicher; Cloud ist additiv
- **Phasensicher**: Durch `Syncable`-Felder ab Phase 1 ist später kein Datenmodell-Bruch nötig — die teure Vorarbeit wird einmal richtig gemacht

**Verworfen / zurückgestellt**:
- Reines Local-Only für immer (löst Stephanies Mehrgeräte-Problem nicht)
- Voll-Cloud mit Pflicht-Login (bricht Datenschutz-Versprechen, macht Weitergabe an Klientinnen kompliziert)
- User Cloud Mode: erst evaluieren, wenn tatsächlich viele Nutzerinnen die App verwenden — kein voreilig geplantes Feature

**Phase-1-Grenze**: In Phase 1 existiert ausschließlich Local Mode. `operatingMode` steht auf `'local'` und kann nicht umgeschaltet werden.

---

## Anhang A — Glossar

| Begriff | Bedeutung |
|---|---|
| **PWA** | Progressive Web App — Webseite, die sich wie eine App installieren lässt |
| **BMR** | Basal Metabolic Rate, Grundumsatz in Ruhe |
| **TDEE** | Total Daily Energy Expenditure, Gesamtumsatz inkl. Aktivität |
| **PAL** | Physical Activity Level, Multiplikator für BMR |
| **Katch-McArdle** | BMR-Formel basierend auf fettfreier Masse |
| **MPS** | Muskelproteinsynthese |
| **Anabole Resistenz** | Verminderte MPS-Antwort auf Protein, postmenopausal verstärkt |
| **Leucin-Schwelle / Leucin-Trigger** | Mindestmenge Leucin (~2,5–3 g) pro Mahlzeit, um die MPS auszulösen |
| **Casein** | Langsam verdauliches Milchprotein, ideal abends (nächtliche Regeneration) |
| **Proteinverteilung** | Gleichmäßige, schwellenwirksame Verteilung von Protein über die Mahlzeiten des Tages |
| **Metabolische Adaptation** | Reduktion des Grundumsatzes nach längerem Kaloriendefizit |
| **Open Food Facts** | Offene Lebensmittel-Datenbank mit > 3 Mio. Produkten |
| **localStorage** | Browser-API für kleine persistente Daten, synchron |
| **IndexedDB** | Browser-API für große persistente Daten, asynchron |
| **Service Worker** | Hintergrund-Skript, das Caching und Offline-Verhalten steuert |
| **Manifest** | JSON-Datei, die der App ihre Identität (Name, Icon, Theme) gibt |
| **Syncable** | Basis-Interface mit id/createdAt/updatedAt/deletedAt/deviceId für sync-fähige Datensätze |
| **Last-Write-Wins** | Konfliktauflösung beim Sync: der Datensatz mit dem höheren `updatedAt` gewinnt |
| **Soft-Delete** | Löschung via `deletedAt`-Marker statt physischem Entfernen (damit Sync die Löschung überträgt) |
| **Supabase** | Open-Source-Backend (Postgres + Auth + Storage), Basis für die optionalen Sync-Modi |
| **deviceId** | Lokal erzeugte Geräte-Kennung, die jeden geschriebenen Datensatz markiert |

---

## Anhang B — Offene Punkte für späteren Ausbau

Nicht in Phase 1-6, aber sinnvoll als spätere Erweiterung. **Jeder Punkt muss vor Aufnahme den Postmenopause-Litmus-Test (§1.8) bestehen.**

- **Sync-Phase**: Umsetzung der drei Cloud-Betriebsarten aus §3.9 (Personal Sync via Supabase zuerst, dann User Cloud Mode) — Datenmodell ist ab Phase 1 vorbereitet
- **Foto-Sync** für Rezept-Bilder (separater Pfad via Supabase Storage Buckets)
- **Stapel-Verarbeitung** mehrerer Rezept-Fotos auf einmal
- **Trainings-Logbuch** (Gewichte, Sätze, Wiederholungen) — unterstützt Muskelaufbau-Ziel, besteht den Litmus-Test
- **Statistiken & Grafiken** (Gewichtsverlauf, Proteinverteilungs-Trends, Makro-Trends über Wochen)
- **Push-Erinnerungen** ("Vergiss dein Casein vor dem Schlafen") — nur auf Android via PWA möglich
- **Rezept-Teilen-Funktion** (URL zum Importieren in andere Instanz)

Bewusst **nicht** geplant (bestehen den Litmus-Test nicht oder widersprechen Non-Goals):
- Wasserzufuhr-/Schritte-/Schlaf-Tracking als Kern-Feature (kein direkter Bezug zu Protein/Muskelerhalt im Defizit)
- Gamification/Streaks/Punkte (generisches Tracker-Muster)
- Mehrprofil-Verwaltung auf einem Gerät (bewusst verworfen — ein editierbares Profil + Sync deckt den Bedarf)

---

*Ende der Spezifikation.*
