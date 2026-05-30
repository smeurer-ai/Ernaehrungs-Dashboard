import { html } from '../../lib.js';
import { S, COLORS } from '../../ui/theme.js';

export function TrackerTab() {
  return html`
    <div style=${{ ...S.content, textAlign: 'center', paddingTop: '60px' }}>
      <div style=${{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
      <div style=${{ fontSize: '16px', fontWeight: 600, color: COLORS.text, marginBottom: '8px' }}>Tracker</div>
      <div style=${{ fontSize: '12px', color: COLORS.textMuted }}>Kommt in Phase 3</div>
    </div>
  `;
}
