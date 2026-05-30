import { html } from '../../lib.js';
import { WeekGrid } from './WeekGrid.js';
import { S } from '../../ui/theme.js';

export function WocheTab() {
  return html`
    <div style=${S.content}>
      <div style=${S.cardTitle}>Wochenprotokoll</div>
      <${WeekGrid} />
    </div>
  `;
}
