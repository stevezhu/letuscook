import { Button } from '@workspace/shadcn/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/shadcn/components/card';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import { Fallback } from './Fallback.js';
import { FallbackIcon } from './FallbackIcon.js';

export type ErrorFallbackProps = {
  error: Error;
  onReset?: () => void;
  title?: string;
  description?: string;
};

export function ErrorFallback({
  error,
  onReset,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. We apologize for the inconvenience.',
}: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Fallback
      title={title}
      description={description}
      icon={
        <FallbackIcon
          variant="destructive"
          icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
        />
      }
    >
      <div className="flex flex-row flex-wrap justify-center gap-2">
        <Button onClick={onReset}>Try again</Button>
        <Button
          onClick={() => {
            window.location.reload();
          }}
          variant="outline"
        >
          Reload page
        </Button>
      </div>

      <div className="space-y-2">
        <Button
          onClick={() => {
            setShowDetails(!showDetails);
          }}
          variant="ghost"
          size="sm"
          className={`
            text-xs font-normal text-muted-foreground
            hover:text-foreground
          `}
        >
          {showDetails ? 'Hide' : 'Show'} error details
        </Button>

        {showDetails && (
          <Card className="gap-1 p-4 text-left">
            <CardHeader className="px-0">
              <CardTitle
                className={`
                  text-xs font-medium tracking-wide text-muted-foreground
                  uppercase
                `}
              >
                Error Details
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="rounded-sm bg-muted p-3">
                <pre
                  className={`
                    text-xs break-words whitespace-pre-wrap text-foreground
                  `}
                >
                  {error instanceof Error ? error.message : String(error)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Fallback>
  );
}
