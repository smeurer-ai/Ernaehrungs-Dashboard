# Phase-2-Abschlussbericht: PWA + Bottom-Navigation

**Projekt**: Ernährungs-Dashboard PWA  
**Phase**: 2 von 6  
**Datum**: 2026-06-01  
**Branch**: `master`  
**Status**: ✅ Abgeschlossen, gepusht

---

## 1. Umgesetzte Dateien

### Neue Dateien (12)

| Datei | Funktion |
|---|---|
| `.nojekyll` | Deaktiviert Jekyll auf GitHub Pages (Fix für Liquid-Syntax-Fehler in docs/) |
| `manifest.json` | PWA-Manifest (Name, Icons, Display standalone, Theme #111) |
| `service-worker.js` | Cache-First für lokale Assets, Stale-While-Revalidate für CDN, Update-Pattern |
| `icons/icon-192.png` | App-Icon 192×192 (goldenes E in Gold-Ring auf #111) |
| `icons/icon-512.png` | App-Icon 512×512 |
| `icons/icon-maskable-512.png` | Maskable Icon für adaptive Icons (Android) |
| `js/pwa/registerServiceWorker.js` | SW registrieren, Update-Erkennung via statechange, controllerchange → reload |
| `js/ui/UpdateBanner.js` | "App-Update verfügbar — Jetzt laden / Später" Banner |
| `tests/manual-checklist-phase-2.md` | Smoke-Test-Checkliste T-00 bis T-09 |

### Geänderte Dateien (5)

| Datei | Änderung |
|---|---|
| `js/version.js` | APP_VERSION 1.0.0 → 1.1.0 |
| `js/ui/theme.js` | Neue Styles: `S.bottomNav`, `S.bottomNavTab`, `S.bottomNavIcon` ergänzt |
| `js/ui/Navigation.js` | Top-Tabs komplett → Bottom-Navigation mit Emoji-Icons |
| `ernaehrung.html` | `<link rel="manifest">`, `<meta theme-color>`, `apple-touch-icon`, `overscroll-behavior: none` |
| `js/app.js` | `registerServiceWorker` + `UpdateBanner` eingebunden; Navigation ans Ende verschoben |

### Architektur-Änderungen (Task 0, vor Phase-2-Start)

| Datei | Änderung |
|---|---|
| `js/tabs/profil/ErststartAssistent.js` | Default `proteinTargetMode` → `'perKgLeanMass'`, `proteinPerKg` → `2.0` |
| `js/storage/migrations.js` | Fallback-Migration: bestehende Profile ohne LBM-Felder erhalten Defaults |
| `js/data/mealTemplates.js` | Kommentar zur Mahlzeiten-Flexibilität (3/4/5 Mahlzeiten generisch möglich) |
| `docs/projekt-spezifikation.md` | §1.8 um zweite Leitfrage (MPS-Fokus) ergänzt |

---

## 2. Commit-Übersicht

| Commit | Beschreibung |
|---|---|
| `25bfcf4` | arch: LBM als Protein-Standard + MPS-Leitfrage + Mahlzeiten-Flexibilitätshinweis |
| `a8dd504` | chore: bump version to 1.1.0 for Phase 2 |
| `e3687a0` | feat: add PWA app icons (192, 512, maskable) |
| `156cc28` | feat: add PWA manifest |
| `d16e632` | feat: add service worker with cache-first strategy + update pattern |
| `b23e74f` | feat: add service worker registration + update detection |
| `76e348b` | feat: add UpdateBanner for PWA update flow |
| `caa8dea` | feat: replace top tabs with bottom navigation |
| `aee07cf` | feat: add PWA meta tags, manifest link, apple-touch-icon |
| `4d50c11` | feat: wire up service worker + UpdateBanner in app |
| `7718265` | docs: add Phase 2 manual smoke test checklist |
| `eca4188` | fix: add .nojekyll to disable Jekyll (Liquid syntax errors in docs/) |

---

## 3. Behobene Bugs

### Jekyll / GitHub Pages — Liquid-Syntax-Fehler

**Problem:** GitHub Pages versuchte das Repository mit Jekyll zu rendern. Markdown-Dateien in `docs/` enthielten JavaScript-Code mit `${COLORS.gold}` und `{{ }}` Syntax — Jekyll interpretierte das als Liquid-Template-Variablen und schlug mit Fehler 232 fehl.

**Ursache:** Kein `.nojekyll` File im Repo-Root → GitHub Pages aktiviert automatisch Jekyll für alle Repos ohne Build-Konfiguration.

**Fix:** `.nojekyll` Datei im Repo-Root erstellt (Commit `eca4188`). GitHub Pages liefert jetzt alle Dateien direkt als statische Assets aus — kein Jekyll-Processing mehr.

**Auswirkung:** Keine. `index.html` (Weiterleitung) und `ernaehrung.html` (App) funktionieren unverändert als statische Dateien.

---

## 4. Service Worker — Technische Details

### Cache-Strategie

| Request-Typ | Strategie | Cache-Name |
|---|---|---|
| Lokale Assets (origin) | Cache-First → bei Miss: Netz + in Cache speichern | `ernaehrung-static-1.1.0` |
| CDN (esm.sh, jsdelivr) | Stale-While-Revalidate | `ernaehrung-cdn-1.1.0` |
| Alles andere | Network-First mit Cache-Fallback | — |

### Update-Flow

```
Neue Version deployt
  → neuer SW installiert sich (State: installing → installed → waiting)
  → registerServiceWorker.js erkennt 'installed' + controller vorhanden
  → UpdateBanner erscheint: "🔄 App-Update verfügbar"
  → Nutzerin klickt "Jetzt laden"
  → SKIP_WAITING-Message → SW übernimmt → controllerchange → window.location.reload()
```

**Wichtig:** `skipWaiting()` wird NIE automatisch im `install`-Event aufgerufen. Die Nutzerin entscheidet aktiv über den Zeitpunkt des Updates.

### Versions-Regel (bindend für alle zukünftigen Phasen)

Bei jeder Änderung an JS-Dateien oder bei neuen Releases:
1. `APP_VERSION` in `js/version.js` hochzählen
2. `APP_VERSION` in `service-worker.js` **synchron** anpassen
3. Neue Dateien in `LOCAL_ASSETS`-Array in `service-worker.js` eintragen

---

## 5. Bekannte offene Probleme

### P1 — UpdateBanner-Flow manuell ungetestet (Mittel)

Der UpdateBanner-Flow kann erst vollständig getestet werden wenn die App auf GitHub Pages läuft und ein zweites Deployment die Version ändert. Funktionalität ist implementierungsseitig korrekt (Spec-Review bestätigt), aber kein Live-Test möglich ohne tatsächliches Versionierungs-Event.

**Test-Anleitung:** DevTools → Application → Service Workers → "Update on reload" aktivieren → Seite neu laden.

### P2 — Icon-Qualität: algorithmisch generiert (Niedrig)

Die Icons wurden mit Python/Pillow als einfaches „E" in Gold-Ring generiert. Für professionellen Einsatz (App Store, App-Katalog) wäre ein vektorgrafisch designtes Icon vorzuziehen. Für GitHub Pages / privaten Einsatz ausreichend.

### P3 — Google Fonts offline nicht verfügbar (Niedrig)

`Playfair Display`, `DM Sans` und `DM Mono` werden von Google Fonts geladen. Der Service Worker cached diese nicht (Google Fonts-CORS-Verhalten macht Pre-Caching kompliziert). Bei Offline-Nutzung fallen die App auf System-Schriften zurück.

**Auswirkung:** Rein ästhetisch — Funktionalität unberührt. Kann in Phase 3+ durch lokales Font-Hosting gelöst werden.

### P4 — Inhalt durch Bottom-Nav verdeckt (potenziell, muss getestet werden)

`S.content` hat `paddingBottom: 80px` — das sollte ausreichend sein für die 62px hohe Bottom-Nav plus Safe-Area. Auf Geräten mit besonders hohen Home-Indicator-Bereichen (iPhone Pro Max) könnte Content leicht verdeckt werden.

**Test:** T-02 in der Smoke-Test-Checkliste.

---

## 6. Technische Schulden (akkumuliert)

| ID | Beschreibung | Priorität | Wann |
|---|---|---|---|
| TS-01 | Keine Unit-Tests für `calc/` | Mittel | **Vor Phase 3 (Pflicht)** |
| TS-05 | IndexedDB-Doppelöffnung (migrations.js + indexeddb.js) | Niedrig | Phase 3 |
| TS-06 | Toast außerhalb Provider schlägt lautlos fehl | Niedrig | Phase 3 |
| TS-07 (neu) | Google Fonts nicht offline-fähig | Niedrig | Phase 3+ optional |

---

## 7. Spec-Coverage-Check Phase 2

| Feature (Spec §2) | Implementiert | Getestet |
|---|---|---|
| #16 PWA-Installation (Manifest + SW) | ✅ | ⏳ Manual-Test ausstehend |
| #17 Bottom-Navigation | ✅ | ⏳ Manual-Test ausstehend |
| #18 Offline-Modus | ✅ | ⏳ Manual-Test ausstehend |
| #19 Update-Benachrichtigung | ✅ | ⏳ Manual-Test ausstehend |
| #20 App-Icon | ✅ | ⏳ Manual-Test ausstehend |

**Bewusst nicht implementiert:**
- Custom Install-Prompt (`installPrompt.js`): Browser-nativer Prompt ist für Phase 2 ausreichend. Kommt optional in Phase 3.

---

## 8. Empfehlungen vor Phase 3

### 🔴 Pflicht vor Phase 3

**1. Vitest für `calc/`-Schicht einrichten (TS-01)**  
`bmr.js`, `macros.js`, `nutritionLogic.js` sind pure Funktionen — ideal für Unit-Tests. Phase 3 bringt IndexedDB-Operationen und Barcode-Integration — ohne Testfundament wird Debugging deutlich teurer.

**2. Phase-2-Smoke-Tests durchführen**  
Checkliste: `tests/manual-checklist-phase-2.md`. Besonders T-03 (SW registriert), T-06 (Offline), T-02 (Inhalt nicht verdeckt).

### 🟡 Empfohlen vor Phase 3

**3. Versionierungs-Workflow dokumentieren / automatisieren**  
Bei Phase 3 werden neue Dateien entstehen → `LOCAL_ASSETS` in `service-worker.js` muss aktuell gehalten werden. Empfehlung: beim Phase-3-Abschluss einen Check im Commit-Workflow etablieren.

---

## 9. Zusammenfassung

| Kennzahl | Wert |
|---|---|
| Commits | 12 (inkl. Hotfix .nojekyll) |
| Neue Dateien | 9 |
| Geänderte Dateien | 5 |
| Behobene Bugs | 1 (Jekyll/Liquid) |
| Neue offene Probleme | 4 (alle Niedrig/Mittel) |
| Technische Schulden | 4 (unverändert + 1 neu) |
| Schema-Version | 1 (unverändert — kein neuer Store) |
| APP_VERSION | 1.1.0 |
| Test-Ergebnis | ⏳ Manual-Tests ausstehend (GitHub Pages baut gerade) |
| Nächster Schritt | Phase 3: Tracker, Lebensmittel-Suche, Barcode, foodsCustom-Store |

---

*Bericht erstellt: 2026-06-01 · Branch: master · Letzter Commit: eca4188*
