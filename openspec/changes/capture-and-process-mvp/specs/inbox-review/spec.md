# Spec: inbox-review

The inbox displays unprocessed captures with AI-generated suggestions, allowing users to accept, edit, or reject suggestions to organize captures into their knowledge base.

## Requirements

### Inbox List

- WHEN the user opens the Home tab (authenticated)
- THEN they see a list of captures in `ready` or `failed` state, ordered by `capturedAt` descending
- AND each item shows the raw content and capture type badge

- WHEN a capture has AI suggestions (state `ready`)
- THEN the item also shows the suggested title and related node names

- WHEN a capture has state `failed`
- THEN the item shows the raw content with a "Processing failed" indicator
- AND the user can still manually process it

- WHEN there are no captures in the inbox
- THEN an empty state message is shown (e.g., "No captures to review. Start capturing!")

### Accept Suggestion

- WHEN the user taps "Accept" on a capture with a suggestion
- THEN a new node is created with the suggested title and extracted content
- AND the capture is linked to the new node (capture.nodeId set)
- AND any suggested related nodes are linked via edges
- AND the suggestion status is updated to `accepted`
- AND the capture state is updated to `processed`
- AND the capture is removed from the inbox list

### Reject Suggestion

- WHEN the user taps "Reject" on a suggestion
- THEN the suggestion status is updated to `rejected`
- AND the capture remains in the inbox for manual handling
- AND the capture state is updated to `needs_manual`

### Manual Edit

- WHEN the user taps on a capture item (not the accept/reject buttons)
- THEN a detail/edit view opens
- AND the user can edit the title and content before saving as a node

- WHEN the user saves from the edit view
- THEN a node is created with the user-provided title and content
- AND the capture is linked and state updated to `processed`

### Pull to Refresh

- WHEN the user pulls down on the inbox list
- THEN the list is refreshed with the latest data from Convex

### Processing Indicator

- WHEN captures exist in `processing` state
- THEN a subtle indicator shows at the top of the inbox (e.g., "Processing 3 captures...")
