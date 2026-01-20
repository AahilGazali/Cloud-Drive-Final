/**
 * RenameModal Component - Modal for renaming files/folders
 */

import React, { useState, useEffect } from 'react';

const RenameModal = ({ 
  isOpen, 
  onClose, 
  currentName,
  itemType = 'file', // 'file' or 'folder'
  onRename 
}) => {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (currentName) {
        // Extract name without extension for files
        if (itemType === 'file') {
          const lastDot = currentName.lastIndexOf('.');
          const nameWithoutExt = lastDot > 0 ? currentName.substring(0, lastDot) : currentName;
          setNewName(nameWithoutExt);
        } else {
          setNewName(currentName);
        }
      } else {
        // Empty name means creating new folder
        setNewName('');
      }
      setError(null);
    }
  }, [isOpen, currentName, itemType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!newName || !newName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    const trimmedName = newName.trim();
    
    // If creating new folder (no currentName), just use trimmed name
    if (!currentName) {
      // This is a create operation
      await onRename(trimmedName);
      onClose();
      return;
    }
    
    // For files, preserve the extension
    let finalName = trimmedName;
    if (itemType === 'file' && currentName) {
      const lastDot = currentName.lastIndexOf('.');
      if (lastDot > 0) {
        const extension = currentName.substring(lastDot);
        finalName = trimmedName + extension;
      }
    }

    if (finalName === currentName) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await onRename(finalName);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to rename');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rename-modal-overlay" onClick={onClose}>
      <div className="rename-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rename-modal-header">
          <h2 className="rename-modal-title">
            {currentName ? `Rename ${itemType === 'file' ? 'File' : 'Folder'}` : 'New Folder'}
          </h2>
          <button 
            className="rename-modal-close" 
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form className="rename-modal-content" onSubmit={handleSubmit}>
          <div className="rename-input-wrapper">
            <label htmlFor="rename-input" className="rename-input-label">
              New name
            </label>
            <input
              id="rename-input"
              type="text"
              className={`rename-input ${error ? 'input-error' : ''}`}
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              disabled={loading}
              placeholder={`Enter ${itemType} name`}
            />
            {error && (
              <div className="rename-error">{error}</div>
            )}
            {itemType === 'file' && currentName && (
              <div className="rename-hint">
                Extension will be preserved: {currentName.substring(currentName.lastIndexOf('.'))}
              </div>
            )}
          </div>

          <div className="rename-modal-footer">
            <button 
              type="button" 
              className="rename-modal-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="rename-modal-rename"
              disabled={loading || !newName.trim()}
            >
              {loading ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModal;
