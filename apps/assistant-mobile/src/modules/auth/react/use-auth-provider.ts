import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';

import { AuthKitClient } from '../expo/auth-kit-client.ts';
import { useAuthKitClient } from './auth-kit-client-context.ts';
import { queries } from './queries.ts';

export const authUserQueryOptions = (authClient: AuthKitClient) =>
  queryOptions({
    queryKey: queries.auth.user.queryKey,
    queryFn: () => authClient.getUser(),
    retry: false,
  });

export function useAuthProvider() {
  const queryClient = useQueryClient();
  const authClient = useAuthKitClient();

  const { data: user, isPending: isPendingUser } = useQuery(
    authUserQueryOptions(authClient),
  );

  const signInMutation = useMutation({
    mutationFn: async () => {
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
      const code = getParsedUrlAuthCode(parsed);
      if (!code) {
        throw new Error('No authorization code received');
      }

      console.debug('[Auth] Exchanging code for tokens...');
      const newUser = await authClient.handleCallback(code);
      console.debug('[Auth] Got user:', newUser.email);

      return newUser;
    },
    onSuccess: (newUser) => {
      queryClient.setQueryData(queries.auth.user.queryKey, newUser);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const sessionId = await authClient.getSessionId();
      if (!sessionId) {
        return false;
      }

      const returnTo = authClient.getRedirectUri();
      const logoutUrl = authClient.getLogoutUrl({ sessionId, returnTo });
      const { type } = await WebBrowser.openAuthSessionAsync(
        logoutUrl,
        returnTo,
      );
      if (type !== 'success') {
        return false;
      }
      await authClient.clearSession();
      return true;
    },
    onSuccess: (loggedOut) => {
      if (loggedOut) {
        queryClient.setQueryData(queries.auth.user.queryKey, null);
      }
    },
  });

  const handleAuthCallbackMutation = useMutation({
    mutationFn: async (url: string) => {
      const parsed = Linking.parse(url);
      if (parsed.path !== 'callback') return;

      const code = getParsedUrlAuthCode(parsed);
      if (!code) {
        throw new Error('No authorization code received');
      }

      const newUser = await authClient.handleCallback(code);
      return newUser;
    },
    onSuccess: (newUser) => {
      queryClient.setQueryData(queries.auth.user.queryKey, newUser);
    },
  });

  // Handle deep link callbacks (for cold start)
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      await handleAuthCallbackMutation.mutateAsync(url);
    };

    Linking.getInitialURL()
      .then((url) => {
        if (url) return handleUrl({ url });
        return;
      })
      .catch((error) => {
        console.error('Failed to get initial URL:', error);
      });

    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, []);

  return {
    user: user ?? null,
    isLoading:
      isPendingUser ||
      signInMutation.isPending ||
      signOutMutation.isPending ||
      handleAuthCallbackMutation.isPending,
    getAccessToken: () => authClient.getAccessToken(),
    signIn: () => signInMutation.mutateAsync(),
    signOut: () => signOutMutation.mutateAsync(),
  };
}

function getParsedUrlAuthCode(parsed: Linking.ParsedURL): string | undefined {
  // TODO: handle all auth errors
  // https://workos.com/docs/reference/authkit/authentication-errors
  const error = parsed.queryParams?.['error'];
  if (error) {
    const errorDesc = parsed.queryParams?.['error_description'];
    throw new Error('Auth error', {
      cause: {
        error,
        errorDesc,
      },
    });
  }

  const code = parsed.queryParams?.['code'];
  if (code !== undefined && typeof code !== 'string') {
    throw new Error('Invalid authorization code in callback');
  }

  return code;
}
