# Ernährungskonzept – Persönliches Dashboard
**Erstellt:** Juni 2026  
**Zweck:** Erläuterung des in der App hinterlegten Ernährungskonzepts für Rücksprache mit Ernährungscoach  
**Zielgruppe der App:** Postmenopausale Frauen mit regelmäßigem Krafttraining

---

## 1. Worum geht es in dieser App?

Die App ist ein persönliches Ernährungs-Dashboard, das täglich berechnet, wie viel ich an einem bestimmten Tag essen sollte — aufgeteilt nach Kalorien, Protein, Kohlenhydraten und Fett. Es gibt zwei Tagestypen:

- **Trainingstag:** Mahlzeitenstruktur und Timing passen sich automatisch an meine eingetragene Trainingszeit an
- **Ruhetag:** Feste Mahlzeitenstruktur

Ich trage meine konsumierten Mahlzeiten ein und die App zeigt mir, ob ich mein Tagesziel erreicht habe.

---

## 2. Grundumsatz & Kalorienziel

### Berechnungsmethode: Katch-McArdle

Die App verwendet **nicht** die Harris-Benedict-Formel (Alter/Gewicht/Größe), sondern die **Katch-McArdle-Formel**, die ausschließlich auf der **fettfreien Masse (LBM)** basiert:

```
BMR = 370 + (21,6 × LBM in kg)
```

**Warum Katch-McArdle?**  
Bei postmenopausalen Frauen ist der Körperfettanteil oft deutlich erhöht (häufig > 40 %). Die Harris-Benedict-Formel überschätzt dadurch den Grundumsatz. Katch-McArdle ist präziser, weil nur Muskel- und Organmasse den Energieumsatz treiben.

### Tagesumsatz (TDEE)

```
TDEE = BMR × Aktivitätsfaktor
```

| Aktivitätslevel | Faktor |
|---|---|
| Wenig Bewegung | 1,2 – 1,3 |
| Leicht aktiv (2–3×/Woche Training) | 1,4 – 1,5 |
| Moderat aktiv (4–5×/Woche) | 1,6 – 1,7 |
| Sehr aktiv (täglich) | 1,8 – 1,9 |

### Kaloriendefizit

Das Defizit wird vom TDEE abgezogen und ist in der App einstellbar. Die App warnt aktiv bei zu hohen Defiziten:

| Defizit (% des TDEE) | Bewertung |
|---|---|
| ≤ 17 % | Sicher |
| 17 – 22 % | Moderat (akzeptabel mit ausreichend Protein) |
| 22 – 30 % | Zu aggressiv — Warnung |
| > 30 % | Kritisch — Warnung |

**Hintergrund:** Bei postmenopausaler anaboler Resistenz führen zu hohe Defizite überproportional zu Muskelverlust statt Fettabbau. Die Schwellen sind daher enger gesetzt als bei Standard-Empfehlungen.

---

## 3. Makronährstoff-Berechnung

### Berechnungsreihenfolge

1. **Protein** wird zuerst festgelegt (Priorität, weil muskelerhaltend)
2. **Fett** als fester Prozentsatz der Gesamtkalorien
3. **Kohlenhydrate** als Rest

### Protein-Zielwert

Das Protein-Ziel kann in drei Modi eingestellt werden:

| Modus | Formel | Empfehlung für mich |
|---|---|---|
| Pro kg Körpergewicht | g × KG | 1,2 – 1,5 g/kg/Tag |
| Pro kg fettfreie Masse | g × LBM | 1,8 – 2,2 g/kg LBM |
| Fester Wert | absolut in g | individuell |

**Studiengrundlage:** Die ISSN empfiehlt für aktive Personen 1,4–2,0 g/kg KG/Tag. Für postmenopausale Frauen mit anaboler Resistenz werden am oberen Ende (≥ 1,5 g/kg KG) bevorzugt, berechnet auf fettfreie Masse ist der Wert aussagekräftiger.

### Fett

Einstellbarer Prozentsatz der Gesamtkalorien, empfohlener Bereich: **25–30 %**  
(Studien für postmenopausale Frauen: < 30 % Gesamtkalorien aus Fett, Fokus auf hochwertige ungesättigte Fettsäuren)

---

## 4. Mahlzeitenstruktur

### Ruhetag — 4 Mahlzeiten (feste Uhrzeiten)

| Mahlzeit | Uhrzeit | Anteil Kalorien | Anteil Protein | Besonderheit |
|---|---|---|---|---|
| Frühstück | 08:00 | **32 %** | **32 %** | Größte Mahlzeit, ~3g Leucin |
| Mittagessen | 12:30 | 28 % | 28 % | Ausgewogen |
| Nachmittagssnack | 16:00 | 15 % | 15 % | Klein, Protein + Fett |
| Abendessen | 19:00 | 25 % | 25 % | 30–40g Casein vor Schlaf |

**Warum Frühstück als größte Mahlzeit?**  
Studien zeigen, dass bei postmenopausalen Frauen eine Verlagerung der Kalorien auf das Frühstück die Insulinsensitivität verbessert und das Gewichtsmanagement erleichtert. In früheren Ernährungsplänen war das Mittagessen die Hauptmahlzeit — das wurde hier korrigiert.

### Trainingstag — 4 Mahlzeiten (dynamisch zur Trainingszeit)

Die App erkennt automatisch drei Szenarien je nach Trainingszeit:

#### Frühtraining (Trainingszeit vor ca. 09:45 Uhr)
| Mahlzeit | Uhrzeit | Kalorien | Protein | KH | Fett |
|---|---|---|---|---|---|
| Pre-Workout ⚡ | T − 1h15 | 22 % | 22 % | 28 % | 12 % |
| Post-Workout 💪 | T + 1h30 | 30 % | 30 % | 38 % | 18 % |
| Mittagessen 🌿 | ~2,5h nach Post | 28 % | 26 % | 24 % | 35 % |
| Abendessen 🌙 | ~3h nach Mittag | 20 % | 22 % | 10 % | 35 % |

#### Mitteltraining (Trainingszeit 09:45 – 14:15 Uhr)
| Mahlzeit | Uhrzeit | Kalorien | Protein | KH | Fett |
|---|---|---|---|---|---|
| Frühstück 🌅 | 08:00 | **28 %** | **28 %** | 28 % | 22 % |
| Pre-Workout ⚡ | T − 1h15 | 20 % | 20 % | 28 % | 12 % |
| Post-Workout 💪 | T + 1h30 | 28 % | 28 % | 34 % | 18 % |
| Abendessen 🌙 | ~2h nach Post | 24 % | 24 % | 10 % | 48 % |

#### Spättraining (Trainingszeit ab 14:15 Uhr)
| Mahlzeit | Uhrzeit | Kalorien | Protein | KH | Fett |
|---|---|---|---|---|---|
| Frühstück 🌅 | 08:00 | **30 %** | 28 % | 28 % | 22 % |
| Mittagessen 🌿 | Mitte zw. Früh & Pre | 24 % | 22 % | 28 % | 18 % |
| Pre-Workout ⚡ | T − 1h15 | 20 % | 18 % | 28 % | 12 % |
| Post-Workout 💪 | T + 1h30 | 26 % | 32 % | 16 % | 48 % |

**Hinweis zu den Uhrzeiten:**  
- **Pre-Workout:** 1h15 vor dem Training (Trainingsstart = T)
- **Post-Workout:** T + 1h30 — weil ich ca. 1h trainiere, dann Heimfahrt und Zubereitung ca. 30 Min.

---

## 5. Postmenopausale Besonderheiten im Konzept

### 5a. Anabole Resistenz & Leucin

Ältere Muskeln reagieren schwächer auf Protein als bei jüngeren Menschen. Um die Muskelproteinsynthese (MPS) trotzdem optimal zu aktivieren, braucht es pro Mahlzeit:

- **~3g Leucin** (die „Schlüsselamino­säure" für MPS)
- Gute Quellen: 30g Whey-Protein, 4–5 Eier, 150g Hähnchenbrust, 200g Quark

Die App zeigt in jeder Mahlzeit konkrete Beispielquellen für die Leucin-Versorgung.

### 5b. Casein vor dem Schlafen

**Empfehlung aus Studien:** 30–40g Casein-Protein, ca. 30 Minuten vor dem Schlafen  
→ erhöht die nächtliche Muskelproteinsynthese und Stoffwechselrate  
→ behindert den Fettabbau (Lipolyse) nicht

**Praktische Quellen:** Magerquark (30–40g Protein auf 250g), Casein-Shake

Die App erinnert in der Abendessen-Notiz explizit daran.

### 5c. Pre-Workout KH bewusst moderat

**Warum weniger KH vor dem Training als üblich empfohlen?**  
Frauen oxidieren beim Training biologisch mehr Fett als Männer — das ist hormonell bedingt und bleibt auch nach der Menopause ein Grundmerkmal. Der KH-Bedarf vor dem Training ist daher geringer als bei männlich ausgelegten Sporternährungs-Plänen.

→ Pre-Workout KH-Anteil: 28 % der täglichen KH (statt 40 % wie in klassischen Plänen)  
→ Post-Workout: erhöhter KH-Anteil (34–38 %) für Glykogen-Wiederauffüllung

### 5d. Protein-Spacing

**Ziel:** Alle 3–4 Stunden eine Proteinportion von 20–40g  
**Warum:** Die anabole Resistenz wird durch häufige Proteinpulse besser überwunden als durch eine oder zwei große Portionen.

Die 4-Mahlzeiten-Struktur ist so gewählt, dass die Abstände weitgehend bei 3–4h liegen.

---

## 6. Was die App nicht kann (Einschränkungen)

| Funktion | Status |
|---|---|
| Lebensmitteldatenbank / Barcode-Scanner | Nicht enthalten — Mahlzeiten werden manuell eingetragen |
| Rezeptberechnung | Basis vorhanden, ausbaubar |
| Leucin-Gehalt pro Mahlzeit berechnen | Derzeit nur Hinweis-Text, keine Berechnung |
| Hormonelle Besonderheiten (z.B. Schilddrüse) | Nicht berücksichtigt |
| Individuelle Nahrungsmittelunverträglichkeiten | Nicht berücksichtigt |
| Ärztliche Empfehlungen | Kein Ersatz — dies ist ein Selbst-Tracking-Tool |

---

## 7. Fragen an den Coach

Diese Punkte würde ich gerne mit dir besprechen:

1. **Proteinziel:** Ist 1,4–1,5 g/kg Körpergewicht für mein Ziel (Muskelerhalt / Fettabbau) ausreichend, oder empfiehlst du eher auf fettfreie Masse zu berechnen?

2. **Kaloriendefizit:** Wie hoch darf das Defizit aus deiner Sicht für mich konkret sein?

3. **Casein:** Magerquark als Casein-Quelle — ist das für mich alltagstauglich genug, oder brauchst du da eine andere Empfehlung?

4. **Leucin-Quellen:** Passen die vorgeschlagenen Quellen (Eier, Quark, Whey, Hähnchen) zu meinen sonstigen Ernährungsgewohnheiten?

5. **Pre-Workout 1h15:** Ist das für mich ein realistisches Zeitfenster, oder sollte Pre-Workout länger vorher sein?

6. **Fettanteil:** 25–30 % der Gesamtkalorien aus Fett — passt das zu deinen Empfehlungen?

---

*Dieses Dokument beschreibt das Konzept, das in einer persönlichen Web-App umgesetzt wurde. Die App berechnet täglich Zielwerte, ersetzt aber keine professionelle Ernährungsberatung.*
