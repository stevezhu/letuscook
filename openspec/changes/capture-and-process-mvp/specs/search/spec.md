# Spec: search

Full-text search across captures and nodes using existing Convex search indexes.

## Requirements

### Search Input

- WHEN the user opens the Search tab
- THEN they see a search input field at the top
- AND the input is auto-focused

- WHEN the user types a query (after debounce of 300ms)
- THEN search results are fetched from Convex

- WHEN the search input is empty
- THEN no results are shown (or recent captures are shown as a default view)

### Search Execution

- WHEN a search query is submitted
- THEN Convex searches both the `captures` table (via `search_raw` index) and the `nodes` table (via `search_nodes` index)
- AND results are filtered to the authenticated user's data
- AND archived items are excluded

### Results Display

- WHEN search results are returned
- THEN they are displayed in a flat list
- AND each result shows:
  - A type badge (`capture` or `node`)
  - The title (for nodes) or a content preview (for captures)
  - The capture type badge if it's a capture (`text`, `link`, `task`)

- WHEN there are no results
- THEN a "No results found" message is shown

### Navigation

- WHEN the user taps a node result
- THEN a detail view opens showing the full node content

- WHEN the user taps a capture result
- THEN the capture detail/edit view opens (same as inbox manual edit)

## Constraints

- Search requires authentication (server-side query filters by ownerUserId).
- Results are limited to 20 items per type (40 total max).
- Search uses Convex's built-in full-text search — no external search infrastructure.
