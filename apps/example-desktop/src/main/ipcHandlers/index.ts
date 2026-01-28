import { IpcListener } from '@electron-toolkit/typed-ipc';

import type { IpcEvents } from '#preload/IpcEvents.js';

import { setupExampleHandlers } from './exampleHandlers.js';

export function setupIpcHandlers() {
  const ipcListener = new IpcListener<IpcEvents>();

  ipcListener.handle('ping', () => {
    console.log('pong');
  });

  setupExampleHandlers(ipcListener);
}
