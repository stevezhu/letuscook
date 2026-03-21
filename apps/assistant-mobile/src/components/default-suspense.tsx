import { ReactNode, Suspense } from 'react';

import { DefaultActivityView } from '#components/default-activity-view.tsx';

export type DefaultSuspenseProps = {
  children: ReactNode;
};

export function DefaultSuspense({ children }: DefaultSuspenseProps) {
  return <Suspense fallback={<DefaultActivityView />}>{children}</Suspense>;
}
