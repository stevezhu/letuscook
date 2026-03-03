---
date: 2026-03-03T05:39:07Z
type: activity
status: complete
agent: claude-opus-4-6
branch: t2
task_id: T2
tags: [auth, workos, oauth, convex, mobile]
files_modified:
  - apps/assistant-mobile/src/polyfills.ts
  - apps/assistant-server/convex/auth.config.ts
  - apps/assistant-mobile/src/lib/auth.ts
  - apps/assistant-mobile/src/providers/auth-provider.tsx
  - apps/assistant-mobile/src/components/user-sync.tsx
  - apps/assistant-server/convex/users.ts
  - apps/assistant-server/convex/scripts/seedAgentUser.ts
  - apps/assistant-mobile/src/hooks/use-require-auth.tsx
  - apps/assistant-mobile/src/app/_layout.tsx
  - apps/assistant-mobile/src/app/(tabs)/_layout.tsx
  - apps/assistant-mobile/src/app/(tabs)/index.tsx
  - apps/assistant-mobile/src/app/(tabs)/search/index.tsx
  - apps/assistant-mobile/package.json
  - apps/assistant-server/package.json
  - apps/assistant-mobile/src/app/(tabs)/__tests__/index.test.tsx
---

# T2: WorkOS AuthKit Integration & User Management

## Summary

Implemented full WorkOS AuthKit OAuth flow for the mobile app with PKCE, Convex JWT validation, user creation on first sign-in, AI agent seeding, and auth gating on Home/Search tabs.

## Context

The app needed authentication so users can sync captures, organize knowledge, and search. WorkOS AuthKit provides OAuth (Google+) via a hosted UI. Capture works without auth (guest mode); Inbox/KB/Search require sign-in. Based on the official `workos/expo-authkit-example` pattern.

## Work Performed

### Dependencies installed

- `@workos-inc/node`, `expo-secure-store`, `expo-crypto`, `expo-standard-web-crypto` in the mobile app
- Added `assistant-server` as a workspace dependency for importing Convex generated API types

### Files created (8)

- **`polyfills.ts`** — WebCrypto polyfill required by `@workos-inc/node` in React Native. Imported as first line in root layout.
- **`auth.config.ts`** — Convex auth config with two `customJwt` providers for WorkOS token validation (two issuer formats).
- **`auth.ts`** — Core auth library: PKCE sign-in URL generation, code exchange, token storage in SecureStore, auto-refresh on expiry, session clearing. All module-level side effects made lazy to avoid test failures.
- **`auth-provider.tsx`** — React context wrapping auth state (`user`, `loading`, `signIn`, `signOut`). Handles deep link callbacks for both cold and warm starts.
- **`user-sync.tsx`** — Headless component that syncs WorkOS user to Convex `users` table via `createOrUpdateUser` mutation. Placed inside `ConvexProviderWithAuth` to resolve the circular dependency between AuthProvider (which must wrap Convex for token provisioning) and Convex mutations (which require the provider).
- **`users.ts`** — Convex mutations/queries: `createOrUpdateUser` (upserts by `workosUserId` index) and `getCurrentUser` (looks up user by JWT subject claim).
- **`seedAgentUser.ts`** — Idempotent internal mutation that creates a CookBot agent user (`userType: "agent"`, `agentProvider: "openai"`, `agentModel: "gpt-4o"`).
- **`use-require-auth.tsx`** — Hook returning `{ isAuthenticated, isLoading, SignInCTA }` for auth-gated screens.

### Files modified (7)

- **Root `_layout.tsx`** — Added polyfill import, replaced `ConvexProvider` with `ConvexProviderWithAuth` using a custom `useConvexAuth` hook that bridges the auth provider, wrapped with `AuthProvider`, added `UserSync` component.
- **Tabs `_layout.tsx`** — Added profile button (CircleUserRound icon from lucide) in header left position. Taps sign in or sign out based on auth state.
- **Home `index.tsx`** and **Search `index.tsx`** — Added auth gate: show `SignInCTA` when unauthenticated, render content when authenticated.
- **Server `package.json`** — Added `import`/`default` conditions to `convex/_generated/*` export so the mobile app can import the generated API at runtime.
- **Test `index.test.tsx`** — Updated to mock `convex/react` and `auth-provider` since HomeScreen now requires auth context.

### Key design decision: AuthProvider ↔ ConvexProvider ordering

AuthProvider wraps ConvexProviderWithAuth (not inside it) because Convex needs the auth token from WorkOS. A separate `UserSync` component inside Convex handles the `createOrUpdateUser` mutation, avoiding a circular dependency.

## Outcome

- All tests pass (2/2)
- Lint passes except for 2 known `n/no-missing-import` errors on Convex `_generated` imports (eslint rule limitation with Convex's bundler-resolved paths — ignored per user instruction)
- Remaining setup: set `WORKOS_CLIENT_ID` in Convex dashboard, set `EXPO_PUBLIC_WORKOS_CLIENT_ID` in mobile `.env`, run `npx convex dev` to regenerate API types, run seed script
