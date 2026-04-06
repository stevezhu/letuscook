/**
 * Any AI SDK model object that has a modelId for logging.
 */
interface ModelWithId {
  modelId: string;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function across multiple LLM models with exponential backoff. The
 * provided `fn` should return `undefined` to signal that the attempt produced
 * no usable result (triggering a retry) or throw to trigger error-path retry.
 */
export async function retryWithModelFallback<T, M extends ModelWithId>(opts: {
  models: M[];
  fn: (model: M) => Promise<T | undefined>;
  maxRetries?: number;
  baseDelayMs?: number;
  label?: string;
}): Promise<T | undefined> {
  const {
    models,
    fn,
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    label = 'LLM call',
  } = opts;

  for (const model of models) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // eslint-disable-next-line no-await-in-loop -- sequential retry with backoff is intentional
        const result = await fn(model);
        if (result !== undefined) return result;
      } catch (error) {
        console.error(
          `${label} failed (${model.modelId}, attempt ${attempt + 1}/${maxRetries}):`,
          error,
        );
        if (attempt < maxRetries - 1) {
          // eslint-disable-next-line no-await-in-loop -- sequential retry with backoff is intentional
          await sleep(baseDelayMs * 2 ** attempt);
        }
      }
    }
    console.warn(
      `All retries exhausted for ${model.modelId}, trying next provider`,
    );
  }

  return undefined;
}
