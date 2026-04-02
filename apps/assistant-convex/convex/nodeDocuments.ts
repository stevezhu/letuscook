import { google } from '@ai-sdk/google';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { pick } from 'convex-helpers';
import { ConvexError, v } from 'convex/values';

import { internal } from '#convex/_generated/api.js';
import { Id } from '#convex/_generated/dataModel.js';
import {
  internalAction,
  internalMutation,
  internalQuery,
} from '#convex/_generated/server.js';
import { nodeDocumentFields } from '#convex/schema.ts';
import { EntityNotFoundError } from '#lib/errors.ts';
import { pickOptional } from '#lib/helpers.ts';
import { authMutation, authQuery } from '#model/customFunctions.ts';
import { getCurrentUser, getDocOwnedByCurrentUser } from '#model/users.ts';

// ─── LLM setup ────────────────────────────────────────────────────────────────

const DOCUMENT_MODELS = [
  google('gemini-2.5-flash'),
  openrouter('google/gemini-2.5-flash'),
  google('gemini-3-flash-preview'),
];

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Public mutations ─────────────────────────────────────────────────────────

// 👀 Needs Verification
/**
 * Schedules document generation for a node.
 */
export const generateDocument = authMutation({
  args: { nodeId: v.id('nodes') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const node = await getDocOwnedByCurrentUser(ctx, 'nodes', args.nodeId);
    if (!node) {
      throw new EntityNotFoundError({
        tableName: 'nodes',
        argName: 'nodeId',
        argValue: args.nodeId,
      });
    }

    // Determine next version number
    const latest = await ctx.db
      .query('nodeDocuments')
      .withIndex('by_node_version', (q) => q.eq('nodeId', args.nodeId))
      .order('desc')
      .first();
    const nextVersion = latest ? latest.version + 1 : 1;

    await ctx.scheduler.runAfter(
      0,
      internal.nodeDocuments.generateDocumentAction,
      {
        nodeId: args.nodeId,
        version: nextVersion,
        ownerUserId: node.ownerUserId,
      },
    );

    return null;
  },
});

// 👀 Needs Verification
/**
 * Manually updates the content of a document. Sets isEdited to true.
 */
export const updateDocument = authMutation({
  args: {
    documentId: v.id('nodeDocuments'),
    ...pickOptional(nodeDocumentFields, ['title', 'content']),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new ConvexError('Unauthenticated');

    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.ownerUserId !== user._id) {
      throw new EntityNotFoundError({
        tableName: 'nodeDocuments',
        argName: 'documentId',
        argValue: args.documentId,
      });
    }

    const patch: { title?: string; content?: string; isEdited: boolean } = {
      isEdited: true,
    };
    if (args.title !== undefined) patch.title = args.title;
    if (args.content !== undefined) patch.content = args.content;

    await ctx.db.patch('nodeDocuments', args.documentId, patch);
    return null;
  },
});

// ─── Public queries ───────────────────────────────────────────────────────────

// 👀 Needs Verification
/**
 * Returns all documents for a node, sorted by version descending.
 */
export const getNodeDocuments = authQuery({
  args: { nodeId: v.id('nodes') },
  handler: async (ctx, args) => {
    const [user, node] = await Promise.all([
      getCurrentUser(ctx),
      ctx.db.get(args.nodeId),
    ]);
    if (!node || node.ownerUserId !== user?._id) return null;

    return ctx.db
      .query('nodeDocuments')
      .withIndex('by_node_version', (q) => q.eq('nodeId', args.nodeId))
      .order('desc')
      .collect();
  },
});

// 👀 Needs Verification
/**
 * Returns the latest document for a node.
 */
export const getLatestDocument = authQuery({
  args: { nodeId: v.id('nodes') },
  handler: async (ctx, args) => {
    const [user, node] = await Promise.all([
      getCurrentUser(ctx),
      ctx.db.get(args.nodeId),
    ]);
    if (!node || node.ownerUserId !== user?._id) return null;

    return ctx.db
      .query('nodeDocuments')
      .withIndex('by_node_version', (q) => q.eq('nodeId', args.nodeId))
      .order('desc')
      .first();
  },
});

// ─── Internal action ──────────────────────────────────────────────────────────

// 👀 Needs Verification
/**
 * Fetches node activity, builds a prompt, calls the LLM, and saves the result.
 */
export const generateDocumentAction = internalAction({
  args: {
    nodeId: v.id('nodes'),
    version: v.number(),
    ownerUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const edgesCutoff = Date.now();

    // Fetch node and its incoming edges
    const node = await ctx.runQuery(
      internal.nodeDocuments.getNodeForDocumentGeneration,
      { nodeId: args.nodeId },
    );
    if (!node) {
      throw new ConvexError('Node not found');
    }

    // Fetch activity: incoming edges → fromNodes → captures → linkMetadata
    const activityItems = await ctx.runQuery(
      internal.nodeDocuments.getNodeActivityForDocument,
      { nodeId: args.nodeId },
    );

    // Build prompt content
    const contentParts: string[] = [];
    contentParts.push(`# Node: ${node.title}`);
    if (node.content) {
      contentParts.push(`\n## Node Description\n${node.content}`);
    }

    if (activityItems.length > 0) {
      contentParts.push('\n## Related Content');
      for (const item of activityItems) {
        const sourceTitle = item.linkMetadata?.title ?? item.fromNode.title;
        const sourceContent =
          item.capture?.rawContent ?? item.fromNode.content ?? '';
        const snippet = item.linkMetadata?.contentSnippet;
        const description = item.linkMetadata?.description;

        let entry = `### ${sourceTitle}`;
        if (description) entry += `\n${description}`;
        if (sourceContent) entry += `\n${sourceContent.slice(0, 500)}`;
        if (snippet) entry += `\n\n${snippet.slice(0, 500)}`;
        contentParts.push(entry);
      }
    }

    const userPrompt = contentParts.join('\n\n');

    const systemPrompt = `You are a knowledge assistant. Generate a comprehensive, well-structured markdown document summarizing the given knowledge node and its related content.

The document should:
- Start with a brief introduction/summary
- Organize the related content into logical sections
- Use markdown formatting with headers, bullet points where appropriate
- Be informative and useful as a reference document
- The first line should be a top-level heading with the document title

Return ONLY the markdown content, no preamble or metadata.`;

    let generatedContent = '';
    let generatedTitle = node.title;

    for (const model of DOCUMENT_MODELS) {
      let succeeded = false;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          // eslint-disable-next-line no-await-in-loop -- sequential retry with backoff is intentional
          const { text } = await generateText({
            model,
            system: systemPrompt,
            prompt: userPrompt,
          });
          if (text.trim().length > 0) {
            generatedContent = text.trim();
            // Extract title from first heading if present
            const firstLine = generatedContent.split('\n')[0];
            if (firstLine?.startsWith('# ')) {
              generatedTitle = firstLine.slice(2).trim();
            }
            succeeded = true;
            break;
          }
        } catch (error) {
          console.error(
            `Document generation failed (${model.modelId}, attempt ${attempt + 1}/${MAX_RETRIES}):`,
            error,
          );
          if (attempt < MAX_RETRIES - 1) {
            // eslint-disable-next-line no-await-in-loop -- sequential retry with backoff is intentional
            await sleep(BASE_DELAY_MS * 2 ** attempt);
          }
        }
      }
      if (succeeded) break;
      console.warn(
        `All retries exhausted for ${model.modelId}, trying next provider`,
      );
    }

    if (!generatedContent) {
      generatedContent = `# ${node.title}\n\nDocument generation failed. Please try again.`;
    }

    await ctx.runMutation(internal.nodeDocuments.saveGeneratedDocument, {
      nodeId: args.nodeId,
      version: args.version,
      title: generatedTitle,
      content: generatedContent,
      generatedAt: edgesCutoff,
      generatedFromEdgesUpTo: edgesCutoff,
      ownerUserId: args.ownerUserId,
    });
  },
});

// ─── Internal mutations & queries ─────────────────────────────────────────────

// 👀 Needs Verification
export const saveGeneratedDocument = internalMutation({
  args: pick(nodeDocumentFields, [
    'nodeId',
    'version',
    'title',
    'content',
    'generatedAt',
    'generatedFromEdgesUpTo',
    'ownerUserId',
  ]),
  returns: v.id('nodeDocuments'),
  handler: async (ctx, args) => {
    return ctx.db.insert('nodeDocuments', {
      nodeId: args.nodeId,
      version: args.version,
      title: args.title,
      content: args.content,
      generatedAt: args.generatedAt,
      generatedFromEdgesUpTo: args.generatedFromEdgesUpTo,
      isEdited: false,
      ownerUserId: args.ownerUserId,
    });
  },
});

// 👀 Needs Verification
export const getNodeForDocumentGeneration = internalQuery({
  args: { nodeId: v.id('nodes') },
  returns: v.union(
    v.object({
      _id: v.id('nodes'),
      title: v.string(),
      content: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const node = await ctx.db.get(args.nodeId);
    if (!node) return null;
    return { _id: node._id, title: node.title, content: node.content };
  },
});

// 👀 Needs Verification
export const getNodeActivityForDocument = internalQuery({
  args: { nodeId: v.id('nodes') },
  returns: v.array(
    v.object({
      fromNode: v.object({
        _id: v.id('nodes'),
        title: v.string(),
        content: v.string(),
      }),
      capture: v.union(
        v.object({
          _id: v.id('captures'),
          rawContent: v.string(),
          captureType: v.union(
            v.literal('text'),
            v.literal('link'),
            v.literal('task'),
          ),
        }),
        v.null(),
      ),
      linkMetadata: v.union(
        v.object({
          title: v.optional(v.string()),
          description: v.optional(v.string()),
          contentSnippet: v.optional(v.string()),
          url: v.string(),
        }),
        v.null(),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const incomingEdges = await ctx.db
      .query('edges')
      .withIndex('by_archivedAt_to_node', (q) =>
        q.eq('archivedAt', undefined).eq('toNodeId', args.nodeId),
      )
      .collect();

    const resolvedItems = await Promise.all(
      incomingEdges.map(async (edge) => {
        const fromNode = await ctx.db.get(edge.fromNodeId);
        if (!fromNode) return null;

        let capture: {
          _id: Id<'captures'>;
          rawContent: string;
          captureType: 'text' | 'link' | 'task';
        } | null = null;
        let linkMetadata: {
          title?: string;
          description?: string;
          contentSnippet?: string;
          url: string;
        } | null = null;

        if (fromNode.sourceCaptureId) {
          const [captureDoc, meta] = await Promise.all([
            ctx.db.get(fromNode.sourceCaptureId),
            ctx.db
              .query('linkMetadata')
              .withIndex('by_capture', (q) =>
                q.eq('captureId', fromNode.sourceCaptureId!),
              )
              .unique(),
          ]);

          if (captureDoc) {
            capture = {
              _id: captureDoc._id,
              rawContent: captureDoc.rawContent,
              captureType: captureDoc.captureType,
            };
          }
          if (meta) {
            linkMetadata = {
              title: meta.title,
              description: meta.description,
              contentSnippet: meta.contentSnippet,
              url: meta.url,
            };
          }
        }

        return {
          fromNode: {
            _id: fromNode._id,
            title: fromNode.title,
            content: fromNode.content,
          },
          capture,
          linkMetadata,
        };
      }),
    );

    return resolvedItems.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    );
  },
});
