import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';

import { useAuthKitClient } from './auth-kit-client-context.ts';
import { queries } from './queries.ts';

export function useTanstackQueryAuthProvider() {
  const queryClient = useQueryClient();
  const authClient = useAuthKitClient();

  const { data: user, isPending: isPendingUser } = useQuery({
    queryKey: queries.auth.user.queryKey,
    queryFn: () => authClient.getUser(),
    initialData: null,
    staleTime: Infinity,
    retry: false,
  });

  const signInMutation = useMutation({
    mutationFn: async () => {
      const redirectUri = authClient.getRedirectUri({ path: 'callback' });
      console.log('[Auth] Redirect URI:', redirectUri);
      const url = await authClient.getSignInUrl({ redirectUri });
      console.log('[Auth] Got sign in URL');

      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
      console.log('[Auth] WebBrowser result:', result.type);

      if (result.type !== 'success' || !result.url) {
        throw new Error('Authentication was cancelled');
      }

      const parsed = Linking.parse(result.url);
      const code = getParsedUrlAuthCode(parsed);
      if (!code) {
        throw new Error('No authorization code received');
      }

      console.log('[Auth] Exchanging code for tokens...');
      const newUser = await authClient.handleCallback(code);
      console.log('[Auth] Got user:', newUser.email);

      return newUser;
    },
    onSuccess: (newUser) => {
      queryClient.setQueryData(queries.auth.user.queryKey, newUser);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const sessionId = await authClient.getSessionId();
      console.log('sign out mutation', sessionId);
      if (sessionId) {
        const returnTo = authClient.getRedirectUri();
        const logoutUrl = authClient.getLogoutUrl({ sessionId, returnTo });
        await WebBrowser.openAuthSessionAsync(logoutUrl, returnTo);
        await authClient.clearSession();
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(queries.auth.user.queryKey, null);
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
    console.log('handle auth callback');

    const handleUrl = async ({ url }: { url: string }) => {
      console.log('handle url', url);
      await handleAuthCallbackMutation.mutateAsync(url);
    };

    Linking.getInitialURL()
      .then((url) => {
        console.log('get initial url', url);
        if (url) return handleUrl({ url });
        return;
      })
      .catch((error) => {
        console.error('Failed to get initial URL:', error);
      });

    const subscription = Linking.addEventListener('url', handleUrl);
    return () => subscription.remove();
  }, []);

  return {
    user,
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
