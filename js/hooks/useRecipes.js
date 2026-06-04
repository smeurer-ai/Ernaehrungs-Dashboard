import { useState, useEffect, useCallback } from '../lib.js';
import {
  getAllCustomRecipes,
  saveCustomRecipe,
  deleteCustomRecipe,
} from '../storage/indexeddb.js';

export function useRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    getAllCustomRecipes().then(data => {
      setRecipes(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { reload(); }, []);

  const saveRecipe = useCallback(async (recipe) => {
    await saveCustomRecipe(recipe);
    reload();
  }, [reload]);

  const removeRecipe = useCallback(async (id) => {
    await deleteCustomRecipe(id);
    reload();
  }, [reload]);

  return { recipes, loading, saveRecipe, removeRecipe };
}
