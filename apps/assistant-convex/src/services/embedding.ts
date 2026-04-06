import { google } from '@ai-sdk/google';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { embed, generateText } from 'ai';

import { retryWithModelFallback } from '#lib/retryWithModelFallback.ts';

const EMBEDDING_MODEL = google.embeddingModel('gemini-embedding-2-preview');

// 👀 Needs Verification
export async function embedText(text: string): Promise<number[]> {
  // TODO: normalize embeddings
  // https://ai.google.dev/gemini-api/docs/embeddings#quality-for-smaller-dimensions
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: text,
    providerOptions: {
      google: { outputDimensionality: 768 },
    },
  });
  return embedding;
}

interface SimilarNode {
  title: string;
  content: string;
}

const TITLE_PROMPT = `Generate a concise, descriptive title (max 80 chars) for the following content. Return ONLY the title text, nothing else.`;

// 👀 Needs Verification
function buildTitleUserPrompt(
  rawContent: string,
  captureType: string,
  similarNodes: SimilarNode[],
): string {
  let prompt = `Content type: ${captureType}\n\nContent:\n${rawContent}`;
  if (similarNodes.length > 0) {
    prompt += '\n\nRelated existing nodes for context:';
    for (const node of similarNodes) {
      prompt += `\n- "${node.title}": ${node.content.slice(0, 100)}`;
    }
  }
  return prompt;
}

// Benchmarked 2026-04-01 — see .agent-logbook/research/2026-04-01_021940Z_claudecode_bench-title-generation-models.md
const TITLE_MODELS = [
  google('gemini-2.5-flash'),
  openrouter('google/gemini-2.5-flash'), // backup model
  google('gemini-3-flash-preview'),
];

// 👀 Needs Verification
export async function generateTitle(
  rawContent: string,
  captureType: string,
  similarNodes: SimilarNode[],
): Promise<string> {
  const userPrompt = buildTitleUserPrompt(
    rawContent,
    captureType,
    similarNodes,
  );

  const result = await retryWithModelFallback({
    models: TITLE_MODELS,
    label: 'Title generation',
    fn: async (model) => {
      const { text } = await generateText({
        model,
        system: TITLE_PROMPT,
        prompt: userPrompt,
        maxOutputTokens: 100,
      });
      const title = text.trim();
      return title.length > 0 ? title : undefined;
    },
  });

  // Fallback: derive title from raw content
  return result ?? rawContent.slice(0, 80).trim();
}
