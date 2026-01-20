/**
 * useFolders Hook - Custom hook for folder operations
 * 
 * Responsibilities:
 * - Fetch folders for a parent
 * - Manage loading and error states
 * - Provide folder operations (create, navigate)
 * 
 * Import rules:
 * - Can import: services (foldersService)
 * - Can import: context (useAuth)
 * - Should NOT import: components, pages
 */

import { useState, useEffect, useCallback } from 'react';
import { foldersService } from '../services';

export const useFolders = (parentId = null) => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await foldersService.listFolders(parentId);
      // Backend returns array directly: [...]
      // Handle both direct array and wrapped responses
      let foldersArray = [];
      if (Array.isArray(response)) {
        foldersArray = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        foldersArray = response.data;
      } else if (response && response.folders && Array.isArray(response.folders)) {
        foldersArray = response.folders;
      }
      setFolders(foldersArray);
    } catch (err) {
      setError(err.message || 'Failed to load folders');
      setFolders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = async (name) => {
    try {
      const response = await foldersService.createFolder(name, parentId);
      // Backend returns folder directly or wrapped in data
      const newFolder = response.data || response;
      if (newFolder) {
        setFolders((prev) => [...prev, newFolder]);
        return newFolder;
      }
      // If folder created but response format unexpected, refetch
      await fetchFolders();
      return null;
    } catch (err) {
      throw new Error(err.message || 'Failed to create folder');
    }
  };

  return {
    folders,
    loading,
    error,
    refetch: fetchFolders,
    createFolder,
  };
};
