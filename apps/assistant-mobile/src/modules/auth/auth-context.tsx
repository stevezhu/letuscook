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

import { type User, ExpoAuthClient } from './auth.ts';

// Ensure auth sessions complete properly on web
WebBrowser.maybeCompleteAuthSession();

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export type AuthProviderProps = {
  children: ReactNode;
};

export function createAuthProvider({
  authClient,
}: {
  authClient: ExpoAuthClient;
}) {
  return function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Load stored session on mount
    useEffect(() => {
      authClient
        .getUser()
        .then(setUser)
        .catch((error) => {
          console.error('Failed to load stored session:', error);
        })
        .finally(() => setLoading(false));
    }, []);

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

        setLoading(true);
        try {
          const newUser = await authClient.handleCallback(code);
          setUser(newUser);
        } catch (err) {
          console.error('Auth callback failed:', err);
        } finally {
          setLoading(false);
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
    }, []);

    const signIn = useCallback(async (): Promise<{
      success: boolean;
      error?: string;
    }> => {
      try {
        console.log('[Auth] Starting sign in...');
        setLoading(true);
        const redirectUri = authClient.getRedirectUri();
        console.log('[Auth] Redirect URI:', redirectUri);
        const url = await authClient.getSignInUrl({ redirectUri });
        console.log('[Auth] Got sign in URL');

        const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
        console.log('[Auth] WebBrowser result:', result.type);

        if (result.type !== 'success' || !result.url) {
          return { success: false, error: 'Authentication was cancelled' };
        }

        const parsed = Linking.parse(result.url);

        const error = parsed.queryParams?.['error'] as string | undefined;
        if (error) {
          const errorDesc = parsed.queryParams?.['error_description'] as string;
          return { success: false, error: errorDesc || error };
        }

        const code = parsed.queryParams?.['code'] as string | undefined;
        if (!code) {
          return { success: false, error: 'No authorization code received' };
        }

        console.log('[Auth] Exchanging code for tokens...');
        const newUser = await authClient.handleCallback(code);
        console.log('[Auth] Got user:', newUser.email);
        setUser(newUser);
        return { success: true };
      } catch (error) {
        console.error('[Auth] Sign in failed:', error);
        return { success: false, error: String(error) };
      } finally {
        setLoading(false);
      }
    }, []);

    const signOut = useCallback(async (): Promise<{
      success: boolean;
      error?: string;
    }> => {
      try {
        const sessionId = await authClient.getSessionId();
        if (sessionId) {
          const returnTo = authClient.getRedirectUri();
          console.log('[Auth] Return to:', returnTo);

          const logoutUrl = authClient.getLogoutUrl({ sessionId, returnTo });
          console.log('[Auth] Logout URL:', logoutUrl);
          await WebBrowser.openAuthSessionAsync(logoutUrl, returnTo);

          await authClient.clearSession();
          setUser(null);
        }

        return { success: true };
      } catch (error) {
        console.error('Sign out failed:', error);
        return { success: false, error: String(error) };
      }
    }, []);

    return (
      <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
        {children}
      </AuthContext.Provider>
    );
  };
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
