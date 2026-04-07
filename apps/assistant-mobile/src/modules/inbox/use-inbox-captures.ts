import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';

import { useAuth } from '#modules/auth/react/auth-provider.tsx';
import { useGuestCaptureStore } from '#modules/capture/use-guest-capture-store.ts';

import type { InboxItem, InboxSection } from './inbox-types.ts';
import { groupByDate, isStaleCapture } from './inbox-types.ts';

export function useInboxCaptures(): {
  sections: InboxSection[];
  items: InboxItem[];
  isLoading: boolean;
} {
  const { user } = useAuth();
  const { captures: guestCaptures } = useGuestCaptureStore();

  const { data: serverData, isLoading } = useQuery({
    ...convexQuery(api.captures.getInboxCaptures, user ? {} : 'skip'),
    enabled: !!user,
  });

  const serverItems: InboxItem[] = (serverData ?? []).map((entry) => ({
    id: entry.capture._id,
    rawContent: entry.capture.rawContent,
    captureType: entry.capture.captureType,
    capturedAt: entry.capture.capturedAt,
    updatedAt: entry.capture.updatedAt,
    captureState: entry.capture.captureState,
    isStale: isStaleCapture(
      entry.capture.captureState,
      entry.capture.updatedAt,
    ),
    captureId: entry.capture._id,
    suggestion: entry.suggestion,
    suggestor: entry.suggestor,
  }));

  const guestItems: InboxItem[] = guestCaptures.map((c) => ({
    id: c.id,
    rawContent: c.rawContent,
    captureType: c.captureType,
    capturedAt: c.capturedAt,
    updatedAt: c.capturedAt,
    captureState: 'offline' as const,
    isStale: false,
  }));

  const allItems = [...serverItems, ...guestItems].sort(
    (a, b) => b.capturedAt - a.capturedAt,
  );

  return {
    sections: groupByDate(allItems),
    items: allItems,
    isLoading: !!user && isLoading,
  };
}
