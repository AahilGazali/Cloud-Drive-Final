/**
 * Trash Service - Handles all trash-related API calls
 * 
 * Responsibilities:
 * - List deleted items
 * - Restore items
 * - Permanently delete items
 * 
 * Import rules:
 * - Can import: apiClient
 * - Should NOT import: components, hooks, context
 */

import apiClient from './apiClient';

export const trashService = {
  /**
   * List items in trash
   * GET /api/trash
   */
  listTrash: async () => {
    return apiClient.get('/trash');
  },

  /**
   * Restore an item from trash
   * POST /api/trash/restore
   */
  restoreItem: async (itemId, itemType) => {
    return apiClient.post('/trash/restore', { type: itemType, id: itemId });
  },

  /**
   * Permanently delete an item
   * DELETE /api/trash/:id
   * body: { type: "file" | "folder" }
   */
  permanentlyDelete: async (itemId, itemType) => {
    const token = localStorage.getItem('authToken');
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    const response = await fetch(`${API_BASE_URL}/trash/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ type: itemType }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Delete failed' }));
      throw new Error(error.message || 'Delete failed');
    }

    return response.json();
  },
};
