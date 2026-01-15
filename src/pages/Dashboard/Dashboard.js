/**
 * Dashboard Page - Main application page after login
 * 
 * Responsibilities:
 * - Layout wrapper for authenticated users
 * - Render FileExplorer
 * - Handle logout
 * 
 * Import rules:
 * - Can import: components (FileExplorer)
 * - Can import: hooks (useAuth)
 * - Can import: context (useAuth)
 * - Should NOT import: services directly (use hooks instead)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../../components/Sidebar/Sidebar';
import FileExplorer from '../../components/FileExplorer/FileExplorer';
import Trash from '../Trash/Trash';
import Recent from '../Recent/Recent';
import Starred from '../Starred/Starred';
import Shared from '../Shared/Shared';
import StoragePlansPage from '../StoragePlans/StoragePlans';
import SearchResults from '../../components/SearchResults/SearchResults';
import { searchService } from '../../services';
import { filesService, foldersService } from '../../services';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const fileExplorerRef = useRef(null);
  const userMenuRef = useRef(null);
  const userButtonRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const performSearch = async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchService.search(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ files: [], folders: [] });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If empty, clear results immediately
    if (!value.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    // Debounce search - wait 500ms after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 500);
  };

  const handleFileDownload = async (fileId) => {
    try {
      await filesService.downloadFile(fileId);
    } catch (error) {
      alert(`Failed to download: ${error.message}`);
    }
  };

  const handleFileDelete = async (fileId) => {
    if (window.confirm('Move this file to trash?')) {
      try {
        await filesService.deleteFile(fileId);
        // Refresh search results
        if (searchQuery.trim()) {
          performSearch(searchQuery);
        }
      } catch (error) {
        alert(`Failed to delete: ${error.message}`);
      }
    }
  };

  const handleFolderDelete = async (folderId) => {
    if (window.confirm('Move this folder to trash?')) {
      try {
        await foldersService.deleteFolder(folderId);
        // Refresh search results
        if (searchQuery.trim()) {
          performSearch(searchQuery);
        }
      } catch (error) {
        alert(`Failed to delete: ${error.message}`);
      }
    }
  };

  const handleCreateFolder = () => {
    if (fileExplorerRef.current && fileExplorerRef.current.createFolder) {
      fileExplorerRef.current.createFolder();
    }
  };

  const handleUpload = () => {
    if (fileExplorerRef.current && fileExplorerRef.current.triggerUpload) {
      fileExplorerRef.current.triggerUpload();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user menu
      if (
        showUserMenu &&
        userMenuRef.current &&
        userButtonRef.current &&
        !userMenuRef.current.contains(event.target) &&
        !userButtonRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }

      // Close header menus
      if (!event.target.closest('.header-menu-wrapper')) {
        setShowAppsMenu(false);
        setShowNotificationsMenu(false);
        setShowHelpMenu(false);
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [showUserMenu, showAppsMenu, showNotificationsMenu, showHelpMenu, showSettingsMenu]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <svg className="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#4285F4"/>
              <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="#34A853"/>
              <path d="M22 7V12L12 17L2 12V7L12 12L22 7Z" fill="#EA4335"/>
              <path d="M2 12L12 17L22 12" stroke="#FBBC04" strokeWidth="2" fill="none"/>
            </svg>
            <span className="logo-text">Cloud Drive</span>
          </div>
        </div>
        <div className="header-center">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-container">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3S3 5.91 3 9.5S5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14Z" fill="#5F6368"/>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search in Drive"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  if (searchQuery.trim() && searchResults) {
                    // Show results if we have them
                  }
                }}
              />
              {isSearching && (
                <div className="search-loading">
                  <div className="search-spinner"></div>
                </div>
              )}
              <button type="button" className="search-dropdown" title="Search options">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M7 10L12 15L17 10H7Z" fill="#5F6368"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
        <div className="header-right">
          <div className="header-actions">
            <div className="header-menu-wrapper" style={{ position: 'relative' }}>
              <button 
                className="header-icon-btn" 
                title="Apps"
                onClick={() => {
                  setShowAppsMenu(!showAppsMenu);
                  setShowNotificationsMenu(false);
                  setShowHelpMenu(false);
                  setShowSettingsMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 8H8V4H4V8ZM10 20H14V16H10V20ZM4 20H8V16H4V20ZM4 14H8V10H4V14ZM10 14H14V10H10V14ZM16 4V8H20V4H16ZM10 8H14V4H10V8ZM16 14H20V10H16V14ZM16 20H20V16H16V20Z" fill="#5F6368"/>
                </svg>
              </button>
              {showAppsMenu && (
                <div className="header-menu">
                  <div className="header-menu-item" style={{ fontWeight: '600', cursor: 'default' }}>Google Apps</div>
                  <button 
                    className="header-menu-item" 
                    onClick={() => {
                      setShowAppsMenu(false);
                      navigate('/dashboard');
                    }}
                    style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', padding: '12px 16px' }}
                  >
                    Drive
                  </button>
                  <button 
                    className="header-menu-item" 
                    onClick={() => {
                      setShowAppsMenu(false);
                      window.open('https://docs.google.com', '_blank');
                    }}
                    style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', padding: '12px 16px' }}
                  >
                    Docs
                  </button>
                  <button 
                    className="header-menu-item" 
                    onClick={() => {
                      setShowAppsMenu(false);
                      window.open('https://sheets.google.com', '_blank');
                    }}
                    style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', padding: '12px 16px' }}
                  >
                    Sheets
                  </button>
                </div>
              )}
            </div>
            <div className="header-menu-wrapper" style={{ position: 'relative' }}>
              <button 
                className="header-icon-btn" 
                title="Notifications"
                onClick={() => {
                  setShowNotificationsMenu(!showNotificationsMenu);
                  setShowAppsMenu(false);
                  setShowHelpMenu(false);
                  setShowSettingsMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.89 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5S10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="#5F6368"/>
                </svg>
              </button>
              {showNotificationsMenu && (
                <div className="header-menu">
                  <div className="header-menu-item">No new notifications</div>
                </div>
              )}
            </div>
            <div className="header-menu-wrapper" style={{ position: 'relative' }}>
              <button 
                className="header-icon-btn" 
                title="Help"
                onClick={() => {
                  setShowHelpMenu(!showHelpMenu);
                  setShowAppsMenu(false);
                  setShowNotificationsMenu(false);
                  setShowSettingsMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22S22 17.52 22 12S17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.67 11.45 12.92 12.17 12.21L13.41 10.97C13.78 10.6 14 10.08 14 9.5C14 8.12 12.88 7 11.5 7S9 8.12 9 9.5H7C7 6.24 9.24 4 12.5 4S18 6.24 18 9.5C18 10.5 17.64 11.39 17.07 11.25Z" fill="#5F6368"/>
                </svg>
              </button>
              {showHelpMenu && (
                <div className="header-menu">
                  <div className="header-menu-item">Help Center</div>
                  <div className="header-menu-item">Keyboard Shortcuts</div>
                  <div className="header-menu-item">Send Feedback</div>
                </div>
              )}
            </div>
            <div className="header-menu-wrapper" style={{ position: 'relative' }}>
              <button 
                className="header-icon-btn" 
                title="Settings"
                onClick={() => {
                  setShowSettingsMenu(!showSettingsMenu);
                  setShowAppsMenu(false);
                  setShowNotificationsMenu(false);
                  setShowHelpMenu(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.67 19.18 11.36 19.14 11.06L21.16 9.48C21.34 9.33 21.38 9.07 21.23 8.89L19.23 6.45C19.08 6.27 18.82 6.23 18.64 6.38L16.35 8.07C15.89 7.72 15.37 7.45 14.8 7.28L14.5 4.81C14.48 4.6 14.3 4.44 14.09 4.44H9.91C9.7 4.44 9.52 4.6 9.5 4.81L9.2 7.28C8.63 7.45 8.11 7.72 7.65 8.07L5.36 6.38C5.18 6.23 4.92 6.27 4.77 6.45L2.77 8.89C2.62 9.07 2.66 9.33 2.84 9.48L4.86 11.06C4.82 11.36 4.8 11.67 4.8 12C4.8 12.33 4.82 12.64 4.86 12.94L2.84 14.52C2.66 14.67 2.62 14.93 2.77 15.11L4.77 17.55C4.92 17.73 5.18 17.77 5.36 17.62L7.65 15.93C8.11 16.28 8.63 16.55 9.2 16.72L9.5 19.19C9.52 19.4 9.7 19.56 9.91 19.56H14.09C14.3 19.56 14.48 19.4 14.5 19.19L14.8 16.72C15.37 16.55 15.89 16.28 16.35 15.93L18.64 17.62C18.82 17.77 19.08 17.73 19.23 17.55L21.23 15.11C21.38 14.93 21.34 14.67 21.16 14.52L19.14 12.94ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z" fill="#5F6368"/>
                </svg>
              </button>
              {showSettingsMenu && (
                <div className="header-menu">
                  <button 
                    className="header-menu-item" 
                    onClick={toggleTheme}
                    style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span>Theme</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {isDark ? 'Dark' : 'Light'}
                      </span>
                    </div>
                  </button>
                  <div className="header-menu-item">Settings</div>
                  <div className="header-menu-item">Privacy</div>
                </div>
              )}
            </div>
          </div>
          <div className="user-info-wrapper" style={{ position: 'relative' }}>
            <div 
              className="user-info" 
              onClick={() => setShowUserMenu(!showUserMenu)}
              ref={userButtonRef}
            >
              <span className="user-name">{user?.name || user?.email?.split('@')[0] || 'User'}</span>
              <div className="user-avatar">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
            {showUserMenu && (
              <div className="user-menu" ref={userMenuRef}>
                <div className="user-menu-header">
                  <div className="user-menu-avatar">
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="user-menu-info">
                    <div className="user-menu-name">{user?.name || 'User'}</div>
                    <div className="user-menu-email">{user?.email}</div>
                  </div>
                </div>
                <div className="user-menu-divider"></div>
                <button className="user-menu-item" onClick={logout}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className="dashboard-body">
        <Sidebar onCreateFolder={handleCreateFolder} onUpload={handleUpload} />
        <main className="dashboard-content">
          {searchResults !== null ? (
            <div className="search-results-container">
              <div className="search-results-header">
                <h2>Search Results</h2>
                <button 
                  className="btn-clear-search" 
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults(null);
                  }}
                >
                  Clear search
                </button>
              </div>
              <SearchResults
                results={searchResults}
                onFileDownload={handleFileDownload}
                onFileDelete={handleFileDelete}
                onFolderDelete={handleFolderDelete}
              />
            </div>
          ) : (
            <Routes>
              <Route index element={<FileExplorer ref={fileExplorerRef} />} />
              <Route path="recent" element={<Recent />} />
              <Route path="starred" element={<Starred />} />
              <Route path="shared" element={<Shared />} />
              <Route path="trash" element={<Trash />} />
              <Route path="storage-plans" element={<StoragePlansPage />} />
              <Route path="*" element={<FileExplorer ref={fileExplorerRef} />} />
            </Routes>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
