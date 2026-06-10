import { html } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';

/**
 * Vorschlags-Karte für die verbleibende Tageslücke (Phase 5d).
 * Erscheint im Heute-Tab ab 17 Uhr, wenn noch ≥ 10g Protein offen sind.
 *
 * @param {{
 *   gap: {kcal:number, p:number},
 *   suggestions: Array<{kind:string, item:object, reason:string, p:number, kcal:number}>,
 * }} props
 */
export function GapSuggestions({ gap, suggestions }) {
  if (!suggestions || suggestions.length === 0) return null;

  return html`
    <div style=${{
      background: '#161616', border: `1px solid ${COLORS.gold}33`, borderRadius: '12px',
      padding: '14px', marginBottom: '14px',
    }}>
      <div style=${{ ...S.cardTitle, marginBottom: '4px' }}>Vorschläge für Deine Lücke</div>
      <div style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono, marginBottom: '10px' }}>
        Noch offen: P ${gap.p}g · ${gap.kcal} kcal
      </div>

      ${suggestions.map(s => html`
        <div key=${`${s.kind}-${s.item.id}`} style=${{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px',
          padding: '6px 0', borderBottom: '1px solid #222',
        }}>
          <div style=${{ flex: 1, minWidth: 0 }}>
            <div style=${{ fontSize: '13px', color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ${s.item.name}
            </div>
            <div style=${{ fontSize: '10px', color: COLORS.gold, fontFamily: FONTS.mono }}>${s.reason}</div>
          </div>
          <div style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono, flexShrink: 0, textAlign: 'right' }}>
            ${s.kind === 'meal'
              ? html`${s.p}g P · ${s.kcal} kcal<br /><span style=${{ fontSize: '9px' }}>Mahlzeit</span>`
              : html`${s.p}g P · ${s.kcal} kcal<br /><span style=${{ fontSize: '9px' }}>pro 100g</span>`}
          </div>
        </div>
      `)}

      <div style=${{ fontSize: '10px', color: COLORS.textSubtle, fontFamily: FONTS.mono, marginTop: '8px' }}>
        Eintragen wie gewohnt über den Tracker.
      </div>
    </div>
  `;
}
