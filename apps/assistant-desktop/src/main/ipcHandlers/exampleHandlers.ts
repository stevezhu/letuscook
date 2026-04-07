import { IpcListener } from '@electron-toolkit/typed-ipc';
import type { AppType } from 'assistant-server/types';
import { hc } from 'hono/client';

import type { IpcEvents } from '#preload/IpcEvents.ts';

export function setupExampleHandlers(
  ipcListener: IpcListener<IpcEvents>,
): void {
  const honoClient = hc<AppType>(import.meta.env.MAIN_VITE_API_BASE_URL).api;

  ipcListener.handle('example:test', async () => {
    const response = await honoClient.example.test.$get();
    return response.json();
  });
}
