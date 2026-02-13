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

## Error Boundaries: Use TanStack Router's Built-in Error Handling

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
