import { html } from '../../lib.js';
import { DayTypeSwitch } from './DayTypeSwitch.js';
import { DaySummary } from './DaySummary.js';
import { MealPlanList } from './MealPlanList.js';
import { HydrationCard } from './HydrationCard.js';
import { useUiState } from '../../hooks/useUiState.js';
import { S, COLORS } from '../../ui/theme.js';

export function HeuteTab({ profile, calculated }) {
  const [uiState, updateUiState] = useUiState();
  const { preferredDayType: dayType, preferredTrainingTime: trainingTime } = uiState;

  if (!profile || !calculated) {
    return html`
      <div style=${{ ...S.content, textAlign: 'center', paddingTop: '60px', color: COLORS.textMuted }}>
        Profil wird geladen…
      </div>
    `;
  }

  const macros = dayType === 'training' ? calculated.macrosTraining : calculated.macrosRest;

  return html`
    <div style=${S.content}>
      <${DayTypeSwitch}
        dayType=${dayType}
        trainingTime=${trainingTime}
        onDayTypeChange=${d => updateUiState({ preferredDayType: d })}
        onTrainingTimeChange=${t => updateUiState({ preferredTrainingTime: t })}
      />
      <${DaySummary} macros=${macros} />
      <div style=${S.cardTitle}>Mahlzeitenplan</div>
      <${MealPlanList} dayType=${dayType} trainingTime=${trainingTime} macros=${macros} />
      <${HydrationCard} dayType=${dayType} trainingTime=${trainingTime} />
    </div>
  `;
}
