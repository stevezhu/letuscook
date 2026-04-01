---
date: 2026-03-30T15:31:54Z
type: research
status: done
agent: geminicli
models: [gemini-2.0-flash-001]
branch: t7
tags: [react-native, reanimated, layout, animations]
filesModified: []
---

# Research: Extra Content Padding Animation Failure

## Question

Why does `extraContentPadding` in `@apps/assistant-mobile/src/app/(tabs)/capture.tsx` fail to animate when the duration is set to 250ms, but works correctly at 0ms or 10ms?

## Findings

The failure of the 250ms animation is likely due to one of the following technical constraints or conflicts:

### 1. Layout Feedback Loop

`onLayout` is triggered whenever the `CaptureComposer` changes size.

- **The Sequence:** `onLayout` fires → `withTiming(..., { duration: 250 })` starts on `extraContentPadding`.
- **The Impact:** `KeyboardChatScrollView` receives this changing value and adjusts its internal content inset/padding.
- **The Feedback:** Because `KeyboardChatScrollView` is part of the same layout tree, adjusting its padding can cause a slight layout shift in its children (including the Sticky View).
- **The Result:** This shift triggers _another_ `onLayout` on the composer. If this happens at high frequency (every frame of a 250ms animation), `withTiming` is constantly being cancelled and restarted from the "current" position. At 0ms or 10ms, the value jumps to the target before the next layout frame can interrupt it.

### 2. State Sync Conflict

Updating `inputHeight` via `setInputHeight(height)` triggers a React state update and a subsequent re-render of the `CaptureScreen` component.

- If the re-render occurs while the Reanimated shared value is mid-animation, the `KeyboardChatScrollView` (a native component) might be sensitive to prop updates during re-renders, causing it to "snap" to the current value or lose the transition state.

### 3. Native Prop Subscription

The `KeyboardChatScrollView` from `react-native-keyboard-controller` is a native wrapper.

- Native components that accept padding props sometimes expect a static number during a specific layout pass.
- While Reanimated can bridge shared values, the component's internal Swift/Kotlin logic might not be designed to "subscribe" to frame-by-frame updates of a JS-driven timing animation for this specific prop.
- At 0ms, the jump is immediate, so the native layout calculation sees the final value in one pass.

## Recommendation

To resolve the feedback loop, implement a guard in `onLayout` to prevent redundant updates and potentially debouncing or rounding the height value:

```tsx
onLayout={(e) => {
  const height = Math.round(e.nativeEvent.layout.height);
  if (height === inputHeight) return; // Prevent feedback loops

  extraContentPadding.value = withTiming(
    Math.max(height - TEXT_HEIGHT, 0),
    { duration: 250 }
  );
  setInputHeight(height);
}}
```

Additionally, consider using `useDerivedValue` if the padding calculation can be moved entirely to the UI thread to avoid the React state update (`setInputHeight`) during the animation.

## References

- [React Native Reanimated - withTiming](https://docs.swmansion.com/react-native-reanimated/docs/animations/withTiming/)
- [react-native-keyboard-controller - KeyboardChatScrollView](https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/keyboard-chat-scroll-view)
