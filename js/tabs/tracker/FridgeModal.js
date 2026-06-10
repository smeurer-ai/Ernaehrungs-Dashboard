import { html, useState, useEffect } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { Modal } from '../../ui/Modal.js';
import { filterFavorites } from '../../calc/favorites.js';

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `fr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Kühlschrank-Verwaltung (Phase 5b): was ist gerade da?
 * Eingabe per Favoriten-Vorschlag oder Freitext, optionale Mengenangabe.
 *
 * @param {{
 *   open: boolean,
 *   onClose: function,
 *   fridgeItems: array,
 *   loading: boolean,
 *   favorites: array,
 *   onAdd: function,      // (fridgeItem) => void
 *   onRemove: function,   // (id) => void
 *   onEmpty: function,    // () => void
 * }} props
 */
export function FridgeModal({ open, onClose, fridgeItems, loading, favorites, onAdd, onRemove, onEmpty }) {
  const [name, setName] = useState('');
  const [gramm, setGramm] = useState('');
  const [sourceRef, setSourceRef] = useState('manual');
  const [showSuggest, setShowSuggest] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setGramm('');
    setSourceRef('manual');
    setShowSuggest(false);
  }, [open]);

  const suggestions = showSuggest && name.trim().length >= 2
    ? filterFavorites(favorites, name, 5).items
    : [];

  function handleAdd() {
    if (!name.trim()) return;
    onAdd({
      id: generateId(),
      foodRef: sourceRef,
      foodName: name.trim(),
      gramm: parseFloat(gramm) > 0 ? parseFloat(gramm) : null,
    });
    setName('');
    setGramm('');
    setSourceRef('manual');
  }

  function handleEmpty() {
    if (window.confirm('Kühlschrank wirklich leeren?')) onEmpty();
  }

  if (!open) return null;

  return html`
    <${Modal} open=${open} onClose=${onClose} title="Kühlschrank">

      <div style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono, marginBottom: '10px', lineHeight: 1.5 }}>
        Was ist gerade da? Rezepte-Tab und Vorschläge nutzen diese Liste.
      </div>

      <div style=${{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
        <input
          style=${{ ...S.input, flex: 3, minWidth: 0, fontSize: '13px', padding: '8px 10px' }}
          value=${name}
          onInput=${e => { setName(e.target.value); setSourceRef('manual'); setShowSuggest(true); }}
          onFocus=${() => setShowSuggest(true)}
          onBlur=${() => setTimeout(() => setShowSuggest(false), 150)}
          onKeyDown=${e => e.key === 'Enter' && handleAdd()}
          placeholder="z.B. Brokkoli, Skyr…"
        />
        <input
          style=${{ ...S.input, flex: 1, minWidth: 0, fontSize: '13px', padding: '8px 10px', textAlign: 'right' }}
          type="number"
          min="0"
          value=${gramm}
          onInput=${e => setGramm(e.target.value)}
          placeholder="g (opt.)"
        />
        <button
          onClick=${handleAdd}
          disabled=${!name.trim()}
          style=${{ ...S.btn(name.trim() ? COLORS.gold : '#333', name.trim() ? '#111' : '#666'), padding: '0 14px', flexShrink: 0 }}
        >+</button>
      </div>

      ${suggestions.length > 0 && html`
        <div style=${{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: '8px', marginBottom: '8px', overflow: 'hidden' }}>
          ${suggestions.map(fav => html`
            <button
              key=${fav.id}
              onMouseDown=${e => { e.preventDefault(); setName(fav.name); setSourceRef(`fav:${fav.id}`); setShowSuggest(false); }}
              style=${{
                display: 'block', width: '100%', background: 'none', border: 'none',
                borderBottom: '1px solid #222', padding: '8px 10px', cursor: 'pointer',
                color: COLORS.text, fontSize: '12px', fontFamily: FONTS.sans, textAlign: 'left',
              }}
            >★ ${fav.name}</button>
          `)}
        </div>
      `}

      <div style=${{ marginTop: '8px' }}>
        ${loading && html`
          <div style=${{ color: COLORS.textMuted, fontSize: '12px', textAlign: 'center', padding: '12px' }}>Lade…</div>
        `}

        ${!loading && fridgeItems.length === 0 && html`
          <div style=${{ color: COLORS.textMuted, fontSize: '12px', fontFamily: FONTS.mono, textAlign: 'center', padding: '12px 0' }}>
            Kühlschrank ist leer (in der App 😉).
          </div>
        `}

        ${fridgeItems.map(item => html`
          <div key=${item.id} style=${{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#141414', border: '1px solid #2a2a2a', borderRadius: '8px',
            padding: '7px 10px', marginBottom: '5px',
          }}>
            <span style=${{ flex: 1, fontSize: '13px', color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ${item.foodName}
            </span>
            ${item.gramm != null && html`
              <span style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono, flexShrink: 0 }}>${item.gramm} g</span>
            `}
            <button
              onClick=${() => onRemove(item.id)}
              title="Entfernen (aufgebraucht)"
              style=${{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '16px', padding: '0 2px', flexShrink: 0 }}
            >×</button>
          </div>
        `)}
      </div>

      ${fridgeItems.length > 0 && html`
        <button
          onClick=${handleEmpty}
          style=${{
            background: 'none', border: '1px solid #333', borderRadius: '8px',
            color: COLORS.textMuted, width: '100%', padding: '8px', fontSize: '11px',
            cursor: 'pointer', marginTop: '8px', fontFamily: FONTS.mono,
          }}
        >Kühlschrank leeren</button>
      `}

    </${Modal}>
  `;
}
