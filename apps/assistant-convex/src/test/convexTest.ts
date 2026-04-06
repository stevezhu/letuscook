/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { UserIdentity } from 'convex/server';
import { test as baseTest } from 'vitest';

import { internal } from '#convex/_generated/api.js';
import schema from '#convex/schema.ts';

import { suppressConsole } from './suppressConsole.ts';

const createConvexTest = () =>
  convexTest(schema, import.meta.glob('/convex/**/*.*s'));
export type ConvexTestInstance = ReturnType<typeof createConvexTest>;

// oxlint-disable-next-line jest/expect-expect
export const test = baseTest
  .extend('identity', () => {
    return {
      tokenIdentifier: '1234567890', // TODO: check whether this is realistic
      issuer: 'https://auth.example.com',
      name: 'Test User',
      email: 'test@example.com',
      subject: 'workos_user_123',
    } satisfies Partial<UserIdentity>;
  })
  .extend('testConvex', () => {
    return createConvexTest();
  })
  .extend('authedTestConvex', ({ testConvex, identity }) => {
    return testConvex.withIdentity(identity);
  })
  .extend('setupUser', ({ testConvex, identity }) => {
    return () =>
      testConvex.run((ctx) =>
        ctx.db.insert('users', {
          displayName: identity.name,
          email: identity.email,
          workosUserId: identity.subject,
          userType: 'human',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }),
      );
  })
  .extend('setupAgentUser', ({ testConvex }) => {
    return () =>
      suppressConsole('info', () =>
        testConvex.mutation(internal.scripts.seed.seedAgentUser),
      );
  });
