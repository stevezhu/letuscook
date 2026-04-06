import { google } from '@ai-sdk/google';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText, Output } from 'ai';
import { z } from 'zod';

import { internal } from '#convex/_generated/api.js';
import { Id } from '#convex/_generated/dataModel.js';
import { ActionCtx } from '#convex/_generated/server.js';
import { retryWithModelFallback } from '#lib/retryWithModelFallback.ts';

export interface NodeLinkSuggestion {
  nodeId: Id<'nodes'>;
  edgeType: 'categorized_as' | 'related';
  confidence: number;
  isNew: boolean;
}

interface ConceptItem {
  concept: string;
  confidence: number;
}

const conceptsSchema = z.object({
  concepts: z.array(
    z.object({
      concept: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

const LINKER_MODELS = [
  google('gemini-2.5-flash'),
  openrouter('google/gemini-2.5-flash'),
  google('gemini-3-flash-preview'),
];

// 👀 Needs Verification
async function identifyConceptsWithLLM(
  contentTitle: string,
  rawContent: string,
  captureType: string,
  similarNodes: { id: Id<'nodes'>; title: string; score: number }[],
): Promise<ConceptItem[]> {
  const similarNodeList =
    similarNodes.length > 0
      ? `\n\nExisting related nodes for reference:\n${similarNodes
          .map((n) => `- "${n.title}"`)
          .join('\n')}`
      : '';

  const prompt = `Given this ${captureType} content titled "${contentTitle}", suggest 1-3 organizing concepts or categories it belongs to. Each concept should be a short noun phrase (2-4 words) that could serve as a category label.${similarNodeList}

Content:
${rawContent.slice(0, 500)}`;

  const result = await retryWithModelFallback({
    models: LINKER_MODELS,
    label: 'Concept identification',
    fn: async (model) => {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: conceptsSchema }),
        system:
          'You are a knowledge organization assistant. Identify high-level organizing concepts/categories for content.',
        prompt,
        maxOutputTokens: 300,
      });
      return output && output.concepts.length > 0 ? output.concepts : undefined;
    },
  });

  return result ?? [];
}

// 👀 Needs Verification
/**
 * Given processed capture content (title + embedding + similar nodes from
 * vector search), ask LLM to identify organizing concepts this content relates
 * to. Then search for existing nodes matching those concepts, or create new
 * virtual nodes. Returns edges to create.
 */
export async function identifyOrganizingNodes(
  ctx: ActionCtx,
  args: {
    contentTitle: string;
    rawContent: string;
    captureType: string;
    embedding: number[];
    ownerUserId: Id<'users'>;
    similarNodes: { id: Id<'nodes'>; title: string; score: number }[];
  },
): Promise<NodeLinkSuggestion[]> {
  const concepts = await identifyConceptsWithLLM(
    args.contentTitle,
    args.rawContent,
    args.captureType,
    args.similarNodes,
  );

  if (concepts.length === 0) return [];

  // Run all title searches in parallel
  const matchResults = await Promise.all(
    concepts.map(({ concept }) =>
      ctx.runQuery(internal.nodeLinker.findNodesByTitle, {
        ownerUserId: args.ownerUserId,
        titleSubstring: concept,
      }),
    ),
  );

  // For concepts with no match, create virtual nodes in parallel
  const needsNewNode = concepts
    .map((c, i) => ({ ...c, matches: matchResults[i] ?? [], index: i }))
    .filter(({ matches }) => matches.length === 0);

  const newNodeIds = await Promise.all(
    needsNewNode.map(({ concept }) =>
      ctx.runMutation(internal.nodeLinker.createVirtualNode, {
        title: concept,
        ownerUserId: args.ownerUserId,
      }),
    ),
  );

  // Build a map from concept index to new nodeId
  const newNodeIdByIndex = new Map<number, Id<'nodes'>>();
  needsNewNode.forEach(({ index }, i) => {
    const nodeId = newNodeIds[i];
    if (nodeId !== undefined) {
      newNodeIdByIndex.set(index, nodeId);
    }
  });

  const suggestions: NodeLinkSuggestion[] = [];
  concepts.forEach(({ confidence }, i) => {
    const matches = matchResults[i] ?? [];
    if (matches.length > 0) {
      const firstMatch = matches[0];
      if (firstMatch) {
        suggestions.push({
          nodeId: firstMatch.id,
          edgeType: 'categorized_as' as const,
          confidence,
          isNew: false,
        });
      }
    } else {
      const nodeId = newNodeIdByIndex.get(i);
      if (nodeId !== undefined) {
        suggestions.push({
          nodeId,
          edgeType: 'categorized_as' as const,
          confidence,
          isNew: true,
        });
      }
    }
  });

  return suggestions;
}
