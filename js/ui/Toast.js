import { html, useState, createContext, useContext } from '../lib.js';
import { COLORS, FONTS } from './theme.js';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function showToast(message, type = 'info') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }

  const bgColor = type => type === 'error' ? '#3a1515' : type === 'success' ? '#153a15' : '#1a1a2e';
  const borderColor = type => type === 'error' ? COLORS.error : type === 'success' ? COLORS.success : COLORS.gold;

  return html`
    <${ToastContext.Provider} value=${showToast}>
      ${children}
      <div style=${{ position: 'fixed', bottom: '72px', left: '50%', transform: 'translateX(-50%)', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '8px', width: '90%', maxWidth: '400px' }}>
        ${toasts.map(t => html`
          <div key=${t.id} style=${{
            background: bgColor(t.type), border: `1px solid ${borderColor(t.type)}`,
            borderRadius: '8px', padding: '12px 16px', fontSize: '12px', color: COLORS.text,
            fontFamily: FONTS.sans, boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
          }}>
            ${t.message}
          </div>
        `)}
      </div>
    </${ToastContext.Provider}>
  `;
}

export function useToast() {
  return useContext(ToastContext);
}
