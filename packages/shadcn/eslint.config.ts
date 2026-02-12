import reactConfig from '@stzhu/eslint-config/react';
import tailwindConfig from '@stzhu/eslint-config/tailwind';
import oxlint from 'eslint-plugin-oxlint';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  reactConfig.configs.recommended,
  tailwindConfig.configs.recommended.map((config) => {
    delete config.rules;
    return config;
  }),
  {
    settings: {
      'better-tailwindcss': {
        entryPoint: './src/main.css',
      },
    },
    // only enable correctness rules
    // https://github.com/schoero/eslint-plugin-better-tailwindcss/tree/v4.2.0?tab=readme-ov-file
    rules: {
      'better-tailwindcss/no-unknown-classes': 'error',
      'better-tailwindcss/no-conflicting-classes': 'error',
      'better-tailwindcss/no-restricted-classes': 'error',
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
