/**
 * DeleteConfirmModal Component - Modal for confirming delete operations
 */

import React from 'react';

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  itemName,
  itemType = 'file', // 'file' or 'folder'
  isPermanent = false, // true for permanent delete (trash), false for move to trash
  itemCount = 1 // for bulk operations
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      // Don't call onClose here - let the parent component handle it
      // This allows async operations to complete before modal closes
    } catch (error) {
      // Error handling is done in parent component
      console.error('Confirm action error:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const getTitle = () => {
    if (isPermanent) {
      return itemCount > 1 
        ? `Permanently delete ${itemCount} items?`
        : `Permanently delete ${itemName || `this ${itemType}`}?`;
    }
    return itemCount > 1
      ? `Move ${itemCount} items to trash?`
      : `Move ${itemName || `this ${itemType}`} to trash?`;
  };

  const getMessage = () => {
    if (isPermanent) {
      return itemCount > 1
        ? 'These items will be permanently deleted and cannot be recovered. This action cannot be undone.'
        : 'This item will be permanently deleted and cannot be recovered. This action cannot be undone.';
    }
    return itemCount > 1
      ? 'These items will be moved to trash. You can restore them later from the Trash page.'
      : 'This item will be moved to trash. You can restore it later from the Trash page.';
  };

  return (
    <div 
      className="delete-modal-overlay" 
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delete-modal-header">
          <div className="delete-modal-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path 
                d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" 
                stroke={isPermanent ? "#ef4444" : "#f59e0b"} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="delete-modal-title">{getTitle()}</h2>
        </div>

        <div className="delete-modal-content">
          <p className="delete-modal-message">{getMessage()}</p>
        </div>

        <div className="delete-modal-footer">
          <button 
            type="button" 
            className="delete-modal-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className={`delete-modal-confirm ${isPermanent ? 'delete-permanent' : ''}`}
            onClick={handleConfirm}
          >
            {isPermanent ? 'Delete permanently' : 'Move to trash'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
