import { html, useState } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { exportAll, importAll } from '../../storage/exportImport.js';

export function DataManagement({ settings, onSettingsUpdate }) {
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  async function handleExport() {
    const blob = await exportAll();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `ernaehrung-export-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onSettingsUpdate({ lastBackupAt: Date.now() });
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const confirmed = window.confirm('Alle vorhandenen Daten werden ersetzt. Fortfahren?');
    if (!confirmed) return;
    setImporting(true);
    setImportStatus(null);
    const result = await importAll(file, { mode: 'replace' });
    setImporting(false);
    if (result.ok) {
      setImportStatus({ type: 'success', message: 'Import erfolgreich. Seite wird neu geladen…' });
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setImportStatus({ type: 'error', message: result.error || 'Import fehlgeschlagen.' });
    }
  }

  const daysSince = settings.lastBackupAt
    ? Math.round((Date.now() - settings.lastBackupAt) / (1000 * 60 * 60 * 24))
    : null;

  return html`
    <div style=${S.card}>
      <div style=${S.cardTitle}>Daten-Management</div>
      <div style=${{ fontSize: '11px', color: COLORS.textMuted, marginBottom: '14px', fontFamily: FONTS.mono }}>
        ${daysSince !== null ? `Letztes Backup: vor ${daysSince} ${daysSince === 1 ? 'Tag' : 'Tagen'}` : 'Noch kein Backup erstellt'}
      </div>
      <button onClick=${handleExport} style=${{ ...S.btn(), width: '100%', marginBottom: '10px' }}>
        📤 Daten exportieren (JSON)
      </button>
      <label style=${{ display: 'block' }}>
        <input type="file" accept=".json" onChange=${handleImport} style=${{ display: 'none' }} />
        <div style=${{ ...S.btn('#333', COLORS.text), width: '100%', textAlign: 'center', cursor: 'pointer' }}>
          ${importing ? '⏳ Importiere…' : '📥 Daten importieren'}
        </div>
      </label>
      ${importStatus && html`
        <div style=${{
          marginTop: '10px', padding: '10px 12px', borderRadius: '6px', fontSize: '12px',
          background: importStatus.type === 'success' ? '#153a15' : '#3a1515',
          color: importStatus.type === 'success' ? COLORS.success : COLORS.error,
          border: `1px solid ${importStatus.type === 'success' ? COLORS.success : COLORS.error}`
        }}>
          ${importStatus.message}
        </div>
      `}
    </div>
  `;
}
