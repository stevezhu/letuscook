import { useConvexMutation } from '@convex-dev/react-query';
import { useMutation } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';

export function useCreateEdge() {
  return useMutation({
    mutationFn: useConvexMutation(api.edges.createEdge),
  });
}
