/**
 * useTrash Hook - Custom hook for trash operations
 * 
 * Responsibilities:
 * - Fetch trash items
 * - Handle restore and permanent delete
 */

import { useState, useEffect, useCallback } from 'react';
import { trashService } from '../services';

export const useTrash = () => {
  const [trashItems, setTrashItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrash = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await trashService.listTrash();
      // Backend returns { success: true, data: { files: [...], folders: [...] } }
      let itemsArray = [];
      
      if (response && response.data) {
        const { files = [], folders = [] } = response.data;
        // Combine files and folders with resource_type
        itemsArray = [
          ...files.map(f => ({ ...f, resource_type: 'file' })),
          ...folders.map(f => ({ ...f, resource_type: 'folder' }))
        ];
      } else if (response && response.files && response.folders) {
        // Direct format
        itemsArray = [
          ...response.files.map(f => ({ ...f, resource_type: 'file' })),
          ...response.folders.map(f => ({ ...f, resource_type: 'folder' }))
        ];
      } else if (Array.isArray(response)) {
        itemsArray = response;
      }
      
      setTrashItems(itemsArray);
    } catch (err) {
      setError(err.message || 'Failed to load trash');
      setTrashItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const restoreItem = async (itemId, itemType) => {
    try {
      await trashService.restoreItem(itemId, itemType);
      await fetchTrash(); // Refresh list
    } catch (err) {
      throw new Error(err.message || 'Failed to restore item');
    }
  };

  const permanentlyDelete = async (itemId, itemType) => {
    try {
      await trashService.permanentlyDelete(itemId, itemType);
      await fetchTrash(); // Refresh list
    } catch (err) {
      throw new Error(err.message || 'Failed to delete item');
    }
  };

  return {
    trashItems,
    loading,
    error,
    refetch: fetchTrash,
    restoreItem,
    permanentlyDelete,
  };
};
