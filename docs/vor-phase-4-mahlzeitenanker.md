# Mahlzeitenanker flexibilisieren — Entscheidungen vor Phase 4

**Datum:** 2026-06-04  
**APP_VERSION:** 1.2.6  
**Commit:** feat: Trainingszeiten und Mahlzeitenanker flexibilisieren

---

## Problem

Die Mahlzeitenstruktur war bisher an einer festen Frühstückszeit (08:00) und einer festen
Post-Workout-Formel (T + 90 Min) verankert. Das führte zu zwei konkreten Problemen:

1. **Fehlendes Frühstück bei Mittvormittags-Training:**  
   Bei Training um 10:00–11:00 Uhr fiel die Trainingsvorbereitung (Pre-Workout ~08:45–09:45) in die
   Frühtraining-Kategorie — die App zeigte kein Frühstück. Jemand, der um 06:30 aufsteht und
   um 11:00 Uhr trainiert, sah als ersten Mahlzeitenslot das Pre-Workout um 09:45.

2. **Starre Post-Workout-Zeit:**  
   T + 90 Min setzte implizit 60 Min Trainingsende + 30 Min Rückweg/Zubereitung voraus.
   Bei 45-minütigem Training kam Post-Workout zu spät, bei 90-minütigem zu früh.

---

## Umgesetzte Lösung

### Neue Profilfelder

| Feld | Typ | Standard | Bedeutung |
|---|---|---|---|
| `wakeUpTime` | `"HH:MM"` | `'07:00'` | Aufwachzeit |
| `trainingDurationMin` | `number` | `60` | Typische Trainingsdauer in Minuten |

Beide Felder sind optional — bestehende Profile ohne diese Felder verwenden die Standardwerte
und verhalten sich wie bisher.

### Neue Berechnungslogik (`js/data/mealTemplates.js`)

```
BREAKFAST   = toMin(wakeUpTime) + 60            // dynamisch statt fest 08:00
EARLY_CUTOFF = BREAKFAST + 90                   // Frühtraining-Grenze passt sich an
post        = T + trainingDurationMin + 30      // dynamisch statt T + 90
```

Die drei Szenarien (Früh-/Mittel-/Spättraining) bleiben strukturell unverändert.
Die neue Logik ergibt sich ausschließlich aus den dynamischen Konstanten.

### Effekt (Beispiel: Aufwachen 06:30, Training 11:00)

| Vorher | Nachher |
|---|---|
| Pre-Workout 09:45 → Post 12:30 → Mittag 14:00 → Abend | Frühstück **07:30** → Pre 09:45 → Post 12:30 → Abend |

---

## Bewusst nicht umgesetzt

Die folgende Erweiterung wurde diskutiert und auf später verschoben:

| Feature | Grund für Verschiebung |
|---|---|
| `bedTime` als Profilfeld | Eigenes UI-Element; Casein-Slot-Logik erfordert 5-Mahlzeiten-Struktur |
| Eigener Casein-Slot (abends) | Post-Workout = Abendessen beim Spättraining bleibt vorerst bestehen |
| Vollständig dynamische 5-Mahlzeiten-Logik | Zu komplex für diesen Schritt; Grundlage ist jetzt gelegt |

Der `bedTime`-Anker ist die logische nächste Erweiterung nach Phase 4, wenn die
Abendessen/Casein-Kollision beim Spättraining angegangen wird.

---

## Geänderte Dateien

| Datei | Änderung |
|---|---|
| `js/data/mealTemplates.js` | Neue Parameter `wakeUpTime`, `trainingDurationMin`; dynamische Konstanten |
| `js/tabs/profil/ProfileEditor.js` | Felder Aufwachzeit + Trainingsdauer |
| `js/tabs/heute/HeuteTab.js` | Liest `profile.wakeUpTime` / `profile.trainingDurationMin` |
| `js/tabs/heute/MealPlanList.js` | Neue Props durchgereicht |
| `js/tabs/tracker/TrackerTab.js` | Neue Props akzeptiert |
| `js/app.js` | Neue Props an TrackerTab übergeben |
| `tests/unit/calc/mealTemplates.test.js` | 36 neue Tests (TDD: erst rot, dann grün) |
