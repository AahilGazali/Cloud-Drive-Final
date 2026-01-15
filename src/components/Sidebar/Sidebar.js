/**
 * Sidebar Component - Navigation sidebar like Google Drive
 * 
 * Responsibilities:
 * - Show navigation items (My Drive, Trash)
 * - Handle navigation between sections
 * - Show active state
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ onCreateFolder, onUpload }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNewMenu, setShowNewMenu] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showNewMenu &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowNewMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNewMenu]);

  const isActive = (path) => {
    // Handle both exact match and when pathname starts with the path
    return location.pathname === path || 
           (path !== '/dashboard' && location.pathname.startsWith(path));
  };

  const handleNewClick = () => {
    setShowNewMenu(!showNewMenu);
  };

  const handleNewFolder = () => {
    setShowNewMenu(false);
    if (onCreateFolder) {
      onCreateFolder();
    }
  };

  const handleNewFile = () => {
    setShowNewMenu(false);
    if (onUpload) {
      onUpload();
    }
  };

  const menuItems = [
    {
      id: 'drive',
      label: 'My Drive',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="currentColor"/>
        </svg>
      ),
      path: '/dashboard',
    },
    {
      id: 'recent',
      label: 'Recent',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M11.99 2C6.47 2 2 6.48 2 12S6.47 22 11.99 22C17.52 22 22 17.52 22 12S17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor"/>
        </svg>
      ),
      path: '/dashboard/recent',
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="currentColor"/>
        </svg>
      ),
      path: '/dashboard/starred',
    },
    {
      id: 'shared',
      label: 'Shared with me',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" fill="currentColor"/>
        </svg>
      ),
      path: '/dashboard/shared',
    },
    {
      id: 'trash',
      label: 'Trash',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
        </svg>
      ),
      path: '/dashboard/trash',
    },
  ];

  // Get current plan from localStorage
  const getCurrentPlan = () => {
    const saved = localStorage.getItem('currentPlan');
    return saved ? JSON.parse(saved) : { id: 'free', storage: 10 };
  };

  const currentPlan = getCurrentPlan();
  const storageUsed = 3.5; // GB - replace with actual data from API
  const storageTotal = currentPlan.storage; // GB - from current plan
  const storagePercent = (storageUsed / storageTotal) * 100;

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div style={{ position: 'relative' }}>
          <button className="btn-new" onClick={handleNewClick} ref={buttonRef}>
            <svg className="btn-new-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
            </svg>
            <span>NEW</span>
          </button>
          {showNewMenu && (
            <div className="new-menu" ref={menuRef}>
            <button className="new-menu-item" onClick={handleNewFolder}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="currentColor"/>
              </svg>
              <span>Folder</span>
            </button>
            <button className="new-menu-item" onClick={handleNewFile}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="currentColor"/>
              </svg>
              <span>File upload</span>
            </button>
          </div>
          )}
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => (
            <React.Fragment key={item.id}>
              {index === 4 && <div className="sidebar-divider" />}
              <button
                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="storage-info">
            <div className="storage-text">
              {storageUsed} GB of {storageTotal} GB used
            </div>
            <div className="storage-bar">
              <div className="storage-bar-fill" style={{ width: `${storagePercent}%` }}></div>
            </div>
            <button className="storage-upgrade" onClick={() => navigate('/dashboard/storage-plans')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6H12L10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6ZM20 18H4V8H20V18Z" fill="currentColor"/>
              </svg>
              <span>Upgrade storage</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
