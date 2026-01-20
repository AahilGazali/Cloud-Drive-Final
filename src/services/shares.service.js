/**
 * Shares Service - Handles all sharing-related API calls
 * 
 * Responsibilities:
 * - Share files/folders with users
 * - List shares
 * - Create public links
 * - Revoke shares
 * 
 * Import rules:
 * - Can import: apiClient
 * - Should NOT import: components, hooks, context
 */

import apiClient from './apiClient';

export const sharesService = {
  /**
   * Share a file or folder with a user
   * POST /api/shares
   */
  shareResource: async (resourceType, resourceId, targetUserId, role = 'VIEWER', options = {}) => {
    return apiClient.post('/shares', {
      resourceType,
      resourceId,
      targetUserId,
      role,
      sendEmail: options.sendEmail || false,
      recipientEmail: options.recipientEmail || null,
      itemName: options.itemName || null,
      shareLink: options.shareLink || null
    });
  },

  /**
   * List all shares for a resource
   * GET /api/shares?resourceType=file&resourceId=123
   */
  listShares: async (resourceType, resourceId) => {
    return apiClient.get(`/shares?resourceType=${resourceType}&resourceId=${resourceId}`);
  },

  /**
   * Create a public link for a resource
   * POST /api/shares/link
   */
  createPublicLink: async (resourceType, resourceId) => {
    return apiClient.post('/shares/link', {
      resourceType,
      resourceId
    });
  },

  /**
   * Revoke a share
   * POST /api/shares/revoke
   */
  revokeShare: async (shareId) => {
    return apiClient.post('/shares/revoke', {
      shareId
    });
  },

  /**
   * Share by email - sends file/folder directly to email addresses
   * POST /api/shares/email
   */
  shareByEmail: async (resourceType, resourceId, recipientEmails, itemName, role = 'VIEWER') => {
    return apiClient.post('/shares/email', {
      resourceType,
      resourceId,
      recipientEmails: Array.isArray(recipientEmails) ? recipientEmails : [recipientEmails],
      itemName,
      role
    });
  }
};

export default sharesService;
