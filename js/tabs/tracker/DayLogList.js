import { html, useState } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { DayLogEntry } from './DayLogEntry.js';
import { groupProteinBySlot } from '../../calc/tracker.js';
import { isMainMealSlot, rateMealProtein } from '../../calc/nutritionLogic.js';

/**
 * Kleines MPS-Badge für den Slot-Header.
 * Zeigt Leucin-Wahrscheinlichkeit als farbiges Tag (~✓/~⚠/~✗ Leucin).
 * ℹ️-Button klappt einen Erklärungstext auf (Schätzungs-Hinweis).
 *
 * @param {{ slotProteinG: number, isMain: boolean }} props
 */
function LeucineBadge({ slotProteinG, isMain }) {
  const [showInfo, setShowInfo] = useState(false);
  const { rating } = rateMealProtein(slotProteinG, isMain, {});

  const COLOR = rating === 'good'       ? '#5cb85c'
              : rating === 'borderline' ? '#d97706'
              :                           '#e05c5c';
  const ICON  = rating === 'good' ? '✓' : rating === 'borderline' ? '⚠' : '✗';

  return html`
    <span style=${{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span style=${{
        fontSize: '9px', padding: '2px 7px', borderRadius: '12px',
        background: COLOR + '22', color: COLOR,
        fontFamily: "'DM Mono', monospace", fontWeight: 600,
      }}>
        ~${ICON} Leucin
      </span>
      <button
        onClick=${(e) => { e.stopPropagation(); setShowInfo(s => !s); }}
        style=${{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '12px', padding: 0, lineHeight: 1, color: '#aaa',
        }}
        aria-label="Info zur Leucin-Schätzung"
      >ℹ️</button>
      ${showInfo && html`
        <div
          onClick=${(e) => { e.stopPropagation(); setShowInfo(false); }}
          style=${{
            position: 'absolute', top: '100%', right: 0, zIndex: 20,
            marginTop: '4px', padding: '8px 10px',
            background: '#222', border: '1px solid #333', borderRadius: '8px',
            fontSize: '11px', color: '#aaa', lineHeight: 1.4,
            width: '260px', boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          Leucin-Gehalt wird aus der Proteinmenge geschätzt. Keine Lebensmitteldatenbank liefert aktuell Leucin-Werte.
        </div>
      `}
    </span>
  `;
}

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
  const slotTotals = groupProteinBySlot(entries);

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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
              paddingLeft: '2px',
            }}>
              <div style=${{
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: COLORS.gold,
                fontFamily: FONTS.mono,
                fontWeight: 600,
              }}>
                ${slot}
              </div>
              <${LeucineBadge}
                slotProteinG=${slotTotals[slot] ?? 0}
                isMain=${isMainMealSlot(slot)}
              />
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
