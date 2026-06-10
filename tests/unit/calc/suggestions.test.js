import { describe, it, expect } from 'vitest';
import { computeGapSuggestions, isCaseinSource } from '../../../js/calc/suggestions.js';

const GAP = { kcal: 500, p: 30 };

const QUARK   = { id: 'q', name: 'Magerquark',   kcal100: 67,  p100: 12 };
const NUESSE  = { id: 'n', name: 'Walnüsse',     kcal100: 654, p100: 15 };
const PUTE    = { id: 'p', name: 'Putenbrust',   kcal100: 105, p100: 23, isNotvorrat: true };
const GURKE   = { id: 'g', name: 'Gurke',        kcal100: 15,  p100: 0 };

describe('isCaseinSource', () => {
  it('erkennt Quark/Skyr/Casein/Hüttenkäse', () => {
    expect(isCaseinSource('Magerquark')).toBe(true);
    expect(isCaseinSource('Skyr Natur')).toBe(true);
    expect(isCaseinSource('Hüttenkäse')).toBe(true);
    expect(isCaseinSource('Putenbrust')).toBe(false);
  });
});

describe('computeGapSuggestions', () => {
  it('Protein-Lücke < 10g → keine Vorschläge (kein Rauschen)', () => {
    const r = computeGapSuggestions({ gap: { kcal: 400, p: 8 }, favorites: [QUARK, PUTE] });
    expect(r).toEqual([]);
  });

  it('sortiert nach Proteindichte (Protein pro 100 kcal)', () => {
    const r = computeGapSuggestions({ gap: GAP, favorites: [NUESSE, QUARK] });
    expect(r[0].item.name).toBe('Magerquark');   // 17.9 g P/100kcal vor 2.3
  });

  it('Lebensmittel ohne Protein werden aussortiert', () => {
    const r = computeGapSuggestions({ gap: GAP, favorites: [GURKE, QUARK] });
    expect(r.find(s => s.item.name === 'Gurke')).toBeUndefined();
  });

  it('Notvorrat-⭐ gibt Bonus und Badge', () => {
    const r = computeGapSuggestions({ gap: GAP, favorites: [QUARK, PUTE] });
    const pute = r.find(s => s.item.name === 'Putenbrust');
    expect(pute.reason).toBe('⭐ Notvorrat');
    expect(r[0].item.name).toBe('Putenbrust');   // 21.9 + 30 Bonus > 17.9
  });

  it('Kühlschrank-Match gibt Bonus und Badge', () => {
    const r = computeGapSuggestions({
      gap: GAP, favorites: [QUARK, PUTE],
      fridgeItems: [{ foodName: 'Magerquark 500g' }],
    });
    const quark = r.find(s => s.item.name === 'Magerquark');
    expect(quark.reason).toBe('❄ im Kühlschrank');
  });

  it('Casein-Bonus nur am Abend', () => {
    const evening = computeGapSuggestions({ gap: GAP, isEvening: true, favorites: [QUARK] });
    expect(evening[0].reason).toBe('🌙 Casein für die Nacht');
    const day = computeGapSuggestions({ gap: GAP, isEvening: false, favorites: [QUARK] });
    expect(day[0].reason).toBe('💪 proteinreich');
  });

  it('Notvorrat-Badge gewinnt über Casein/Kühlschrank (höchste Priorität)', () => {
    const fav = { id: 'x', name: 'Skyr', kcal100: 63, p100: 11, isNotvorrat: true };
    const r = computeGapSuggestions({ gap: GAP, isEvening: true, favorites: [fav], fridgeItems: [{ foodName: 'Skyr' }] });
    expect(r[0].reason).toBe('⭐ Notvorrat');
  });

  it('Kalorienbremse: Kandidat über 1.3× Rest-kcal fällt zurück', () => {
    const r = computeGapSuggestions({ gap: { kcal: 300, p: 30 }, favorites: [NUESSE, QUARK] });
    expect(r[0].item.name).toBe('Magerquark');
    expect(r.find(s => s.item.name === 'Walnüsse').score).toBeLessThan(0);
  });

  it('Favoriten-Mahlzeiten werden als Kandidaten einbezogen', () => {
    const meal = { id: 'm', name: 'Mein Frühstücksquark', totalMacros: { kcal: 300, p: 35 } };
    const r = computeGapSuggestions({ gap: GAP, meals: [meal] });
    expect(r[0].kind).toBe('meal');
    expect(r[0].item.name).toBe('Mein Frühstücksquark');
  });

  it('liefert maximal maxResults (Default 4)', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ id: String(i), name: `F${i}`, kcal100: 100, p100: 20 }));
    expect(computeGapSuggestions({ gap: GAP, favorites: many })).toHaveLength(4);
  });
});
