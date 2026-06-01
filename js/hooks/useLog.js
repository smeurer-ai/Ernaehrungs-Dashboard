import { useState, useEffect, useCallback } from '../lib.js';
import { getLogForDate, saveLogEntry } from '../storage/indexeddb.js';

/**
 * React-Hook für das Tages-Tagebuch.
 *
 * Gibt die Einträge für `date` zurück und Funktionen zum Hinzufügen,
 * Aktualisieren und Löschen einzelner TrackedFood-Einträge.
 *
 * @param {string} date - "YYYY-MM-DD"
 * @param {{ dayType: string, trainingTime?: string }} dayMeta
 */
export function useLog(date, dayMeta) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Log für heute laden
  useEffect(() => {
    setLoading(true);
    getLogForDate(date).then(log => {
      setEntries(log?.entries ?? []);
      setLoading(false);
    });
  }, [date]);

  // Hilfsfunktion: aktuelle LogEntry-Struktur bauen.
  // Reihenfolge: existing zuerst (preserviert createdAt etc.),
  // dann explizite Felder überschreiben damit dayType/trainingTime
  // nie vom alten existing-Wert verdeckt werden.
  async function buildAndSave(updatedEntries) {
    const existing = await getLogForDate(date);
    await saveLogEntry({
      ...existing,
      date,
      dayType: dayMeta.dayType,
      trainingTime: dayMeta.trainingTime,
      entries: updatedEntries,
    });
    setEntries(updatedEntries);
  }

  const addEntry = useCallback(async (trackedFood) => {
    const current = await getLogForDate(date);
    const updated = [...(current?.entries ?? []), trackedFood];
    await buildAndSave(updated);
  }, [date, dayMeta]);

  const removeEntry = useCallback(async (entryId) => {
    const current = await getLogForDate(date);
    const updated = (current?.entries ?? []).filter(e => e.id !== entryId);
    await buildAndSave(updated);
  }, [date, dayMeta]);

  const updateEntry = useCallback(async (entryId, changes) => {
    const current = await getLogForDate(date);
    const updated = (current?.entries ?? []).map(e =>
      e.id === entryId ? { ...e, ...changes } : e
    );
    await buildAndSave(updated);
  }, [date, dayMeta]);

  return { entries, loading, addEntry, removeEntry, updateEntry };
}
