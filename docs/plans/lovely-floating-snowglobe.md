# Make Capture List Compact & Chat-Like

## Context

The capture list takes up too much vertical space per item. The intent is for it to read like a chat UI — compact bubbles with minimal chrome, newest messages near the composer.

## Changes

### `capture-list.tsx`

1. **Reduce item separator**: `h-4` (16px) -> `h-2` (8px)
2. **Tighten list padding**: `contentContainerClassName="p-4"` -> `"px-3 py-2"`
3. **Add `inverted`** to LegendList so newest items appear at the bottom near the composer
4. **Restructure `CaptureItemSpread`**:
   - Remove outer `<View>` wrapper — return `StyledGlassView` directly
   - Add `self-start max-w-[85%]` so bubbles don't stretch full width
   - Tighten card padding: `px-4 py-3` -> `px-3 py-2`, `gap-2` -> `gap-1`
   - Move timestamp **inside** the card, on the same row as capture type
   - Demote badge from pill (`rounded-full bg-muted px-2 py-0.5 text-xs`) to plain text (`text-[10px] text-muted-foreground capitalize`)
   - Timestamp also `text-[10px]`, right-aligned via `justify-between`

New item component:

```tsx
function CaptureItemSpread({
  item,
}: LegendListRenderItemProps<CaptureItemData>) {
  return (
    <StyledGlassView
      isInteractive
      className="self-start max-w-[85%] flex-col gap-1 rounded-lg rounded-bl-none px-3 py-2"
    >
      <Text className="text-primary">{item.rawContent}</Text>
      <View className="flex-row items-center justify-between gap-3">
        <Text
          className="text-[10px] text-muted-foreground capitalize"
          variant="muted"
        >
          {item.captureType}
        </Text>
        <Text className="text-[10px] text-muted-foreground">
          {formatRelativeTime(item.capturedAt)}
        </Text>
      </View>
    </StyledGlassView>
  );
}
```

### `capture.tsx`

1. **Update `estimatedItemSize`**: `80` -> `60`
2. **Verify padding with inverted list** — `paddingBottom` on the content container may need to become `paddingTop` since inverted flips the layout. Test and adjust.

### No changes to `capture-composer.tsx`

## Files to Modify

- `apps/assistant-mobile/src/modules/capture/components/capture-list.tsx`
- `apps/assistant-mobile/src/app/(tabs)/capture.tsx`

## Verification

1. Run `pnpm run lint:fix` and `pnpm -w run lint`
2. Run `pnpm -w run test`
3. Visual check on iOS simulator — confirm bubbles are compact, left-aligned, newest at bottom near composer, timestamp/type visible inside bubble
