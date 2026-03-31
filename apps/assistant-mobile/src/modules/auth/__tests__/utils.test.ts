import { describe, expect, test } from '@jest/globals';

import { parseJwtPayload } from '../expo/utils.ts';

function encodePayload(payload: unknown): string {
  const json = JSON.stringify(payload);
  const base64 = btoa(json)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${base64}.signature`;
}

describe('parseJwtPayload', () => {
  test('parses a valid JWT payload', () => {
    const payload = { sub: 'user123', exp: 1234567890 };
    const token = encodePayload(payload);
    expect(parseJwtPayload(token)).toEqual(payload);
  });

  test('handles URL-safe base64 characters', () => {
    const payload = { data: 'special+chars/here' };
    const token = encodePayload(payload);
    expect(parseJwtPayload(token)).toEqual(payload);
  });

  test('throws on token without dots', () => {
    expect(() => parseJwtPayload('notajwt')).toThrow(
      'Invalid JWT: missing payload segment',
    );
  });

  test('throws on empty string', () => {
    expect(() => parseJwtPayload('')).toThrow(
      'Invalid JWT: missing payload segment',
    );
  });

  test('throws on non-object payload', () => {
    const arrayToken = `header.${btoa(JSON.stringify([1, 2, 3]))}.sig`;
    expect(() => parseJwtPayload(arrayToken)).toThrow(
      'Invalid JWT: payload is not an object',
    );
  });
});
