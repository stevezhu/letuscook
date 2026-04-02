import { describe, expect } from 'vitest';

import { api } from '#convex/_generated/api.js';
import { type ConvexTestInstance, test } from '#convexTest.ts';

const IDENTITY = { name: 'Test User', subject: 'workos_user_123' };

async function setupUser(t: ConvexTestInstance) {
  return t.run(async (ctx) => {
    return ctx.db.insert('users', {
      displayName: 'Test User',
      email: 'test@example.com',
      workosUserId: 'workos_user_123',
      userType: 'human',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
}

describe('createEdge', () => {
  test('creates an explicit edge between owned nodes', async ({ t }) => {
    const userId = await setupUser(t);

    const { fromNodeId, toNodeId } = await t.run(async (ctx) => {
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

    const asSarah = t.withIdentity(IDENTITY);
    const edgeId = await asSarah.mutation(api.edges.createEdge, {
      fromNodeId,
      toNodeId,
      edgeType: 'explicit',
    });

    const edge = await t.run(async (ctx) => ctx.db.get(edgeId));
    expect(edge).toMatchObject({
      fromNodeId,
      toNodeId,
      edgeType: 'explicit',
      source: 'user',
      verified: true,
    });
    expect(edge!.publishedAt).toBeDefined();
  });

  test('rejects duplicate edges', async ({ t }) => {
    const userId = await setupUser(t);

    const { fromNodeId, toNodeId } = await t.run(async (ctx) => {
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

    const asSarah = t.withIdentity(IDENTITY);
    await asSarah.mutation(api.edges.createEdge, {
      fromNodeId,
      toNodeId,
      edgeType: 'explicit',
    });

    await expect(
      asSarah.mutation(api.edges.createEdge, {
        fromNodeId,
        toNodeId,
        edgeType: 'explicit',
      }),
    ).rejects.toThrow();
  });

  test('rejects edge to node not owned by user', async ({ t }) => {
    const userId = await setupUser(t);

    const { fromNodeId, otherNodeId } = await t.run(async (ctx) => {
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

    const asSarah = t.withIdentity(IDENTITY);
    await expect(
      asSarah.mutation(api.edges.createEdge, {
        fromNodeId,
        toNodeId: otherNodeId,
        edgeType: 'explicit',
      }),
    ).rejects.toThrow();
  });
});
