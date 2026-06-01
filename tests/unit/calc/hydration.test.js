import { describe, it, expect } from 'vitest';
import { generateHydrationReminders } from '../../../js/calc/hydration.js';

describe('generateHydrationReminders - Ruhetag', () => {
  it('gibt genau 2 Eintraege zurueck', () => {
    expect(generateHydrationReminders({ dayType: 'rest' })).toHaveLength(2);
  });

  it('IDs sind rest-0 und rest-1', () => {
    const result = generateHydrationReminders({ dayType: 'rest' });

    expect(result[0].id).toBe('rest-0');
    expect(result[1].id).toBe('rest-1');
  });

  it('Zeiten sind 08:30 und 14:00', () => {
    const result = generateHydrationReminders({ dayType: 'rest' });

    expect(result[0].time).toBe('08:30');
    expect(result[1].time).toBe('14:00');
  });

  it('amountMl ist ein Bereich mit min: 300 und max: 500', () => {
    const result = generateHydrationReminders({ dayType: 'rest' });

    expect(result[0].amountMl).toEqual({ min: 300, max: 500 });
    expect(result[1].amountMl).toEqual({ min: 300, max: 500 });
  });

  it('context ist restDay fuer beide Eintraege', () => {
    const result = generateHydrationReminders({ dayType: 'rest' });

    expect(result[0].context).toBe('restDay');
    expect(result[1].context).toBe('restDay');
  });
});

describe('generateHydrationReminders - Trainingstag Struktur', () => {
  const result = generateHydrationReminders({ dayType: 'training', trainingTime: '08:00' });

  it('gibt genau 6 Eintraege zurueck', () => {
    expect(result).toHaveLength(6);
  });

  it('IDs sind in der richtigen Reihenfolge', () => {
    expect(result.map(r => r.id)).toEqual([
      'pre-0',
      'pre-1',
      'during-0',
      'during-1',
      'during-2',
      'post-0',
    ]);
  });

  it('jeder Eintrag hat alle Pflichtfelder', () => {
    for (const entry of result) {
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('label');
      expect(entry).toHaveProperty('time');
      expect(entry).toHaveProperty('amountMl');
      expect(entry).toHaveProperty('context');
      expect(entry).toHaveProperty('note');
    }
  });

  it('amountMl ist immer ein Objekt mit min und max', () => {
    for (const entry of result) {
      expect(typeof entry.amountMl.min).toBe('number');
      expect(typeof entry.amountMl.max).toBe('number');
      expect(entry.amountMl.max).toBeGreaterThan(entry.amountMl.min);
    }
  });
});

describe('generateHydrationReminders - Zeiten bei Training 08:00', () => {
  const result = generateHydrationReminders({ dayType: 'training', trainingTime: '08:00' });

  it('pre-0: T - 2h = 06:00', () => {
    expect(result.find(r => r.id === 'pre-0').time).toBe('06:00');
  });

  it('pre-1: T - 15min = 07:45', () => {
    expect(result.find(r => r.id === 'pre-1').time).toBe('07:45');
  });

  it('during-0: T = 08:00', () => {
    expect(result.find(r => r.id === 'during-0').time).toBe('08:00');
  });

  it('during-1: T + 20min = 08:20', () => {
    expect(result.find(r => r.id === 'during-1').time).toBe('08:20');
  });

  it('during-2: T + 40min = 08:40', () => {
    expect(result.find(r => r.id === 'during-2').time).toBe('08:40');
  });

  it('post-0: T + 90min = 09:30', () => {
    expect(result.find(r => r.id === 'post-0').time).toBe('09:30');
  });
});

describe('generateHydrationReminders - Mengen bei Training 08:00', () => {
  const result = generateHydrationReminders({ dayType: 'training', trainingTime: '08:00' });

  it('pre-0: 400-600 ml', () => {
    expect(result.find(r => r.id === 'pre-0').amountMl).toEqual({ min: 400, max: 600 });
  });

  it('pre-1: 200-300 ml', () => {
    expect(result.find(r => r.id === 'pre-1').amountMl).toEqual({ min: 200, max: 300 });
  });

  it('during-Eintraege: alle 150-250 ml', () => {
    const during = result.filter(r => r.context === 'duringWorkout');

    for (const d of during) {
      expect(d.amountMl).toEqual({ min: 150, max: 250 });
    }
  });

  it('post-0: 400-600 ml', () => {
    expect(result.find(r => r.id === 'post-0').amountMl).toEqual({ min: 400, max: 600 });
  });
});

describe('generateHydrationReminders - Clamp-Logik', () => {
  it('fruehes Training 06:00: pre-0 wird auf 05:00 geclamppt', () => {
    const result = generateHydrationReminders({ dayType: 'training', trainingTime: '06:00' });

    expect(result.find(r => r.id === 'pre-0').time).toBe('05:00');
  });

  it('fruehes Training 06:00: pre-0 label = "Direkt nach dem Aufstehen"', () => {
    const result = generateHydrationReminders({ dayType: 'training', trainingTime: '06:00' });

    expect(result.find(r => r.id === 'pre-0').label).toBe('Direkt nach dem Aufstehen');
  });

  it('normales Training 08:00: pre-0 label = "Vor dem Training"', () => {
    const result = generateHydrationReminders({ dayType: 'training', trainingTime: '08:00' });

    expect(result.find(r => r.id === 'pre-0').label).toBe('Vor dem Training');
  });

  it('Grenzfall Training 07:00: T-120 = 05:00 exakt, daher nicht geclamppt', () => {
    const result = generateHydrationReminders({ dayType: 'training', trainingTime: '07:00' });
    const pre0 = result.find(r => r.id === 'pre-0');

    expect(pre0.time).toBe('05:00');
    expect(pre0.label).toBe('Vor dem Training');
  });

  it('sehr fruehes Training 05:30: pre-0 wird geclamppt und passend benannt', () => {
    const result = generateHydrationReminders({ dayType: 'training', trainingTime: '05:30' });
    const pre0 = result.find(r => r.id === 'pre-0');

    expect(pre0.time).toBe('05:00');
    expect(pre0.label).toBe('Direkt nach dem Aufstehen');
  });
});
