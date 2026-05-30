import { html } from '../../lib.js';
import { S } from '../../ui/theme.js';

export function DayTypeSwitch({ dayType, trainingTime, onDayTypeChange, onTrainingTimeChange }) {
  return html`
    <div style=${S.card}>
      <div style=${{ display: 'flex', gap: '8px', marginBottom: dayType === 'training' ? '12px' : '0' }}>
        <button style=${S.toggle(dayType === 'training')} onClick=${() => onDayTypeChange('training')}>
          💪 Trainingstag
        </button>
        <button style=${S.toggle(dayType === 'rest')} onClick=${() => onDayTypeChange('rest')}>
          😴 Ruhetag
        </button>
      </div>
      ${dayType === 'training' && html`
        <div style=${{ display: 'flex', gap: '8px' }}>
          ${['08:00', '14:30'].map(time => html`
            <button
              key=${time}
              style=${S.timeBtn(trainingTime === time)}
              onClick=${() => onTrainingTimeChange(time)}
            >
              ⏰ ${time} Uhr
            </button>
          `)}
        </div>
      `}
    </div>
  `;
}
