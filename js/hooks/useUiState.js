import { useState } from '../lib.js';
import { loadUiState, saveUiState } from '../storage/localStorage.js';

export function useUiState() {
  const [uiState, setUiStateLocal] = useState(() => loadUiState());

  function updateUiState(patch) {
    saveUiState(patch);
    setUiStateLocal(prev => ({ ...prev, ...patch }));
  }

  return [uiState, updateUiState];
}
