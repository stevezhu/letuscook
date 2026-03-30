import expo from '@stzhu/eslint-config/expo';
import oxlint from 'eslint-plugin-oxlint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist/', '.expo/', '.rnstorybook/storybook.requires.ts']),
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
      'n/no-missing-import': 'off',
    },
  },
  oxlint.configs['flat/recommended'],
]);
