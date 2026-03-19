import { useConvexMutation } from '@convex-dev/react-query';
import { useMutation } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';
import { useCallback } from 'react';

import { useAuth } from '#modules/auth/auth-context.tsx';

import type { CaptureType } from './guest-capture-types.ts';
import { GUEST_CAPTURE_LIMIT } from './guest-capture-types.ts';
import { useGuestCaptureStore } from './use-guest-capture-store.ts';

// 👀 Needs Verification
/**
 * Unified capture submit hook that handles both authenticated and guest flows.
 *
 * - Authenticated: calls `createCapture` mutation on Convex
 * - Guest: calls `addGuestCapture` on local AsyncStorage store
 * - Guest at limit: returns `limitReached: true` instead of submitting
 */
export function useCaptureSubmit() {
  const { user } = useAuth();
  const { captures, addGuestCapture } = useGuestCaptureStore();

  const convexCreateCapture = useConvexMutation(api.captures.createCapture);

  const limitReached = !user && captures.length >= GUEST_CAPTURE_LIMIT;

  const mutation = useMutation({
    mutationFn: async ({
      rawContent,
      captureType,
    }: {
      rawContent: string;
      captureType: CaptureType;
    }) => {
      if (user) {
        await convexCreateCapture({ rawContent, captureType });
      } else {
        const result = await addGuestCapture.mutateAsync({
          rawContent,
          captureType,
        });
        if (result.status === 'LIMIT_REACHED') {
          throw new Error('LIMIT_REACHED');
        }
      }
    },
  });

  const submit = useCallback(
    (rawContent: string, captureType: CaptureType) => {
      return mutation.mutateAsync({ rawContent, captureType });
    },
    [mutation],
  );

  return {
    submit,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    limitReached,
    reset: mutation.reset,
  };
}
