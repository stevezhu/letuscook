import expo from '@stzhu/eslint-config/expo';
import importConfig from '@stzhu/eslint-config/import';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist/', '.expo/']),
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  expo.configs.recommended,
  importConfig.configs['file-extension-in-import'],
]);
