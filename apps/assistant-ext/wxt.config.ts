/// <reference types="@wxt-dev/module-react" />
/// <reference types="wxt-turbo" />

import { productName } from '@workspace/constants';
import { defineConfig, type WxtViteConfig } from 'wxt';

import { name as packageName } from './package.json';
import viteConfig from './vite.config.ts';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: ({ mode }) => ({
    name: mode === 'development' ? `${productName} (Dev)` : productName,
    description: 'Boilerplate for a WXT-based browser extension',
    permissions: [],
  }),
  imports: false,
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons', 'wxt-turbo'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  turbo: {
    packageName,
    copyFiles: ['SOURCE_CODE_REVIEW.md'],
  },
  // TODO: can the cast be removed?
  vite: () => viteConfig as WxtViteConfig,
});
