import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useMemo } from 'react';

import {
  type AddGuestCaptureResult,
  type CaptureType,
  type GuestCapture,
  type GuestCaptureWithState,
  GUEST_CAPTURE_LIMIT,
  GUEST_CAPTURES_STORAGE_KEY,
  validateGuestCaptures,
} from './guest-capture-types.ts';

const QUERY_KEY = ['guest_captures'];

/**
 * Reads the raw guest captures from AsyncStorage. Wraps parsing in a try/catch
 * to avoid crashing on malformed/corrupted local data.
 */
async function loadCaptures(): Promise<GuestCapture[]> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_CAPTURES_STORAGE_KEY);
    if (!raw) return [];
    return validateGuestCaptures(JSON.parse(raw));
  } catch (error) {
    console.error('[GuestCaptureStore] Failed to load captures:', error);
    return [];
  }
}

/**
 * Persists the entire array of guest captures back to AsyncStorage.
 */
async function saveCaptures(captures: GuestCapture[]): Promise<void> {
  await AsyncStorage.setItem(
    GUEST_CAPTURES_STORAGE_KEY,
    JSON.stringify(captures),
  );
}

/**
 * A local store for offline/guest captures, backed by AsyncStorage and TanStack
 * Query.
 *
 * This hook uses `useSuspenseQuery` with `staleTime: Infinity` to load the
 * stored captures exactly once. Subsequent changes (add/clear) mutate the data
 * and manually invalidate the query to re-render UI.
 */
export function useGuestCaptureStore() {
  const queryClient = useQueryClient();

  // Load the initial captures. Will suspend the parent component until AsyncStorage resolves.
  const { data: rawCaptures } = useSuspenseQuery({
    queryKey: QUERY_KEY,
    queryFn: loadCaptures,
    staleTime: Infinity, // Treat the loaded data as stable, only refetch on manual invalidation
  });

  // Inject `captureState: 'offline'` dynamically at runtime so the rest of the
  // application logic can treat these similarly to real processed captures,
  // without having to persist this static state string locally.
  const captures = useMemo<GuestCaptureWithState[]>(
    () => rawCaptures.map((c) => ({ ...c, captureState: 'offline' as const })),
    [rawCaptures],
  );

  /**
   * Adds a new capture to the local store if under the limit.
   */
  const addGuestCapture = useMutation({
    mutationFn: async ({
      rawContent,
      captureType,
    }: {
      rawContent: string;
      captureType: CaptureType;
    }): Promise<AddGuestCaptureResult> => {
      const current = await loadCaptures();

      // Enforce local limits
      if (current.length >= GUEST_CAPTURE_LIMIT) {
        return { status: 'LIMIT_REACHED' };
      }

      const capture: GuestCapture = {
        id: Crypto.randomUUID(), // Generate a unique local ID
        rawContent,
        captureType,
        capturedAt: Date.now(),
      };

      await saveCaptures([...current, capture]);
      return { status: 'ok', capture };
    },
    // Triggers a re-render by marking the SuspenseQuery as stale
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  /**
   * Clears all local captures, typically called after a successful migration to
   * Convex.
   */
  const clearGuestCaptures = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(GUEST_CAPTURES_STORAGE_KEY);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return { captures, addGuestCapture, clearGuestCaptures };
}
