import react from '@stzhu/eslint-config/react';
import tailwind from '@stzhu/eslint-config/tailwind';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(
  globalIgnores(['dist/']),
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  react.configs.recommended,
  tailwind.configs.recommended,
  {
    settings: {
      'better-tailwindcss': {
        entryPoint: './src/main.css',
      },
    },
  },
);
