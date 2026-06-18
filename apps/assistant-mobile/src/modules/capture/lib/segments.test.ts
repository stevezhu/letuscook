import { describe, expect, test } from '@jest/globals';

import {
  EMPTY_SEGMENTS,
  findUrlsInChunk,
  flattenSegments,
  reconcileSegments,
  type Segment,
} from './segments.ts';

function typeChars(
  start: Segment[],
  chars: string,
  from: number = flattenSegments(start).length,
): Segment[] {
  let segments = start;
  let flat = flattenSegments(segments);
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]!;
    const insertAt = from + i;
    const next = flat.slice(0, insertAt) + char + flat.slice(insertAt);
    segments = reconcileSegments(segments, next, { isPasteLikely: false });
    flat = flattenSegments(segments);
  }
  return segments;
}

function paste(start: Segment[], chunk: string, at?: number): Segment[] {
  const flat = flattenSegments(start);
  const insertAt = at ?? flat.length;
  const next = flat.slice(0, insertAt) + chunk + flat.slice(insertAt);
  return reconcileSegments(start, next, { isPasteLikely: true });
}

function backspace(start: Segment[], at?: number): Segment[] {
  const flat = flattenSegments(start);
  const cursor = at ?? flat.length;
  if (cursor <= 0) return start;
  const next = flat.slice(0, cursor - 1) + flat.slice(cursor);
  return reconcileSegments(start, next, { isPasteLikely: false });
}

describe('findUrlsInChunk', () => {
  test('finds a plain https URL', () => {
    expect(findUrlsInChunk('see https://foo.com here')).toEqual([
      { start: 4, end: 19, url: 'https://foo.com' },
    ]);
  });

  test('finds http as well', () => {
    expect(findUrlsInChunk('http://foo.com')).toEqual([
      { start: 0, end: 14, url: 'http://foo.com' },
    ]);
  });

  test('excludes trailing punctuation', () => {
    const result = findUrlsInChunk('check https://foo.com.');
    expect(result).toHaveLength(1);
    expect(result[0]?.url).toBe('https://foo.com');
  });

  test('finds multiple URLs', () => {
    const result = findUrlsInChunk('a https://x.com b https://y.com');
    expect(result).toHaveLength(2);
    expect(result[0]?.url).toBe('https://x.com');
    expect(result[1]?.url).toBe('https://y.com');
  });

  test('ignores non-http schemes', () => {
    expect(findUrlsInChunk('ftp://foo.com mailto:a@b.c')).toEqual([]);
  });

  test('returns empty for text with no URL', () => {
    expect(findUrlsInChunk('regular testing-library')).toEqual([]);
  });
});

describe('reconcileSegments - typing', () => {
  test('typing a single char into empty input', () => {
    const out = reconcileSegments(EMPTY_SEGMENTS, 'h', {
      isPasteLikely: false,
    });
    expect(out).toEqual([{ type: 'text', value: 'h' }]);
  });

  test('typing a URL character by character never creates a pill', () => {
    const out = typeChars(EMPTY_SEGMENTS, 'https://example.com');
    expect(out).toEqual([{ type: 'text', value: 'https://example.com' }]);
  });

  test('typing a char inside existing text', () => {
    const out = reconcileSegments([{ type: 'text', value: 'helo' }], 'hello', {
      isPasteLikely: false,
    });
    expect(out).toEqual([{ type: 'text', value: 'hello' }]);
  });
});

describe('reconcileSegments - paste creates pills', () => {
  test('paste a bare URL into empty input', () => {
    const out = paste(EMPTY_SEGMENTS, 'https://github.com/stevezhu/letuscook');
    expect(out).toEqual([
      { type: 'pill', value: 'https://github.com/stevezhu/letuscook' },
      { type: 'text', value: '' },
    ]);
  });

  test('paste URL with surrounding prose', () => {
    const out = paste(EMPTY_SEGMENTS, 'check this out https://foo.com cool');
    expect(out).toEqual([
      { type: 'text', value: 'check this out ' },
      { type: 'pill', value: 'https://foo.com' },
      { type: 'text', value: ' cool' },
    ]);
  });

  test('paste two URLs in one chunk', () => {
    const out = paste(EMPTY_SEGMENTS, 'https://a.com and https://b.com');
    expect(out).toEqual([
      { type: 'pill', value: 'https://a.com' },
      { type: 'text', value: ' and ' },
      { type: 'pill', value: 'https://b.com' },
      { type: 'text', value: '' },
    ]);
  });

  test('paste URL into middle of existing text', () => {
    const start: Segment[] = [{ type: 'text', value: 'hello world' }];
    const out = paste(start, 'https://foo.com ', 6);
    expect(out).toEqual([
      { type: 'text', value: 'hello ' },
      { type: 'pill', value: 'https://foo.com' },
      { type: 'text', value: ' world' },
    ]);
  });

  test('paste non-URL chunk is plain text', () => {
    const out = paste(EMPTY_SEGMENTS, 'just some pasted prose');
    expect(out).toEqual([{ type: 'text', value: 'just some pasted prose' }]);
  });

  test('paste with unsupported scheme is plain text', () => {
    const out = paste(EMPTY_SEGMENTS, 'ftp://foo.com stuff');
    expect(out).toEqual([{ type: 'text', value: 'ftp://foo.com stuff' }]);
  });
});

describe('reconcileSegments - atomic pill delete', () => {
  test('backspace at end of pill (cursor at end of flat input)', () => {
    const start = paste(EMPTY_SEGMENTS, 'https://foo.com');
    const out = backspace(start);
    expect(out).toEqual(EMPTY_SEGMENTS);
  });

  test('backspace right after pill when trailing text is empty', () => {
    const start: Segment[] = [
      { type: 'pill', value: 'https://foo.com' },
      { type: 'text', value: '' },
    ];
    // cursor at flat offset = pill.length
    const out = backspace(start, 15);
    expect(out).toEqual(EMPTY_SEGMENTS);
  });

  test('deleting a character inside pill removes the whole pill', () => {
    // Simulate the user somehow editing the middle of the URL.
    const start: Segment[] = [
      { type: 'pill', value: 'https://foo.com' },
      { type: 'text', value: '' },
    ];
    // Drop index 10 ('f') → 'https://fo.com'
    const flat = flattenSegments(start);
    const next = flat.slice(0, 10) + flat.slice(11);
    const out = reconcileSegments(start, next, { isPasteLikely: false });
    expect(out).toEqual(EMPTY_SEGMENTS);
  });

  test('backspace in adjacent text after pill leaves pill intact', () => {
    const start: Segment[] = [
      { type: 'pill', value: 'https://foo.com' },
      { type: 'text', value: ' hello' },
    ];
    // cursor at end, backspace removes 'o'
    const out = backspace(start);
    expect(out).toEqual([
      { type: 'pill', value: 'https://foo.com' },
      { type: 'text', value: ' hell' },
    ]);
  });

  test('backspace first char of text after pill leaves pill intact', () => {
    const start: Segment[] = [
      { type: 'pill', value: 'https://foo.com' },
      { type: 'text', value: ' hello' },
    ];
    // cursor at offset pill.length + 1 (just after the space), backspace eats
    // the space only.
    const flat = flattenSegments(start); // length = 21
    const out = backspace(start, 16); // delete char at idx 15 = ' '
    expect(flat.length).toBe(21);
    expect(out).toEqual([
      { type: 'pill', value: 'https://foo.com' },
      { type: 'text', value: 'hello' },
    ]);
  });

  test('selection that spans pill + surrounding text removes the pill', () => {
    const start: Segment[] = [
      { type: 'text', value: 'hi ' },
      { type: 'pill', value: 'https://foo.com' },
      { type: 'text', value: ' bye' },
    ];
    // select from offset 2 to offset 20 ('i https://foo.com b'), replace with ''.
    const flat = flattenSegments(start); // 'hi https://foo.com bye' len=22
    const next = flat.slice(0, 2) + flat.slice(20);
    const out = reconcileSegments(start, next, { isPasteLikely: false });
    expect(out).toEqual([{ type: 'text', value: 'hiye' }]);
  });

  test('typing text after a pill appends to trailing text segment', () => {
    const start = paste(EMPTY_SEGMENTS, 'https://foo.com');
    const out = typeChars(start, ' hi');
    expect(out).toEqual([
      { type: 'pill', value: 'https://foo.com' },
      { type: 'text', value: ' hi' },
    ]);
  });

  test('backspace into the pill after typing text after it', () => {
    let segments = paste(EMPTY_SEGMENTS, 'https://foo.com');
    segments = typeChars(segments, ' hi');
    // backspace 'hi ' (3 chars). Pill should still be there until we eat into it.
    segments = backspace(segments);
    segments = backspace(segments);
    segments = backspace(segments);
    expect(segments).toEqual([
      { type: 'pill', value: 'https://foo.com' },
      { type: 'text', value: '' },
    ]);
    // one more backspace swallows the pill entirely.
    segments = backspace(segments);
    expect(segments).toEqual(EMPTY_SEGMENTS);
  });
});

describe('flattenSegments', () => {
  test('empty segments flatten to empty string', () => {
    expect(flattenSegments(EMPTY_SEGMENTS)).toBe('');
  });

  test('pill + text flatten to concatenation', () => {
    expect(
      flattenSegments([
        { type: 'pill', value: 'https://foo.com' },
        { type: 'text', value: ' hi' },
      ]),
    ).toBe('https://foo.com hi');
  });
});
