# Frontend Architecture Documentation

## Folder Structure

```
Frontend/src/
├── services/           # API communication layer
│   ├── apiClient.js   # Centralized HTTP client
│   ├── auth.service.js
│   ├── files.service.js
│   ├── folders.service.js
│   ├── trash.service.js
│   └── index.js       # Central export
│
├── context/           # Global state management
│   └── AuthContext.js # Authentication context
│
├── hooks/             # Custom React hooks
│   ├── useFiles.js
│   ├── useFolders.js
│   └── useFolderNavigation.js
│
├── components/        # Reusable UI components
│   ├── Breadcrumbs/
│   │   └── Breadcrumbs.js
│   ├── FileItem/
│   │   └── FileItem.js
│   ├── FolderItem/
│   │   └── FolderItem.js
│   └── FileExplorer/
│       └── FileExplorer.js
│
├── pages/            # Route-level screens
│   ├── Dashboard/
│   │   └── Dashboard.js
│   └── Login/
│       └── Login.js
│
├── utils/            # Helper functions
│   ├── constants.js
│   └── helpers.js
│
├── App.js            # Root component with routing
└── index.js          # Entry point
```

## Architecture Overview

### 1. Services Layer (`services/`)

**Purpose**: All API calls live here. This is a FOLDER, not a single file.

**Organization**:
- One service file per domain (auth, files, folders, trash)
- `apiClient.js` provides a centralized HTTP client
- Each service exports an object with methods

**Import Rules**:
- ✅ Can import: `apiClient`
- ❌ Should NOT import: components, hooks, context, pages

**Example Usage**:
```javascript
// In a hook or component
import { filesService } from '../services';

const data = await filesService.listFiles(folderId);
```

### 2. Context Layer (`context/`)

**Purpose**: Global state that needs to be shared across the app.

**Current Context**:
- `AuthContext`: Manages authentication state (user, login, logout)

**Import Rules**:
- ✅ Can import: services
- ❌ Should NOT import: components, pages

### 3. Hooks Layer (`hooks/`)

**Purpose**: Custom React hooks that encapsulate business logic and state management.

**Current Hooks**:
- `useFiles`: Fetches files, handles download
- `useFolders`: Fetches folders, handles creation
- `useFolderNavigation`: Manages folder navigation state (breadcrumbs)

**Import Rules**:
- ✅ Can import: services, context
- ❌ Should NOT import: components, pages

### 4. Components Layer (`components/`)

**Purpose**: Reusable UI components that are domain-agnostic.

**Current Components**:
- `Breadcrumbs`: Navigation path display
- `FileItem`: Single file display
- `FolderItem`: Single folder display
- `FileExplorer`: Main file/folder listing component

**Import Rules**:
- ✅ Can import: hooks, other components
- ❌ Should NOT import: services directly, pages

### 5. Pages Layer (`pages/`)

**Purpose**: Route-level screens that compose components.

**Current Pages**:
- `Login`: Authentication page
- `Dashboard`: Main app page (contains FileExplorer)

**Import Rules**:
- ✅ Can import: components, hooks, context
- ❌ Should NOT import: services directly (use hooks instead)

### 6. Utils Layer (`utils/`)

**Purpose**: Pure utility functions and constants.

**Files**:
- `constants.js`: API endpoints, enums, config values
- `helpers.js`: Formatting functions, validators

**Import Rules**:
- ✅ Can be imported by anyone
- ❌ Should NOT import anything from other layers

## Data Flow

```
User Action (Component)
    ↓
Hook (useFiles, useFolders, etc.)
    ↓
Service (filesService, foldersService, etc.)
    ↓
API Client (apiClient)
    ↓
Backend API
```

## Example: File Download Flow

1. User clicks "Download" button in `FileItem` component
2. `FileItem` calls `onDownload(file.id)` prop
3. `FileExplorer` receives this and calls `downloadFile(fileId)` from `useFiles` hook
4. `useFiles` hook calls `filesService.getSignedUrl(fileId)`
5. `filesService` uses `apiClient.get()` to make HTTP request
6. Response returns signed URL
7. Hook opens URL in new window
8. Component updates (if needed)

## Future Extensibility

This architecture supports adding:

- **Upload**: Add `uploadFile` to `useFiles` hook, call `filesService.uploadFile()`
- **Sharing**: Create `sharesService.js`, `useShares` hook, `ShareDialog` component
- **Permissions**: Extend `useFiles`/`useFolders` to check permissions
- **Trash**: Use existing `trashService.js`, create `useTrash` hook, `TrashPage`
- **Search**: Create `searchService.js`, `useSearch` hook, `SearchBar` component

## Key Principles

1. **Separation of Concerns**: Each layer has a clear responsibility
2. **No Direct API Calls in Components**: Components use hooks, hooks use services
3. **Reusability**: Services and hooks can be used across multiple components
4. **Testability**: Each layer can be tested independently
5. **Scalability**: Easy to add new features without refactoring existing code
