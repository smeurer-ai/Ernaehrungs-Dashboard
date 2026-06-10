import { useState, useEffect, useCallback } from '../lib.js';
import { getAllMeals, saveMeal, deleteMeal } from '../storage/indexeddb.js';

/**
 * React-Hook für Favoriten-Mahlzeiten (SavedMeal).
 * Lädt alle gespeicherten Mahlzeiten (sortiert nach zuletzt verwendet)
 * und bietet CRUD-Operationen.
 */
export function useSavedMeals() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    getAllMeals().then(m => {
      setMeals(m);
      setLoading(false);
    });
  }, []);

  useEffect(() => { reload(); }, []);

  const addOrUpdateMeal = useCallback(async (meal) => {
    await saveMeal(meal);
    reload();
  }, [reload]);

  const removeMeal = useCallback(async (id) => {
    await deleteMeal(id);
    reload();
  }, [reload]);

  // Beim Eintragen: lastUsed setzen (für „zuletzt verwendet"-Sortierung)
  const markUsed = useCallback(async (meal) => {
    await saveMeal({ ...meal, lastUsed: Date.now() });
    reload();
  }, [reload]);

  return { meals, loading, addOrUpdateMeal, removeMeal, markUsed };
}
