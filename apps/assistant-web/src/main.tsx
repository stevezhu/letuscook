import './main.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import {
  ApiClientProvider,
  queryClient,
  router,
} from '@workspace/assistant-app';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { createAppApiClient, createHonoClient } from '#apiClient.js';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Failed to get root element');

const apiClient = createAppApiClient({ honoClient: createHonoClient() });

const root = createRoot(rootEl);
root.render(
  <StrictMode>
    <ApiClientProvider apiClient={apiClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ApiClientProvider>
  </StrictMode>,
);
