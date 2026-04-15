import { type ConvexProviderWithAuthKit } from '@convex-dev/workos';
import { type ComponentProps } from 'react';
import { test, expectTypeOf } from 'vitest';

import { type AuthContextType } from './auth-provider.tsx';

type UseAuth = ComponentProps<typeof ConvexProviderWithAuthKit>['useAuth'];

// oxlint-disable-next-line vitest-eslint/prefer-lowercase-title
test('`AuthContextType` extends Convex WorkOS AuthKit `UseAuth` return type', () => {
  expectTypeOf<AuthContextType>().toExtend<ReturnType<UseAuth>>();
});
