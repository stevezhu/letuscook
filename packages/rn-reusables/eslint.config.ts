// https://docs.expo.dev/guides/using-eslint/
import expo from '@stzhu/eslint-config/expo';
import oxlint from 'eslint-plugin-oxlint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  expo.configs.recommended,
  {
    rules: {
      'simple-import-sort/imports': 'off',
      'simple-import-sort/exports': 'off',
    },
  },
  oxlint.configs['flat/recommended'],
]);
