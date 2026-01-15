/**
 * useFolderNavigation Hook - Manages folder navigation state
 * 
 * Responsibilities:
 * - Track current folder path (breadcrumbs)
 * - Handle folder navigation (enter/back)
 * - Maintain navigation history
 * 
 * Import rules:
 * - Should NOT import: services, components, pages
 * - Pure state management hook
 */

import { useState, useCallback } from 'react';

export const useFolderNavigation = () => {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Home' }]);

  const navigateToFolder = useCallback((folderId, folderName) => {
    setCurrentFolderId(folderId);
    setBreadcrumbs((prev) => {
      // Remove any breadcrumbs after the clicked folder
      const index = prev.findIndex((b) => b.id === folderId);
      if (index !== -1) {
        return prev.slice(0, index + 1);
      }
      // Add new breadcrumb
      return [...prev, { id: folderId, name: folderName }];
    });
  }, []);

  const navigateBack = useCallback((targetFolderId) => {
    setCurrentFolderId(targetFolderId);
    setBreadcrumbs((prev) => {
      const index = prev.findIndex((b) => b.id === targetFolderId);
      return prev.slice(0, index + 1);
    });
  }, []);

  const navigateToRoot = useCallback(() => {
    setCurrentFolderId(null);
    setBreadcrumbs([{ id: null, name: 'Home' }]);
  }, []);

  return {
    currentFolderId,
    breadcrumbs,
    navigateToFolder,
    navigateBack,
    navigateToRoot,
  };
};
