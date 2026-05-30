import { html } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function WeekGrid() {
  const today = new Date().getDay();
  return html`
    <div>
      ${DAYS.map((day, i) => {
        const isToday = ((i + 1) % 7) === (today % 7);
        return html`
          <div key=${day} style=${{
            ...S.card, opacity: 0.7,
            borderLeft: isToday ? `3px solid ${COLORS.gold}` : '3px solid transparent',
          }}>
            <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style=${{ fontSize: '12px', fontWeight: 600, color: isToday ? COLORS.gold : COLORS.text, fontFamily: FONTS.mono }}>${day}</span>
              <span style=${{ fontSize: '10px', color: COLORS.textMuted }}>—</span>
            </div>
          </div>
        `;
      })}
    </div>
  `;
}
