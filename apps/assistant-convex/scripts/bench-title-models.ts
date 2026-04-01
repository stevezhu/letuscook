/**
 * Benchmark title generation across OpenRouter models. Usage:
 * OPENROUTER_API_KEY=sk-or-... npx tsx scripts/bench-title-models.ts
 */
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const TITLE_PROMPT = `Generate a concise, descriptive title (max 80 chars) for the following content. Return ONLY the title text, nothing else.`;

interface SimilarNode {
  title: string;
  content: string;
}

interface TestCase {
  name: string;
  captureType: string;
  rawContent: string;
  similarNodes: SimilarNode[];
}

const TEST_CASES: TestCase[] = [
  {
    name: 'Technical blog excerpt',
    captureType: 'text',
    rawContent: `The key insight behind React Server Components is that they execute only on the server, which means they can directly access databases, file systems, and other server-side resources without exposing credentials to the client. Unlike traditional SSR which serializes the full component tree, RSCs stream a special wire format that the client reconstructs. This fundamentally changes how we think about the client-server boundary in React applications, enabling patterns like async components that await database queries inline.`,
    similarNodes: [
      {
        title: 'React 19 Migration Notes',
        content:
          'Key changes in React 19 including the new use() hook, server actions, and improved suspense handling...',
      },
      {
        title: 'Server-Side Rendering Strategies',
        content:
          'Comparison of SSR approaches: traditional SSR, streaming SSR, and partial hydration patterns...',
      },
    ],
  },
  {
    name: 'Cooking recipe with measurements',
    captureType: 'text',
    rawContent: `Miso-glazed black cod: Marinate 4 fillets (6oz each) in a mixture of 3 tbsp white miso paste, 2 tbsp mirin, 1 tbsp sake, and 1 tbsp sugar for 24-72 hours. Preheat broiler to high. Remove excess marinade, place on a lined sheet pan, and broil 8-10 minutes until the miso caramelizes and the fish flakes easily. The longer marination develops a deeper umami but watch the salt — reduce if using red miso instead of white. Serve with steamed rice and pickled cucumber.`,
    similarNodes: [
      {
        title: 'Japanese Pantry Staples',
        content:
          'Essential ingredients for Japanese cooking: miso varieties, mirin, dashi, rice vinegar, soy sauce...',
      },
    ],
  },
  {
    name: 'Research paper abstract',
    captureType: 'text',
    rawContent: `We present a novel approach to continual learning that mitigates catastrophic forgetting through task-specific subnetwork isolation. Our method, Sparse Orthogonal Subspace Training (SOST), identifies near-orthogonal subspaces within a shared network for each new task, preserving previously learned representations while maintaining model capacity. On Split-CIFAR100 and Split-TinyImageNet benchmarks, SOST achieves 94.2% average accuracy across 20 sequential tasks, compared to 78.6% for EWC and 89.1% for PackNet. Crucially, SOST requires no replay buffer, making it suitable for privacy-constrained settings where storing previous task data is prohibited.`,
    similarNodes: [],
  },
  {
    name: 'Meeting notes with action items',
    captureType: 'text',
    rawContent: `Q2 planning sync — Platform team wants to deprecate the v1 REST API by end of July but mobile hasn't migrated the offline sync endpoint yet. Sarah raised that the GraphQL replacement doesn't support batch mutations which the mobile app relies on heavily for conflict resolution. Agreed to: (1) extend v1 sunset to Sept 1, (2) platform team adds batch mutation support to GraphQL by June 15, (3) mobile begins migration sprint in June. Risk: if batch mutations slip, the whole deprecation timeline shifts. Need exec sign-off on the extended timeline.`,
    similarNodes: [
      {
        title: 'API Migration Roadmap',
        content:
          'Timeline and strategy for migrating from REST v1 to GraphQL API across all client teams...',
      },
      {
        title: 'Mobile Offline Sync Architecture',
        content:
          'Design doc for mobile offline-first sync using CRDTs and batch conflict resolution...',
      },
      {
        title: 'Q1 Retrospective Notes',
        content:
          'Review of Q1 deliverables, missed deadlines on auth migration, and process improvements...',
      },
    ],
  },
  {
    name: 'Mixed-language personal note',
    captureType: 'text',
    rawContent: `Thinking about the wabi-sabi aesthetic for the new landing page — embrace imperfection instead of the overly polished SaaS look. Maybe hand-drawn illustrations? Reminds me of that studio.zeldman.com redesign from 2023. The hero could use kinetic typography with slight randomness in letter spacing, like generative art but subtle. Need to prototype in Figma first, then see if we can pull it off with CSS animations + a sprinkle of canvas. Budget concern: custom illustrations could run $2-5k.`,
    similarNodes: [
      {
        title: 'Landing Page Redesign Brief',
        content:
          'Goals for the new landing page: increase conversion by 15%, modernize visual identity, reduce load time...',
      },
    ],
  },
];

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

const MODELS = [
  'minimax/minimax-m2.7',
];

interface Result {
  model: string;
  testCase: string;
  title: string;
  latencyMs: number;
  error?: string;
}

async function runTest(modelId: string, testCase: TestCase): Promise<Result> {
  const userPrompt = buildTitleUserPrompt(
    testCase.rawContent,
    testCase.captureType,
    testCase.similarNodes,
  );
  const start = Date.now();
  try {
    const result = await generateText({
      model: openrouter(modelId),
      system: TITLE_PROMPT,
      prompt: userPrompt,
      maxOutputTokens: 1000,
    });
    if (!result.text.trim()) {
      console.log(`  [DEBUG] Empty text for ${modelId}/${testCase.name}`);
      console.log(`  [DEBUG] finishReason: ${result.finishReason}`);
      console.log(`  [DEBUG] usage: ${JSON.stringify(result.usage)}`);
      console.log(`  [DEBUG] response headers: ${JSON.stringify(result.response?.headers)}`);
      console.log(`  [DEBUG] warnings: ${JSON.stringify(result.warnings)}`);
      console.log(`  [DEBUG] raw text repr: ${JSON.stringify(result.text)}`);
    }
    return {
      model: modelId,
      testCase: testCase.name,
      title: result.text.trim(),
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    console.log(`  [DEBUG ERROR] ${modelId}/${testCase.name}: ${err}`);
    return {
      model: modelId,
      testCase: testCase.name,
      title: '',
      latencyMs: Date.now() - start,
      error: String(err),
    };
  }
}

async function main() {
  console.log('=== Title Generation Model Benchmark ===\n');
  console.log(`Models: ${MODELS.join(', ')}`);
  console.log(`Test cases: ${TEST_CASES.length}\n`);

  const allResults: Result[] = [];

  for (const testCase of TEST_CASES) {
    console.log(`\n--- ${testCase.name} ---`);
    console.log(`Content preview: ${testCase.rawContent.slice(0, 80)}...`);
    console.log(`Similar nodes: ${testCase.similarNodes.length}\n`);

    // eslint-disable-next-line no-await-in-loop -- sequential per test case, parallel per model is intentional
    const results = await Promise.all(
      MODELS.map((modelId) => runTest(modelId, testCase)),
    );

    for (const r of results) {
      allResults.push(r);
      if (r.error) {
        console.log(`  ${r.model}: ERROR (${r.latencyMs}ms) - ${r.error}`);
      } else {
        console.log(
          `  ${r.model}: "${r.title}" (${r.latencyMs}ms, ${r.title.length} chars)`,
        );
      }
    }
  }

  // Summary table
  console.log('\n\n=== Summary ===\n');
  console.log(
    'Model'.padEnd(35) +
      'Avg Latency'.padEnd(14) +
      'Avg Chars'.padEnd(12) +
      'Errors',
  );
  console.log('-'.repeat(70));

  for (const modelId of MODELS) {
    const modelResults = allResults.filter((r) => r.model === modelId);
    const successful = modelResults.filter((r) => !r.error);
    const avgLatency = successful.length
      ? Math.round(
          successful.reduce((s, r) => s + r.latencyMs, 0) / successful.length,
        )
      : 0;
    const avgChars = successful.length
      ? Math.round(
          successful.reduce((s, r) => s + r.title.length, 0) /
            successful.length,
        )
      : 0;
    const errors = modelResults.filter((r) => r.error).length;
    console.log(
      modelId.padEnd(35) +
        `${avgLatency}ms`.padEnd(14) +
        `${avgChars}`.padEnd(12) +
        `${errors}/${modelResults.length}`,
    );
  }

  // Output JSON for logbook
  console.log('\n\n=== RAW RESULTS (JSON) ===');
  console.log(JSON.stringify(allResults, null, 2));
}

main().catch(console.error);
