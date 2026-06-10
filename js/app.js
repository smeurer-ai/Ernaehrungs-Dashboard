import { React, html, useState, useEffect, createRoot } from './lib.js';
import { runMigrations } from './storage/migrations.js';
import { useProfile } from './hooks/useProfile.js';
import { useSettings } from './hooks/useSettings.js';
import { useUiState } from './hooks/useUiState.js';
import { ToastProvider } from './ui/Toast.js';
import { ErrorBoundary } from './ui/ErrorBoundary.js';
import { Navigation } from './ui/Navigation.js';
import { BackupReminderBanner } from './ui/BackupReminderBanner.js';
import { UpdateBanner } from './ui/UpdateBanner.js';
import { HeuteTab } from './tabs/heute/HeuteTab.js';
import { TrackerTab } from './tabs/tracker/TrackerTab.js';
import { RezepteTab } from './tabs/rezepte/RezepteTab.js';
import { WocheTab } from './tabs/woche/WocheTab.js';
import { ProfilTab } from './tabs/profil/ProfilTab.js';
import { ErststartAssistent } from './tabs/profil/ErststartAssistent.js';
import { exportAll } from './storage/exportImport.js';
import { localDateString } from './calc/dates.js';
import { registerServiceWorker } from './pwa/registerServiceWorker.js';
import { S, COLORS, FONTS } from './ui/theme.js';

function App() {
  const [profile, setProfile, calculated] = useProfile();
  const [settings, updateSettings] = useSettings();
  const [uiState, updateUiState] = useUiState();
  const [migrationError, setMigrationError] = useState(null);
  const [migrationDone, setMigrationDone] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  useEffect(() => {
    runMigrations().then(result => {
      if (!result.ok) setMigrationError(result.error);
      setMigrationDone(true);
    });
  }, []);

  useEffect(() => {
    registerServiceWorker(registration => {
      setSwRegistration(registration);
    });
  }, []);

  if (!migrationDone) {
    return html`
      <div style=${{ ...S.app, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style=${{ textAlign: 'center', color: COLORS.textMuted }}>
          <div style=${{ fontSize: '32px', marginBottom: '16px' }}>🥗</div>
          <div style=${{ fontFamily: FONTS.mono, fontSize: '12px' }}>Starte…</div>
        </div>
      </div>
    `;
  }

  if (migrationError) {
    return html`
      <div style=${{ ...S.app, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style=${{ background: '#3a1515', border: '1px solid #e05c5c', borderRadius: '12px', padding: '24px', maxWidth: '360px', textAlign: 'center' }}>
          <div style=${{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
          <div style=${{ fontSize: '14px', fontWeight: 600, color: '#f0ece4', marginBottom: '8px' }}>Fehler beim Start</div>
          <div style=${{ fontSize: '11px', color: '#e05c5c', fontFamily: "'DM Mono',monospace", marginBottom: '16px' }}>${migrationError}</div>
          <button onClick=${() => window.location.reload()} style=${{ background: '#c8a96e', color: '#111', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 700 }}>
            Neu laden
          </button>
        </div>
      </div>
    `;
  }

  if (!profile) {
    return html`<${ErststartAssistent} onComplete=${setProfile} />`;
  }

  const activeTab = uiState.activeTab;

  function renderTab() {
    switch (activeTab) {
      case 'heute': {
        const effectiveDurationMin = uiState.preferredTrainingDurationMin ?? profile?.trainingDurationMin ?? 60;
        return html`<${HeuteTab}
          profile=${profile}
          calculated=${calculated}
          dayType=${uiState.preferredDayType}
          trainingTime=${uiState.preferredTrainingTime}
          trainingDurationMin=${effectiveDurationMin}
          onUiStateUpdate=${updateUiState}
        />`;
      }
      case 'tracker': return html`
        <${TrackerTab}
          dayType=${uiState.preferredDayType}
          trainingTime=${uiState.preferredTrainingTime}
          wakeUpTime=${profile?.wakeUpTime}
          trainingDurationMin=${uiState.preferredTrainingDurationMin ?? profile?.trainingDurationMin ?? 60}
          calculated=${calculated}
        />
      `;
      case 'rezepte': return html`<${RezepteTab} />`;
      case 'woche':   return html`<${WocheTab} />`;
      case 'profil':  return html`
        <${ProfilTab}
          profile=${profile}
          calculated=${calculated}
          onProfileSave=${setProfile}
          settings=${settings}
          onSettingsUpdate=${updateSettings}
        />
      `;
      default: return html`<${HeuteTab} profile=${profile} calculated=${calculated} />`;
    }
  }

  async function handleBannerExport() {
    const blob = await exportAll();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ernaehrung-export-${localDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    updateSettings({ lastBackupAt: Date.now() });
  }

  return html`
    <div style=${S.app}>
      <${UpdateBanner} registration=${swRegistration} />
      <${BackupReminderBanner} settings=${settings} onExport=${handleBannerExport} />
      <div style=${S.header}>
        <div style=${S.title}>Ernährungs-Tool</div>
        <div style=${S.sub}>Stephanie Meurer · Postmenopause & Krafttraining</div>
      </div>
      ${renderTab()}
      <${Navigation} activeTab=${activeTab} onTabChange=${tab => updateUiState({ activeTab: tab })} />
    </div>
  `;
}

createRoot(document.getElementById('root')).render(
  html`<${ErrorBoundary}><${ToastProvider}><${App} /></${ToastProvider}></${ErrorBoundary}>`
);
