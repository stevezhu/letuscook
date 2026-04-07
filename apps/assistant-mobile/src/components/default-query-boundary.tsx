import { type ReactNode, Suspense } from 'react';

import { DefaultActivityView } from '#components/default-activity-view.tsx';
import { QueryErrorBoundary } from '#components/query-error-boundary.tsx';

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
