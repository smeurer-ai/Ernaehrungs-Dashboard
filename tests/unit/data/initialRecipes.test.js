// tests/unit/data/initialRecipes.test.js
import { describe, it, expect } from 'vitest';
import { INITIAL_RECIPES } from '../../../js/data/initialRecipes.js';
import { RECIPE_MEAL_SLOTS } from '../../../js/data/mealSlots.js';

describe('INITIAL_RECIPES — Vollständigkeit', () => {
  it('enthält genau 8 Rezepte', () => {
    expect(INITIAL_RECIPES).toHaveLength(8);
  });

  it('jedes Rezept hat eine eindeutige id im Format initial-00X', () => {
    const ids = INITIAL_RECIPES.map(r => r.id);
    expect(new Set(ids).size).toBe(8);
    ids.forEach(id => expect(id).toMatch(/^initial-00\d$/));
  });

  it('jedes Rezept hat name, mealSlot, prepTime, servings, icon', () => {
    INITIAL_RECIPES.forEach(r => {
      expect(typeof r.name).toBe('string');
      expect(r.name.length).toBeGreaterThan(0);
      expect(typeof r.mealSlot).toBe('string');
      expect(typeof r.prepTime).toBe('string');
      expect(typeof r.servings).toBe('number');
      expect(typeof r.icon).toBe('string');
    });
  });

  it('mealSlot jedes Rezepts liegt in RECIPE_MEAL_SLOTS', () => {
    INITIAL_RECIPES.forEach(r => {
      expect(RECIPE_MEAL_SLOTS).toContain(r.mealSlot);
    });
  });

  it('jedes Rezept hat mindestens 1 Zutat und 1 Zubereitungsschritt', () => {
    INITIAL_RECIPES.forEach(r => {
      expect(Array.isArray(r.ingredients)).toBe(true);
      expect(r.ingredients.length).toBeGreaterThan(0);
      expect(Array.isArray(r.steps)).toBe(true);
      expect(r.steps.length).toBeGreaterThan(0);
    });
  });

  it('jedes Rezept hat mindestens eine isMain-Zutat', () => {
    INITIAL_RECIPES.forEach(r => {
      const hasMain = r.ingredients.some(ing => ing.isMain === true);
      expect(hasMain, `Rezept "${r.name}" hat keine isMain-Zutat`).toBe(true);
    });
  });

  it('jede Zutat hat name (string), amount (number), unit (string), isMain (boolean)', () => {
    INITIAL_RECIPES.forEach(r => {
      r.ingredients.forEach(ing => {
        expect(typeof ing.name).toBe('string');
        expect(typeof ing.amount).toBe('number');
        expect(typeof ing.unit).toBe('string');
        expect(typeof ing.isMain).toBe('boolean');
      });
    });
  });

  it('kcal, protein, carbs, fat sind positive Zahlen', () => {
    INITIAL_RECIPES.forEach(r => {
      expect(r.kcal).toBeGreaterThan(0);
      expect(r.protein).toBeGreaterThan(0);
      expect(r.carbs).toBeGreaterThanOrEqual(0);
      expect(r.fat).toBeGreaterThanOrEqual(0);
    });
  });
});
