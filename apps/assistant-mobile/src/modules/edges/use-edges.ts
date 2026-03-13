import { useMutation } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';
import { Id } from 'assistant-convex/convex/_generated/dataModel';
import { useConvex } from 'convex/react';

export function useCreateEdge() {
  const convex = useConvex();
  return useMutation({
    mutationFn: (args: {
      fromNodeId: Id<'nodes'>;
      toNodeId: Id<'nodes'>;
      edgeType?: 'explicit' | 'suggested' | 'reference' | 'related';
    }) => convex.mutation(api.edges.createEdge, args),
  });
}
