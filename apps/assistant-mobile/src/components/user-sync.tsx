import { api } from '@workspace/assistant-convex/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useEffect, useRef } from 'react';

import { useAuth } from '#providers/auth-provider.js';

export function UserSync() {
  const { user } = useAuth();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const lastSyncedId = useRef<string | null>(null);

  useEffect(() => {
    if (!user || user.id === lastSyncedId.current) return;

    lastSyncedId.current = user.id;
    createOrUpdateUser({
      workosUserId: user.id,
      displayName:
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
      email: user.email,
    }).catch((error) => {
      console.error('Failed to sync user to Convex:', error);
      lastSyncedId.current = null;
    });
  }, [user, createOrUpdateUser]);

  return null;
}
