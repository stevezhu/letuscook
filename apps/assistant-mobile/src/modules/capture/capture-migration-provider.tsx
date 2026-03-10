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

function MigrationWatcher({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isAuthenticated } = useConvexAuth();
  const { captures } = useGuestCaptureStore();
  const migration = useMigrateGuestCaptures();
  const prevUserRef = useRef<typeof user>(user);

  useEffect(() => {
    const prevUser = prevUserRef.current;
    prevUserRef.current = user;

    // Trigger migration on sign-in transition (null → non-null)
    if (prevUser === null && user !== null && isAuthenticated) {
      if (captures.length > 0) {
        // Strip captureState before sending to Convex
        const guestCaptures = captures.map(({ captureState: _, ...c }) => c);
        migration.mutate(guestCaptures);
      }
    }
  }, [user, isAuthenticated, captures, migration]);

  return (
    <>
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

export function CaptureMigrationProvider({
  children,
}: CaptureMigrationProviderProps) {
  return (
    <Suspense fallback={children}>
      <MigrationWatcher>{children}</MigrationWatcher>
    </Suspense>
  );
}
