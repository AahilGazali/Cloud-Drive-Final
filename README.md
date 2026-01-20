# G-Drive - Cloud Storage Application

A full-stack cloud storage application with React frontend and Node.js backend.

## Project Structure

This is a monorepo containing both frontend and backend code.

- `Backend/` - Node.js/Express backend API
- `Frontend/` - React frontend application
- `src/` - Frontend source code
- `public/` - Public assets

## Frontend Architecture

### Folder Structure

```
src/
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
│   ├── FileItem/
│   ├── FolderItem/
│   └── FileExplorer/
│
├── pages/            # Route-level screens
│   ├── Dashboard/
│   └── Login/
│
├── utils/            # Helper functions
│   ├── constants.js
│   └── helpers.js
│
├── App.js            # Root component with routing
└── index.js          # Entry point
```

### Architecture Overview

#### 1. Services Layer (`services/`)
All API calls live here. One service file per domain (auth, files, folders, trash).

#### 2. Context Layer (`context/`)
Global state that needs to be shared across the app.

#### 3. Hooks Layer (`hooks/`)
Custom React hooks that encapsulate business logic and state management.

#### 4. Components Layer (`components/`)
Reusable UI components that are domain-agnostic.

#### 5. Pages Layer (`pages/`)
Route-level screens that compose components.

#### 6. Utils Layer (`utils/`)
Pure utility functions and constants.

## Getting Started

See `QUICK_START.md` for detailed setup instructions.

## Key Principles

1. **Separation of Concerns**: Each layer has a clear responsibility
2. **No Direct API Calls in Components**: Components use hooks, hooks use services
3. **Reusability**: Services and hooks can be used across multiple components
4. **Testability**: Each layer can be tested independently
5. **Scalability**: Easy to add new features without refactoring existing code
