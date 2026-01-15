/**
 * Breadcrumbs Component - Displays folder navigation path
 * 
 * Responsibilities:
 * - Show current folder path
 * - Allow clicking to navigate back
 * 
 * Import rules:
 * - Can import: hooks (useFolderNavigation)
 * - Can import: other components
 * - Should NOT import: services, pages
 */

import React from 'react';

const Breadcrumbs = ({ breadcrumbs, onNavigate }) => {
  return (
    <nav className="breadcrumbs">
      {breadcrumbs.length === 0 ? (
        <div className="breadcrumb-item active">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/>
          </svg>
          Home
        </div>
      ) : (
        breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id || 'root'}>
            {index > 0 && <span className="breadcrumb-separator">›</span>}
            <button
              onClick={() => onNavigate(crumb.id)}
              className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
              disabled={index === breadcrumbs.length - 1}
            >
              {index === 0 && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                  <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="currentColor"/>
                </svg>
              )}
              {crumb.name}
            </button>
          </React.Fragment>
        ))
      )}
    </nav>
  );
};

export default Breadcrumbs;
