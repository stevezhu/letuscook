import { describe, expect } from 'vitest';

import { api, internal } from '#convex/_generated/api.js';
import { type ConvexTestInstance, test } from '#convexTest.ts';

// ─── Test Helpers ────────────────────────────────────────────────────────────

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

async function setupAgentUser(t: ConvexTestInstance) {
  return t.run(async (ctx) => {
    return ctx.db.insert('users', {
      displayName: 'AI Agent',
      userType: 'agent',
      agentProvider: 'google',
      agentModel: 'gemini',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
}

// ─── createCapture ───────────────────────────────────────────────────────────

describe('createCapture', () => {
  test('creates a text capture and sets state to processing', async ({ t }) => {
    const userId = await setupUser(t);

    const asSarah = t.withIdentity(IDENTITY);
    const captureId = await asSarah.mutation(api.captures.createCapture, {
      rawContent: 'Some interesting thought',
      captureType: 'text',
    });

    const capture = await t.run(async (ctx) => ctx.db.get(captureId));
    expect(capture).toMatchObject({
      rawContent: 'Some interesting thought',
      captureType: 'text',
      captureState: 'processing',
      ownerUserId: userId,
    });
  });

  test('auto-detects link type when text starts with http', async ({ t }) => {
    await setupUser(t);

    const asSarah = t.withIdentity(IDENTITY);
    const captureId = await asSarah.mutation(api.captures.createCapture, {
      rawContent: 'https://example.com/article',
      captureType: 'text',
    });

    const capture = await t.run(async (ctx) => ctx.db.get(captureId));
    expect(capture!.captureType).toBe('link');
  });

  test('does not auto-detect link when content has newlines', async ({ t }) => {
    await setupUser(t);

    const asSarah = t.withIdentity(IDENTITY);
    const captureId = await asSarah.mutation(api.captures.createCapture, {
      rawContent: 'https://example.com/article\nsome notes',
      captureType: 'text',
    });

    const capture = await t.run(async (ctx) => ctx.db.get(captureId));
    expect(capture!.captureType).toBe('text');
  });

  test('stores empty explicitMentionNodeIds when no mentions present', async ({
    t,
  }) => {
    await setupUser(t);

    const asSarah = t.withIdentity(IDENTITY);
    const captureId = await asSarah.mutation(api.captures.createCapture, {
      rawContent: 'No mentions here',
      captureType: 'text',
    });

    const capture = await t.run(async (ctx) => ctx.db.get(captureId));
    expect(capture!.explicitMentionNodeIds).toEqual([]);
  });

  test('rejects unauthenticated callers', async ({ t }) => {
    await expect(
      t.mutation(api.captures.createCapture, {
        rawContent: 'test',
        captureType: 'text',
      }),
    ).rejects.toThrow();
  });
});

// ─── updateCapture ───────────────────────────────────────────────────────────

describe('updateCapture', () => {
  test('updates capture content and marks pending suggestion stale', async ({
    t,
  }) => {
    const userId = await setupUser(t);
    const agentUserId = await setupAgentUser(t);

    // Create capture and suggestion
    const { captureId, suggestionId } = await t.run(async (ctx) => {
      const captureId = await ctx.db.insert('captures', {
        rawContent: 'original content',
        captureType: 'text',
        capturedAt: Date.now(),
        updatedAt: Date.now(),
        ownerUserId: userId,
        captureState: 'ready',
        explicitMentionNodeIds: [],
      });
      const nodeId = await ctx.db.insert('nodes', {
        title: 'Draft',
        content: 'original content',
        searchText: 'Draft\n\noriginal content',
        ownerUserId: userId,
        sourceCaptureId: captureId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const suggestionId = await ctx.db.insert('suggestions', {
        captureId,
        suggestorUserId: agentUserId,
        suggestedNodeId: nodeId,
        status: 'pending',
        createdAt: Date.now(),
      });
      return { captureId, suggestionId };
    });

    const asSarah = t.withIdentity(IDENTITY);
    await asSarah.mutation(api.captures.updateCapture, {
      captureId,
      rawContent: 'updated content',
    });

    const [capture, suggestion] = await t.run(async (ctx) => {
      return [
        await ctx.db.get(captureId),
        await ctx.db.get(suggestionId),
      ] as const;
    });

    expect(capture!.rawContent).toBe('updated content');
    expect(suggestion!.status).toBe('stale');
  });
});

// ─── acceptSuggestion ────────────────────────────────────────────────────────

describe('acceptSuggestion', () => {
  test('publishes draft nodes/edges and sets capture to processed', async ({
    t,
  }) => {
    const userId = await setupUser(t);
    const agentUserId = await setupAgentUser(t);

    const { captureId, suggestionId, draftNodeId, existingNodeId } =
      await t.run(async (ctx) => {
        const now = Date.now();
        const captureId = await ctx.db.insert('captures', {
          rawContent: 'test content',
          captureType: 'text',
          capturedAt: now,
          updatedAt: now,
          ownerUserId: userId,
          captureState: 'ready',
          explicitMentionNodeIds: [],
        });

        // Existing published node
        const existingNodeId = await ctx.db.insert('nodes', {
          title: 'Existing',
          content: 'existing',
          searchText: 'Existing\n\nexisting',
          ownerUserId: userId,
          publishedAt: now,
          createdAt: now,
          updatedAt: now,
        });

        // Draft node (no publishedAt)
        const draftNodeId = await ctx.db.insert('nodes', {
          title: 'Draft Node',
          content: 'test content',
          searchText: 'Draft Node\n\ntest content',
          ownerUserId: userId,
          sourceCaptureId: captureId,
          createdAt: now,
          updatedAt: now,
        });

        // Draft edge (no publishedAt)
        await ctx.db.insert('edges', {
          fromNodeId: draftNodeId,
          toNodeId: existingNodeId,
          edgeType: 'suggested',
          source: 'processor',
          verified: false,
          createdAt: now,
        });

        const suggestionId = await ctx.db.insert('suggestions', {
          captureId,
          suggestorUserId: agentUserId,
          suggestedNodeId: draftNodeId,
          status: 'pending',
          createdAt: now,
        });

        return { captureId, suggestionId, draftNodeId, existingNodeId };
      });

    const asSarah = t.withIdentity(IDENTITY);
    await asSarah.mutation(api.captures.acceptSuggestion, {
      captureId,
      suggestionId,
    });

    const { capture, suggestion, draftNode, edge } = await t.run(
      async (ctx) => {
        const edges = await ctx.db
          .query('edges')
          .withIndex('by_edge_pair', (q) =>
            q.eq('fromNodeId', draftNodeId).eq('toNodeId', existingNodeId),
          )
          .first();
        return {
          capture: await ctx.db.get(captureId),
          suggestion: await ctx.db.get(suggestionId),
          draftNode: await ctx.db.get(draftNodeId),
          edge: edges,
        };
      },
    );

    expect(capture!.captureState).toBe('processed');
    expect(capture!.nodeId).toBe(draftNodeId);
    expect(suggestion!.status).toBe('accepted');
    expect(draftNode!.publishedAt).toBeDefined();
    expect(edge!.publishedAt).toBeDefined();
    expect(edge!.verified).toBe(true);
  });
});

// ─── rejectSuggestion ────────────────────────────────────────────────────────

describe('rejectSuggestion', () => {
  test('deletes draft nodes/edges and sets capture to needs_manual', async ({
    t,
  }) => {
    const userId = await setupUser(t);
    const agentUserId = await setupAgentUser(t);

    const { captureId, suggestionId, draftNodeId, edgeId } = await t.run(
      async (ctx) => {
        const now = Date.now();
        const captureId = await ctx.db.insert('captures', {
          rawContent: 'test content',
          captureType: 'text',
          capturedAt: now,
          updatedAt: now,
          ownerUserId: userId,
          captureState: 'ready',
          explicitMentionNodeIds: [],
        });

        const existingNodeId = await ctx.db.insert('nodes', {
          title: 'Existing',
          content: 'existing',
          searchText: 'Existing\n\nexisting',
          ownerUserId: userId,
          publishedAt: now,
          createdAt: now,
          updatedAt: now,
        });

        const draftNodeId = await ctx.db.insert('nodes', {
          title: 'Draft Node',
          content: 'test content',
          searchText: 'Draft Node\n\ntest content',
          ownerUserId: userId,
          sourceCaptureId: captureId,
          createdAt: now,
          updatedAt: now,
        });

        const edgeId = await ctx.db.insert('edges', {
          fromNodeId: draftNodeId,
          toNodeId: existingNodeId,
          edgeType: 'suggested',
          source: 'processor',
          verified: false,
          createdAt: now,
        });

        const suggestionId = await ctx.db.insert('suggestions', {
          captureId,
          suggestorUserId: agentUserId,
          suggestedNodeId: draftNodeId,
          status: 'pending',
          createdAt: now,
        });

        return { captureId, suggestionId, draftNodeId, edgeId };
      },
    );

    const asSarah = t.withIdentity(IDENTITY);
    await asSarah.mutation(api.captures.rejectSuggestion, {
      captureId,
      suggestionId,
    });

    const { capture, suggestion, draftNode, edge } = await t.run(
      async (ctx) => ({
        capture: await ctx.db.get(captureId),
        suggestion: await ctx.db.get(suggestionId),
        draftNode: await ctx.db.get(draftNodeId),
        edge: await ctx.db.get(edgeId),
      }),
    );

    expect(capture!.captureState).toBe('needs_manual');
    expect(suggestion!.status).toBe('rejected');
    expect(draftNode).toBeNull();
    expect(edge).toBeNull();
  });
});

// ─── organizeCapture ─────────────────────────────────────────────────────────

describe('organizeCapture', () => {
  test('creates published node and sets capture to processed', async ({
    t,
  }) => {
    const userId = await setupUser(t);

    const captureId = await t.run(async (ctx) => {
      return ctx.db.insert('captures', {
        rawContent: 'Some important note',
        captureType: 'text',
        capturedAt: Date.now(),
        updatedAt: Date.now(),
        ownerUserId: userId,
        captureState: 'needs_manual',
        explicitMentionNodeIds: [],
      });
    });

    const asSarah = t.withIdentity(IDENTITY);
    await asSarah.mutation(api.captures.organizeCapture, {
      captureId,
      nodeTitle: 'Important Notes',
    });

    const capture = await t.run(async (ctx) => ctx.db.get(captureId));
    expect(capture!.captureState).toBe('processed');
    expect(capture!.nodeId).toBeDefined();

    const node = await t.run(async (ctx) => ctx.db.get(capture!.nodeId!));
    expect(node).toMatchObject({
      title: 'Important Notes',
      content: 'Some important note',
      ownerUserId: userId,
    });
    expect(node!.publishedAt).toBeDefined();
  });

  test('creates explicit edges for mentioned nodes', async ({ t }) => {
    const userId = await setupUser(t);

    const { captureId, mentionedNodeId } = await t.run(async (ctx) => {
      const mentionedNodeId = await ctx.db.insert('nodes', {
        title: 'Related',
        content: 'related content',
        searchText: 'Related\n\nrelated content',
        ownerUserId: userId,
        publishedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const captureId = await ctx.db.insert('captures', {
        rawContent: `See @[Related](node:${mentionedNodeId})`,
        captureType: 'text',
        capturedAt: Date.now(),
        updatedAt: Date.now(),
        ownerUserId: userId,
        captureState: 'needs_manual',
        explicitMentionNodeIds: [mentionedNodeId],
      });
      return { captureId, mentionedNodeId };
    });

    const asSarah = t.withIdentity(IDENTITY);
    await asSarah.mutation(api.captures.organizeCapture, {
      captureId,
      nodeTitle: 'My Note',
    });

    const edges = await t.run(async (ctx) => {
      return ctx.db
        .query('edges')
        .filter((q) => q.eq(q.field('toNodeId'), mentionedNodeId))
        .collect();
    });

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      toNodeId: mentionedNodeId,
      edgeType: 'explicit',
      source: 'user',
      verified: true,
    });
  });
});

// ─── archiveCapture / unarchiveCapture ───────────────────────────────────────

describe('archiveCapture', () => {
  test('sets archivedAt on the capture', async ({ t }) => {
    const userId = await setupUser(t);

    const captureId = await t.run(async (ctx) => {
      return ctx.db.insert('captures', {
        rawContent: 'to archive',
        captureType: 'text',
        capturedAt: Date.now(),
        updatedAt: Date.now(),
        ownerUserId: userId,
        captureState: 'ready',
        explicitMentionNodeIds: [],
      });
    });

    const asSarah = t.withIdentity(IDENTITY);
    await asSarah.mutation(api.captures.archiveCapture, { captureId });

    const capture = await t.run(async (ctx) => ctx.db.get(captureId));
    expect(capture!.archivedAt).toBeDefined();
  });
});

describe('unarchiveCapture', () => {
  test('clears archivedAt on the capture', async ({ t }) => {
    const userId = await setupUser(t);

    const captureId = await t.run(async (ctx) => {
      return ctx.db.insert('captures', {
        rawContent: 'archived',
        captureType: 'text',
        capturedAt: Date.now(),
        updatedAt: Date.now(),
        ownerUserId: userId,
        captureState: 'ready',
        archivedAt: Date.now(),
        explicitMentionNodeIds: [],
      });
    });

    const asSarah = t.withIdentity(IDENTITY);
    await asSarah.mutation(api.captures.unarchiveCapture, { captureId });

    const capture = await t.run(async (ctx) => ctx.db.get(captureId));
    expect(capture!.archivedAt).toBeUndefined();
  });
});

// ─── retryProcessing ─────────────────────────────────────────────────────────

describe('retryProcessing', () => {
  test('resets failed capture to processing and schedules processing', async ({
    t,
  }) => {
    const userId = await setupUser(t);

    const captureId = await t.run(async (ctx) => {
      return ctx.db.insert('captures', {
        rawContent: 'failed capture',
        captureType: 'text',
        capturedAt: Date.now(),
        updatedAt: Date.now(),
        ownerUserId: userId,
        captureState: 'failed',
        explicitMentionNodeIds: [],
      });
    });

    const asSarah = t.withIdentity(IDENTITY);
    await asSarah.mutation(api.captures.retryProcessing, { captureId });

    const capture = await t.run(async (ctx) => ctx.db.get(captureId));
    expect(capture!.captureState).toBe('processing');
  });

  test('rejects retry on non-failed capture', async ({ t }) => {
    const userId = await setupUser(t);

    const captureId = await t.run(async (ctx) => {
      return ctx.db.insert('captures', {
        rawContent: 'ready capture',
        captureType: 'text',
        capturedAt: Date.now(),
        updatedAt: Date.now(),
        ownerUserId: userId,
        captureState: 'ready',
        explicitMentionNodeIds: [],
      });
    });

    const asSarah = t.withIdentity(IDENTITY);
    await expect(
      asSarah.mutation(api.captures.retryProcessing, { captureId }),
    ).rejects.toThrow();
  });
});

// ─── saveEmbeddingResult (internal) ──────────────────────────────────────────

describe('saveEmbeddingResult', () => {
  test('creates draft node, edges, and suggestion', async ({ t }) => {
    const userId = await setupUser(t);
    const agentUserId = await setupAgentUser(t);

    const { captureId, existingNodeId } = await t.run(async (ctx) => {
      const captureId = await ctx.db.insert('captures', {
        rawContent: 'test content',
        captureType: 'text',
        capturedAt: Date.now(),
        updatedAt: Date.now(),
        ownerUserId: userId,
        captureState: 'processing',
        explicitMentionNodeIds: [],
      });
      const existingNodeId = await ctx.db.insert('nodes', {
        title: 'Similar Node',
        content: 'similar',
        searchText: 'Similar Node\n\nsimilar',
        ownerUserId: userId,
        publishedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { captureId, existingNodeId };
    });

    const fakeEmbedding = Array.from({ length: 768 }, () => 0.1);

    await t.mutation(internal.captures.saveEmbeddingResult, {
      captureId,
      agentUserId,
      title: 'Test Title',
      rawContent: 'test content',
      embedding: fakeEmbedding,
      ownerUserId: userId,
      similarNodeIds: [existingNodeId],
      similarNodeScores: [0.85],
      explicitMentionNodeIds: [],
    });

    const { capture, suggestion, draftNode, edges } = await t.run(
      async (ctx) => {
        const capture = await ctx.db.get(captureId);
        const suggestion = await ctx.db
          .query('suggestions')
          .withIndex('by_capture', (q) => q.eq('captureId', captureId))
          .first();
        const draftNode = suggestion
          ? await ctx.db.get(suggestion.suggestedNodeId)
          : null;
        const edges = draftNode
          ? await ctx.db
              .query('edges')
              .withIndex('by_edge_pair', (q) =>
                q.eq('fromNodeId', draftNode._id),
              )
              .collect()
          : [];
        return { capture, suggestion, draftNode, edges };
      },
    );

    expect(capture!.captureState).toBe('ready');
    expect(suggestion).toMatchObject({
      captureId,
      suggestorUserId: agentUserId,
      status: 'pending',
    });
    expect(draftNode).toMatchObject({
      title: 'Test Title',
      content: 'test content',
      ownerUserId: userId,
    });
    expect(draftNode!.publishedAt).toBeUndefined();
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      toNodeId: existingNodeId,
      edgeType: 'suggested',
      confidence: 0.85,
    });
  });
});

// ─── getInboxCaptures ────────────────────────────────────────────────────────

describe('getInboxCaptures', () => {
  test('returns captures grouped by state with suggestions', async ({ t }) => {
    const userId = await setupUser(t);
    const agentUserId = await setupAgentUser(t);

    await t.run(async (ctx) => {
      const now = Date.now();

      // Processing capture
      await ctx.db.insert('captures', {
        rawContent: 'processing',
        captureType: 'text',
        capturedAt: now,
        updatedAt: now,
        ownerUserId: userId,
        captureState: 'processing',
        explicitMentionNodeIds: [],
      });

      // Ready capture with suggestion
      const readyCaptureId = await ctx.db.insert('captures', {
        rawContent: 'ready with suggestion',
        captureType: 'text',
        capturedAt: now - 1000,
        updatedAt: now,
        ownerUserId: userId,
        captureState: 'ready',
        explicitMentionNodeIds: [],
      });
      const nodeId = await ctx.db.insert('nodes', {
        title: 'Suggested',
        content: 'suggested',
        searchText: 'Suggested\n\nsuggested',
        ownerUserId: userId,
        sourceCaptureId: readyCaptureId,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert('suggestions', {
        captureId: readyCaptureId,
        suggestorUserId: agentUserId,
        suggestedNodeId: nodeId,
        status: 'pending',
        createdAt: now,
      });

      // Failed capture
      await ctx.db.insert('captures', {
        rawContent: 'failed',
        captureType: 'text',
        capturedAt: now - 2000,
        updatedAt: now,
        ownerUserId: userId,
        captureState: 'failed',
        explicitMentionNodeIds: [],
      });
    });

    const asSarah = t.withIdentity(IDENTITY);
    const inbox = await asSarah.query(api.captures.getInboxCaptures, {});

    expect(inbox).toHaveLength(3);
    // Sorted by capturedAt desc
    expect(inbox[0]!.capture.rawContent).toBe('processing');
    expect(inbox[1]!.capture.rawContent).toBe('ready with suggestion');
    expect(inbox[1]!.suggestion).not.toBeNull();
    expect(inbox[2]!.capture.rawContent).toBe('failed');
  });

  test('excludes archived and processed captures', async ({ t }) => {
    const userId = await setupUser(t);

    await t.run(async (ctx) => {
      const now = Date.now();
      // Archived capture
      await ctx.db.insert('captures', {
        rawContent: 'archived',
        captureType: 'text',
        capturedAt: now,
        updatedAt: now,
        ownerUserId: userId,
        captureState: 'ready',
        archivedAt: now,
        explicitMentionNodeIds: [],
      });
      // Processed capture
      await ctx.db.insert('captures', {
        rawContent: 'processed',
        captureType: 'text',
        capturedAt: now,
        updatedAt: now,
        ownerUserId: userId,
        captureState: 'processed',
        explicitMentionNodeIds: [],
      });
    });

    const asSarah = t.withIdentity(IDENTITY);
    const inbox = await asSarah.query(api.captures.getInboxCaptures, {});
    expect(inbox).toHaveLength(0);
  });
});
