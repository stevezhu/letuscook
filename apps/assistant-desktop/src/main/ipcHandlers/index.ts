import { IpcListener } from '@electron-toolkit/typed-ipc';

import type { IpcEvents } from '#preload/IpcEvents.ts';

import { setupExampleHandlers } from './exampleHandlers.ts';

export function setupIpcHandlers() {
  const ipcListener = new IpcListener<IpcEvents>();

  ipcListener.handle('ping', () => {
    console.log('pong');
  });

  setupExampleHandlers(ipcListener);
}
