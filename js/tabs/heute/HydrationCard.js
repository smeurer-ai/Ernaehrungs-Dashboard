import { html } from '../../lib.js';
import { generateHydrationReminders } from '../../calc/hydration.js';
import { S, COLORS } from '../../ui/theme.js';

const CONTEXT_COLOR = {
  preWorkout:    '#c8a96e',
  duringWorkout: '#7eb8f7',
  postWorkout:   '#5cb85c',
  restDay:       '#aaa',
};

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function reminderState(timeStr, nextId) {
  const [h, m] = timeStr.split(':').map(Number);
  if (h * 60 + m < nowMinutes()) return 'past';
  if (nextId === true) return 'next';
  return 'future';
}

export function HydrationCard({ dayType, trainingTime }) {
  const reminders = generateHydrationReminders({ dayType, trainingTime });
  const now = nowMinutes();

  let nextMarked = false;
  const withState = reminders.map(r => {
    const [h, m] = r.time.split(':').map(Number);
    const rMin = h * 60 + m;
    const isPast = rMin < now;
    const isNext = !isPast && !nextMarked;
    if (isNext) nextMarked = true;
    return { ...r, isPast, isNext };
  });

  return html`
    <div style=${S.card}>
      <div style=${S.cardTitle}>Hydration</div>
      ${withState.map(r => {
        const color = CONTEXT_COLOR[r.context] || '#aaa';
        const rowStyle = {
          background: '#141414',
          borderRadius: '10px',
          padding: '10px 12px',
          marginBottom: '7px',
          border: '1px solid #1e1e1e',
          borderLeft: `3px solid ${r.isPast ? '#333' : color}`,
          opacity: r.isPast ? 0.4 : 1,
        };
        return html`
          <div key=${r.id} style=${rowStyle}>
            <div style=${{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              ${r.isNext && html`
                <span style=${{ width: '7px', height: '7px', borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
              `}
              <span style=${{ fontFamily: "'DM Mono',monospace", fontSize: '13px', color: r.isPast ? COLORS.textSubtle : COLORS.text, minWidth: '42px' }}>
                ${r.time}
              </span>
              <span style=${{ flex: 1, fontSize: '13px', color: r.isPast ? COLORS.textSubtle : COLORS.text }}>
                ${r.label}
              </span>
              <span style=${{ fontFamily: "'DM Mono',monospace", fontSize: '11px', color: r.isPast ? '#555' : color, whiteSpace: 'nowrap' }}>
                ${r.amountMl.min}–${r.amountMl.max} ml
              </span>
            </div>
            <div style=${{ fontSize: '11px', color: COLORS.textSubtle, marginTop: '4px', paddingLeft: r.isNext ? '15px' : '0' }}>
              ${r.note}
            </div>
          </div>
        `;
      })}
    </div>
  `;
}
