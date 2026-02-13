/// <reference types="@wxt-dev/module-react" />
/// <reference types="wxt-turbo" />

import { productName } from '@workspace/constants';
import { defineConfig } from 'wxt';

import { name as packageName } from './package.json';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: ({ mode }) => ({
    name: mode === 'development' ? `${productName} (Dev)` : productName,
    description: 'Boilerplate for a WXT-based browser extension',
    permissions: ['storage', 'tabs'],
  }),
  imports: false,
  modules: ['@wxt-dev/auto-icons', '@wxt-dev/module-react'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  turbo: {
    packageName,
    copyFiles: ['SOURCE_CODE_REVIEW.md'],
  },
});
