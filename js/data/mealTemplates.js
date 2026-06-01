/**
 * mealTemplates.js
 *
 * Mahlzeitenstruktur für Trainings- und Ruhetage.
 * Optimiert für postmenopausale Frauen (Studienbasis: NotebookLM Ernaehrungs-Dashboard).
 *
 * Trainingstag: Zeiten werden relativ zur gewählten Trainingszeit berechnet.
 *   - Pre-Workout:  T − 1h15min
 *   - Post-Workout: T + 1h30 (Training ~1h + Heimfahrt + Zubereitung)
 *   - Restliche Mahlzeiten werden automatisch um Pre/Post verteilt.
 *
 * Postmenopausale Besonderheiten eingebaut:
 *   - Frühstück ist die kalorienreichste Mahlzeit (Insulinsensitivität ↑)
 *   - Pre-Workout KH reduziert (Frauen verbrennen mehr Fett beim Training)
 *   - Leucin-Hinweise (~3g/Mahlzeit) gegen anabole Resistenz
 *   - Casein-Timing präzisiert: 30–40g ~30min vor dem Schlafen
 *
 * Ruhetag: feste Mahlzeiten.
 */

// ─── Flexibilität: Mahlzeitenanzahl ──────────────────────────────────────────
// Die Berechnungslogik (distributeMacrosPerMeal in macros.js) ist bereits
// generisch und funktioniert mit 3, 4 oder 5 Mahlzeiten ohne Codeänderung.
// kP/pP/cP/fP-Proportionen müssen jeweils zu 1.00 summieren — unabhängig
// von der Anzahl. Neue Szenarien = neues Array mit korrekten Summen.
// Die aktuelle 4-Mahlzeiten-Struktur bleibt der Standard (Stand: Phase 2).

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

/** "HH:MM" → Minuten seit Mitternacht */
function toMin(timeStr) {
  const [h, m] = (timeStr || '08:00').split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Minuten seit Mitternacht → "HH:MM" */
function toStr(minutes) {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ─── Ruhetag (fest) ───────────────────────────────────────────────────────────
// Frühstück ist die größte Mahlzeit (postmenopausal: Kalorienfrontloading verbessert
// Insulinsensitivität und Gewichtsregulation).
// k=.32+.28+.15+.25=1.00  p=.32+.28+.15+.25=1.00  c=.25+.25+.20+.30=1.00  f=.28+.30+.12+.30=1.00 ✓

export const REST_MEALS = [
  { label: 'Frühstück',        time: '08:00', icon: '🌅', kP: .32, pP: .32, cP: .25, fP: .28, note: 'Größte Mahlzeit des Tages. ~3g Leucin sicherstellen (z.B. Eier + Quark, Whey-Shake). Protein-betont.' },
  { label: 'Mittagessen',      time: '12:30', icon: '🌿', kP: .28, pP: .28, cP: .25, fP: .30, note: 'Ausgewogen. Hochwertige Proteinquellen (Fisch, Hülsenfrüchte, Geflügel).' },
  { label: 'Nachmittagssnack', time: '16:00', icon: '🫐', kP: .15, pP: .15, cP: .20, fP: .12, note: 'Klein. Protein + gesunde Fette.' },
  { label: 'Abendessen',       time: '19:00', icon: '🌙', kP: .25, pP: .25, cP: .30, fP: .30, note: '30–40g Casein ~30min vor dem Schlafen (Quark, Casein-Shake). Wenig KH.' },
];

// ─── Trainingstag (dynamisch) ─────────────────────────────────────────────────

/**
 * Berechnet 4 Mahlzeiten relativ zur Trainingszeit.
 *
 * Struktur je nach Trainingszeit (T):
 *   Frühtraining   (Pre < 10:30): Pre → Post → Mittagessen → Abendessen
 *   Mitteltraining (Pre 10:30–13:00): Frühstück → Pre → Post → Abendessen
 *   Spättraining   (Pre ≥ 13:00):  Frühstück → Mittagessen → Pre → Post
 *
 * Makro-Quoten: kP, pP, cP, fP summieren jeweils exakt zu 1.00.
 *
 * @param {string} trainingTimeStr - z.B. "10:30" (beliebige HH:MM Zeit)
 * @returns {Array} 4 Mahlzeit-Objekte
 */
export function generateTrainingDayMeals(trainingTimeStr) {
  const T    = clamp(toMin(trainingTimeStr), 5 * 60, 22 * 60);
  const pre  = clamp(T - 75, 5 * 60, 22 * 60);  // 1h15 vor Training
  const post = clamp(T + 90, 6 * 60, 23 * 60);  // 1h30 nach Trainingsstart (Trainingsende + Fahrt/Prep)

  const BREAKFAST = 8 * 60;           // 08:00 feste Frühstückszeit
  const EARLY_CUTOFF     = 10.5 * 60; // 10:30 — Grenze Frühtraining
  const AFTERNOON_CUTOFF = 13.0 * 60; // 13:00 — Grenze Spättraining

  // ── Frühtraining (Pre < 10:30): Pre → Post → Mittagessen → Abendessen ──
  // k=.22+.30+.28+.20=1.00  p=.22+.30+.26+.22=1.00  c=.28+.38+.24+.10=1.00  f=.12+.18+.35+.35=1.00 ✓
  if (pre < EARLY_CUTOFF) {
    const lunch  = clamp(Math.max(post + 150, 12 * 60), post + 90,  14 * 60);
    const dinner = clamp(Math.max(lunch + 180, 18 * 60), lunch + 150, 21 * 60);
    return [
      { label: 'Pre-Workout',  time: toStr(pre),    icon: '⚡', kP: .22, pP: .22, cP: .28, fP: .12, note: 'Leicht, moderate KH. ~3g Leucin sichern. Frauen verbrennen beim Training mehr Fett – weniger KH nötig als bei Männern.' },
      { label: 'Post-Workout', time: toStr(post),   icon: '💪', kP: .30, pP: .30, cP: .38, fP: .18, note: 'Wichtigste Mahlzeit. Protein + KH für Glykogen. ~3g Leucin (z.B. 30g Whey + Banane).' },
      { label: 'Mittagessen',  time: toStr(lunch),  icon: '🌿', kP: .28, pP: .26, cP: .24, fP: .35, note: 'Ausgewogen. Proteinreich.' },
      { label: 'Abendessen',   time: toStr(dinner), icon: '🌙', kP: .20, pP: .22, cP: .10, fP: .35, note: '30–40g Casein ~30min vor dem Schlafen (Quark, Casein-Shake). Wenig KH.' },
    ];
  }

  // ── Mitteltraining (Pre 10:30–13:00): Frühstück → Pre → Post → Abendessen ──
  // k=.28+.20+.28+.24=1.00  p=.28+.20+.28+.24=1.00  c=.28+.28+.34+.10=1.00  f=.22+.12+.18+.48=1.00 ✓
  if (pre < AFTERNOON_CUTOFF) {
    const dinner = clamp(Math.max(post + 120, 18 * 60), post + 90, 21 * 60);
    return [
      { label: 'Frühstück',    time: toStr(BREAKFAST), icon: '🌅', kP: .28, pP: .28, cP: .28, fP: .22, note: 'Größte Mahlzeit des Tages. ~3g Leucin (z.B. Eier + Quark, Whey-Shake). Protein-betont.' },
      { label: 'Pre-Workout',  time: toStr(pre),        icon: '⚡', kP: .20, pP: .20, cP: .28, fP: .12, note: 'Leicht, moderate KH. Frauen verbrennen beim Training mehr Fett – weniger KH nötig als bei Männern.' },
      { label: 'Post-Workout', time: toStr(post),       icon: '💪', kP: .28, pP: .28, cP: .34, fP: .18, note: 'Protein + KH für Glykogen. ~3g Leucin (z.B. 30g Whey + Banane).' },
      { label: 'Abendessen',   time: toStr(dinner),     icon: '🌙', kP: .24, pP: .24, cP: .10, fP: .48, note: '30–40g Casein ~30min vor dem Schlafen (Quark, Casein-Shake). Wenig KH.' },
    ];
  }

  // ── Spättraining (Pre ≥ 13:00): Frühstück → Mittagessen → Pre → Post ──
  // k=.30+.24+.20+.26=1.00  p=.28+.22+.18+.32=1.00  c=.28+.28+.28+.16=1.00  f=.22+.18+.12+.48=1.00 ✓
  const lunch = clamp(
    Math.round((BREAKFAST + pre) / 2),
    BREAKFAST + 90,
    pre - 90,
  );
  return [
    { label: 'Frühstück',    time: toStr(BREAKFAST), icon: '🌅', kP: .30, pP: .28, cP: .28, fP: .22, note: 'Größte Mahlzeit des Tages. ~3g Leucin (z.B. Eier + Quark, Whey-Shake). Protein-betont.' },
    { label: 'Mittagessen',  time: toStr(lunch),      icon: '🌿', kP: .24, pP: .22, cP: .28, fP: .18, note: 'Moderate KH vor dem Abendtraining. Hochwertige Proteinquellen.' },
    { label: 'Pre-Workout',  time: toStr(pre),         icon: '⚡', kP: .20, pP: .18, cP: .28, fP: .12, note: 'Leicht, moderate KH. Frauen verbrennen beim Training mehr Fett – weniger KH nötig als bei Männern.' },
    { label: 'Post-Workout', time: toStr(post),        icon: '💪', kP: .26, pP: .32, cP: .16, fP: .48, note: 'Protein-reich. 30–40g Casein ~30min vor dem Schlafen (Quark, Casein-Shake).' },
  ];
}

// ─── Öffentliche API ─────────────────────────────────────────────────────────

export const MEAL_TEMPLATES = { rest: REST_MEALS };

/**
 * @param {'training'|'rest'} dayType
 * @param {string} trainingTime  - "HH:MM", beliebige Zeit
 * @returns {Array} 4 Mahlzeit-Objekte
 */
export function getMealTemplate(dayType, trainingTime) {
  if (dayType === 'rest') return REST_MEALS;
  return generateTrainingDayMeals(trainingTime || '08:00');
}
