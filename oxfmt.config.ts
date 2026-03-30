import { defineConfig, type OxfmtConfig } from 'oxfmt';

export default defineConfig<OxfmtConfig>({
  sortImports: {},
  sortPackageJson: {
    sortScripts: true,
  },
  ignorePatterns: [
    '.vite/',
    'migrations/',
    '_generated/',
    '*.gen.ts',
    '*.gen.d.ts',
    'uniwind-types.d.ts',
    'storybook.requires.ts',
  ],
  overrides: [
    {
      files: ['*.jsonc'],
      options: {
        // XXX: do not use trailing commas for jsonc files
        // Reference: https://github.com/prettier/prettier/issues/15956#issuecomment-3000347490
        trailingComma: 'none',
      },
    },
    {
      files: ['apps/assistant-mobile/**'],
      options: {
        sortTailwindcss: {
          stylesheet: 'apps/assistant-mobile/src/main.css',
        },
      },
    },
  ],
  printWidth: 80,
  singleQuote: true,
  jsdoc: {},
});
