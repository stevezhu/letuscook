import { ConvexError, v } from 'convex/values';

import { internal } from '#convex/_generated/api.js';
import {
  internalAction,
  internalMutation,
  internalQuery,
} from '#convex/_generated/server.js';
import {
  getCurrentUser,
  getDocOwnedByCurrentUser,
} from '#convex/model/users.ts';
import { authMutation, authQuery } from '#convex/utils/customFunctions.ts';

// ─── Queries ──────────────────────────────────────────────────────────────────

// 👀 Needs Verification
export const getUserTopics = authQuery({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const topics = await ctx.db
      .query('topics')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', user._id))
      .collect();

    return Promise.all(
      topics.map(async (topic) => {
        const nodeTopics = await ctx.db
          .query('nodeTopics')
          .withIndex('by_topic', (q) => q.eq('topicId', topic._id))
          .collect();
        return Object.assign(topic, { nodeCount: nodeTopics.length });
      }),
    );
  },
});

// 👀 Needs Verification
export const getTopicNodes = authQuery({
  args: { topicId: v.id('topics') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const topic = await ctx.db.get(args.topicId);
    if (!topic || topic.ownerUserId !== user._id) return [];

    const nodeTopics = await ctx.db
      .query('nodeTopics')
      .withIndex('by_topic', (q) => q.eq('topicId', args.topicId))
      .collect();

    const nodes = await Promise.all(
      nodeTopics.map(async (nt) => {
        const node = await ctx.db.get(nt.nodeId);
        if (!node) return null;
        return Object.assign(node, {
          confidence: nt.confidence,
          topicSource: nt.source,
        });
      }),
    );
    return nodes.filter(Boolean);
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

// 👀 Needs Verification
export const createUserTopic = authMutation({
  args: { label: v.string() },
  returns: v.id('topics'),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new ConvexError('Not authenticated');
    const now = Date.now();
    return ctx.db.insert('topics', {
      label: args.label,
      ownerUserId: user._id,
      isUserDefined: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// 👀 Needs Verification
export const renameTopic = authMutation({
  args: { topicId: v.id('topics'), label: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const topic = await getDocOwnedByCurrentUser(ctx, 'topics', args.topicId);
    if (!topic) throw new ConvexError('Topic not found');
    await ctx.db.patch('topics', args.topicId, {
      label: args.label,
      updatedAt: Date.now(),
    });
    return null;
  },
});

// 👀 Needs Verification
export const assignNodeToTopic = authMutation({
  args: { nodeId: v.id('nodes'), topicId: v.id('topics') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new ConvexError('Not authenticated');

    const [node, topic] = await Promise.all([
      ctx.db.get(args.nodeId),
      ctx.db.get(args.topicId),
    ]);
    if (!node || node.ownerUserId !== user._id)
      throw new ConvexError('Node not found');
    if (!topic || topic.ownerUserId !== user._id)
      throw new ConvexError('Topic not found');

    // Check if already assigned
    const existing = await ctx.db
      .query('nodeTopics')
      .withIndex('by_node', (q) => q.eq('nodeId', args.nodeId))
      .filter((q) => q.eq(q.field('topicId'), args.topicId))
      .first();
    if (existing) return null;

    await ctx.db.insert('nodeTopics', {
      nodeId: args.nodeId,
      topicId: args.topicId,
      source: 'user',
      createdAt: Date.now(),
    });
    return null;
  },
});

// ─── Clustering (internal) ───────────────────────────────────────────────────

// 👀 Needs Verification
export const clusterTopics = internalAction({
  args: { ownerUserId: v.id('users') },
  handler: async (ctx, args) => {
    const { kMeans } = await import('#convex/ai/clustering.ts');

    // Fetch all published nodes with embeddings
    const nodes = await ctx.runQuery(
      internal.topics.getPublishedNodesWithEmbeddings,
      { ownerUserId: args.ownerUserId },
    );

    if (nodes.length < 3) return; // Need at least 3 nodes to cluster

    const vectors = nodes
      .filter((n) => !!n.embedding)
      .map((n) => ({ id: n._id, vector: n.embedding!, title: n.title }));

    if (vectors.length < 3) return;

    const clusters = kMeans(
      vectors.map((v) => v.vector),
      Math.min(Math.ceil(vectors.length / 3), 10),
    );

    // Persist clusters
    await ctx.runMutation(internal.topics.saveClusters, {
      ownerUserId: args.ownerUserId,
      clusters: clusters.map((cluster) => ({
        nodeIds: cluster.members.map((i) => vectors[i]!.id),
        label: deriveClusterLabel(
          cluster.members.map((i) => vectors[i]!.title),
        ),
        confidences: cluster.distances,
      })),
    });
  },
});

function deriveClusterLabel(titles: string[]): string {
  const wordCounts = new Map<string, number>();
  for (const title of titles) {
    const words = title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const seen = new Set<string>();
    for (const word of words) {
      if (!seen.has(word)) {
        wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
        seen.add(word);
      }
    }
  }
  const sorted = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  return sorted.map(([w]) => w).join(', ') || 'Unnamed cluster';
}

export const getPublishedNodesWithEmbeddings = internalQuery({
  args: { ownerUserId: v.id('users') },
  handler: async (ctx, args) => {
    return ctx.db
      .query('nodes')
      .withIndex('by_owner_archivedAt', (q) =>
        q.eq('ownerUserId', args.ownerUserId).eq('archivedAt', undefined),
      )
      .filter((q) => q.neq(q.field('publishedAt'), undefined))
      .collect();
  },
});

// 👀 Needs Verification
export const saveClusters = internalMutation({
  args: {
    ownerUserId: v.id('users'),
    clusters: v.array(
      v.object({
        nodeIds: v.array(v.id('nodes')),
        label: v.string(),
        confidences: v.array(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Remove old emergent clusters and their assignments
    const oldTopics = await ctx.db
      .query('topics')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', args.ownerUserId))
      .filter((q) => q.eq(q.field('isUserDefined'), false))
      .collect();

    await Promise.all(
      oldTopics.map(async (topic) => {
        const assignments = await ctx.db
          .query('nodeTopics')
          .withIndex('by_topic', (q) => q.eq('topicId', topic._id))
          .filter((q) => q.eq(q.field('source'), 'cluster'))
          .collect();
        await Promise.all(
          assignments.map((a) => ctx.db.delete('nodeTopics', a._id)),
        );
        await ctx.db.delete('topics', topic._id);
      }),
    );

    // Create new emergent clusters
    const now = Date.now();
    await Promise.all(
      args.clusters.map(async (cluster) => {
        const topicId = await ctx.db.insert('topics', {
          label: cluster.label,
          ownerUserId: args.ownerUserId,
          isUserDefined: false,
          createdAt: now,
          updatedAt: now,
        });
        await Promise.all(
          cluster.nodeIds.map((nodeId, i) =>
            ctx.db.insert('nodeTopics', {
              nodeId,
              topicId,
              confidence: cluster.confidences[i],
              source: 'cluster',
              createdAt: now,
            }),
          ),
        );
      }),
    );
  },
});
