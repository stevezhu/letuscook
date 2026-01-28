import importConfig from '@stzhu/eslint-config/import';
import react from '@stzhu/eslint-config/react';
import storybook from '@stzhu/eslint-config/storybook';
import tailwind from '@stzhu/eslint-config/tailwind';
import pluginQuery from '@tanstack/eslint-plugin-query';
import pluginRouter from '@tanstack/eslint-plugin-router';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  importConfig.configs['file-extension-in-import'],
  react.configs.recommended,
  tailwind.configs.recommended,
  {
    settings: {
      'better-tailwindcss': {
        entryPoint: './src/main.css',
      },
    },
  },
  storybook.configs.recommended,
  pluginRouter.configs['flat/recommended'],
  pluginQuery.configs['flat/recommended'],
);
