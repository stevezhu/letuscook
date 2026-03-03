import { WorkOS } from '@workos-inc/node';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';

const CLIENT_ID = process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID!;

function getRedirectUri() {
  return Linking.createURL('callback');
}

let _workos: WorkOS;
function getWorkOS() {
  _workos ??= new WorkOS(undefined, { clientId: CLIENT_ID });
  return _workos;
}

const KEYS = {
  accessToken: 'workos_access_token',
  refreshToken: 'workos_refresh_token',
  user: 'workos_user',
  codeVerifier: 'workos_code_verifier',
  sessionId: 'workos_session_id',
} as const;

export async function getSignInUrl(): Promise<string> {
  const { authorizationUrl, codeVerifier } =
    await getWorkOS().userManagement.getAuthorizationUrlWithPKCE({
      provider: 'authkit',
      redirectUri: getRedirectUri(),
      clientId: CLIENT_ID,
    });

  await SecureStore.setItemAsync(KEYS.codeVerifier, codeVerifier);
  return authorizationUrl;
}

export async function handleCallback(code: string) {
  const codeVerifier = await SecureStore.getItemAsync(KEYS.codeVerifier);
  if (!codeVerifier) {
    throw new Error('Missing PKCE code verifier');
  }

  const result = await getWorkOS().userManagement.authenticateWithCode({
    code,
    codeVerifier,
    clientId: CLIENT_ID,
  });

  await SecureStore.setItemAsync(KEYS.accessToken, result.accessToken);
  await SecureStore.setItemAsync(KEYS.refreshToken, result.refreshToken);
  await SecureStore.setItemAsync(KEYS.user, JSON.stringify(result.user));
  if (result.authenticationResponse?.sessionId) {
    await SecureStore.setItemAsync(
      KEYS.sessionId,
      result.authenticationResponse.sessionId,
    );
  }
  await SecureStore.deleteItemAsync(KEYS.codeVerifier);

  return result.user;
}

export async function getUser() {
  const userJson = await SecureStore.getItemAsync(KEYS.user);
  if (!userJson) return null;

  try {
    const accessToken = await SecureStore.getItemAsync(KEYS.accessToken);
    if (!accessToken) return null;

    // Check if token is expired by decoding JWT payload
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();

    if (isExpired) {
      const refreshed = await refreshSession();
      if (!refreshed) return null;
    }

    return JSON.parse(
      (await SecureStore.getItemAsync(KEYS.user)) ?? 'null',
    ) as WorkOSUser;
  } catch {
    return null;
  }
}

async function refreshSession(): Promise<boolean> {
  try {
    const refreshToken = await SecureStore.getItemAsync(KEYS.refreshToken);
    if (!refreshToken) return false;

    const result =
      await getWorkOS().userManagement.authenticateWithRefreshToken({
        refreshToken,
        clientId: CLIENT_ID,
      });

    await SecureStore.setItemAsync(KEYS.accessToken, result.accessToken);
    await SecureStore.setItemAsync(KEYS.refreshToken, result.refreshToken);
    if (result.user) {
      await SecureStore.setItemAsync(KEYS.user, JSON.stringify(result.user));
    }
    return true;
  } catch {
    await clearSession();
    return false;
  }
}

export async function getAccessToken(options?: {
  forceRefresh?: boolean;
}): Promise<string | null> {
  if (options?.forceRefresh) {
    const refreshed = await refreshSession();
    if (!refreshed) return null;
  }

  const accessToken = await SecureStore.getItemAsync(KEYS.accessToken);
  if (!accessToken) return null;

  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    if (isExpired) {
      const refreshed = await refreshSession();
      if (!refreshed) return null;
      return SecureStore.getItemAsync(KEYS.accessToken);
    }
    return accessToken;
  } catch {
    return null;
  }
}

export async function getLogoutUrl(): Promise<string | null> {
  const sessionId = await SecureStore.getItemAsync(KEYS.sessionId);
  if (!sessionId) return null;
  return getWorkOS().userManagement.getLogoutUrl({ sessionId });
}

export async function clearSession() {
  await Promise.all(
    Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key)),
  );
}

export interface WorkOSUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
}
