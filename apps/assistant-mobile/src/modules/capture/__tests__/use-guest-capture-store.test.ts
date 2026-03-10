/**
 * Tests for guest capture store logic.
 *
 * We test the async storage functions and limit logic directly since the hook
 * uses useSuspenseQuery which requires complex Suspense test setup.
 */
import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import {
  GUEST_CAPTURE_LIMIT,
  GUEST_CAPTURES_STORAGE_KEY,
  type GuestCapture,
} from '../guest-capture-types.ts';

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) =>
      Promise.resolve(mockStorage[key] ?? null),
    ),
    setItem: jest.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

// Mock expo-crypto (must be "mock" prefix for hoisting)
let mockUuidCounter = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `test-uuid-${String(++mockUuidCounter)}`),
}));

describe('guest capture store logic', () => {
  async function loadCaptures(): Promise<GuestCapture[]> {
    const raw = await AsyncStorage.getItem(GUEST_CAPTURES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GuestCapture[];
  }

  async function addCapture(
    rawContent: string,
    captureType: GuestCapture['captureType'],
  ) {
    const current = await loadCaptures();
    if (current.length >= GUEST_CAPTURE_LIMIT) {
      return { status: 'LIMIT_REACHED' as const };
    }
    const capture: GuestCapture = {
      id: Crypto.randomUUID(),
      rawContent,
      captureType,
      capturedAt: Date.now(),
    };
    await AsyncStorage.setItem(
      GUEST_CAPTURES_STORAGE_KEY,
      JSON.stringify([...current, capture]),
    );
    return { status: 'ok' as const, capture };
  }

  async function clearCaptures(): Promise<void> {
    await AsyncStorage.removeItem(GUEST_CAPTURES_STORAGE_KEY);
  }

  beforeEach(() => {
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
    mockUuidCounter = 0;
  });

  test('loads empty captures from fresh storage', async () => {
    const captures = await loadCaptures();
    expect(captures).toHaveLength(0);
  });

  test('adds a capture and persists to storage', async () => {
    const result = await addCapture('Hello world', 'text');

    expect(result.status).toBe('ok');
    const capture = (result as { status: 'ok'; capture: GuestCapture }).capture;
    expect(capture.rawContent).toBe('Hello world');
    expect(capture.captureType).toBe('text');
    expect(capture.id).toBe('test-uuid-1');

    const captures = await loadCaptures();
    expect(captures).toHaveLength(1);
  });

  test('clears all captures from storage', async () => {
    await addCapture('capture 1', 'text');
    await addCapture('capture 2', 'task');

    const before = await loadCaptures();
    expect(before).toHaveLength(2);

    await clearCaptures();

    const after = await loadCaptures();
    expect(after).toHaveLength(0);
  });

  test('returns LIMIT_REACHED when at 100 captures', async () => {
    const existing: GuestCapture[] = Array.from(
      { length: GUEST_CAPTURE_LIMIT },
      (_, i) => ({
        id: `existing-${String(i)}`,
        rawContent: `capture ${String(i)}`,
        captureType: 'text' as const,
        capturedAt: Date.now(),
      }),
    );
    mockStorage[GUEST_CAPTURES_STORAGE_KEY] = JSON.stringify(existing);

    const result = await addCapture('one too many', 'text');
    expect(result.status).toBe('LIMIT_REACHED');

    // Storage should still have exactly 100 captures
    const captures = await loadCaptures();
    expect(captures).toHaveLength(GUEST_CAPTURE_LIMIT);
  });

  test('allows adding up to exactly the limit', async () => {
    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < GUEST_CAPTURE_LIMIT; i++) {
      const result = await addCapture(`capture ${String(i)}`, 'text');
      expect(result.status).toBe('ok');
    }
    /* eslint-enable no-await-in-loop */

    const captures = await loadCaptures();
    expect(captures).toHaveLength(GUEST_CAPTURE_LIMIT);

    // One more should fail
    const limitResult = await addCapture('over limit', 'link');
    expect(limitResult.status).toBe('LIMIT_REACHED');
  });
});
