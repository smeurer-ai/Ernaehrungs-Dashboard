import { html, useState } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { INITIAL_RECIPES } from '../../data/initialRecipes.js';
import { useRecipes } from '../../hooks/useRecipes.js';
import { useFavoriteFoods } from '../../hooks/useFavoriteFoods.js';
import { RecipeCard } from './RecipeCard.js';
import { RecipeEditor } from './RecipeEditor.js';
import { RecipeToTrackerModal } from './RecipeToTrackerModal.js';
import { getLogForDate, saveLogEntry } from '../../storage/indexeddb.js';
import { localDateString } from '../../calc/dates.js';
import { recipeMatchesFridge } from '../../calc/matching.js';
import { useFridge } from '../../hooks/useFridge.js';

export function RezepteTab() {
  const { recipes, loading, saveRecipe, removeRecipe } = useRecipes();
  const { favorites } = useFavoriteFoods();
  const [expandedId, setExpandedId]   = useState(null);
  const [editorOpen, setEditorOpen]   = useState(false);
  const [editRecipe, setEditRecipe]   = useState(null);
  const [trackerRecipe, setTrackerRecipe] = useState(null);
  const [query, setQuery]             = useState('');
  const [fridgeOnly, setFridgeOnly]   = useState(false);
  const { fridgeItems } = useFridge();

  const q = query.trim().toLowerCase();
  const byQuery = r => !q || r.name.toLowerCase().includes(q);
  const byFridge = r => !fridgeOnly || recipeMatchesFridge(r, fridgeItems).matches;
  const filteredInitial = INITIAL_RECIPES.filter(r => byQuery(r) && byFridge(r));
  const filteredCustom  = recipes.filter(r => byQuery(r) && byFridge(r));
  const noResults = (q || fridgeOnly) && filteredInitial.length === 0 && filteredCustom.length === 0;

  function handleToggle(id) {
    setExpandedId(prev => prev === id ? null : id);
  }

  function handleNew() {
    setEditRecipe(null);
    setEditorOpen(true);
  }

  function handleEdit(recipe) {
    setEditRecipe(recipe);
    setEditorOpen(true);
  }

  function handleDelete(id) {
    if (confirm('Rezept wirklich löschen?')) {
      removeRecipe(id);
      if (expandedId === id) setExpandedId(null);
    }
  }

  async function handleAddToTracker(trackerEntry) {
    const today = localDateString();
    const existing = await getLogForDate(today);
    const entries = [...(existing?.entries ?? []), trackerEntry];
    await saveLogEntry({ ...existing, date: today, entries });
  }

  return html`
    <div style=${S.content}>

      <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style=${{ ...S.cardTitle, marginBottom: 0 }}>Rezepte</div>
        <button
          onClick=${handleNew}
          style=${{ ...S.btn(COLORS.gold, '#111'), fontSize: '12px' }}
        >+ Eigenes</button>
      </div>

      <input
        type="search"
        value=${query}
        placeholder="Rezept suchen…"
        onInput=${e => setQuery(e.target.value)}
        style=${{ ...S.input, width: '100%', marginBottom: '8px', boxSizing: 'border-box' }}
      />

      <button
        onClick=${() => setFridgeOnly(v => !v)}
        style=${{
          background: fridgeOnly ? COLORS.gold : 'none',
          border: `1px solid ${fridgeOnly ? COLORS.gold : '#333'}`,
          borderRadius: '14px', color: fridgeOnly ? '#111' : COLORS.textMuted,
          padding: '5px 12px', fontSize: '11px', cursor: 'pointer',
          fontFamily: FONTS.mono, marginBottom: '12px',
        }}
      >❄ Kühlschrank-passend</button>
      ${fridgeOnly && fridgeItems.length === 0 && html`
        <div style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono, marginBottom: '10px' }}>
          Dein Kühlschrank ist leer — fülle ihn im Tracker (❄ Kühlschrank).
        </div>
      `}

      ${filteredInitial.map(r => html`
        <${RecipeCard}
          key=${r.id}
          recipe=${r}
          isExpanded=${expandedId === r.id}
          onToggle=${() => handleToggle(r.id)}
          isCustom=${false}
          onAddToTracker=${() => setTrackerRecipe(r)}
        />
      `)}

      ${!loading && filteredCustom.length > 0 && html`
        <div style=${{ ...S.cardTitle, marginTop: '10px', marginBottom: '8px' }}>Eigene Rezepte</div>
        ${filteredCustom.map(r => html`
          <${RecipeCard}
            key=${r.id}
            recipe=${r}
            isExpanded=${expandedId === r.id}
            onToggle=${() => handleToggle(r.id)}
            isCustom=${true}
            onEdit=${handleEdit}
            onDelete=${handleDelete}
            onAddToTracker=${() => setTrackerRecipe(r)}
          />
        `)}
      `}

      ${noResults && html`
        <div style=${{ fontSize: '12px', color: COLORS.textMuted, fontFamily: FONTS.mono, padding: '16px 0', textAlign: 'center' }}>
          Kein Rezept gefunden.
        </div>
      `}

      <${RecipeEditor}
        open=${editorOpen}
        onClose=${() => setEditorOpen(false)}
        recipe=${editRecipe}
        onSave=${saveRecipe}
        favorites=${favorites}
      />

      <${RecipeToTrackerModal}
        open=${!!trackerRecipe}
        recipe=${trackerRecipe}
        onClose=${() => setTrackerRecipe(null)}
        onSave=${handleAddToTracker}
      />

    </div>
  `;
}
