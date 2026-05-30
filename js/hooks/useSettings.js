import { useState } from '../lib.js';
import { loadSettings, saveSettings } from '../storage/localStorage.js';

export function useSettings() {
  const [settings, setSettingsState] = useState(() => loadSettings());

  function updateSettings(patch) {
    saveSettings(patch);  // merge passiert in localStorage.js
    setSettingsState(prev => ({ ...prev, ...patch }));
  }

  return [settings, updateSettings];
}
