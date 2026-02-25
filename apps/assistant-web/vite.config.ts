import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import workspaceConstants from '@workspace/constants/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    workspaceConstants(),
    tailwindcss(),
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
