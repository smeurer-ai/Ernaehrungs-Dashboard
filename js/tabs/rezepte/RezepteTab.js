import { html, useState } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { INITIAL_RECIPES } from '../../data/initialRecipes.js';
import { useRecipes } from '../../hooks/useRecipes.js';
import { RecipeCard } from './RecipeCard.js';
import { RecipeEditor } from './RecipeEditor.js';
import { RecipeToTrackerModal } from './RecipeToTrackerModal.js';
import { getLogForDate, saveLogEntry } from '../../storage/indexeddb.js';

export function RezepteTab() {
  const { recipes, loading, saveRecipe, removeRecipe } = useRecipes();
  const [expandedId, setExpandedId]   = useState(null);
  const [editorOpen, setEditorOpen]   = useState(false);
  const [editRecipe, setEditRecipe]   = useState(null);
  const [trackerRecipe, setTrackerRecipe] = useState(null);
  const [query, setQuery]             = useState('');

  const q = query.trim().toLowerCase();
  const filteredInitial = q
    ? INITIAL_RECIPES.filter(r => r.name.toLowerCase().includes(q))
    : INITIAL_RECIPES;
  const filteredCustom = q
    ? recipes.filter(r => r.name.toLowerCase().includes(q))
    : recipes;
  const noResults = q && filteredInitial.length === 0 && filteredCustom.length === 0;

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
    const today = new Date().toISOString().slice(0, 10);
    const existing = await getLogForDate(today);
    const entries = [...(existing?.entries ?? []), trackerEntry];
    await saveLogEntry({ ...existing, date: today, entries });
  }

  return html`
    <div style=${S.content}>

      <!-- Header mit Titel + Neu-Button -->
      <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style=${{ ...S.cardTitle, marginBottom: 0 }}>Rezepte</div>
        <button
          onClick=${handleNew}
          style=${{ ...S.btn(COLORS.gold, '#111'), fontSize: '12px' }}
        >+ Eigenes</button>
      </div>

      <!-- Suchfeld -->
      <input
        type="search"
        value=${query}
        placeholder="Rezept suchen…"
        onInput=${e => setQuery(e.target.value)}
        style=${{ ...S.input, width: '100%', marginBottom: '12px', boxSizing: 'border-box' }}
      />

      <!-- Initial-Rezepte -->
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

      <!-- Custom-Rezepte (nach IndexedDB-Load) -->
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

      <!-- Keine Treffer -->
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
