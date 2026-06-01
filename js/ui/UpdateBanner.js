import { html, useState } from '../lib.js';
import { COLORS, FONTS } from './theme.js';
import { skipWaiting } from '../pwa/registerServiceWorker.js';

/**
 * UpdateBanner
 *
 * Erscheint wenn eine neue App-Version als Service Worker wartet.
 * Props:
 *   registration — ServiceWorkerRegistration (null = kein Update)
 */
export function UpdateBanner({ registration }) {
  const [dismissed, setDismissed] = useState(false);

  if (!registration || dismissed) return null;

  function handleUpdate() {
    skipWaiting(registration);
  }

  return html`
    <div style=${{
      background: '#1a1a12',
      borderBottom: `2px solid ${COLORS.gold}`,
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexShrink: 0,
    }}>
      <span style=${{
        fontSize: '12px',
        color: COLORS.textMuted,
        fontFamily: FONTS.mono,
        letterSpacing: '0.04em',
      }}>
        🔄 App-Update verfügbar
      </span>
      <div style=${{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick=${handleUpdate}
          style=${{
            background: COLORS.gold,
            color: '#111',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: FONTS.mono,
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          Jetzt laden
        </button>
        <button
          onClick=${() => setDismissed(true)}
          style=${{
            background: 'transparent',
            color: COLORS.textMuted,
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '11px',
            fontFamily: FONTS.mono,
            cursor: 'pointer',
          }}
        >
          Später
        </button>
      </div>
    </div>
  `;
}
