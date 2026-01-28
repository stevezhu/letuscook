import './main.css';

import { ApiClientProvider, queryClient, router } from '@example/app';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Versions } from '#renderer/components/Versions.js';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Failed to get root element');

const root = createRoot(rootEl);
root.render(
  <StrictMode>
    <ApiClientProvider apiClient={window.apiClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Versions />
      </QueryClientProvider>
    </ApiClientProvider>
  </StrictMode>,
);
