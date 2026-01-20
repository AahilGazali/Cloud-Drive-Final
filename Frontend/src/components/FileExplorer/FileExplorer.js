/**
 * FileExplorer Component - Main file and folder listing component
 * 
 * Responsibilities:
 * - Display folders and files in current directory
 * - Handle folder navigation
 * - Handle file downloads
 * - Show loading and error states
 * 
 * Import rules:
 * - Can import: hooks (useFiles, useFolders, useFolderNavigation)
 * - Can import: other components (FileItem, FolderItem, Breadcrumbs)
 * - Should NOT import: services, pages
 */

import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useFiles } from '../../hooks/useFiles';
import { useFolders } from '../../hooks/useFolders';
import { useFolderNavigation } from '../../hooks/useFolderNavigation';
import { filesService, foldersService } from '../../services';
import Breadcrumbs from '../Breadcrumbs/Breadcrumbs';
import FolderItem from '../FolderItem/FolderItem';
import FileItem from '../FileItem/FileItem';
import MoveModal from '../MoveModal/MoveModal';
import RenameModal from '../RenameModal/RenameModal';
import DeleteConfirmModal from '../DeleteConfirmModal/DeleteConfirmModal';
import { useToast, ToastContainer } from '../Toast/Toast';

// Helper to get/set view preference
const getViewPreference = () => {
  const saved = localStorage.getItem('fileViewMode');
  return saved === 'grid' ? 'grid' : 'list';
};

const setViewPreference = (view) => {
  localStorage.setItem('fileViewMode', view);
};

const FileExplorer = forwardRef((props, ref) => {
  const { currentFolderId, breadcrumbs, navigateToFolder, navigateBack } = useFolderNavigation();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Toast notifications
  const { toasts, success, error, removeToast } = useToast();
  
  // Rename modal state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameItem, setRenameItem] = useState(null);
  const [renameItemType, setRenameItemType] = useState('file');
  
  // Delete confirm modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteItemType, setDeleteItemType] = useState('file');
  const [deleteItemName, setDeleteItemName] = useState('');
  
  // Move modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveItem, setMoveItem] = useState(null);
  const [moveItemType, setMoveItemType] = useState('file');
  
  const [viewMode, setViewMode] = useState(getViewPreference);
  const [selectedItems, setSelectedItems] = useState(new Set());
  
  const { folders, loading: foldersLoading, createFolder, refetch: refetchFolders } = useFolders(currentFolderId);
  const { files, loading: filesLoading, downloadFile, refetch: refetchFiles } = useFiles(currentFolderId);

  const handleCreateFolder = () => {
    // Use rename modal for creating folder (with empty name)
    setRenameItem({ id: null, name: '' });
    setRenameItemType('folder');
    setShowRenameModal(true);
  };
  
  const handleCreateFolderSubmit = async (folderName) => {
    try {
      await createFolder(folderName);
      await refetchFolders();
      success('Folder created successfully');
      setShowRenameModal(false);
    } catch (err) {
      throw err; // Let RenameModal handle the error display
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    createFolder: handleCreateFolder,
    triggerUpload: triggerUpload,
  }));

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Shared upload function for both file input and drag & drop
  const uploadFiles = async (filesToUpload) => {
    if (!filesToUpload || filesToUpload.length === 0) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const uploadErrors = [];

    try {
      // Upload files sequentially
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        try {
          console.log(`Uploading file: ${file.name} to folder: ${currentFolderId || 'root'}`);
          await filesService.uploadFile(file, currentFolderId);
          setUploadProgress(((i + 1) / filesToUpload.length) * 100);
          console.log(`Successfully uploaded: ${file.name}`);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          uploadErrors.push({ fileName: file.name, error: error.message || 'Upload failed' });
          // Continue with other files even if one fails
        }
      }

      // Show error summary if any files failed
      if (uploadErrors.length > 0) {
        const errorMessage = uploadErrors.length === filesToUpload.length
          ? `Failed to upload all files:\n${uploadErrors.map(e => `- ${e.fileName}: ${e.error}`).join('\n')}`
          : `Some files failed to upload:\n${uploadErrors.map(e => `- ${e.fileName}: ${e.error}`).join('\n')}`;
        error(errorMessage);
      } else if (filesToUpload.length > 0) {
        // Show success message
        success(`${filesToUpload.length} file(s) uploaded successfully`);
      }

      // Wait a bit for backend to process, then refresh
      setTimeout(async () => {
        try {
          await refetchFiles();
          await refetchFolders();
          console.log('Files and folders refreshed');
        } catch (error) {
          console.error('Error refreshing files:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      error(`Failed to upload: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = async (e) => {
    const filesToUpload = Array.from(e.target.files || []);
    if (filesToUpload.length === 0) {
      // Reset input if no files selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    await uploadFiles(filesToUpload);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the main container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handleFolderClick = (folderId, folderName) => {
    navigateToFolder(folderId, folderName);
  };

  const handleBreadcrumbClick = (folderId) => {
    navigateBack(folderId);
  };

  const handleFileDownload = async (fileId) => {
    try {
      await downloadFile(fileId);
    } catch (error) {
      error(`Failed to download: ${error.message}`);
    }
  };

  const handleFileDelete = (fileId) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      setDeleteItem(fileId);
      setDeleteItemType('file');
      setDeleteItemName(file.name);
      setShowDeleteModal(true);
    }
  };

  const handleFolderDelete = (folderId) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setDeleteItem(folderId);
      setDeleteItemType('folder');
      setDeleteItemName(folder.name);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    try {
      if (Array.isArray(deleteItem)) {
        // Bulk delete
        let successCount = 0;
        let failCount = 0;
        for (const itemId of deleteItem) {
          const item = allItems.find(i => i.id === itemId);
          if (item) {
            try {
              if (item.type === 'file') {
                await filesService.deleteFile(itemId);
              } else {
                await foldersService.deleteFolder(itemId);
              }
              successCount++;
            } catch (err) {
              failCount++;
            }
          }
        }
        await refetchFiles();
        await refetchFolders();
        if (failCount === 0) {
          success(`Moved ${successCount} item(s) to trash`);
        } else {
          error(`Moved ${successCount} item(s) to trash, ${failCount} failed`);
        }
      } else if (deleteItemType === 'file') {
        await filesService.deleteFile(deleteItem);
        await refetchFiles();
        success('File moved to trash');
      } else {
        await foldersService.deleteFolder(deleteItem);
        await refetchFolders();
        success('Folder moved to trash');
      }
      setShowDeleteModal(false);
      setSelectedItems(new Set()); // Clear selection after delete
    } catch (err) {
      error(`Failed to delete: ${err.message}`);
    }
  };

  const handleFileRename = (fileId, currentName) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      setRenameItem({ id: fileId, name: currentName });
      setRenameItemType('file');
      setShowRenameModal(true);
    }
  };
  
  const handleRenameSubmit = async (newName) => {
    try {
      // If renameItem.id is null, it's a create folder operation
      if (renameItem.id === null && renameItemType === 'folder') {
        await handleCreateFolderSubmit(newName);
        return;
      }
      
      if (renameItemType === 'file') {
        await filesService.renameFile(renameItem.id, newName);
        await refetchFiles();
        success('File renamed successfully');
      } else {
        await foldersService.renameFolder(renameItem.id, newName);
        await refetchFolders();
        success('Folder renamed successfully');
      }
      setShowRenameModal(false);
    } catch (err) {
      throw err; // Let RenameModal handle the error display
    }
  };

  const handleFileMove = (fileId) => {
    // Find the file to get its details
    const file = files.find(f => f.id === fileId);
    if (file) {
      setMoveItem(file);
      setMoveItemType('file');
      setShowMoveModal(true);
    }
  };

  const handleFileCopy = async (fileId) => {
    try {
      await filesService.copyFile(fileId, currentFolderId);
      await refetchFiles();
      success('File copied successfully!');
    } catch (err) {
      error(`Failed to copy: ${err.message}`);
    }
  };

  const handleFileShare = async (fileId) => {
    try {
      const response = await filesService.getSignedUrl(fileId);
      const signedUrl = response?.data?.url || response?.url;
      if (signedUrl) {
        await navigator.clipboard.writeText(signedUrl);
        alert('Shareable link copied to clipboard!');
      } else {
        alert('Failed to generate share link');
      }
    } catch (error) {
      alert(`Failed to get share link: ${error.message}`);
    }
  };

  const handleFolderRename = (folderId, currentName) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setRenameItem({ id: folderId, name: currentName });
      setRenameItemType('folder');
      setShowRenameModal(true);
    }
  };

  const handleFolderMove = (folderId) => {
    // Find the folder to get its details
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setMoveItem(folder);
      setMoveItemType('folder');
      setShowMoveModal(true);
    }
  };

  const handleMoveComplete = async () => {
    // Refresh files and folders after move
    await refetchFiles();
    if (refetchFolders) {
      await refetchFolders();
    }
  };

  const handleFileStar = async (fileId) => {
    try {
      await filesService.toggleStarFile(fileId);
      await refetchFiles();
    } catch (error) {
      error(`Failed to toggle star: ${error.message}`);
    }
  };

  const handleFolderStar = async (folderId) => {
    try {
      await foldersService.toggleStarFolder(folderId);
      await refetchFolders();
    } catch (error) {
      error(`Failed to toggle star: ${error.message}`);
    }
  };

  const handleFolderCopy = async (folderId) => {
    // TODO: Implement folder copy
    error('Folder copy coming soon!');
  };

  const handleFolderShare = async (folderId) => {
    // Folders don't have direct share URLs, but we can show folder info
    error('Folder sharing coming soon!');
  };

  const handleViewToggle = (mode) => {
    setViewMode(mode);
    setViewPreference(mode);
  };

  const handleItemSelect = (itemId, itemType) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === allItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allItems.map(item => item.id)));
    }
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDownload = async () => {
    for (const itemId of selectedItems) {
      const item = allItems.find(i => i.id === itemId);
      if (item && item.type === 'file') {
        try {
          await downloadFile(itemId);
        } catch (error) {
          console.error(`Failed to download ${item.name}:`, error);
        }
      }
    }
    clearSelection();
  };

  const handleBulkDelete = () => {
    // For bulk delete, show confirmation
    setDeleteItem(Array.from(selectedItems));
    setDeleteItemType('bulk');
    setDeleteItemName('');
    setShowDeleteModal(true);
  };

  const handleBulkShare = async () => {
    const links = [];
    for (const itemId of selectedItems) {
      const item = allItems.find(i => i.id === itemId);
      if (item && item.type === 'file') {
        try {
          const response = await filesService.getSignedUrl(itemId);
          const signedUrl = response?.data?.url || response?.url;
          if (signedUrl) {
            links.push(`${item.name}: ${signedUrl}`);
          }
        } catch (error) {
          console.error(`Failed to get link for ${item.name}:`, error);
        }
      }
    }
    if (links.length > 0) {
      await navigator.clipboard.writeText(links.join('\n\n'));
        success(`${links.length} shareable link(s) copied to clipboard!`);
    }
    clearSelection();
  };

  if (foldersLoading || filesLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Ensure folders and files are arrays before mapping
  const foldersArray = Array.isArray(folders) ? folders : [];
  const filesArray = Array.isArray(files) ? files : [];

  const allItems = [
    ...foldersArray.map(f => ({ ...f, type: 'folder' })),
    ...filesArray.map(f => ({ ...f, type: 'file' }))
  ].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const selectedCount = selectedItems.size;
  const selectedItemsArray = Array.from(selectedItems).map(id => allItems.find(item => item.id === id)).filter(Boolean);

  return (
    <div 
      className={`file-explorer ${isDragging ? 'drag-over' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {selectedCount > 0 && (
        <div className="selection-toolbar">
          <div className="selection-toolbar-left">
            <button className="selection-close-btn" onClick={clearSelection}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
            </button>
            <span className="selection-count">{selectedCount} selected</span>
          </div>
          <div className="selection-toolbar-actions">
            {selectedItemsArray.some(item => item.type === 'file') && (
              <button className="selection-action-btn" onClick={handleBulkDownload} title="Download">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12V19H5V12H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12H19ZM13 12.67L15.59 10.09L17 11.5L12 16.5L7 11.5L8.41 10.09L11 12.67V3H13V12.67Z" fill="currentColor"/>
                </svg>
              </button>
            )}
            <button className="selection-action-btn" onClick={handleBulkShare} title="Get link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.34C15.11 18.55 15.08 18.77 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor"/>
              </svg>
            </button>
            <button className="selection-action-btn" onClick={handleBulkDelete} title="Move to trash">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      )}
      <div className="file-explorer-toolbar">
        <Breadcrumbs breadcrumbs={breadcrumbs} onNavigate={handleBreadcrumbClick} />
        <div className="toolbar-actions">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => handleViewToggle('list')}
              title="List view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 13H5V11H3V13ZM3 17H5V15H3V17ZM3 9H5V7H3V9ZM7 13H21V11H7V13ZM7 17H21V15H7V17ZM7 7V9H21V7H7Z" fill="currentColor"/>
              </svg>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => handleViewToggle('grid')}
              title="Grid view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 3V11H11V3H3ZM9 9H5V5H9V9ZM3 13V21H11V13H3ZM9 19H5V15H9V19ZM13 3V11H21V3H13ZM19 9H15V5H19V9ZM13 13V21H21V13H13ZM19 19H15V15H19V19Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <button 
            className="btn-upload" 
            onClick={handleUploadClick} 
            title="Upload File"
            disabled={uploading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12V19H5V12H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12H19ZM13 12.67L15.59 10.09L17 11.5L12 16.5L7 11.5L8.41 10.09L11 12.67V3H13V12.67Z" fill="currentColor"/>
            </svg>
            {uploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            onClick={(e) => {
              // Reset value to allow selecting the same file again
              e.target.value = '';
            }}
            multiple={true}
            disabled={uploading}
            accept="*/*"
          />
          <button 
            className="btn-create-folder" 
            onClick={handleCreateFolder} 
            title="New Folder"
            disabled={uploading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="currentColor"/>
            </svg>
            New Folder
          </button>
        </div>
      </div>
      
      {/* Drag and drop overlay */}
      {isDragging && (
        <div className="drag-drop-overlay">
          <div className="drag-drop-content">
            <div className="drag-drop-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path d="M19 12V19H5V12H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12H19ZM13 12.67L15.59 10.09L17 11.5L12 16.5L7 11.5L8.41 10.09L11 12.67V3H13V12.67Z" fill="currentColor"/>
              </svg>
            </div>
            <h2 className="drag-drop-title">Drop files here to upload</h2>
            <p className="drag-drop-hint">Release to upload your files</p>
          </div>
        </div>
      )}

      {allItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <div className="empty-illustration">
              <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="folderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#FFA726', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#FB8C00', stopOpacity: 1}} />
                  </linearGradient>
                </defs>
                <path d="M40 50L60 30H140L160 50V170H40V50Z" fill="url(#folderGradient)" opacity="0.9"/>
                <path d="M40 50H160V60H40V50Z" fill="#FFB74D"/>
                <path d="M50 70H150V80H50V70Z" fill="rgba(255,255,255,0.3)"/>
                <path d="M50 90H130V100H50V90Z" fill="rgba(255,255,255,0.2)"/>
                <circle cx="100" cy="130" r="15" fill="rgba(255,255,255,0.4)"/>
                <path d="M95 130L100 125L105 130M100 125V135" stroke="rgba(255,255,255,0.6)" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <h2 className="empty-title">This folder is empty</h2>
            <p className="empty-hint">Get started by uploading your first file or creating a new folder</p>
            <div className="empty-actions">
              <button 
                className="empty-action-btn primary" 
                onClick={handleUploadClick}
                disabled={uploading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12V19H5V12H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12H19ZM13 12.67L15.59 10.09L17 11.5L12 16.5L7 11.5L8.41 10.09L11 12.67V3H13V12.67Z" fill="currentColor"/>
                </svg>
                <span>Upload Files</span>
              </button>
              <button 
                className="empty-action-btn secondary" 
                onClick={handleCreateFolder}
                disabled={uploading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="currentColor"/>
                </svg>
                <span>Create Folder</span>
              </button>
            </div>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="file-grid file-grid-list">
          <div className="file-grid-header">
            <div className="file-header-checkbox">
              <input
                type="checkbox"
                checked={selectedItems.size > 0 && selectedItems.size === allItems.length}
                onChange={handleSelectAll}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="file-header-name">Name</div>
            <div className="file-header-meta">Size</div>
            <div className="file-header-date">Date</div>
            <div className="file-header-actions"></div>
          </div>
          {allItems.map((item) => 
            item.type === 'folder' ? (
              <FolderItem
                key={item.id}
                folder={item}
                onNavigate={handleFolderClick}
                onDelete={handleFolderDelete}
                onRename={handleFolderRename}
                onMove={handleFolderMove}
                onCopy={handleFolderCopy}
                onShare={handleFolderShare}
                onStar={handleFolderStar}
                isSelected={selectedItems.has(item.id)}
                onSelect={handleItemSelect}
                viewMode="list"
              />
            ) : (
              <FileItem
                key={item.id}
                file={item}
                onDownload={handleFileDownload}
                onDelete={handleFileDelete}
                onRename={handleFileRename}
                onMove={handleFileMove}
                onCopy={handleFileCopy}
                onShare={handleFileShare}
                onStar={handleFileStar}
                isSelected={selectedItems.has(item.id)}
                onSelect={handleItemSelect}
                viewMode="list"
              />
            )
          )}
        </div>
      ) : (
        <div className="file-grid file-grid-grid">
          {allItems.map((item) => 
            item.type === 'folder' ? (
              <FolderItem
                key={item.id}
                folder={item}
                onNavigate={handleFolderClick}
                onDelete={handleFolderDelete}
                onRename={handleFolderRename}
                onMove={handleFolderMove}
                onCopy={handleFolderCopy}
                onShare={handleFolderShare}
                onStar={handleFolderStar}
                isSelected={selectedItems.has(item.id)}
                onSelect={handleItemSelect}
                viewMode="grid"
              />
            ) : (
              <FileItem
                key={item.id}
                file={item}
                onDownload={handleFileDownload}
                onDelete={handleFileDelete}
                onRename={handleFileRename}
                onMove={handleFileMove}
                onCopy={handleFileCopy}
                onShare={handleFileShare}
                onStar={handleFileStar}
                viewMode="grid"
              />
            )
          )}
        </div>
      )}

      <MoveModal
        isOpen={showMoveModal}
        onClose={() => {
          setShowMoveModal(false);
          setMoveItem(null);
        }}
        item={moveItem}
        itemType={moveItemType}
        onMoveComplete={handleMoveComplete}
      />
      
      <RenameModal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setRenameItem(null);
        }}
        currentName={renameItem?.name || ''}
        itemType={renameItemType}
        onRename={handleRenameSubmit}
      />
      
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteItem(null);
          setDeleteItemName('');
        }}
        onConfirm={confirmDelete}
        itemName={deleteItemName}
        itemType={Array.isArray(deleteItem) ? 'items' : deleteItemType}
        itemCount={Array.isArray(deleteItem) ? deleteItem.length : 1}
      />
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
});

FileExplorer.displayName = 'FileExplorer';

export default FileExplorer;
