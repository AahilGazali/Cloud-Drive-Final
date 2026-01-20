/**
 * Feedback Service - Handles feedback API calls
 */

import apiClient from './apiClient';

export const feedbackService = {
  /**
   * Setup feedback table (one-time)
   * POST /api/feedback/setup
   */
  setupFeedbackTable: async () => {
    return apiClient.post('/feedback/setup', {});
  },

  /**
   * Submit feedback
   * POST /api/feedback
   */
  submitFeedback: async (feedback) => {
    return apiClient.post('/feedback', { feedback });
  },

  /**
   * Get user's feedback history
   * GET /api/feedback
   */
  getUserFeedback: async () => {
    return apiClient.get('/feedback');
  },

  /**
   * Get all feedback (admin)
   * GET /api/feedback/all
   */
  getAllFeedback: async () => {
    return apiClient.get('/feedback/all');
  },
};
