import { type ReactNode, Suspense } from 'react';

import { DefaultActivityView } from '#components/boundaries/default-activity-view.tsx';
import { QueryErrorBoundary } from '#components/boundaries/query-error-boundary.tsx';

export type DefaultQueryBoundaryProps = {
  children: ReactNode;
  onGoBack?: () => void;
};

export function DefaultQueryBoundary({
  children,
  onGoBack,
}: DefaultQueryBoundaryProps) {
  return (
    <QueryErrorBoundary onGoBack={onGoBack}>
      <Suspense fallback={<DefaultActivityView />}>{children}</Suspense>
    </QueryErrorBoundary>
  );
}
