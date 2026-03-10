import { useMutation } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';
import { useConvex } from 'convex/react';

import { type GuestCapture } from './guest-capture-types.ts';
import { useGuestCaptureStore } from './use-guest-capture-store.ts';

export function useMigrateGuestCaptures() {
  const convex = useConvex();
  const { clearGuestCaptures } = useGuestCaptureStore();

  return useMutation({
    mutationFn: async (captures: GuestCapture[]) => {
      return convex.mutation(api.captures.migrateGuestCaptures, { captures });
    },
    onSuccess: () => {
      void clearGuestCaptures.mutateAsync();
    },
  });
}
