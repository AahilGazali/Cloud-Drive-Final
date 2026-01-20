/**
 * Helpers - Utility functions
 * 
 * Responsibilities:
 * - Format file sizes
 * - Format dates
 * - Validate inputs
 * - Other reusable utility functions
 */

/**
 * Format bytes to human-readable size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get file icon component based on mime type
 */
export const getFileIcon = (mimeType) => {
  if (!mimeType) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#5F6368"/>
      </svg>
    );
  }
  
  const type = mimeType.toLowerCase();
  
  // Images
  if (type.startsWith('image/')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="#4285F4"/>
      </svg>
    );
  }
  
  // PDF
  if (type === 'application/pdf' || type.includes('pdf')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#EA4335"/>
      </svg>
    );
  }
  
  // Documents (Word, Text)
  if (type.includes('word') || type.includes('document') || type.includes('text') || type.includes('plain')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#4285F4"/>
      </svg>
    );
  }
  
  // Spreadsheets
  if (type.includes('excel') || type.includes('spreadsheet') || type.includes('csv')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="#34A853"/>
        <path d="M7 8H17V10H7V8ZM7 12H17V14H7V12ZM7 16H14V18H7V16Z" fill="#34A853"/>
      </svg>
    );
  }
  
  // Presentations
  if (type.includes('powerpoint') || type.includes('presentation')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#FF9800"/>
      </svg>
    );
  }
  
  // Archives
  if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('archive')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20 6H12L10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6ZM20 18H4V8H20V18Z" fill="#9E9E9E"/>
      </svg>
    );
  }
  
  // Video
  if (type.startsWith('video/')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21 3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3ZM21 19H3V5H21V19ZM8 10V14L13 12L8 10Z" fill="#9C27B0"/>
      </svg>
    );
  }
  
  // Audio
  if (type.startsWith('audio/')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17S7.79 21 10 21S14 19.21 14 17V7H18V3H12Z" fill="#FF5722"/>
      </svg>
    );
  }
  
  // Default file icon
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#5F6368"/>
    </svg>
  );
};
