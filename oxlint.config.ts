import vitest from '@vitest/eslint-plugin';
import { mapKeys } from 'es-toolkit/object';
import { defineConfig, type OxlintConfig } from 'oxlint';

const vitestName = 'vitest-eslint';

export default defineConfig<OxlintConfig>({
  ignorePatterns: ['storybook.requires.ts', 'packages/shadcn/src/**'],
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
    // 'vitest',
  ],
  jsPlugins: [
    {
      name: vitestName,
      specifier: '@vitest/eslint-plugin',
    },
  ],
  rules: {
    'import/extensions': ['error', 'ignorePackages'],
    'import/namespace': 'off',
    'import/no-duplicates': 'error',
    'react/jsx-no-constructed-context-values': 'off',
    'typescript/no-explicit-any': 'error',
    ...mapKeys(vitest.configs.recommended.rules, (_, name) =>
      name.replace('vitest/', `${vitestName}/`),
    ),
    'vitest-eslint/consistent-test-it': [
      'error',
      {
        fn: 'test',
        withinDescribe: 'test',
      },
    ],
    'vitest-eslint/no-focused-tests': 'error',
    'vitest-eslint/no-disabled-tests': 'error',
    'vitest-eslint/no-standalone-expect': [
      'error',
      {
        additionalTestBlockFunctions: ['test'],
      },
    ],
    'vitest-eslint/prefer-lowercase-title': [
      'warn',
      {
        ignoreTopLevelDescribe: true,
      },
    ],
  },
  settings: {
    jsdoc: {
      tagNamePreference: {
        platform: 'platform',
      },
    },
  },
});
