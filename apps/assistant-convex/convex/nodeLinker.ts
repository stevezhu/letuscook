import { v } from 'convex/values';

import { internalMutation, internalQuery } from '#convex/_generated/server.js';
import {
  createVirtualNode as createVirtualNode_,
  findNodesByTitle as findNodesByTitle_,
} from '#model/nodes.ts';

// 👀 Needs Verification
export const findNodesByTitle = internalQuery({
  args: {
    ownerUserId: v.id('users'),
    titleSubstring: v.string(),
  },
  handler: async (ctx, args) => {
    return findNodesByTitle_(ctx, args);
  },
});

// 👀 Needs Verification
export const createVirtualNode = internalMutation({
  args: {
    title: v.string(),
    ownerUserId: v.id('users'),
  },
  returns: v.id('nodes'),
  handler: async (ctx, args) => {
    return createVirtualNode_(ctx, args);
  },
});
