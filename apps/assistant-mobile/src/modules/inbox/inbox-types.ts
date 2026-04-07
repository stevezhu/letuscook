import type { Doc, Id } from 'assistant-convex/convex/_generated/dataModel';

export type CaptureState =
  | 'offline'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'needs_manual'
  | 'processed';

export const STALE_CAPTURE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function isStaleCapture(
  captureState: CaptureState,
  updatedAt: number,
): boolean {
  return (
    captureState === 'processing' &&
    Date.now() - updatedAt > STALE_CAPTURE_THRESHOLD_MS
  );
}

export type InboxItem = {
  id: string;
  rawContent: string;
  captureType: string;
  capturedAt: number;
  updatedAt: number;
  captureState: CaptureState;
  isStale: boolean;
  /**
   * Only present for server-backed captures
   */
  captureId?: Id<'captures'>;
  suggestion?: Doc<'suggestions'> | null;
  suggestor?: {
    displayName: string;
    userType: string;
    agentProvider?: string;
  } | null;
};

export type InboxSection = {
  title: string;
  data: InboxItem[];
};

const DAY_MS = 86_400_000;

export function groupByDate(items: InboxItem[]): InboxSection[] {
  const now = Date.now();
  const todayStart = now - (now % DAY_MS);
  const yesterdayStart = todayStart - DAY_MS;
  const weekStart = todayStart - 6 * DAY_MS;

  const today: InboxItem[] = [];
  const yesterday: InboxItem[] = [];
  const thisWeek: InboxItem[] = [];
  const older: InboxItem[] = [];

  for (const item of items) {
    if (item.capturedAt >= todayStart) {
      today.push(item);
    } else if (item.capturedAt >= yesterdayStart) {
      yesterday.push(item);
    } else if (item.capturedAt >= weekStart) {
      thisWeek.push(item);
    } else {
      older.push(item);
    }
  }

  const groups: [string, InboxItem[]][] = [
    ['Today', today],
    ['Yesterday', yesterday],
    ['This Week', thisWeek],
    ['Older', older],
  ];

  return groups
    .filter(([, items]) => items.length > 0)
    .map(([title, data]) => ({ title, data }));
}
