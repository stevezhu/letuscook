# Tasks: Capture-and-Process MVP

## Group 1: Auth Foundation

### 1.1 Install auth dependencies
Install `expo-secure-store` and `expo-auth-session` in the mobile app.

### 1.2 Create WorkOS auth config and login flow
Create a WorkOS auth configuration module with OAuth endpoints. Implement the login flow using `expo-auth-session` to open the WorkOS OAuth page, handle the callback, exchange the code for tokens, and store tokens in SecureStore.

### 1.3 Wire ConvexReactClient auth token provider
Update the Convex client setup in the mobile app root layout to pass the stored auth token to `ConvexReactClient` via the auth token provider callback.

### 1.4 Create auth context and useAuth hook
Create an auth context provider and `useAuth` hook that exposes `isAuthenticated`, `user`, `signIn`, `signOut`, and `isLoading`. Wrap the app in this provider.

### 1.5 Add auth gate UI
Add conditional rendering: Capture tab always works. Home and Search tabs show a sign-in prompt when unauthenticated. Add a sign-in/sign-out button accessible from the UI.

## Group 2: Capture Input

### 2.1 Install react-native-mmkv
Install `react-native-mmkv` in the mobile app for fast, synchronous local storage.

### 2.2 Create local capture queue service
Create `src/services/local-capture-queue.ts` using MMKV. Implement `add(rawContent, captureType)`, `list()`, `remove(id)`, and `clear()` operations. Each capture has a UUID, rawContent, captureType, and capturedAt timestamp.

### 2.3 Build capture input UI
Replace the capture tab placeholder with a functional screen: a TextInput field, a send button, and a count of unsynced local captures. Auto-focus the input. Clear input on send. Trigger haptic feedback on save. Reject empty/whitespace-only input.

### 2.4 Add type detection
Implement client-side type detection: URL regex for `link`, `- `/`[] `/`[ ] ` prefix for `task`, default to `text`. Apply detection on capture save.

### 2.5 Create Convex captures.create mutation
Create a Convex mutation `captures.create` that inserts a new capture with `captureState: 'processing'` and schedules the `captures.process` action. Validate input and set `ownerUserId` from auth.

### 2.6 Build sync service
Create `src/services/capture-sync.ts` that watches auth state. On authentication, batch-upload all local MMKV captures to Convex via `captures.create`. Remove successfully synced captures from MMKV. For already-authenticated users, sync each new capture immediately after local save.

## Group 3: AI Processor

### 3.1 Create Convex captures.process action
Create a Convex action `captures.process` that takes a capture ID, verifies the capture is in `processing` state, calls the LLM, and updates the capture state. Use the Vercel AI SDK with `@ai-sdk/anthropic` and `generateObject` for structured output.

### 3.2 Define structured output schema
Define the Zod schema for the AI extraction output: `title` (string), `content` (string), `captureType` ('text' | 'link' | 'task'), `searchTerms` (string array). Use this with `generateObject`.

### 3.3 Implement node matching
After AI extraction, use the `searchTerms` to search existing nodes via the `search_nodes` Convex search index. Filter to the capture owner's non-archived nodes. Return up to 4 matching nodes.

### 3.4 Create suggestion records from AI output
Create a draft node from the AI extraction (title, content, type). Create a suggestion record linking the draft node to the capture. Create additional suggestion records for each matched existing node. Limit to 5 total suggestions.

### 3.5 Wire trigger: auto-process on capture creation
Ensure the `captures.create` mutation schedules `captures.process` via `ctx.scheduler.runAfter`. The action runs asynchronously after the mutation completes.

### 3.6 Handle failure states and retry logic
Wrap the AI call in try/catch. On failure, update capture state to `failed` and log the error. No automatic retry — failed captures can be retried manually.

## Group 4: Inbox & Review

### 4.1 Create Convex captures.listInbox query
Create a Convex query that returns captures in `ready`, `failed`, or `needs_manual` state for the authenticated user, ordered by `capturedAt` descending. Include associated suggestions (with suggested node details) for each capture.

### 4.2 Build inbox list UI
Replace the Home tab placeholder with a FlatList of inbox captures. Each item shows raw content, capture type badge, and AI-suggested title (if available). Add pull-to-refresh. Add empty state.

### 4.3 Add suggestion display
For each inbox item with suggestions, show the proposed node title and names of related existing nodes. Display accept and reject action buttons.

### 4.4 Implement accept flow
Create a Convex mutation `captures.acceptSuggestion` that: updates the suggested node (confirms it), sets `capture.nodeId`, creates edges to related nodes, updates suggestion status to `accepted`, and updates capture state to `processed`.

### 4.5 Implement reject/edit flow
Create a Convex mutation `captures.rejectSuggestion` that updates suggestion status to `rejected` and capture state to `needs_manual`. Build a detail/edit screen where the user can manually set title and content, then save as a new node.

### 4.6 Add pull-to-refresh and loading states
Add RefreshControl to the inbox FlatList. Show a processing indicator when captures are in `processing` state. Add loading skeletons for initial load.

## Group 5: Search

### 5.1 Create Convex search.query
Create a Convex query that accepts a search string and runs full-text search on both `captures` (via `search_raw`) and `nodes` (via `search_nodes`). Filter by authenticated user and exclude archived items. Return up to 20 results per type.

### 5.2 Build search screen UI
Replace the Search tab placeholder with a search input and results FlatList. Debounce input at 300ms. Show type badges on results. Show "No results" empty state.

### 5.3 Add result type indicators and navigation
Show distinct badges for capture vs. node results. On tap, navigate to detail view (node detail or capture edit screen).

## Group 6: Polish & Integration

### 6.1 Wire tab navigation to real screens
Ensure all three tabs use the new functional screens. Verify navigation between tabs and into detail views works correctly.

### 6.2 Add loading states and error handling
Add error boundaries or error display for failed queries. Add loading indicators for async operations. Handle network errors gracefully.

### 6.3 Test end-to-end flow
Test the full flow: capture text → AI processes → appears in inbox → accept suggestion → node created → searchable. Verify offline capture and sync-on-auth. Fix any integration issues.
