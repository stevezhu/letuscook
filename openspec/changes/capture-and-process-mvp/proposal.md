# Capture-and-Process MVP

## Problem

Letuscook has solid infrastructure scaffolding — Expo + Convex + TanStack Query wired up, 3-tab navigation, and a Convex schema with captures/nodes/edges/suggestions tables — but all screens are placeholders. There is no functionality. Users cannot capture a thought, process it, or organize it. The core product thesis (capture on-the-go, organize later with AI) is unvalidated.

## Solution

Implement the end-to-end capture-to-organize workflow:

1. **Capture** — A single text field that instantly saves thoughts, auto-detects type (text/link/task), and works offline via a local MMKV queue.
2. **AI Processing** — A Convex action that calls an LLM to extract a title, clean content, detect type, and suggest related existing nodes.
3. **Inbox Review** — A list of unprocessed captures with AI suggestions. Users accept, edit, or reject suggestions to organize captures into their knowledge base.
4. **Search** — Full-text search across captures and nodes using existing Convex search indexes.
5. **Auth Gate** — WorkOS authentication so captures sync to the server. Capture works offline without auth.

## New Capabilities

| Capability | Description |
|---|---|
| `capture-input` | Text entry, type detection, offline queuing |
| `inbox-review` | List unprocessed captures, review AI suggestions |
| `ai-processor` | LLM-based extraction and suggestion pipeline |
| `search` | Full-text search across captures and knowledge base |
| `auth-gate` | WorkOS authentication, offline-to-sync transition |

## Success Criteria

- A user can open the app, type a thought, and see it saved instantly.
- Captures are auto-processed by AI with title/type suggestions.
- Users can review AI suggestions in the inbox and accept/reject them.
- Accepted suggestions create nodes and link captures to the knowledge base.
- Search returns results across both captures and nodes.
- The app works offline for capture; signing in syncs local captures to the server.

## Non-Goals

- Rich text editing or markdown support in captures.
- Manual node creation outside of the capture flow.
- Node-to-node graph visualization.
- Push notifications or background processing triggers.
- Multi-user collaboration or sharing.
