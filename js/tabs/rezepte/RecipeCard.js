import { html } from '../../lib.js';
import { COLORS, FONTS, S } from '../../ui/theme.js';

export function RecipeCard({ recipe, isExpanded, onToggle, isCustom = false, onEdit, onDelete }) {
  return html`
    <div style=${{ ...S.card, cursor: 'pointer' }} onClick=${onToggle}>

      <!-- Collapsed header: immer sichtbar -->
      <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style=${{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style=${{ fontSize: '22px' }}>${recipe.icon ?? '🍽️'}</span>
          <div>
            <div style=${{ fontSize: '13px', fontWeight: 600, color: COLORS.text }}>${recipe.name}</div>
            <div style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>
              ${recipe.mealSlot}${recipe.prepTime ? ` · ${recipe.prepTime}` : ''}
            </div>
          </div>
        </div>
        <div style=${{ textAlign: 'right' }}>
          <div style=${{ fontSize: '13px', fontWeight: 700, color: COLORS.gold }}>${recipe.protein}g P</div>
          <div style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>${recipe.kcal} kcal</div>
        </div>
      </div>

      <!-- Expanded detail -->
      ${isExpanded && html`
        <div style=${{ marginTop: '12px', borderTop: `1px solid ${COLORS.borderLight}`, paddingTop: '12px' }}>

          ${recipe.ingredients?.length > 0 && html`
            <div style=${{ marginBottom: '12px' }}>
              <div style=${{ fontSize: '10px', fontWeight: 700, color: COLORS.textMuted, fontFamily: FONTS.mono, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                ZUTATEN${recipe.servings > 1 ? ` (${recipe.servings} Portionen)` : ''}
              </div>
              ${recipe.ingredients.map((ing, i) => html`
                <div key=${i} style=${{ fontSize: '12px', color: COLORS.text, padding: '2px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style=${{ color: ing.isMain ? COLORS.gold : COLORS.textSubtle, fontSize: '8px', flexShrink: 0 }}>●</span>
                  <span>${ing.amount} ${ing.unit}${' '}
                    <span style=${{ fontWeight: ing.isMain ? 600 : 400 }}>${ing.name}</span>
                  </span>
                </div>
              `)}
            </div>
          `}

          ${recipe.steps?.length > 0 && html`
            <div style=${{ marginBottom: '12px' }}>
              <div style=${{ fontSize: '10px', fontWeight: 700, color: COLORS.textMuted, fontFamily: FONTS.mono, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                ZUBEREITUNG
              </div>
              ${recipe.steps.map((step, i) => html`
                <div key=${i} style=${{ fontSize: '12px', color: COLORS.text, padding: '3px 0', display: 'flex', gap: '8px' }}>
                  <span style=${{ color: COLORS.gold, fontFamily: FONTS.mono, minWidth: '16px', flexShrink: 0 }}>${i + 1}.</span>
                  <span style=${{ lineHeight: 1.6 }}>${step}</span>
                </div>
              `)}
            </div>
          `}

          ${recipe.tip && html`
            <div style=${{ background: COLORS.surfaceDeep, borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
              <div style=${{ fontSize: '11px', color: COLORS.textMuted, lineHeight: 1.6 }}>
                <span style=${{ color: COLORS.gold, fontWeight: 600 }}>Tipp: </span>${recipe.tip}
              </div>
            </div>
          `}

          <!-- Makro-Leiste -->
          <div style=${{ display: 'flex', gap: '12px', fontFamily: FONTS.mono, fontSize: '11px' }}>
            <span style=${{ color: COLORS.gold, fontWeight: 700 }}>${recipe.kcal} kcal</span>
            <span style=${{ color: '#a8d8a8' }}>${recipe.protein}g P</span>
            <span style=${{ color: '#a8c8e8' }}>${recipe.carbs}g KH</span>
            <span style=${{ color: '#e8c8a8' }}>${recipe.fat}g F</span>
          </div>

          ${isCustom && html`
            <div
              style=${{ display: 'flex', gap: '8px', marginTop: '12px' }}
              onClick=${e => e.stopPropagation()}
            >
              <button
                onClick=${() => onEdit(recipe)}
                style=${{ flex: 1, background: '#2a2a2a', border: '1px solid #333', borderRadius: '8px', color: COLORS.text, padding: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: FONTS.mono }}
              >Bearbeiten</button>
              <button
                onClick=${() => onDelete(recipe.id)}
                style=${{ flex: 1, background: '#2a1515', border: `1px solid #5c2020`, borderRadius: '8px', color: COLORS.error, padding: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: FONTS.mono }}
              >Löschen</button>
            </div>
          `}

        </div>
      `}

    </div>
  `;
}
