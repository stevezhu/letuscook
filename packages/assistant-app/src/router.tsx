// Import the generated route tree
import { QueryClient } from '@tanstack/react-query';
import type { RouteIds } from '@tanstack/react-router';
import {
  createHashHistory,
  createRouter,
  useRouter,
} from '@tanstack/react-router';

import {
  ErrorFallback,
  NotFoundFallback,
  PendingFallback,
} from '#components/Fallback/index.js';

import { routeTree } from './routeTree.gen.js';

export const queryClient = new QueryClient();

const history = createHashHistory();
export const router = createRouter({
  routeTree,
  history,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultPendingComponent: PendingFallback,
  defaultErrorComponent: ErrorFallback,
  defaultNotFoundComponent: function DefaultNotFoundFallback() {
    const router = useRouter();
    return (
      <NotFoundFallback
        onGoHome={() => router.navigate({ to: '/' })}
        onGoBack={() => {
          router.history.back();
        }}
      />
    );
  },
});

export type RouterType = typeof router;
export type RouterIds = RouteIds<RouterType['routeTree']>;
