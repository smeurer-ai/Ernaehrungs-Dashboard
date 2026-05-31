import { html } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';

/** Dropdown-Optionen in 30-Minuten-Schritten von 05:00 bis 22:00 */
function buildTimeOptions() {
  const opts = [];
  for (let h = 5; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return opts;
}
const TIME_OPTIONS = buildTimeOptions();

/** Minuten → "HH:MM Uhr" */
function fmtTime(minutes) {
  const m = Math.max(300, Math.min(1380, Math.round(minutes)));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')} Uhr`;
}

export function DayTypeSwitch({ dayType, trainingTime, onDayTypeChange, onTrainingTimeChange }) {
  const t = (trainingTime || '08:00').split(':').map(Number);
  const T = t[0] * 60 + (t[1] || 0);
  const preLabel  = fmtTime(T - 75);
  const postLabel = fmtTime(T + 30);

  return html`
    <div style=${S.card}>
      <!-- Trainingstag / Ruhetag Toggle -->
      <div style=${{ display: 'flex', gap: '8px', marginBottom: dayType === 'training' ? '14px' : '0' }}>
        <button style=${S.toggle(dayType === 'training')} onClick=${() => onDayTypeChange('training')}>
          💪 Trainingstag
        </button>
        <button style=${S.toggle(dayType === 'rest')} onClick=${() => onDayTypeChange('rest')}>
          😴 Ruhetag
        </button>
      </div>

      <!-- Trainingszeit-Auswahl (nur bei Trainingstag) -->
      ${dayType === 'training' && html`
        <div>
          <label style=${{
            fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase',
            color: COLORS.textMuted, fontFamily: FONTS.mono, marginBottom: '6px', display: 'block',
          }}>
            Trainingszeit wählen
          </label>

          <select
            value=${trainingTime || '08:00'}
            onChange=${e => onTrainingTimeChange(e.target.value)}
            style=${{ ...S.input, cursor: 'pointer' }}
          >
            ${TIME_OPTIONS.map(t => html`
              <option key=${t} value=${t}>${t} Uhr</option>
            `)}
          </select>

          <!-- Vorschau Pre/Post relativ zur gewählten Zeit -->
          <div style=${{
            display: 'flex', gap: '16px', marginTop: '8px',
            fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono,
          }}>
            <span>⚡ Pre-Workout: ${preLabel}</span>
            <span>💪 Post-Workout: ${postLabel}</span>
          </div>
        </div>
      `}
    </div>
  `;
}
