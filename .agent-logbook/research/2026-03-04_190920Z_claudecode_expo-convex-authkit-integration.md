---
date: 2026-03-04T19:09:20Z
type: research
status: complete
agent: claudecode
models: [claude-opus-4-6]
branch: t2
tags: [auth, expo, convex, workos, authkit, monorepo]
---

# Expo + Convex + WorkOS AuthKit Integration in a Monorepo

## Overview

This document synthesizes all reference implementations for integrating **Expo (React Native)**, **Convex**, and **WorkOS AuthKit** in a **Turborepo + PNPM monorepo**. No single reference covers the full stack; this research merges patterns from multiple sources to produce a coherent implementation path.

## Current Project State

Our monorepo (`letuscook`) already has:

- **`apps/assistant-mobile`** — Expo app with Expo Router, TanStack Query, UniWind
  - Scheme: `letuscook` (defined in `app.config.ts`)
  - Already depends on `assistant-convex` workspace package
- **`apps/assistant-convex`** — Convex backend
  - Already has `convex/auth.config.ts` with WorkOS JWT validation (two `customJwt` providers)
  - Already has a `users` table with `workosUserId` field and `createOrUpdateUser` / `getCurrentUser` functions
  - Does NOT yet have `@convex-dev/workos-authkit` component installed

## References Analyzed

| # | Reference | What it covers | What it lacks |
|---|-----------|---------------|---------------|
| 1 | [workos/expo-authkit-example](https://github.com/workos/expo-authkit-example) | Expo + WorkOS AuthKit with PKCE, SecureStore, WebBrowser | No Convex, no monorepo |
| 2 | [get-convex/turbo-expo-nextjs-clerk-convex-monorepo](https://github.com/get-convex/turbo-expo-nextjs-clerk-convex-monorepo) | Monorepo structure for Convex + Expo | Uses Clerk (not AuthKit), yarn not pnpm |
| 3 | [get-convex/templates/template-react-vite-authkit](https://github.com/get-convex/templates/tree/main/template-react-vite-authkit) | Convex + AuthKit (React web) with `ConvexProviderWithAuthKit` | Web only, no Expo, no monorepo |
| 4 | [get-convex/workos-authkit](https://github.com/get-convex/workos-authkit) | `@convex-dev/workos-authkit` component for user syncing via webhooks | Web only, no Expo |
| 5 | [Convex docs: Auth with AuthKit](https://docs.convex.dev/auth/authkit) | Official Convex + AuthKit setup (React & Next.js) | No Expo/React Native |
| 6 | [Convex docs: React Native Quickstart](https://docs.convex.dev/quickstart/react-native) | Basic Convex + Expo setup | No auth |
| 7 | [WorkOS docs: React Native Expo](https://workos.com/docs/integrations/react-native-expo) | WorkOS SSO in Expo using AuthSession + WebBrowser | Older SSO-only approach, no PKCE, no Convex |
| 8 | [Expo docs: Authentication](https://docs.expo.dev/guides/authentication/) | General OAuth patterns with `expo-auth-session` | No WorkOS-specific guidance |
| 9 | [Expo docs: Using Convex](https://docs.expo.dev/guides/using-convex/) | Basic Convex integration in Expo | No auth |

---

## Key Architectural Decisions

### Authentication Approach: Two Viable Patterns

#### Option A: Use `@workos-inc/node` SDK directly with PKCE (from Reference 1)

**How it works:**
1. Use `WorkOS` from `@workos-inc/node` in "public client mode" (no API key needed for PKCE)
2. Generate auth URL with `workos.userManagement.getAuthorizationUrlWithPKCE()`
3. Open in `WebBrowser.openAuthSessionAsync()`
4. Exchange code for tokens using `workos.userManagement.authenticateWithCode()` with PKCE verifier
5. Store tokens in `expo-secure-store`
6. Manually manage token refresh with `authenticateWithRefreshToken()`
7. Pass access token to Convex via `ConvexProviderWithAuth`

**Requires:**
- WebCrypto polyfill (`expo-standard-web-crypto` + `expo-crypto`) for PKCE
- Custom `AuthContext` managing all auth state
- Custom token refresh logic
- Manual `fetchAccessToken` implementation for Convex

**Polyfill setup** (from Reference 1):
```typescript
// src/polyfills.ts — MUST be imported first in entry point
import { polyfillWebCrypto } from 'expo-standard-web-crypto';
import { digest } from 'expo-crypto';

polyfillWebCrypto();
if (!globalThis.crypto.subtle) {
  globalThis.crypto.subtle = { digest } as SubtleCrypto;
}
```

```typescript
// index.ts (entry point)
import './src/polyfills'; // MUST be first import
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
```

**Dependencies:**
- `@workos-inc/node` ^8.0.0
- `expo-web-browser`
- `expo-linking`
- `expo-secure-store`
- `expo-crypto`
- `expo-standard-web-crypto`

#### Option B: Use `@workos-inc/authkit-react` SDK (from References 3, 5)

**How it works:**
1. Use `AuthKitProvider` and `useAuth()` from `@workos-inc/authkit-react`
2. SDK handles auth flow, token storage, and refresh internally
3. Bridge to Convex via `ConvexProviderWithAuthKit` from `@convex-dev/workos`
4. SDK uses `getAccessToken()` which Convex provider calls to get JWT

**Requires:**
- CORS configured in WorkOS Dashboard for the app domain
- The `authkit-react` SDK — designed for web browsers; **unclear if it works in React Native**

**Dependencies:**
- `@workos-inc/authkit-react` ^0.16.0
- `@convex-dev/workos` (provides `ConvexProviderWithAuthKit`)

### Recommended: Option A (PKCE with `@workos-inc/node`)

**Rationale:**
- `@workos-inc/authkit-react` is designed for web and relies on browser-specific APIs (window.location, cookies, CORS). It will NOT work in React Native without major workarounds.
- The `expo-authkit-example` (Reference 1) is the official WorkOS example for React Native and uses the `@workos-inc/node` SDK with PKCE.
- PKCE is the standard for native mobile OAuth — it avoids exposing client secrets.
- We need a custom `ConvexProviderWithAuth` adapter that bridges our custom auth context to Convex.

---

## Detailed Implementation Architecture

### Layer 1: Convex Backend (`apps/assistant-convex`)

#### auth.config.ts (Already exists)
The current `auth.config.ts` is correct and matches all references:
```typescript
// apps/assistant-convex/convex/auth.config.ts
import { AuthConfig } from 'convex/server';
const clientId = process.env.WORKOS_CLIENT_ID;
export default {
  providers: [
    {
      type: 'customJwt',
      issuer: 'https://api.workos.com/',
      algorithm: 'RS256',
      applicationID: clientId,
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
    },
    {
      type: 'customJwt',
      issuer: `https://api.workos.com/user_management/${clientId}`,
      algorithm: 'RS256',
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
    },
  ],
} satisfies AuthConfig;
```

**Why two providers?** WorkOS issues JWTs with different `iss` claims depending on how the user authenticates (SSO vs user management). Both must be accepted.

#### Optional: `@convex-dev/workos-authkit` Component (from Reference 4)

This is an **additional layer** for syncing WorkOS user data to Convex via webhooks. It provides:
- Automatic user create/update/delete syncing from WorkOS events
- `getAuthUser()` helper for querying the synced user
- Action handlers for custom auth/registration logic
- HTTP route handler for WorkOS webhooks

**Setup requires:**
```typescript
// convex/convex.config.ts
import workOSAuthKit from "@convex-dev/workos-authkit/convex.config";
import { defineApp } from "convex/server";
const app = defineApp();
app.use(workOSAuthKit);
export default app;
```

```typescript
// convex/auth.ts
import { AuthKit } from "@convex-dev/workos-authkit";
import { components } from "./_generated/api";
export const authKit = new AuthKit(components.workOSAuthKit);
```

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { authKit } from "./auth";
const http = httpRouter();
authKit.registerRoutes(http);
export default http;
```

**Environment variables needed on Convex:**
- `WORKOS_CLIENT_ID`
- `WORKOS_API_KEY`
- `WORKOS_WEBHOOK_SECRET`

**Note:** Our project already has manual user syncing via `createOrUpdateUser` mutation. The `@convex-dev/workos-authkit` component replaces this with webhook-driven syncing, which is more reliable (covers out-of-band user changes in WorkOS dashboard). Decision on whether to adopt this is separate from the auth flow.

### Layer 2: Expo Mobile App (`apps/assistant-mobile`)

#### Entry Point Setup

The expo-authkit-example uses a custom `index.ts` entry point with polyfills loaded first. In our Expo Router app, we need to handle this differently.

**Option for Expo Router apps:**
Since Expo Router uses `expo-router/entry` as the entry point, the polyfill must be loaded in the root layout before any auth code runs. Alternatively, we can set a custom entry point.

**Recommended approach — custom entry via `package.json`:**
```json
{
  "main": "./index.ts"
}
```
```typescript
// index.ts
import './src/polyfills';
import 'expo-router/entry';
```

#### Auth Library (`src/lib/auth.ts`)

Adapted from Reference 1 for our project:

```typescript
import { WorkOS } from '@workos-inc/node';
import * as SecureStore from 'expo-secure-store';

const WORKOS_CLIENT_ID = process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID!;
const REDIRECT_URI = 'letuscook://callback'; // matches app.config.ts scheme

const workos = new WorkOS({ clientId: WORKOS_CLIENT_ID });

// Key functions:
// - getSignInUrl(): generates PKCE auth URL, stores code verifier in SecureStore
// - handleCallback(code): exchanges code for tokens, stores session in SecureStore
// - getUser(): returns current user, auto-refreshes expired tokens
// - getAccessToken(): returns current access token (for Convex)
// - clearSession(): clears all stored auth data
```

**Critical: The access token is a JWT** that Convex validates against the JWKS endpoint. This is the bridge — the same token WorkOS issues is what Convex verifies.

#### Auth Context (`src/context/AuthContext.tsx`)

Adapted from Reference 1. Key responsibilities:
1. Load stored session on mount
2. Handle deep link callbacks for OAuth redirect
3. Provide `signIn` / `signOut` / `user` / `loading` state
4. Provide `getAccessToken` for Convex bridge

```typescript
// Simplified flow:
// signIn() -> getSignInUrl() -> WebBrowser.openAuthSessionAsync() -> callback URL
// callback -> handleCallback(code) -> tokens stored -> user state updated
```

**Deep linking setup:**
- `expo-linking` handles the `letuscook://callback` redirect
- Both warm-start (via `WebBrowser.openAuthSessionAsync` return value) and cold-start (via `Linking.addEventListener`) must be handled

#### Convex Provider Bridge

This is the missing piece — bridging our custom auth to Convex. Based on Reference 3's `ConvexProviderWithAuthKit` pattern:

```typescript
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';

// Custom hook that returns { isLoading, isAuthenticated, fetchAccessToken }
// for ConvexProviderWithAuth
function useAuthFromWorkOS() {
  const { loading, user, getAccessToken } = useAuth(); // our custom hook

  const fetchAccessToken = useCallback(async () => {
    try {
      return await getAccessToken();
    } catch {
      return null;
    }
  }, [getAccessToken]);

  return useMemo(() => ({
    isLoading: loading,
    isAuthenticated: !!user,
    fetchAccessToken,
  }), [loading, user, fetchAccessToken]);
}

// In layout:
<ConvexProviderWithAuth client={convexClient} useAuth={useAuthHook}>
  {children}
</ConvexProviderWithAuth>
```

**Important:** Use `useConvexAuth()` (not our custom `useAuth()`) for checking auth state in components that need to make authenticated Convex queries. `useConvexAuth` ensures the token has been validated by the Convex backend.

### Layer 3: Monorepo Considerations

#### Package Dependencies

The `@workos-inc/node` SDK and crypto polyfills are only needed in `apps/assistant-mobile`. The Convex auth config and `@convex-dev/workos-authkit` component are only in `apps/assistant-convex`.

**assistant-mobile/package.json additions:**
```json
{
  "dependencies": {
    "@workos-inc/node": "^8.0.0",
    "expo-web-browser": "~15.0.10",
    "expo-linking": "~8.0.11",
    "expo-secure-store": "~15.0.8",
    "expo-crypto": "^15.0.8",
    "expo-standard-web-crypto": "^3.0.8"
  }
}
```

**assistant-convex/package.json additions (if using the component):**
```json
{
  "dependencies": {
    "@convex-dev/workos-authkit": "^0.1.6",
    "@workos-inc/node": "^8.0.0"
  }
}
```

#### app.config.ts Changes

The scheme is already `letuscook`. We need to add plugins:
```typescript
plugins: [
  'expo-router',
  'expo-web-browser',
  'expo-secure-store',
  // ... existing plugins
],
```

#### Development Build Required

A development build (`npx expo run:ios` / `run:android`) is required because:
1. Expo Go cannot handle custom URL schemes for OAuth callbacks
2. The `expo-crypto` native module requires compilation
3. `expo-secure-store` requires native code

---

## Environment Variables

### Expo app (`apps/assistant-mobile/.env`)
```
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
EXPO_PUBLIC_WORKOS_CLIENT_ID=client_XXXXXXXXX
```

### Convex deployment (via `npx convex env set`)
```
WORKOS_CLIENT_ID=client_XXXXXXXXX
WORKOS_API_KEY=sk_test_...          # Only if using @convex-dev/workos-authkit
WORKOS_WEBHOOK_SECRET=whsec_...     # Only if using @convex-dev/workos-authkit
```

### WorkOS Dashboard Configuration
- **Redirect URI**: `letuscook://callback`
- **Sessions > CORS**: Not needed for mobile (CORS is a browser concept)

---

## WorkOS AuthKit Component (`@convex-dev/workos-authkit`) — Detailed

### What It Provides (Reference 4)

1. **Webhook-driven user sync**: WorkOS sends `user.created`, `user.updated`, `user.deleted` events to your Convex HTTP endpoint. The component processes these and maintains a users table.

2. **`getAuthUser(ctx)`**: Query helper that reads the current authenticated user from the component's internal user table by matching `ctx.auth.getUserIdentity().subject`.

3. **Event handlers**: Custom logic when users are created/updated/deleted:
```typescript
export const { authKitEvent } = authKit.events({
  "user.created": async (ctx, event) => {
    // Create row in your own users table
    await ctx.db.insert("users", {
      authId: event.data.id,
      email: event.data.email,
      name: `${event.data.firstName} ${event.data.lastName}`,
    });
  },
});
```

4. **Action handlers**: Block registration/authentication:
```typescript
export const { authKitAction } = authKit.actions({
  userRegistration: async (_ctx, action, response) => {
    if (action.userData.email.endsWith("@blocked.com")) {
      return response.deny("Not allowed");
    }
    return response.allow();
  },
});
```

5. **Auth config helper**: `authKit.getAuthConfigProviders()` generates the same two JWT providers we already have manually.

### Comparison: Manual vs Component User Syncing

| Aspect | Current Manual Approach | `@convex-dev/workos-authkit` Component |
|--------|------------------------|---------------------------------------|
| User creation | Client calls `createOrUpdateUser` mutation after login | Webhook-driven, automatic |
| User updates | Only on login | Real-time via webhook events |
| User deletion | Not handled | Automatic via webhook |
| Out-of-band changes | Not detected | Caught by webhooks |
| Admin actions in WorkOS | Not synced | Synced automatically |
| Dependencies | None | `@convex-dev/workos-authkit`, `@workos-inc/node` |
| Setup complexity | Simple | Requires webhook config + env vars |

---

## File-by-File Implementation Reference

### `apps/assistant-mobile/index.ts` (New file)
Entry point that loads polyfills before Expo Router.

### `apps/assistant-mobile/src/polyfills.ts` (New file)
WebCrypto polyfill using `expo-standard-web-crypto` + `expo-crypto`.

### `apps/assistant-mobile/src/lib/auth.ts` (New file)
Core auth logic adapted from Reference 1. Functions:
- `getSignInUrl()` — PKCE auth URL generation
- `handleCallback(code)` — Token exchange
- `getUser()` — Current user with auto-refresh
- `getAccessToken()` — Raw JWT for Convex
- `clearSession()` — Logout cleanup
- `getSessionId()` / `getLogoutUrl()` — WorkOS logout

### `apps/assistant-mobile/src/context/AuthContext.tsx` (New file)
React context providing auth state. Handles:
- Session restoration on mount
- Deep link callback handling
- Sign in/out flows
- Token provision for Convex

### `apps/assistant-mobile/src/app/_layout.tsx` (Modify)
Wrap with providers:
```tsx
<AuthProvider>
  <ConvexProviderWithAuth client={convex} useAuth={useAuthHook}>
    <Stack />
  </ConvexProviderWithAuth>
</AuthProvider>
```

### `apps/assistant-mobile/app.config.ts` (Modify)
Add `expo-web-browser` and `expo-secure-store` to plugins array.

### `apps/assistant-convex/convex/auth.config.ts` (No changes needed)
Already correctly configured.

### `apps/assistant-convex/convex/convex.config.ts` (New file — only if using component)
Register `@convex-dev/workos-authkit` component.

### `apps/assistant-convex/convex/http.ts` (New file — only if using component)
Register webhook routes.

### `apps/assistant-convex/convex/auth.ts` (New file — only if using component)
AuthKit client + event/action handlers.

---

## Key Gotchas & Warnings

1. **Polyfill order is critical**: The crypto polyfill MUST be the first import in the entry point. If any code runs before it, `@workos-inc/node` SDK calls will fail with `"Property 'crypto' doesn't exist"`.

2. **Development build required**: This will NOT work in Expo Go. Custom URL schemes and native crypto modules require a dev build.

3. **Token refresh**: The access token from WorkOS expires. The auth library must handle refresh transparently. Reference 1 checks token expiry with a 10-second buffer and uses `authenticateWithRefreshToken()`.

4. **Convex `useConvexAuth()` vs custom `useAuth()`**: Always use `useConvexAuth()` for conditional rendering of authenticated content. It ensures the Convex backend has validated the token. Use the custom `useAuth()` only for user profile info and sign in/out actions.

5. **`ConvexProviderWithAuth` interface**: The `useAuth` callback must return `{ isLoading: boolean, isAuthenticated: boolean, fetchAccessToken: () => Promise<string | null> }`. This is the bridge between any auth provider and Convex.

6. **WorkOS redirect URI**: Must be registered in the WorkOS Dashboard. For our app: `letuscook://callback`.

7. **`@workos-inc/node` on React Native**: This package is designed for Node.js but works in React Native with the crypto polyfill. It does NOT require an API key for PKCE-only flows (public client mode).

8. **No CORS needed for mobile**: Unlike the web integration (Reference 5), mobile apps don't need CORS configured in WorkOS Dashboard since they don't make browser-origin requests.

9. **Monorepo import paths**: The mobile app imports Convex types via `import { api } from 'assistant-convex/convex/_generated/api'` (workspace package name, not relative path).

---

## Summary: Recommended Implementation Order

1. **Install dependencies** in `apps/assistant-mobile`
2. **Set up polyfills** (entry point + polyfills file)
3. **Create auth library** (`src/lib/auth.ts`) — core PKCE flow
4. **Create auth context** (`src/context/AuthContext.tsx`) — React state management
5. **Bridge to Convex** — custom `useAuth` hook for `ConvexProviderWithAuth`
6. **Update layout** — wire providers in `_layout.tsx`
7. **Update app.config.ts** — add plugins
8. **Configure WorkOS Dashboard** — add redirect URI
9. **Set environment variables** — Expo `.env` and Convex deployment
10. **Create development build** — `npx expo run:ios`
11. **Test the flow** — sign in, verify Convex auth, check token refresh
12. **(Optional)** Add `@convex-dev/workos-authkit` component for webhook-based user syncing
