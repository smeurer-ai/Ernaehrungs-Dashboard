import { html, useState, useMemo } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { useLog } from '../../hooks/useLog.js';
import { useFavoriteFoods } from '../../hooks/useFavoriteFoods.js';
import { getMealTemplate } from '../../data/mealTemplates.js';
import { distributeMacrosPerMeal } from '../../calc/macros.js';
import { localDateString } from '../../calc/dates.js';
import { useSavedMeals } from '../../hooks/useSavedMeals.js';
import { mealItemsToTrackedFoods } from '../../calc/meals.js';
import { DayLogList } from './DayLogList.js';
import { FoodEntryModal } from './FoodEntryModal.js';
import { SavedMealsModal } from './SavedMealsModal.js';
import { MealBuilderModal } from './MealBuilderModal.js';

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Tracker-Tab — Tages-Mahlzeiten manuell erfassen.
 *
 * @param {{
 *   dayType: 'training'|'rest',
 *   trainingTime: string,
 * }} props
 */
export function TrackerTab({ dayType, trainingTime, wakeUpTime, trainingDurationMin, calculated }) {
  const today = localDateString();
  const dayMeta = { dayType, trainingTime };

  const { entries, loading, addEntry, removeEntry, updateEntry } = useLog(today, dayMeta);
  const { favorites, addFavorite } = useFavoriteFoods();

  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [defaultSlot, setDefaultSlot] = useState('Frühstück');

  // Favoriten-Mahlzeiten (6b)
  const { meals, loading: mealsLoading, addOrUpdateMeal, removeMeal, markUsed } = useSavedMeals();
  const [mealsModalOpen, setMealsModalOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderMeal, setBuilderMeal] = useState(null); // null = neue Mahlzeit

  // Mahlzeit-Slots aus aktuellem Tagesplan (dynamisch via getMealTemplate)
  const mealSlots = useMemo(() => {
    const meals = getMealTemplate(dayType, trainingTime, wakeUpTime, trainingDurationMin);
    return meals.map(m => m.label);
  }, [dayType, trainingTime, wakeUpTime, trainingDurationMin]);

  // Zielwerte pro Slot aus dem Mahlzeitenplan — { 'Frühstück': { kcal, p, c, f }, ... }
  const slotTargets = useMemo(() => {
    const dayMacros = dayType === 'training' ? calculated?.macrosTraining : calculated?.macrosRest;
    if (!dayMacros) return {};
    const template = getMealTemplate(dayType, trainingTime, wakeUpTime, trainingDurationMin);
    const meals = distributeMacrosPerMeal(template, dayMacros);
    return Object.fromEntries(meals.map(m => [m.label, { kcal: m.kcal, p: m.protein, c: m.carbs, f: m.fat }]));
  }, [dayType, trainingTime, wakeUpTime, trainingDurationMin, calculated]);

  // Heute bereits eingetragene Makros pro Slot — { 'Frühstück': { kcal, p, c, f }, ... }
  const consumedBySlot = useMemo(() => {
    const acc = {};
    for (const e of entries) {
      const s = acc[e.mealSlot] ?? (acc[e.mealSlot] = { kcal: 0, p: 0, c: 0, f: 0 });
      s.kcal += e.kcal ?? 0;
      s.p    += e.p    ?? 0;
      s.c    += e.c    ?? 0;
      s.f    += e.f    ?? 0;
    }
    return acc;
  }, [entries]);

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

  // Gespeicherte Mahlzeit eintragen: jedes Item wird ein eigener TrackedFood
  async function handleApplyMeal(meal, slot) {
    const foods = mealItemsToTrackedFoods(meal, slot);
    for (const f of foods) {
      await addEntry({ ...f, id: generateId(), timestamp: Date.now() });
    }
    await markUsed(meal);
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

      <!-- Favoriten-Mahlzeiten (6b) -->
      <button
        onClick=${() => setMealsModalOpen(true)}
        style=${{
          background: 'none', border: `1px solid ${COLORS.gold}55`, borderRadius: '8px',
          color: COLORS.gold, width: '100%', padding: '10px', fontSize: '13px',
          cursor: 'pointer', marginTop: '8px', fontFamily: FONTS.mono,
        }}
      >
        ★ Meine Mahlzeiten
      </button>

      <!-- Eingabe-Modal -->
      <${FoodEntryModal}
        open=${modalOpen}
        onClose=${() => setModalOpen(false)}
        onSave=${handleSave}
        favorites=${favorites}
        initialEntry=${editEntry}
        defaultSlot=${defaultSlot}
        mealSlots=${mealSlots}
        slotTargets=${slotTargets}
        consumedBySlot=${consumedBySlot}
      />

      <${SavedMealsModal}
        open=${mealsModalOpen}
        onClose=${() => setMealsModalOpen(false)}
        meals=${meals}
        loading=${mealsLoading}
        mealSlots=${mealSlots}
        onApply=${handleApplyMeal}
        onEdit=${meal => { setBuilderMeal(meal); setBuilderOpen(true); }}
        onNew=${() => { setBuilderMeal(null); setBuilderOpen(true); }}
        onDelete=${removeMeal}
      />

      <${MealBuilderModal}
        open=${builderOpen}
        onClose=${() => setBuilderOpen(false)}
        onSave=${addOrUpdateMeal}
        meal=${builderMeal}
        mealSlots=${mealSlots}
        slotTargets=${slotTargets}
        favorites=${favorites}
      />
    </div>
  `;
}
