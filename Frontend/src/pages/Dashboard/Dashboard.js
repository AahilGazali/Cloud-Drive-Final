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
import Settings from '../Settings/Settings';
import Feedback from '../Feedback/Feedback';
import SearchResults from '../../components/SearchResults/SearchResults';
import { searchService } from '../../services';
import { filesService, foldersService, feedbackService } from '../../services';
import { useLanguage } from '../../context/LanguageContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
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
      console.log('Search query:', query);
      console.log('Search results:', results);
      console.log('Files count:', results?.files?.length || 0);
      console.log('Folders count:', results?.folders?.length || 0);
      
      // Ensure results structure is correct
      const formattedResults = {
        files: Array.isArray(results?.files) ? results.files : [],
        folders: Array.isArray(results?.folders) ? results.folders : []
      };
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error('Search error:', error);
      console.error('Error details:', error.response?.data || error.message);
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
    } catch (err) {
      // Error handled by FileExplorer toast
    }
  };

  const handleFileDelete = async (fileId) => {
    // Handled by FileExplorer
  };

  const handleFolderDelete = async (folderId) => {
    // Handled by FileExplorer
  };

  // Fetch recent activity for notifications
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      // Get recent files (last 5)
      const filesResponse = await filesService.listFiles(null);
      const recentFiles = filesResponse?.data?.files?.slice(0, 5) || [];
      
      // Format notifications
      const formattedNotifications = recentFiles.map((file, index) => ({
        id: file.id,
        type: 'file_upload',
        message: `File "${file.name}" was uploaded`,
        timestamp: file.created_at,
        icon: '📄',
        isNew: index < 2, // Mark first 2 as new
      }));

      // Add welcome notification if no files
      if (formattedNotifications.length === 0) {
        formattedNotifications.push({
          id: 'welcome',
          type: 'system',
          message: 'Welcome to G-Drive! Start by uploading your first file.',
          timestamp: new Date().toISOString(),
          icon: '👋',
          isNew: true,
        });
      }

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Set default notification on error
      setNotifications([{
        id: 'default',
        type: 'system',
        message: 'Welcome! Your notifications will appear here.',
        timestamp: new Date().toISOString(),
        icon: '🔔',
        isNew: false,
      }]);
    } finally {
      setNotificationsLoading(false);
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

      // Close feedback modal
      if (showFeedbackModal && !event.target.closest('.feedback-modal')) {
        // Don't close on overlay click, only on close button
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [showUserMenu, showAppsMenu, showNotificationsMenu, showHelpMenu, showSettingsMenu, showFeedbackModal]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setFeedbackError('');
    setFeedbackSuccess('');
    setFeedbackLoading(true);

    try {
      if (!feedbackText || !feedbackText.trim()) {
        setFeedbackError('Please enter your feedback');
        setFeedbackLoading(false);
        return;
      }

      try {
        await feedbackService.submitFeedback(feedbackText.trim());
        setFeedbackSuccess('Thank you for your feedback!');
        setTimeout(() => {
          setShowFeedbackModal(false);
          setFeedbackText('');
          setFeedbackSuccess('');
          setFeedbackError('');
        }, 2000);
      } catch (err) {
        console.error('Feedback submission error:', err);
        
        // Handle network errors
        if (!err.response || err.response.status === 0) {
          setFeedbackError('Network error. Please check if the backend server is running and try again.');
          setFeedbackLoading(false);
          return;
        }
        
        // If table doesn't exist, try to setup automatically
        const errorMsg = err.response?.data?.message || err.message || '';
        if (errorMsg.includes('table not found') || 
            errorMsg.includes('schema cache') ||
            errorMsg.includes('does not exist')) {
          try {
            setFeedbackError('Setting up feedback table... Please wait.');
            await feedbackService.setupFeedbackTable();
            // Retry submitting feedback
            await feedbackService.submitFeedback(feedbackText.trim());
            setFeedbackSuccess('Thank you for your feedback!');
            setTimeout(() => {
              setShowFeedbackModal(false);
              setFeedbackText('');
              setFeedbackSuccess('');
              setFeedbackError('');
            }, 2000);
          } catch (setupErr) {
            console.error('Auto-setup failed:', setupErr);
            const setupErrorMsg = setupErr.response?.data?.message || setupErr.message || 'Unknown error';
            setFeedbackError(`Failed to setup feedback table: ${setupErrorMsg}. Please run the SQL migration in Supabase SQL Editor. See Backend/FEEDBACK_SETUP.md for instructions.`);
          }
        } else {
          const errorMessage = err.response?.data?.message || err.message || 'Failed to submit feedback. Please try again.';
          setFeedbackError(errorMessage);
        }
      }
    } catch (err) {
      console.error('Feedback submission error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit feedback. Please try again.';
      setFeedbackError(errorMessage);
    } finally {
      setFeedbackLoading(false);
    }
  };

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
                <div className="header-menu" style={{ minWidth: '320px', maxWidth: '400px', maxHeight: '400px', overflowY: 'auto' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', fontSize: '14px' }}>
                    Notifications
                  </div>
                  {notificationsLoading ? (
                    <div className="header-menu-item" style={{ textAlign: 'center', padding: '20px' }}>
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="header-menu-item" style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.6)' }}>
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="header-menu-item"
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          cursor: 'pointer',
                          backgroundColor: notification.isNew ? 'rgba(66, 133, 244, 0.1)' : 'transparent',
                        }}
                        onClick={() => {
                          if (notification.type === 'file_upload') {
                            navigate('/dashboard');
                            setShowNotificationsMenu(false);
                          }
                        }}
                      >
                        <span style={{ fontSize: '20px', flexShrink: 0 }}>{notification.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', lineHeight: '1.4', marginBottom: '4px' }}>
                            {notification.message}
                          </div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                            {new Date(notification.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        {notification.isNew && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#4285f4',
                            flexShrink: 0,
                            marginTop: '4px'
                          }}></span>
                        )}
                      </div>
                    ))
                  )}
                  {notifications.length > 0 && (
                    <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setShowNotificationsMenu(false);
                          navigate('/dashboard');
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#4285f4',
                          cursor: 'pointer',
                          fontSize: '13px',
                          padding: '4px 8px'
                        }}
                      >
                        View All Activity
                      </button>
                    </div>
                  )}
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
                  <button 
                    className="header-menu-item" 
                    onClick={() => {
                      setShowHelpMenu(false);
                      // TODO: Navigate to help center or open help modal
                      window.open('https://support.google.com/drive', '_blank');
                    }}
                    style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', padding: '12px 16px' }}
                  >
                    Help Center
                  </button>
                  <button 
                    className="header-menu-item" 
                    onClick={() => {
                      setShowHelpMenu(false);
                      // TODO: Show keyboard shortcuts modal
                      alert('Keyboard Shortcuts:\n\nCtrl+K / Cmd+K - Search\nCtrl+N / Cmd+N - New folder\nCtrl+U / Cmd+U - Upload file');
                    }}
                    style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', padding: '12px 16px' }}
                  >
                    Keyboard Shortcuts
                  </button>
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
                  <button 
                    className="header-menu-item" 
                    onClick={() => {
                      setShowSettingsMenu(false);
                      navigate('/dashboard/settings');
                    }}
                    style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', padding: '12px 16px' }}
                  >
                    Settings
                  </button>
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
              <Route path="settings" element={<Settings />} />
              <Route path="feedback" element={<Feedback />} />
              <Route path="*" element={<FileExplorer ref={fileExplorerRef} />} />
            </Routes>
          )}
        </main>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="feedback-modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-modal-header">
              <h2>Send Feedback</h2>
              <button 
                className="feedback-modal-close"
                onClick={() => setShowFeedbackModal(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            <div className="feedback-modal-content">
              <form onSubmit={handleSubmitFeedback}>
                <div className="feedback-form-group">
                  <label>Please share your feedback:</label>
                  <textarea
                    className="feedback-form-textarea"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tell us what you think..."
                    rows="6"
                    required
                  />
                </div>
                {feedbackError && <div className="feedback-error">{feedbackError}</div>}
                {feedbackSuccess && <div className="feedback-success">{feedbackSuccess}</div>}
                <div className="feedback-modal-actions">
                  <button 
                    type="button"
                    className="feedback-btn-secondary"
                    onClick={() => setShowFeedbackModal(false)}
                    disabled={feedbackLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="feedback-btn-primary"
                    disabled={feedbackLoading}
                  >
                    {feedbackLoading ? 'Sending...' : 'Send Feedback'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
