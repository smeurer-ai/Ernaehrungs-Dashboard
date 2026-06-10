import { html, useState, useEffect } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { Modal } from '../../ui/Modal.js';
import { filterFavorites } from '../../calc/favorites.js';

/**
 * Verwaltung der eigenen Lebensmittel (foodsCustom):
 * suchen, Notvorrat markieren, bearbeiten, löschen, neu anlegen.
 *
 * @param {{
 *   open: boolean,
 *   onClose: function,
 *   favorites: array,
 *   loading: boolean,
 *   onEdit: function,        // (food) => void — öffnet Editor
 *   onNew: function,         // () => void — öffnet leeren Editor
 *   onDelete: function,      // (id) => void
 *   onToggleNotvorrat: function, // (food) => void
 * }} props
 */
export function FavoriteFoodsModal({ open, onClose, favorites, loading, onEdit, onNew, onDelete, onToggleNotvorrat }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  // Verwaltung zeigt alle Treffer (hohes Limit), nicht nur die Picker-8
  const { items, hasMore, total } = filterFavorites(favorites, query, 100);

  function handleDelete(food) {
    if (window.confirm(`Lebensmittel „${food.name}" wirklich löschen?`)) {
      onDelete(food.id);
    }
  }

  if (!open) return null;

  return html`
    <${Modal} open=${open} onClose=${onClose} title="Meine Lebensmittel">

      <input
        type="search"
        value=${query}
        placeholder="Lebensmittel suchen…"
        onInput=${e => setQuery(e.target.value)}
        style=${{ ...S.input, width: '100%', marginBottom: '10px', boxSizing: 'border-box' }}
      />

      ${loading && html`
        <div style=${{ color: COLORS.textMuted, fontSize: '12px', textAlign: 'center', padding: '16px' }}>Lade…</div>
      `}

      ${!loading && favorites.length === 0 && html`
        <div style=${{ color: COLORS.textMuted, fontSize: '12px', fontFamily: FONTS.mono, textAlign: 'center', padding: '16px 0', lineHeight: 1.6 }}>
          Noch keine eigenen Lebensmittel.<br />
          Lege welche an — besonders nützlich für Produkte,<br />die Open Food Facts nicht kennt.
        </div>
      `}

      ${!loading && favorites.length > 0 && items.length === 0 && html`
        <div style=${{ color: COLORS.textMuted, fontSize: '12px', fontFamily: FONTS.mono, textAlign: 'center', padding: '12px 0' }}>
          Kein Treffer für „${query}".
        </div>
      `}

      ${items.map(food => html`
        <div key=${food.id} style=${{
          background: '#141414', border: '1px solid #2a2a2a', borderRadius: '10px',
          padding: '8px 10px', marginBottom: '6px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <button
            onClick=${() => onToggleNotvorrat(food)}
            title=${food.isNotvorrat ? 'Notvorrat — antippen zum Entfernen' : 'Als Notvorrat markieren'}
            style=${{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px',
              padding: '2px', flexShrink: 0,
              filter: food.isNotvorrat ? 'none' : 'grayscale(1) opacity(0.35)',
            }}
          >⭐</button>
          <div style=${{ flex: 1, minWidth: 0 }}>
            <div style=${{ fontSize: '13px', color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ${food.name}
            </div>
            <div style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>
              ${food.kcal100 ?? 0} kcal · ${food.p100 ?? 0}g P /100g${food.brand ? ` · ${food.brand}` : ''}${food.barcode ? ' · 🔢' : ''}
            </div>
          </div>
          <button
            onClick=${() => onEdit(food)}
            title="Bearbeiten"
            style=${{ background: 'none', border: '1px solid #333', borderRadius: '6px', color: COLORS.textMuted, cursor: 'pointer', fontSize: '12px', padding: '4px 9px', flexShrink: 0 }}
          >✏</button>
          <button
            onClick=${() => handleDelete(food)}
            title="Löschen"
            style=${{ background: 'none', border: '1px solid #333', borderRadius: '6px', color: COLORS.textMuted, cursor: 'pointer', fontSize: '12px', padding: '4px 9px', flexShrink: 0 }}
          >×</button>
        </div>
      `)}

      ${hasMore && html`
        <div style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono, textAlign: 'center', padding: '6px 0' }}>
          ${total - items.length} weitere — Suche eingrenzen
        </div>
      `}

      <button
        onClick=${onNew}
        style=${{
          background: '#1a1a1a', border: '1px dashed #333', borderRadius: '8px',
          color: COLORS.textMuted, width: '100%', padding: '10px', fontSize: '12px',
          cursor: 'pointer', marginTop: '6px', fontFamily: FONTS.mono,
        }}
      >+ Neues Lebensmittel anlegen</button>

    </${Modal}>
  `;
}
