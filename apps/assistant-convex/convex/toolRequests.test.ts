import { describe, expect } from 'vitest';

import { api, internal } from '#convex/_generated/api.js';
import { type ConvexTestInstance, test } from '#test/convexTest.ts';

test.beforeEach(async ({ setupUser }) => {
  await setupUser();
});

async function getUserId(testConvex: ConvexTestInstance) {
  return testConvex.run(async (ctx) => {
    const user = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('workosUserId'), 'workos_user_123'))
      .unique();
    return user!._id;
  });
}

describe('logToolRequest', () => {
  test('creates a new request with frequency 1', async ({ testConvex }) => {
    const userId = await getUserId(testConvex);

    await testConvex.mutation(internal.toolRequests.logToolRequest, {
      description: 'Fetch failed for example.com',
      domain: 'example.com',
      ownerUserId: userId,
    });

    const requests = await testConvex.run(async (ctx) => {
      return ctx.db.query('toolRequests').collect();
    });

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      description: 'Fetch failed for example.com',
      domain: 'example.com',
      frequency: 1,
      status: 'open',
      ownerUserId: userId,
    });
  });

  test('increments frequency on duplicate domain', async ({ testConvex }) => {
    const userId = await getUserId(testConvex);
    const args = {
      description: 'Fetch failed for example.com',
      domain: 'example.com',
      ownerUserId: userId,
    };

    await testConvex.mutation(internal.toolRequests.logToolRequest, args);
    await testConvex.mutation(internal.toolRequests.logToolRequest, args);

    const requests = await testConvex.run(async (ctx) => {
      return ctx.db.query('toolRequests').collect();
    });

    expect(requests).toHaveLength(1);
    expect(requests[0]!.frequency).toBe(2);
  });
});

describe('getToolRequests', () => {
  test('returns open requests sorted by frequency desc', async ({
    testConvex,
    authedTestConvex,
  }) => {
    const userId = await getUserId(testConvex);
    const now = Date.now();

    await testConvex.run(async (ctx) => {
      await ctx.db.insert('toolRequests', {
        description: 'Low freq',
        domain: 'low.com',
        frequency: 1,
        status: 'open',
        createdAt: now,
        ownerUserId: userId,
      });
      await ctx.db.insert('toolRequests', {
        description: 'High freq',
        domain: 'high.com',
        frequency: 5,
        status: 'open',
        createdAt: now,
        ownerUserId: userId,
      });
      await ctx.db.insert('toolRequests', {
        description: 'Dismissed',
        domain: 'dismissed.com',
        frequency: 10,
        status: 'dismissed',
        createdAt: now,
        ownerUserId: userId,
      });
    });

    const requests = await authedTestConvex.query(
      api.toolRequests.getToolRequests,
    );

    expect(requests).toHaveLength(2);
    expect(requests[0]!.domain).toBe('high.com');
    expect(requests[1]!.domain).toBe('low.com');
  });
});

describe('dismissToolRequest', () => {
  test('sets status to dismissed', async ({ testConvex, authedTestConvex }) => {
    const userId = await getUserId(testConvex);

    const requestId = await testConvex.run(async (ctx) => {
      return ctx.db.insert('toolRequests', {
        description: 'Test request',
        domain: 'test.com',
        frequency: 1,
        status: 'open',
        createdAt: Date.now(),
        ownerUserId: userId,
      });
    });

    await authedTestConvex.mutation(api.toolRequests.dismissToolRequest, {
      toolRequestId: requestId,
    });

    const request = await testConvex.run(async (ctx) => {
      return ctx.db.get(requestId);
    });

    expect(request!.status).toBe('dismissed');
  });

  test('ignores request owned by another user', async ({
    testConvex,
    authedTestConvex,
  }) => {
    const otherUserId = await testConvex.run(async (ctx) => {
      return ctx.db.insert('users', {
        displayName: 'Other User',
        workosUserId: 'workos_other',
        userType: 'human',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const requestId = await testConvex.run(async (ctx) => {
      return ctx.db.insert('toolRequests', {
        description: 'Other request',
        domain: 'other.com',
        frequency: 1,
        status: 'open',
        createdAt: Date.now(),
        ownerUserId: otherUserId,
      });
    });

    await authedTestConvex.mutation(api.toolRequests.dismissToolRequest, {
      toolRequestId: requestId,
    });

    const request = await testConvex.run(async (ctx) => {
      return ctx.db.get(requestId);
    });

    expect(request!.status).toBe('open');
  });
});
