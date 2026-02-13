import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge } from 'electron';

import { api, apiClient } from '#preload/api/index.js';

if (!process.contextIsolated) {
  throw new Error('Context isolation is required');
}

try {
  // used for @electron-toolkit
  // 999 is the world for preload context
  contextBridge.exposeInIsolatedWorld(999, 'electron', electronAPI);
  contextBridge.exposeInMainWorld('api', api);
  contextBridge.exposeInMainWorld('apiClient', apiClient);
} catch (error) {
  console.error(error);
}
