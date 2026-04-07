// Reference: https://github.com/workos/expo-authkit-example/blob/7a5f32adcd3efd6adb91d9e712c7ec277740e9c7/src/lib/auth.ts

/**
 * Core authentication module using WorkOS SDK with PKCE.
 *
 * This mirrors the electron-authkit-example's auth.ts pattern: - getSignInUrl()
 * generates PKCE-protected authorization URL - handleCallback() exchanges code
 * for tokens - getUser() returns current user (with auto-refresh) -
 * clearSession() clears stored credentials
 *
 * Note: Requires react-native-quick-crypto polyfill (see src/polyfills.ts)
 */
import { WorkOS } from '@workos-inc/node';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

import { User, toUser } from './user.ts';
import { parseJwtPayload } from './utils.ts';

// Environment variables (set in .env or app.config.js)
const PKCE_TTL_MS = 10 * 60 * 1000; // 10 minutes

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

type PkceState = {
  codeVerifier: string;
  expiresAt: number;
};

export class AuthKitClient {
  /**
   * Key for storing the session data in the secure store.
   */
  private sessionKey: string;
  /**
   * Key for storing the PKCE state in the secure store.
   */
  private pkceKey: string;
  /**
   * WorkOS client instance.
   */
  private workos: WorkOS;
  /**
   * In-flight refresh promise to prevent concurrent refresh token usage. WorkOS
   * refresh tokens are single-use, so parallel refreshes would fail.
   */
  private refreshPromise: Promise<StoredSession | null> | null = null;

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
      return typeof payload['sid'] === 'string' ? payload['sid'] : null;
    } catch {
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    const session = await this.ensureFreshSession();
    return session?.accessToken ?? null;
  }

  /**
   * Clear stored session and PKCE state.
   */
  async clearSession(): Promise<void> {
    await SecureStore.deleteItemAsync(this.sessionKey);
    await SecureStore.deleteItemAsync(this.pkceKey);
  }

  getRedirectUri({ path }: { path?: string } = {}): string {
    return AuthSession.makeRedirectUri({ isTripleSlashed: true, path });
  }

  /**
   * Generate sign-in URL with PKCE challenge. The WorkOS SDK handles PKCE
   * generation automatically via getAuthorizationUrlWithPKCE.
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
    const session = await this.ensureFreshSession();
    return session?.user ?? null;
  }

  /**
   * Read stored session and refresh the access token if expired. Uses a
   * concurrency guard so parallel callers share one refresh request (WorkOS
   * refresh tokens are single-use).
   */
  private async ensureFreshSession(): Promise<StoredSession | null> {
    const sessionData = await SecureStore.getItemAsync(this.sessionKey);
    if (!sessionData) return null;

    let session: StoredSession;
    try {
      session = JSON.parse(sessionData);
    } catch {
      return null;
    }

    const payload = parseJwtPayload(session.accessToken);
    const exp = payload['exp'] as number;
    const isExpired = Date.now() > exp * 1000 - 10_000;

    if (!isExpired) return session;

    // Deduplicate concurrent refresh attempts
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.refreshSession(session).finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async refreshSession(
    session: StoredSession,
  ): Promise<StoredSession | null> {
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
      return newSession;
    } catch {
      await this.clearSession();
      return null;
    }
  }
}
