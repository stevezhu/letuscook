# Spec: capture-input

Capture input allows users to quickly save thoughts, links, and tasks from a single text field with instant local persistence and optional server sync.

## Requirements

### Text Entry

- WHEN the user opens the Capture tab
- THEN they see a text input field and a send button
- AND the input is auto-focused for immediate typing

- WHEN the user types text and taps send (or presses enter)
- THEN the capture is saved immediately to the local MMKV queue
- AND the input field is cleared
- AND haptic feedback is triggered (light impact)

- WHEN the input field is empty
- THEN the send button is disabled

### Type Detection

- WHEN the user captures text containing a URL (e.g., `https://example.com`)
- THEN the capture type is set to `link`

- WHEN the user captures text starting with `- `, `[] `, or `[ ] `
- THEN the capture type is set to `task`

- WHEN the user captures text that doesn't match link or task patterns
- THEN the capture type is set to `text`

### Local Queue (Offline-First)

- WHEN a capture is saved
- THEN it is persisted to MMKV storage with a unique ID, rawContent, captureType, and capturedAt timestamp
- AND it survives app restart

- WHEN the user is not authenticated
- THEN captures are stored locally only
- AND the user can still capture freely

- WHEN the capture tab is viewed
- THEN a badge or count shows the number of unsynced local captures (if any)

### Server Sync

- WHEN the user authenticates (signs in)
- THEN all local captures in the MMKV queue are batch-uploaded to Convex via the `captures.create` mutation
- AND successfully synced captures are removed from the local queue

- WHEN sync fails for a capture
- THEN it remains in the local queue for retry on next sync attempt

- WHEN a new capture is saved and the user is already authenticated
- THEN it is saved to both MMKV (as a buffer) and uploaded to Convex immediately
- AND removed from MMKV on successful upload

## Edge Cases

- WHEN the user submits only whitespace
- THEN the capture is not saved and the input remains unchanged

- WHEN the user captures very long text (>5000 characters)
- THEN the capture is saved normally (no client-side truncation)
