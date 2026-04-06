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

async function createCapture(
  testConvex: ConvexTestInstance,
  userId: Id<'users'>,
) {
  return testConvex.run(async (ctx) => {
    return ctx.db.insert('captures', {
      rawContent: 'https://example.com',
      captureType: 'link',
      capturedAt: Date.now(),
      updatedAt: Date.now(),
      ownerUserId: userId,
      captureState: 'processing',
      explicitMentionNodeIds: [],
    });
  });
}

describe('saveLinkMetadata', () => {
  test('inserts link metadata', async ({ testConvex }) => {
    const userId = await getUserId(testConvex);
    const captureId = await createCapture(testConvex, userId);

    await testConvex.mutation(internal.linkMetadata.saveLinkMetadata, {
      captureId,
      url: 'https://example.com/article',
      domain: 'example.com',
      title: 'Example Article',
      description: 'A test article',
      fetchedAt: Date.now(),
      fetchStatus: 'success',
      ownerUserId: userId,
    });

    const metadata = await testConvex.run(async (ctx) => {
      return ctx.db
        .query('linkMetadata')
        .withIndex('by_capture', (q) => q.eq('captureId', captureId))
        .unique();
    });

    expect(metadata).toMatchObject({
      url: 'https://example.com/article',
      domain: 'example.com',
      title: 'Example Article',
      fetchStatus: 'success',
    });
  });
});

describe('getLinkMetadataByCapture', () => {
  test('returns metadata for owned capture', async ({
    testConvex,
    authedTestConvex,
  }) => {
    const userId = await getUserId(testConvex);
    const captureId = await createCapture(testConvex, userId);

    await testConvex.mutation(internal.linkMetadata.saveLinkMetadata, {
      captureId,
      url: 'https://example.com',
      domain: 'example.com',
      title: 'Example',
      fetchedAt: Date.now(),
      fetchStatus: 'success',
      ownerUserId: userId,
    });

    const result = await authedTestConvex.query(
      api.linkMetadata.getLinkMetadataByCapture,
      { captureId },
    );

    expect(result).not.toBeNull();
    expect(result!.url).toBe('https://example.com');
  });

  test('returns null for capture owned by another user', async ({
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

    const captureId = await createCapture(testConvex, otherUserId);

    await testConvex.mutation(internal.linkMetadata.saveLinkMetadata, {
      captureId,
      url: 'https://other.com',
      domain: 'other.com',
      fetchedAt: Date.now(),
      fetchStatus: 'success',
      ownerUserId: otherUserId,
    });

    const result = await authedTestConvex.query(
      api.linkMetadata.getLinkMetadataByCapture,
      { captureId },
    );

    expect(result).toBeNull();
  });
});

describe('getLinksByDomain', () => {
  test('returns links for the specified domain', async ({
    testConvex,
    authedTestConvex,
  }) => {
    const userId = await getUserId(testConvex);
    const captureId1 = await createCapture(testConvex, userId);
    const captureId2 = await createCapture(testConvex, userId);

    await testConvex.mutation(internal.linkMetadata.saveLinkMetadata, {
      captureId: captureId1,
      url: 'https://example.com/a',
      domain: 'example.com',
      fetchedAt: Date.now(),
      fetchStatus: 'success',
      ownerUserId: userId,
    });
    await testConvex.mutation(internal.linkMetadata.saveLinkMetadata, {
      captureId: captureId2,
      url: 'https://other.com/b',
      domain: 'other.com',
      fetchedAt: Date.now(),
      fetchStatus: 'success',
      ownerUserId: userId,
    });

    const result = await authedTestConvex.query(
      api.linkMetadata.getLinksByDomain,
      { domain: 'example.com' },
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.url).toBe('https://example.com/a');
  });
});

describe('getDomainList', () => {
  test('returns domains sorted by count desc', async ({
    testConvex,
    authedTestConvex,
  }) => {
    const userId = await getUserId(testConvex);

    // Create 3 captures for example.com, 1 for other.com
    const captureIds = await Promise.all(
      Array.from({ length: 3 }, () => createCapture(testConvex, userId)),
    );
    await Promise.all(
      captureIds.map((id, i) =>
        testConvex.mutation(internal.linkMetadata.saveLinkMetadata, {
          captureId: id,
          url: `https://example.com/${i}`,
          domain: 'example.com',
          fetchedAt: Date.now(),
          fetchStatus: 'success',
          ownerUserId: userId,
        }),
      ),
    );

    const captureId = await createCapture(testConvex, userId);
    await testConvex.mutation(internal.linkMetadata.saveLinkMetadata, {
      captureId,
      url: 'https://other.com/x',
      domain: 'other.com',
      fetchedAt: Date.now(),
      fetchStatus: 'success',
      ownerUserId: userId,
    });

    const result = await authedTestConvex.query(api.linkMetadata.getDomainList);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ domain: 'example.com', count: 3 });
    expect(result[1]).toEqual({ domain: 'other.com', count: 1 });
  });
});
