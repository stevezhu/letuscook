---
date: 2026-04-01T02:19:40Z
type: research
status: done
agent: claudecode
models: [claude-opus-4-6, claude-haiku-4-5-20251001]
branch: improve-capture
sessionId: 740f91ce-aa30-4f80-a7ea-8bcaa8d002ce
tags: [ai, openrouter, benchmarks, title-generation, cost-analysis]
filesModified: [apps/assistant-convex/scripts/bench-title-models.ts]
relatedPlan: plans/2026-04-01_013554Z_claudecode_setup-openrouter-provider.md
---

<!-- prettier-ignore-file -->

# Title Generation Model Benchmark via OpenRouter

## Question

Which frontier models (similar pricing to Gemini 3 Flash) produce the best titles for diverse content types? Evaluating quality, conciseness, latency, and adherence to the 80-char constraint.

## Setup

- **Provider:** OpenRouter (`@openrouter/ai-sdk-provider`)
- **System prompt:** "Generate a concise, descriptive title (max 80 chars)... Return ONLY the title text."
- **Max tokens:** 100
- **Test script:** `apps/assistant-convex/scripts/bench-title-models.ts`

### Test Cases (5)

1. **Technical blog excerpt** — React Server Components explanation, 2 similar nodes
2. **Cooking recipe** — Miso-glazed black cod with measurements, 1 similar node
3. **Research paper abstract** — ML continual learning paper, 0 similar nodes
4. **Meeting notes** — Q2 planning with action items, 3 similar nodes
5. **Mixed-language personal note** — Wabi-sabi design ideas, 1 similar node

---

## Round 1 — Established Flash/Mini Models

### Models Tested

| Model                          | Input $/M | Output $/M |
| ------------------------------ | --------- | ---------- |
| `google/gemini-2.5-flash`      | $0.30     | $2.50      |
| `openai/gpt-4.1-mini`          | $0.40     | $1.60      |
| `anthropic/claude-3.5-haiku`   | $0.80     | $4.00      |
| `mistralai/mistral-large-2512` | $0.50     | $1.50      |

### Performance Summary

| Model                        | Avg Latency | Avg Chars | Errors | 80-char violations |
| ---------------------------- | ----------- | --------- | ------ | ------------------ |
| google/gemini-2.5-flash      | **642ms**   | 69        | 0/5    | 0                  |
| openai/gpt-4.1-mini          | 1288ms      | 84        | 0/5    | **4**              |
| anthropic/claude-3.5-haiku   | 1588ms      | 73        | 0/5    | 0                  |
| mistralai/mistral-large-2512 | 952ms       | 61        | 0/5    | 0                  |

### Detailed Results

#### 1. Technical blog excerpt (React Server Components)

| Model              | Title                                                                                   | Chars  | ms   |
| ------------------ | --------------------------------------------------------------------------------------- | ------ | ---- |
| gemini-2.5-flash   | React Server Components: Server-Side Execution, Data Access & Client Boundary           | 77     | 1020 |
| gpt-4.1-mini       | React Server Components: Redefining Client-Server Boundaries with Server-Only Execution | **87** | 2113 |
| claude-3.5-haiku   | React Server Components: Rethinking Client-Server Boundaries in Web Apps                | 72     | 1497 |
| mistral-large-2512 | "React Server Components: Server-Only Execution & Streaming"                            | 60     | 1138 |

#### 2. Cooking recipe (Miso-glazed black cod)

| Model              | Title                                                                    | Chars | ms   |
| ------------------ | ------------------------------------------------------------------------ | ----- | ---- |
| gemini-2.5-flash   | Miso-Glazed Black Cod: Recipe & Tips for Perfect Umami                   | 54    | 512  |
| gpt-4.1-mini       | Miso-Glazed Black Cod Recipe with Umami Marinade and Broiler Preparation | 72    | 924  |
| claude-3.5-haiku   | Umami-Rich Miso Black Cod with Caramelized Glaze                         | 48    | 1680 |
| mistral-large-2512 | Miso-Glazed Black Cod: Umami-Rich Japanese Broiled Recipe                | 57    | 839  |

#### 3. Research paper abstract (Continual learning)

| Model              | Title                                                                                         | Chars  | ms   |
| ------------------ | --------------------------------------------------------------------------------------------- | ------ | ---- |
| gemini-2.5-flash   | SOST: Continual Learning with Subnetwork Isolation for Catastrophic Forgetting                | 78     | 507  |
| gpt-4.1-mini       | Sparse Orthogonal Subspace Training (SOST) for Efficient Continual Learning Without Replay    | **90** | 1355 |
| claude-3.5-haiku   | Sparse Orthogonal Subspace Training: Mitigating Catastrophic Forgetting in Continual Learning | **93** | 1594 |
| mistral-large-2512 | "SOST: Orthogonal Subspaces Prevent Forgetting in Continual Learning"                         | 69     | 980  |

#### 4. Meeting notes (Q2 planning)

| Model              | Title                                                                               | Chars  | ms   |
| ------------------ | ----------------------------------------------------------------------------------- | ------ | ---- |
| gemini-2.5-flash   | GraphQL migration delayed; batch mutations needed for mobile sync                   | 65     | 455  |
| gpt-4.1-mini       | Q2 Planning: Extend v1 REST API Sunset, Add GraphQL Batch Mutations for Mobile Sync | **83** | 1026 |
| claude-3.5-haiku   | API Migration Delay: Batch Mutations and Mobile Sync Extension to September         | 75     | 1431 |
| mistral-large-2512 | "API Deprecation Delay: Batch Mutations & Mobile Migration Risks"                   | 65     | 886  |

#### 5. Mixed-language personal note (Wabi-sabi design)

| Model              | Title                                                                                   | Chars  | ms   |
| ------------------ | --------------------------------------------------------------------------------------- | ------ | ---- |
| gemini-2.5-flash   | Wabi-Sabi Landing Page: Hand-Drawn, Kinetic Type, Figma to CSS/Canvas                   | 69     | 715  |
| gpt-4.1-mini       | Landing Page Design Ideas: Embracing Wabi-Sabi with Hand-Drawn Art & Kinetic Typography | **87** | 1022 |
| claude-3.5-haiku   | Wabi-Sabi Web Design: Embracing Imperfection for a Unique SaaS Landing Page             | 75     | 1740 |
| mistral-large-2512 | Wabi-Sabi Landing: Hand-Drawn Charm & Kinetic Typography                                | 56     | 919  |

### Round 1 Analysis

**Instruction Following (80-char limit):**

- **Gemini 2.5 Flash:** Perfect compliance (max 78 chars). Most consistent.
- **GPT-4.1 Mini:** Violated 80-char limit in 4/5 cases (83-90 chars). Worst compliance.
- **Claude 3.5 Haiku:** Slight overflow on research abstract (93 chars), otherwise compliant.
- **Mistral Large:** Perfect compliance but wraps output in quotes — a formatting issue.

**Title Quality:**

- **Gemini 2.5 Flash:** Best balance of informativeness and conciseness. Uses semicolons and ampersands efficiently. Meeting notes title captures the _actionable takeaway_ rather than just labeling it.
- **Claude 3.5 Haiku:** Most natural-sounding titles. Good at extracting the essence (e.g., "Umami-Rich Miso Black Cod with Caramelized Glaze" is evocative).
- **GPT-4.1 Mini:** Most descriptive but verbose. Tends toward complete phrases rather than punchy titles.
- **Mistral Large:** Concise but wraps output in literal quote marks `"..."` — would need post-processing to strip.

**Context Awareness (similar nodes):**
All models incorporated context from similar nodes when provided. Gemini and Haiku showed the most nuanced integration (e.g., Gemini's meeting notes title focused on the _decision_ rather than restating the meeting topic).

---

## Round 2 — Newer/Cheaper Models

### Models Tested

| Model                                  | Input $/M | Output $/M |
| -------------------------------------- | --------- | ---------- |
| `google/gemini-3-flash-preview`        | $0.50     | $3.00      |
| `google/gemini-3.1-flash-lite-preview` | ~$0.10    | ~$0.40     |
| `deepseek/deepseek-chat-v3-0324`       | $0.15     | $0.75      |
| `minimax/minimax-m2.7`                 | $0.20     | $1.10      |

### Performance Summary

| Model                                | Avg Latency | Avg Chars | Errors | Issues                           |
| ------------------------------------ | ----------- | --------- | ------ | -------------------------------- |
| google/gemini-3-flash-preview        | 1179ms      | 71        | 0/5    | None                             |
| google/gemini-3.1-flash-lite-preview | 1023ms      | 56        | 0/5    | Titles too generic               |
| deepseek/deepseek-chat-v3-0324       | 3372ms      | 154       | 0/5    | Wraps in quotes; 1 major failure |
| minimax/minimax-m2.7                 | 5611ms      | **0**     | 0/5    | **Empty output on all 5 cases**  |

### Detailed Results

#### 1. Technical blog excerpt (React Server Components)

| Model                  | Title                                                                       | Chars | ms   |
| ---------------------- | --------------------------------------------------------------------------- | ----- | ---- |
| gemini-3-flash-preview | Understanding React Server Components and the Client-Server Boundary        | 68    | 1349 |
| gemini-3.1-flash-lite  | Understanding React Server Components: Architecture and Benefits            | 64    | 1342 |
| deepseek-chat-v3-0324  | React Server Components: Server-Side Execution & Client-Side Reconstruction | 75    | 2135 |
| minimax-m2.7           | _(empty)_                                                                   | 0     | 3075 |

#### 2. Cooking recipe (Miso-glazed black cod)

| Model                  | Title                                                                   | Chars | ms   |
| ---------------------- | ----------------------------------------------------------------------- | ----- | ---- |
| gemini-3-flash-preview | Miso-Glazed Black Cod Recipe: Traditional Preparation and Cooking Guide | 71    | 1227 |
| gemini-3.1-flash-lite  | Recipe: Miso-Glazed Black Cod                                           | 29    | 776  |
| deepseek-chat-v3-0324  | "Easy Miso-Glazed Black Cod Recipe: Marinate & Broil in 3 Steps"        | 64    | 4720 |
| minimax-m2.7           | _(empty)_                                                               | 0     | 8396 |

#### 3. Research paper abstract (Continual learning)

| Model                  | Title                                                                           | Chars | ms   |
| ---------------------- | ------------------------------------------------------------------------------- | ----- | ---- |
| gemini-3-flash-preview | Sparse Orthogonal Subspace Training for Privacy-Preserving Continual Learning   | 77    | 1025 |
| gemini-3.1-flash-lite  | Sparse Orthogonal Subspace Training for Continual Learning                      | 58    | 1127 |
| deepseek-chat-v3-0324  | "Novel Continual Learning Approach with SOST Mitigates Catastrophic Forgetting" | 79    | 1435 |
| minimax-m2.7           | _(empty)_                                                                       | 0     | 4656 |

#### 4. Meeting notes (Q2 planning)

| Model                  | Title                                                                                   | Chars   | ms   |
| ---------------------- | --------------------------------------------------------------------------------------- | ------- | ---- |
| gemini-3-flash-preview | Q2 Sync: v1 API Deprecation Timeline and Mobile Migration Plan                          | 62      | 1193 |
| gemini-3.1-flash-lite  | Q2 Planning: REST v1 API Deprecation and GraphQL Migration Timeline Extension           | 77      | 770  |
| deepseek-chat-v3-0324  | _(Returned full reasoning chain + alternatives, 495 chars — major instruction failure)_ | **495** | 7430 |
| minimax-m2.7           | _(empty)_                                                                               | 0       | 7935 |

#### 5. Mixed-language personal note (Wabi-sabi design)

| Model                  | Title                                                                       | Chars | ms   |
| ---------------------- | --------------------------------------------------------------------------- | ----- | ---- |
| gemini-3-flash-preview | Wabi-Sabi Aesthetics and Technical Implementation for Landing Page Redesign | 75    | 1099 |
| gemini-3.1-flash-lite  | Wabi-Sabi Aesthetic Proposal for Landing Page Redesign                      | 54    | 1099 |
| deepseek-chat-v3-0324  | "Wabi-Sabi Landing Page: Embracing Imperfect UX Design"                     | 55    | 1140 |
| minimax-m2.7           | _(empty)_                                                                   | 0     | 3994 |

### Round 2 Analysis

**Gemini 3 Flash Preview:**

- Solid all-around. 80-char compliant, good quality. Slightly slower than Gemini 2.5 Flash (1179ms vs 642ms) — likely due to preview overhead. Titles are descriptive but less punchy than 2.5 Flash (e.g., "Understanding..." phrasing is generic vs 2.5's "Server-Side Execution, Data Access & Client Boundary").

**Gemini 3.1 Flash Lite Preview:**

- Fastest (1023ms avg), cheapest. But titles are noticeably more generic and shorter. "Recipe: Miso-Glazed Black Cod" (29 chars) and "Easy Miso-Glazed Black Cod Recipe" lose the richness of the content. Acceptable as an ultra-cheap fallback but not ideal for quality.

**DeepSeek Chat V3:**

- Mixed. Produced good titles in 3/5 cases but with quote-wrapping. On the meeting notes test case, it dumped its full reasoning chain (495 chars) instead of returning just the title — a critical instruction-following failure. Slow (3372ms avg). Not reliable enough for production.

**Minimax M2.7:**

- Returned empty strings on all 5 test cases with `maxOutputTokens: 100`. Root cause: M2.7 is a **reasoning model** — it consumed all 100 output tokens on internal chain-of-thought reasoning (`reasoningTokens: 100, textTokens: 0`), leaving zero tokens for visible text. With `maxOutputTokens: 1000`, it produces good titles (avg 57 chars, perfect 80-char compliance) but is **extremely slow** (17.4s avg, 35s worst case). Titles are decent quality — see Round 4 below.
- **Implication for production:** reasoning models need much higher `maxOutputTokens` budgets even for simple tasks, making them cost-inefficient for title generation. The reasoning overhead also explains the 10-35s latency.

---

## Round 3 — DeepSeek V3.2

### Models Tested

| Model                    | Input $/M | Output $/M |
| ------------------------ | --------- | ---------- |
| `deepseek/deepseek-v3.2` | $0.15     | $0.75      |

### Performance Summary

| Model                  | Avg Latency | Avg Chars | Errors | 80-char violations |
| ---------------------- | ----------- | --------- | ------ | ------------------ |
| deepseek/deepseek-v3.2 | 1587ms      | 53        | 0/5    | 0                  |

### Detailed Results

| Test Case              | Title                                                                         | Chars | ms   |
| ---------------------- | ----------------------------------------------------------------------------- | ----- | ---- |
| Technical blog excerpt | React Server Components: Executing Logic on the Server                        | 54    | 2307 |
| Cooking recipe         | Japanese Black Cod Miso Recipe                                                | 30    | 916  |
| Research paper         | SOST: Mitigating Catastrophic Forgetting via Task-Specific Subspace Isolation | 77    | 3072 |
| Meeting notes          | Extend v1 API Sunset for Mobile Migration                                     | 41    | 1228 |
| Personal note          | Embracing Wabi-Sabi Imperfection for a Hand-Drawn Landing Page                | 62    | 410  |

### Round 3 Analysis

**DeepSeek V3.2** is a massive improvement over V3-0324:

- Perfect instruction following — no reasoning chain dumps, no quote wrapping
- Perfect 80-char compliance
- Titles are concise and punchy (avg 53 chars), though sometimes _too_ short (e.g., "Japanese Black Cod Miso Recipe" at 30 chars loses the miso-glaze and preparation details)
- Latency is moderate (1587ms avg) but with high variance (410ms to 3072ms)
- At $0.15/$0.75, it's the cheapest viable option tested

Compared to gemini-2.5-flash: slightly shorter/less descriptive titles, 2.5x slower, but half the price. Good budget fallback option.

---

## Round 4 — Minimax M2.7 Debugging

### Root Cause

Initial run (Round 2) returned empty strings on all 5 cases. Debug logging revealed:

- `finishReason: "length"` — hit token limit on every call
- `outputTokenDetails: { textTokens: 0, reasoningTokens: 100 }` — all 100 output tokens consumed by internal reasoning
- M2.7 is a **reasoning model** that needs a much larger `maxOutputTokens` budget

### Re-run with `maxOutputTokens: 1000`

| Model                | Avg Latency  | Avg Chars | Errors | 80-char violations |
| -------------------- | ------------ | --------- | ------ | ------------------ |
| minimax/minimax-m2.7 | **17,433ms** | 57        | 0/5    | 0                  |

| Test Case              | Title                                                            | Chars | ms     |
| ---------------------- | ---------------------------------------------------------------- | ----- | ------ |
| Technical blog excerpt | React Server Components: Rethinking the Client-Server Boundary   | 62    | 13,524 |
| Cooking recipe         | Classic Miso-Glazed Black Cod Recipe: Broiling Instructions      | 59    | 13,072 |
| Research paper         | SOST: Sparse Orthogonal Subspace Training for Continual Learning | 64    | 12,904 |
| Meeting notes          | Q2 Planning: v1 REST API Sunset Extension & Migration Blockers   | 62    | 35,159 |
| Personal note          | Wabi-Sabi Landing Page Design Concept                            | 37    | 12,508 |

### Analysis

Titles are decent quality — concise, compliant, relevant. But the model is **not viable for this use case**:

- **17.4s average latency** (27x slower than gemini-2.5-flash), with worst case 35s
- Reasoning overhead wastes tokens and cost on a simple generation task
- Requires 10x `maxOutputTokens` budget (1000 vs 100) to work at all
- The current `generateTitle()` function uses `maxOutputTokens: 100`, which would need to be special-cased for reasoning models

---

## Overall Recommendation (All Rounds)

### Tier 1 — Production Ready

| Rank | Model                           | Avg Latency | Avg Chars | Price (in/out $/M) | Notes                                 |
| ---- | ------------------------------- | ----------- | --------- | ------------------ | ------------------------------------- |
| 1    | `google/gemini-2.5-flash`       | **642ms**   | 69        | $0.30 / $2.50      | Best overall: fast, accurate, concise |
| 2    | `anthropic/claude-3.5-haiku`    | 1588ms      | 73        | $0.80 / $4.00      | Best quality, 2.5x slower             |
| 3    | `google/gemini-3-flash-preview` | 1179ms      | 71        | $0.50 / $3.00      | Solid but slower than 2.5             |

### Tier 2 — Usable with Caveats

| Model                                  | Caveat                                            |
| -------------------------------------- | ------------------------------------------------- |
| `deepseek/deepseek-v3.2`               | Titles sometimes too short; high latency variance |
| `google/gemini-3.1-flash-lite-preview` | Titles too short/generic for rich content         |
| `mistralai/mistral-large-2512`         | Wraps output in literal quotes                    |

### Tier 3 — Not Recommended

| Model                            | Reason                                                       |
| -------------------------------- | ------------------------------------------------------------ |
| `openai/gpt-4.1-mini`            | 80% char-limit violation rate                                |
| `deepseek/deepseek-chat-v3-0324` | Instruction-following failure on complex inputs              |
| `minimax/minimax-m2.7`           | 17s avg latency, requires 10x token budget (reasoning model) |

---

## Appendix A: Cost Per User Estimation

### Assumptions

Based on the capture processing pipeline in `convex/captures.ts`:

**AI calls per capture (when full pipeline is active):**

1. **1 embedding call** — Google Gemini Embedding 2 Preview (768 dims)
2. **1 title generation call** — fallback chain, typically resolved on first model

**Token usage per capture (measured from benchmark):**

| Call                  | Input tokens                                        | Output tokens          |
| --------------------- | --------------------------------------------------- | ---------------------- |
| Embedding             | ~150 (capture content)                              | N/A (embedding output) |
| Title generation      | ~200 (system + user prompt + similar nodes context) | ~20 (title text)       |
| **Total per capture** | **~350**                                            | **~20**                |

**User activity tiers:**

| Tier     | Captures/day | Captures/month |
| -------- | ------------ | -------------- |
| Light    | 3            | 90             |
| Moderate | 10           | 300            |
| Heavy    | 30           | 900            |
| Power    | 100          | 3,000          |

### Monthly API Cost Per User

Using the recommended model (`google/gemini-2.5-flash` at $0.30/M input, $2.50/M output) + Google embedding:

| Component                                   | Input cost/capture | Output cost/capture | Total/capture |
| ------------------------------------------- | ------------------ | ------------------- | ------------- |
| Embedding (Google)                          | $0.000015          | —                   | $0.000015     |
| Title gen (gemini-2.5-flash via OpenRouter) | $0.000060          | $0.000050           | $0.000110     |
| **Total**                                   |                    |                     | **$0.000125** |

**Monthly cost by user tier:**

| User tier         | Captures/mo | AI cost/mo | With 2x retry buffer |
| ----------------- | ----------- | ---------- | -------------------- |
| Light (3/day)     | 90          | $0.011     | $0.023               |
| Moderate (10/day) | 300         | $0.038     | $0.075               |
| Heavy (30/day)    | 900         | $0.113     | $0.225               |
| Power (100/day)   | 3,000       | $0.375     | $0.750               |

### Model Comparison: Monthly Cost for Moderate User (300 captures)

| Model                  | Cost/capture | Monthly cost | Notes                      |
| ---------------------- | ------------ | ------------ | -------------------------- |
| gemini-2.5-flash       | $0.000110    | **$0.033**   | Best value + quality       |
| gemini-3-flash-preview | $0.000160    | $0.048       | 45% more expensive         |
| deepseek-v3.2          | $0.000060    | $0.018       | Cheapest but lower quality |
| claude-3.5-haiku       | $0.000240    | $0.072       | 2x gemini, best quality    |
| gemini-3.1-flash-lite  | $0.000018    | $0.005       | Ultra-cheap, low quality   |

_Note: embedding cost ($0.015/capture) is constant across all models — only title gen varies._

### Subscription Pricing & Margin Analysis

**Cost structure per user (moderate tier, 300 captures/mo):**

| Line item                      | Monthly cost    |
| ------------------------------ | --------------- |
| AI API (title gen + embedding) | $0.04           |
| AI API with retry buffer (2x)  | $0.08           |
| Convex hosting (pro-rated)     | ~$0.50–1.00     |
| **Total COGS per user**        | **~$0.60–1.10** |

**Pricing scenarios:**

| Subscription price | COGS (moderate) | Gross margin | Margin % |
| ------------------ | --------------- | ------------ | -------- |
| Free tier          | $0.60–1.10      | -$0.60–1.10  | N/A      |
| $5/mo              | $0.60–1.10      | $3.90–4.40   | 78–88%   |
| $10/mo             | $0.60–1.10      | $8.90–9.40   | 89–94%   |
| $15/mo             | $0.60–1.10      | $13.90–14.40 | 93–96%   |

**Key takeaway:** AI costs are negligible at current usage — even a heavy user (900 captures/mo) costs <$0.25/mo in AI API fees. The dominant cost is infrastructure (Convex), not AI. This means:

- AI costs don't need to gate pricing decisions
- A free tier is viable from an AI cost perspective (cap at ~100 captures/mo = ~$0.01)
- Subscription pricing should be driven by product value, not AI cost recovery

### Rate Limiting Recommendations

Rate limiting serves two purposes: preventing abuse and managing API burst costs.

**Recommended limits:**

| Tier     | Captures/day | Captures/hour | Burst (per minute) |
| -------- | ------------ | ------------- | ------------------ |
| Free     | 10           | 5             | 3                  |
| Paid     | 100          | 30            | 10                 |
| Pro/Team | 500          | 100           | 30                 |

**Why these numbers:**

- **Daily caps** prevent runaway costs from automation/bots (a bot at 1 req/sec = 86,400/day = $10.80/day)
- **Hourly caps** smooth out burst patterns
- **Per-minute caps** protect against accidental rapid-fire (e.g., buggy client retry loop)
- Free tier at 10/day = 300/mo, still within the "moderate" cost tier ($0.04/mo)

**Cost of abuse without limits:**

- 1 req/sec sustained = 2.6M captures/mo = **$325/mo** in AI costs alone
- Rate limiting to 100/day caps worst case at $0.375/mo per user

**Implementation:** Rate limiting should be enforced at the Convex mutation level (`createCapture`) before scheduling the AI processing action. Use a sliding window counter per user stored in Convex.

## References

- [OpenRouter Models](https://openrouter.ai/models)
- [Vercel AI SDK generateText](https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-text)
- Test script: `apps/assistant-convex/scripts/bench-title-models.ts`

## Session Stats

```
claudecode Session Stats: 740f91ce-aa30-4f80-a7ea-8bcaa8d002ce
========================================
Models Used:  Main: claude-opus-4-6
              Subagents: claude-haiku-4-5-20251001, claude-opus-4-6
----------------------------------------
MAIN SESSION:
  Input Tokens         3,633
  Output Tokens        37,469
  Cache Creation Input 175,578
  Cache Read Input     8,013,624
----------------------------------------
SUBAGENTS (4 total):
  Input Tokens         337
  Output Tokens        11,849
  Cache Creation Input 315,318
  Cache Read Input     3,252,112
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   3,970
  Total Output Tokens  49,318
  Total Cache Creation 490,896
  Total Cache Read     11,265,736
----------------------------------------
GRAND TOTAL TOKENS:  11,809,920
========================================
```
