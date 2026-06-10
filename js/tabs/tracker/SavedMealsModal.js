import { html, useState, useEffect } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { Modal } from '../../ui/Modal.js';

/**
 * Liste der gespeicherten Favoriten-Mahlzeiten:
 * eintragen (mit Slot-Wahl), bearbeiten, löschen, neue zusammenstellen.
 *
 * @param {{
 *   open: boolean,
 *   onClose: function,
 *   meals: array,            // SavedMeal[], sortiert nach zuletzt verwendet
 *   loading: boolean,
 *   mealSlots: string[],
 *   onApply: function,       // (meal, slot) => Promise — trägt alle Items ein
 *   onEdit: function,        // (meal) => void — öffnet Baukasten
 *   onNew: function,         // () => void — öffnet leeren Baukasten
 *   onDelete: function,      // (id) => void
 * }} props
 */
export function SavedMealsModal({ open, onClose, meals, loading, mealSlots = [], onApply, onEdit, onNew, onDelete }) {
  const [applyId, setApplyId] = useState(null);   // Mahlzeit, für die die Slot-Wahl offen ist
  const [applySlot, setApplySlot] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!open) return;
    setApplyId(null);
    setApplying(false);
  }, [open]);

  function openApply(meal) {
    setApplyId(meal.id);
    setApplySlot(mealSlots.includes(meal.defaultSlot) ? meal.defaultSlot : (mealSlots[0] ?? ''));
  }

  async function confirmApply(meal) {
    setApplying(true);
    await onApply(meal, applySlot);
    setApplying(false);
    onClose();
  }

  function handleDelete(meal) {
    if (window.confirm(`Mahlzeit „${meal.name}" wirklich löschen?`)) {
      onDelete(meal.id);
    }
  }

  if (!open) return null;

  return html`
    <${Modal} open=${open} onClose=${onClose} title="Meine Mahlzeiten">

      ${loading && html`
        <div style=${{ color: COLORS.textMuted, fontSize: '12px', textAlign: 'center', padding: '16px' }}>Lade…</div>
      `}

      ${!loading && meals.length === 0 && html`
        <div style=${{ color: COLORS.textMuted, fontSize: '12px', fontFamily: FONTS.mono, textAlign: 'center', padding: '16px 0' }}>
          Noch keine Mahlzeiten gespeichert.<br />
          Stelle Deine erste Mahlzeit zusammen — danach trägst Du sie mit einem Tipp ein.
        </div>
      `}

      ${meals.map(meal => html`
        <div key=${meal.id} style=${{
          background: '#141414', border: '1px solid #2a2a2a', borderRadius: '10px',
          padding: '10px 12px', marginBottom: '8px',
        }}>
          <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
            <span style=${{ fontSize: '14px', color: COLORS.text, fontWeight: 600 }}>${meal.name}</span>
            <span style=${{ fontSize: '11px', color: COLORS.gold, fontFamily: FONTS.mono, flexShrink: 0 }}>
              ${meal.totalMacros?.kcal ?? 0} kcal · ${meal.totalMacros?.p ?? 0}g P
            </span>
          </div>
          <div style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono, marginTop: '2px' }}>
            ${meal.defaultSlot} · ${meal.items?.length ?? 0} Lebensmittel
          </div>

          ${applyId === meal.id
            ? html`
              <div style=${{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
                <select
                  value=${applySlot}
                  onChange=${e => setApplySlot(e.target.value)}
                  style=${{ ...S.input, fontSize: '12px', padding: '7px 8px', flex: 1 }}
                >
                  ${mealSlots.map(s => html`<option key=${s} value=${s}>${s}</option>`)}
                </select>
                <button
                  onClick=${() => confirmApply(meal)}
                  disabled=${applying}
                  style=${{ ...S.btn(COLORS.gold, '#111'), fontSize: '11px', flexShrink: 0 }}
                >${applying ? '…' : 'Jetzt eintragen'}</button>
                <button
                  onClick=${() => setApplyId(null)}
                  style=${{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}
                >×</button>
              </div>
            `
            : html`
              <div style=${{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button
                  onClick=${() => openApply(meal)}
                  style=${{ ...S.btn(COLORS.gold, '#111'), fontSize: '11px', flex: 1 }}
                >▶ Eintragen</button>
                <button
                  onClick=${() => onEdit(meal)}
                  title="Bearbeiten"
                  style=${{ background: 'none', border: '1px solid #333', borderRadius: '6px', color: COLORS.textMuted, cursor: 'pointer', fontSize: '12px', padding: '4px 10px', flexShrink: 0 }}
                >✏</button>
                <button
                  onClick=${() => handleDelete(meal)}
                  title="Löschen"
                  style=${{ background: 'none', border: '1px solid #333', borderRadius: '6px', color: COLORS.textMuted, cursor: 'pointer', fontSize: '12px', padding: '4px 10px', flexShrink: 0 }}
                >×</button>
              </div>
            `}
        </div>
      `)}

      <button
        onClick=${onNew}
        style=${{
          background: '#1a1a1a', border: '1px dashed #333', borderRadius: '8px',
          color: COLORS.textMuted, width: '100%', padding: '10px', fontSize: '12px',
          cursor: 'pointer', marginTop: '6px', fontFamily: FONTS.mono,
        }}
      >+ Neue Mahlzeit zusammenstellen</button>

    </${Modal}>
  `;
}
