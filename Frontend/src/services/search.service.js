/**
 * Search Service - Handle search operations
 * 
 * Responsibilities:
 * - Search files and folders by name
 * - Return search results
 */

import apiClient from './apiClient';

const searchService = {
  /**
   * Search files and folders by name
   * @param {string} query - Search term
   * @returns {Promise<{files: Array, folders: Array}>}
   */
  search: async (query) => {
    if (!query || query.trim() === '') {
      return { files: [], folders: [] };
    }

    try {
      const response = await apiClient.get(`/search?q=${encodeURIComponent(query.trim())}`);
      console.log('Search API response:', response);
      
      // Backend returns { success: true, data: { files: [], folders: [] } }
      if (response.success && response.data) {
        const results = {
          files: Array.isArray(response.data.files) ? response.data.files : [],
          folders: Array.isArray(response.data.folders) ? response.data.folders : []
        };
        console.log('Parsed search results:', results);
        return results;
      }
      
      // Fallback for different response structures
      if (response.files !== undefined || response.folders !== undefined) {
        return {
          files: Array.isArray(response.files) ? response.files : [],
          folders: Array.isArray(response.folders) ? response.folders : []
        };
      }
      
      console.warn('Unexpected search response structure:', response);
      return { files: [], folders: [] };
    } catch (error) {
      console.error('Search service error:', error);
      throw error;
    }
  },
};

export default searchService;
