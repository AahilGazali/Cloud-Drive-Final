# Frontend Architecture - Visual Guide

## Complete Folder Tree

```
Frontend/
├── public/
│   └── index.html
├── src/
│   ├── services/              # 🔵 API Communication Layer
│   │   ├── apiClient.js      # Centralized HTTP client
│   │   ├── auth.service.js   # Auth API calls
│   │   ├── files.service.js  # Files API calls
│   │   ├── folders.service.js # Folders API calls
│   │   ├── trash.service.js   # Trash API calls
│   │   └── index.js           # Central export
│   │
│   ├── context/              # 🟢 Global State
│   │   └── AuthContext.js    # Authentication state
│   │
│   ├── hooks/                # 🟡 Custom React Hooks
│   │   ├── useFiles.js       # File operations hook
│   │   ├── useFolders.js     # Folder operations hook
│   │   └── useFolderNavigation.js # Navigation state hook
│   │
│   ├── components/           # 🟠 Reusable UI Components
│   │   ├── Breadcrumbs/
│   │   │   └── Breadcrumbs.js
│   │   ├── FileItem/
│   │   │   └── FileItem.js
│   │   ├── FolderItem/
│   │   │   └── FolderItem.js
│   │   └── FileExplorer/
│   │       └── FileExplorer.js
│   │
│   ├── pages/                # 🔴 Route-Level Screens
│   │   ├── Dashboard/
│   │   │   └── Dashboard.js
│   │   └── Login/
│   │       └── Login.js
│   │
│   ├── utils/                # ⚪ Utility Functions
│   │   ├── constants.js      # App constants
│   │   └── helpers.js        # Helper functions
│   │
│   ├── App.js                # Root component (routing)
│   ├── index.js              # Entry point
│   └── index.css             # Global styles
│
└── package.json
```

## Layer Responsibilities

### 🔵 Services Layer (`services/`)

**What it is**: A FOLDER containing all API communication logic.

**What goes here**:
- `apiClient.js`: Base HTTP client with auth headers, error handling
- `auth.service.js`: Sign up, sign in, sign out, get current user
- `files.service.js`: List files, upload, download (signed URLs), delete
- `folders.service.js`: List folders, create, rename, delete
- `trash.service.js`: List trash, restore, permanently delete
- `index.js`: Central export for clean imports

**Key Rules**:
- ✅ Can import: `apiClient`
- ❌ Cannot import: components, hooks, context, pages
- Each service is a domain-specific module
- All HTTP calls go through `apiClient`

**Example Structure**:
```javascript
// services/files.service.js
import apiClient from './apiClient';

export const filesService = {
  listFiles: async (folderId) => {
    return apiClient.get(`/files?folderId=${folderId}`);
  },
  // ... more methods
};
```

### 🟢 Context Layer (`context/`)

**What it is**: Global state management using React Context API.

**What goes here**:
- `AuthContext.js`: User authentication state, login/logout functions

**Key Rules**:
- ✅ Can import: services
- ❌ Cannot import: components, pages
- Provides state and functions via Context Provider
- Used by hooks and components via `useContext` or custom hooks

### 🟡 Hooks Layer (`hooks/`)

**What it is**: Custom React hooks that encapsulate business logic.

**What goes here**:
- `useFiles.js`: Fetch files, handle downloads, manage file state
- `useFolders.js`: Fetch folders, create folders, manage folder state
- `useFolderNavigation.js`: Track current folder, breadcrumbs, navigation

**Key Rules**:
- ✅ Can import: services, context
- ❌ Cannot import: components, pages
- Hooks return state and functions for components to use
- Components call hooks, hooks call services

**Example**:
```javascript
// hooks/useFiles.js
import { filesService } from '../services';

export const useFiles = (folderId) => {
  const [files, setFiles] = useState([]);
  // ... fetch logic using filesService
  return { files, downloadFile, ... };
};
```

### 🟠 Components Layer (`components/`)

**What it is**: Reusable UI components.

**What goes here**:
- `Breadcrumbs`: Shows folder path, handles navigation
- `FileItem`: Displays single file, handles download/delete
- `FolderItem`: Displays single folder, handles navigation
- `FileExplorer`: Main component that lists files and folders

**Key Rules**:
- ✅ Can import: hooks, other components, utils
- ❌ Cannot import: services directly, pages
- Components receive data via props or hooks
- No API calls inside components (use hooks instead)

### 🔴 Pages Layer (`pages/`)

**What it is**: Route-level screens that compose components.

**What goes here**:
- `Dashboard`: Main app page (contains FileExplorer)
- `Login`: Authentication page

**Key Rules**:
- ✅ Can import: components, hooks, context
- ❌ Cannot import: services directly (use hooks)
- Pages are route-level, components are reusable

### ⚪ Utils Layer (`utils/`)

**What it is**: Pure utility functions and constants.

**What goes here**:
- `constants.js`: API endpoints, enums, config values
- `helpers.js`: Formatting functions (file size, dates), validators

**Key Rules**:
- ✅ Can be imported by anyone
- ❌ Cannot import anything from other layers
- Pure functions only, no side effects

## Import Rules Summary

| Layer | Can Import | Cannot Import |
|-------|-----------|---------------|
| **Services** | `apiClient` | Components, Hooks, Context, Pages |
| **Context** | Services | Components, Pages |
| **Hooks** | Services, Context | Components, Pages |
| **Components** | Hooks, Components, Utils | Services (directly), Pages |
| **Pages** | Components, Hooks, Context | Services (directly) |
| **Utils** | Nothing | Everything |

## Data Flow Example: File Download

```
1. User clicks "Download" in FileItem component
   ↓
2. FileItem calls onDownload(file.id) prop
   ↓
3. FileExplorer receives callback, calls downloadFile(fileId) from useFiles hook
   ↓
4. useFiles hook calls filesService.getSignedUrl(fileId)
   ↓
5. filesService uses apiClient.get() to make HTTP request
   ↓
6. Backend returns signed URL
   ↓
7. Hook opens URL in new window
   ↓
8. File downloads
```

## Future Features - How to Add

### Upload Feature
1. Add `uploadFile` method to `filesService.js`
2. Add `uploadFile` function to `useFiles.js` hook
3. Create `UploadButton` component in `components/`
4. Use in `FileExplorer` or `Dashboard`

### Sharing Feature
1. Create `sharesService.js` in `services/`
2. Create `useShares.js` hook in `hooks/`
3. Create `ShareDialog` component in `components/`
4. Add share button to `FileItem` or `FolderItem`

### Search Feature
1. Create `searchService.js` in `services/`
2. Create `useSearch.js` hook in `hooks/`
3. Create `SearchBar` component in `components/`
4. Add to `Dashboard` header

### Trash Feature
1. Use existing `trashService.js`
2. Create `useTrash.js` hook in `hooks/`
3. Create `TrashPage.js` in `pages/`
4. Add route in `App.js`

## Key Principles

1. **Separation of Concerns**: Each layer has one clear responsibility
2. **No Direct API Calls in Components**: Always use hooks
3. **Reusability**: Services and hooks can be used anywhere
4. **Testability**: Each layer can be tested independently
5. **Scalability**: Easy to add features without breaking existing code
