import {
  createQueryKeys,
  mergeQueryKeys,
} from '@lukemorales/query-key-factory';

const auth = createQueryKeys('auth', {
  user: ['user'],
});

export const queries = mergeQueryKeys(auth);
