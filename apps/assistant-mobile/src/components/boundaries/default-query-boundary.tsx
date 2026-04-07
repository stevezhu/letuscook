import { type ReactNode, Suspense } from 'react';

import { DefaultActivityView } from '#components/boundaries/default-activity-view.tsx';
import { DefaultErrorBoundary } from '#components/boundaries/default-error-boundary.tsx';

export type DefaultQueryBoundaryProps = {
  children: ReactNode;
  onGoBack?: () => void;
};

export function DefaultQueryBoundary({
  children,
  onGoBack,
}: DefaultQueryBoundaryProps) {
  return (
    <DefaultErrorBoundary onGoBack={onGoBack}>
      <Suspense fallback={<DefaultActivityView />}>{children}</Suspense>
    </DefaultErrorBoundary>
  );
}
