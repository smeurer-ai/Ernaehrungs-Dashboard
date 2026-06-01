/**
 * Trainingsbezogene Trink-Erinnerungen fuer den Heute-Tab.
 * Kein Tracking, kein State - reine Berechnung aus Trainingszeit und Tagestyp.
 *
 * Trainingstag (6 Eintraege):
 *   pre-0:    T - 2h      400-600 ml  (bei T-2h < 05:00: auf 05:00 geclamppt, Label angepasst)
 *   pre-1:    T - 15min   200-300 ml
 *   during-0: T + 0       150-250 ml
 *   during-1: T + 20min   150-250 ml
 *   during-2: T + 40min   150-250 ml
 *   post-0:   T + 90min   400-600 ml
 *
 * Ruhetag (2 Eintraege):
 *   rest-0: 08:30  300-500 ml
 *   rest-1: 14:00  300-500 ml
 *
 * @module calc/hydration
 */

/** "HH:MM" -> Minuten seit Mitternacht */
function toMin(timeStr) {
  const [h, m] = (timeStr || '08:00').split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Minuten seit Mitternacht -> "HH:MM" */
function toStr(minutes) {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * @typedef {Object} HydrationReminder
 * @property {string} id
 * @property {string} label
 * @property {string} time
 * @property {{ min: number, max: number }} amountMl
 * @property {'preWorkout'|'duringWorkout'|'postWorkout'|'restDay'} context
 * @property {string} note
 */

/**
 * Generiert Trink-Erinnerungen fuer den Tag.
 *
 * @param {{ dayType: 'training'|'rest', trainingTime?: string }} options
 * @returns {HydrationReminder[]}
 *
 * @example
 * generateHydrationReminders({ dayType: 'rest' })
 * // -> [ { id: 'rest-0', time: '08:30', ... }, { id: 'rest-1', time: '14:00', ... } ]
 *
 * @example
 * generateHydrationReminders({ dayType: 'training', trainingTime: '08:00' })
 * // -> 6 Eintraege: pre-0 (06:00), pre-1 (07:45), during-0..2 (08:00/20/40), post-0 (09:30)
 */
export function generateHydrationReminders({ dayType, trainingTime }) {
  if (dayType === 'rest') {
    return [
      {
        id: 'rest-0',
        label: 'Morgenhydrierung',
        time: '08:30',
        amountMl: { min: 300, max: 500 },
        context: 'restDay',
        note: 'Starte den Tag gut hydriert.',
      },
      {
        id: 'rest-1',
        label: 'Nachmittagshydrierung',
        time: '14:00',
        amountMl: { min: 300, max: 500 },
        context: 'restDay',
        note: 'Regelmaessig ueber den Tag trinken.',
      },
    ];
  }

  const T = clamp(toMin(trainingTime || '08:00'), 5 * 60, 22 * 60);

  const preEarlyMin = T - 120;
  const isEarlyClamped = preEarlyMin < 5 * 60;
  const preEarly = clamp(preEarlyMin, 5 * 60, 22 * 60);

  return [
    {
      id: 'pre-0',
      label: isEarlyClamped ? 'Direkt nach dem Aufstehen' : 'Vor dem Training',
      time: toStr(preEarly),
      amountMl: { min: 400, max: 600 },
      context: 'preWorkout',
      note: isEarlyClamped
        ? 'Fruehes Training: direkt nach dem Aufstehen ausreichend trinken.'
        : '2 Stunden vor dem Training: Koerper optimal hydrieren.',
    },
    {
      id: 'pre-1',
      label: 'Letzte Hydrierung',
      time: toStr(clamp(T - 15, 5 * 60, 22 * 60)),
      amountMl: { min: 200, max: 300 },
      context: 'preWorkout',
      note: '15 Minuten vor dem Training: kleine Menge, kein volles Gefuehl.',
    },
    {
      id: 'during-0',
      label: 'Training beginnt',
      time: toStr(T),
      amountMl: { min: 150, max: 250 },
      context: 'duringWorkout',
      note: 'Flasche bereit. Kleine Schlucke, nicht zu viel auf einmal.',
    },
    {
      id: 'during-1',
      label: 'Trinken (20 min)',
      time: toStr(clamp(T + 20, 5 * 60, 23 * 60)),
      amountMl: { min: 150, max: 250 },
      context: 'duringWorkout',
      note: 'Regelmaessige kleine Mengen waehrend dem Training.',
    },
    {
      id: 'during-2',
      label: 'Trinken (40 min)',
      time: toStr(clamp(T + 40, 5 * 60, 23 * 60)),
      amountMl: { min: 150, max: 250 },
      context: 'duringWorkout',
      note: 'Regelmaessige kleine Mengen waehrend dem Training.',
    },
    {
      id: 'post-0',
      label: 'Post-Workout',
      time: toStr(clamp(T + 90, 6 * 60, 23 * 60)),
      amountMl: { min: 400, max: 600 },
      context: 'postWorkout',
      note: 'Mit der Post-Workout-Mahlzeit: Fluessigkeit und Elektrolyte ersetzen.',
    },
  ];
}
