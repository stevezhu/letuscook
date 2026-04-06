import { describe, expect } from 'vitest';

import { api, internal } from '#convex/_generated/api.js';
import { Id } from '#convex/_generated/dataModel.js';
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

async function createPublishedNode(
  testConvex: ConvexTestInstance,
  userId: Id<'users'>,
) {
  return testConvex.run(async (ctx) => {
    const now = Date.now();
    return ctx.db.insert('nodes', {
      title: 'Test Node',
      content: 'Test content',
      searchText: 'Test Node\n\nTest content',
      ownerUserId: userId,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  });
}

async function createDocument(
  testConvex: ConvexTestInstance,
  nodeId: Id<'nodes'>,
  userId: Id<'users'>,
  version: number,
) {
  return testConvex.mutation(internal.nodeDocuments.saveGeneratedDocument, {
    nodeId,
    version,
    title: `Document v${version}`,
    content: `# Document v${version}\n\nContent for version ${version}`,
    generatedAt: Date.now(),
    generatedFromEdgesUpTo: Date.now(),
    ownerUserId: userId,
  });
}

describe('saveGeneratedDocument', () => {
  test('inserts a document with isEdited false', async ({ testConvex }) => {
    const userId = await getUserId(testConvex);
    const nodeId = await createPublishedNode(testConvex, userId);

    await createDocument(testConvex, nodeId, userId, 1);

    const docs = await testConvex.run(async (ctx) => {
      return ctx.db
        .query('nodeDocuments')
        .withIndex('by_node_version', (q) => q.eq('nodeId', nodeId))
        .collect();
    });

    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({
      title: 'Document v1',
      version: 1,
      isEdited: false,
      ownerUserId: userId,
    });
  });
});

describe('updateDocument', () => {
  test('updates title and content, sets isEdited true', async ({
    testConvex,
    authedTestConvex,
  }) => {
    const userId = await getUserId(testConvex);
    const nodeId = await createPublishedNode(testConvex, userId);
    await createDocument(testConvex, nodeId, userId, 1);

    const docId = await testConvex.run(async (ctx) => {
      const doc = await ctx.db
        .query('nodeDocuments')
        .withIndex('by_node_version', (q) => q.eq('nodeId', nodeId))
        .first();
      return doc!._id;
    });

    await authedTestConvex.mutation(api.nodeDocuments.updateDocument, {
      documentId: docId,
      title: 'Updated Title',
      content: 'Updated content',
    });

    const updated = await testConvex.run(async (ctx) => {
      return ctx.db.get(docId);
    });

    expect(updated).toMatchObject({
      title: 'Updated Title',
      content: 'Updated content',
      isEdited: true,
    });
  });

  test('rejects update for document owned by another user', async ({
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

    const nodeId = await testConvex.run(async (ctx) => {
      const now = Date.now();
      return ctx.db.insert('nodes', {
        title: 'Other Node',
        content: 'Other content',
        searchText: 'Other Node\n\nOther content',
        ownerUserId: otherUserId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    });

    await createDocument(testConvex, nodeId, otherUserId, 1);

    const docId = await testConvex.run(async (ctx) => {
      const doc = await ctx.db
        .query('nodeDocuments')
        .withIndex('by_node_version', (q) => q.eq('nodeId', nodeId))
        .first();
      return doc!._id;
    });

    await expect(
      authedTestConvex.mutation(api.nodeDocuments.updateDocument, {
        documentId: docId,
        title: 'Hacked',
      }),
    ).rejects.toThrow();
  });
});

describe('getNodeDocuments', () => {
  test('returns documents sorted by version desc', async ({
    testConvex,
    authedTestConvex,
  }) => {
    const userId = await getUserId(testConvex);
    const nodeId = await createPublishedNode(testConvex, userId);

    await createDocument(testConvex, nodeId, userId, 1);
    await createDocument(testConvex, nodeId, userId, 2);
    await createDocument(testConvex, nodeId, userId, 3);

    const result = await authedTestConvex.query(
      api.nodeDocuments.getNodeDocuments,
      { nodeId },
    );

    expect(result).toHaveLength(3);
    expect(result![0]!.version).toBe(3);
    expect(result![1]!.version).toBe(2);
    expect(result![2]!.version).toBe(1);
  });

  test('returns null for node owned by another user', async ({
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

    const nodeId = await testConvex.run(async (ctx) => {
      const now = Date.now();
      return ctx.db.insert('nodes', {
        title: 'Other Node',
        content: 'Other content',
        searchText: 'Other Node\n\nOther content',
        ownerUserId: otherUserId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    });

    const result = await authedTestConvex.query(
      api.nodeDocuments.getNodeDocuments,
      { nodeId },
    );

    expect(result).toBeNull();
  });
});

describe('getLatestDocument', () => {
  test('returns only the highest version', async ({
    testConvex,
    authedTestConvex,
  }) => {
    const userId = await getUserId(testConvex);
    const nodeId = await createPublishedNode(testConvex, userId);

    await createDocument(testConvex, nodeId, userId, 1);
    await createDocument(testConvex, nodeId, userId, 2);
    await createDocument(testConvex, nodeId, userId, 3);

    const result = await authedTestConvex.query(
      api.nodeDocuments.getLatestDocument,
      { nodeId },
    );

    expect(result).not.toBeNull();
    expect(result!.version).toBe(3);
    expect(result!.title).toBe('Document v3');
  });
});
