import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
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
    react(),
    await babel({
      presets: [reactCompilerPreset()],
    }),
  ],
});
