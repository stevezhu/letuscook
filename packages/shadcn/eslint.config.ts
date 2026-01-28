import reactConfig from '@stzhu/eslint-config/react';
import tailwindConfig from '@stzhu/eslint-config/tailwind';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  reactConfig.configs.recommended,
  tailwindConfig.configs.recommended,
  {
    settings: {
      'better-tailwindcss': {
        entryPoint: './src/main.css',
      },
    },
  },
);
