// Reference: https://github.com/workos/expo-authkit-example/blob/7a5f32adcd3efd6adb91d9e712c7ec277740e9c7/src/lib/auth.ts

/**
 * Core authentication module using WorkOS SDK with PKCE.
 *
 * This mirrors the electron-authkit-example's auth.ts pattern:
 * - getSignInUrl() generates PKCE-protected authorization URL
 * - handleCallback() exchanges code for tokens
 * - getUser() returns current user (with auto-refresh)
 * - clearSession() clears stored credentials
 *
 * Note: Requires react-native-quick-crypto polyfill (see src/polyfills.ts)
 */
import { WorkOS } from '@workos-inc/node';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

// Environment variables (set in .env or app.config.js)
const PKCE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
};

/** Map WorkOS user response to our User type */
function toUser(workosUser: {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePictureUrl?: string | null;
}): User {
  return {
    id: workosUser.id,
    email: workosUser.email,
    firstName: workosUser.firstName ?? null,
    lastName: workosUser.lastName ?? null,
    profilePictureUrl: workosUser.profilePictureUrl ?? null,
  };
}

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

type PkceState = {
  codeVerifier: string;
  expiresAt: number;
};

/**
 * Parse JWT payload without verification (for reading claims only).
 */
function parseJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1];
  // Handle URL-safe base64
  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(normalized));
}

export class ExpoAuthClient {
  private sessionKey: string;
  private pkceKey: string;
  private workos: WorkOS;

  constructor({
    sessionKey,
    pkceKey,
    clientId,
  }: {
    sessionKey: string;
    pkceKey: string;
    clientId: string;
  }) {
    this.sessionKey = sessionKey;
    this.pkceKey = pkceKey;
    // Initialize WorkOS in public client mode (no API key needed for PKCE)
    this.workos = new WorkOS({ clientId });
  }

  /**
   * Get session ID from stored access token (needed for logout).
   */
  async getSessionId(): Promise<string | null> {
    const sessionData = await SecureStore.getItemAsync(this.sessionKey);
    if (!sessionData) return null;

    try {
      const session: StoredSession = JSON.parse(sessionData);
      const payload = parseJwtPayload(session.accessToken);
      return (payload.sid as string) ?? null;
    } catch {
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    const sessionData = await SecureStore.getItemAsync(this.sessionKey);
    if (!sessionData) return null;

    try {
      const session: StoredSession = JSON.parse(sessionData);
      return session.accessToken;
    } catch {
      return null;
    }
  }

  /**
   * Clear stored session and PKCE state.
   */
  async clearSession(): Promise<void> {
    await SecureStore.deleteItemAsync(this.sessionKey);
    await SecureStore.deleteItemAsync(this.pkceKey);
  }

  getRedirectUri({ path }: { path?: string } = {}): string {
    return AuthSession.makeRedirectUri({
      isTripleSlashed: true,
      path,
    });
  }

  /**
   * Generate sign-in URL with PKCE challenge.
   * The WorkOS SDK handles PKCE generation automatically via getAuthorizationUrlWithPKCE.
   */
  async getSignInUrl({
    redirectUri,
  }: {
    redirectUri: string;
  }): Promise<string> {
    const { url, codeVerifier } =
      await this.workos.userManagement.getAuthorizationUrlWithPKCE({
        redirectUri,
        provider: 'authkit',
      });

    // Store code verifier securely - needed for token exchange
    const pkceState: PkceState = {
      codeVerifier,
      expiresAt: Date.now() + PKCE_TTL_MS,
    };
    await SecureStore.setItemAsync(this.pkceKey, JSON.stringify(pkceState));

    return url;
  }

  /**
   * Get WorkOS logout URL for the current session.
   */
  getLogoutUrl({
    sessionId,
    returnTo,
  }: {
    sessionId: string;
    returnTo?: string;
  }): string {
    return this.workos.userManagement.getLogoutUrl({
      sessionId,
      returnTo,
    });
  }

  /**
   * Exchange authorization code for tokens using stored code verifier.
   */
  async handleCallback(code: string): Promise<User> {
    const pkceData = await SecureStore.getItemAsync(this.pkceKey);
    if (!pkceData) {
      throw new Error('No PKCE state found - please try signing in again');
    }

    const pkceState: PkceState = JSON.parse(pkceData);
    if (pkceState.expiresAt < Date.now()) {
      await SecureStore.deleteItemAsync(this.pkceKey);
      throw new Error('Authentication session expired - please try again');
    }

    // Exchange authorization code for tokens using PKCE
    const auth = await this.workos.userManagement.authenticateWithCode({
      code,
      codeVerifier: pkceState.codeVerifier,
    });

    // Clear PKCE state after successful exchange
    await SecureStore.deleteItemAsync(this.pkceKey);

    // Store session securely
    const session: StoredSession = {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user: toUser(auth.user),
    };
    await SecureStore.setItemAsync(this.sessionKey, JSON.stringify(session));

    return session.user;
  }

  /**
   * Get current user, refreshing token if expired.
   */
  async getUser(): Promise<User | null> {
    const sessionData = await SecureStore.getItemAsync(this.sessionKey);
    if (!sessionData) return null;

    const session: StoredSession = JSON.parse(sessionData);

    // Check if token is expired (with 10 second buffer)
    const payload = parseJwtPayload(session.accessToken);
    const exp = payload.exp as number;
    const isExpired = Date.now() > exp * 1000 - 10000;

    if (isExpired) {
      try {
        const refreshed =
          await this.workos.userManagement.authenticateWithRefreshToken({
            refreshToken: session.refreshToken,
          });

        const newSession: StoredSession = {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          user: toUser(refreshed.user),
        };
        await SecureStore.setItemAsync(
          this.sessionKey,
          JSON.stringify(newSession),
        );
        return newSession.user;
      } catch {
        // Refresh failed - clear session and return null
        await this.clearSession();
        return null;
      }
    }

    return session.user;
  }
}
