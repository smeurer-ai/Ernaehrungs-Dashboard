import { html } from '../../lib.js';
import { ProfileEditor } from './ProfileEditor.js';
import { DataManagement } from './DataManagement.js';
import { SettingsPanel } from './SettingsPanel.js';
import { PostmenopausalInfo } from './PostmenopausalInfo.js';
import { S } from '../../ui/theme.js';
import { useToast } from '../../ui/Toast.js';

export function ProfilTab({ profile, calculated, onProfileSave, settings, onSettingsUpdate }) {
  const showToast = useToast();

  function handleSave(newProfile) {
    onProfileSave(newProfile);
    if (showToast) showToast('Profil gespeichert ✓', 'success');
  }

  return html`
    <div style=${S.content}>
      <div style=${S.header}>
        <div style=${S.title}>Profil</div>
      </div>
      <${ProfileEditor} profile=${profile} calculated=${calculated} onSave=${handleSave} />
      <${DataManagement} settings=${settings} onSettingsUpdate=${onSettingsUpdate} />
      <${SettingsPanel} settings=${settings} onUpdate=${onSettingsUpdate} />
      <${PostmenopausalInfo} />
    </div>
  `;
}
