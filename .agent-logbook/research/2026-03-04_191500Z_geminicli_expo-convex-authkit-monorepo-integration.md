---
date: 2026-03-04T19:15:00Z
type: research
status: complete
agent: geminicli
models: [gemini-2.0-pro-exp-02-05]
branch: main
tags: [expo, convex, workos, authkit, monorepo]
---

# Expo, Convex, and WorkOS AuthKit Monorepo Integration

## Summary

This report synthesizes the integration of Expo (React Native), Convex, and WorkOS AuthKit within a Turborepo monorepo. It covers the authentication flow (PKCE for mobile), Convex backend configuration, and user synchronization strategies.

## Question

How can we integrate Expo, Convex, and WorkOS AuthKit in a monorepo while ensuring compatibility between the technologies?

## Findings

### 1. Monorepo Architecture
Based on the existing workspace and references, the recommended structure is:
- `apps/assistant-mobile`: Expo app (React Native).
- `apps/assistant-convex`: Convex backend.
- `packages/workos-sync` (optional): Shared logic or Convex component for user synchronization.

### 2. Authentication Flow (Mobile)
Mobile apps must use the **OAuth 2.0 PKCE (Proof Key for Code Exchange)** flow. WorkOS AuthKit supports this as a public client.

- **Frontend (Expo)**:
    - Use `expo-web-browser` and `expo-linking` to handle the hosted AuthKit UI.
    - Use `expo-secure-store` for persistent storage of access and refresh tokens.
    - Implement a custom `AuthContext` to manage the session (as seen in `expo-authkit-example`).
- **Convex Bridge**:
    - Convex requires a `useAuth` hook for its `ConvexProviderWithAuth`.
    - Bridge the `AuthContext` to provide `isLoading`, `isAuthenticated`, and `fetchAccessToken`.
    - `fetchAccessToken` should return the WorkOS access token, refreshing it if necessary using the refresh token stored in `SecureStore`.

### 3. Convex Backend Configuration
- **Auth Config**: `convex/auth.config.ts` must use `customJwt` providers for WorkOS.
- **Providers**: Two providers are typically needed:
    1. `issuer: "https://api.workos.com/"`
    2. `issuer: "https://api.workos.com/user_management/${WORKOS_CLIENT_ID}"`
- **User Identity**: Access the authenticated user in Convex functions via `ctx.auth.getUserIdentity()`.

### 4. User Synchronization
To keep the Convex database in sync with WorkOS users (e.g., for profile data):
- **WorkOS Events API**: Preferred over webhooks for Convex. A Convex action/mutation can poll or be triggered to process events like `user.created`, `user.updated`, and `user.deleted` (as seen in the `workos-authkit` sync package).
- **Convex Helpers**: Use `convex-helpers` for common patterns like omitting system fields.

### 5. Conflict Resolution & Best Practices
- **Conflict**: `@workos-inc/authkit-react` is designed for web and may not be compatible with React Native.
- **Resolution**: Implement a custom mobile-native `AuthContext` using `expo-web-browser` instead of relying on the web-focused SDK.
- **Conflict**: `@convex-dev/workos` provides `ConvexProviderWithAuthKit` for web.
- **Resolution**: Use the standard `ConvexProviderWithAuth` from `convex/react` and pass it a custom `useAuth` hook that pulls from the mobile `AuthContext`.

## Recommendation

For a robust implementation:
1.  **Follow the PKCE pattern** in `expo-authkit-example` for the Expo app.
2.  **Use `customJwt`** in Convex `auth.config.ts` as demonstrated in `template-react-vite-authkit`.
3.  **Implement a bridge hook** in the Expo app to connect `AuthContext` to `ConvexProviderWithAuth`.
4.  **Integrate the WorkOS Events sync logic** from `workos-authkit` into the Convex backend to maintain a local `users` table.

## References

- [WorkOS Expo Integration Guide](https://workos.com/docs/integrations/react-native-expo)
- [Convex AuthKit Guide](https://docs.convex.dev/auth/authkit)
- [WorkOS Expo AuthKit Example](https://github.com/workos/expo-authkit-example)
- [Convex WorkOS Sync Package](https://github.com/get-convex/workos-authkit)
- [Convex React Vite AuthKit Template](https://github.com/get-convex/templates/tree/main/template-react-vite-authkit)
- [Expo Convex Guide](https://docs.expo.dev/guides/using-convex/)
