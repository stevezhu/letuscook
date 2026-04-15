import {
  createQueryKeys,
  mergeQueryKeys,
} from '@lukemorales/query-key-factory';

const auth = createQueryKeys('auth', {
  user: null,
});

export const queries = mergeQueryKeys(auth);
