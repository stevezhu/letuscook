import { queryClient, router } from './router.js';

export type { RouterIds, RouterType } from './router.js';

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export { queryClient, router };

export type { ApiClient } from '#api/ApiClient.js';
export {
  ApiClientProvider,
  type ApiClientProviderProps,
} from '#api/ApiClientProvider.js';
export { useApiClient } from '#api/useApiClient.js';

// By re exporting the api from TanStack router, we can enforce that other packages
// rely on this one instead, making the type register being applied
export type { ErrorComponentProps } from '@tanstack/react-router';
export {
  ErrorComponent,
  getRouteApi,
  Link,
  Outlet,
  RouterProvider,
  useRouteContext,
  useRouter,
} from '@tanstack/react-router';
