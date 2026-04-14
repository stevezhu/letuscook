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
import { useTanstackQueryAuthProvider } from './use-auth-provider.ts';

// Ensure auth sessions complete properly on web
WebBrowser.maybeCompleteAuthSession();

/**
 * NOTE: make compatible with `ContextValue` from
 * [@workos-inc/authkit-react](https://github.com/workos/authkit-react).
 */
export type AuthContextValue = {
  isLoading: boolean;
  user: User | null;
  getAccessToken: () => Promise<string | null>;

  // signIn: () => Promise<{ success: boolean; error?: string }>;
  // signOut: () => Promise<{ success: boolean; error?: string }>;
  signIn: () => Promise<User>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const value = useTanstackQueryAuthProvider();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
