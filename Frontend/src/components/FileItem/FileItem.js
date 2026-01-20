/**
 * FileItem Component - Displays a single file
 * 
 * Responsibilities:
 * - Show file name, size, type
 * - Handle file click (download)
 * - Show file icon based on type
 * 
 * Import rules:
 * - Can import: hooks (if needed)
 * - Can import: other components
 * - Should NOT import: services, pages
 */

import React, { useState, useEffect, useRef } from 'react';
import { getFileIcon, formatFileSize, formatDateTime } from '../../utils/helpers';
import { filesService } from '../../services';
import ShareModal from '../ShareModal/ShareModal';

const FileItem = ({ 
  file, 
  onDownload, 
  onDelete, 
  onRename,
  onMove,
  onCopy,
  onShare,
  onStar,
  isSelected = false,
  onSelect,
  viewMode = 'list' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const menuRef = useRef(null);

  // Handle both size and size_bytes field names
  const fileSize = file.size || file.size_bytes || 0;
  const mimeType = file.mime_type || file.mimeType || '';
  const isImage = mimeType.startsWith('image/');

  // Fetch image preview URL for grid view
  useEffect(() => {
    if (viewMode === 'grid' && isImage && file.id) {
      setImageLoading(true);
      setImageError(false);
      
      filesService.getSignedUrl(file.id)
        .then((response) => {
          const signedUrl = response?.data?.url || response?.url;
          if (signedUrl) {
            setImageUrl(signedUrl);
          } else {
            setImageError(true);
          }
        })
        .catch((error) => {
          console.error('Failed to load image preview:', error);
          setImageError(true);
        })
        .finally(() => {
          setImageLoading(false);
        });
    }
  }, [viewMode, isImage, file.id]);

  // Close menu when clicking outside and adjust position
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    const adjustMenuPosition = () => {
      if (menuRef.current && showMenu) {
        const menu = menuRef.current.querySelector('.file-menu-dropdown');
        const button = menuRef.current.querySelector('.file-menu-btn');
        
        if (menu && button) {
          // Reset styles first
          menu.style.position = '';
          menu.style.left = '';
          menu.style.right = '';
          menu.style.top = '';
          menu.style.bottom = '';
          menu.style.marginTop = '';
          menu.style.marginBottom = '';
          menu.style.transform = '';
          
          // Wait for render, then check if adjustments needed
          setTimeout(() => {
            const buttonRect = button.getBoundingClientRect();
            const padding = 12;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // For list view, use absolute positioning with smart placement
            if (viewMode === 'list') {
              menu.style.position = 'absolute';
              menu.style.right = '0';
              menu.style.top = '100%';
              menu.style.marginTop = '8px';
              
              // Check if menu goes off screen after positioning
              setTimeout(() => {
                const menuRect = menu.getBoundingClientRect();
                
                // Check if menu goes off right edge
                if (menuRect.right > windowWidth - padding) {
                  menu.style.right = 'auto';
                  menu.style.left = '0';
                }
                
                // Check if menu goes off bottom edge
                if (menuRect.bottom > windowHeight - padding) {
                  // Position above the button
                  menu.style.top = 'auto';
                  menu.style.bottom = '100%';
                  menu.style.marginTop = '0';
                  menu.style.marginBottom = '8px';
                }
              }, 10);
            } else {
              // Grid view positioning - position to overlap the card, to the left of the button
              menu.style.position = 'absolute';
              menu.style.right = 'auto';
              menu.style.left = '0';
              menu.style.top = '50%';
              menu.style.bottom = 'auto';
              menu.style.marginTop = '0';
              menu.style.marginBottom = '0';
              menu.style.transform = 'translate(-100%, -50%)';
              menu.style.marginRight = '8px';
              menu.style.marginLeft = '0';
              
              setTimeout(() => {
                const menuRect = menu.getBoundingClientRect();
                const buttonRect = button.getBoundingClientRect();
                
                // Check if menu goes off left edge
                if (menuRect.left < padding) {
                  // Position to the right instead
                  menu.style.left = 'auto';
                  menu.style.right = '0';
                  menu.style.transform = 'translate(0, -50%)';
                  menu.style.marginRight = '0';
                  menu.style.marginLeft = '8px';
                }
                
                // Check if menu goes off right edge when positioned to the right
                if (menuRect.right > windowWidth - padding && menu.style.right === '0') {
                  // Keep it on the left but adjust
                  menu.style.left = '0';
                  menu.style.right = 'auto';
                  menu.style.transform = 'translate(-100%, -50%)';
                  menu.style.marginRight = '8px';
                  menu.style.marginLeft = '0';
                }
                
                // Check if menu goes off top edge
                if (menuRect.top < padding) {
                  menu.style.top = '0';
                  menu.style.transform = menu.style.transform.includes('translateX') 
                    ? menu.style.transform.replace('-50%', '0') 
                    : menu.style.transform.replace('translate(-100%, -50%)', 'translate(-100%, 0)').replace('translate(0, -50%)', 'translate(0, 0)');
                }
                
                // Check if menu goes off bottom edge
                if (menuRect.bottom > windowHeight - padding) {
                  menu.style.top = 'auto';
                  menu.style.bottom = '0';
                  menu.style.transform = menu.style.transform.includes('translateX') 
                    ? menu.style.transform.replace('-50%', '0') 
                    : menu.style.transform.replace('translate(-100%, -50%)', 'translate(-100%, 0)').replace('translate(0, -50%)', 'translate(0, 0)');
                }
              }, 10);
            }
          }, 10);
        }
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      adjustMenuPosition();
      window.addEventListener('resize', adjustMenuPosition);
      window.addEventListener('scroll', adjustMenuPosition, true);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', adjustMenuPosition);
        window.removeEventListener('scroll', adjustMenuPosition, true);
      };
    }
  }, [showMenu, viewMode]);

  const handleFileClick = (e) => {
    // Don't trigger download if clicking on action buttons, menu, or checkbox
    if (e.target.closest('.file-actions') || 
        e.target.closest('.btn-icon') || 
        e.target.closest('.file-menu') ||
        e.target.closest('.file-menu-btn') ||
        e.target.closest('.file-checkbox') ||
        e.target.type === 'checkbox') {
      return;
    }
    // If Ctrl/Cmd is held, toggle selection
    if (e.ctrlKey || e.metaKey) {
      if (onSelect) {
        onSelect(file.id, 'file');
      }
      return;
    }
    // Trigger download on file click
    if (onDownload) {
      onDownload(file.id);
    }
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(file.id, 'file');
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);
    if (action === 'download' && onDownload) {
      onDownload(file.id);
    } else if (action === 'rename' && onRename) {
      onRename(file.id, file.name);
    } else if (action === 'move' && onMove) {
      onMove(file.id);
    } else if (action === 'copy' && onCopy) {
      onCopy(file.id);
    } else if (action === 'share') {
      setShowShareModal(true);
    } else if (action === 'star' && onStar) {
      onStar(file.id);
    } else if (action === 'delete' && onDelete) {
      onDelete(file.id);
    }
  };

  const handleShareUpdate = (shareData) => {
    // Handle share update if needed
    if (onShare) {
      onShare(file.id);
    }
  };

  if (viewMode === 'grid') {
    return (
      <>
      <div 
        className={`file-item file-item-grid ${isSelected ? 'selected' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          // Small delay before hiding menu to allow moving to it
          setTimeout(() => {
            if (!menuRef.current?.matches(':hover') && !menuRef.current?.querySelector(':hover')) {
              setShowMenu(false);
            }
          }, 100);
        }}
        onClick={handleFileClick}
      >
        {onSelect && (
          <div className="file-checkbox-grid" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        <div className="file-item-grid-content">
          <div className="file-icon-wrapper-grid">
            {isImage && imageUrl && !imageError ? (
              <div className="file-image-preview">
                <img 
                  src={imageUrl} 
                  alt={file.name}
                  className="file-image-thumbnail"
                  onError={() => setImageError(true)}
                />
                {isHovered && (
                  <div className="file-actions-grid" onClick={(e) => e.stopPropagation()}>
                    <div 
                      className="file-menu" 
                      ref={menuRef}
                      onMouseEnter={() => {
                        if (viewMode === 'grid') {
                          setShowMenu(true);
                        }
                      }}
                      onMouseLeave={() => {
                        if (viewMode === 'grid') {
                          setTimeout(() => {
                            if (!isHovered) {
                              setShowMenu(false);
                            }
                          }, 200);
                        }
                      }}
                    >
                      <button 
                        className="file-menu-btn btn-icon-grid" 
                        onClick={handleMenuClick}
                        title="More options"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z" fill="currentColor"/>
                        </svg>
                      </button>
                      {(showMenu || (viewMode === 'grid' && isHovered)) && (
                        <div className="file-menu-dropdown">
                          {onDownload && (
                            <button className="file-menu-item" onClick={() => handleMenuAction('download')}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M19 12V19H5V12H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12H19ZM13 12.67L15.59 10.09L17 11.5L12 16.5L7 11.5L8.41 10.09L11 12.67V3H13V12.67Z" fill="currentColor"/>
                              </svg>
                              <span>Download</span>
                            </button>
                          )}
                          {onRename && (
                            <button className="file-menu-item" onClick={() => handleMenuAction('rename')}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.12 5.13L18.87 8.88L20.71 7.04Z" fill="currentColor"/>
                              </svg>
                              <span>Rename</span>
                            </button>
                          )}
                          {onMove && (
                            <button className="file-menu-item" onClick={() => handleMenuAction('move')}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M9 16H15V11H19L12 4L5 11H9V16ZM5 18H19V20H5V18Z" fill="currentColor"/>
                              </svg>
                              <span>Move</span>
                            </button>
                          )}
                          {onCopy && (
                            <button className="file-menu-item" onClick={() => handleMenuAction('copy')}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                              </svg>
                              <span>Make a copy</span>
                            </button>
                          )}
                          <button className="file-menu-item" onClick={() => handleMenuAction('share')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.34C15.11 18.55 15.08 18.77 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor"/>
                            </svg>
                            <span>Share</span>
                          </button>
                          {onStar && (
                            <button className="file-menu-item" onClick={() => handleMenuAction('star')}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                {file.is_starred ? (
                                  <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="currentColor"/>
                                ) : (
                                  <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                                )}
                              </svg>
                              <span>{file.is_starred ? 'Remove star' : 'Add star'}</span>
                            </button>
                          )}
                          <div className="file-menu-divider"></div>
                          {onDelete && (
                            <button className="file-menu-item danger" onClick={() => handleMenuAction('delete')}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
                              </svg>
                              <span>Move to trash</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="file-icon-grid">
                  {imageLoading ? (
                    <div className="image-loading-spinner"></div>
                  ) : (
                    getFileIcon(mimeType)
                  )}
                </div>
                {isImage && !imageError && (
                  <div className="file-badge image-badge">IMG</div>
                )}
                {mimeType === 'application/pdf' && (
                  <div className="file-badge pdf-badge">PDF</div>
                )}
                {isHovered && (
                  <div className="file-actions-grid" onClick={(e) => e.stopPropagation()}>
                    <div 
                      className="file-menu" 
                      ref={menuRef}
                      onMouseEnter={() => {
                        if (viewMode === 'grid') {
                          setShowMenu(true);
                        }
                      }}
                      onMouseLeave={() => {
                        if (viewMode === 'grid') {
                          setTimeout(() => {
                            if (!isHovered) {
                              setShowMenu(false);
                            }
                          }, 200);
                        }
                      }}
                    >
                      <button 
                        className="file-menu-btn btn-icon-grid" 
                        onClick={handleMenuClick}
                        title="More options"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z" fill="currentColor"/>
                        </svg>
                      </button>
                      {(showMenu || (viewMode === 'grid' && isHovered)) && (
                        <div className="file-menu-dropdown">
                          {onDownload && (
                            <button className="file-menu-item" onClick={() => handleMenuAction('download')}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M19 12V19H5V12H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12H19ZM13 12.67L15.59 10.09L17 11.5L12 16.5L7 11.5L8.41 10.09L11 12.67V3H13V12.67Z" fill="currentColor"/>
                              </svg>
                              <span>Download</span>
                            </button>
                          )}
                          {onRename && (
                            <button className="file-menu-item" onClick={() => handleMenuAction('rename')}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.12 5.13L18.87 8.88L20.71 7.04Z" fill="currentColor"/>
                              </svg>
                              <span>Rename</span>
                            </button>
                          )}
                          {onMove && (
                            <button className="file-menu-item" onClick={() => handleMenuAction('move')}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M9 16H15V11H19L12 4L5 11H9V16ZM5 18H19V20H5V18Z" fill="currentColor"/>
                              </svg>
                              <span>Move</span>
                            </button>
                          )}
                          {onCopy && (
                            <button className="file-menu-item" onClick={() => handleMenuAction('copy')}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                              </svg>
                              <span>Make a copy</span>
                            </button>
                          )}
                          <button className="file-menu-item" onClick={() => handleMenuAction('share')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.34C15.11 18.55 15.08 18.77 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor"/>
                            </svg>
                            <span>Share</span>
                          </button>
                          {onStar && (
                            <button className="file-menu-item" onClick={() => handleMenuAction('star')}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                {file.is_starred ? (
                                  <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="currentColor"/>
                                ) : (
                                  <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                                )}
                              </svg>
                              <span>{file.is_starred ? 'Remove star' : 'Add star'}</span>
                            </button>
                          )}
                          <div className="file-menu-divider"></div>
                          {onDelete && (
                            <button className="file-menu-item danger" onClick={() => handleMenuAction('delete')}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
                              </svg>
                              <span>Move to trash</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="file-info-grid">
            <div className="file-name-grid" title={file.name}>{file.name}</div>
            <div className="file-size-grid">{formatFileSize(fileSize)}</div>
          </div>
        </div>
      </div>
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        item={file}
        itemType="file"
        onShareUpdate={handleShareUpdate}
      />
      </>
    );
  }

  return (
    <div 
      className={`file-item ${isSelected ? 'selected' : ''} ${showMenu ? 'menu-open' : ''}`}
        onMouseEnter={() => {
          setIsHovered(true);
          if (viewMode === 'grid') {
            setShowMenu(true);
          }
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          // Small delay before hiding menu to allow moving to it
          setTimeout(() => {
            if (!menuRef.current?.matches(':hover') && !menuRef.current?.querySelector(':hover')) {
              setShowMenu(false);
            }
          }, 200);
        }}
      onClick={handleFileClick}
    >
      {onSelect && (
        <div className="file-checkbox" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className="file-icon-wrapper">
        <div className="file-icon">{getFileIcon(mimeType)}</div>
        {mimeType.startsWith('image/') && (
          <div className="file-badge image-badge">IMG</div>
        )}
        {mimeType === 'application/pdf' && (
          <div className="file-badge pdf-badge">PDF</div>
        )}
      </div>
      <div className="file-info">
        <div className="file-name" title={file.name}>{file.name}</div>
      </div>
      <div className="file-size">
        {formatFileSize(fileSize)}
      </div>
      <div className="file-date">
        {formatDateTime(file.updated_at || file.created_at)}
      </div>
      {isHovered && (
        <div className="file-actions" onClick={(e) => e.stopPropagation()}>
          <div className="file-menu" ref={menuRef}>
            <button 
              className="file-menu-btn btn-icon" 
              onClick={handleMenuClick}
              title="More options"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z" fill="currentColor"/>
              </svg>
            </button>
            {showMenu && (
              <div className="file-menu-dropdown">
                {onDownload && (
                  <button className="file-menu-item" onClick={() => handleMenuAction('download')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M19 12V19H5V12H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12H19ZM13 12.67L15.59 10.09L17 11.5L12 16.5L7 11.5L8.41 10.09L11 12.67V3H13V12.67Z" fill="currentColor"/>
                    </svg>
                    <span>Download</span>
                  </button>
                )}
                {onRename && (
                  <button className="file-menu-item" onClick={() => handleMenuAction('rename')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.12 5.13L18.87 8.88L20.71 7.04Z" fill="currentColor"/>
                    </svg>
                    <span>Rename</span>
                  </button>
                )}
                {onMove && (
                  <button className="file-menu-item" onClick={() => handleMenuAction('move')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 16H15V11H19L12 4L5 11H9V16ZM5 18H19V20H5V18Z" fill="currentColor"/>
                    </svg>
                    <span>Move</span>
                  </button>
                )}
                {onCopy && (
                  <button className="file-menu-item" onClick={() => handleMenuAction('copy')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                    </svg>
                    <span>Make a copy</span>
                  </button>
                )}
                <button className="file-menu-item" onClick={() => handleMenuAction('share')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.34C15.11 18.55 15.08 18.77 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor"/>
                  </svg>
                  <span>Share</span>
                </button>
                {onStar && (
                  <button className="file-menu-item" onClick={() => handleMenuAction('star')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      {file.is_starred ? (
                        <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="currentColor"/>
                      ) : (
                        <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                      )}
                    </svg>
                    <span>{file.is_starred ? 'Remove star' : 'Add star'}</span>
                  </button>
                )}
                <div className="file-menu-divider"></div>
                {onDelete && (
                  <button className="file-menu-item danger" onClick={() => handleMenuAction('delete')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/>
                    </svg>
                    <span>Move to trash</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        item={file}
        itemType="file"
        onShareUpdate={handleShareUpdate}
      />
    </div>
  );
};

export default FileItem;
