import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import workspaceConstants from '@workspace/constants/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [workspaceConstants(), tailwindcss(), react()],
});
