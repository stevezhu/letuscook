import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { productName } from '@workspace/constants';
import { Button } from '@workspace/shadcn/components/button';
import { useState } from 'react';

import { useApiClient } from '#api/useApiClient.js';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const apiClient = useApiClient();
  const { data } = useSuspenseQuery({
    queryKey: ['example', 'test'],
    queryFn: () => apiClient.example.test(),
  });
  const [count, setCount] = useState(0);
  return (
    <div className={`flex h-full flex-col items-center justify-center gap-6`}>
      <h1 className="text-5xl font-bold">{productName}</h1>
      <p className="text-muted-foreground">
        Edit{' '}
        <code className="rounded-sm bg-muted px-2 py-1 text-sm">
          packages/assistant-app/src/routes/index.tsx
        </code>{' '}
        and save to test HMR
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => {
            setCount((c) => c + 1);
          }}
        >
          count is {count}
        </Button>
      </div>
      Message from server: <div>{data.message}</div>
    </div>
  );
}
