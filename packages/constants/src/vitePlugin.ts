import constants from '@workspace/constants' with { type: 'json' };

export default function viteWorkspaceConstants() {
  return {
    name: 'vite-plugin-workspace-constants',
    config() {
      process.env['VITE_PRODUCT_NAME'] = constants.productName;
    },
  };
}
