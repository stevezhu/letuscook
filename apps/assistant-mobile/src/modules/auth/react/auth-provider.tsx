// Reference: https://github.com/workos/expo-authkit-example/blob/7a5f32adcd3efd6adb91d9e712c7ec277740e9c7/src/context/AuthContext.tsx

import { useSuspenseQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, type ReactNode } from 'react';

import { type User } from '../expo/user.ts';
import { useAuthKitClient } from './auth-kit-client-context.ts';
import { authUserQueryOptions, useAuthProvider } from './use-auth-provider.ts';

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
  signOut: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const value = useAuthProvider();

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useSuspenseAuth() {
  const authClient = useAuthKitClient();
  const { signIn, signOut, getAccessToken } = useAuth();
  const { data: user } = useSuspenseQuery(authUserQueryOptions(authClient));
  return {
    user,
    getAccessToken,
    signIn,
    signOut,
  };
}
