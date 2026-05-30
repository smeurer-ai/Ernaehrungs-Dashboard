import { html } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';

export function SettingsPanel({ settings, onUpdate }) {
  return html`
    <div style=${S.card}>
      <div style=${S.cardTitle}>Einstellungen</div>
      <div style=${{ marginBottom: '16px' }}>
        <label style=${S.label}>Postmenopausale Ernährungshinweise</label>
        <div style=${{ display: 'flex', gap: '8px' }}>
          <button style=${S.toggle(settings.enablePostmenopauseGuidance)} onClick=${() => onUpdate({ enablePostmenopauseGuidance: true })}>An</button>
          <button style=${S.toggle(!settings.enablePostmenopauseGuidance)} onClick=${() => onUpdate({ enablePostmenopauseGuidance: false })}>Aus</button>
        </div>
      </div>
      <div style=${{ marginBottom: '16px' }}>
        <label style=${S.label}>Backup-Erinnerung alle X Tage</label>
        <input
          type="number"
          value=${settings.backupReminderDays}
          min="1" max="30"
          onChange=${e => onUpdate({ backupReminderDays: parseInt(e.target.value) || 7 })}
          style=${{ ...S.input, width: '80px' }}
        />
      </div>
      <div>
        <label style=${S.label}>Betriebsmodus</label>
        <div style=${{ fontSize: '12px', color: COLORS.textMuted, padding: '8px 12px', background: '#141414', borderRadius: '6px', fontFamily: FONTS.mono }}>
          Lokal (Phase 1) — Cloud-Sync folgt später
        </div>
      </div>
    </div>
  `;
}
