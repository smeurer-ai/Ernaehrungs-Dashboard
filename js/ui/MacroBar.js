import { html } from '../lib.js';
import { FONTS, COLORS } from './theme.js';

export function MacroBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return html`
    <div style=${{ marginBottom: '9px' }}>
      <div style=${{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style=${{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#bbb', fontFamily: FONTS.mono }}>${label}</span>
        <span style=${{ fontSize: '13px', fontWeight: 600, color: COLORS.text, fontFamily: FONTS.mono }}>
          ${value}g <span style=${{ color: '#999', fontSize: '11px' }}>/ ${max}g</span>
        </span>
      </div>
      <div style=${{ height: '4px', background: COLORS.border, borderRadius: '2px', overflow: 'hidden' }}>
        <div style=${{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  `;
}
