import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';

import { api } from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/!(*.*.*)*.*s');

const IDENTITY = { name: 'Test User', subject: 'workos_user_123' };

async function setupUser(t: ReturnType<typeof convexTest>) {
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

// ─── archiveNode ─────────────────────────────────────────────────────────────

describe('archiveNode', () => {
  test('archives node and all connected edges', async () => {
    const t = convexTest(schema, modules);
    const userId = await setupUser(t);

    const { nodeId, otherNodeId, edgeId } = await t.run(async (ctx) => {
      const now = Date.now();
      const nodeId = await ctx.db.insert('nodes', {
        title: 'To Archive',
        content: 'content',
        searchText: 'To Archive\n\ncontent',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      const otherNodeId = await ctx.db.insert('nodes', {
        title: 'Other',
        content: 'other',
        searchText: 'Other\n\nother',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      const edgeId = await ctx.db.insert('edges', {
        fromNodeId: nodeId,
        toNodeId: otherNodeId,
        edgeType: 'explicit',
        source: 'user',
        verified: true,
        publishedAt: now,
        createdAt: now,
      });
      return { nodeId, otherNodeId, edgeId };
    });

    const asSarah = t.withIdentity(IDENTITY);
    await asSarah.mutation(api.nodes.archiveNode, { nodeId });

    const { node, edge } = await t.run(async (ctx) => ({
      node: await ctx.db.get(nodeId),
      edge: await ctx.db.get(edgeId),
    }));

    expect(node!.archivedAt).toBeDefined();
    expect(edge!.archivedAt).toBeDefined();
  });

  test('rejects archiving node owned by another user', async () => {
    const t = convexTest(schema, modules);
    await setupUser(t);

    const nodeId = await t.run(async (ctx) => {
      const otherUserId = await ctx.db.insert('users', {
        displayName: 'Other',
        userType: 'human',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return ctx.db.insert('nodes', {
        title: 'Not Yours',
        content: 'content',
        searchText: 'Not Yours\n\ncontent',
        ownerUserId: otherUserId,
        publishedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const asSarah = t.withIdentity(IDENTITY);
    await expect(
      asSarah.mutation(api.nodes.archiveNode, { nodeId }),
    ).rejects.toThrow();
  });
});

// ─── unarchiveNode ───────────────────────────────────────────────────────────

describe('unarchiveNode', () => {
  test('restores node and connected edges', async () => {
    const t = convexTest(schema, modules);
    const userId = await setupUser(t);

    const { nodeId, edgeId } = await t.run(async (ctx) => {
      const now = Date.now();
      const nodeId = await ctx.db.insert('nodes', {
        title: 'Archived',
        content: 'content',
        searchText: 'Archived\n\ncontent',
        ownerUserId: userId,
        publishedAt: now,
        archivedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      const otherNodeId = await ctx.db.insert('nodes', {
        title: 'Other',
        content: 'other',
        searchText: 'Other\n\nother',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      const edgeId = await ctx.db.insert('edges', {
        fromNodeId: nodeId,
        toNodeId: otherNodeId,
        edgeType: 'explicit',
        source: 'user',
        verified: true,
        publishedAt: now,
        archivedAt: now,
        createdAt: now,
      });
      return { nodeId, edgeId };
    });

    const asSarah = t.withIdentity(IDENTITY);
    await asSarah.mutation(api.nodes.unarchiveNode, { nodeId });

    const { node, edge } = await t.run(async (ctx) => ({
      node: await ctx.db.get(nodeId),
      edge: await ctx.db.get(edgeId),
    }));

    expect(node!.archivedAt).toBeUndefined();
    expect(edge!.archivedAt).toBeUndefined();
  });
});

// ─── getKnowledgeBasePages ───────────────────────────────────────────────────

describe('getKnowledgeBasePages', () => {
  test('returns published non-virtual nodes with edge counts', async () => {
    const t = convexTest(schema, modules);
    const userId = await setupUser(t);

    await t.run(async (ctx) => {
      const now = Date.now();

      const node1 = await ctx.db.insert('nodes', {
        title: 'Published Node',
        content: 'content',
        searchText: 'Published Node\n\ncontent',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      const node2 = await ctx.db.insert('nodes', {
        title: 'Another Published',
        content: 'content',
        searchText: 'Another Published\n\ncontent',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      // Edge between the two
      await ctx.db.insert('edges', {
        fromNodeId: node1,
        toNodeId: node2,
        edgeType: 'explicit',
        source: 'user',
        verified: true,
        publishedAt: now,
        createdAt: now,
      });

      // Draft node (should be excluded)
      await ctx.db.insert('nodes', {
        title: 'Draft',
        content: 'draft',
        searchText: 'Draft\n\ndraft',
        ownerUserId: userId,
        createdAt: now,
        updatedAt: now,
      });

      // Virtual node (should be excluded)
      await ctx.db.insert('nodes', {
        title: 'Virtual Concept',
        content: 'virtual',
        searchText: 'Virtual Concept\n\nvirtual',
        ownerUserId: userId,
        publishedAt: now,
        nodeKind: 'virtual',
        createdAt: now,
        updatedAt: now,
      });
    });

    const asSarah = t.withIdentity(IDENTITY);
    const pages = await asSarah.query(api.nodes.getKnowledgeBasePages, {});

    expect(pages).toHaveLength(2);
    const titles = pages.map((p) => p.node.title);
    expect(titles).toContain('Published Node');
    expect(titles).toContain('Another Published');

    // Both nodes have 1 edge each
    for (const page of pages) {
      expect(page.edgeCount).toBe(1);
    }
  });

  test('excludes archived nodes', async () => {
    const t = convexTest(schema, modules);
    const userId = await setupUser(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert('nodes', {
        title: 'Archived',
        content: 'archived',
        searchText: 'Archived\n\narchived',
        ownerUserId: userId,
        publishedAt: now,
        archivedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    });

    const asSarah = t.withIdentity(IDENTITY);
    const pages = await asSarah.query(api.nodes.getKnowledgeBasePages, {});
    expect(pages).toHaveLength(0);
  });
});

// ─── getNodeWithEdges ────────────────────────────────────────────────────────

describe('getNodeWithEdges', () => {
  test('returns node with resolved outgoing and incoming edges', async () => {
    const t = convexTest(schema, modules);
    const userId = await setupUser(t);

    const { nodeId, linkedNodeId } = await t.run(async (ctx) => {
      const now = Date.now();
      const nodeId = await ctx.db.insert('nodes', {
        title: 'Center Node',
        content: 'center',
        searchText: 'Center Node\n\ncenter',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      const linkedNodeId = await ctx.db.insert('nodes', {
        title: 'Linked Node',
        content: 'linked',
        searchText: 'Linked Node\n\nlinked',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert('edges', {
        fromNodeId: nodeId,
        toNodeId: linkedNodeId,
        edgeType: 'explicit',
        source: 'user',
        verified: true,
        publishedAt: now,
        createdAt: now,
      });
      return { nodeId, linkedNodeId };
    });

    const asSarah = t.withIdentity(IDENTITY);
    const result = await asSarah.query(api.nodes.getNodeWithEdges, { nodeId });

    expect(result).not.toBeNull();
    expect(result!.node.title).toBe('Center Node');
    expect(result!.outgoing).toHaveLength(1);
    expect(result!.outgoing[0]!.linkedNode).toMatchObject({
      type: 'node',
      title: 'Linked Node',
    });
    expect(result!.incoming).toHaveLength(0);
  });

  test('returns null for node not owned by user', async () => {
    const t = convexTest(schema, modules);
    await setupUser(t);

    const nodeId = await t.run(async (ctx) => {
      const otherUser = await ctx.db.insert('users', {
        displayName: 'Other',
        userType: 'human',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return ctx.db.insert('nodes', {
        title: "Other's Node",
        content: 'content',
        searchText: "Other's Node\n\ncontent",
        ownerUserId: otherUser,
        publishedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const asSarah = t.withIdentity(IDENTITY);
    const result = await asSarah.query(api.nodes.getNodeWithEdges, { nodeId });
    expect(result).toBeNull();
  });

  test("marks other users' linked nodes as private", async () => {
    const t = convexTest(schema, modules);
    const userId = await setupUser(t);

    const { nodeId } = await t.run(async (ctx) => {
      const now = Date.now();
      const otherUser = await ctx.db.insert('users', {
        displayName: 'Other',
        userType: 'human',
        createdAt: now,
        updatedAt: now,
      });

      const nodeId = await ctx.db.insert('nodes', {
        title: 'My Node',
        content: 'mine',
        searchText: 'My Node\n\nmine',
        ownerUserId: userId,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      const otherNodeId = await ctx.db.insert('nodes', {
        title: 'Private Node',
        content: 'private',
        searchText: 'Private Node\n\nprivate',
        ownerUserId: otherUser,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert('edges', {
        fromNodeId: nodeId,
        toNodeId: otherNodeId,
        edgeType: 'reference',
        source: 'processor',
        verified: true,
        publishedAt: now,
        createdAt: now,
      });

      return { nodeId };
    });

    const asSarah = t.withIdentity(IDENTITY);
    const result = await asSarah.query(api.nodes.getNodeWithEdges, { nodeId });

    expect(result!.outgoing).toHaveLength(1);
    expect(result!.outgoing[0]!.linkedNode).toEqual({ type: 'private' });
  });
});
