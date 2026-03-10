import { queryClient, router } from './router.tsx';

export type { RouterIds, RouterType } from './router.tsx';

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export { queryClient, router };

export type { ApiClient } from '#api/ApiClient.ts';
export {
  ApiClientProvider,
  type ApiClientProviderProps,
} from '#api/ApiClientProvider.tsx';
export { useApiClient } from '#api/useApiClient.ts';

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
