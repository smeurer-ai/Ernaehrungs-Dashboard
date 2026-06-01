import { html } from '../../lib.js';
import { COLORS, FONTS } from '../../ui/theme.js';

/**
 * Chip-Liste gespeicherter Favoriten.
 * Klick auf Chip → onSelect(favorite) aufrufen.
 *
 * @param {{ favorites: FavoriteFood[], onSelect: function }} props
 */
export function FavoritePicker({ favorites, onSelect }) {
  if (favorites.length === 0) {
    return html`
      <div style=${{
        fontSize: '11px',
        color: COLORS.textMuted,
        fontFamily: FONTS.mono,
        padding: '6px 0',
      }}>
        Noch keine Favoriten gespeichert
      </div>
    `;
  }

  return html`
    <div style=${{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
      ${favorites.map(fav => html`
        <button
          key=${fav.id}
          onClick=${() => onSelect(fav)}
          style=${{
            background: '#1e1e1e',
            border: '1px solid #333',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '12px',
            color: COLORS.text,
            cursor: 'pointer',
            fontFamily: FONTS.mono,
            whiteSpace: 'nowrap',
          }}
        >
          ${fav.name}
        </button>
      `)}
    </div>
  `;
}
