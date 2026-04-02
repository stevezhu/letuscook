import { google } from '@ai-sdk/google';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

import { internal } from '#convex/_generated/api.js';
import { Id } from '#convex/_generated/dataModel.js';
import { ActionCtx } from '#convex/_generated/server.js';

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

const LINKER_MODELS = [
  google('gemini-2.5-flash'),
  openrouter('google/gemini-2.5-flash'),
  google('gemini-3-flash-preview'),
];

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract concept/confidence pairs from LLM text using regex. Handles JSON with
 * single quotes, unquoted keys, markdown fences, etc.
 */
// 👀 Needs Verification
function extractConceptsFromText(text: string): ConceptItem[] {
  const concepts: ConceptItem[] = [];
  // Match patterns like "concept": "Something", "confidence": 0.9
  // or 'concept': 'Something', 'confidence': 0.9
  // or concept: "Something", confidence: 0.9
  const conceptPattern =
    /["']?concept["']?\s*:\s*["']([^"']+)["']\s*,\s*["']?confidence["']?\s*:\s*([\d.]+)/gi;
  let match;
  while ((match = conceptPattern.exec(text)) !== null) {
    const concept = match[1];
    const confidence = parseFloat(match[2] ?? '0');
    if (concept && !isNaN(confidence)) {
      concepts.push({
        concept,
        confidence: Math.max(0, Math.min(1, confidence)),
      });
    }
  }
  return concepts;
}

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
${rawContent.slice(0, 500)}

Return a JSON array only, no markdown, no explanation. Example format:
[{"concept":"Machine Learning","confidence":0.9},{"concept":"Research Papers","confidence":0.75}]`;

  for (const model of LINKER_MODELS) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // eslint-disable-next-line no-await-in-loop -- sequential retry with backoff is intentional
        const { text } = await generateText({
          model,
          system:
            'You are a knowledge organization assistant. Identify high-level organizing concepts/categories for content. Always respond with valid JSON only.',
          prompt,
          maxOutputTokens: 300,
        });

        // Extract concepts using regex — more robust than JSON.parse for
        // LLM output that may use single quotes, unquoted keys, etc.
        const concepts = extractConceptsFromText(text);
        if (concepts.length > 0) return concepts;
        console.warn(
          `No concepts extracted from LLM response (${model.modelId}, attempt ${attempt + 1}/${MAX_RETRIES}):`,
          text.slice(0, 200),
        );
      } catch (error) {
        console.error(
          `Concept identification failed (${model.modelId}, attempt ${attempt + 1}/${MAX_RETRIES}):`,
          error,
        );
        if (attempt < MAX_RETRIES - 1) {
          // eslint-disable-next-line no-await-in-loop -- sequential retry with backoff is intentional
          await sleep(BASE_DELAY_MS * 2 ** attempt);
        }
      }
    }
    console.warn(
      `All retries exhausted for ${model.modelId}, trying next provider`,
    );
  }

  return [];
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
