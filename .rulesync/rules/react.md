---
targets:
  - '*'
root: false
description: React patterns and conventions for data fetching, suspense, and error handling.
globs:
  - '**/*.tsx'
  - '**/*.ts'
cursor:
  alwaysApply: false
---

# React Conventions

## Data Fetching: Use Suspense with TanStack Query

Always use the **suspense** variants of TanStack Query hooks for data fetching in components. This integrates with React Suspense and TanStack Router's built-in `pendingComponent` / `errorComponent` boundaries.

### Why?

- Eliminates manual `isLoading` / `isError` checks in every component
- Data is guaranteed to be defined in the component body (no `| undefined`)
- TanStack Router already wraps routes in Suspense and error boundaries via `defaultPendingComponent` and `defaultErrorComponent`
- Keeps loading and error UI centralized and consistent

### Examples

```typescript
// ✅ DO: Use useSuspenseQuery — data is always defined
import { useSuspenseQuery } from '@tanstack/react-query';

function UserProfile({ userId }: { userId: string }) {
  const { data } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => apiClient.users.get(userId),
  });

  return <div>{data.name}</div>;
}
```

```typescript
// ❌ DON'T: Use useQuery with manual loading/error handling
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiClient.users.get(userId),
  });

  if (isLoading) return <Spinner />;
  if (isError) return <div>Error</div>;

  return <div>{data?.name}</div>;
}
```

### Suspense Hook Reference

| Hook                       | Use Case                         |
| -------------------------- | -------------------------------- |
| `useSuspenseQuery`         | Single async data fetch          |
| `useSuspenseInfiniteQuery` | Paginated / infinite scroll data |
| `useSuspenseQueries`       | Multiple parallel queries        |

## Convex: Use Inline Queries and Mutations

Use `convexQuery` and `useConvexMutation` directly at the call site. Do not create dedicated hook files that just wrap a single Convex API call.

### Why?

- The TanStack Query + Convex integration already provides clean one-liners
- Wrapper hooks that only call `useMutation({ mutationFn: useConvexMutation(api.x.y) })` add files without value
- Only create a dedicated hook when there's meaningful extra logic (optimistic updates, chained calls, merging multiple data sources, etc.)

### Examples

```typescript
// ✅ DO: Use inline at the call site
import { useQuery, useMutation } from '@tanstack/react-query';
import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { api } from 'assistant-convex/convex/_generated/api';

function InboxItem({ captureId, suggestionId }) {
  const { mutate: accept, isPending } = useMutation({
    mutationFn: useConvexMutation(api.captures.acceptSuggestion),
  });

  const { data } = useQuery(
    convexQuery(api.search.searchNodesForLinking, { query }),
  );

  return <Button onPress={() => accept({ captureId, suggestionId })} />;
}
```

```typescript
// ❌ DON'T: Create a file just to wrap a single Convex call
// use-accept-suggestion.ts
export function useAcceptSuggestion() {
  return useMutation({
    mutationFn: useConvexMutation(api.captures.acceptSuggestion),
  });
}
```

```typescript
// ✅ DO: Create a dedicated hook when there's real logic
// use-inbox-captures.ts — merges server + guest data, groups by date
export function useInboxCaptures() {
  const { user } = useAuth();
  const { data: serverCaptures } = useQuery(
    convexQuery(api.captures.getInboxCaptures, user ? {} : 'skip'),
  );
  const { captures: guestCaptures } = useGuestCaptureStore();
  // ... merge, group by date, return sections
}
```

## Error Boundaries: Use TanStack Router's Built-in Error Handling (Web Only)

> **Note:** This section applies to **web** (`assistant-web`) only. Mobile (`assistant-mobile`) uses Expo Router, not TanStack Router.

TanStack Router provides route-level error and pending boundaries. Rely on these defaults instead of adding custom `ErrorBoundary` or `Suspense` wrappers around individual components.

### How It Works

- **`defaultPendingComponent`** — Shown automatically when a route suspends (e.g., during `useSuspenseQuery` loading). Uses `PendingFallback`.
- **`defaultErrorComponent`** — Shown automatically when a route throws an error. Uses `ErrorFallback`.
- **`defaultNotFoundComponent`** — Shown for unmatched routes. Uses `NotFoundFallback`.

These are configured globally in the router.

### Per-Route Overrides

Override the defaults on a specific route when it needs custom loading or error UI:

```typescript
// ✅ DO: Override per-route when needed
export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
  pendingComponent: DashboardSkeleton,
  errorComponent: DashboardError,
});
```

```typescript
// ❌ DON'T: Wrap components in manual Suspense/ErrorBoundary for route-level concerns
function DashboardPage() {
  return (
    <ErrorBoundary fallback={<DashboardError />}>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### When to Use Explicit Suspense Boundaries

Use a `<Suspense>` boundary directly only for **sub-sections within a route** that should load independently from the rest of the page:

```tsx
// ✅ DO: Suspense for an independently-loading section within a route
function DashboardPage() {
  return (
    <div>
      <DashboardHeader />
      <Suspense fallback={<ActivityFeedSkeleton />}>
        <ActivityFeed />
      </Suspense>
    </div>
  );
}
```
