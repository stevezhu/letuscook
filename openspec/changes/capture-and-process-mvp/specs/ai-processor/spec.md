# Spec: ai-processor

The AI processor is a Convex action that analyzes captured content, extracts structured information, finds related existing nodes, and creates suggestions for user review.

## Requirements

### Trigger

- WHEN a new capture is created in Convex (via `captures.create` mutation)
- THEN the `captures.process` action is scheduled automatically
- AND the capture state is `processing`

### Extraction

- WHEN the AI processor runs on a capture
- THEN it uses the Vercel AI SDK with Anthropic to extract:
  - A concise title summarizing the capture
  - Cleaned/expanded content
  - Confirmed capture type (`text`, `link`, `task`)
  - Search terms for finding related nodes

- WHEN the capture is a link
- THEN the title should describe what the link is about (not just the URL)

- WHEN the capture is a task
- THEN the title should be the actionable task description (without the prefix)

### Node Matching

- WHEN the AI processor has extracted search terms
- THEN it searches existing nodes using the Convex `search_nodes` index
- AND it filters to nodes owned by the same user
- AND it filters out archived nodes

- WHEN matching nodes are found
- THEN suggestion records are created linking the capture to each matching node
- AND each suggestion has status `pending`

### State Transitions

- WHEN AI processing completes successfully
- THEN the capture state is updated to `ready`

- WHEN AI processing fails (LLM error, timeout, etc.)
- THEN the capture state is updated to `failed`
- AND the error is logged

### Node Creation via Suggestions

- WHEN the AI processor completes
- THEN it creates a draft node with the extracted title and content
- AND a suggestion record links this draft node to the capture
- AND additional suggestion records link to any matched existing nodes

### Idempotency

- WHEN the processor action is called for a capture that is not in `processing` state
- THEN it returns early without doing anything

## Constraints

- The AI model used is Anthropic Claude (via `@ai-sdk/anthropic`).
- The processor must complete within Convex action timeout limits.
- The processor creates at most 5 suggestions per capture (1 new node + up to 4 related existing nodes).
