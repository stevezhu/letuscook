import { Button } from '@workspace/shadcn/components/button';
import { FileX } from 'lucide-react';

import { Fallback } from './Fallback.js';
import { FallbackIcon } from './FallbackIcon.js';

export type NotFoundFallbackProps = {
  title?: string;
  description?: string;
  onGoBack?: () => void;
  onGoHome?: () => void;
  hideGoBackButton?: boolean;
  hideGoHomeButton?: boolean;
};

export function NotFoundFallback({
  title = 'Page not found',
  description = "The page you're looking for doesn't exist or has been moved.",
  onGoBack,
  onGoHome,
  hideGoBackButton,
  hideGoHomeButton,
}: NotFoundFallbackProps) {
  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <Fallback
      title={title}
      description={description}
      icon={
        <FallbackIcon
          variant="default"
          icon={<FileX className="size-6 text-muted-foreground" />}
        />
      }
    >
      {(!hideGoBackButton || !hideGoHomeButton) && (
        <div className="flex flex-row flex-wrap justify-center gap-2">
          {!hideGoBackButton && (
            <Button variant="outline" onClick={handleGoBack}>
              Go back
            </Button>
          )}
          {!hideGoHomeButton && (
            <Button variant="default" onClick={handleGoHome}>
              Go home
            </Button>
          )}
        </div>
      )}
    </Fallback>
  );
}
