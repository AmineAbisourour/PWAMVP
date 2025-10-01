import { useState, useEffect, useCallback } from 'react';
import {
  getAllItems,
  addItem,
  updateItem,
  deleteItem,
  clearAllItems,
  getItemCount,
} from '../db/database';

export function useIndexedDB() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all items from IndexedDB
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allItems = await getAllItems();
      setItems(allItems);
    } catch (err) {
      console.error('Error loading items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load items on mount
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Add a new item
  const create = useCallback(async (item) => {
    try {
      setError(null);
      const id = await addItem(item);
      await loadItems(); // Reload items
      return id;
    } catch (err) {
      console.error('Error adding item:', err);
      setError(err.message);
      throw err;
    }
  }, [loadItems]);

  // Update an existing item
  const update = useCallback(async (id, updates) => {
    try {
      setError(null);
      await updateItem(id, updates);
      await loadItems(); // Reload items
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err.message);
      throw err;
    }
  }, [loadItems]);

  // Delete an item
  const remove = useCallback(async (id) => {
    try {
      setError(null);
      await deleteItem(id);
      await loadItems(); // Reload items
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err.message);
      throw err;
    }
  }, [loadItems]);

  // Clear all items
  const clearAll = useCallback(async () => {
    try {
      setError(null);
      await clearAllItems();
      setItems([]);
    } catch (err) {
      console.error('Error clearing items:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Get item count
  const count = useCallback(async () => {
    try {
      return await getItemCount();
    } catch (err) {
      console.error('Error getting count:', err);
      return 0;
    }
  }, []);

  return {
    items,
    loading,
    error,
    create,
    update,
    remove,
    clearAll,
    refresh: loadItems,
    count,
  };
}
