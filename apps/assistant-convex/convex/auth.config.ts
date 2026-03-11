import { AuthConfig } from 'convex/server';

import { authKit } from './auth.ts';

export default {
  providers: authKit.getAuthConfigProviders(),
} satisfies AuthConfig;
