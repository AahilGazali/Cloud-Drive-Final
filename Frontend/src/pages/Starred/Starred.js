/**
 * Starred Page - Shows starred/favorite files
 */

import React, { useState } from 'react';
import { useFiles } from '../../hooks/useFiles';
import { useFolders } from '../../hooks/useFolders';
import { filesService, foldersService } from '../../services';
import FileItem from '../../components/FileItem/FileItem';
import FolderItem from '../../components/FolderItem/FolderItem';
import DeleteConfirmModal from '../../components/DeleteConfirmModal/DeleteConfirmModal';
import { useToast, ToastContainer } from '../../components/Toast/Toast';

const Starred = () => {
  const { files, loading: filesLoading, downloadFile, refetch: refetchFiles } = useFiles(null);
  const { folders, loading: foldersLoading, refetch: refetchFolders } = useFolders(null);
  const { toasts, success, error, removeToast } = useToast();
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteItemType, setDeleteItemType] = useState('file');
  const [deleteItemName, setDeleteItemName] = useState('');
  
  // Filter to show only starred items
  const starredFiles = files.filter(file => file.is_starred === true);
  const starredFolders = folders.filter(folder => folder.is_starred === true);

  const handleDownload = async (fileId) => {
    try {
      await downloadFile(fileId);
      success('Download started');
    } catch (err) {
      error(`Failed to download: ${err.message}`);
    }
  };

  const handleDelete = (fileId) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      setDeleteItem(fileId);
      setDeleteItemType('file');
      setDeleteItemName(file.name);
      setShowDeleteModal(true);
    }
  };
  
  const confirmDelete = async () => {
    try {
      if (deleteItemType === 'file') {
        await filesService.deleteFile(deleteItem);
        await refetchFiles();
        success('File moved to trash');
      }
      setShowDeleteModal(false);
    } catch (err) {
      error(`Failed to delete: ${err.message}`);
    }
  };

  const handleFileStar = async (fileId) => {
    try {
      await filesService.toggleStarFile(fileId);
      await refetchFiles();
      const file = files.find(f => f.id === fileId);
      if (file?.is_starred) {
        success('Star removed');
      } else {
        success('Starred');
      }
    } catch (err) {
      error(`Failed to toggle star: ${err.message}`);
    }
  };

  const handleFolderStar = async (folderId) => {
    try {
      await foldersService.toggleStarFolder(folderId);
      await refetchFolders();
      const folder = folders.find(f => f.id === folderId);
      if (folder?.is_starred) {
        success('Star removed');
      } else {
        success('Starred');
      }
    } catch (err) {
      error(`Failed to toggle star: ${err.message}`);
    }
  };

  // Use filtered starred items
  const allItems = [
    ...starredFolders.map(f => ({ ...f, type: 'folder' })),
    ...starredFiles.map(f => ({ ...f, type: 'file' }))
  ];

  if (foldersLoading || filesLoading) {
    return (
      <div className="starred-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading starred items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="starred-page">
      {allItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <div className="empty-illustration">
              <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#FFD700', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#FFA500', stopOpacity: 1}} />
                  </linearGradient>
                </defs>
                <path d="M100 20L120 70L175 75L135 110L150 165L100 140L50 165L65 110L25 75L80 70Z" fill="url(#starGradient)" opacity="0.9"/>
                <path d="M100 20L120 70L175 75L135 110L150 165L100 140L50 165L65 110L25 75L80 70Z" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
              </svg>
            </div>
            <p className="empty-hint">Star files and folders to find them quickly</p>
          </div>
        </div>
      ) : (
        <div className="file-grid">
          <div className="file-grid-header">
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
                onNavigate={() => {}}
                onStar={handleFolderStar}
              />
            ) : (
              <FileItem
                key={item.id}
                file={item}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onStar={handleFileStar}
              />
            )
          )}
        </div>
      )}
      
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteItem(null);
          setDeleteItemName('');
        }}
        onConfirm={confirmDelete}
        itemName={deleteItemName}
        itemType={deleteItemType}
      />
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Starred;
