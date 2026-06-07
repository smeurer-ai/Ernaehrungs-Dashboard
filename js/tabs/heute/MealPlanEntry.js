import { html } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';

function macroLineColor(consumed, planned) {
  if (consumed === 0) return COLORS.textSubtle;
  const ratio = consumed / planned;
  if (ratio > 1.1)  return COLORS.gold;
  if (ratio >= 0.9) return '#5cb85c';
  return COLORS.textMuted;
}

export function MealPlanEntry({ meal, consumedMacros }) {
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
          { label: 'P',  value: meal.protein, color: '#7eb8f7' },
          { label: 'KH', value: meal.carbs,   color: '#f7c47e' },
          { label: 'F',  value: meal.fat,     color: '#f77eb8' },
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
      ${consumedMacros !== undefined && html`
        <div style=${{
          fontSize: '11px',
          fontFamily: FONTS.mono,
          marginTop: '6px',
          borderTop: '1px solid #1e1e1e',
          paddingTop: '6px',
        }}>
          ${consumedMacros.p === 0 && consumedMacros.c === 0 && consumedMacros.f === 0
            ? html`<span style=${{ color: COLORS.textSubtle }}>Noch nichts eingetragen</span>`
            : html`
              <span style=${{ color: macroLineColor(consumedMacros.p, meal.protein) }}>P ${Math.round(consumedMacros.p)}/${meal.protein}</span>
              <span style=${{ color: '#444', margin: '0 5px' }}>·</span>
              <span style=${{ color: macroLineColor(consumedMacros.c, meal.carbs) }}>KH ${Math.round(consumedMacros.c)}/${meal.carbs}</span>
              <span style=${{ color: '#444', margin: '0 5px' }}>·</span>
              <span style=${{ color: macroLineColor(consumedMacros.f, meal.fat) }}>F ${Math.round(consumedMacros.f)}/${meal.fat}</span>
              <span style=${{ color: '#666' }}> g</span>
            `
          }
        </div>
      `}
    </div>
  `;
}
