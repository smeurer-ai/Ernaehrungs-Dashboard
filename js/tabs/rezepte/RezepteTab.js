import { html, useState } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { INITIAL_RECIPES } from '../../data/initialRecipes.js';
import { useRecipes } from '../../hooks/useRecipes.js';
import { RecipeCard } from './RecipeCard.js';
import { RecipeEditor } from './RecipeEditor.js';

export function RezepteTab() {
  const { recipes, loading, saveRecipe, removeRecipe } = useRecipes();
  const [expandedId, setExpandedId]   = useState(null);
  const [editorOpen, setEditorOpen]   = useState(false);
  const [editRecipe, setEditRecipe]   = useState(null);

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

  return html`
    <div style=${S.content}>

      <!-- Header mit Titel + Neu-Button -->
      <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style=${{ ...S.cardTitle, marginBottom: 0 }}>Rezepte</div>
        <button
          onClick=${handleNew}
          style=${{ ...S.btn(COLORS.gold, '#111'), fontSize: '12px' }}
        >+ Eigenes</button>
      </div>

      <!-- Initial-Rezepte -->
      ${INITIAL_RECIPES.map(r => html`
        <${RecipeCard}
          key=${r.id}
          recipe=${r}
          isExpanded=${expandedId === r.id}
          onToggle=${() => handleToggle(r.id)}
          isCustom=${false}
        />
      `)}

      <!-- Custom-Rezepte (nach IndexedDB-Load) -->
      ${!loading && recipes.length > 0 && html`
        <div style=${{ ...S.cardTitle, marginTop: '10px', marginBottom: '8px' }}>Eigene Rezepte</div>
        ${recipes.map(r => html`
          <${RecipeCard}
            key=${r.id}
            recipe=${r}
            isExpanded=${expandedId === r.id}
            onToggle=${() => handleToggle(r.id)}
            isCustom=${true}
            onEdit=${handleEdit}
            onDelete=${handleDelete}
          />
        `)}
      `}

      <${RecipeEditor}
        open=${editorOpen}
        onClose=${() => setEditorOpen(false)}
        recipe=${editRecipe}
        onSave=${saveRecipe}
      />

    </div>
  `;
}
