import { productName } from '@workspace/constants';
import { Button } from '@workspace/shadcn/components/button';
import { useState } from 'react';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      <h1 className="text-5xl font-bold">{productName}</h1>
      <p className="text-muted-foreground">
        Edit{' '}
        <code className="rounded-sm bg-muted px-2 py-1 text-sm">
          apps/assistant-ext/entrypoints/popup/main.tsx
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
    </div>
  );
}
