import '#main.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Failed to get root element');

createRoot(rootEl).render(
  <StrictMode>
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <h1 className="text-2xl font-bold text-blue-600">
        Hello, Example Extension!
      </h1>
    </div>
  </StrictMode>,
);
