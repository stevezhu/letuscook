import { google } from '@ai-sdk/google';
import { embed, generateText } from 'ai';

import { EMBEDDING_DIMENSIONS } from '#convex/constants.ts';

const EMBEDDING_MODEL = google.embeddingModel('gemini-embedding-2-preview');

// 👀 Needs Verification
export async function embedText(text: string): Promise<number[]> {
  // TODO: normalize embeddings
  // https://ai.google.dev/gemini-api/docs/embeddings#quality-for-smaller-dimensions
  const { embedding } = await embed({
    model: EMBEDDING_MODEL,
    value: text,
    providerOptions: {
      google: { outputDimensionality: EMBEDDING_DIMENSIONS },
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

// TODO: you need to run your own benchmarks
const TITLE_MODELS = [
  google('gemini-3-flash-preview'),
  // TODO: add more backup models here
  // minimax m2.7
  // kimi 2.5
];

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  for (const provider of TITLE_MODELS) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // eslint-disable-next-line no-await-in-loop -- sequential retry with backoff is intentional
        const { text } = await generateText({
          model: provider,
          system: TITLE_PROMPT,
          prompt: userPrompt,
          maxOutputTokens: 100,
        });
        const title = text.trim();
        if (title.length > 0) return title;
      } catch (error) {
        console.error(
          `Title generation failed (${provider.modelId}, attempt ${attempt + 1}/${MAX_RETRIES}):`,
          error,
        );
        if (attempt < MAX_RETRIES - 1) {
          // eslint-disable-next-line no-await-in-loop -- sequential retry with backoff is intentional
          await sleep(BASE_DELAY_MS * 2 ** attempt);
        }
      }
    }
    console.warn(
      `All retries exhausted for ${provider.modelId}, trying next provider`,
    );
  }

  // Fallback: derive title from raw content
  return rawContent.slice(0, 80).trim();
}
