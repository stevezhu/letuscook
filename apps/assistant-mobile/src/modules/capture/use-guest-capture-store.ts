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
} from './guest-capture-types.ts';

const QUERY_KEY = ['guest_captures'];

async function loadCaptures(): Promise<GuestCapture[]> {
  try {
    const raw = await AsyncStorage.getItem(GUEST_CAPTURES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GuestCapture[];
  } catch (error) {
    console.error('[GuestCaptureStore] Failed to load captures:', error);
    return [];
  }
}

async function saveCaptures(captures: GuestCapture[]): Promise<void> {
  await AsyncStorage.setItem(
    GUEST_CAPTURES_STORAGE_KEY,
    JSON.stringify(captures),
  );
}

export function useGuestCaptureStore() {
  const queryClient = useQueryClient();

  const { data: rawCaptures } = useSuspenseQuery({
    queryKey: QUERY_KEY,
    queryFn: loadCaptures,
    staleTime: Infinity,
  });

  const captures = useMemo<GuestCaptureWithState[]>(
    () => rawCaptures.map((c) => ({ ...c, captureState: 'offline' as const })),
    [rawCaptures],
  );

  const addGuestCapture = useMutation({
    mutationFn: async ({
      rawContent,
      captureType,
    }: {
      rawContent: string;
      captureType: CaptureType;
    }): Promise<AddGuestCaptureResult> => {
      const current = await loadCaptures();
      if (current.length >= GUEST_CAPTURE_LIMIT) {
        return { status: 'LIMIT_REACHED' };
      }
      const capture: GuestCapture = {
        id: Crypto.randomUUID(),
        rawContent,
        captureType,
        capturedAt: Date.now(),
      };
      await saveCaptures([...current, capture]);
      return { status: 'ok', capture };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

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
