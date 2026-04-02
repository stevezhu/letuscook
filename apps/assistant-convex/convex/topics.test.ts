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

describe('createUserTopic', () => {
  test('creates a user-defined topic', async ({ t }) => {
    const userId = await setupUser(t);

    const asSarah = t.withIdentity(IDENTITY);
    const topicId = await asSarah.mutation(api.topics.createUserTopic, {
      label: 'Machine Learning',
    });

    const topic = await t.run(async (ctx) => ctx.db.get(topicId));
    expect(topic).toMatchObject({
      label: 'Machine Learning',
      ownerUserId: userId,
      isUserDefined: true,
    });
  });
});

describe('renameTopic', () => {
  test('renames a topic owned by the user', async ({ t }) => {
    const userId = await setupUser(t);

    const topicId = await t.run(async (ctx) => {
      return ctx.db.insert('topics', {
        label: 'Old Name',
        ownerUserId: userId,
        isUserDefined: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const asSarah = t.withIdentity(IDENTITY);
    await asSarah.mutation(api.topics.renameTopic, {
      topicId,
      label: 'New Name',
    });

    const topic = await t.run(async (ctx) => ctx.db.get(topicId));
    expect(topic!.label).toBe('New Name');
  });

  test("rejects renaming another user's topic", async ({ t }) => {
    await setupUser(t);

    const topicId = await t.run(async (ctx) => {
      const otherUser = await ctx.db.insert('users', {
        displayName: 'Other',
        userType: 'human',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return ctx.db.insert('topics', {
        label: 'Their Topic',
        ownerUserId: otherUser,
        isUserDefined: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const asSarah = t.withIdentity(IDENTITY);
    await expect(
      asSarah.mutation(api.topics.renameTopic, {
        topicId,
        label: 'Hijacked',
      }),
    ).rejects.toThrow();
  });
});

describe('assignNodeToTopic', () => {
  test('assigns a node to a topic', async ({ t }) => {
    const userId = await setupUser(t);

    const { nodeId, topicId } = await t.run(async (ctx) => {
      const now = Date.now();
      const nodeId = await ctx.db.insert('nodes', {
        title: 'My Node',
        content: 'content',
        searchText: 'My Node\n\ncontent',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      const topicId = await ctx.db.insert('topics', {
        label: 'ML',
        ownerUserId: userId,
        isUserDefined: true,
        createdAt: now,
        updatedAt: now,
      });
      return { nodeId, topicId };
    });

    const asSarah = t.withIdentity(IDENTITY);
    await asSarah.mutation(api.topics.assignNodeToTopic, { nodeId, topicId });

    const nodeTopics = await t.run(async (ctx) => {
      return ctx.db
        .query('nodeTopics')
        .withIndex('by_node', (q) => q.eq('nodeId', nodeId))
        .collect();
    });

    expect(nodeTopics).toHaveLength(1);
    expect(nodeTopics[0]).toMatchObject({
      nodeId,
      topicId,
      source: 'user',
    });
  });

  test('prevents duplicate assignment', async ({ t }) => {
    const userId = await setupUser(t);

    const { nodeId, topicId } = await t.run(async (ctx) => {
      const now = Date.now();
      const nodeId = await ctx.db.insert('nodes', {
        title: 'My Node',
        content: 'content',
        searchText: 'My Node\n\ncontent',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      const topicId = await ctx.db.insert('topics', {
        label: 'ML',
        ownerUserId: userId,
        isUserDefined: true,
        createdAt: now,
        updatedAt: now,
      });
      return { nodeId, topicId };
    });

    const asSarah = t.withIdentity(IDENTITY);
    await asSarah.mutation(api.topics.assignNodeToTopic, { nodeId, topicId });
    await asSarah.mutation(api.topics.assignNodeToTopic, { nodeId, topicId });

    const nodeTopics = await t.run(async (ctx) => {
      return ctx.db
        .query('nodeTopics')
        .withIndex('by_node', (q) => q.eq('nodeId', nodeId))
        .collect();
    });

    expect(nodeTopics).toHaveLength(1);
  });
});

describe('getUserTopics', () => {
  test('returns topics with node counts', async ({ t }) => {
    const userId = await setupUser(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      const topicId = await ctx.db.insert('topics', {
        label: 'ML',
        ownerUserId: userId,
        isUserDefined: true,
        createdAt: now,
        updatedAt: now,
      });
      const nodeId = await ctx.db.insert('nodes', {
        title: 'Node',
        content: 'content',
        searchText: 'Node\n\ncontent',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert('nodeTopics', {
        nodeId,
        topicId,
        source: 'user',
        createdAt: now,
      });
    });

    const asSarah = t.withIdentity(IDENTITY);
    const topics = await asSarah.query(api.topics.getUserTopics, {});

    expect(topics).toHaveLength(1);
    expect(topics[0]).toMatchObject({
      label: 'ML',
      nodeCount: 1,
    });
  });
});
