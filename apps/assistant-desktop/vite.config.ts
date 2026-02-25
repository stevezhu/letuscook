import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import workspaceConstants from '@workspace/constants/vite';
import { defineConfig } from 'vite';

// vite config for the renderer process
export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    workspaceConstants(),
    tailwindcss(),
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
});
