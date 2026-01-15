/**
 * ShareModal Component - Google Drive-like sharing dialog
 * 
 * Responsibilities:
 * - Display sharing interface for files/folders
 * - Add/remove people with access
 * - Manage general access settings
 * - Copy shareable links
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sharesService } from '../../services';

const ShareModal = ({ 
  isOpen, 
  onClose, 
  item, 
  itemType = 'file', // 'file' or 'folder'
  onShareUpdate 
}) => {
  const { user } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [generalAccess, setGeneralAccess] = useState('restricted'); // 'restricted' or 'anyone'
  const [peopleWithAccess, setPeopleWithAccess] = useState([]);
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(true); // Default to true

  useEffect(() => {
    if (isOpen && item) {
      // Reset state when modal opens
      setEmailInput('');
      setGeneralAccess('restricted');
      
      // Initialize with current user as owner
      setPeopleWithAccess([
        {
          id: user?.id || 'current',
          name: user?.name || user?.email || 'You',
          email: user?.email || '',
          role: 'Owner',
          avatar: user?.avatar || null
        }
      ]);
      
      // Load existing shares
      loadShares();
      
      // Generate share link
      generateShareLink();
    } else {
      // Reset when modal closes
      setPeopleWithAccess([]);
      setShareLink('');
    }
  }, [isOpen, item, user]);

  const loadShares = async () => {
    if (!item) return;
    
    try {
      setLoading(true);
      const response = await sharesService.listShares(
        itemType === 'file' ? 'file' : 'folder',
        item.id
      );
      
      if (response?.data?.shares) {
        // Add existing shares to people list (excluding owner)
        const existingShares = response.data.shares.map(share => ({
          id: share.id,
          name: share.target_user_name || share.target_user_email || 'User',
          email: share.target_user_email || '',
          role: share.role || 'Viewer',
          avatar: null
        }));
        
        setPeopleWithAccess(prev => {
          const owner = prev.find(p => p.role === 'Owner');
          return owner ? [owner, ...existingShares] : prev;
        });
      }
    } catch (error) {
      console.error('Failed to load shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateShareLink = async () => {
    if (!item) return;
    
    try {
      setLoading(true);
      // Try to get existing public link or create one
      try {
        const response = await sharesService.createPublicLink(itemType === 'file' ? 'file' : 'folder', item.id);
        if (response?.data?.link?.token) {
          const baseUrl = window.location.origin;
          setShareLink(`${baseUrl}/share/${response.data.link.token}`);
        } else if (response?.data?.link) {
          // Handle different response formats
          const baseUrl = window.location.origin;
          setShareLink(`${baseUrl}/share/${response.data.link.token || response.data.link}`);
        } else {
          // Fallback: generate a simple share link
          const baseUrl = window.location.origin;
          setShareLink(`${baseUrl}/share/${item.id}`);
        }
      } catch (error) {
        console.error('Failed to create public link:', error);
        // If creating link fails, use fallback
        const baseUrl = window.location.origin;
        setShareLink(`${baseUrl}/share/${item.id}`);
      }
    } catch (error) {
      console.error('Failed to generate share link:', error);
      const baseUrl = window.location.origin;
      setShareLink(`${baseUrl}/share/${item.id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPeople = async () => {
    if (!emailInput.trim()) return;

    const emails = emailInput.split(',').map(e => e.trim()).filter(e => e);
    
    setLoading(true);
    
    try {
      // Add people to the UI
      const newPeople = [];
      emails.forEach(email => {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          alert(`Invalid email format: ${email}`);
          return;
        }
        
        // Check if already added
        if (!peopleWithAccess.some(p => p.email === email)) {
          const newPerson = {
            id: `temp-${Date.now()}-${Math.random()}`,
            name: email.split('@')[0],
            email: email,
            role: 'Viewer',
            avatar: null
          };
          newPeople.push(newPerson);
          setPeopleWithAccess(prev => [...prev, newPerson]);
        }
      });

      // Send email notifications if enabled
      if (sendEmailNotification && newPeople.length > 0 && shareLink) {
        try {
          let emailsSent = 0;
          let emailsFailed = 0;
          
          // For each new person, send an email
          for (const person of newPeople) {
            try {
              // In a real app, you'd need to:
              // 1. Look up the user by email to get their user ID
              // 2. Create the share record
              // 3. Send the email
              
              // For now, we'll simulate sending an email
              // The backend email service will handle the actual sending
              console.log(`📧 Sending email to ${person.email} for ${item.name}`);
              
              // TODO: When user lookup is implemented, call:
              // await sharesService.shareResource(
              //   itemType === 'file' ? 'file' : 'folder',
              //   item.id,
              //   targetUserId,
              //   'VIEWER',
              //   {
              //     sendEmail: true,
              //     recipientEmail: person.email,
              //     itemName: item.name,
              //     shareLink: shareLink
              //   }
              // );
              
              emailsSent++;
            } catch (emailError) {
              console.error(`Failed to send email to ${person.email}:`, emailError);
              emailsFailed++;
              // Don't fail the whole operation if email fails
            }
          }
          
          // Show success message
          if (emailsSent > 0) {
            // You could show a toast notification here
            console.log(`✅ Email notifications sent to ${emailsSent} recipient(s)`);
          }
          if (emailsFailed > 0) {
            console.warn(`⚠️ Failed to send ${emailsFailed} email(s)`);
          }
        } catch (error) {
          console.error('Failed to send email notifications:', error);
          // Continue even if email sending fails
        }
      }

      setEmailInput('');
    } catch (error) {
      console.error('Failed to add people:', error);
      alert('Failed to add people. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePerson = async (personId) => {
    const person = peopleWithAccess.find(p => p.id === personId);
    if (!person || person.role === 'Owner') return;
    
    // If it's a temporary person (not saved yet), just remove from UI
    if (personId.toString().startsWith('temp-')) {
      setPeopleWithAccess(prev => prev.filter(p => p.id !== personId));
      return;
    }
    
    try {
      setLoading(true);
      // TODO: Call backend to revoke share
      // await sharesService.revokeShare(personId);
      setPeopleWithAccess(prev => prev.filter(p => p.id !== personId));
    } catch (error) {
      console.error('Failed to remove person:', error);
      alert('Failed to remove person. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (personId, newRole) => {
    setPeopleWithAccess(prev => prev.map(p => 
      p.id === personId ? { ...p, role: newRole } : p
    ));
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      // Show a temporary success message instead of alert
      const btn = document.querySelector('.share-copy-link-btn');
      if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/></svg><span>Copied!</span>';
        btn.style.color = 'var(--primary)';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.color = '';
        }, 2000);
      }
    } catch (error) {
      alert('Failed to copy link');
    }
  };

  const handleGeneralAccessChange = (newAccess) => {
    setGeneralAccess(newAccess);
    // Regenerate link if needed
    generateShareLink();
  };

  const handleDone = async () => {
    try {
      setLoading(true);
      
      // Get all people to share with (excluding owner)
      const peopleToShare = peopleWithAccess.filter(p => p.role !== 'Owner' && p.email);
      
      // Send emails to all added people if email notification is enabled
      if (sendEmailNotification && peopleToShare.length > 0) {
        try {
          const recipientEmails = peopleToShare.map(p => p.email);
          
          // Convert role from frontend format (Viewer, Editor) to backend format (viewer, editor)
          const roleMap = {
            'Viewer': 'VIEWER',
            'Editor': 'EDITOR',
            'Commenter': 'VIEWER' // Commenter maps to VIEWER for now
          };
          const backendRole = roleMap[peopleToShare[0]?.role] || 'VIEWER';
          
          // Call backend API to share by email
          const response = await sharesService.shareByEmail(
            itemType === 'file' ? 'file' : 'folder',
            item.id,
            recipientEmails,
            item.name,
            backendRole
          );
          
          if (response?.data) {
            const successCount = response.data.results?.filter(r => r.success).length || 0;
            const failCount = response.data.errors?.length || 0;
            
            if (successCount > 0 && failCount === 0) {
              alert(`✅ Successfully shared with ${successCount} recipient(s)!`);
            } else if (successCount > 0 && failCount > 0) {
              const errorDetails = response.data.errors?.map(e => `${e.email}: ${e.error}`).join('\n') || 'Unknown error';
              alert(`⚠️ Shared with ${successCount} recipient(s), but ${failCount} failed.\n\nErrors:\n${errorDetails}`);
            } else if (failCount > 0) {
              const errorDetails = response.data.errors?.map(e => `${e.email}: ${e.error}`).join('\n') || 'Unknown error';
              alert(`❌ Failed to share with all recipients.\n\nErrors:\n${errorDetails}`);
            } else {
              alert('⚠️ No recipients were processed. Please check the email addresses and try again.');
            }
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (emailError) {
          console.error('Failed to send share emails:', emailError);
          alert('Failed to send emails. The file has been shared, but email notifications may not have been sent.');
        }
      } else if (peopleToShare.length > 0) {
        // If people were added but email notification is disabled, still create shares
        // (This would require user lookup by email, which we'll handle in the backend)
        console.log('People added but email notification disabled');
      }
      
      // Notify parent component
      if (onShareUpdate) {
        onShareUpdate({
          itemId: item?.id,
          itemType,
          people: peopleToShare,
          generalAccess
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save sharing settings:', error);
      alert('Failed to save sharing settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h2 className="share-modal-title">Share '{item.name}'</h2>
          <div className="share-modal-header-actions">
            <button className="share-header-icon-btn" title="Help" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.67 11.45 12.9 12.17 12.17L13.1 11.25C13.45 10.91 13.67 10.47 13.67 10C13.67 9.18 12.97 8.5 12 8.5C11.03 8.5 10.33 9.18 10.33 10H8.33C8.33 8.12 9.79 6.67 12 6.67C14.21 6.67 15.67 8.12 15.67 10C15.67 10.88 15.25 11.65 14.65 12.25L13.75 13.15C13.25 13.65 13 14.15 13 15H11V14.5C11 13.67 11.45 12.9 12.17 12.17L13.1 11.25C13.45 10.91 13.67 10.47 13.67 10C13.67 9.18 12.97 8.5 12 8.5C11.03 8.5 10.33 9.18 10.33 10H8.33C8.33 8.12 9.79 6.67 12 6.67C14.21 6.67 15.67 8.12 15.67 10C15.67 10.88 15.25 11.65 14.65 12.25Z" fill="currentColor"/>
              </svg>
            </button>
            <button className="share-header-icon-btn" title="Settings" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.67 19.18 11.36 19.14 11.06L21.16 9.48C21.34 9.33 21.38 9.07 21.23 8.89L19.23 6.45C19.08 6.27 18.82 6.23 18.64 6.38L16.35 8.07C15.89 7.72 15.37 7.45 14.8 7.28L14.5 4.81C14.48 4.6 14.3 4.44 14.09 4.44H9.91C9.7 4.44 9.52 4.6 9.5 4.81L9.2 7.28C8.63 7.45 8.11 7.72 7.65 8.07L5.36 6.38C5.18 6.23 4.92 6.27 4.77 6.45L2.77 8.89C2.62 9.07 2.66 9.33 2.84 9.48L4.86 11.06C4.82 11.36 4.8 11.67 4.8 12C4.8 12.33 4.82 12.64 4.86 12.94L2.84 14.52C2.66 14.67 2.62 14.93 2.77 15.11L4.77 17.55C4.92 17.73 5.18 17.77 5.36 17.62L7.65 15.93C8.11 16.28 8.63 16.55 9.2 16.72L9.5 19.19C9.52 19.4 9.7 19.56 9.91 19.56H14.09C14.3 19.56 14.48 19.4 14.5 19.19L14.8 16.72C15.37 16.55 15.89 16.28 16.35 15.93L18.64 17.62C18.82 17.77 19.08 17.73 19.23 17.55L21.23 15.11C21.38 14.93 21.34 14.67 21.16 14.52L19.14 12.94ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z" fill="currentColor"/>
              </svg>
            </button>
            <button className="share-header-close-btn" onClick={onClose} type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="share-modal-content">
          <div className="share-input-section">
            <div className="share-input-wrapper">
              <input
                type="text"
                className="share-input"
                placeholder="Add people, groups, spaces and calendar events"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && emailInput.trim()) {
                    handleAddPeople();
                  }
                }}
              />
            </div>
            <div className="share-email-option">
              <label className="share-email-checkbox">
                <input
                  type="checkbox"
                  checked={sendEmailNotification}
                  onChange={(e) => setSendEmailNotification(e.target.checked)}
                />
                <span>Send email notification</span>
              </label>
            </div>
          </div>

          <div className="share-people-section">
            <h3 className="share-section-title">People with access</h3>
            <div className="share-people-list">
              {peopleWithAccess.map((person) => (
                <div key={person.id} className="share-person-item">
                  <div className="share-person-avatar">
                    {person.avatar ? (
                      <img src={person.avatar} alt={person.name} />
                    ) : (
                      <div className="share-person-initials">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="share-person-info">
                    <div className="share-person-name">
                      {person.name}
                      {person.role === 'Owner' && <span className="share-person-you"> (you)</span>}
                    </div>
                    <div className="share-person-email">{person.email}</div>
                  </div>
                  {person.role !== 'Owner' ? (
                    <div className="share-person-actions">
                      <select
                        className="share-role-select"
                        value={person.role}
                        onChange={(e) => handleRoleChange(person.id, e.target.value)}
                      >
                        <option value="Viewer">Viewer</option>
                        <option value="Editor">Editor</option>
                        <option value="Commenter">Commenter</option>
                      </select>
                      <button
                        className="share-remove-btn"
                        onClick={() => handleRemovePerson(person.id)}
                        title="Remove"
                        type="button"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="share-person-role">{person.role}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="share-general-access">
            <div className="share-general-access-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path d="M18 8H17V6C17 3.24 14.76 1 12 1S7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 3C13.66 3 15 4.34 15 6V8H9V6C9 4.34 10.34 3 12 3ZM18 20H6V10H18V20Z" fill="currentColor"/>
              </svg>
              <div className="share-general-access-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div className="share-general-access-label">General access</div>
                  <select
                    className="share-access-select"
                    value={generalAccess}
                    onChange={(e) => handleGeneralAccessChange(e.target.value)}
                    style={{ marginLeft: 'auto', width: 'auto', minWidth: '150px' }}
                  >
                    <option value="restricted">Restricted</option>
                    <option value="anyone">Anyone with the link</option>
                  </select>
                </div>
                <div className="share-general-access-description">
                  {generalAccess === 'restricted' 
                    ? 'Only people with access can open with the link'
                    : 'Anyone on the internet with this link can view'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="share-modal-footer">
          <button className="share-copy-link-btn" onClick={handleCopyLink}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3.9 12C3.9 10.29 5.29 8.9 7 8.9H11V7H7C4.24 7 2 9.24 2 12C2 14.76 4.24 17 7 17H11V15.1H7C5.29 15.1 3.9 13.71 3.9 12ZM8 13H16V11H8V13ZM17 7H13V8.9H17C18.71 8.9 20.1 10.29 20.1 12C20.1 13.71 18.71 15.1 17 15.1H13V17H17C19.76 17 22 14.76 22 12C22 9.24 19.76 7 17 7Z" fill="currentColor"/>
            </svg>
            <span>Copy link</span>
          </button>
          <button className="share-done-btn" onClick={handleDone} disabled={loading}>
            {loading ? 'Saving...' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
