/**
 * Settings Page - User settings and preferences
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { authService } from '../../services';

const Settings = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    updates: true,
  });
  const [autoBackup, setAutoBackup] = useState(true);
  const [privacy, setPrivacy] = useState({
    dataSharing: true,
    downloadHistory: true,
  });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePrivacyChange = (key) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };

  const formatPasswordChangedDate = (dateString) => {
    if (!dateString) {
      return t('lastChanged') || 'Last changed: Never';
    }
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffTime / (1000 * 60));

      if (diffDays === 0 && diffHours === 0 && diffMinutes < 1) {
        return t('lastChangedJustNow') || 'Last changed: Just now';
      } else if (diffDays === 0 && diffHours === 0) {
        const minutesText = t('lastChangedMinutesAgo') || 'Last changed: {minutes} minute(s) ago';
        return minutesText.replace('{minutes}', diffMinutes);
      } else if (diffDays === 0) {
        const hoursText = t('lastChangedHoursAgo') || 'Last changed: {hours} hour(s) ago';
        return hoursText.replace('{hours}', diffHours);
      } else if (diffDays === 1) {
        return t('lastChangedYesterday') || 'Last changed: Yesterday';
      } else if (diffDays < 7) {
        const daysText = t('lastChangedDaysAgo') || 'Last changed: {days} days ago';
        return daysText.replace('{days}', diffDays);
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        const weeksText = t('lastChangedWeeksAgo') || 'Last changed: {weeks} week(s) ago';
        return weeksText.replace('{weeks}', weeks);
      } else {
        // Format as full date
        const dateText = date.toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        return (t('lastChangedOn') || 'Last changed on') + ' ' + dateText;
      }
    } catch (error) {
      return t('lastChanged') || 'Last changed: Never';
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!emailForm.newEmail || !emailForm.password) {
        setError(t('fillAllFields') || 'Please fill in all fields');
        setLoading(false);
        return;
      }

      if (!emailForm.newEmail.includes('@')) {
        setError(t('invalidEmail') || 'Please enter a valid email address');
        setLoading(false);
        return;
      }

      const response = await authService.changeEmail(emailForm.newEmail, emailForm.password);
      setSuccess(t('emailChangedSuccess') || 'Email changed successfully!');
      setLoading(false);
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailForm({ newEmail: '', password: '' });
        setSuccess('');
        setError('');
        // Refresh user data
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Email change error:', err);
      const errorMessage = err.response?.data?.message || err.message || (t('emailChangeFailed') || 'Failed to change email. Please try again.');
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        setError(t('fillAllFields') || 'Please fill in all fields');
        setLoading(false);
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError(t('passwordsDoNotMatch') || 'New passwords do not match');
        setLoading(false);
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setError(t('passwordMinLength') || 'Password must be at least 6 characters long');
        setLoading(false);
        return;
      }

      const response = await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setSuccess(t('passwordChangedSuccess') || 'Password changed successfully!');
      setLoading(false);
      
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setSuccess('');
        setError('');
        // Refresh user data to get updated passwordChangedAt
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Password change error:', err);
      const errorMessage = err.response?.data?.message || err.message || (t('passwordChangeFailed') || 'Failed to change password. Please check your current password.');
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <button className="settings-back-btn" onClick={() => navigate('/dashboard')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
          </svg>
          <span>{t('backToDashboard')}</span>
        </button>
        <div className="settings-page-title">
          <h1>{t('settings')}</h1>
          <p>{t('manageAccount')}</p>
        </div>
      </div>

      <div className="settings-content">
        {/* Account Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">{t('account')}</h2>
          <div className="settings-item">
            <div className="settings-item-info">
              <h3>{t('email')}</h3>
              <p>{user?.email || 'Not available'}</p>
            </div>
            <button 
              className="settings-btn-secondary"
              onClick={() => {
                setShowEmailModal(true);
                setError('');
                setSuccess('');
                setEmailForm({ newEmail: '', password: '' });
              }}
            >
              {t('change')}
            </button>
          </div>
          <div className="settings-item">
            <div className="settings-item-info">
              <h3>{t('password')}</h3>
              <p>{formatPasswordChangedDate(user?.passwordChangedAt)}</p>
            </div>
            <button 
              className="settings-btn-secondary"
              onClick={() => {
                setShowPasswordModal(true);
                setError('');
                setSuccess('');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
            >
              {t('change')}
            </button>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">{t('appearance')}</h2>
          <div className="settings-item">
            <div className="settings-item-info">
              <h3>{t('theme')}</h3>
              <p>{t('chooseTheme')}</p>
            </div>
            <button 
              className="settings-btn-secondary"
              onClick={toggleTheme}
            >
              {isDark ? 'Dark' : 'Light'}
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">{t('notifications')}</h2>
          <div className="settings-item">
            <div className="settings-item-info">
              <h3>{t('emailNotifications')}</h3>
              <p>{t('receiveEmailNotifications')}</p>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={notifications.email}
                onChange={() => handleNotificationChange('email')}
              />
              <span className="settings-toggle-slider"></span>
            </label>
          </div>
          <div className="settings-item">
            <div className="settings-item-info">
              <h3>{t('pushNotifications')}</h3>
              <p>{t('receivePushNotifications')}</p>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={notifications.push}
                onChange={() => handleNotificationChange('push')}
              />
              <span className="settings-toggle-slider"></span>
            </label>
          </div>
          <div className="settings-item">
            <div className="settings-item-info">
              <h3>{t('productUpdates')}</h3>
              <p>{t('getNotified')}</p>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={notifications.updates}
                onChange={() => handleNotificationChange('updates')}
              />
              <span className="settings-toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* General Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">{t('general')}</h2>
          <div className="settings-item">
            <div className="settings-item-info">
              <h3>{t('language')}</h3>
              <p>{t('selectLanguage')}</p>
            </div>
            <select 
              className="settings-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="de">Deutsch (German)</option>
            </select>
          </div>
          <div className="settings-item">
            <div className="settings-item-info">
              <h3>{t('autoBackup')}</h3>
              <p>{t('autoBackupDesc')}</p>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={() => setAutoBackup(!autoBackup)}
              />
              <span className="settings-toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">{t('privacy')}</h2>
          <div className="settings-item">
            <div className="settings-item-info">
              <h3>{t('dataSharing')}</h3>
              <p>{t('dataSharingDesc')}</p>
            </div>
            <label className="settings-toggle">
              <input 
                type="checkbox" 
                checked={privacy.dataSharing}
                onChange={() => handlePrivacyChange('dataSharing')}
              />
              <span className="settings-toggle-slider"></span>
            </label>
          </div>
          <div className="settings-item">
            <div className="settings-item-info">
              <h3>{t('downloadHistory')}</h3>
              <p>{t('downloadHistoryDesc')}</p>
            </div>
            <label className="settings-toggle">
              <input 
                type="checkbox" 
                checked={privacy.downloadHistory}
                onChange={() => handlePrivacyChange('downloadHistory')}
              />
              <span className="settings-toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="settings-modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2>{t('changeEmail')}</h2>
              <button 
                className="settings-modal-close"
                onClick={() => setShowEmailModal(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            <div className="settings-modal-content">
              <form onSubmit={handleEmailChange}>
                <div className="settings-form-group">
                  <label>{t('newEmail')}</label>
                  <input
                    type="email"
                    className="settings-form-input"
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                    placeholder={user?.email || 'Enter new email'}
                    required
                  />
                </div>
                <div className="settings-form-group">
                  <label>{t('currentPassword')}</label>
                  <input
                    type="password"
                    className="settings-form-input"
                    value={emailForm.password}
                    onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                {error && <div className="settings-error">{error}</div>}
                {success && <div className="settings-success">{success}</div>}
                <div className="settings-modal-actions">
                  <button 
                    type="button"
                    className="settings-btn-secondary"
                    onClick={() => setShowEmailModal(false)}
                    disabled={loading}
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="settings-btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : t('save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="settings-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2>{t('changePassword')}</h2>
              <button 
                className="settings-modal-close"
                onClick={() => setShowPasswordModal(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            <div className="settings-modal-content">
              <form onSubmit={handlePasswordChange}>
                <div className="settings-form-group">
                  <label>{t('currentPassword')}</label>
                  <input
                    type="password"
                    className="settings-form-input"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div className="settings-form-group">
                  <label>{t('newPassword')}</label>
                  <input
                    type="password"
                    className="settings-form-input"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div className="settings-form-group">
                  <label>{t('confirmPassword')}</label>
                  <input
                    type="password"
                    className="settings-form-input"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                {error && <div className="settings-error">{error}</div>}
                {success && <div className="settings-success">{success}</div>}
                <div className="settings-modal-actions">
                  <button 
                    type="button"
                    className="settings-btn-secondary"
                    onClick={() => setShowPasswordModal(false)}
                    disabled={loading}
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="settings-btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : t('save')}
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

export default Settings;
