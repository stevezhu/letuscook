import { defineConfig } from 'electron-vite';

import renderer from './vite.config.js';

export default defineConfig({
  main: {},
  preload: {
    build: {
      // XXX: can't use this with sandboxing because external modules need to be bundled
      externalizeDeps: false,
      rollupOptions: {
        output: {
          format: 'cjs', // needed if `"type": "module"` is set in package.json
        },
      },
    },
  },
  renderer,
});
