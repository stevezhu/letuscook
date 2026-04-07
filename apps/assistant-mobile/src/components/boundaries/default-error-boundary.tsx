import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { DefaultErrorFallback } from '#components/boundaries/default-error-fallback.tsx';

export type DefaultErrorBoundaryProps = {
  children: ReactNode;
  onGoBack?: () => void;
};

export function DefaultErrorBoundary({
  children,
  onGoBack,
}: DefaultErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={(props) => (
        <DefaultErrorFallback {...props} onGoBack={onGoBack} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
