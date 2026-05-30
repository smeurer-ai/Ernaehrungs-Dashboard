import { html, useState } from '../../lib.js';
import { S, COLORS } from '../../ui/theme.js';
import { POSTMENOPAUSAL_TIPS } from '../../data/tips.js';

export function PostmenopausalInfo() {
  const [open, setOpen] = useState(null);
  return html`
    <div>
      <div style=${S.cardTitle}>Wissenschaftliche Grundlage</div>
      ${POSTMENOPAUSAL_TIPS.map((tip, i) => html`
        <div key=${i} style=${{ ...S.card, marginBottom: '8px', cursor: 'pointer' }}
          onClick=${() => setOpen(open === i ? null : i)}>
          <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style=${{ fontSize: '12px', fontWeight: 600, color: COLORS.text }}>${tip.title}</span>
            <span style=${{ color: COLORS.gold, fontSize: '16px' }}>${open === i ? '−' : '+'}</span>
          </div>
          ${open === i && html`
            <p style=${{ fontSize: '12px', color: COLORS.textMuted, marginTop: '10px', lineHeight: 1.6 }}>${tip.text}</p>
          `}
        </div>
      `)}
    </div>
  `;
}
