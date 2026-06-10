import { describe, it, expect } from 'vitest';
import { localDateString } from '../../../js/calc/dates.js';

describe('localDateString', () => {
  it('formatiert ein Datum als YYYY-MM-DD', () => {
    expect(localDateString(new Date(2026, 5, 10, 12, 0))).toBe('2026-06-10');
  });

  it('padded Monat und Tag mit führender Null', () => {
    expect(localDateString(new Date(2026, 0, 5, 8, 0))).toBe('2026-01-05');
  });

  it('TS-08: kurz nach Mitternacht lokaler Zeit bleibt es der lokale Tag', () => {
    // 00:30 lokal — toISOString() hätte in jeder Zeitzone östlich von UTC
    // (z.B. Deutschland) noch den Vortag geliefert
    const shortlyAfterMidnight = new Date(2026, 5, 10, 0, 30);
    expect(localDateString(shortlyAfterMidnight)).toBe('2026-06-10');
  });

  it('kurz vor Mitternacht bleibt es ebenfalls der lokale Tag', () => {
    const shortlyBeforeMidnight = new Date(2026, 5, 10, 23, 45);
    expect(localDateString(shortlyBeforeMidnight)).toBe('2026-06-10');
  });

  it('Jahreswechsel: 1. Januar 00:05 lokal ist der 1. Januar', () => {
    expect(localDateString(new Date(2027, 0, 1, 0, 5))).toBe('2027-01-01');
  });

  it('ohne Argument: liefert das heutige lokale Datum', () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(localDateString()).toBe(expected);
  });
});
