import { httpRouter } from 'convex/server';

import { authKit } from '#convex/auth.ts';

/** ✅ Reviewed by [@stevezhu](https://github.com/stevezhu) */
export default (() => {
  const http = httpRouter();
  authKit.registerRoutes(http);
  return http;
})();
