import { html } from '../lib.js';
import { S } from './theme.js';

const TABS = [
  { id: 'heute',   label: 'Heute',   icon: '🏠' },
  { id: 'tracker', label: 'Tracker', icon: '✏️'  },
  { id: 'rezepte', label: 'Rezepte', icon: '🥗'  },
  { id: 'woche',   label: 'Woche',   icon: '📅'  },
  { id: 'profil',  label: 'Profil',  icon: '👤'  },
];

/**
 * Bottom-Navigation — 5 Tabs fixiert am unteren Bildschirmrand.
 * Aktiver Tab: Gold-Akzentlinie oben + goldene Farbe.
 */
export function Navigation({ activeTab, onTabChange }) {
  return html`
    <nav style=${S.bottomNav} role="navigation" aria-label="Hauptnavigation">
      ${TABS.map(tab => html`
        <button
          key=${tab.id}
          style=${S.bottomNavTab(activeTab === tab.id)}
          onClick=${() => onTabChange(tab.id)}
          aria-label=${tab.label}
          aria-current=${activeTab === tab.id ? 'page' : undefined}
        >
          <span style=${S.bottomNavIcon}>${tab.icon}</span>
          <span>${tab.label}</span>
        </button>
      `)}
    </nav>
  `;
}
