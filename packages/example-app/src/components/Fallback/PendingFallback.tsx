import { Loader2 } from 'lucide-react';

import { Fallback } from './Fallback.js';
import { FallbackIcon } from './FallbackIcon.js';

export type PendingFallbackProps = {
  title?: string;
  description?: string;
};

export function PendingFallback({
  title = 'Loading...',
  description = 'Please wait while we prepare your content.',
}: PendingFallbackProps) {
  return (
    <Fallback
      title={title}
      description={description}
      icon={
        <FallbackIcon
          variant="primary"
          icon={<Loader2 className="h-6 w-6 animate-spin text-primary" />}
        />
      }
    />
  );
}
