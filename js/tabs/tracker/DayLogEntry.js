import { html } from '../../lib.js';
import { COLORS, FONTS } from '../../ui/theme.js';

/**
 * Einzelner TrackedFood-Eintrag mit Bearbeiten/Löschen-Buttons.
 *
 * @param {{ entry: TrackedFood, onDelete: function, onEdit: function }} props
 */
export function DayLogEntry({ entry, onDelete, onEdit }) {
  return html`
    <div style=${{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 10px',
      borderRadius: '8px',
      background: '#141414',
      marginBottom: '4px',
      gap: '8px',
    }}>
      <div style=${{ flex: 1, minWidth: 0 }}>
        <div style=${{
          fontSize: '13px',
          color: COLORS.text,
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          ${entry.foodName}
          <span style=${{ fontSize: '12px', color: COLORS.textMuted, fontWeight: 400, marginLeft: '6px' }}>
            ${entry.gramm}g
          </span>
        </div>
        <div style=${{
          fontSize: '12px',
          color: COLORS.textMuted,
          fontFamily: FONTS.mono,
          marginTop: '2px',
        }}>
          ${entry.kcal} kcal · ${entry.p}P · ${entry.c}KH · ${entry.f}F
        </div>
      </div>
      <div style=${{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button
          onClick=${() => onEdit(entry)}
          style=${{
            background: 'transparent',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '13px',
            color: COLORS.textMuted,
            cursor: 'pointer',
            fontFamily: FONTS.mono,
          }}
          aria-label="Eintrag bearbeiten"
        >✏️</button>
        <button
          onClick=${() => onDelete(entry.id)}
          style=${{
            background: 'transparent',
            border: '1px solid #3a1515',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '13px',
            color: '#e05c5c',
            cursor: 'pointer',
            fontFamily: FONTS.mono,
          }}
          aria-label="Eintrag löschen"
        >🗑</button>
      </div>
    </div>
  `;
}
