# Spec: auth-gate

WorkOS authentication gate that enables server sync while preserving offline capture functionality for unauthenticated users.

## Requirements

### Sign-In Flow

- WHEN an unauthenticated user taps "Sign in"
- THEN the WorkOS OAuth flow opens in the system browser via `expo-auth-session`
- AND after successful authentication, the user is redirected back to the app

- WHEN the OAuth callback is received with an authorization code
- THEN the code is exchanged for access and refresh tokens
- AND tokens are stored in `expo-secure-store`
- AND the Convex client is configured with the auth token

### Auth State

- WHEN the app launches and valid tokens exist in SecureStore
- THEN the user is automatically authenticated
- AND the Convex client receives the token

- WHEN tokens are expired
- THEN a silent refresh is attempted using the refresh token
- AND if refresh fails, the user is prompted to sign in again

### Auth Context

- WHEN any component needs auth state
- THEN it uses the `useAuth` hook which provides:
  - `isAuthenticated: boolean`
  - `user: { id, email, displayName } | null`
  - `signIn: () => void`
  - `signOut: () => void`
  - `isLoading: boolean`

### Feature Gating

- WHEN the user is not authenticated
- THEN the Capture tab works normally (local-only mode)
- AND the Home tab shows a sign-in prompt instead of the inbox
- AND the Search tab shows a sign-in prompt instead of search

- WHEN the user signs in
- THEN local captures are synced to the server (see capture-input sync)
- AND all tabs become fully functional

### Sign Out

- WHEN the user taps "Sign out"
- THEN tokens are removed from SecureStore
- AND the Convex client auth is cleared
- AND the user returns to unauthenticated state
- AND local capture data is preserved (not deleted)

## Constraints

- Auth provider is WorkOS AuthKit.
- Tokens are stored using `expo-secure-store` (encrypted, device-local).
- The Convex backend validates tokens server-side — the client only passes the token.
