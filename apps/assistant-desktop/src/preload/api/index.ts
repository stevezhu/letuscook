import { IpcEmitter } from '@electron-toolkit/typed-ipc/renderer';
import type { ApiClient } from '@assistant/app';

import { IpcEvents } from '#preload/IpcEvents.js';

const emitter = new IpcEmitter<IpcEvents>();

export const api = {
  getVersions: () => {
    return {
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
    };
  },
  ping: async () => {
    return emitter.invoke('ping');
  },
};

export type Api = typeof api;

export const apiClient: ApiClient = {
  example: {
    test: async () => {
      return emitter.invoke('example:test');
    },
  },
};
