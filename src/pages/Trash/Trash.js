/**
 * Trash Page - Shows deleted items
 * 
 * Responsibilities:
 * - Display items in trash
 * - Allow restore and permanent delete
 */

import React from 'react';
import { useTrash } from '../../hooks/useTrash';
import FileItem from '../../components/FileItem/FileItem';
import FolderItem from '../../components/FolderItem/FolderItem';

const Trash = () => {
  const { trashItems, loading, error, restoreItem, permanentlyDelete } = useTrash();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading trash...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trash-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p className="error-message">Error: {error}</p>
          <button className="btn-retry" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleRestore = async (itemId, itemType) => {
    try {
      await restoreItem(itemId, itemType);
    } catch (error) {
      alert(`Failed to restore: ${error.message}`);
    }
  };

  const handleDelete = async (itemId, itemType) => {
    if (window.confirm('Are you sure you want to permanently delete this item? This cannot be undone.')) {
      try {
        await permanentlyDelete(itemId, itemType);
      } catch (error) {
        alert(`Failed to delete: ${error.message}`);
      }
    }
  };

  return (
    <div className="trash-page">
      {trashItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <div className="empty-illustration">
              <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="trashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#9E9E9E', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#616161', stopOpacity: 1}} />
                  </linearGradient>
                </defs>
                <rect x="60" y="50" width="80" height="100" rx="4" fill="url(#trashGradient)" opacity="0.9"/>
                <path d="M70 50L75 30H125L130 50" fill="url(#trashGradient)" opacity="0.9"/>
                <line x1="85" y1="80" x2="85" y2="130" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round"/>
                <line x1="115" y1="80" x2="115" y2="130" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="empty-hint">Deleted items will appear here</p>
          </div>
        </div>
      ) : (
        <div className="file-grid">
          <div className="file-grid-header">
            <div className="file-header-name">Name</div>
            <div className="file-header-meta">Size</div>
            <div className="file-header-actions"></div>
          </div>
          {trashItems.map((item) => (
            <div key={item.id} className="trash-item-wrapper">
              {item.resource_type === 'folder' ? (
                <FolderItem
                  folder={item}
                  onNavigate={() => {}} // Disabled in trash
                />
              ) : (
              <FileItem
                file={item}
                onDownload={() => {}} // Disabled in trash
                onDelete={() => {}} // Disabled in trash
              />
            )}
              <div className="trash-actions">
                <button
                  className="btn-restore"
                  onClick={() => handleRestore(item.id, item.resource_type)}
                  title="Restore"
                >
                  Restore
                </button>
                <button
                  className="btn-delete-permanent"
                  onClick={() => handleDelete(item.id, item.resource_type)}
                  title="Delete permanently"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trash;
