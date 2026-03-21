import { QueryClient } from '@tanstack/react-query';

import { useReactQueryDevtools } from '#hooks/use-react-query-devtools.ts';

export type AppReactQueryDevtoolsProps = {
  queryClient: QueryClient;
};

export function AppReactQueryDevtools({
  queryClient,
}: AppReactQueryDevtoolsProps) {
  useReactQueryDevtools(queryClient);
  return null;
}
