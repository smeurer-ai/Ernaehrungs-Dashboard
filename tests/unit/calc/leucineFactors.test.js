import { describe, it, expect } from 'vitest';
import {
  estimateLeucineFactor,
  computeMpsFields,
  LEUCINE_DEFAULT,
} from '../../../js/calc/leucineFactors.js';

describe('estimateLeucineFactor', () => {
  it('gibt Default zurück für leeres Array', () => {
    expect(estimateLeucineFactor([])).toEqual(LEUCINE_DEFAULT);
  });

  it('gibt Default zurück für undefined', () => {
    expect(estimateLeucineFactor(undefined)).toEqual(LEUCINE_DEFAULT);
  });

  it('erkennt Milchprodukte (dairy)', () => {
    const r = estimateLeucineFactor(['en:dairy', 'en:fermented-foods']);
    expect(r.leucinePct).toBe(0.105);
    expect(r.qualityScore).toBe(0.95);
  });

  it('erkennt Käse (cheese)', () => {
    const r = estimateLeucineFactor(['en:cheeses', 'en:dairy']);
    expect(r.leucinePct).toBe(0.105);
  });

  it('erkennt Fleisch (meat)', () => {
    const r = estimateLeucineFactor(['en:meats', 'en:processed-foods']);
    expect(r.leucinePct).toBe(0.095);
    expect(r.qualityScore).toBe(0.95);
  });

  it('erkennt Fisch (fish)', () => {
    const r = estimateLeucineFactor(['en:fish-and-seafood', 'en:seafoods']);
    expect(r.leucinePct).toBe(0.092);
  });

  it('erkennt Ei (egg)', () => {
    const r = estimateLeucineFactor(['en:egg-based-foods']);
    expect(r.leucinePct).toBe(0.088);
    expect(r.qualityScore).toBe(0.92);
  });

  it('erkennt Soja (soy)', () => {
    const r = estimateLeucineFactor(['en:soy-based-foods']);
    expect(r.leucinePct).toBe(0.082);
  });

  it('erkennt Hülsenfrüchte (legume)', () => {
    const r = estimateLeucineFactor(['en:legumes', 'en:lentils']);
    expect(r.leucinePct).toBe(0.078);
  });

  it('erkennt Getreide (grain)', () => {
    const r = estimateLeucineFactor(['en:grain-based-foods']);
    expect(r.leucinePct).toBe(0.068);
    expect(r.qualityScore).toBe(0.50);
  });

  it('erkennt Reis (rice)', () => {
    const r = estimateLeucineFactor(['en:rice', 'en:cereals']);
    // cereal kommt vor rice in Rules → cereal gewinnt
    expect(r.leucinePct).toBe(0.068);
  });

  it('dairy hat Vorrang vor grain (erste Regel gewinnt)', () => {
    const r = estimateLeucineFactor(['en:grain-based-desserts', 'en:dairy-desserts']);
    expect(r.leucinePct).toBe(0.105);
  });
});

describe('computeMpsFields', () => {
  it('berechnet Leucin korrekt für Milchprodukt', () => {
    // dairy: 0.105 * 35 = 3.675 → gerundet 3.7
    const r = computeMpsFields(35, ['en:dairy']);
    expect(r.leucineEstimateG).toBe(3.7);
    expect(r.proteinQualityScore).toBe(0.95);
    expect(r.mpsTriggered).toBe(true);
  });

  it('setzt mpsTriggered false wenn Leucin < 3g', () => {
    // dairy: 0.105 * 20 = 2.1
    const r = computeMpsFields(20, ['en:dairy']);
    expect(r.leucineEstimateG).toBe(2.1);
    expect(r.mpsTriggered).toBe(false);
  });

  it('verwendet Default-Faktor für unbekannte Kategorien', () => {
    // default: 0.080 * 30 = 2.4
    const r = computeMpsFields(30, ['en:snacks', 'en:sweets']);
    expect(r.leucineEstimateG).toBe(2.4);
    expect(r.proteinQualityScore).toBe(0.70);
    expect(r.mpsTriggered).toBe(false);
  });

  it('MPS getriggert an der Grenze: 0.105 * 29 = 3.045 → true', () => {
    const r = computeMpsFields(29, ['en:dairy']);
    expect(r.leucineEstimateG).toBe(3.0); // Math.round(3.045 * 10) / 10 = 3.0
    expect(r.mpsTriggered).toBe(true);
  });

  it('MPS nicht getriggert: 0.105 * 28 = 2.94 → false', () => {
    const r = computeMpsFields(28, ['en:dairy']);
    expect(r.leucineEstimateG).toBe(2.9); // Math.round(2.94 * 10) / 10 = 2.9
    expect(r.mpsTriggered).toBe(false);
  });

  it('gibt alle drei Felder zurück', () => {
    const r = computeMpsFields(25, ['en:meat']);
    expect(r).toHaveProperty('leucineEstimateG');
    expect(r).toHaveProperty('proteinQualityScore');
    expect(r).toHaveProperty('mpsTriggered');
  });
});
