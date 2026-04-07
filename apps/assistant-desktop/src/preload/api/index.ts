import { IpcEmitter } from '@electron-toolkit/typed-ipc/renderer';
import type { ApiClient } from '@workspace/assistant-app/ApiClient';

import type { IpcEvents } from '#preload/IpcEvents.ts';

const emitter = new IpcEmitter<IpcEvents>();

export const api = {
  getVersions: () => {
    return {
      electron: process.versions['electron'],
      chrome: process.versions['chrome'],
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
