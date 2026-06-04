import { describe, it, expect } from 'vitest';
import { getMealTemplate, generateTrainingDayMeals } from '../../../js/data/mealTemplates.js';

// ── Hilfsfunktion ─────────────────────────────────────────────────────────────
function getSlotTimes(meals) {
  return meals.map(m => m.time);
}
function getSlotLabels(meals) {
  return meals.map(m => m.label);
}

// ── Null-Fallbacks ────────────────────────────────────────────────────────────

describe('getMealTemplate / generateTrainingDayMeals – Null-Fallbacks', () => {
  it('null als trainingDurationMin → Fallback auf 60 Min (Post = T + 90)', () => {
    const meals = getMealTemplate('training', '10:00', '07:00', null);
    const post = meals.find(m => m.label === 'Post-Workout');
    expect(post.time).toBe('11:30'); // T=10:00 + 60 + 30 = 11:30
  });

  it('null als wakeUpTime → Fallback auf 07:00 (Training 12:00 zeigt Frühstück 08:00)', () => {
    const meals = getMealTemplate('training', '12:00', null, 60);
    const breakfast = meals.find(m => m.label === 'Frühstück');
    expect(breakfast).toBeDefined();
    expect(breakfast.time).toBe('08:00'); // wakeUp 07:00 + 60 = 08:00
  });

  it('null für beide optionalen Parameter → Verhalten wie bare generateTrainingDayMeals("10:00")', () => {
    const withNull = getMealTemplate('training', '10:00', null, null);
    const withDefaults = generateTrainingDayMeals('10:00');
    expect(withNull.map(m => m.time)).toEqual(withDefaults.map(m => m.time));
    expect(withNull.map(m => m.label)).toEqual(withDefaults.map(m => m.label));
  });
});

// ── Ruhetag ───────────────────────────────────────────────────────────────────

describe('getMealTemplate – Ruhetag', () => {
  it('gibt 4 feste Mahlzeiten zurück', () => {
    const meals = getMealTemplate('rest', '10:00');
    expect(meals).toHaveLength(4);
  });

  it('erster Slot ist Frühstück um 08:00', () => {
    const meals = getMealTemplate('rest', '10:00');
    expect(meals[0].label).toBe('Frühstück');
    expect(meals[0].time).toBe('08:00');
  });

  it('ignoriert wakeUpTime und trainingDurationMin beim Ruhetag', () => {
    const a = getMealTemplate('rest', '10:00', '05:00', 120);
    const b = getMealTemplate('rest', '10:00', '09:00', 30);
    expect(a).toEqual(b);
  });
});

// ── trainingDurationMin: Post-Workout-Zeit ────────────────────────────────────

describe('generateTrainingDayMeals – trainingDurationMin', () => {
  it('Post-Workout bei 45 Min Training = T + 75 Min (10:00 → 11:15)', () => {
    const meals = generateTrainingDayMeals('10:00', '07:00', 45);
    const post = meals.find(m => m.label === 'Post-Workout');
    expect(post.time).toBe('11:15');
  });

  it('Post-Workout bei 90 Min Training = T + 120 Min (10:00 → 12:00)', () => {
    const meals = generateTrainingDayMeals('10:00', '07:00', 90);
    const post = meals.find(m => m.label === 'Post-Workout');
    expect(post.time).toBe('12:00');
  });

  it('Standard 60 Min Training = T + 90 Min (10:00 → 11:30)', () => {
    const meals = generateTrainingDayMeals('10:00', '07:00', 60);
    const post = meals.find(m => m.label === 'Post-Workout');
    expect(post.time).toBe('11:30');
  });

  it('Default ohne Parameter = 60 Min (10:00 → 11:30)', () => {
    const meals = generateTrainingDayMeals('10:00');
    const post = meals.find(m => m.label === 'Post-Workout');
    expect(post.time).toBe('11:30');
  });
});

// ── wakeUpTime: Frühstückszeit ────────────────────────────────────────────────

describe('generateTrainingDayMeals – wakeUpTime bestimmt Frühstückszeit', () => {
  it('wakeUpTime 06:30 → Frühstück um 07:30 (Training 11:00)', () => {
    const meals = generateTrainingDayMeals('11:00', '06:30', 60);
    const breakfast = meals.find(m => m.label === 'Frühstück');
    expect(breakfast).toBeDefined();
    expect(breakfast.time).toBe('07:30');
  });

  it('wakeUpTime 05:30 → Frühstück um 06:30 (Training 13:00)', () => {
    const meals = generateTrainingDayMeals('13:00', '05:30', 60);
    const breakfast = meals.find(m => m.label === 'Frühstück');
    expect(breakfast).toBeDefined();
    expect(breakfast.time).toBe('06:30');
  });

  it('wakeUpTime 08:00 → Frühstück um 09:00 (Training 14:00)', () => {
    const meals = generateTrainingDayMeals('14:00', '08:00', 60);
    const breakfast = meals.find(m => m.label === 'Frühstück');
    expect(breakfast).toBeDefined();
    expect(breakfast.time).toBe('09:00');
  });
});

// ── Frühstück vs. Pre-Workout – Sichtbarkeitslogik ───────────────────────────

describe('generateTrainingDayMeals – Frühstück-Sichtbarkeit', () => {
  // wakeUpTime 06:30 → breakfastTime 07:30, EARLY_CUTOFF 09:00
  it('zeigt Frühstück als ersten Slot wenn Pre >= 90 Min nach Frühstückszeit (Training 11:00)', () => {
    const meals = generateTrainingDayMeals('11:00', '06:30', 60);
    // Pre = 09:45, breakfast = 07:30 → Lücke 135 Min ≥ 90 → Frühstück sichtbar
    expect(meals[0].label).toBe('Frühstück');
    expect(meals[1].label).toBe('Pre-Workout');
  });

  it('zeigt kein Frühstück wenn Pre < 90 Min nach Frühstückszeit (Training 09:00)', () => {
    const meals = generateTrainingDayMeals('09:00', '06:30', 60);
    // Pre = 07:45, breakfast = 07:30 → Lücke 15 Min < 90 → Pre übernimmt ersten Slot
    expect(meals[0].label).toBe('Pre-Workout');
    const hasBreakfast = meals.some(m => m.label === 'Frühstück');
    expect(hasBreakfast).toBe(false);
  });

  it('Grenzfall: Pre exakt 90 Min nach Frühstückszeit → Frühstück sichtbar', () => {
    // wakeUpTime 06:30 → breakfast 07:30, EARLY_CUTOFF 09:00
    // Training 10:15 → pre 09:00 = genau EARLY_CUTOFF → Mitteltraining (Frühstück sichtbar)
    const meals = generateTrainingDayMeals('10:15', '06:30', 60);
    expect(meals[0].label).toBe('Frühstück');
  });

  it('Grenzfall: Pre knapp unter 90 Min nach Frühstückszeit → kein Frühstück', () => {
    // Training 10:00 → pre 08:45, breakfast 07:30 → Lücke 75 Min < 90 → Frühtraining
    const meals = generateTrainingDayMeals('10:00', '06:30', 60);
    expect(meals[0].label).toBe('Pre-Workout');
  });
});

// ── Frühtraining-Szenario ─────────────────────────────────────────────────────

describe('generateTrainingDayMeals – Frühtraining (Pre vor EARLY_CUTOFF)', () => {
  it('liefert 4 Slots: Pre → Post → Mittag → Abend (Training 09:00, wakeUp 06:30)', () => {
    const meals = generateTrainingDayMeals('09:00', '06:30', 60);
    expect(getSlotLabels(meals)).toEqual(['Pre-Workout', 'Post-Workout', 'Mittagessen', 'Abendessen']);
  });

  it('Post-Workout-Zeit passt zur trainingDurationMin', () => {
    const meals = generateTrainingDayMeals('09:00', '06:30', 45);
    const post = meals.find(m => m.label === 'Post-Workout');
    // T=09:00 + 45 + 30 = 10:15
    expect(post.time).toBe('10:15');
  });
});

// ── Mitteltraining-Szenario ───────────────────────────────────────────────────

describe('generateTrainingDayMeals – Mitteltraining (Pre zwischen EARLY_CUTOFF und 13:00)', () => {
  it('liefert 4 Slots: Frühstück → Pre → Post → Abend (Training 11:00, wakeUp 06:30)', () => {
    const meals = generateTrainingDayMeals('11:00', '06:30', 60);
    expect(getSlotLabels(meals)).toEqual(['Frühstück', 'Pre-Workout', 'Post-Workout', 'Abendessen']);
  });

  it('Frühstücks-Uhrzeit ist wakeUp + 60 Min', () => {
    const meals = generateTrainingDayMeals('11:00', '06:30', 60);
    expect(meals[0].time).toBe('07:30');
  });

  it('Post-Workout-Uhrzeit ist T + trainingDurationMin + 30', () => {
    const meals = generateTrainingDayMeals('11:00', '06:30', 75);
    const post = meals.find(m => m.label === 'Post-Workout');
    // T=11:00 + 75 + 30 = 12:45
    expect(post.time).toBe('12:45');
  });
});

// ── Spättraining-Szenario ─────────────────────────────────────────────────────

describe('generateTrainingDayMeals – Spättraining (Pre ≥ 13:00)', () => {
  it('liefert 4 Slots: Frühstück → Mittag → Pre → Post (Training 16:00, wakeUp 06:30)', () => {
    const meals = generateTrainingDayMeals('16:00', '06:30', 60);
    expect(getSlotLabels(meals)).toEqual(['Frühstück', 'Mittagessen', 'Pre-Workout', 'Post-Workout']);
  });

  it('Post-Workout-Zeit passt zur trainingDurationMin beim Spättraining', () => {
    const meals = generateTrainingDayMeals('16:00', '06:30', 90);
    const post = meals.find(m => m.label === 'Post-Workout');
    // T=16:00 + 90 + 30 = 18:00
    expect(post.time).toBe('18:00');
  });
});

// ── Makro-Proportionen: Summen = 1.00 ────────────────────────────────────────

describe('generateTrainingDayMeals – Makro-Proportionen', () => {
  const trainingszeiten = ['07:00', '10:00', '11:00', '13:00', '16:00'];
  const wakeUps = ['05:30', '06:30', '07:00'];

  for (const t of trainingszeiten) {
    for (const w of wakeUps) {
      it(`kP/pP/cP/fP summieren zu 1.00 (Training ${t}, wakeUp ${w})`, () => {
        const meals = generateTrainingDayMeals(t, w, 60);
        const kP = meals.reduce((s, m) => s + m.kP, 0);
        const pP = meals.reduce((s, m) => s + m.pP, 0);
        const cP = meals.reduce((s, m) => s + m.cP, 0);
        const fP = meals.reduce((s, m) => s + m.fP, 0);
        expect(kP).toBeCloseTo(1.0, 5);
        expect(pP).toBeCloseTo(1.0, 5);
        expect(cP).toBeCloseTo(1.0, 5);
        expect(fP).toBeCloseTo(1.0, 5);
      });
    }
  }
});
