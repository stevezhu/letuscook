import { describe, expect, test } from '@jest/globals';

import { validateGuestCaptures } from '../guest-capture-types.ts';

describe('validateGuestCaptures', () => {
  test('returns empty array for non-array input', () => {
    expect(validateGuestCaptures(null)).toEqual([]);
    expect(validateGuestCaptures(undefined)).toEqual([]);
    expect(validateGuestCaptures('string')).toEqual([]);
    expect(validateGuestCaptures(42)).toEqual([]);
    expect(validateGuestCaptures({})).toEqual([]);
  });

  test('returns empty array for empty array', () => {
    expect(validateGuestCaptures([])).toEqual([]);
  });

  test('returns valid captures', () => {
    const valid = [
      {
        id: 'abc',
        rawContent: 'Hello',
        captureType: 'text',
        capturedAt: 1234567890,
      },
      {
        id: 'def',
        rawContent: 'https://example.com',
        captureType: 'link',
        capturedAt: 1234567891,
      },
      {
        id: 'ghi',
        rawContent: 'Do thing',
        captureType: 'task',
        capturedAt: 1234567892,
      },
    ];
    expect(validateGuestCaptures(valid)).toEqual(valid);
  });

  test('filters out malformed entries', () => {
    const mixed = [
      {
        id: 'valid',
        rawContent: 'Good',
        captureType: 'text',
        capturedAt: 123,
      },
      { id: 123, rawContent: 'Bad id', captureType: 'text', capturedAt: 123 },
      {
        id: 'x',
        rawContent: 'Bad type',
        captureType: 'invalid',
        capturedAt: 123,
      },
      { id: 'y', rawContent: 'Missing capturedAt', captureType: 'text' },
      null,
      'string',
      42,
    ];
    const result = validateGuestCaptures(mixed);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('valid');
  });

  test('filters entries with missing fields', () => {
    const missing = [
      { rawContent: 'No id', captureType: 'text', capturedAt: 123 },
      { id: 'x', captureType: 'text', capturedAt: 123 },
      { id: 'x', rawContent: 'No type', capturedAt: 123 },
    ];
    expect(validateGuestCaptures(missing)).toEqual([]);
  });
});
