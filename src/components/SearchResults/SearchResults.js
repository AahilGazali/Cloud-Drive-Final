/**
 * SearchResults Component - Display search results
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import FolderItem from '../FolderItem/FolderItem';
import FileItem from '../FileItem/FileItem';
import { useFolderNavigation } from '../../hooks/useFolderNavigation';

const SearchResults = ({ results, onFileDownload, onFileDelete, onFolderDelete }) => {
  const navigate = useNavigate();
  const { navigateToFolder } = useFolderNavigation();

  const handleFolderClick = (folderId, folderName) => {
    navigate('/dashboard');
    // Small delay to ensure navigation happens first
    setTimeout(() => {
      navigateToFolder(folderId, folderName);
    }, 100);
  };

  const { files = [], folders = [] } = results;

  if (files.length === 0 && folders.length === 0) {
    return (
      <div className="search-results-empty">
        <div className="empty-icon">🔍</div>
        <p>No results found</p>
        <p className="empty-hint">Try different keywords</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      {folders.length > 0 && (
        <div className="search-section">
          <h3 className="search-section-title">Folders</h3>
          <div className="file-grid">
            <div className="file-grid-header">
              <div className="file-header-name">Name</div>
              <div className="file-header-meta">Size</div>
              <div className="file-header-actions"></div>
            </div>
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                onNavigate={handleFolderClick}
                onDelete={onFolderDelete}
              />
            ))}
          </div>
        </div>
      )}
      
      {files.length > 0 && (
        <div className="search-section">
          <h3 className="search-section-title">Files</h3>
          <div className="file-grid">
            <div className="file-grid-header">
              <div className="file-header-name">Name</div>
              <div className="file-header-meta">Size</div>
              <div className="file-header-actions"></div>
            </div>
            {files.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                onDownload={onFileDownload}
                onDelete={onFileDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
