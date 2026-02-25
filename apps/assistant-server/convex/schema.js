import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    displayName: v.string(),
    email: v.optional(v.string()),
    workosUserId: v.optional(v.string()),
    userType: v.union(v.literal('human'), v.literal('agent')),
    agentProvider: v.optional(v.string()),
    agentModel: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workos_user_id', ['workosUserId'])
    .index('by_user_type', ['userType']),
  captures: defineTable({
    rawContent: v.string(),
    captureType: v.union(
      v.literal('text'),
      v.literal('link'),
      v.literal('task'),
    ),
    capturedAt: v.number(),
    updatedAt: v.number(),
    archivedAt: v.optional(v.number()),
    ownerUserId: v.id('users'),
    captureState: v.union(
      v.literal('processing'),
      v.literal('ready'),
      v.literal('failed'),
      v.literal('needs_manual'),
      v.literal('processed'),
    ),
    nodeId: v.optional(v.id('nodes')),
    explicitMentionNodeIds: v.array(v.id('nodes')),
  })
    .index('by_owner_capture_state', ['ownerUserId', 'captureState'])
    .index('by_owner_archivedAt', ['ownerUserId', 'archivedAt'])
    .index('by_owner_archivedAt_capture_state', [
      'ownerUserId',
      'archivedAt',
      'captureState',
    ])
    .index('by_owner_node', ['ownerUserId', 'nodeId'])
    .searchIndex('search_raw', {
      searchField: 'rawContent',
      filterFields: ['ownerUserId', 'captureState', 'archivedAt'],
    }),
  nodes: defineTable({
    title: v.string(),
    content: v.string(),
    searchText: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    ownerUserId: v.id('users'),
    publishedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
    sourceCaptureId: v.optional(v.id('captures')),
  })
    .index('by_owner_archivedAt_publishedAt_updatedAt', [
      'ownerUserId',
      'archivedAt',
      'publishedAt',
      'updatedAt',
    ])
    .index('by_owner_archivedAt', ['ownerUserId', 'archivedAt'])
    .searchIndex('search_nodes', {
      searchField: 'searchText',
      filterFields: ['ownerUserId', 'archivedAt', 'publishedAt'],
    }),
  edges: defineTable({
    fromNodeId: v.id('nodes'),
    toNodeId: v.id('nodes'),
    publishedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
    edgeType: v.union(
      v.literal('explicit'),
      v.literal('suggested'),
      v.literal('reference'),
      v.literal('related'),
    ),
    source: v.union(v.literal('user'), v.literal('processor')),
    verified: v.boolean(),
    confidence: v.optional(v.number()),
    createdAt: v.number(),
    label: v.optional(v.string()),
  })
    .index('by_edge_pair', ['fromNodeId', 'toNodeId'])
    .index('by_archivedAt_from_node', ['archivedAt', 'fromNodeId'])
    .index('by_archivedAt_to_node', ['archivedAt', 'toNodeId'])
    .index('by_publishedAt_archivedAt_from_node', [
      'publishedAt',
      'archivedAt',
      'fromNodeId',
    ])
    .index('by_publishedAt_archivedAt_to_node', [
      'publishedAt',
      'archivedAt',
      'toNodeId',
    ]),
  suggestions: defineTable({
    captureId: v.id('captures'),
    suggestorUserId: v.id('users'),
    suggestedNodeId: v.id('nodes'),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('rejected'),
      v.literal('stale'),
    ),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index('by_capture', ['captureId'])
    .index('by_suggestor', ['suggestorUserId'])
    .index('by_capture_status', ['captureId', 'status']),
});
