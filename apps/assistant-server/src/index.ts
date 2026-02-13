import { Hono } from 'hono';

import example from '#routes/example.js';

const app = new Hono().basePath('/api').route('/example', example);

export default app;
