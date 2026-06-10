import { html, useState, useEffect, useMemo } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { Modal } from '../../ui/Modal.js';
import { OFFSearchPanel } from './OFFSearchPanel.js';
import { calcTrackedFoodMacros, computeSlotGap } from '../../calc/tracker.js';
import { isMainMealSlot } from '../../calc/nutritionLogic.js';
import { computeMealTotals } from '../../calc/meals.js';
import { filterFavorites } from '../../calc/favorites.js';

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyItem() {
  return { foodName: '', gramm: '', kcal100: '', p100: '', c100: '', f100: '', sourceRef: '' };
}

// SavedMeal-Item (absolute Werte) → Formular-Item (per 100g, Strings)
function itemToForm(item) {
  const factor = item.gramm > 0 ? 100 / item.gramm : 0;
  return {
    foodName: item.foodName,
    gramm:    String(item.gramm),
    kcal100:  String(Math.round((item.kcal ?? 0) * factor)),
    p100:     String(Math.round((item.p ?? 0) * factor * 10) / 10),
    c100:     String(Math.round((item.c ?? 0) * factor * 10) / 10),
    f100:     String(Math.round((item.f ?? 0) * factor * 10) / 10),
    sourceRef: item.foodRef ?? '',
  };
}

// Formular-Item → berechnete absolute Makros (oder null wenn unvollständig)
function formItemMacros(it) {
  const g = parseFloat(it.gramm);
  const k = parseFloat(it.kcal100);
  if (!it.foodName.trim() || !g || g <= 0 || isNaN(k)) return null;
  return calcTrackedFoodMacros(
    {
      kcal100: k || 0,
      p100: parseFloat(it.p100) || 0,
      c100: parseFloat(it.c100) || 0,
      f100: parseFloat(it.f100) || 0,
    },
    g,
  );
}

const inp = { ...S.input, fontSize: '13px', padding: '8px 10px' };

/**
 * Baukasten: Mahlzeit aus mehreren Lebensmitteln zusammenstellen.
 * Sticky-Ziel-Panel oben zeigt Slot-Ziel / Summe / Lücke / MPS live.
 *
 * @param {{
 *   open: boolean,
 *   onClose: function,
 *   onSave: function,        // (savedMeal) => void
 *   meal?: object,           // wenn gesetzt: Bearbeiten-Modus
 *   mealSlots: string[],
 *   slotTargets: object,     // { slot: { kcal, p, c, f } }
 *   favorites: array,
 * }} props
 */
export function MealBuilderModal({ open, onClose, onSave, meal, mealSlots = [], slotTargets, favorites = [] }) {
  const isEdit = !!meal?.id;

  const [name, setName] = useState('');
  const [slot, setSlot] = useState(mealSlots[0] ?? 'Frühstück');
  const [items, setItems] = useState([emptyItem()]);
  const [errors, setErrors] = useState([]);
  const [suggestIdx, setSuggestIdx] = useState(null);
  const [offSearchIdx, setOffSearchIdx] = useState(null);
  const [detailsIdx, setDetailsIdx] = useState(null);

  useEffect(() => {
    if (!open) return;
    setName(meal?.name ?? '');
    setSlot(mealSlots.includes(meal?.defaultSlot) ? meal.defaultSlot : (mealSlots[0] ?? 'Frühstück'));
    setItems(meal?.items?.length ? meal.items.map(itemToForm) : [emptyItem()]);
    setErrors([]);
    setSuggestIdx(null);
    setOffSearchIdx(null);
    setDetailsIdx(null);
  }, [open, meal]);

  function setItem(i, key, val) {
    setItems(arr => arr.map((it, idx) => idx === i ? { ...it, [key]: val } : it));
  }
  function addItem() { setItems(arr => [...arr, emptyItem()]); }
  function removeItem(i) { setItems(arr => arr.filter((_, idx) => idx !== i)); }

  function applyFood(i, food, sourceRef) {
    setItems(arr => arr.map((it, idx) => idx === i ? {
      ...it,
      foodName: food.name || it.foodName,
      kcal100: String(food.kcal100 ?? 0),
      p100:    String(food.p100    ?? 0),
      c100:    String(food.c100    ?? 0),
      f100:    String(food.f100    ?? 0),
      sourceRef,
    } : it));
    setSuggestIdx(null);
  }

  // Live: absolute Makros je Item + Summe
  const itemMacros = useMemo(() => items.map(formItemMacros), [items]);
  const totals = useMemo(
    () => computeMealTotals(itemMacros.filter(m => m != null)),
    [itemMacros],
  );
  const validCount = itemMacros.filter(m => m != null).length;

  const target = slotTargets?.[slot];
  const gap = target ? computeSlotGap(target, {}, totals) : null;
  const isMainSlot = isMainMealSlot(slot);

  function handleSave() {
    const errs = [];
    if (!name.trim()) errs.push('Name ist Pflicht.');
    if (validCount === 0) errs.push('Mindestens 1 Lebensmittel mit Name, Gramm und kcal/100g ist Pflicht.');
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    const savedItems = items
      .map((it, i) => ({ it, m: itemMacros[i] }))
      .filter(({ m }) => m != null)
      .map(({ it, m }) => ({
        foodRef:  it.sourceRef || 'manual',
        foodName: it.foodName.trim(),
        gramm:    parseFloat(it.gramm),
        kcal:     m.kcal,
        p:        m.p,
        c:        m.c,
        f:        m.f,
      }));

    onSave({
      id:          meal?.id ?? generateId(),
      name:        name.trim(),
      defaultSlot: slot,
      items:       savedItems,
      totalMacros: computeMealTotals(savedItems),
      lastUsed:    meal?.lastUsed ?? null,
      createdAt:   meal?.createdAt ?? Date.now(),
    });
    onClose();
  }

  if (!open) return null;

  return html`
    <${Modal} open=${open} onClose=${onClose} title=${isEdit ? 'Mahlzeit bearbeiten' : 'Mahlzeit zusammenstellen'}>

      ${errors.length > 0 && html`
        <div style=${{ background: '#2a1515', border: `1px solid ${COLORS.error}44`, borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
          ${errors.map((e, i) => html`
            <div key=${i} style=${{ fontSize: '12px', color: COLORS.error, fontFamily: FONTS.mono }}>${e}</div>
          `)}
        </div>
      `}

      <label style=${S.label}>Name *</label>
      <input
        style=${{ ...inp, marginBottom: '10px' }}
        value=${name}
        onInput=${e => setName(e.target.value)}
        placeholder="z.B. Mein Frühstücksquark"
      />

      <label style=${S.label}>Mahlzeit-Slot (Ziel-Referenz)</label>
      <select
        value=${slot}
        onChange=${e => setSlot(e.target.value)}
        style=${{ ...inp, marginBottom: '10px' }}
      >
        ${mealSlots.map(s => html`<option key=${s} value=${s}>${s}</option>`)}
      </select>

      ${target && html`
        <div style=${{
          position: 'sticky', top: 0, zIndex: 2,
          background: '#141414', border: '1px solid #2a2a2a', borderRadius: '8px',
          padding: '8px 12px', marginBottom: '12px',
          fontFamily: FONTS.mono, fontSize: '11px', lineHeight: 1.7,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}>
          <div style=${{ color: COLORS.textMuted }}>
            Ziel ${slot}: ${target.kcal} kcal · P ${target.p}g · KH ${target.c}g · F ${target.f}g
          </div>
          <div style=${{ color: COLORS.text }}>
            Diese Mahlzeit: ${totals.kcal} kcal · P ${totals.p}g · KH ${totals.c}g · F ${totals.f}g
          </div>
          ${gap.kcal === 0 && gap.p === 0 && gap.c === 0 && gap.f === 0
            ? html`<div style=${{ color: '#5cb85c' }}>✓ Slot-Ziel erreicht</div>`
            : html`
              <div style=${{ color: COLORS.gold }}>
                Noch offen: ${gap.kcal} kcal · P ${gap.p}g · KH ${gap.c}g · F ${gap.f}g
              </div>
            `}
          ${isMainSlot && html`
            <div style=${{ color: totals.p >= 30 ? '#5cb85c' : '#c8a830' }}>
              ${totals.p >= 30
                ? `✓ MPS: ~30g Protein erreicht (${totals.p}g)`
                : `MPS-Trigger braucht ~30g Protein — aktuell ${totals.p}g`}
            </div>
          `}
        </div>
      `}

      <div style=${{ ...S.cardTitle, marginBottom: '6px' }}>Lebensmittel</div>
      ${items.map((it, i) => {
        const showSuggestions = suggestIdx === i && it.foodName.trim().length >= 2;
        const suggestions = showSuggestions ? filterFavorites(favorites, it.foodName, 5).items : [];
        const m = itemMacros[i];

        return html`
        <div key=${i} style=${{ marginBottom: '10px' }}>
          <div style=${{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              style=${{ ...inp, flex: 3, minWidth: 0 }}
              value=${it.foodName}
              onInput=${e => { setItem(i, 'foodName', e.target.value); setSuggestIdx(i); }}
              onFocus=${() => setSuggestIdx(i)}
              onBlur=${() => setTimeout(() => setSuggestIdx(cur => cur === i ? null : cur), 150)}
              placeholder="Lebensmittel suchen…"
            />
            <input
              style=${{ ...inp, flex: 1, minWidth: 0, textAlign: 'right' }}
              type="number"
              min="0"
              value=${it.gramm}
              onInput=${e => setItem(i, 'gramm', e.target.value)}
              placeholder="g"
            />
            <button
              onClick=${() => removeItem(i)}
              style=${{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '18px', padding: '0 4px', flexShrink: 0 }}
            >×</button>
          </div>

          ${showSuggestions && html`
            <div style=${{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '8px', marginTop: '4px', overflow: 'hidden' }}>
              ${suggestions.map(fav => html`
                <button
                  key=${fav.id}
                  onMouseDown=${e => { e.preventDefault(); applyFood(i, fav, fav.id ? `fav:${fav.id}` : 'manual'); }}
                  style=${{
                    display: 'flex', justifyContent: 'space-between', width: '100%', background: 'none',
                    border: 'none', borderBottom: '1px solid #222', padding: '8px 10px', cursor: 'pointer',
                    color: COLORS.text, fontSize: '12px', fontFamily: FONTS.sans, textAlign: 'left',
                  }}
                >
                  <span>★ ${fav.name}</span>
                  <span style=${{ color: COLORS.textMuted, fontFamily: FONTS.mono, fontSize: '11px', flexShrink: 0 }}>${fav.kcal100 ?? 0} kcal/100g</span>
                </button>
              `)}
              <button
                onMouseDown=${e => { e.preventDefault(); setOffSearchIdx(i); setSuggestIdx(null); }}
                style=${{
                  display: 'block', width: '100%', background: 'none', border: 'none',
                  padding: '8px 10px', cursor: 'pointer', color: COLORS.textMuted,
                  fontSize: '12px', fontFamily: FONTS.sans, textAlign: 'left',
                }}
              >🌐 In Open Food Facts suchen…</button>
            </div>
          `}

          ${offSearchIdx === i && html`
            <div style=${{ marginTop: '6px' }}>
              <${OFFSearchPanel}
                onSelect=${product => { applyFood(i, product, product.offCode ? `off:${product.offCode}` : 'off:search'); setOffSearchIdx(null); }}
                onClose=${() => setOffSearchIdx(null)}
              />
            </div>
          `}

          ${it.foodName.trim() !== '' && html`
            <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '3px', paddingLeft: '2px' }}>
              ${m
                ? html`<span style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>→ ${m.kcal} kcal · ${m.p}g P · ${m.c}g KH · ${m.f}g F</span>`
                : html`<span style=${{ fontSize: '11px', color: '#c8a830', fontFamily: FONTS.mono }}>⚠ zählt nicht mit: Gramm + kcal/100g angeben</span>`}
              <button
                onClick=${() => setDetailsIdx(detailsIdx === i ? null : i)}
                style=${{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '10px', fontFamily: FONTS.mono, padding: '2px 4px', flexShrink: 0 }}
              >${detailsIdx === i ? '− Details' : '✏ Details'}</button>
            </div>
          `}

          ${detailsIdx === i && html`
            <div style=${{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px', marginTop: '6px' }}>
              <label style=${{ ...S.label, fontSize: '10px' }}>Makros pro 100g (manuell)</label>
              <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                ${[['kcal100','kcal'],['p100','P g'],['c100','KH g'],['f100','F g']].map(([key, lbl]) => html`
                  <div key=${key}>
                    <label style=${{ ...S.label, fontSize: '9px' }}>${lbl}</label>
                    <input
                      type="number" min="0" step="0.1"
                      value=${it[key]}
                      onInput=${e => setItem(i, key, e.target.value)}
                      style=${{ ...inp, textAlign: 'center', padding: '6px 4px' }}
                      placeholder="0"
                    />
                  </div>
                `)}
              </div>
              ${it.sourceRef && html`
                <div style=${{ fontSize: '10px', color: COLORS.textSubtle, fontFamily: FONTS.mono, marginTop: '6px' }}>
                  Quelle: ${it.sourceRef}
                </div>
              `}
            </div>
          `}
        </div>
      `;})}

      <button
        onClick=${addItem}
        style=${{
          background: '#1a1a1a', border: '1px dashed #333', borderRadius: '8px',
          color: COLORS.textMuted, width: '100%', padding: '8px', fontSize: '12px',
          cursor: 'pointer', marginBottom: '16px', fontFamily: FONTS.mono,
        }}
      >+ Lebensmittel hinzufügen</button>

      <div style=${{ display: 'flex', gap: '8px' }}>
        <button onClick=${onClose} style=${{ ...S.btn('#2a2a2a', COLORS.text), flex: 1 }}>
          Abbrechen
        </button>
        <button onClick=${handleSave} style=${{ ...S.btn(COLORS.gold, '#111'), flex: 1 }}>
          ${isEdit ? 'Änderungen speichern' : 'Mahlzeit speichern'}
        </button>
      </div>

    </${Modal}>
  `;
}
