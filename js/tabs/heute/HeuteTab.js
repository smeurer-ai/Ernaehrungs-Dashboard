import { html } from '../../lib.js';
import { DayTypeSwitch } from './DayTypeSwitch.js';
import { DaySummary } from './DaySummary.js';
import { MealPlanList } from './MealPlanList.js';
import { HydrationCard } from './HydrationCard.js';
import { MpsSummaryCard } from './MpsSummaryCard.js';
import { GapSuggestions } from './GapSuggestions.js';
import { useLog } from '../../hooks/useLog.js';
import { useFavoriteFoods } from '../../hooks/useFavoriteFoods.js';
import { useSavedMeals } from '../../hooks/useSavedMeals.js';
import { useFridge } from '../../hooks/useFridge.js';
import { sumConsumed, groupMacrosBySlot, computeSlotGap } from '../../calc/tracker.js';
import { computeGapSuggestions } from '../../calc/suggestions.js';
import { localDateString } from '../../calc/dates.js';
import { S, COLORS } from '../../ui/theme.js';

// dayType/trainingTime/trainingDurationMin kommen von App (single source of truth).
// HeuteTab ruft useUiState() NICHT selbst auf — sonst gibt es zwei unabhängige
// React-States die nur über localStorage verbunden wären und TrackerTab würde
// den geänderten DayType nie mitbekommen.
export function HeuteTab({ profile, calculated, dayType, trainingTime, trainingDurationMin, onUiStateUpdate }) {
  const wakeUpTime = profile?.wakeUpTime;

  const today = localDateString();
  const { entries, loading } = useLog(today, { dayType, trainingTime });
  const consumed = loading
    ? { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    : sumConsumed(entries);
  const consumedBySlot = loading ? undefined : groupMacrosBySlot(entries);

  // Phase 5d: Datenquellen für Vorschläge (Hooks müssen vor early-return stehen)
  const { favorites } = useFavoriteFoods();
  const { meals } = useSavedMeals();
  const { fridgeItems } = useFridge();

  if (!profile || !calculated) {
    return html`
      <div style=${{ ...S.content, textAlign: 'center', paddingTop: '60px', color: COLORS.textMuted }}>
        Profil wird geladen…
      </div>
    `;
  }

  const macros = dayType === 'training' ? calculated.macrosTraining : calculated.macrosRest;

  // Phase 5d: ab 17 Uhr proteinpriorisierte Vorschläge für die Tageslücke
  const isEvening = new Date().getHours() >= 17;
  const dayGap = computeSlotGap(
    { kcal: macros.kcal, p: macros.protein, c: macros.carbs, f: macros.fat },
    { kcal: consumed.kcal, p: consumed.protein, c: consumed.carbs, f: consumed.fat },
  );
  const suggestions = (!loading && isEvening)
    ? computeGapSuggestions({ gap: dayGap, isEvening, favorites, meals, fridgeItems })
    : [];

  return html`
    <div style=${S.content}>
      <${DayTypeSwitch}
        dayType=${dayType}
        trainingTime=${trainingTime}
        trainingDurationMin=${trainingDurationMin}
        onDayTypeChange=${d => onUiStateUpdate({ preferredDayType: d })}
        onTrainingTimeChange=${t => onUiStateUpdate({ preferredTrainingTime: t })}
        onTrainingDurationChange=${d => onUiStateUpdate({ preferredTrainingDurationMin: d })}
      />
      <${DaySummary} macros=${macros} consumed=${consumed} />
      <${GapSuggestions} gap=${dayGap} suggestions=${suggestions} />
      <div style=${S.cardTitle}>Mahlzeitenplan</div>
      <${MealPlanList}
        dayType=${dayType}
        trainingTime=${trainingTime}
        macros=${macros}
        consumedBySlot=${consumedBySlot}
        wakeUpTime=${wakeUpTime}
        trainingDurationMin=${trainingDurationMin}
      />
      <${HydrationCard} dayType=${dayType} trainingTime=${trainingTime} />
      <${MpsSummaryCard}
        entries=${entries}
        dayType=${dayType}
        trainingTime=${trainingTime}
        wakeUpTime=${wakeUpTime}
        trainingDurationMin=${trainingDurationMin}
      />
    </div>
  `;
}
