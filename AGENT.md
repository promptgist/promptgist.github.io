# PromptGist Design Plan

## Overview
PromptGist is a collaborative, version-controlled markdown editor designed for crafting, sharing, and iterating on AI prompts. It combines the clean, distraction-free writing experience of Typora with the collaboration features of Google Docs.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), React, TailwindCSS
- **Editor**: TipTap (Headless WYSIWYG)
- **Backend/DB**: Firebase (Authentication, Firestore)
- **Styling**: Custom CSS for Typora-like aesthetics

## Core Features & Design

### 1. Authentication (Firebase)
- **Method**: Google Sign-In only (for simplicity and speed).
- **Flow**:
  - Landing page shows "Sign in with Google".
  - Upon login, user is redirected to their dashboard (or last open document).
  - User profile (avatar/name) displayed in the top-right corner.

### 2. Document Management (Left Sidebar)
- **Layout**: A clean, collapsible sidebar on the left.
- **Content**:
  - **"New Prompt" Button**: Floating or fixed at the top.
  - **Document List**: A scrollable list of documents the user owns or has been shared with.
  - **Search**: Filter documents by title.
  - **Metadata**: Show title and "Last edited" timestamp.
- **Interaction**: Clicking a doc loads it into the main editor view.

### 3. The Editor (Center Stage)
- **Style**: Existing Typora-style implementation (clean, white/minimalist, prose-focused).
- **Title**: Editable document title at the very top.
- **Auto-Save**: Changes are saved to Firestore automatically after a debounce period (e.g., 2s).

### 4. Version Control
- **Concept**: "Snapshots" of the prompt at different points in time.
- **UI**:
  - A "History" or "Versions" button in the top toolbar.
  - Opens a right-side panel listing versions by timestamp and author.
  - **Actions**: "Restore this version", "Make a copy".
  - **Diff View** (Optional V2): Visual comparison between current and selected version.

### 5. Collaboration & Sharing
- **Share Modal**:
  - **Add People**: Input email addresses to grant "Viewer" or "Editor" access.
  - **Public Access**: Toggle switch for "Anyone with the link can view".
- **Comments**:
  - **Interaction**: Select text -> Click "Add Comment".
  - **UI**: Comments appear as floating bubbles on the right margin or in a dedicated "Comments" sidebar tab.
  - **Threads**: Support replies to comments.
  - **Resolution**: "Resolve" button to hide completed discussions.

## Data Model (Firestore)

### `users` collection
```json
{
  "uid": "user_123",
  "email": "user@example.com",
  "displayName": "Jane Doe",
  "photoURL": "..."
}
```

### `documents` collection
```json
{
  "id": "doc_abc123",
  "ownerId": "user_123",
  "title": "My Super Prompt",
  "content": "<h1>Hello</h1>...", // HTML or JSON content
  "isPublic": false,
  "collaborators": {
    "user_456": "editor",
    "user_789": "viewer"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### `versions` sub-collection (under `documents`)
```json
{
  "id": "v_1",
  "content": "...",
  "createdAt": "timestamp",
  "createdBy": "user_123",
  "label": "Initial Draft" // Optional user-defined label
}
```

### `comments` sub-collection (under `documents`)
```json
{
  "id": "c_1",
  "selectionRange": { "from": 10, "to": 25 }, // TipTap positions
  "content": "Should we make this more specific?",
  "authorId": "user_456",
  "createdAt": "timestamp",
  "resolved": false,
  "replies": [
    { "authorId": "user_123", "content": "Good idea.", "createdAt": "..." }
  ]
}
```

## Implementation Roadmap

1.  **Setup Firebase**: Initialize Firebase project and add config to app.
2.  **Auth Flow**: Create Login page and protect main routes.
3.  **Sidebar & Layout**: Refactor `layout.tsx` to include the document list sidebar.
4.  **Firestore Integration**: Hook up the Editor to load/save from Firestore.
5.  **Versioning**: Implement manual "Save Version" and auto-save logic.
6.  **Sharing UI**: Build the Share modal and update Firestore permissions.
7.  **Comments**: Add comment functionality to TipTap editor.
