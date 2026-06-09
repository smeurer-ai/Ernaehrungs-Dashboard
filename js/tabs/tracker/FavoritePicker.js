import { html, useState } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { filterFavorites } from '../../calc/favorites.js';

/**
 * Kompakter Favoriten-Picker mit Suchfeld.
 * Zeigt max. 8 Treffer; ohne Suche die zuletzt aktualisierten Favoriten.
 *
 * @param {{ favorites: FavoriteFood[], onSelect: function }} props
 */
export function FavoritePicker({ favorites, onSelect }) {
  const [query, setQuery] = useState('');

  if (favorites.length === 0) {
    return html`
      <div style=${{
        fontSize: '13px',
        color: COLORS.textMuted,
        fontFamily: FONTS.mono,
        padding: '6px 0',
      }}>
        Noch keine Favoriten gespeichert
      </div>
    `;
  }

  const { items, hasMore, total } = filterFavorites(favorites, query);

  return html`
    <div style=${{ marginBottom: '4px' }}>
      <input
        type="search"
        value=${query}
        placeholder="Favorit suchen…"
        onInput=${e => setQuery(e.target.value)}
        style=${{
          ...S.input,
          width: '100%',
          marginBottom: '6px',
          boxSizing: 'border-box',
        }}
      />
      <div style=${{
        maxHeight: '220px',
        overflowY: 'auto',
        borderRadius: '8px',
        border: items.length > 0 ? '1px solid #2a2a2a' : 'none',
      }}>
        ${items.length === 0 && query.trim() && html`
          <div style=${{ fontSize: '13px', color: COLORS.textMuted, fontFamily: FONTS.mono, padding: '8px 10px' }}>
            Kein Favorit gefunden.
          </div>
        `}
        ${items.map((fav, i) => html`
          <button
            key=${fav.id}
            onClick=${() => onSelect(fav)}
            style=${{
              display: 'block',
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderTop: i > 0 ? '1px solid #1e1e1e' : 'none',
              padding: '10px 10px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style=${{ fontSize: '14px', color: COLORS.text, fontWeight: 600, fontFamily: FONTS.sans }}>
              ${fav.name}
            </div>
            <div style=${{ fontSize: '12px', color: COLORS.textMuted, fontFamily: FONTS.mono, marginTop: '2px' }}>
              ${fav.kcal100} kcal · ${fav.p100}g P · ${fav.c100}g KH · ${fav.f100}g F / 100g
            </div>
          </button>
        `)}
        ${hasMore && html`
          <div style=${{
            fontSize: '12px',
            color: COLORS.textSubtle,
            fontFamily: FONTS.mono,
            padding: '6px 10px',
            borderTop: '1px solid #1e1e1e',
            textAlign: 'center',
          }}>
            ${total - items.length} weitere — Suche eingrenzen
          </div>
        `}
      </div>
    </div>
  `;
}
