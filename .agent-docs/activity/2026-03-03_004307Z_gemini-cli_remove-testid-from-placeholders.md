---
date: 2026-03-03T00:43:07Z
type: activity
status: complete
agent: gemini-cli
branch: t1-convex-setup-navigation
cost: $0.00
tags: [mobile, ui, react-native, expo, maestro]
files_modified:
  - apps/assistant-mobile/src/app/(tabs)/index.tsx
  - .maestro/example.yaml
---

# Remove testID from Mobile Placeholders

## Summary

Removed the `testID` from the home screen placeholder and verified that Maestro can still test the UI using text selectors.

## Context

The user requested that we do not use `testID` for Maestro tests and instead rely on direct text matching for simplicity.

## Work Performed

- **Removed testID**: Updated `(tabs)/index.tsx` to remove the `testID="welcome_to_expo"` from the "home placeholder" text.
- **Verified with Maestro**:
  - Ran a Maestro flow that taps on "Home" and asserts that "home placeholder" is visible.
  - Ran the existing `.maestro/example.yaml` test, which already uses text-based assertion for "home placeholder", and confirmed it still passes.

## Outcome

The mobile placeholder UIs are now even simpler, and Maestro tests are successfully running using text-based selectors without relying on `testID`.
