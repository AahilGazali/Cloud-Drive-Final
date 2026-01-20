/**
 * Feedback Page - View submitted feedback
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackService } from '../../services';

const Feedback = () => {
  const navigate = useNavigate();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const response = await feedbackService.getUserFeedback();
        setFeedbackList(response.feedback || []);
      } catch (err) {
        console.error('Failed to fetch feedback:', err);
        setError('Failed to load feedback. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-page-header">
        <button className="feedback-back-btn" onClick={() => navigate('/dashboard')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/>
          </svg>
          <span>Back to Dashboard</span>
        </button>
        <div className="feedback-page-title">
          <h1>My Feedback</h1>
          <p>View all your submitted feedback</p>
        </div>
      </div>

      <div className="feedback-content">
        {loading ? (
          <div className="feedback-loading">Loading feedback...</div>
        ) : error ? (
          <div className="feedback-error-message">{error}</div>
        ) : feedbackList.length === 0 ? (
          <div className="feedback-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="var(--text-secondary)"/>
            </svg>
            <h3>No feedback yet</h3>
            <p>You haven't submitted any feedback yet. Use "Send Feedback" from the help menu to share your thoughts!</p>
          </div>
        ) : (
          <div className="feedback-list">
            {feedbackList.map((feedback) => (
              <div key={feedback.id} className="feedback-item">
                <div className="feedback-item-header">
                  <div className="feedback-item-date">{formatDate(feedback.created_at)}</div>
                </div>
                <div className="feedback-item-content">
                  {feedback.feedback}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;
