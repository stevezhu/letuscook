import { Hono } from 'hono';

import type { HonoBindings } from '#HonoBindings.ts';

export default new Hono<{ Bindings: HonoBindings }>().get('/test', (c) => {
  console.log({
    ENVIRONMENT: c.env.ENVIRONMENT,
    EXAMPLE_ENV_VAR: c.env.EXAMPLE_ENV_VAR,
  });
  return c.json({
    message: 'Hello, world!',
  });
});
