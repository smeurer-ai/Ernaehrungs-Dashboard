import { React } from '../lib.js';
import { COLORS, FONTS } from './theme.js';

/**
 * ErrorBoundary — fängt JavaScript-Fehler in der Komponenten-Hierarchie ab.
 * Zeigt einen lesbaren Fehler-Bildschirm statt einer weißen Seite.
 *
 * Muss eine Class-Komponente sein — React-Hooks unterstützen
 * getDerivedStateFromError / componentDidCatch nicht.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Unbehandelter Fehler:', error, info);
    this.setState({ info });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const msg = this.state.error?.message || 'Unbekannter Fehler';

    return React.createElement('div', {
      style: {
        minHeight: '100vh',
        background: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }
    },
      React.createElement('div', {
        style: {
          background: '#1e0a0a',
          border: `1px solid ${COLORS.error}`,
          borderRadius: '12px',
          padding: '28px 24px',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
        }
      },
        React.createElement('div', { style: { fontSize: '36px', marginBottom: '12px' } }, '⚠️'),
        React.createElement('div', {
          style: {
            fontSize: '15px',
            fontWeight: 700,
            color: COLORS.text,
            marginBottom: '10px',
            fontFamily: FONTS.sans,
          }
        }, 'Etwas ist schiefgelaufen'),
        React.createElement('div', {
          style: {
            fontSize: '11px',
            color: COLORS.error,
            fontFamily: FONTS.mono,
            background: '#2a0a0a',
            borderRadius: '6px',
            padding: '10px 12px',
            marginBottom: '20px',
            wordBreak: 'break-word',
            textAlign: 'left',
          }
        }, msg),
        React.createElement('button', {
          onClick: () => window.location.reload(),
          style: {
            background: COLORS.gold,
            color: '#111',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            fontSize: '12px',
            fontWeight: 700,
            fontFamily: FONTS.mono,
            cursor: 'pointer',
            letterSpacing: '0.06em',
          }
        }, 'App neu laden')
      )
    );
  }
}
