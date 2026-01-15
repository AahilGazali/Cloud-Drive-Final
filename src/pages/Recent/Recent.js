/**
 * Recent Page - Shows recently accessed files
 */

import React from 'react';
import { useFiles } from '../../hooks/useFiles';
import { useFolders } from '../../hooks/useFolders';
import { filesService } from '../../services';
import FileItem from '../../components/FileItem/FileItem';
import FolderItem from '../../components/FolderItem/FolderItem';

const Recent = () => {
  // Show all files and folders (recent would filter by date, but for now show all)
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
  ].sort((a, b) => {
    // Sort by most recent first
    const aDate = new Date(a.created_at || a.updated_at || 0);
    const bDate = new Date(b.created_at || b.updated_at || 0);
    return bDate - aDate;
  });

  if (foldersLoading || filesLoading) {
    return (
      <div className="recent-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading recent files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-page">
      {allItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-content">
            <div className="empty-illustration">
              <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#667eea', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#764ba2', stopOpacity: 1}} />
                  </linearGradient>
                </defs>
                <circle cx="100" cy="100" r="80" fill="url(#clockGradient)" opacity="0.9"/>
                <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                <line x1="100" y1="100" x2="100" y2="60" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <line x1="100" y1="100" x2="130" y2="100" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="100" cy="100" r="6" fill="white"/>
              </svg>
            </div>
            <p className="empty-hint">Files you open will appear here</p>
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

export default Recent;
