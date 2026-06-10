import { html, useState, useEffect } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { Modal } from '../../ui/Modal.js';

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `f-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const inp = { ...S.input, fontSize: '13px', padding: '8px 10px' };

/**
 * Editor für ein eigenes Lebensmittel (Favorit):
 * Name, Marke, Barcode, Makros/100g, Notvorrat-Markierung.
 *
 * @param {{
 *   open: boolean,
 *   onClose: function,
 *   onSave: function,    // (favoriteFood) => void
 *   food?: object,       // wenn gesetzt: Bearbeiten-Modus
 * }} props
 */
export function FoodEditorModal({ open, onClose, onSave, food }) {
  const isEdit = !!food?.id;

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [kcal100, setKcal100] = useState('');
  const [p100, setP100] = useState('');
  const [c100, setC100] = useState('');
  const [f100, setF100] = useState('');
  const [isNotvorrat, setIsNotvorrat] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!open) return;
    setName(food?.name ?? '');
    setBrand(food?.brand ?? '');
    setBarcode(food?.barcode ?? '');
    setKcal100(food?.kcal100 != null ? String(food.kcal100) : '');
    setP100(food?.p100 != null ? String(food.p100) : '');
    setC100(food?.c100 != null ? String(food.c100) : '');
    setF100(food?.f100 != null ? String(food.f100) : '');
    setIsNotvorrat(!!food?.isNotvorrat);
    setErrors([]);
  }, [open, food]);

  function handleSave() {
    const errs = [];
    if (!name.trim()) errs.push('Name ist Pflicht.');
    if (kcal100 === '' || isNaN(Number(kcal100)) || Number(kcal100) < 0)
      errs.push('kcal/100g muss eine Zahl ≥ 0 sein.');
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    onSave({
      ...food,
      id:      food?.id ?? generateId(),
      name:    name.trim(),
      brand:   brand.trim() || undefined,
      barcode: barcode.replace(/\D/g, '') || undefined,
      kcal100: Number(kcal100) || 0,
      p100:    Number(p100)    || 0,
      c100:    Number(c100)    || 0,
      f100:    Number(f100)    || 0,
      isNotvorrat,
      source:  food?.source ?? 'manual',
    });
    onClose();
  }

  if (!open) return null;

  return html`
    <${Modal} open=${open} onClose=${onClose} title=${isEdit ? 'Lebensmittel bearbeiten' : 'Eigenes Lebensmittel'}>

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
        placeholder="z.B. Hofladen-Quark"
      />

      <div style=${{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        <div>
          <label style=${S.label}>Marke</label>
          <input
            style=${inp}
            value=${brand}
            onInput=${e => setBrand(e.target.value)}
            placeholder="optional"
          />
        </div>
        <div>
          <label style=${S.label}>Barcode (EAN)</label>
          <input
            style=${inp}
            type="text"
            inputmode="numeric"
            value=${barcode}
            onInput=${e => setBarcode(e.target.value)}
            placeholder="optional"
          />
        </div>
      </div>

      <label style=${{ ...S.label, marginBottom: '6px' }}>Makros pro 100g</label>
      <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
        ${[
          ['kcal *', kcal100, setKcal100],
          ['P g',    p100,    setP100],
          ['KH g',   c100,    setC100],
          ['F g',    f100,    setF100],
        ].map(([lbl, val, set]) => html`
          <div key=${lbl}>
            <label style=${{ ...S.label, fontSize: '9px' }}>${lbl}</label>
            <input
              type="number" min="0" step="0.1"
              value=${val}
              onInput=${e => set(e.target.value)}
              style=${{ ...inp, textAlign: 'center', padding: '6px 4px' }}
              placeholder="0"
            />
          </div>
        `)}
      </div>

      <label style=${{
        display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px',
        cursor: 'pointer', fontSize: '12px', color: COLORS.textMuted, fontFamily: FONTS.mono,
      }}>
        <input
          type="checkbox"
          checked=${isNotvorrat}
          onChange=${e => setIsNotvorrat(e.target.checked)}
          style=${{ accentColor: COLORS.gold, width: '18px', height: '18px' }}
        />
        ⭐ Notvorrat — bei Tagesziel-Lücken bevorzugt vorschlagen (Phase 5)
      </label>

      ${barcode.trim() !== '' && html`
        <div style=${{ fontSize: '10px', color: COLORS.textSubtle, fontFamily: FONTS.mono, marginBottom: '12px', lineHeight: 1.5 }}>
          ℹ Der Barcode-Scan im Tracker findet dieses Lebensmittel künftig direkt — auch wenn Open Food Facts es nicht kennt.
        </div>
      `}

      <div style=${{ display: 'flex', gap: '8px' }}>
        <button onClick=${onClose} style=${{ ...S.btn('#2a2a2a', COLORS.text), flex: 1 }}>
          Abbrechen
        </button>
        <button onClick=${handleSave} style=${{ ...S.btn(COLORS.gold, '#111'), flex: 1 }}>
          ${isEdit ? 'Änderungen speichern' : 'Speichern'}
        </button>
      </div>

    </${Modal}>
  `;
}
