/**
 * Folders Service - Handles all folder-related API calls
 * 
 * Responsibilities:
 * - List folders
 * - Create folders
 * - Rename folders
 * - Delete folders
 * - Move folders
 * 
 * Import rules:
 * - Can import: apiClient
 * - Should NOT import: components, hooks, context
 */

import apiClient from './apiClient';

export const foldersService = {
  /**
   * List folders (optionally filtered by parent)
   * GET /api/folders?parentId=xxx
   */
  listFolders: async (parentId = null) => {
    // Backend expects parentId as query param, or "null" string for root folders
    let query = '';
    if (parentId === null || parentId === undefined) {
      query = '?parentId=null';
    } else {
      query = `?parentId=${parentId}`;
    }
    return apiClient.get(`/folders${query}`);
  },

  /**
   * Create a new folder
   * POST /api/folders
   */
  createFolder: async (name, parentId = null) => {
    const body = { name };
    // Only include parentId if it's not null
    if (parentId !== null && parentId !== undefined) {
      body.parentId = parentId;
    }
    return apiClient.post('/folders', body);
  },

  /**
   * Delete a folder (soft delete - move to trash)
   * DELETE /api/folders/:id
   */
  deleteFolder: async (folderId) => {
    return apiClient.delete(`/folders/${folderId}`);
  },

  /**
   * Move a folder to different parent
   * PATCH /api/folders/:id/move
   */
  moveFolder: async (folderId, newParentId) => {
    return apiClient.patch(`/folders/${folderId}/move`, { newParentId });
  },
};
