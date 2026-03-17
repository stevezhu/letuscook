import { Text } from '@workspace/rn-reusables/components/text';
import { useConvexAuth } from 'convex/react';
import React, { type ReactNode, Suspense, useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '#modules/auth/auth-context.tsx';

import { useGuestCaptureStore } from './use-guest-capture-store.ts';
import { useMigrateGuestCaptures } from './use-migrate-guest-captures.ts';

export type CaptureMigrationProviderProps = {
  children: ReactNode;
};

// TODO: test this component

/**
 * Watches for a user to transition from unauthenticated to authenticated,
 * and triggers a one-time migration of any offline captures to Convex.
 */
function MigrationWatcher({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const { captures } = useGuestCaptureStore();
  const migration = useMigrateGuestCaptures();

  // Track whether we've attempted migration in the current user session
  // This prevents multiple migration requests on a cold start or fast re-renders
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    // Reset attempted flag when user logs out
    if (user === null) {
      hasAttemptedRef.current = false;
      return;
    }

    // Trigger migration if we have a valid user, captures to migrate,
    // and we haven't already attempted it since the user became non-null.
    if (
      user !== null &&
      isAuthenticated &&
      captures.length > 0 &&
      !hasAttemptedRef.current
    ) {
      hasAttemptedRef.current = true;

      // Strip `captureState: 'offline'` before sending to Convex
      // since the Convex schema expects standard objects.
      const guestCaptures = captures.map(({ captureState: _, ...c }) => c);
      migration.mutate({ captures: guestCaptures });
    }
  }, [user, isAuthenticated, captures, migration]);

  return (
    <>
      {/* Show a non-blocking banner at the top while migrating */}
      {migration.isPending && (
        <View className="absolute top-safe left-0 right-0 z-50 flex-row items-center justify-center gap-2 bg-muted px-4 py-2">
          <ActivityIndicator size="small" />
          <Text className="text-muted-foreground text-sm">
            Syncing {captures.length} captures…
          </Text>
        </View>
      )}
      {children}
    </>
  );
}

/**
 * A provider that wraps the application to enable automatic capture migrations.
 *
 * It uses a `Suspense` boundary with `fallback={children}` to prevent
 * the application from showing a blank screen or blocking rendering while the
 * `useGuestCaptureStore` initially loads data from AsyncStorage.
 */
export function CaptureMigrationProvider({
  children,
}: CaptureMigrationProviderProps) {
  return (
    <Suspense fallback={children}>
      <MigrationWatcher>{children}</MigrationWatcher>
    </Suspense>
  );
}
