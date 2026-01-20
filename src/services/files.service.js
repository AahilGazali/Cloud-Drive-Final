/**
 * Files Service - Handles all file-related API calls
 * 
 * Responsibilities:
 * - List files in a folder
 * - Upload files
 * - Download files (get signed URLs)
 * - Delete files
 * - Rename/move files
 * 
 * Import rules:
 * - Can import: apiClient
 * - Should NOT import: components, hooks, context
 */

import apiClient from './apiClient';

export const filesService = {
  /**
   * List files in a folder
   * GET /api/files?folderId=xxx
   */
  listFiles: async (folderId = null) => {
    const query = folderId ? `?folderId=${folderId}` : '';
    return apiClient.get(`/files${query}`);
  },

  /**
   * Upload a file
   * POST /api/files
   * FormData with 'file' field
   */
  uploadFile: async (file, folderId = null) => {
    if (!file) {
      throw new Error('No file provided');
    }

    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', folderId);
    }

    // Override Content-Type for FormData
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/files`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type header - browser will set it with boundary for FormData
          },
          body: formData,
        }
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `Upload failed with status ${response.status}` };
        }
        // Handle both error formats: { message: "..." } or { success: false, message: "..." }
        const errorMessage = errorData.message || errorData.error || `Upload failed (${response.status})`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      // Handle response format: { success: true, data: { file: {...} } }
      return result.data?.file || result.file || result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error.message || 'Upload failed');
    }
  },

  /**
   * Get signed URL for file download
   * GET /api/files/:id/signed-url
   */
  getSignedUrl: async (fileId) => {
    return apiClient.get(`/files/${fileId}/signed-url`);
  },

  /**
   * Download a file
   * Fetches the file and triggers browser download
   */
  downloadFile: async (fileId) => {
    try {
      const response = await apiClient.get(`/files/${fileId}/signed-url`);
      // Backend returns { success: true, data: { url, file } }
      const signedUrl = response?.data?.url || response?.url;
      const file = response?.data?.file || response?.file;
      
      if (!signedUrl) {
        throw new Error('No download URL received from server');
      }

      // Fetch the file as a blob
      const fileResponse = await fetch(signedUrl);
      if (!fileResponse.ok) {
        // Check if it's a 404 or other error
        if (fileResponse.status === 404) {
          throw new Error('File not found in storage. The file may have been deleted or moved.');
        }
        throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
      }

      const blob = await fileResponse.blob();
      
      // Create a temporary download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file?.name || 'download';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      // Provide more specific error messages
      const errorMessage = error.message || 'Failed to download file';
      
      // Check if it's a network error
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      // Check if it's a not found error
      if (errorMessage.includes('not found') || errorMessage.includes('Object not found')) {
        throw new Error('File not found. The file may have been deleted or moved.');
      }
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Delete a file
   * DELETE /api/files/:id
   */
  deleteFile: async (fileId) => {
    return apiClient.delete(`/files/${fileId}`);
  },

  /**
   * Rename a file
   * PATCH /api/files/:id/rename
   */
  renameFile: async (fileId, newName) => {
    return apiClient.patch(`/files/${fileId}/rename`, { name: newName });
  },

  /**
   * Move a file to different folder
   * PATCH /api/files/:id/move
   */
  moveFile: async (fileId, folderId) => {
    return apiClient.patch(`/files/${fileId}/move`, { folderId });
  },

  /**
   * Copy a file (duplicate)
   * POST /api/files/:id/copy
   */
  copyFile: async (fileId, folderId = null) => {
    return apiClient.post(`/files/${fileId}/copy`, { folderId });
  },
};
