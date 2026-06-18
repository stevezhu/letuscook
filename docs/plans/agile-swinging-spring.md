# Inline Link Pills in Capture Composer

## Context

When a user pastes a URL into the mobile capture composer, it should render as an **inline pill** within the text flow — a styled segment with a pill background and link glyph, flowing in-line with the rest of the prose. Two behaviors are load-bearing:

1. **Paste-only creation.** Pills are only ever created from a paste. If the user types `https://example.com` character by character, it stays plain text forever. The same sequence of characters therefore renders differently depending on how it got into the input.
2. **Atomic delete.** A pill is one token. Pressing backspace anywhere against a pill removes the whole thing in one keystroke, not character-by-character.

Because "pasted" vs "typed" cannot be recovered from the flat string alone, the raw text can no longer be the source of truth for the composer. We need a **segment model** where each segment is either free-form text or a pill (URL), and the flat string is derived from the segments at render and at submit time. The backend contract (`rawContent: string`) is unchanged — pills simply flatten to their URL on submit.

## Approach

Replace `captureTextAtom: string` with `captureSegmentsAtom: Segment[]`, where `Segment = { type: 'text'; value: string } | { type: 'pill'; value: string }`. The `TextInput` renders styled `<Text>` children segment-by-segment (pill segments get a highlighted background + link glyph). On every `onChangeText`, we diff the previous flat text against the new flat text; the diff classifies the edit as either:

- **Paste containing URLs** → insert text + pill + text segments at the edit position.
- **Plain insertion** → append/insert characters into the adjacent text segment (never pill-ifies, even if the user types a full URL).
- **Deletion** → if the removed range touches any character of a pill segment, expand the removal to the whole pill segment. Otherwise apply the deletion to the affected text segment(s) directly.

On submit, `captureSegmentsAtom` flattens to a plain string (pills → their URL) and flows through the existing mutation path unchanged.

## Files to modify

### 1. New: segment model + edit-diff engine

**`apps/assistant-mobile/src/modules/capture/lib/segments.ts`** (new)

Exports:

- `type Segment = { type: 'text'; value: string } | { type: 'pill'; value: string }`
- `EMPTY_SEGMENTS: Segment[] = [{ type: 'text', value: '' }]` — the canonical empty state (always has at least one text segment so the cursor has somewhere to sit).
- `flattenSegments(segments: Segment[]): string` — concatenates `.value` in order.
- `URL_REGEX` — pragmatic regex for `https?://…` bounded by whitespace or string edges, excluding trailing `.,;)]}` from the match.
- `findUrlsInChunk(chunk: string): Array<{ start: number; end: number; url: string }>` — returns ordered, non-overlapping URL matches.
- `reconcileSegments(prev: Segment[], next: string, options: { isPasteLikely: boolean }): Segment[]` — **the core function**. Given the previous segments and the new flat string from `onChangeText`, produce the new segment list. Algorithm:
  1. Compute `prevFlat = flattenSegments(prev)`.
  2. Compute common prefix length `p` and common suffix length `s` between `prevFlat` and `next` (clamped so `p + s ≤ min(prevFlat.length, next.length)`).
  3. `removed = prevFlat.slice(p, prevFlat.length - s)`
     `inserted = next.slice(p, next.length - s)`
  4. **Map `p` and `prevFlat.length - s` back to segment coordinates.** Walk `prev` summing segment lengths; for each absolute offset find `(segmentIndex, offsetWithinSegment)`. This gives the removal's start segment + offset and end segment + offset.
  5. **Expand removal across pill boundaries:** if the removal's start offset falls strictly inside a pill segment (offset > 0 and segment is a pill), snap the start back to that pill's start. Same for end: if end offset is strictly inside a pill (offset < segment.length), snap forward to that pill's end. Additionally, if `removed.length > 0` and the removal _exactly touches_ a pill (start offset === 0 of a pill on the leading edge, or end offset === segment.length of a pill on the trailing edge) without including the whole pill, **also** expand to swallow it — this is how "backspace right after a pill" eats the pill. Concretely: when `removed.length > 0` and the character immediately before the removal is the last char of a pill, expand start to that pill's start; when the character immediately after the removal is the first char of a pill, expand end to that pill's end.
  6. Build `before = prev[0..startSegment]` truncated to the surviving prefix text, and `after = prev[endSegment..]` truncated to the surviving suffix text. Both sides may end up as `{type: 'text', value: ''}` placeholders.
  7. **Classify the insertion.** If `isPasteLikely && inserted.length > 1`, run `findUrlsInChunk(inserted)`. For each URL found, slice `inserted` into `[text before URL, pill, text after URL, ...]` and build a list of new segments from those slices. Otherwise treat `inserted` as a single text segment.
  8. Concatenate `before + insertedSegments + after`, then **coalesce adjacent text segments** (merge consecutive `{type: 'text'}` into one) and drop empty non-leading/trailing text segments. Guarantee the result has at least one segment (fall back to `EMPTY_SEGMENTS`).
- `segmentsToFlatSelection(segments, selection)` — helper used only if we need to restore cursor position after a pill expansion (may not be needed on v1; see "Open risk").

**`apps/assistant-mobile/src/modules/capture/lib/segments.test.ts`** (new)

Jest tests with explicit scenarios:

- **Empty + typed char** → single text segment, one char.
- **Typed URL character by character** (repeated single-char inserts, `isPasteLikely: false`) → still one plain text segment containing the URL. **No pill is created.** This is the load-bearing test.
- **Paste URL into empty** (`isPasteLikely: true`, `inserted.length > 1`) → `[text '', pill URL, text '']` coalesced to `[pill URL, text '']` or similar — assert the pill exists.
- **Paste "check this out https://foo.com cool"** → text 'check this out ' + pill + text ' cool'.
- **Paste two URLs in one chunk** → two pills with text between/around.
- **Backspace at end of pill** (state: `[pill URL, text '']`, remove last char) → `[text '']`. Pill is gone entirely.
- **Backspace inside pill** (state: `[pill URL]`, remove middle char) → pill gone, replaced with empty text. The character-level edit would have broken the URL; per the rule we remove the whole pill instead.
- **Backspace inside adjacent text** (state: `[pill URL, text 'hello']`, delete 'o') → `[pill URL, text 'hell']`. Pill untouched.
- **Select across pill + text and delete** → the pill and any selected text are both removed.
- **Paste URL into middle of existing text** → text split into before/after around a new pill.
- **Non-http scheme pasted** (`ftp://foo`) → plain text, no pill.

### 2. Atoms: swap string for segments

**`apps/assistant-mobile/src/modules/capture/components/capture-composer-atoms.ts`**

```ts
import { atom } from 'jotai';
import type { CaptureType } from '../guest-capture-types.js';
import {
  EMPTY_SEGMENTS,
  flattenSegments,
  type Segment,
} from '../lib/segments.js';

export const captureSegmentsAtom = atom<Segment[]>(EMPTY_SEGMENTS);
export const captureTypeAtom = atom<CaptureType>('text');

// Derived flat text (for reads only — never write to this from setters)
export const captureFlatTextAtom = atom((get) =>
  flattenSegments(get(captureSegmentsAtom)),
);
export const trimmedCaptureFlatTextAtom = atom((get) =>
  get(captureFlatTextAtom).trim(),
);
```

Remove the old `captureTextAtom` export. Search-and-replace consumers (see step 5).

### 3. Composer: segment-aware TextInput + paste heuristic

**`apps/assistant-mobile/src/modules/capture/components/capture-composer.tsx`**

Update imports: `Text` from `react-native`, `captureSegmentsAtom` / `captureFlatTextAtom` / `trimmedCaptureFlatTextAtom` from the atoms file, `reconcileSegments` / `flattenSegments` from `../lib/segments.js`.

Drop the existing `trimmedCaptureTextAtom` (lines 22) — it lives in the atoms file now.

Rewrite `CaptureComposerTextInput` (lines 52–72):

```tsx
export function CaptureComposerTextInput({
  className,
  ...props
}: CaptureComposerTextInputProps) {
  const [segments, setSegments] = useAtom(captureSegmentsAtom);
  const flat = useAtomValue(captureFlatTextAtom);
  // Track the previous flat length so we can distinguish paste from typing.
  const prevFlatLenRef = useRef(flat.length);

  const handleChangeText = (next: string) => {
    const delta = next.length - prevFlatLenRef.current;
    // Paste heuristic: net insertion of more than 1 character in a single
    // change event. Typing (including autocorrect single-char substitutions)
    // never triggers pill creation.
    const isPasteLikely = delta > 1;
    const nextSegments = reconcileSegments(segments, next, { isPasteLikely });
    setSegments(nextSegments);
    prevFlatLenRef.current = flattenSegments(nextSegments).length;
  };

  return (
    <TextInput
      multiline
      className={cn('text-base max-h-[221px]', className)}
      placeholder="What's on your mind?"
      onChangeText={handleChangeText}
      {...props}
    >
      {segments.map((seg, i) =>
        seg.type === 'pill' ? (
          <Text key={i} className="text-primary bg-primary/10 rounded px-1">
            {'\u{1F517} '}
            {seg.value}
          </Text>
        ) : (
          <Text key={i}>{seg.value}</Text>
        ),
      )}
    </TextInput>
  );
}
```

Notes on the JSX:

- Only `<Text>` (nested) is a legal child of `<TextInput>` in React Native — `<View>`, `<Icon>`, `<Pressable>` are not. The link glyph is a Unicode codepoint (🔗) rather than a `lucide-react-native` `<Icon>`. If the emoji renders poorly on Android during the smoke test, fall back to a text prefix like `"↗ "`.
- Don't pass `value={flat}`. With children, the `TextInput`'s content is derived from the string concatenation of the `<Text>` subtree, which already matches our flattened segments. Passing both `value` and children fights the controlled-input bookkeeping.
- `onChangeText` still fires with the resulting plain string. That's the exact input our diff engine expects.
- If `reconcileSegments` returns structurally the same segments (referential equality from short-circuiting), Jotai won't re-render unnecessarily. Consider a small identity-short-circuit inside `reconcileSegments` when the old and new flat strings are identical.

`CaptureComposerControls` (lines 81–126):

- Replace `useSetAtom(captureTextAtom)` with `useSetAtom(captureSegmentsAtom)` and clear via `setSegments(EMPTY_SEGMENTS)`.
- Replace `useAtomValue(trimmedCaptureTextAtom)` with `useAtomValue(trimmedCaptureFlatTextAtom)`.
- `onSubmit({ value: trimmedText, captureType })` stays the same — `trimmedText` is the flattened string, which for a single-pill-only state is the bare URL, which still hits the backend's `http(s)://` auto-detect in `apps/assistant-convex/convex/captures.ts` and gets promoted to `captureType: 'link'`. No backend change.

### 4. Capture screen: no change

**`apps/assistant-mobile/src/app/(tabs)/capture.tsx`** stays as-is. The composer's internals change, but its exported component shape and child layout don't.

### 5. Shared-content flow: route through segments, marking as paste

**`apps/assistant-mobile/src/modules/capture/components/capture-composer-shared-content.tsx`** (lines 9–30)

Today this writes the OS-shared website URL into `captureTextAtom` and sets `captureTypeAtom` to `'link'`. Change it to seed `captureSegmentsAtom` directly via `reconcileSegments(EMPTY_SEGMENTS, sharedUrl, { isPasteLikely: true })` so the shared URL shows up as a pill with zero extra wiring. Keep the `captureTypeAtom` flip.

### 6. Other consumers of `captureTextAtom`

Grep the mobile app for `captureTextAtom` before touching anything — any file outside the three above that reads the old atom needs to be switched to `captureFlatTextAtom` (for reads) or `captureSegmentsAtom` (for mutations).

## Reused utilities / patterns

- Jotai atoms follow the existing `capture-composer-atoms.ts` pattern.
- `cn` from `@workspace/rn-reusables/lib/utils` — unchanged.
- Backend auto-link-detection in `apps/assistant-convex/convex/captures.ts` — unchanged; handles single-URL submissions.
- `.claude/rules/mobile.md` ios-simulator / Maestro for manual testing.

## Verification

1. **Unit**: `pnpm -w run test` — `segments.test.ts` covers the reconciliation matrix, especially the load-bearing `typed URL stays plain text` and `backspace at end of pill removes whole pill` cases.
2. **Lint/format**: `pnpm run lint:fix && pnpm -w run lint`.
3. **Manual (ios-simulator + Maestro MCP)**:
   - Paste `https://github.com/stevezhu/letuscook/pull/73` into empty input → inline pill appears.
   - Type ` regular testing-library` after the pill → pill stays, typed text is plain.
   - Position the cursor just after the pill, press Backspace once → the entire pill vanishes in a single keystroke. Press again → deletes one plain character.
   - Position the cursor in the middle of the pill (if selectable), press Backspace → whole pill vanishes.
   - **Load-bearing**: with an empty input, type `https://example.com` one character at a time → the text stays plain, no pill ever forms.
   - Paste two URLs in one string → two pills inline with surrounding text preserved.
   - Paste URL into the middle of existing typed text → prefix and suffix stay plain text, pill sits between them.
   - Submit with only a pill → capture created with `captureType: 'link'` via backend auto-detect; composer clears to empty segments.
   - Submit with pill + text → capture `rawContent` is the flattened string; composer clears.
   - Trigger an iOS share of a website → pill shows up via the shared-content flow.
   - **Android smoke test**: boot Android emulator, repeat paste + backspace + type-URL flows. If styled `<Text>` children cause typing/cursor corruption on Android, gate the rich rendering behind `Platform.OS === 'ios'` (Android falls back to plain text) and file a follow-up. Do not ship something that breaks the Android composer.
4. **Code-review comment hygiene**: per `CLAUDE.md`, any touched function previously marked `// ✅ Reviewed by @<user>` must be downgraded to `// 👀 Needs Verification`.

## Out of scope

- Fetching link metadata (title / favicon / OG image).
- Dragging pills to reorder; long-press menus on pills; tap-to-open URL. A pill is read-only except for backspace.
- Web / desktop / extension composers — mobile only.
- Auto-pilling typed URLs on blur or via an explicit "convert to pill" affordance.
- Detecting paste via a future RN `onPaste` API — we rely on the delta-length heuristic.

## Open risks

1. **Delta-length paste heuristic false positives.** An iOS autocorrect suggestion that inserts a multi-character word containing a URL could pill-ify it. Mitigation: `findUrlsInChunk` only matches `https?://` with a real host pattern, so only a suggestion that literally contains `https://…` would trigger. Acceptable.
2. **Cursor position after pill expansion.** When the diff engine expands a single-char backspace into a whole-pill removal, the native cursor position the OS picked is now off. React Native will re-derive cursor from the new children on next render, and in practice lands it at the edit point. If it drifts, add a `selection` state and explicitly set it to the end of the surviving prefix after a pill-expansion deletion. Handle as a follow-up if observed during manual testing rather than speculatively.
3. **Android `<Text>` children in `<TextInput>`**. Historically flaky — covered by the Android smoke test above with an iOS-only fallback.
4. **Autocorrect / IME composition on Android and iOS.** Composition events can fire partial `onChangeText` during multi-keystroke character entry. Since typing never pill-ifies, this only matters for the deletion path; the diff still computes a valid removal, and the worst case is a mid-composition pill removal which is the same as a normal deletion.
