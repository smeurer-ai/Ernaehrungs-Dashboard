import { html, useState, useEffect } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { searchOFF, classifyOFFError } from '../../api/openFoodFacts.js';

/**
 * Textsuch-Panel für Open Food Facts.
 * Zeigt Sucheingabe + Ergebnisliste. Bei Produktauswahl → onSelect + onClose.
 *
 * @param {{
 *   onSelect:      (product: import('../../api/openFoodFacts.js').OFFProduct) => void,
 *   onClose:       () => void,
 *   initialQuery?: string,  // Suchtext aus dem zentralen Suchfeld vorausfüllen
 * }} props
 */
export function OFFSearchPanel({ onSelect, onClose, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => { setQuery(initialQuery); }, [initialQuery]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    if (q.length < 2) {
      setError('Mindestens 2 Zeichen eingeben.');
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const products = await searchOFF(q);
      setResults(products);
      if (products.length === 0) setError('Keine Produkte gefunden. Anderen Begriff versuchen?');
    } catch (err) {
      const kind = classifyOFFError(err);
      if (kind === 'too_short') {
        setError('Mindestens 2 Zeichen eingeben.');
      } else if (kind === 'timeout' || kind === 'server') {
        setError('Open Food Facts ist gerade nicht erreichbar — bitte gleich nochmal versuchen.');
      } else if (kind === 'network') {
        setError('Kein Netzwerk. Bitte Internetverbindung prüfen.');
      } else {
        setError('Suche fehlgeschlagen. Bitte später nochmal versuchen.');
      }
    } finally {
      setLoading(false);
    }
  }

  return html`
    <div style=${{ marginBottom: '10px' }}>
      <div style=${{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        <input
          type="search"
          value=${query}
          placeholder="z.B. Magerquark"
          onInput=${e => setQuery(e.target.value)}
          onKeyDown=${e => e.key === 'Enter' && !loading && handleSearch()}
          style=${{ ...S.input, flex: 1 }}
          autoFocus
        />
        <button
          onClick=${handleSearch}
          disabled=${loading || !query.trim()}
          style=${{
            ...S.btn(loading || !query.trim() ? '#2a2a2a' : COLORS.gold, loading || !query.trim() ? '#555' : '#111'),
            padding: '0 14px',
            flexShrink: 0,
          }}
        >
          ${loading ? '…' : '🔍'}
        </button>
      </div>
      ${error && html`
        <div style=${{ fontSize: '11px', color: COLORS.error, fontFamily: FONTS.mono, marginBottom: '6px' }}>
          ${error}
        </div>
      `}
      ${results.map(p => html`
        <button
          key=${p.offCode || p.name}
          onClick=${() => { onSelect(p); onClose(); }}
          style=${{
            width: '100%',
            background: '#1a1a12',
            border: '1px solid #2a2a1f',
            borderRadius: '8px',
            padding: '8px 10px',
            marginBottom: '4px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style=${{ fontSize: '12px', color: COLORS.text, fontWeight: 600, fontFamily: FONTS.sans }}>
            ${p.name}
          </div>
          <div style=${{ fontSize: '10px', color: COLORS.textMuted, fontFamily: FONTS.mono, marginTop: '2px' }}>
            ${p.kcal100} kcal · ${p.p100}g P · ${p.c100}g KH · ${p.f100}g F / 100g
          </div>
        </button>
      `)}
    </div>
  `;
}
