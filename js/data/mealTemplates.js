// Ruhetag
const REST_MEALS = [
  { label: "Frühstück", time: "08:00", icon: "🌅", kP: .28, pP: .28, cP: .20, fP: .28, note: "Protein-betont. KH moderat." },
  { label: "Mittagessen", time: "12:30", icon: "🌿", kP: .32, pP: .32, cP: .30, fP: .32, note: "Größte Mahlzeit. Ausgewogen." },
  { label: "Nachmittagssnack", time: "16:00", icon: "🫐", kP: .15, pP: .15, cP: .20, fP: .10, note: "Klein. Protein + Fett." },
  { label: "Abendessen", time: "19:00", icon: "🌙", kP: .25, pP: .25, cP: .30, fP: .30, note: "Protein + Fett. Wenig KH." },
];

// Trainingstag 08:00
const TRAINING_0800_MEALS = [
  { label: "Pre-Workout", time: "07:15", icon: "⚡", kP: .22, pP: .18, cP: .40, fP: .12, note: "Leicht, KH-betont. Keine schweren Fette." },
  { label: "Post-Workout", time: "09:30", icon: "💪", kP: .30, pP: .32, cP: .30, fP: .18, note: "Wichtigste Mahlzeit. Protein + KH." },
  { label: "Mittagessen", time: "13:00", icon: "🌿", kP: .28, pP: .28, cP: .20, fP: .35, note: "Ausgewogen." },
  { label: "Abendessen", time: "18:30", icon: "🌙", kP: .20, pP: .22, cP: .10, fP: .35, note: "Casein-reich. Wenig KH." },
];

// Trainingstag 14:30
const TRAINING_1430_MEALS = [
  { label: "Frühstück", time: "08:00", icon: "🌅", kP: .22, pP: .22, cP: .25, fP: .20, note: "Protein + moderate KH." },
  { label: "Pre-Workout", time: "12:30", icon: "⚡", kP: .28, pP: .22, cP: .40, fP: .12, note: "2h vor Training. KH-betont." },
  { label: "Post-Workout", time: "16:00", icon: "💪", kP: .28, pP: .30, cP: .25, fP: .18, note: "Protein + KH innerhalb 2h." },
  { label: "Abendessen", time: "19:30", icon: "🌙", kP: .22, pP: .26, cP: .10, fP: .50, note: "Casein-reich. Keine KH." },
];

export const MEAL_TEMPLATES = {
  rest: REST_MEALS,
  training_0800: TRAINING_0800_MEALS,
  training_1430: TRAINING_1430_MEALS,
};

export function getMealTemplate(dayType, trainingTime) {
  // dayType: 'training' | 'rest'
  // trainingTime: '08:00' | '14:30'
  if (dayType === 'rest') return MEAL_TEMPLATES.rest;
  if (trainingTime === '08:00') return MEAL_TEMPLATES.training_0800;
  return MEAL_TEMPLATES.training_1430;
}
