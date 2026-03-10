import expo from '@stzhu/eslint-config/expo';
import oxlint from 'eslint-plugin-oxlint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist/', '.expo/']),
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
      'import/no-unresolved': 'off',
    },
  },
  oxlint.configs['flat/recommended'],
]);
