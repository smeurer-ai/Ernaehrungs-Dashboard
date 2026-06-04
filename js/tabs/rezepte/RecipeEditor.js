import { html, useState, useEffect } from '../../lib.js';
import { Modal } from '../../ui/Modal.js';
import { RECIPE_MEAL_SLOTS, INGREDIENT_UNIT_SUGGESTIONS } from '../../data/mealSlots.js';
import { COLORS, FONTS, S } from '../../ui/theme.js';

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyIngredient() {
  return { name: '', amount: '', unit: 'g', isMain: false };
}

function initForm(recipe) {
  return {
    name:        recipe?.name     ?? '',
    mealSlot:    recipe?.mealSlot ?? RECIPE_MEAL_SLOTS[0],
    prepTime:    recipe?.prepTime ?? '',
    servings:    recipe?.servings != null ? String(recipe.servings) : '1',
    kcal:        recipe?.kcal     != null ? String(recipe.kcal)    : '',
    protein:     recipe?.protein  != null ? String(recipe.protein) : '',
    carbs:       recipe?.carbs    != null ? String(recipe.carbs)   : '',
    fat:         recipe?.fat      != null ? String(recipe.fat)     : '',
    tip:         recipe?.tip      ?? '',
    ingredients: recipe?.ingredients?.length > 0
      ? recipe.ingredients.map(i => ({ ...i, amount: String(i.amount) }))
      : [emptyIngredient()],
    steps: recipe?.steps?.length > 0
      ? [...recipe.steps]
      : [''],
  };
}

function validate(form) {
  const errors = [];
  if (!form.name.trim())
    errors.push('Name ist Pflicht.');
  if (!RECIPE_MEAL_SLOTS.includes(form.mealSlot))
    errors.push('Ungültiger Mahlzeit-Slot.');
  if (form.kcal === '' || isNaN(Number(form.kcal)) || Number(form.kcal) < 0)
    errors.push('kcal muss eine Zahl ≥ 0 sein.');
  if (form.protein === '' || isNaN(Number(form.protein)) || Number(form.protein) < 0)
    errors.push('Protein muss eine Zahl ≥ 0 sein.');
  if (form.carbs === '' || isNaN(Number(form.carbs)) || Number(form.carbs) < 0)
    errors.push('KH muss eine Zahl ≥ 0 sein.');
  if (form.fat === '' || isNaN(Number(form.fat)) || Number(form.fat) < 0)
    errors.push('Fett muss eine Zahl ≥ 0 sein.');
  if (!form.steps.some(s => s.trim()))
    errors.push('Mindestens 1 Zubereitungsschritt ist Pflicht.');
  return errors;
}

const UNIT_LIST_ID = 'recipe-editor-units';

// compact inputs for the dense form layout
const inp  = { ...S.input, fontSize: '13px', padding: '8px 10px' };
const ta   = { ...inp, resize: 'vertical', minHeight: '52px', fontFamily: FONTS.sans };
const addBtnStyle = {
  background: '#1a1a1a', border: '1px dashed #333', borderRadius: '8px',
  color: COLORS.textMuted, width: '100%', padding: '8px', fontSize: '12px',
  cursor: 'pointer', marginBottom: '14px', fontFamily: FONTS.mono,
};
const removeBtnStyle = {
  background: 'none', border: 'none', color: COLORS.textMuted,
  cursor: 'pointer', fontSize: '18px', padding: '0 4px', lineHeight: 1, flexShrink: 0,
};

function arrowBtnStyle(disabled) {
  return {
    background: 'none', border: `1px solid ${disabled ? '#222' : '#333'}`, borderRadius: '4px',
    color: disabled ? '#333' : COLORS.textMuted, cursor: disabled ? 'default' : 'pointer',
    padding: '2px 5px', fontSize: '10px', flexShrink: 0,
  };
}

export function RecipeEditor({ open, onClose, recipe, onSave }) {
  const isEdit = !!recipe?.id;
  const [form, setForm] = useState(() => initForm(recipe));
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!open) return;
    setForm(initForm(recipe));
    setErrors([]);
  }, [open, recipe]);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function setIngredient(i, key, val) {
    setForm(f => ({
      ...f,
      ingredients: f.ingredients.map((ing, idx) => idx === i ? { ...ing, [key]: val } : ing),
    }));
  }
  function addIngredient() {
    setForm(f => ({ ...f, ingredients: [...f.ingredients, emptyIngredient()] }));
  }
  function removeIngredient(i) {
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }));
  }

  function setStep(i, val) {
    setForm(f => { const s = [...f.steps]; s[i] = val; return { ...f, steps: s }; });
  }
  function addStep() { setForm(f => ({ ...f, steps: [...f.steps, ''] })); }
  function removeStep(i) {
    setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));
  }
  function moveStep(i, dir) {
    setForm(f => {
      const s = [...f.steps];
      const j = i + dir;
      if (j < 0 || j >= s.length) return f;
      [s[i], s[j]] = [s[j], s[i]];
      return { ...f, steps: s };
    });
  }

  function handleSave() {
    const errs = validate(form);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    onSave({
      id:          recipe?.id ?? generateId(),
      name:        form.name.trim(),
      mealSlot:    form.mealSlot,
      prepTime:    form.prepTime.trim() || undefined,
      servings:    Number(form.servings) || 1,
      kcal:        Number(form.kcal),
      protein:     Number(form.protein),
      carbs:       Number(form.carbs),
      fat:         Number(form.fat),
      tip:         form.tip.trim() || undefined,
      ingredients: form.ingredients
        .filter(ing => ing.name.trim())
        .map(ing => ({
          name:   ing.name.trim(),
          amount: Number(ing.amount) || 0,
          unit:   ing.unit || 'g',
          isMain: !!ing.isMain,
        })),
      steps:     form.steps.filter(s => s.trim()).map(s => s.trim()),
      source:    'manual',
      createdAt: recipe?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    });
    onClose();
  }

  return html`
    <${Modal} open=${open} onClose=${onClose} title=${isEdit ? 'Rezept bearbeiten' : 'Eigenes Rezept'}>

      <datalist id=${UNIT_LIST_ID}>
        ${INGREDIENT_UNIT_SUGGESTIONS.map(u => html`<option key=${u} value=${u} />`)}
      </datalist>

      ${errors.length > 0 && html`
        <div style=${{ background: '#2a1515', border: `1px solid ${COLORS.error}44`, borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
          ${errors.map((e, i) => html`
            <div key=${i} style=${{ fontSize: '12px', color: COLORS.error, fontFamily: FONTS.mono }}>${e}</div>
          `)}
        </div>
      `}

      <!-- Name -->
      <label style=${S.label}>Name *</label>
      <input
        style=${{ ...inp, marginBottom: '12px' }}
        value=${form.name}
        onInput=${e => set('name', e.target.value)}
        placeholder="Rezeptname"
      />

      <!-- Mahlzeit-Slot + Portionen -->
      <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <div>
          <label style=${S.label}>Mahlzeit *</label>
          <select style=${inp} value=${form.mealSlot} onChange=${e => set('mealSlot', e.target.value)}>
            ${RECIPE_MEAL_SLOTS.map(slot => html`<option key=${slot} value=${slot}>${slot}</option>`)}
          </select>
        </div>
        <div>
          <label style=${S.label}>Portionen</label>
          <input
            style=${inp}
            type="number"
            min="1"
            max="12"
            value=${form.servings}
            onInput=${e => set('servings', e.target.value)}
          />
        </div>
      </div>

      <!-- Zubereitungszeit -->
      <label style=${S.label}>Zubereitungszeit</label>
      <input
        style=${{ ...inp, marginBottom: '14px' }}
        value=${form.prepTime}
        onInput=${e => set('prepTime', e.target.value)}
        placeholder="z.B. 20 min"
      />

      <!-- Makros -->
      <div style=${{ ...S.cardTitle, marginBottom: '8px' }}>Makros (gesamt) *</div>
      <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
        ${[['kcal','kcal'],['protein','Protein g'],['carbs','KH g'],['fat','Fett g']].map(([key, lbl]) => html`
          <div key=${key}>
            <label style=${{ ...S.label, fontSize: '9px' }}>${lbl}</label>
            <input
              style=${{ ...inp, textAlign: 'center' }}
              type="number"
              min="0"
              value=${form[key]}
              onInput=${e => set(key, e.target.value)}
              placeholder="0"
            />
          </div>
        `)}
      </div>

      <!-- Zutaten -->
      <div style=${{ ...S.cardTitle, marginBottom: '6px' }}>
        Zutaten
        <span style=${{ color: COLORS.gold, fontWeight: 400, letterSpacing: 0, marginLeft: '8px' }}>● = Hauptzutat</span>
      </div>
      ${form.ingredients.map((ing, i) => html`
        <div key=${i} style=${{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px' }}>
          <input
            style=${{ ...inp, flex: 3, minWidth: 0 }}
            value=${ing.name}
            onInput=${e => setIngredient(i, 'name', e.target.value)}
            placeholder="Zutat"
          />
          <input
            style=${{ ...inp, flex: 1, minWidth: 0, textAlign: 'right' }}
            type="number"
            min="0"
            value=${ing.amount}
            onInput=${e => setIngredient(i, 'amount', e.target.value)}
            placeholder="Menge"
          />
          <input
            style=${{ ...inp, flex: 1, minWidth: 0 }}
            list=${UNIT_LIST_ID}
            value=${ing.unit}
            onInput=${e => setIngredient(i, 'unit', e.target.value)}
          />
          <input
            type="checkbox"
            checked=${ing.isMain}
            onChange=${e => setIngredient(i, 'isMain', e.target.checked)}
            title="Hauptzutat"
            style=${{ accentColor: COLORS.gold, width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
          />
          <button onClick=${() => removeIngredient(i)} style=${removeBtnStyle}>×</button>
        </div>
      `)}
      <button onClick=${addIngredient} style=${addBtnStyle}>+ Zutat hinzufügen</button>

      <!-- Schritte -->
      <div style=${{ ...S.cardTitle, marginBottom: '8px' }}>Zubereitung *</div>
      ${form.steps.map((step, i) => html`
        <div key=${i} style=${{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginBottom: '6px' }}>
          <span style=${{ color: COLORS.gold, fontFamily: FONTS.mono, fontSize: '12px', paddingTop: '10px', minWidth: '18px', flexShrink: 0 }}>${i + 1}.</span>
          <textarea
            style=${{ ...ta, flex: 1, minWidth: 0 }}
            value=${step}
            onInput=${e => setStep(i, e.target.value)}
            placeholder="Schritt beschreiben…"
          />
          <div style=${{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '4px', flexShrink: 0 }}>
            <button onClick=${() => moveStep(i, -1)} disabled=${i === 0} style=${arrowBtnStyle(i === 0)}>▲</button>
            <button onClick=${() => moveStep(i, 1)} disabled=${i === form.steps.length - 1} style=${arrowBtnStyle(i === form.steps.length - 1)}>▼</button>
            <button onClick=${() => removeStep(i)} style=${removeBtnStyle}>×</button>
          </div>
        </div>
      `)}
      <button onClick=${addStep} style=${addBtnStyle}>+ Schritt hinzufügen</button>

      <!-- Tipp -->
      <label style=${S.label}>Tipp (optional)</label>
      <textarea
        style=${{ ...ta, width: '100%', marginBottom: '16px' }}
        value=${form.tip}
        onInput=${e => set('tip', e.target.value)}
        placeholder="Ernährungswissen, Varianten, Hinweise…"
      />

      <!-- Buttons -->
      <div style=${{ display: 'flex', gap: '8px' }}>
        <button onClick=${onClose} style=${{ ...S.btn('#2a2a2a', COLORS.text), flex: 1 }}>
          Abbrechen
        </button>
        <button onClick=${handleSave} style=${{ ...S.btn(COLORS.gold, '#111'), flex: 1 }}>
          ${isEdit ? 'Änderungen speichern' : 'Rezept speichern'}
        </button>
      </div>

    </${Modal}>
  `;
}
