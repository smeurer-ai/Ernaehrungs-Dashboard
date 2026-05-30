import { html } from '../../lib.js';
import { KcalRing } from '../../ui/KcalRing.js';
import { MacroBar } from '../../ui/MacroBar.js';
import { S, COLORS } from '../../ui/theme.js';

export function DaySummary({ macros, consumed = { kcal: 0, protein: 0, carbs: 0, fat: 0 } }) {
  return html`
    <div style=${S.card}>
      <div style=${S.cardTitle}>Tagesbilanz</div>
      <div style=${{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <${KcalRing} consumed=${consumed.kcal} target=${macros.kcal} />
        <div style=${{ flex: 1 }}>
          <div style=${{ fontSize: '22px', fontWeight: 700, color: COLORS.text }}>
            ${macros.kcal} <span style=${{ fontSize: '13px', color: COLORS.textMuted }}>kcal Ziel</span>
          </div>
          <div style=${{ fontSize: '11px', color: COLORS.textSubtle, marginTop: '2px' }}>
            ${consumed.kcal > 0 ? `${consumed.kcal} kcal gegessen` : 'Heute noch nichts eingetragen'}
          </div>
        </div>
      </div>
      <${MacroBar} label="Protein" value=${consumed.protein} max=${macros.protein} color="#7eb8f7" />
      <${MacroBar} label="Kohlenhydrate" value=${consumed.carbs} max=${macros.carbs} color="#f7c47e" />
      <${MacroBar} label="Fett" value=${consumed.fat} max=${macros.fat} color="#f77eb8" />
    </div>
  `;
}
