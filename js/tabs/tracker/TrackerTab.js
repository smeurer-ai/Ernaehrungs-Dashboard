import { html, useState, useMemo } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { useLog } from '../../hooks/useLog.js';
import { useFavoriteFoods } from '../../hooks/useFavoriteFoods.js';
import { getMealTemplate } from '../../data/mealTemplates.js';
import { DayLogList } from './DayLogList.js';
import { FoodEntryModal } from './FoodEntryModal.js';

/**
 * Tracker-Tab — Tages-Mahlzeiten manuell erfassen.
 *
 * @param {{
 *   dayType: 'training'|'rest',
 *   trainingTime: string,
 * }} props
 */
export function TrackerTab({ dayType, trainingTime, wakeUpTime, trainingDurationMin }) {
  const today = new Date().toISOString().slice(0, 10);
  const dayMeta = { dayType, trainingTime };

  const { entries, loading, addEntry, removeEntry, updateEntry } = useLog(today, dayMeta);
  const { favorites, addFavorite } = useFavoriteFoods();

  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [defaultSlot, setDefaultSlot] = useState('Frühstück');

  // Mahlzeit-Slots aus aktuellem Tagesplan (dynamisch via getMealTemplate)
  const mealSlots = useMemo(() => {
    const meals = getMealTemplate(dayType, trainingTime, wakeUpTime, trainingDurationMin);
    return meals.map(m => m.label);
  }, [dayType, trainingTime, wakeUpTime, trainingDurationMin]);

  function openAddModal(slot) {
    setEditEntry(null);
    setDefaultSlot(slot || mealSlots[0] || 'Frühstück');
    setModalOpen(true);
  }

  function openEditModal(entry) {
    setEditEntry(entry);
    setModalOpen(true);
  }

  async function handleSave(trackedFood, favData) {
    if (editEntry) {
      await updateEntry(trackedFood.id, trackedFood);
    } else {
      await addEntry(trackedFood);
    }
    if (favData) {
      await addFavorite(favData);
    }
  }

  // Datum für den Header formatieren
  const dateLabel = new Date(today + 'T12:00:00').toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return html`
    <div style=${S.content}>
      <!-- Header -->
      <div style=${{ marginBottom: '14px' }}>
        <div style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono }}>
          ${dateLabel}
        </div>
        <div style=${{
          fontSize: '12px',
          color: dayType === 'training' ? COLORS.gold : COLORS.textMuted,
          fontFamily: FONTS.mono,
          letterSpacing: '0.06em',
          marginTop: '2px',
        }}>
          ${dayType === 'training' ? `💪 Trainingstag · ${trainingTime}` : '🌿 Ruhetag'}
        </div>
      </div>

      <!-- Log-Liste -->
      ${loading
        ? html`<div style=${{ color: COLORS.textMuted, fontSize: '12px', textAlign: 'center', padding: '24px' }}>Lade…</div>`
        : html`
          <${DayLogList}
            entries=${entries}
            mealSlots=${mealSlots}
            onDelete=${removeEntry}
            onEdit=${openEditModal}
            onAdd=${() => openAddModal(null)}
          />
        `
      }

      <!-- Add-Button (wenn bereits Einträge vorhanden) -->
      ${!loading && entries.length > 0 && html`
        <button
          onClick=${() => openAddModal(null)}
          style=${{ ...S.btn(), width: '100%', marginTop: '12px' }}
        >
          + Mahlzeit eintragen
        </button>
      `}

      <!-- Eingabe-Modal -->
      <${FoodEntryModal}
        open=${modalOpen}
        onClose=${() => setModalOpen(false)}
        onSave=${handleSave}
        favorites=${favorites}
        initialEntry=${editEntry}
        defaultSlot=${defaultSlot}
        mealSlots=${mealSlots}
      />
    </div>
  `;
}
