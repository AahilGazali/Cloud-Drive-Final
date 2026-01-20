# Quick Start Guide

## Setup

1. Install dependencies:
```bash
npm install react react-dom react-router-dom
```

2. Create `.env` file:
```
REACT_APP_API_URL=http://localhost:3000/api
```

3. Start development server:
```bash
npm start
```

## How to Use the Architecture

### Making an API Call

**Step 1**: Add method to appropriate service
```javascript
// services/files.service.js
export const filesService = {
  // ... existing methods
  renameFile: async (fileId, newName) => {
    return apiClient.patch(`/files/${fileId}`, { name: newName });
  },
};
```

**Step 2**: Use in a hook
```javascript
// hooks/useFiles.js
export const useFiles = (folderId) => {
  // ... existing code
  const renameFile = async (fileId, newName) => {
    try {
      await filesService.renameFile(fileId, newName);
      await fetchFiles(); // Refresh list
    } catch (error) {
      throw new Error(error.message);
    }
  };
  
  return { files, renameFile, ... };
};
```

**Step 3**: Use hook in component
```javascript
// components/FileItem/FileItem.js
import { useFiles } from '../../hooks/useFiles';

const FileItem = ({ file }) => {
  const { renameFile } = useFiles();
  
  const handleRename = async () => {
    const newName = prompt('New name:');
    if (newName) {
      await renameFile(file.id, newName);
    }
  };
  
  return <button onClick={handleRename}>Rename</button>;
};
```

## Common Patterns

### Pattern 1: Fetching Data
```javascript
// In a hook
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetch = async () => {
    const result = await service.getData();
    setData(result);
    setLoading(false);
  };
  fetch();
}, []);
```

### Pattern 2: Handling Errors
```javascript
// In a hook
const [error, setError] = useState(null);

try {
  await service.doSomething();
} catch (err) {
  setError(err.message);
}
```

### Pattern 3: Optimistic Updates
```javascript
// In a hook
const deleteFile = async (fileId) => {
  // Update UI immediately
  setFiles(prev => prev.filter(f => f.id !== fileId));
  
  try {
    await filesService.deleteFile(fileId);
  } catch (error) {
    // Rollback on error
    await fetchFiles();
    throw error;
  }
};
```

## File Responsibilities Quick Reference

| File | Responsibility |
|------|---------------|
| `services/*.service.js` | Make HTTP requests to backend |
| `hooks/use*.js` | Manage state, call services, return data/functions |
| `components/*.js` | Display UI, handle user interactions |
| `pages/*.js` | Compose components, handle routing |
| `context/*.js` | Provide global state |
| `utils/*.js` | Pure helper functions |

## Import Checklist

Before importing, ask:
- ✅ Is this the right layer?
- ✅ Does it follow import rules?
- ✅ Can I use a hook instead of a service?
- ✅ Is this component reusable or page-specific?
