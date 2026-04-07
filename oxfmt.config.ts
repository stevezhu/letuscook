import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { findWorkspacePackagesNoCheck } from '@pnpm/find-workspace-packages';
import { defineConfig, type OxfmtConfig } from 'oxfmt';

const workspaceProjects = await findWorkspacePackagesNoCheck('.');
const workspaceOverrides = await Promise.all(
  workspaceProjects
    .filter(
      (pkg) => pkg.dir !== '.' && existsSync(join(pkg.dir, 'oxfmt.config.ts')),
    )
    .map(async (pkg) => ({
      files: [`${pkg.dir}/**`],
      options: (await import(`./${pkg.dir}/oxfmt.config.ts`)).default,
    })),
);

export default defineConfig<OxfmtConfig>({
  ignorePatterns: [
    '.vite/',
    'migrations/',
    '_generated/',
    '*.gen.ts',
    '*.gen.d.ts',
    'uniwind-types.d.ts',
    'storybook.requires.ts',
  ],
  printWidth: 80,
  singleQuote: true,
  endOfLine: 'lf',
  jsdoc: {
    commentLineStrategy: 'multiline',
  },
  sortImports: {},
  sortPackageJson: {
    sortScripts: true,
  },
  overrides: [
    {
      files: ['*.jsonc'],
      options: {
        // XXX: do not use trailing commas for jsonc files
        // Reference: https://github.com/prettier/prettier/issues/15956#issuecomment-3000347490
        trailingComma: 'none',
      },
    },
    // XXX: disable on CI because the CI format output seems to be different when the tailwind config is present
    ...(process.env.CI === 'true' ? [] : workspaceOverrides),
  ],
});
