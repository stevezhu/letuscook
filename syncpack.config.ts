import type { RcFile } from 'syncpack';

/**
 * Used to make sure versions are consistent across all mobile packages and
 * apps.
 *
 * All mobile workspaces should be defined in this config.
 */
export default {
  source: [
    'packages/rn-reusables/package.json',
    'apps/assistant-mobile/package.json',
  ],
} satisfies RcFile;
