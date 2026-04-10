import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { render, waitFor } from '@testing-library/react-native';
import type {
  ResolvedSharePayload,
  UseIncomingShareResult,
} from 'expo-sharing';
import { Provider, createStore } from 'jotai';
import React from 'react';

import { captureTextAtom, captureTypeAtom } from '../capture-composer-atoms.ts';
import { CaptureComposerSharedContent } from '../capture-composer-shared-content.tsx';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockClearSharedPayloads = jest.fn();

let mockShareResult: UseIncomingShareResult = {
  sharedPayloads: [],
  resolvedSharedPayloads: [],
  clearSharedPayloads: mockClearSharedPayloads,
  isResolving: false,
  error: null,
  refreshSharePayloads: jest.fn(),
};

jest.mock('expo-sharing', () => ({
  useIncomingShare: () => mockShareResult,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePayload(
  overrides: Partial<ResolvedSharePayload> & {
    contentType: ResolvedSharePayload['contentType'];
  },
): ResolvedSharePayload {
  return {
    value: '',
    shareType: 'text',
    contentUri: null,
    contentMimeType: null,
    originalName: null,
    contentSize: null,
    ...overrides,
  } as ResolvedSharePayload;
}

async function renderWithStore() {
  const store = createStore();
  await render(
    <Provider store={store}>
      <CaptureComposerSharedContent />
    </Provider>,
  );
  return store;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CaptureComposerSharedContent', () => {
  beforeEach(() => {
    mockClearSharedPayloads.mockClear();
    mockShareResult = {
      sharedPayloads: [],
      resolvedSharedPayloads: [],
      clearSharedPayloads: mockClearSharedPayloads,
      isResolving: false,
      error: null,
      refreshSharePayloads: jest.fn(),
    };
  });

  test('does nothing when there are no shared payloads', async () => {
    const store = await renderWithStore();

    expect(store.get(captureTextAtom)).toBe('');
    expect(store.get(captureTypeAtom)).toBe('text');
    expect(mockClearSharedPayloads).not.toHaveBeenCalled();
  });

  test('sets text from a text share payload', async () => {
    mockShareResult.resolvedSharedPayloads = [
      makePayload({ contentType: 'text', value: 'Hello world' }),
    ];

    const store = await renderWithStore();

    await waitFor(() => {
      expect(store.get(captureTextAtom)).toBe('Hello world');
    });
    expect(store.get(captureTypeAtom)).toBe('text');
    expect(mockClearSharedPayloads).toHaveBeenCalledTimes(1);
  });

  test('sets link type and uses contentUri for a website share', async () => {
    mockShareResult.resolvedSharedPayloads = [
      makePayload({
        contentType: 'website',
        contentUri: 'https://example.com',
      }),
    ];

    const store = await renderWithStore();

    await waitFor(() => {
      expect(store.get(captureTextAtom)).toBe('https://example.com');
    });
    expect(store.get(captureTypeAtom)).toBe('link');
    expect(mockClearSharedPayloads).toHaveBeenCalledTimes(1);
  });

  test('joins multiple payloads with newlines', async () => {
    mockShareResult.resolvedSharedPayloads = [
      makePayload({ contentType: 'text', value: 'Line 1' }),
      makePayload({ contentType: 'text', value: 'Line 2' }),
    ];

    const store = await renderWithStore();

    await waitFor(() => {
      expect(store.get(captureTextAtom)).toBe('Line 1\nLine 2');
    });
    expect(store.get(captureTypeAtom)).toBe('text');
  });

  test('detects link type when all payloads are websites', async () => {
    mockShareResult.resolvedSharedPayloads = [
      makePayload({
        contentType: 'website',
        contentUri: 'https://a.com',
      }),
      makePayload({
        contentType: 'website',
        contentUri: 'https://b.com',
      }),
    ];

    const store = await renderWithStore();

    await waitFor(() => {
      expect(store.get(captureTextAtom)).toBe('https://a.com\nhttps://b.com');
    });
    expect(store.get(captureTypeAtom)).toBe('link');
  });

  test('detects text type when payloads are mixed', async () => {
    mockShareResult.resolvedSharedPayloads = [
      makePayload({
        contentType: 'website',
        contentUri: 'https://a.com',
      }),
      makePayload({ contentType: 'text', value: 'some note' }),
    ];

    const store = await renderWithStore();

    await waitFor(() => {
      expect(store.get(captureTextAtom)).toBe('https://a.com\nsome note');
    });
    expect(store.get(captureTypeAtom)).toBe('text');
  });

  test('skips payloads with unsupported content types', async () => {
    mockShareResult.resolvedSharedPayloads = [
      makePayload({
        contentType: 'image',
        contentUri: 'file://img.png',
      }),
      makePayload({ contentType: 'text', value: 'caption' }),
    ];

    const store = await renderWithStore();

    // image returns '' which is filtered out by Boolean filter
    await waitFor(() => {
      expect(store.get(captureTextAtom)).toBe('caption');
    });
    expect(mockClearSharedPayloads).toHaveBeenCalledTimes(1);
  });

  test('does nothing when all payloads extract to empty strings', async () => {
    mockShareResult.resolvedSharedPayloads = [
      makePayload({
        contentType: 'image',
        contentUri: 'file://img.png',
      }),
      makePayload({
        contentType: 'audio',
        contentUri: 'file://audio.mp3',
      }),
    ];

    const store = await renderWithStore();

    expect(store.get(captureTextAtom)).toBe('');
    expect(store.get(captureTypeAtom)).toBe('text');
    expect(mockClearSharedPayloads).not.toHaveBeenCalled();
  });
});
