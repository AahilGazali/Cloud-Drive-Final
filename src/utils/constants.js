/**
 * Constants - Application-wide constants
 * 
 * Responsibilities:
 * - Store API endpoints
 * - Store configuration values
 * - Store enum values
 */

export const ROLES = {
  VIEWER: "viewer",
  EDITOR: "editor",
};

export const RESOURCE_TYPE = {
  FILE: "file",
  FOLDER: "folder",
};

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/auth/signup',
    SIGNIN: '/auth/signin',
    SIGNOUT: '/auth/signout',
  },
  FILES: {
    LIST: '/files',
    UPLOAD: '/files',
    DOWNLOAD: '/files/:id/signed-url',
    DELETE: '/files/:id',
  },
  FOLDERS: {
    LIST: '/folders',
    CREATE: '/folders',
  },
  TRASH: {
    LIST: '/trash',
    RESTORE: '/trash/:id/restore',
    DELETE: '/trash/:id',
  },
};

export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SPREADSHEET: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
