/**
 * useFiles Hook - Custom hook for file operations
 * 
 * Responsibilities:
 * - Fetch files for a folder
 * - Manage loading and error states
 * - Provide file operations (download, delete)
 * 
 * Import rules:
 * - Can import: services (filesService)
 * - Can import: context (useAuth)
 * - Should NOT import: components, pages
 */

import { useState, useEffect, useCallback } from 'react';
import { filesService } from '../services';

export const useFiles = (folderId = null) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await filesService.listFiles(folderId);
      // Backend returns { success: true, data: { files: [...] } }
      // Extract files array from response
      let filesArray = [];
      if (response && response.data && response.data.files) {
        filesArray = Array.isArray(response.data.files) ? response.data.files : [];
      } else if (response && response.files && Array.isArray(response.files)) {
        filesArray = response.files;
      } else if (Array.isArray(response)) {
        filesArray = response;
      }
      setFiles(filesArray);
    } catch (err) {
      setError(err.message || 'Failed to load files');
      setFiles([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const downloadFile = async (fileId) => {
    try {
      await filesService.downloadFile(fileId);
    } catch (err) {
      throw new Error(err.message || 'Failed to download file');
    }
  };

  return {
    files,
    loading,
    error,
    refetch: fetchFiles,
    downloadFile,
  };
};
