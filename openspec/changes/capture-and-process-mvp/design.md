# Design: Capture-and-Process MVP

## Architecture Overview

```
Mobile App (Expo)
├── Capture Input → MMKV local queue → Sync service → Convex mutations
├── Inbox Screen → Convex queries (listInbox) → Review UI → Convex mutations
├── Search Screen → Convex queries (search) → Results UI
└── Auth Gate → WorkOS AuthSession → SecureStore → ConvexReactClient.setAuth

Convex Backend
├── Mutations: captures.create, captures.acceptSuggestion, captures.rejectSuggestion
├── Queries: captures.listInbox, search.query
├── Actions: captures.process (AI extraction + suggestion creation)
└── Schema: existing tables (users, captures, nodes, edges, suggestions)
```

No changes to the Hono server — all real-time communication goes through Convex.

## Key Decisions

### Offline Capture: MMKV Local Queue

Use `react-native-mmkv` for the local capture queue. MMKV is synchronous, fast, and persistent — ideal for instant save. Each local capture is a JSON object stored in an array. When the user authenticates, the sync service batch-uploads local captures to Convex via mutation and clears the local queue.

**Local capture shape:**
```typescript
type LocalCapture = {
  id: string;          // uuid, for dedup
  rawContent: string;
  captureType: 'text' | 'link' | 'task';
  capturedAt: number;  // Date.now()
};
```

### Type Detection

Client-side regex runs at capture time:
- **Link**: Content matches URL pattern (`https?://...` or contains a `.com`/`.org`/etc. domain).
- **Task**: Content starts with `- ` or `[] ` or `[ ] `.
- **Text**: Everything else (default).

The AI processor may confirm or override the client-side detection.

### AI Processor

A Convex action using the Vercel AI SDK with `@ai-sdk/anthropic` (already installed). Runs server-side. Uses `generateObject` for structured output:

```typescript
type ProcessorOutput = {
  title: string;
  content: string;
  captureType: 'text' | 'link' | 'task';
  searchTerms: string[];  // used to find related nodes
};
```

After extraction, the action searches existing nodes using the Convex search index and creates suggestion records for matches above a confidence threshold.

### Capture State Machine

```
(local only)  →  processing  →  ready  →  processed
                      ↓
                   failed
```

- **(local)**: Stored in MMKV only, not yet synced to Convex.
- **processing**: Synced to Convex, AI action is running.
- **ready**: AI processing complete, suggestions available for user review.
- **failed**: AI processing failed (will show raw capture for manual handling).
- **processed**: User has reviewed and accepted/rejected. Archived from inbox.

### Authentication

WorkOS AuthKit via `expo-auth-session`. Flow:
1. User taps "Sign in" → opens WorkOS OAuth flow in browser.
2. On callback, exchange code for tokens.
3. Store access token in `expo-secure-store`.
4. Pass token to `ConvexReactClient` via the auth token provider.
5. Convex validates the token server-side to identify the user.

Unauthenticated users can still capture locally. The auth gate only blocks inbox, search, and sync features.

### Search

Use existing Convex search indexes (`search_raw` on captures, `search_nodes` on nodes). The search query runs both in parallel and merges results client-side, with type indicators (capture vs. node).

## Data Flow: Capture to Knowledge Base

1. User types text → client detects type → saves to MMKV queue.
2. (If authenticated) Sync service uploads to Convex via `captures.create` mutation.
3. Mutation inserts capture with `captureState: 'processing'` and schedules `captures.process` action.
4. AI action extracts title/content/type, searches for related nodes, creates suggestion records, updates state to `ready`.
5. Capture appears in inbox with suggestions.
6. User accepts suggestion → mutation creates node (or links to existing), creates edges, updates capture state to `processed`.
7. Node is now searchable in the knowledge base.

## Component Structure

### Mobile Screens

- **Capture Tab** (`capture/index.tsx`): TextInput + send button. Shows local queue count. Minimal UI — optimized for speed.
- **Home Tab** (`index.tsx`): Inbox list. FlatList of captures in `ready`/`failed` state. Each item shows raw content, AI-suggested title, and action buttons.
- **Search Tab** (`search/index.tsx`): Search input + results FlatList. Results show type badge + title/content preview.

### Services (new files in `src/services/`)

- `local-capture-queue.ts`: MMKV-backed queue with add/list/remove/clear operations.
- `capture-sync.ts`: Watches auth state, syncs local queue to Convex on login.

### Hooks (new files in `src/hooks/`)

- `use-auth.ts`: Auth context and hook wrapping WorkOS flow.
- `use-local-captures.ts`: Hook for reading/writing the MMKV capture queue.
