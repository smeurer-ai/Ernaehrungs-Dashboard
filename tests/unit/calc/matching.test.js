import { describe, it, expect } from 'vitest';
import { recipeMatchesFridge } from '../../../js/calc/matching.js';

const FRIDGE = [
  { foodName: 'Hähnchen' },
  { foodName: 'Magerquark 500g' },
  { foodName: 'Brokkoli' },
];

function recipe(ingredients) { return { ingredients }; }

describe('recipeMatchesFridge', () => {
  it('alle Hauptzutaten im Kühlschrank → matches', () => {
    const r = recipeMatchesFridge(recipe([
      { name: 'Hähnchenbrust', isMain: true },
      { name: 'Brokkoli', isMain: true },
      { name: 'Sojasauce', isMain: false },
    ]), FRIDGE);
    expect(r.matches).toBe(true);
    expect(r.missingMain).toEqual([]);
  });

  it('Substring-Matching in beide Richtungen (Hähnchenbrust ↔ Hähnchen, Quark ↔ Magerquark 500g)', () => {
    const r = recipeMatchesFridge(recipe([{ name: 'Quark', isMain: true }]), FRIDGE);
    expect(r.matches).toBe(true);
  });

  it('case-insensitiv', () => {
    const r = recipeMatchesFridge(recipe([{ name: 'BROKKOLI', isMain: true }]), FRIDGE);
    expect(r.matches).toBe(true);
  });

  it('fehlende Hauptzutat → matches false + missingMain benennt sie', () => {
    const r = recipeMatchesFridge(recipe([
      { name: 'Hähnchen', isMain: true },
      { name: 'Süßkartoffel', isMain: true },
    ]), FRIDGE);
    expect(r.matches).toBe(false);
    expect(r.missingMain).toEqual(['Süßkartoffel']);
  });

  it('Nicht-Hauptzutaten werden ignoriert', () => {
    const r = recipeMatchesFridge(recipe([
      { name: 'Brokkoli', isMain: true },
      { name: 'Trüffelöl', isMain: false },
    ]), FRIDGE);
    expect(r.matches).toBe(true);
  });

  it('Rezept ohne Hauptzutaten → matches false (kein Treffer aus Versehen)', () => {
    const r = recipeMatchesFridge(recipe([{ name: 'Salz', isMain: false }]), FRIDGE);
    expect(r.matches).toBe(false);
  });

  it('leerer Kühlschrank → matches false, alle Hauptzutaten fehlen', () => {
    const r = recipeMatchesFridge(recipe([{ name: 'Brokkoli', isMain: true }]), []);
    expect(r.matches).toBe(false);
    expect(r.missingMain).toEqual(['Brokkoli']);
  });
});
