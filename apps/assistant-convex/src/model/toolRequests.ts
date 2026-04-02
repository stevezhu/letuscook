import { Id } from '#convex/_generated/dataModel.js';
import { MutationCtx } from '#convex/_generated/server.js';

// 👀 Needs Verification
export async function logToolRequest(
  ctx: MutationCtx,
  args: {
    description: string;
    domain?: string;
    ownerUserId: Id<'users'>;
  },
) {
  const existing = await ctx.db
    .query('toolRequests')
    .withIndex('by_owner_status', (q) =>
      q.eq('ownerUserId', args.ownerUserId).eq('status', 'open'),
    )
    .filter((q) => q.eq(q.field('domain'), args.domain))
    .first();

  if (existing) {
    await ctx.db.patch('toolRequests', existing._id, {
      frequency: existing.frequency + 1,
    });
  } else {
    await ctx.db.insert('toolRequests', {
      description: args.description,
      domain: args.domain,
      frequency: 1,
      status: 'open',
      createdAt: Date.now(),
      ownerUserId: args.ownerUserId,
    });
  }
}
