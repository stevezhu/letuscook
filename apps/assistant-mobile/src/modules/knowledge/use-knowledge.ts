import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';
import { Id } from 'assistant-convex/convex/_generated/dataModel';

export function useKnowledgeBasePages() {
  return useQuery(convexQuery(api.nodes.getKnowledgeBasePages, {}));
}

export function useArchived() {
  return useQuery(convexQuery(api.captures.getArchivedItems, {}));
}

export function useNodeDetails(nodeId: Id<'nodes'> | null) {
  return useQuery(
    convexQuery(api.nodes.getNodeWithEdges, nodeId ? { nodeId } : 'skip'),
  );
}

export function useNodeAutocomplete(query: string) {
  return useQuery(convexQuery(api.search.searchNodesForLinking, { query }));
}

export function useArchiveNode() {
  return useMutation({
    mutationFn: useConvexMutation(api.nodes.archiveNode),
  });
}

export function useUnarchiveNode() {
  return useMutation({
    mutationFn: useConvexMutation(api.nodes.unarchiveNode),
  });
}
