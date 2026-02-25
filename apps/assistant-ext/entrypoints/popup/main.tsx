import '#main.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '#App.js';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Failed to get root element');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
