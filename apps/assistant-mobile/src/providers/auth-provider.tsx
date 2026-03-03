import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  clearSession,
  getLogoutUrl,
  getSignInUrl,
  getUser,
  handleCallback,
  type WorkOSUser,
} from '#lib/auth.js';

interface AuthContextValue {
  user: WorkOSUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WorkOSUser | null>(null);
  const [loading, setLoading] = useState(true);

  const processCallback = useCallback(async (url: string) => {
    const parsed = Linking.parse(url);
    const code = parsed.queryParams?.code;
    if (typeof code !== 'string') return;

    try {
      const workosUser = await handleCallback(code);
      setUser(workosUser);
    } catch (error) {
      console.error('Auth callback failed:', error);
    }
  }, []);

  // Load stored session on mount
  useEffect(() => {
    getUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Handle deep link callbacks
  useEffect(() => {
    // Cold start
    void Linking.getInitialURL().then((url) => {
      if (url) void processCallback(url);
    });

    // Warm start
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void processCallback(url);
    });

    return () => subscription.remove();
  }, [processCallback]);

  const signIn = useCallback(async () => {
    try {
      const url = await getSignInUrl();
      const result = await WebBrowser.openAuthSessionAsync(
        url,
        Linking.createURL('callback'),
      );
      if (result.type === 'success' && result.url) {
        await processCallback(result.url);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  }, [processCallback]);

  const signOut = useCallback(async () => {
    try {
      const logoutUrl = await getLogoutUrl();
      await clearSession();
      setUser(null);
      if (logoutUrl) {
        await WebBrowser.openAuthSessionAsync(logoutUrl);
      }
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, []);

  return (
    <AuthContext value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
