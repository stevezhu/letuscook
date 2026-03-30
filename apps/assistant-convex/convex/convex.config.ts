import workOSAuthKit from '@convex-dev/workos-authkit/convex.config';
import { defineApp } from 'convex/server';

/** ✅ Reviewed by [@stevezhu](https://github.com/stevezhu) */
export default (() => {
  const app = defineApp();
  app.use(workOSAuthKit);
  return app;
})();
