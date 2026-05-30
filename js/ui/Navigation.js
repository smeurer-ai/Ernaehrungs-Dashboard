import { html } from '../lib.js';
import { S } from './theme.js';

const TABS = [
  { id: 'heute', label: 'Heute' },
  { id: 'tracker', label: 'Tracker' },
  { id: 'rezepte', label: 'Rezepte' },
  { id: 'woche', label: 'Woche' },
  { id: 'profil', label: 'Profil' },
];

export function Navigation({ activeTab, onTabChange }) {
  return html`
    <div style=${S.tabs}>
      ${TABS.map(tab => html`
        <button
          key=${tab.id}
          style=${S.tab(activeTab === tab.id)}
          onClick=${() => onTabChange(tab.id)}
        >
          ${tab.label}
        </button>
      `)}
    </div>
  `;
}
