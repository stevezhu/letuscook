---
date: 2026-03-31T23:56:53Z
type: plan
status: in-progress
agent: claudecode
models: [claude-opus-4-6]
branch: improve-capture
tags: [mobile, knowledge, nodes, edges]
---

# Add Knowledge Tab to assistant-mobile

## Goal

Add a dedicated "Knowledge" tab to the mobile app that lets users browse all their published nodes and view each node's connections (edges). Currently nodes are only visible during the inbox review flow.

## Scope

**Included:**
- New Knowledge tab with list of all published nodes (title + edge count)
- Node detail screen showing content + outgoing/incoming connections
- Navigation between connected nodes

**Not included:**
- No backend changes (existing queries suffice)
- No new module directory (only 2 screen files)
- No search/filter on the knowledge list

## Steps

### 1. Create Knowledge tab screen
**Create `apps/assistant-mobile/src/app/(tabs)/knowledge.tsx`**
- `DefaultSuspense` wrapper, `useSuspenseQuery` with `convexQuery(api.nodes.getKnowledgeBasePages, {})`
- `FlatList` of nodes showing title + edge count
- Tap navigates to `/knowledge/${node._id}`
- Empty state when no nodes

### 2. Create node detail route
**Create `apps/assistant-mobile/src/app/knowledge/[nodeId].tsx`**
- `useLocalSearchParams<{ nodeId: string }>()` cast to `Id<'nodes'>`
- `useSuspenseQuery(convexQuery(api.nodes.getNodeWithEdges, { nodeId }))`
- `ScrollView` with: title, content, outgoing connections, incoming connections
- Connected nodes are tappable (navigate to their detail page)
- Edge type/label shown as secondary info

### 3. Register tab in tabs layout
**Modify `apps/assistant-mobile/src/app/(tabs)/_layout.tsx`**
- Add `NativeTabs.Trigger` with `sf="book.fill"` / `md="menu_book"`

### 4. Register detail route in root Stack
**Modify `apps/assistant-mobile/src/app/_layout.tsx`**
- Add `Stack.Screen name="knowledge/[nodeId]"` with modal presentation

## Key Files

- `apps/assistant-convex/convex/nodes.ts` — `getKnowledgeBasePages`, `getNodeWithEdges` (reuse as-is)
- `apps/assistant-mobile/src/app/(tabs)/_layout.tsx` — tab registration
- `apps/assistant-mobile/src/app/_layout.tsx` — root Stack registration
- `apps/assistant-mobile/src/app/(tabs)/inbox.tsx` — reference pattern for tab screen
- `apps/assistant-mobile/src/app/review/[captureId].tsx` — reference pattern for detail route

## Open Questions

None — all queries exist, patterns are established.

## References

- Existing plan: `.claude/plans/sparkling-munching-pixel.md`
