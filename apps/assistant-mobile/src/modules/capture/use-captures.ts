import { convexQuery } from '@convex-dev/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';
import { Id } from 'assistant-convex/convex/_generated/dataModel';
import { useConvex } from 'convex/react';

export function useInboxCaptures() {
  return useQuery(convexQuery(api.captures.getInboxCaptures, {}));
}

export function useRecentCaptures(limit?: number) {
  return useQuery(
    convexQuery(api.captures.getRecentCaptures, {
      limit: limit ?? undefined,
    }),
  );
}

export function useCaptureDetails(captureId: Id<'captures'> | null) {
  return useQuery(
    convexQuery(api.captures.getCapture, captureId ? { captureId } : 'skip'),
  );
}

export function useSuggestion(captureId: Id<'captures'> | null) {
  return useQuery(
    convexQuery(
      api.suggestions.getSuggestion,
      captureId ? { captureId } : 'skip',
    ),
  );
}

export function useCreateCapture() {
  const convex = useConvex();
  return useMutation({
    mutationFn: (args: {
      rawContent: string;
      captureType: 'text' | 'link' | 'task';
    }) => convex.mutation(api.captures.createCapture, args),
  });
}

export function useUpdateCapture() {
  const convex = useConvex();
  return useMutation({
    mutationFn: (args: {
      captureId: Id<'captures'>;
      rawContent?: string;
      captureType?: 'text' | 'link' | 'task';
    }) => convex.mutation(api.captures.updateCapture, args),
  });
}

export function useAcceptSuggestion() {
  const convex = useConvex();
  return useMutation({
    mutationFn: (args: {
      captureId: Id<'captures'>;
      suggestionId: Id<'suggestions'>;
    }) => convex.mutation(api.captures.acceptSuggestion, args),
  });
}

export function useRejectSuggestion() {
  const convex = useConvex();
  return useMutation({
    mutationFn: (args: {
      captureId: Id<'captures'>;
      suggestionId: Id<'suggestions'>;
    }) => convex.mutation(api.captures.rejectSuggestion, args),
  });
}

export function useOrganizeCapture() {
  const convex = useConvex();
  return useMutation({
    mutationFn: (args: { captureId: Id<'captures'>; nodeTitle: string }) =>
      convex.mutation(api.captures.organizeCapture, args),
  });
}

export function useArchiveCapture() {
  const convex = useConvex();
  return useMutation({
    mutationFn: (args: { captureId: Id<'captures'> }) =>
      convex.mutation(api.captures.archiveCapture, args),
  });
}

export function useUnarchiveCapture() {
  const convex = useConvex();
  return useMutation({
    mutationFn: (args: { captureId: Id<'captures'> }) =>
      convex.mutation(api.captures.unarchiveCapture, args),
  });
}
