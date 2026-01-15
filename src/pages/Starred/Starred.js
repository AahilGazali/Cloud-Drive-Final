/**
 * Starred Page - Shows starred/favorite files
 */

import React from 'react';
import { useFiles } from '../../hooks/useFiles';
import { useFolders } from '../../hooks/useFolders';
import { filesService } from '../../services';
import FileItem from '../../components/FileItem/FileItem';
import FolderItem from '../../components/FolderItem/FolderItem';

const Starred = () => {
  // For now, show all files (starred would filter by starred flag)
  const { files, loading: filesLoading, downloadFile, refetch: refetchFiles } = useFiles(null);
  const { folders, loading: foldersLoading } = useFolders(null);

  const handleDownload = async (fileId) => {
    try {
      await downloadFile(fileId);
    } catch (error) {
      alert(`Failed to download: ${error.message}`);
    }
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Move this file to trash?')) {
      try {
        await filesService.deleteFile(fileId);
        refetchFiles();
      } catch (error) {
        alert(`Failed to delete: ${error.message}`);
      }
    }
  };

  const foldersArray = Array.isArray(folders) ? folders : [];
  const filesArray = Array.isArray(files) ? files : [];
  const allItems = [
    ...foldersArray.map(f => ({ ...f, type: 'folder' })),
    ...filesArray.map(f => ({ ...f, type: 'file' }))
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
            <div className="file-header-actions"></div>
          </div>
          {allItems.map((item) => 
            item.type === 'folder' ? (
              <FolderItem
                key={item.id}
                folder={item}
                onNavigate={() => {}}
              />
            ) : (
              <FileItem
                key={item.id}
                file={item}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Starred;
