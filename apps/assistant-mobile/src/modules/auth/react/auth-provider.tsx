// Reference: https://github.com/workos/expo-authkit-example/blob/7a5f32adcd3efd6adb91d9e712c7ec277740e9c7/src/context/AuthContext.tsx

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

import { type User } from '../expo/user.ts';
import { useAuthKitClient } from './auth-kit-client-context.ts';

// Ensure auth sessions complete properly on web
WebBrowser.maybeCompleteAuthSession();

/**
 * NOTE: make compatible with `ContextValue` from
 * [@workos-inc/authkit-react](https://github.com/workos/authkit-react).
 */
export type AuthContextType = {
  isLoading: boolean;
  user: User | null;
  getAccessToken: () => Promise<string | null>;

  signIn: () => Promise<User>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const authClient = useAuthKitClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored session on mount
  useEffect(() => {
    authClient
      .getUser()
      .then(setUser)
      .catch((error) => {
        console.error('Failed to load stored session:', error);
      })
      .finally(() => setIsLoading(false));
  }, [authClient]);

  // Handle deep link callbacks (for cold start)
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      const parsed = Linking.parse(url);
      if (parsed.path !== 'callback') return;

      const error = parsed.queryParams?.['error'] as string | undefined;
      if (error) {
        console.error(
          'OAuth error:',
          error,
          parsed.queryParams?.['error_description'],
        );
        return;
      }

      const code = parsed.queryParams?.['code'] as string | undefined;
      if (!code) {
        console.error('No authorization code in callback');
        return;
      }

      setIsLoading(true);
      try {
        const newUser = await authClient.handleCallback(code);
        setUser(newUser);
      } catch (err) {
        console.error('Auth callback failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL()
      .then((url) => {
        if (url) return handleUrl({ url });
        return;
      })
      .catch((error) => {
        console.error('Failed to get initial URL:', error);
      });

    return () => subscription.remove();
  }, [authClient]);

  const signIn = useCallback(async (): Promise<User> => {
    try {
      console.debug('[Auth] Starting sign in...');
      setIsLoading(true);
      const redirectUri = authClient.getRedirectUri({ path: 'callback' });
      console.debug('[Auth] Redirect URI:', redirectUri);
      const url = await authClient.getSignInUrl({ redirectUri });
      console.debug('[Auth] Got sign in URL');

      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
      console.debug('[Auth] WebBrowser result:', result.type);

      if (result.type !== 'success' || !result.url) {
        throw new Error('Authentication was cancelled');
      }

      const parsed = Linking.parse(result.url);

      const error = parsed.queryParams?.['error'] as string | undefined;
      if (error) {
        const errorDesc = parsed.queryParams?.['error_description'] as string;
        throw new Error('Auth error', {
          cause: {
            error,
            errorDesc,
          },
        });
      }

      const code = parsed.queryParams?.['code'] as string | undefined;
      if (!code) {
        throw new Error('No authorization code received');
      }

      console.debug('[Auth] Exchanging code for tokens...');
      const newUser = await authClient.handleCallback(code);
      console.debug('[Auth] Got user:', newUser.email);
      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error('[Auth] Sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authClient]);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      const sessionId = await authClient.getSessionId();
      if (sessionId) {
        const returnTo = authClient.getRedirectUri();
        console.debug('[Auth] Return to:', returnTo);

        const logoutUrl = authClient.getLogoutUrl({ sessionId, returnTo });
        console.debug('[Auth] Logout URL:', logoutUrl);
        await WebBrowser.openAuthSessionAsync(logoutUrl, returnTo);

        await authClient.clearSession();
        setUser(null);
      }
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }, [authClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        getAccessToken: () => authClient.getAccessToken(),
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
