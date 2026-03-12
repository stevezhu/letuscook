import { convexQuery } from '@convex-dev/react-query';
import { useQuery } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';

export function useSearchResults(query: string) {
  return useQuery(convexQuery(api.search.searchGlobal, { query }));
}
