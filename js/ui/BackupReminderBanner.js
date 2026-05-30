import { html, useMemo } from '../lib.js';
import { COLORS, FONTS } from './theme.js';

export function BackupReminderBanner({ settings, onExport }) {
  const needsReminder = useMemo(() => {
    if (!settings.lastBackupAt) return true;
    const daysSince = (Date.now() - settings.lastBackupAt) / (1000 * 60 * 60 * 24);
    return daysSince > settings.backupReminderDays;
  }, [settings.lastBackupAt, settings.backupReminderDays]);

  if (!needsReminder) return null;

  const daysSince = settings.lastBackupAt
    ? Math.round((Date.now() - settings.lastBackupAt) / (1000 * 60 * 60 * 24))
    : null;

  return html`
    <div style=${{
      background: '#1a1500', borderBottom: `1px solid ${COLORS.gold}`,
      padding: '8px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: '11px', color: COLORS.gold, fontFamily: FONTS.mono
    }}>
      <span>
        ${daysSince ? `Letztes Backup: vor ${daysSince} Tagen` : 'Noch kein Backup erstellt'}
      </span>
      <button onClick=${onExport} style=${{
        background: COLORS.gold, color: '#111', border: 'none',
        borderRadius: '4px', padding: '4px 10px', fontSize: '10px',
        fontWeight: 700, fontFamily: FONTS.mono, cursor: 'pointer'
      }}>
        Jetzt sichern
      </button>
    </div>
  `;
}
