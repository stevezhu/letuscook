import ts from '@stzhu/eslint-config/ts';
import oxlint from 'eslint-plugin-oxlint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(
  globalIgnores(['.wrangler/', '*.gen.d.ts', 'convex/_generated/']),
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  ts.configs.recommended,
  {
    rules: {
      'simple-import-sort/imports': 'off',
      'simple-import-sort/exports': 'off',
    },
  },
  oxlint.configs['flat/recommended'],
);
