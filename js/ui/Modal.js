import { html } from '../lib.js';
import { COLORS, FONTS } from './theme.js';

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  // Mobile: Bottom-Sheet (Daumen-Reichweite) · Desktop: zentriert
  const isWide = typeof window !== 'undefined'
    && window.matchMedia('(min-width: 600px)').matches;
  return html`
    <div style=${{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 1000, display: 'flex', alignItems: isWide ? 'center' : 'flex-end', justifyContent: 'center'
    }} onClick=${e => e.target === e.currentTarget && onClose()}>
      <div style=${{
        background: '#181818', borderRadius: isWide ? '16px' : '16px 16px 0 0',
        width: '100%', maxWidth: '480px', maxHeight: '85vh',
        overflow: 'auto', padding: '20px 18px 32px'
      }}>
        <div style=${{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          ${title && html`<span style=${{ fontSize: '13px', fontWeight: 600, color: COLORS.text, fontFamily: FONTS.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>${title}</span>`}
          <button onClick=${onClose} style=${{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '20px', padding: '0', marginLeft: 'auto' }}>×</button>
        </div>
        ${children}
      </div>
    </div>
  `;
}
