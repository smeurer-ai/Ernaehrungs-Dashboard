import { html } from '../lib.js';
import { FONTS, COLORS } from './theme.js';

export function KcalRing({ consumed, target }) {
  const pct = Math.min(consumed / target, 1);
  const r = 42, circ = 2 * Math.PI * r, over = consumed > target;
  return html`
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r=${r} fill="none" stroke=${COLORS.borderLight} strokeWidth="7" />
      <circle cx="50" cy="50" r=${r} fill="none" stroke=${over ? COLORS.error : COLORS.gold} strokeWidth="7"
        strokeDasharray=${`${pct * circ} ${circ}`} strokeLinecap="round" transform="rotate(-90 50 50)"
        style=${{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x="50" y="46" textAnchor="middle" fill=${COLORS.text} fontSize="14" fontWeight="700" fontFamily=${FONTS.display}>${consumed}</text>
      <text x="50" y="59" textAnchor="middle" fill=${COLORS.textMuted} fontSize="8" fontFamily=${FONTS.mono}>/ ${target} kcal</text>
    </svg>
  `;
}
