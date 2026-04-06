import { describe, expect } from 'vitest';

import { api } from '#convex/_generated/api.js';
import { type ConvexTestInstance, test } from '#test/convexTest.ts';

test.beforeEach(async ({ setupUser, setupAgentUser }) => {
  await Promise.all([setupUser(), setupAgentUser()]);
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

describe('createEdge', () => {
  test('creates an explicit edge between owned nodes', async ({
    testConvex,
    authedTestConvex,
  }) => {
    const userId = await getUserId(testConvex);

    const { fromNodeId, toNodeId } = await testConvex.run(async (ctx) => {
      const now = Date.now();
      const fromNodeId = await ctx.db.insert('nodes', {
        title: 'From',
        content: 'from',
        searchText: 'From\n\nfrom',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      const toNodeId = await ctx.db.insert('nodes', {
        title: 'To',
        content: 'to',
        searchText: 'To\n\nto',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      return { fromNodeId, toNodeId };
    });

    const edgeId = await authedTestConvex.mutation(api.edges.createEdge, {
      fromNodeId,
      toNodeId,
      edgeType: 'explicit',
    });

    const edge = await testConvex.run(async (ctx) => ctx.db.get(edgeId));
    expect(edge).toMatchObject({
      fromNodeId,
      toNodeId,
      edgeType: 'explicit',
      source: 'user',
      verified: true,
    });
    expect(edge!.publishedAt).toBeDefined();
  });

  test('rejects duplicate edges', async ({ testConvex, authedTestConvex }) => {
    const userId = await getUserId(testConvex);

    const { fromNodeId, toNodeId } = await testConvex.run(async (ctx) => {
      const now = Date.now();
      const fromNodeId = await ctx.db.insert('nodes', {
        title: 'From',
        content: 'from',
        searchText: 'From\n\nfrom',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      const toNodeId = await ctx.db.insert('nodes', {
        title: 'To',
        content: 'to',
        searchText: 'To\n\nto',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      return { fromNodeId, toNodeId };
    });

    await authedTestConvex.mutation(api.edges.createEdge, {
      fromNodeId,
      toNodeId,
      edgeType: 'explicit',
    });

    await expect(
      authedTestConvex.mutation(api.edges.createEdge, {
        fromNodeId,
        toNodeId,
        edgeType: 'explicit',
      }),
    ).rejects.toThrow();
  });

  test('rejects edge to node not owned by user', async ({
    testConvex,
    authedTestConvex,
  }) => {
    const userId = await getUserId(testConvex);

    const { fromNodeId, otherNodeId } = await testConvex.run(async (ctx) => {
      const now = Date.now();
      const otherUser = await ctx.db.insert('users', {
        displayName: 'Other',
        userType: 'human',
        createdAt: now,
        updatedAt: now,
      });
      const fromNodeId = await ctx.db.insert('nodes', {
        title: 'Mine',
        content: 'mine',
        searchText: 'Mine\n\nmine',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      const otherNodeId = await ctx.db.insert('nodes', {
        title: 'Not Mine',
        content: 'not mine',
        searchText: 'Not Mine\n\nnot mine',
        ownerUserId: otherUser,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      return { fromNodeId, otherNodeId };
    });

    await expect(
      authedTestConvex.mutation(api.edges.createEdge, {
        fromNodeId,
        toNodeId: otherNodeId,
        edgeType: 'explicit',
      }),
    ).rejects.toThrow();
  });
});
