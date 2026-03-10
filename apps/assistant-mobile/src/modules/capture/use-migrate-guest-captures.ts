import { useMutation } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';
import { useConvex } from 'convex/react';

import { type GuestCapture } from './guest-capture-types.ts';
import { useGuestCaptureStore } from './use-guest-capture-store.ts';

/**
 * A custom mutation hook that handles sending offline guest captures to Convex.
 *
 * This wraps the Convex `migrateGuestCaptures` mutation in a TanStack `useMutation`,
 * allowing us to track loading states and chain local side effects. Once Convex
 * confirms the captures are saved, it clears the local AsyncStorage.
 */
export function useMigrateGuestCaptures() {
  const convex = useConvex();
  const { clearGuestCaptures } = useGuestCaptureStore();

  return useMutation({
    mutationFn: async (captures: GuestCapture[]) => {
      // Send the batch of guest captures to Convex
      return convex.mutation(api.captures.migrateGuestCaptures, { captures });
    },
    onSuccess: () => {
      // Wipe the local storage only after successful migration
      void clearGuestCaptures.mutateAsync();
    },
  });
}
