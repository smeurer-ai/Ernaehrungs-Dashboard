# Manuelle Test-Checkliste — Phase 1: Fundament

**Datum**: _______
**Tester**: Stephanie Meurer
**Browser**: _______
**Gerät**: _______

> **Vorbereitung**: App über lokalen Webserver öffnen.
> `python -m http.server 8080` im Projektordner, dann http://localhost:8080 im Browser.
> (Pflicht wegen CORS — direkt als Datei öffnen funktioniert nicht)

---

## T-00 — Proof of Concept (zuerst testen)

| # | Test | ✓/✗ | Notiz |
|---|---|---|---|
| 1 | `poc/index.html` über lokalen Webserver öffnen | | |
| 2 | Seite zeigt "Hallo Stephanie" | | |
| 3 | Keine Konsolen-Fehler (F12 → Console) | | |
| 4 | Kein CORS-Fehler | | |

**Ergebnis PoC**: ☐ Erfolgreich → weiter mit T-01  ☐ Gescheitert → Fallback-Plan nötig

---

## T-01 — App-Start

| # | Test | ✓/✗ | Notiz |
|---|---|---|---|
| 1 | `ernaehrung.html` öffnet im Browser ohne Konsolen-Fehler | | |
| 2 | Keine Network-Requests an Supabase, api.anthropic.com (F12 → Network) | | |
| 3 | IndexedDB angelegt (F12 → Application → IndexedDB → `ernaehrung-db` mit `log` + `week`) | | |
| 4 | localStorage enthält `ernaehrung_schema_version = 1` | | |
| 5 | localStorage enthält `ernaehrung_settings` und `ernaehrung_ui_state` | | |
| 6 | localStorage enthält **kein** `ernaehrung_profile` (Erststart-Wizard soll erscheinen) | | |

---

## T-02 — Erststart-Assistent

| # | Test | ✓/✗ | Notiz |
|---|---|---|---|
| 1 | Erster Start ohne Profil: Erststart-Wizard erscheint (nicht die normale App) | | |
| 2 | Schritt 1 "Gewicht": Eingabefeld sichtbar, Titel und Icon korrekt | | |
| 3 | Schritt 1: Eingabe 100 → Weiter-Button aktiv und Gold-Farbe | | |
| 4 | Schritt 1: Eingabe 20 (zu wenig) → Weiter-Button gesperrt | | |
| 5 | Schritt 2 "Größe": erscheint nach Weiter, Eingabe 178 möglich | | |
| 6 | Schritt 3 "Alter": erscheint, Eingabe 59 möglich | | |
| 7 | Schritt 4 "Körperfett": erscheint, "Überspringen"-Link sichtbar | | |
| 8 | Schritt 4: Eingabe 46.6, "Fertig starten"-Button aktiv | | |
| 9 | Nach "Fertig starten": App öffnet den Heute-Tab (kein Wizard mehr) | | |
| 10 | localStorage enthält jetzt `ernaehrung_profile` mit den eingegebenen Werten | | |
| 11 | Browser-Reload: Wizard erscheint **nicht** mehr, normale App läuft | | |

**Körperfett-Überspringen testen** (neues Profil oder localStorage leeren):
| 12 | Schritt 4: "Überspringen"-Link klicken → App startet | | |
| 13 | localStorage-Profil: `bodyFat = 40` (Schätzwert) | | |

---

## T-03 — Migration / normaler Start

| # | Test | ✓/✗ | Notiz |
|---|---|---|---|
| 1 | Nach Wizard: Heute-Tab zeigt Mahlzeitenplan | | |
| 2 | Alle 5 Tabs navigierbar (Heute, Tracker, Rezepte, Woche, Profil) | | |
| 3 | Navigation-Buttons korrekt hervorgehoben (aktiver Tab gold) | | |

---

## T-04 — Profil-Editor

| # | Test | ✓/✗ | Notiz |
|---|---|---|---|
| 1 | Profil-Tab → Profil bearbeiten-Formular sichtbar | | |
| 2 | Alle Felder editierbar | | |
| 3 | Live-Vorschau (BMR, TDEE, Proteinziel) aktualisiert sich bei Eingabe | | |
| 4 | Gewicht ändern → leanMass in Vorschau ändert sich | | |
| 5 | "Speichern"-Button schreibt Werte | | |
| 6 | Browser-Reload: geänderte Werte erhalten | | |
| 7 | Defizit = 300 kcal → KEIN Warnhinweis | | |
| 8 | Defizit = 700 kcal → Warnung "aggressiv" sichtbar (orange Hinweis) | | |
| 9 | Defizit = 900 kcal → Warnung "gefährlich" sichtbar (roter Hinweis) | | |
| 10 | Defizit zurück auf 300 → Warnung verschwindet | | |
| 11 | Protein-Modus auf "perKgLeanMass" → Proteinziel ändert sich (kleiner als perKgBodyweight) | | |
| 12 | Protein-Modus auf "fixed" → Proteinziel = eingegebener Rohwert in g | | |
| 13 | Eingabe Gewicht < 30 → Weiter-Button gesperrt oder min-Validierung | | |

**Referenzwerte** (mit Stephanie-Standardwerten: 100 kg, 46.6 % KFA):
| 14 | LBM ≈ 53.4 kg in Vorschau sichtbar | | |
| 15 | BMR ≈ 1523 kcal | | |
| 16 | TDEE Training (Faktor 1.55) ≈ 2361 kcal | | |
| 17 | Proteinziel (1.9 g/kg KG, 100 kg) = 190 g | | |

---

## T-05 — Export / Import

| # | Test | ✓/✗ | Notiz |
|---|---|---|---|
| 1 | Profil-Tab → "Daten exportieren" → JSON-Datei wird heruntergeladen | | |
| 2 | Datei öffnen: `claudeApiKey` ist `null` | | |
| 3 | Datei öffnen: `schemaVersion: 1` | | |
| 4 | Datei öffnen: `profile.weight` = gespeicherter Wert | | |
| 5 | `Settings.lastBackupAt` aktualisiert sich nach Export (Tage-Anzeige ändert sich) | | |
| 6 | Inkognito-Fenster / zweiter Browser öffnen, Import-Button, Datei wählen | | |
| 7 | Confirm-Dialog erscheint ("Alle Daten werden ersetzt") | | |
| 8 | Nach Bestätigung: Seite lädt neu, Profil-Werte identisch mit exportiertem Stand | | |
| 9 | Import: `claudeApiKey` bleibt immer `null` (auch wenn in Datei vorhanden) | | |

**Fehlerfall**:
| 10 | JSON-Datei manuell bearbeiten: `schemaVersion: 999` → Import zeigt Fehlermeldung | | |

---

## T-06 — Backup-Reminder-Banner

| # | Test | ✓/✗ | Notiz |
|---|---|---|---|
| 1 | Direkt nach Export: kein Banner sichtbar | | |
| 2 | localStorage: `ernaehrung_settings` → `lastBackupAt` auf Wert vor 8+ Tagen setzen | | |
| 3 | Browser-Reload: Backup-Reminder-Banner erscheint oben | | |
| 4 | Banner zeigt Tage seit letztem Backup | | |
| 5 | "Jetzt sichern"-Button in Banner → startet Export, Banner verschwindet | | |

---

## T-07 — Heute-Tab (alle 3 Tagestypen)

| # | Test | ✓/✗ | Notiz |
|---|---|---|---|
| 1 | Trainingstag + 08:00: Pre-Workout (07:15), Post-Workout (09:30), Mittag (13:00), Abend (18:30) | | |
| 2 | Trainingstag + 14:30: Frühstück (08:00), Pre-Workout (12:30), Post-Workout (16:00), Abend (19:30) | | |
| 3 | Ruhetag: Frühstück (08:00), Mittag (12:30), Nachmittagssnack (16:00), Abend (19:00) | | |
| 4 | Kcal-Ring zeigt Tagesziel (0 von X kcal gegessen — kein Tracker in Phase 1) | | |
| 5 | Makro-Balken zeigen Zielwerte (alle bei 0 — kein Tracker) | | |
| 6 | Jede Mahlzeit zeigt Icon, Zeit, Makros (P/KH/F), Hinweis-Text | | |
| 7 | Summe aller Mahlzeit-Kalorien ≈ Tagesziel (kcal) | | |
| 8 | Tagestyp-Wahl bleibt nach Reload erhalten (UiState persistiert) | | |

---

## T-08 — Woche-Tab

| # | Test | ✓/✗ | Notiz |
|---|---|---|---|
| 1 | Tab öffnet ohne Fehler | | |
| 2 | 7 Tage sichtbar (Mo–So) | | |
| 3 | Heutiger Tag ist gold hervorgehoben | | |

---

## T-09 — Tracker / Rezepte (Platzhalter)

| # | Test | ✓/✗ | Notiz |
|---|---|---|---|
| 1 | Tracker-Tab: zeigt "Kommt in Phase 3" ohne Fehler | | |
| 2 | Rezepte-Tab: zeigt 8 Rezept-Karten ohne Fehler | | |
| 3 | Jede Rezept-Karte zeigt Name, Makros, Tipp | | |

---

## T-10 — Navigation und UiState

| # | Test | ✓/✗ | Notiz |
|---|---|---|---|
| 1 | Aktiver Tab ist hervorgehoben (gold) | | |
| 2 | Alle 5 Tabs navigierbar | | |
| 3 | Browser-Reload: zuletzt aktiver Tab bleibt aktiv | | |

---

## T-11 — Profil-Tab (weitere Bereiche)

| # | Test | ✓/✗ | Notiz |
|---|---|---|---|
| 1 | Postmenopausale Hinweise: alle 5 sichtbar als Accordion | | |
| 2 | Accordion aufklappen/zuklappen funktioniert | | |
| 3 | Settings-Panel: "Postmenopausale Ernährungshinweise"-Toggle vorhanden | | |
| 4 | Betriebsmodus zeigt "Lokal (Phase 1)" — nicht editierbar | | |
| 5 | Backup-Intervall-Feld editierbar und speichert | | |

---

## Berechnungs-Verifikation (Browser-Konsole)

Öffne F12 → Console und tippe die Formeln direkt ein zum Überprüfen:

```
// Muss ~53.40 ergeben:
100 * (1 - 46.6/100)

// Muss ~1523 ergeben:
Math.round(370 + 21.6 * 53.40)

// Muss ~2361 ergeben (Trainingstag):
Math.round(1523 * 1.55)

// Defizit 300 kcal bei TDEE 2361: ~12.7% → 'safe'
300 / 2361
```

| Berechnung | Erwartet | Tatsächlich | ✓/✗ |
|---|---|---|---|
| calcLeanMass(100, 46.6) | 53.40 | | |
| calcBMR(53.40) | 1523 kcal | | |
| calcTDEE(1523, 1.55) | 2361 kcal | | |
| Defizit 300 / TDEE 2361 | 12.7% → safe | | |
| Defizit 700 / TDEE 2361 | 29.6% → aggressive | | |

---

## Definition of Done Checkliste

Alle diese Punkte müssen ✓ sein bevor Phase 2 beginnt:

- [ ] T-00 PoC erfolgreich (R-01 bestätigt)
- [ ] Alle Tests T-01 bis T-11 bestanden
- [ ] Berechnungs-Verifikation bestätigt
- [ ] Kein Netzwerk-Request an Cloud-Services
- [ ] Export-JSON enthält `claudeApiKey: null`
- [ ] Import-Roundtrip funktioniert
- [ ] Erststart-Wizard erscheint nicht erneut nach Abschluss
- [ ] Backup-Reminder erscheint korrekt
- [ ] IndexedDB hat nur `log` und `week` Stores (nicht mehr)
- [ ] **Stephanies OK für Phase 2**: ______________________

---

*Checkliste: erstellt automatisch aus `docs/implementierungsplan-phase-1.md`*
