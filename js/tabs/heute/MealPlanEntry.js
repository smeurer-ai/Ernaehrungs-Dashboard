import { html } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';

export function MealPlanEntry({ meal }) {
  return html`
    <div style=${S.mealCard}>
      <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style=${{ fontSize: '18px' }}>${meal.icon}</span>
          <div>
            <div style=${{ fontSize: '13px', fontWeight: 600, color: COLORS.text }}>${meal.label}</div>
            <div style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>${meal.time}</div>
          </div>
        </div>
        <div style=${{ textAlign: 'right' }}>
          <div style=${{ fontSize: '14px', fontWeight: 700, color: COLORS.gold, fontFamily: FONTS.display }}>${meal.kcal}</div>
          <div style=${{ fontSize: '9px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>kcal</div>
        </div>
      </div>
      <div style=${{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
        ${[
          { label: 'P', value: meal.protein, color: '#7eb8f7' },
          { label: 'KH', value: meal.carbs, color: '#f7c47e' },
          { label: 'F', value: meal.fat, color: '#f77eb8' },
        ].map(macro => html`
          <div key=${macro.label} style=${S.chip(macro.color)}>
            ${macro.label} ${macro.value}g
          </div>
        `)}
      </div>
      ${meal.note && html`
        <div style=${{ fontSize: '10px', color: COLORS.textSubtle, fontFamily: FONTS.mono, borderTop: '1px solid #1e1e1e', paddingTop: '6px', marginTop: '4px' }}>
          ${meal.note}
        </div>
      `}
    </div>
  `;
}
