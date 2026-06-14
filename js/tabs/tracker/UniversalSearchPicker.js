import { html, useState, useMemo } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { filterTrackerSearch } from '../../calc/trackerSearch.js';

/**
 * Zentrales Suchfeld für den Tracker: durchsucht lokal Favoriten-Lebensmittel,
 * gespeicherte Mahlzeiten und Rezepte. OFD und Barcode sind dauerhaft erreichbar.
 *
 * @param {{
 *   favorites:     import('../../calc/trackerSearch.js').FavoriteFood[],
 *   meals:         import('../../calc/trackerSearch.js').SavedMeal[],
 *   recipes:       import('../../calc/trackerSearch.js').Recipe[],
 *   onSelectFood:  (fav: object) => void,
 *   onApplyMeal:   (meal: object) => void,
 *   onApplyRecipe: (recipe: object) => void,
 *   onOpenOFF:     (query: string) => void,
 *   onOpenBarcode: () => void,
 * }} props
 */
export function UniversalSearchPicker({
  favorites,
  meals,
  recipes,
  onSelectFood,
  onApplyMeal,
  onApplyRecipe,
  onOpenOFF,
  onOpenBarcode,
}) {
  const [query, setQuery] = useState('');

  const { mode, foods, meals: foundMeals, recipes: foundRecipes,
          foodsTotal, mealsTotal, recipesTotal } = useMemo(
    () => filterTrackerSearch({ query, favorites, meals, recipes }),
    [query, favorites, meals, recipes],
  );

  const isQuick   = mode === 'quick';
  const hasResults = foods.length > 0 || foundMeals.length > 0 || foundRecipes.length > 0;
  const noResults  = !isQuick && query.trim().length >= 2 && !hasResults;

  return html`
    <div style=${{ marginBottom: '4px' }}>

      <input
        type="search"
        value=${query}
        placeholder="Suchen…"
        onInput=${e => setQuery(e.target.value)}
        style=${{ ...S.input, width: '100%', boxSizing: 'border-box', marginBottom: '6px' }}
      />

      ${(hasResults || noResults) && html`
        <div style=${{
          maxHeight: '220px',
          overflowY: 'auto',
          borderRadius: '8px',
          border: hasResults ? `1px solid #2a2a2a` : 'none',
          marginBottom: '8px',
        }}>

          ${isQuick && (foundMeals.length > 0 || foods.length > 0) && html`
            <div style=${{
              fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '8px 10px 4px',
            }}>
              Schnellauswahl
            </div>
          `}

          ${foundMeals.length > 0 && html`
            <${ResultGroup}
              label=${isQuick ? 'Zuletzt genutzte Mahlzeiten' : 'Mahlzeiten'}
              extraCount=${mealsTotal - foundMeals.length}
            >
              ${foundMeals.map((meal, i) => html`
                <button
                  key=${meal.id}
                  onClick=${() => onApplyMeal(meal)}
                  style=${rowStyle(i)}
                >
                  <div style=${{ fontSize: '13px', color: COLORS.text, fontWeight: 600, fontFamily: FONTS.sans }}>
                    ★ ${meal.name}
                  </div>
                  <div style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono, marginTop: '2px' }}>
                    ${meal.items?.length ?? 0} ${meal.items?.length === 1 ? 'Lebensmittel' : 'Lebensmittel'}
                    ${meal.defaultSlot ? ` · ${meal.defaultSlot}` : ''}
                  </div>
                </button>
              `)}
            </${ResultGroup}>
          `}

          ${foods.length > 0 && html`
            <${ResultGroup}
              label=${isQuick ? 'Häufige Lebensmittel' : 'Lebensmittel'}
              extraCount=${foodsTotal - foods.length}
            >
              ${foods.map((fav, i) => html`
                <button
                  key=${fav.id}
                  onClick=${() => onSelectFood(fav)}
                  style=${rowStyle(i)}
                >
                  <div style=${{ fontSize: '13px', color: COLORS.text, fontWeight: 600, fontFamily: FONTS.sans }}>
                    ${fav.name}
                  </div>
                  <div style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono, marginTop: '2px' }}>
                    ${fav.kcal100} kcal · ${fav.p100}g P · ${fav.c100}g KH · ${fav.f100}g F / 100g
                  </div>
                </button>
              `)}
            </${ResultGroup}>
          `}

          ${foundRecipes.length > 0 && html`
            <${ResultGroup}
              label="Rezepte"
              extraCount=${recipesTotal - foundRecipes.length}
            >
              ${foundRecipes.map((r, i) => html`
                <button
                  key=${r.id}
                  onClick=${() => onApplyRecipe(r)}
                  style=${rowStyle(i)}
                >
                  <div style=${{ fontSize: '13px', color: COLORS.text, fontWeight: 600, fontFamily: FONTS.sans }}>
                    ${r.icon ?? '🍽️'} ${r.name}
                  </div>
                  <div style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono, marginTop: '2px' }}>
                    ${r.kcal} kcal · ${r.protein}g P
                    ${r.mealSlot ? ` · ${r.mealSlot}` : ''}
                  </div>
                </button>
              `)}
            </${ResultGroup}>
          `}

          ${noResults && html`
            <div style=${{ fontSize: '12px', color: COLORS.textMuted, fontFamily: FONTS.mono, padding: '10px' }}>
              Keine lokalen Treffer.
            </div>
          `}

        </div>
      `}

      <div style=${{ display: 'flex', gap: '6px' }}>
        <button
          onClick=${() => onOpenOFF(query)}
          style=${{
            ...S.btn('#1a1a1a', COLORS.textMuted),
            flex: 1, fontSize: '11px', border: `1px solid #2a2a2a`,
          }}
        >🔍 In Open Food Facts suchen</button>
        <button
          onClick=${onOpenBarcode}
          style=${{
            ...S.btn('#1a1a1a', COLORS.textMuted),
            fontSize: '11px', border: `1px solid #2a2a2a`,
            padding: '0 14px', flexShrink: 0,
          }}
        >🔢 Barcode</button>
      </div>

    </div>
  `;
}

function ResultGroup({ label, extraCount, children }) {
  return html`
    <div>
      <div style=${{
        fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '6px 10px 2px',
      }}>
        ${label}
      </div>
      ${children}
      ${extraCount > 0 && html`
        <div style=${{
          fontSize: '11px', color: COLORS.textSubtle, fontFamily: FONTS.mono,
          padding: '5px 10px 6px', borderTop: '1px solid #1e1e1e', textAlign: 'center',
        }}>
          ${extraCount} weitere Treffer — Suche eingrenzen
        </div>
      `}
    </div>
  `;
}

function rowStyle(i) {
  return {
    display: 'block', width: '100%',
    background: 'transparent', border: 'none',
    borderTop: i > 0 ? '1px solid #1e1e1e' : 'none',
    padding: '9px 10px', cursor: 'pointer', textAlign: 'left',
  };
}
