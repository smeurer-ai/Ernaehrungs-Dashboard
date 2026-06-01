import { html } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { DayLogEntry } from './DayLogEntry.js';

/**
 * Zeigt alle Tages-Einträge gruppiert nach Mahlzeit-Slot.
 *
 * @param {{
 *   entries: TrackedFood[],
 *   mealSlots: string[],
 *   onDelete: function,
 *   onEdit: function,
 *   onAdd: function
 * }} props
 */
export function DayLogList({ entries, mealSlots, onDelete, onEdit, onAdd }) {
  // Einträge nach mealSlot gruppieren
  const grouped = {};
  for (const slot of mealSlots) {
    grouped[slot] = [];
  }
  for (const entry of entries) {
    if (!grouped[entry.mealSlot]) grouped[entry.mealSlot] = [];
    grouped[entry.mealSlot].push(entry);
  }

  if (entries.length === 0) {
    return html`
      <div style=${{ ...S.card, textAlign: 'center', padding: '24px' }}>
        <div style=${{ fontSize: '28px', marginBottom: '8px' }}>🍽</div>
        <div style=${{ fontSize: '13px', color: COLORS.textMuted }}>
          Noch nichts eingetragen
        </div>
        <button
          onClick=${onAdd}
          style=${{ ...S.btn(), marginTop: '14px', width: '100%' }}
        >
          + Erste Mahlzeit eintragen
        </button>
      </div>
    `;
  }

  return html`
    <div>
      ${mealSlots.map(slot => {
        const slotEntries = grouped[slot] || [];
        if (slotEntries.length === 0) return null;

        return html`
          <div key=${slot} style=${{ marginBottom: '12px' }}>
            <div style=${{
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.gold,
              fontFamily: FONTS.mono,
              fontWeight: 600,
              marginBottom: '6px',
              paddingLeft: '2px',
            }}>
              ${slot}
            </div>
            ${slotEntries.map(entry => html`
              <${DayLogEntry}
                key=${entry.id}
                entry=${entry}
                onDelete=${onDelete}
                onEdit=${onEdit}
              />
            `)}
          </div>
        `;
      })}
    </div>
  `;
}
