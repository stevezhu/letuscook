import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';
import { Id } from 'assistant-convex/convex/_generated/dataModel';

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
  return useMutation({
    mutationFn: useConvexMutation(api.captures.createCapture),
  });
}

export function useUpdateCapture() {
  return useMutation({
    mutationFn: useConvexMutation(api.captures.updateCapture),
  });
}

export function useAcceptSuggestion() {
  return useMutation({
    mutationFn: useConvexMutation(api.captures.acceptSuggestion),
  });
}

export function useRejectSuggestion() {
  return useMutation({
    mutationFn: useConvexMutation(api.captures.rejectSuggestion),
  });
}

export function useOrganizeCapture() {
  return useMutation({
    mutationFn: useConvexMutation(api.captures.organizeCapture),
  });
}

export function useArchiveCapture() {
  return useMutation({
    mutationFn: useConvexMutation(api.captures.archiveCapture),
  });
}

export function useUnarchiveCapture() {
  return useMutation({
    mutationFn: useConvexMutation(api.captures.unarchiveCapture),
  });
}
