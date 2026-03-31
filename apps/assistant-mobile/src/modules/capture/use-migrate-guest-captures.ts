import { useConvexMutation } from '@convex-dev/react-query';
import { useMutation } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';

import { useGuestCaptureStore } from './use-guest-capture-store.ts';

/**
 * A custom mutation hook that handles sending offline guest captures to Convex.
 *
 * This wraps the Convex `migrateGuestCaptures` mutation in a TanStack
 * `useMutation`, allowing us to track loading states and chain local side
 * effects. Once Convex confirms the captures are saved, it clears the local
 * AsyncStorage.
 */
export function useMigrateGuestCaptures() {
  const { clearGuestCaptures } = useGuestCaptureStore();

  return useMutation({
    mutationFn: useConvexMutation(api.captures.migrateGuestCaptures),
    onSuccess: () => {
      // Wipe the local storage only after successful migration
      void clearGuestCaptures.mutateAsync();
    },
  });
}
