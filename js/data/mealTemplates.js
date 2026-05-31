/**
 * mealTemplates.js
 *
 * Mahlzeitenstruktur für Trainings- und Ruhetage.
 *
 * Trainingstag: Zeiten werden relativ zur gewählten Trainingszeit berechnet.
 *   - Pre-Workout:  T − 1h15min
 *   - Post-Workout: T + 30min
 *   - Restliche Mahlzeiten werden automatisch um Pre/Post verteilt.
 *
 * Ruhetag: feste Mahlzeiten.
 */

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

export const REST_MEALS = [
  { label: 'Frühstück',        time: '08:00', icon: '🌅', kP: .28, pP: .28, cP: .20, fP: .28, note: 'Protein-betont. KH moderat.' },
  { label: 'Mittagessen',      time: '12:30', icon: '🌿', kP: .32, pP: .32, cP: .30, fP: .32, note: 'Größte Mahlzeit. Ausgewogen.' },
  { label: 'Nachmittagssnack', time: '16:00', icon: '🫐', kP: .15, pP: .15, cP: .20, fP: .10, note: 'Klein. Protein + Fett.' },
  { label: 'Abendessen',       time: '19:00', icon: '🌙', kP: .25, pP: .25, cP: .30, fP: .30, note: 'Protein + Fett. Wenig KH.' },
];

// ─── Trainingstag (dynamisch) ─────────────────────────────────────────────────

/**
 * Berechnet 4 Mahlzeiten relativ zur Trainingszeit.
 *
 * Struktur je nach Trainingszeit (T):
 *   Frühtraining  (Pre < 10:30): Pre → Post → Mittagessen → Abendessen
 *   Mitteltraining(Pre 10:30–13:00): Frühstück → Pre → Post → Abendessen
 *   Spättraining  (Pre ≥ 13:00):  Frühstück → Mittagessen → Pre → Post
 *
 * Makro-Quoten: kP, pP, cP, fP summieren jeweils exakt zu 1.00.
 *
 * @param {string} trainingTimeStr - z.B. "10:30" (beliebige HH:MM Zeit)
 * @returns {Array} 4 Mahlzeit-Objekte
 */
export function generateTrainingDayMeals(trainingTimeStr) {
  const T    = clamp(toMin(trainingTimeStr), 5 * 60, 22 * 60);
  const pre  = clamp(T - 75, 5 * 60, 22 * 60);  // 1h15 vor Training
  const post = clamp(T + 30, 6 * 60, 23 * 60);  // 30min nach Training

  const BREAKFAST = 8 * 60;           // 08:00 feste Frühstückszeit
  const EARLY_CUTOFF     = 10.5 * 60; // 10:30 — Grenze Frühtraining
  const AFTERNOON_CUTOFF = 13.0 * 60; // 13:00 — Grenze Spättraining

  // ── Frühtraining (Pre < 10:30): Pre → Post → Mittagessen → Abendessen ──
  if (pre < EARLY_CUTOFF) {
    const lunch  = clamp(Math.max(post + 150, 12 * 60), post + 90,  14 * 60);
    const dinner = clamp(Math.max(lunch + 180, 18 * 60), lunch + 150, 21 * 60);
    return [
      { label: 'Pre-Workout',  time: toStr(pre),    icon: '⚡', kP: .22, pP: .18, cP: .40, fP: .12, note: 'Leicht, KH-betont. Keine schweren Fette.' },
      { label: 'Post-Workout', time: toStr(post),   icon: '💪', kP: .30, pP: .32, cP: .30, fP: .18, note: 'Wichtigste Mahlzeit. Protein + KH.' },
      { label: 'Mittagessen',  time: toStr(lunch),  icon: '🌿', kP: .28, pP: .28, cP: .20, fP: .35, note: 'Ausgewogen.' },
      { label: 'Abendessen',   time: toStr(dinner), icon: '🌙', kP: .20, pP: .22, cP: .10, fP: .35, note: 'Casein-reich. Wenig KH.' },
    ];
    // k=1.00  p=1.00  c=1.00  f=1.00 ✓
  }

  // ── Mitteltraining (Pre 10:30–13:00): Frühstück → Pre → Post → Abendessen ──
  if (pre < AFTERNOON_CUTOFF) {
    const dinner = clamp(Math.max(post + 120, 18 * 60), post + 90, 21 * 60);
    return [
      { label: 'Frühstück',    time: toStr(BREAKFAST), icon: '🌅', kP: .22, pP: .22, cP: .25, fP: .20, note: 'Protein + moderate KH.' },
      { label: 'Pre-Workout',  time: toStr(pre),        icon: '⚡', kP: .22, pP: .18, cP: .40, fP: .12, note: 'Leicht, KH-betont. Keine schweren Fette.' },
      { label: 'Post-Workout', time: toStr(post),       icon: '💪', kP: .30, pP: .32, cP: .25, fP: .18, note: 'Wichtigste Mahlzeit. Protein + KH.' },
      { label: 'Abendessen',   time: toStr(dinner),     icon: '🌙', kP: .26, pP: .28, cP: .10, fP: .50, note: 'Casein-reich. Wenig KH.' },
    ];
    // k=1.00  p=1.00  c=1.00  f=1.00 ✓
  }

  // ── Spättraining (Pre ≥ 13:00): Frühstück → Mittagessen → Pre → Post ──
  const lunch = clamp(
    Math.round((BREAKFAST + pre) / 2),
    BREAKFAST + 90,
    pre - 90,
  );
  return [
    { label: 'Frühstück',    time: toStr(BREAKFAST), icon: '🌅', kP: .22, pP: .22, cP: .25, fP: .20, note: 'Protein + moderate KH.' },
    { label: 'Mittagessen',  time: toStr(lunch),      icon: '🌿', kP: .28, pP: .22, cP: .35, fP: .18, note: 'KH-betont vor dem Abendtraining.' },
    { label: 'Pre-Workout',  time: toStr(pre),         icon: '⚡', kP: .22, pP: .18, cP: .30, fP: .12, note: 'Leicht, KH-betont. Keine schweren Fette.' },
    { label: 'Post-Workout', time: toStr(post),        icon: '💪', kP: .28, pP: .38, cP: .10, fP: .50, note: 'Protein-reich. Casein nach dem Abendtraining.' },
  ];
  // k=1.00  p=1.00  c=1.00  f=1.00 ✓
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
