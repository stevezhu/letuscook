/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { test as baseTest } from 'vitest';

import schema from '#convex/schema.ts';

const createConvexTest = () =>
  convexTest(schema, import.meta.glob('../convex/**/*.*s'));
export type ConvexTestInstance = ReturnType<typeof createConvexTest>;

// oxlint-disable-next-line jest/expect-expect
export const test = baseTest.extend('t', () => {
  return createConvexTest();
});
