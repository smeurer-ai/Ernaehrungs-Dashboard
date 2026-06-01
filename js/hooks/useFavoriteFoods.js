import { useState, useEffect, useCallback } from '../lib.js';
import {
  getAllFavoriteFoods,
  saveFavoriteFood,
  deleteFavoriteFood,
} from '../storage/indexeddb.js';

/**
 * React-Hook für Favoriten-Lebensmittel.
 * Lädt alle gespeicherten Favoriten und bietet CRUD-Operationen.
 */
export function useFavoriteFoods() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    getAllFavoriteFoods().then(foods => {
      setFavorites(foods);
      setLoading(false);
    });
  }, []);

  useEffect(() => { reload(); }, []);

  const addFavorite = useCallback(async (food) => {
    await saveFavoriteFood(food);
    reload();
  }, [reload]);

  const removeFavorite = useCallback(async (id) => {
    await deleteFavoriteFood(id);
    reload();
  }, [reload]);

  return { favorites, loading, addFavorite, removeFavorite };
}
