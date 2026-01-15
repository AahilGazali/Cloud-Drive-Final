/**
 * Shared Page - Shows files shared with the user
 */

import React from 'react';

const Shared = () => {
  return (
    <div className="shared-page">
      <div className="empty-state">
        <div className="empty-state-content">
          <div className="empty-illustration">
            <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="shareGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#4285F4', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: '#34A853', stopOpacity: 1}} />
                </linearGradient>
              </defs>
              <circle cx="70" cy="80" r="25" fill="url(#shareGradient)" opacity="0.9"/>
              <circle cx="130" cy="80" r="25" fill="url(#shareGradient)" opacity="0.9"/>
              <path d="M70 120C70 105 82 93 97 93C112 93 124 105 124 120" stroke="url(#shareGradient)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.9"/>
              <path d="M130 120C130 105 142 93 157 93C172 93 184 105 184 120" stroke="url(#shareGradient)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.9"/>
            </svg>
          </div>
          <p className="empty-hint">Files shared with you will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default Shared;
