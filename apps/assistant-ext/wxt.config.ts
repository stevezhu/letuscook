/// <reference types="@wxt-dev/module-react" />
/// <reference types="wxt-turbo" />

import { productName } from '@workspace/constants';
import { defineConfig } from 'wxt';

import { name as packageName } from './package.json';
import viteConfig from './vite.config.js';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: ({ mode }) => ({
    name: mode === 'development' ? `${productName} (Dev)` : productName,
    description: 'Boilerplate for a WXT-based browser extension',
    permissions: [],
  }),
  imports: false,
  modules: ['@wxt-dev/auto-icons', 'wxt-turbo'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  turbo: {
    packageName,
    copyFiles: ['SOURCE_CODE_REVIEW.md'],
  },
  vite: () => viteConfig,
});
