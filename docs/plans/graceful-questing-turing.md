# Change Knowledge Node Page from Modal to Stack

## Context

The knowledge node detail page (`/knowledge/[nodeId]`) currently uses `presentation: 'modal'`, which slides up from the bottom on iOS. The user wants it to behave as a standard stack screen that pushes from the right with a back button to return to the knowledge list.

## Changes

### 1. `apps/assistant-mobile/src/app/_layout.tsx` (line 89-95)

Remove `presentation: 'modal'` from the `knowledge/[nodeId]` Stack.Screen:

```tsx
<Stack.Screen
  name="knowledge/[nodeId]"
  options={{
    headerShown: true,
  }}
/>
```

### 2. `apps/assistant-mobile/src/app/knowledge/[nodeId].tsx` (line 37-42)

Remove `presentation: 'modal'` from the inline Stack.Screen options:

```tsx
<Stack.Screen
  options={{
    title: 'Node',
  }}
/>
```

That's it — Expo Router's Stack uses `card` presentation by default, which gives the standard push animation with a native back button. No additional back button code is needed since the Stack header provides one automatically when `headerShown: true`.

## Verification

1. Run the app on iOS simulator
2. Navigate to the Knowledge tab
3. Tap a knowledge node — it should push from the right (not slide up from the bottom)
4. The header should show a back button (chevron) that returns to the knowledge list
5. Swiping from the left edge should also go back
6. Navigating between nodes (tapping connections) should stack correctly
