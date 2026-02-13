import react from '@stzhu/eslint-config/react';
import tailwind from '@stzhu/eslint-config/tailwind';
import oxlint from 'eslint-plugin-oxlint';
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
  {
    rules: {
      'simple-import-sort/imports': 'off',
      'simple-import-sort/exports': 'off',
    },
  },
  oxlint.configs['flat/recommended'],
);
