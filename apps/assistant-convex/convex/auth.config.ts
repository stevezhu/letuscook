import { AuthConfig } from 'convex/server';

import { authKit } from '#convex/auth.ts';

/** ✅ Reviewed by [@stevezhu](https://github.com/stevezhu) */
export default {
  providers: authKit.getAuthConfigProviders(),
} satisfies AuthConfig;
