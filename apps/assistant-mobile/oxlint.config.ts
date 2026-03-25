import { resolve } from 'node:path';

import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import { defineConfig, type OxlintConfig } from 'oxlint';

import baseConfig from '../../oxlint.config.ts';

export default defineConfig<OxlintConfig>({
  extends: [baseConfig],
  jsPlugins: ['eslint-plugin-better-tailwindcss'],
  rules: {
    ...eslintPluginBetterTailwindcss.configs.recommended.rules,
  },
  settings: {
    'better-tailwindcss': {
      entryPoint: resolve(import.meta.dirname, 'src/main.css'),
    },
  },
});
