import { defineConfig, type OxlintConfig } from 'oxlint';

export default defineConfig<OxlintConfig>({
  ignorePatterns: ['storybook.requires.ts'],
  categories: {
    correctness: 'error',
    perf: 'error',
  },
  plugins: [
    //- general
    'eslint',
    'typescript',
    'unicorn',
    'oxc',
    'import',
    'jsdoc',
    'promise',

    //- react
    'react',

    //- test
    'vitest',
  ],
  rules: {
    'import/extensions': ['error', 'ignorePackages'],
    'import/namespace': 'off',
    'import/no-duplicates': 'error',
    'react/jsx-no-constructed-context-values': 'off',
    'typescript/no-explicit-any': 'error',
  },
  settings: {
    jsdoc: {
      tagNamePreference: {
        platform: 'platform',
      },
    },
  },
});
