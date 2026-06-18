export type Segment =
  | { type: 'text'; value: string }
  | { type: 'pill'; value: string };

export const EMPTY_SEGMENTS: Segment[] = [{ type: 'text', value: '' }];

export function flattenSegments(segments: Segment[]): string {
  let result = '';
  for (const seg of segments) result += seg.value;
  return result;
}

// Matches http(s) URLs. The trailing class excludes common punctuation that is
// almost always part of the surrounding prose, not the URL.
export const URL_REGEX = /https?:\/\/[^\s<>"'`]+[^\s<>"'`.,;:!?)\]}]/g;

export function findUrlsInChunk(
  chunk: string,
): { start: number; end: number; url: string }[] {
  const out: { start: number; end: number; url: string }[] = [];
  URL_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = URL_REGEX.exec(chunk)) !== null) {
    out.push({
      start: match.index,
      end: match.index + match[0].length,
      url: match[0],
    });
  }
  return out;
}

function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a.charCodeAt(i) === b.charCodeAt(i)) i++;
  return i;
}

function commonSuffixLength(a: string, b: string, cap: number): number {
  const max = Math.min(a.length, b.length) - cap;
  let i = 0;
  while (
    i < max &&
    a.charCodeAt(a.length - 1 - i) === b.charCodeAt(b.length - 1 - i)
  ) {
    i++;
  }
  return i;
}

type SegmentPoint = {
  segmentIndex: number;
  offset: number;
};

// At segment boundaries we prefer the NEXT segment (strict `<`). This means
// an offset of exactly pill.length points to the start of whatever follows
// the pill, not the pill's trailing edge. Combined with the "strictly inside"
// pill-expansion rules below, this cleanly separates "edit at pill boundary"
// (leave the pill alone) from "edit that lands inside the pill" (atomic
// removal). When the offset exceeds the total length, fall back to the very
// last position.
function pointForOffset(segments: Segment[], absolute: number): SegmentPoint {
  let acc = 0;
  for (let i = 0; i < segments.length; i++) {
    const len = segments[i]!.value.length;
    if (absolute < acc + len) {
      return { segmentIndex: i, offset: absolute - acc };
    }
    acc += len;
  }
  const lastIndex = Math.max(0, segments.length - 1);
  return {
    segmentIndex: lastIndex,
    offset: segments[lastIndex]?.value.length ?? 0,
  };
}

function coalesce(segments: Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const seg of segments) {
    if (seg.type === 'text') {
      const prev = out[out.length - 1];
      if (prev && prev.type === 'text') {
        out[out.length - 1] = { type: 'text', value: prev.value + seg.value };
        continue;
      }
    }
    out.push(seg);
  }
  // Drop empty text segments unless the whole result would be empty.
  const filtered = out.filter(
    (s) => !(s.type === 'text' && s.value.length === 0),
  );
  if (filtered.length === 0) return EMPTY_SEGMENTS;
  // Guarantee at least one trailing text segment so the cursor has somewhere
  // to land after a pill.
  const last = filtered[filtered.length - 1]!;
  if (last.type === 'pill') {
    filtered.push({ type: 'text', value: '' });
  }
  return filtered;
}

export function reconcileSegments(
  prev: Segment[],
  next: string,
  options: { isPasteLikely: boolean },
): Segment[] {
  const prevFlat = flattenSegments(prev);
  if (prevFlat === next) return prev;

  const p = commonPrefixLength(prevFlat, next);
  const s = commonSuffixLength(prevFlat, next, p);

  const removedStart = p;
  const removedEnd = prevFlat.length - s;
  const insertedStart = p;
  const insertedEnd = next.length - s;
  const inserted = next.slice(insertedStart, insertedEnd);

  // Map to segment coordinates
  let startPoint = pointForOffset(prev, removedStart);
  let endPoint = pointForOffset(prev, removedEnd);

  // Expand across pill boundaries. Because pointForOffset prefers the NEXT
  // segment at boundaries, any offset that's strictly inside a pill segment
  // means the edit touches pill characters — and pills delete atomically.
  // Boundary offsets (0, or length) leave the pill alone.
  {
    const seg = prev[startPoint.segmentIndex]!;
    if (
      seg.type === 'pill' &&
      startPoint.offset > 0 &&
      startPoint.offset < seg.value.length
    ) {
      startPoint = { segmentIndex: startPoint.segmentIndex, offset: 0 };
    }
  }
  {
    const seg = prev[endPoint.segmentIndex]!;
    if (
      seg.type === 'pill' &&
      endPoint.offset > 0 &&
      endPoint.offset < seg.value.length
    ) {
      endPoint = {
        segmentIndex: endPoint.segmentIndex,
        offset: seg.value.length,
      };
    }
  }

  // Build the surviving prefix and suffix as segment arrays.
  const before: Segment[] = [];
  for (let i = 0; i < startPoint.segmentIndex; i++) before.push(prev[i]!);
  const startSeg = prev[startPoint.segmentIndex];
  if (startSeg) {
    if (startSeg.type === 'text') {
      before.push({
        type: 'text',
        value: startSeg.value.slice(0, startPoint.offset),
      });
    } else if (startPoint.offset === startSeg.value.length) {
      before.push(startSeg);
    }
  }

  const after: Segment[] = [];
  const endSeg = prev[endPoint.segmentIndex];
  if (endSeg) {
    if (endSeg.type === 'text') {
      after.push({
        type: 'text',
        value: endSeg.value.slice(endPoint.offset),
      });
    } else if (endPoint.offset === 0) {
      after.push(endSeg);
    }
  }
  for (let i = endPoint.segmentIndex + 1; i < prev.length; i++) {
    after.push(prev[i]!);
  }

  // Classify the insertion.
  const insertedSegments: Segment[] = [];
  if (options.isPasteLikely && inserted.length > 1) {
    const urls = findUrlsInChunk(inserted);
    if (urls.length === 0) {
      insertedSegments.push({ type: 'text', value: inserted });
    } else {
      let cursor = 0;
      for (const m of urls) {
        if (m.start > cursor) {
          insertedSegments.push({
            type: 'text',
            value: inserted.slice(cursor, m.start),
          });
        }
        insertedSegments.push({ type: 'pill', value: m.url });
        cursor = m.end;
      }
      if (cursor < inserted.length) {
        insertedSegments.push({
          type: 'text',
          value: inserted.slice(cursor),
        });
      }
    }
  } else if (inserted.length > 0) {
    insertedSegments.push({ type: 'text', value: inserted });
  }

  return coalesce([...before, ...insertedSegments, ...after]);
}
