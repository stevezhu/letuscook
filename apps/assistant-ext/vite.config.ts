import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { reactCompilerPreset } from '@vitejs/plugin-react';
import workspaceConstants from '@workspace/constants/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    workspaceConstants(),
    tailwindcss(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
});
