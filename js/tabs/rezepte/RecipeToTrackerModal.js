import { html, useState, useEffect } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { Modal } from '../../ui/Modal.js';
import { RECIPE_MEAL_SLOTS } from '../../data/mealSlots.js';
import { scaleRecipeMacros } from '../../calc/recipeTracking.js';

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Modal: Rezept in Tracker übernehmen.
 *
 * @param {{
 *   open: boolean,
 *   recipe: object | null,
 *   onClose: function,
 *   onSave: function,  // (trackerEntry) => void
 * }} props
 */
export function RecipeToTrackerModal({ open, recipe, onClose, onSave }) {
  const [slot, setSlot] = useState(RECIPE_MEAL_SLOTS[0]);
  const [portions, setPortions] = useState('1');

  useEffect(() => {
    if (!open || !recipe) return;
    setSlot(RECIPE_MEAL_SLOTS.includes(recipe.mealSlot) ? recipe.mealSlot : RECIPE_MEAL_SLOTS[0]);
    setPortions('1');
  }, [open, recipe]);

  if (!open || !recipe) return null;

  const portionsNum = parseFloat(portions);
  const safePortion = portionsNum > 0 ? portionsNum : 1;
  const scaled = scaleRecipeMacros(recipe, safePortion);

  function handleSave() {
    const isInitial = String(recipe.id).startsWith('initial-');
    const entry = {
      id: generateId(),
      mealSlot: slot,
      foodName: recipe.name,
      foodRef: isInitial ? `initial-recipe:${recipe.id}` : `recipe:${recipe.id}`,
      // gramm: echtes Portionsgewicht wenn aus Zutaten berechenbar, sonst 100g-Platzhalter.
      gramm: scaled.grammPerPortion ?? 100,
      kcal: scaled.kcal,
      p: scaled.p,
      c: scaled.c,
      f: scaled.f,
      timestamp: Date.now(),
    };
    onSave(entry);
    onClose();
  }

  return html`
    <${Modal} open=${open} onClose=${onClose}>
      <div style=${{ padding: '4px 0' }}>
        <div style=${{ ...S.cardTitle, fontSize: '12px', marginBottom: '14px' }}>
          ${recipe.icon ?? '🍽️'} ${recipe.name}
        </div>

        <label style=${S.label}>Mahlzeit</label>
        <select
          value=${slot}
          onChange=${e => setSlot(e.target.value)}
          style=${{ ...S.input, marginBottom: '14px' }}
        >
          ${RECIPE_MEAL_SLOTS.map(s => html`<option key=${s} value=${s}>${s}</option>`)}
        </select>

        <label style=${S.label}>Portionen</label>
        <input
          type="number"
          value=${portions}
          min="0.5"
          step="0.5"
          onInput=${e => setPortions(e.target.value)}
          style=${{ ...S.input, marginBottom: '14px' }}
        />

        <div style=${{
          background: '#1a1a12',
          border: `1px solid ${COLORS.gold}33`,
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '16px',
          fontFamily: FONTS.mono,
          fontSize: '12px',
          color: COLORS.text,
        }}>
          ${scaled.kcal} kcal · ${scaled.p}g P · ${scaled.c}g KH · ${scaled.f}g F
        </div>

        <div style=${{ display: 'flex', gap: '8px' }}>
          <button
            onClick=${onClose}
            style=${{ ...S.btn('#222', COLORS.text), flex: 1 }}
          >Abbrechen</button>
          <button
            onClick=${handleSave}
            style=${{ ...S.btn(COLORS.gold, '#111'), flex: 1 }}
          >Eintragen</button>
        </div>
      </div>
    </${Modal}>
  `;
}
