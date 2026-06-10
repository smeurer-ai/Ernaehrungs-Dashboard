import { useState, useEffect, useCallback } from '../lib.js';
import { getAllFridgeItems, saveFridgeItem, deleteFridgeItem, clearFridge } from '../storage/indexeddb.js';

/**
 * React-Hook für den Kühlschrank-Inhalt (Phase 5).
 */
export function useFridge() {
  const [fridgeItems, setFridgeItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    getAllFridgeItems().then(items => {
      setFridgeItems(items);
      setLoading(false);
    });
  }, []);

  useEffect(() => { reload(); }, []);

  const addFridgeItem = useCallback(async (item) => {
    await saveFridgeItem(item);
    reload();
  }, [reload]);

  const removeFridgeItem = useCallback(async (id) => {
    await deleteFridgeItem(id);
    reload();
  }, [reload]);

  const emptyFridge = useCallback(async () => {
    await clearFridge();
    reload();
  }, [reload]);

  return { fridgeItems, loading, addFridgeItem, removeFridgeItem, emptyFridge };
}
