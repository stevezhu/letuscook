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
      fallbackRender={({ error, resetErrorBoundary }) => (
        <DefaultErrorFallback
          message={error instanceof Error ? error.message : String(error)}
          onGoBack={onGoBack}
          onRetry={resetErrorBoundary}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
