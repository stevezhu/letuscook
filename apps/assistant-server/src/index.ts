import { Hono } from 'hono';

import example from '#routes/example.ts';

const app = new Hono().basePath('/api').route('/example', example);

export default app;
