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

    const response = await apiClient.get(`/search?q=${encodeURIComponent(query.trim())}`);
    return response.data || { files: [], folders: [] };
  },
};

export default searchService;
