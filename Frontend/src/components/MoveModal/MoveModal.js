/**
 * MoveModal Component - Google Drive-like move dialog
 * 
 * Responsibilities:
 * - Display folder navigation interface
 * - Allow browsing through folders
 * - Show breadcrumbs for current location
 * - Handle file/folder move operation
 */

import React, { useState, useEffect } from 'react';
import { foldersService } from '../../services';
import { filesService } from '../../services';

const MoveModal = ({ 
  isOpen, 
  onClose, 
  item, 
  itemType = 'file', // 'file' or 'folder'
  onMoveComplete 
}) => {
  const [currentFolderId, setCurrentFolderId] = useState(null); // null = root
  const [folders, setFolders] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'My Drive' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      // Reset state when modal opens
      setCurrentFolderId(null);
      setBreadcrumbs([{ id: null, name: 'My Drive' }]);
      setSelectedFolderId(null);
      setError(null);
      // Load root folders
      loadFolders(null);
    }
  }, [isOpen, item]);

  const loadFolders = async (folderId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await foldersService.listFolders(folderId);
      
      // Handle different response formats
      let foldersArray = [];
      if (Array.isArray(response)) {
        foldersArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        foldersArray = response.data;
      } else if (response?.folders && Array.isArray(response.folders)) {
        foldersArray = response.folders;
      }
      
      setFolders(foldersArray);
    } catch (err) {
      setError(err.message || 'Failed to load folders');
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folderId, folderName) => {
    setCurrentFolderId(folderId);
    setSelectedFolderId(folderId);
    // Update breadcrumbs
    const newBreadcrumbs = [...breadcrumbs];
    const existingIndex = newBreadcrumbs.findIndex(b => b.id === folderId);
    if (existingIndex >= 0) {
      // If folder already in breadcrumbs, truncate to that point
      setBreadcrumbs(newBreadcrumbs.slice(0, existingIndex + 1));
    } else {
      // Add new folder to breadcrumbs
      setBreadcrumbs([...newBreadcrumbs, { id: folderId, name: folderName }]);
    }
    loadFolders(folderId);
  };

  const handleBreadcrumbClick = (folderId) => {
    if (folderId === currentFolderId) return;
    
    setCurrentFolderId(folderId);
    setSelectedFolderId(folderId);
    
    // Update breadcrumbs to show path up to clicked folder
    const clickedIndex = breadcrumbs.findIndex(b => b.id === folderId);
    if (clickedIndex >= 0) {
      setBreadcrumbs(breadcrumbs.slice(0, clickedIndex + 1));
    }
    
    loadFolders(folderId);
  };

  const handleMoveHere = async () => {
    if (!item) return;
    
    // Check if trying to move to same location
    const targetFolderId = selectedFolderId || currentFolderId;
    
    try {
      setMoving(true);
      setError(null);
      
      if (itemType === 'file') {
        await filesService.moveFile(item.id, targetFolderId);
      } else {
        // For folders, use folder move service
        await foldersService.moveFolder(item.id, targetFolderId || null);
      }
      
      // Success - close modal and refresh
      if (onMoveComplete) {
        onMoveComplete();
      }
      onClose();
    } catch (err) {
      // Handle specific error messages
      if (err.message?.includes('already in this folder')) {
        setError('This item is already in the selected folder.');
      } else if (err.message?.includes('Not found')) {
        setError('Item not found. It may have been deleted.');
      } else {
        setError(err.message || 'Failed to move item. Please try again.');
      }
    } finally {
      setMoving(false);
    }
  };

  const handleSelectCurrentFolder = () => {
    setSelectedFolderId(currentFolderId);
  };

  if (!isOpen) return null;

  return (
    <div className="move-modal-overlay" onClick={onClose}>
      <div className="move-modal" onClick={(e) => e.stopPropagation()}>
        <div className="move-modal-header">
          <h2 className="move-modal-title">Move to</h2>
          <button 
            className="move-modal-close" 
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
            </svg>
          </button>
        </div>

        <div className="move-modal-content">
          {/* Breadcrumbs */}
          <div className="move-breadcrumbs">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.id || 'root'}>
                <button
                  className={`move-breadcrumb-item ${crumb.id === currentFolderId ? 'active' : ''}`}
                  onClick={() => handleBreadcrumbClick(crumb.id)}
                  type="button"
                >
                  {crumb.name}
                </button>
                {index < breadcrumbs.length - 1 && (
                  <span className="move-breadcrumb-separator">›</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="move-modal-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Folders list */}
          <div className="move-folders-list">
            {loading ? (
              <div className="move-loading">
                <div className="loading-spinner"></div>
                <span>Loading folders...</span>
              </div>
            ) : folders.length === 0 ? (
              <div className="move-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" fill="currentColor" opacity="0.3"/>
                </svg>
                <p>No folders here</p>
              </div>
            ) : (
              folders.map((folder) => (
                <button
                  key={folder.id}
                  className={`move-folder-item ${selectedFolderId === folder.id ? 'selected' : ''}`}
                  onClick={() => handleFolderClick(folder.id, folder.name)}
                  type="button"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" fill="currentColor"/>
                  </svg>
                  <span className="move-folder-name">{folder.name}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="move-folder-arrow">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                  </svg>
                </button>
              ))
            )}
          </div>

          {/* Current location option */}
          <div className="move-current-location">
            <button
              className={`move-location-item ${selectedFolderId === currentFolderId ? 'selected' : ''}`}
              onClick={handleSelectCurrentFolder}
              type="button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" fill="currentColor"/>
              </svg>
              <span className="move-location-name">
                {currentFolderId ? breadcrumbs[breadcrumbs.length - 1]?.name : 'My Drive'}
              </span>
            </button>
          </div>
        </div>

        <div className="move-modal-footer">
          <button 
            className="move-modal-cancel" 
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button 
            className="move-modal-move"
            onClick={handleMoveHere}
            disabled={moving}
            type="button"
          >
            {moving ? 'Moving...' : 'Move here'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveModal;
