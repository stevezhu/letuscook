// https://docs.expo.dev/guides/using-eslint/
import expo from '@stzhu/eslint-config/expo';
import importConfig from '@stzhu/eslint-config/import';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  expo.configs.recommended,
  importConfig.configs['file-extension-in-import'],
]);
