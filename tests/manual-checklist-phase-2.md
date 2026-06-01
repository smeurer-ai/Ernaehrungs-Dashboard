# Manuelle Smoke-Tests Phase 2 — PWA + Bottom Navigation

**Datum:** ___________  
**Tester:** ___________  
**URL:** https://smeurer-ai.github.io/Ernaehrungs-Dashboard/ernaehrung.html

---

## T-00: Smoke — App lädt ohne Fehler

- [ ] App öffnet in Chrome auf Desktop, keine Konsolen-Fehler (F12 → Console)
- [ ] App öffnet in Chrome auf Android (oder iOS Safari), keine weißen Bildschirme
- [ ] Alle 5 Tabs der Bottom-Navigation sichtbar: Heute, Tracker, Rezepte, Woche, Profil
- [ ] Navigation am **unteren** Bildschirmrand (nicht mehr oben)
- [ ] Aktiver Tab (Heute) hat goldene Akzentlinie + goldene Schrift

---

## T-01: Bottom-Navigation — Tab-Wechsel

- [ ] Klick auf "Tracker" → Tracker-Tab öffnet sich
- [ ] Klick auf "Rezepte" → Rezepte-Tab öffnet sich
- [ ] Klick auf "Woche" → Woche-Tab öffnet sich
- [ ] Klick auf "Profil" → Profil-Tab öffnet sich
- [ ] Klick auf "Heute" → zurück zum Heute-Tab
- [ ] Aktive Tab-Kennzeichnung folgt dem Klick korrekt

---

## T-02: Inhalt nicht verdeckt durch Bottom-Nav

- [ ] Heute-Tab: Unterste Karte (Abendessen) vollständig sichtbar, nicht von Nav verdeckt
- [ ] Profil-Tab: Speichern-Button erreichbar, nicht von Nav verdeckt
- [ ] Scroll-Position endet oberhalb der Bottom-Nav

---

## T-03: PWA — Service Worker registriert

- [ ] Chrome DevTools → Application → Service Workers: Status "activated and running" für `service-worker.js`
- [ ] Chrome DevTools → Application → Cache Storage: `ernaehrung-static-1.1.0` und `ernaehrung-cdn-1.1.0` vorhanden
- [ ] Gecachte Dateien vorhanden (mindestens ernaehrung.html, js/app.js, js/lib.js)

---

## T-04: PWA — App als installierbar erkannt

- [ ] Chrome Desktop: Installations-Icon in der Adressleiste sichtbar (⊕ oder ähnlich)
- [ ] Chrome Android: "Zum Startbildschirm hinzufügen" erscheint im Browser-Menü
- [ ] Manifest valide: DevTools → Application → Manifest → Keine Fehler

---

## T-05: PWA — Installation + Standalone-Modus

- [ ] App installieren (via Browser-Prompt oder Menü "Zum Startbildschirm")
- [ ] App vom Homescreen/App-Icon öffnen
- [ ] App läuft im Standalone-Modus (kein Browser-Chrome sichtbar)
- [ ] App-Icon entspricht dem generierten Icon (dunkel mit goldenem E)
- [ ] Vollbild-Ansicht (kein URL-Bar)

---

## T-06: Offline-Modus

- [ ] App im Browser öffnen (einmal, damit SW cached)
- [ ] Chrome DevTools → Network → "Offline" aktivieren
- [ ] Seite neu laden → App öffnet sich **ohne Netzwerk**
- [ ] Heute-Tab funktioniert (Plan sichtbar)
- [ ] Chrome DevTools → Network → "Offline" deaktivieren

---

## T-07: UpdateBanner-Flow (Simulation)

- [ ] Chrome DevTools → Application → Service Workers → "Update on reload" aktivieren
- [ ] Seite neu laden
- [ ] In DevTools: neuer SW erscheint als "waiting to activate"
- [ ] UpdateBanner im App-UI sichtbar: "🔄 App-Update verfügbar"
- [ ] Klick auf "Jetzt laden" → App lädt neu → Banner weg → neuer SW aktiv
- [ ] Klick auf "Später" → Banner verschwindet, SW bleibt wartend

---

## T-08: iOS-Safari (falls verfügbar)

- [ ] App lädt ohne Fehler
- [ ] Bottom-Navigation sichtbar + funktionsfähig
- [ ] Kein Inhalt unter der iPhone-Home-Indicator-Leiste verdeckt (safe-area-inset)
- [ ] "Zum Home-Bildschirm" → App öffnet sich in Vollbild

---

## T-09: Regressions-Check Phase 1

- [ ] Erststart-Wizard erscheint bei leerem Profil (nach Clear Storage)
- [ ] Profil-Editor speichert Änderungen (Gewicht, BMR-Berechnung korrekt)
- [ ] Export funktioniert (JSON-Download)
- [ ] Import funktioniert (JSON laden, Profil wiederhergestellt)
- [ ] Heute-Tab zeigt Mahlzeitenplan passend zum Tagestyp
