---
name: agent-docs
description: >
  Create and maintain agent documentation files in .agent-docs/ following the
  project's naming conventions, frontmatter standards, and templates. Use this
  skill whenever you finish a task and need to log what happened, when
  documenting a research exploration, recording an architecture decision (ADR),
  or writing a plan before starting work. Trigger on phrases like "log this",
  "document what we did", "write an activity log", "create a decision record",
  "write up your findings", or any request to capture agent work in .agent-docs/.
targets: ['*']
---

# Agent Docs

The `.agent-docs/` directory is a knowledge base for AI agent activity. Every
document you create there must follow the naming convention and frontmatter
standard described below.

## Document Types

| Type       | Folder        | Use when…                                                |
| ---------- | ------------- | -------------------------------------------------------- |
| `activity` | `activity/`   | Logging what you did in a session — files changed, commands run, reasoning |
| `research` | `research/`   | Exploratory work: evaluating libraries, reading docs, comparing approaches |
| `decision` | `decisions/`  | ADR-style record of *why* a path was chosen              |
| `plan`     | `plans/`      | Scoping doc or step-by-step spec written *before* execution |

## Filename Convention

**Always generate the UTC timestamp with a shell command — never guess or use local time.**

```bash
# Activity
echo "$(date -u +%Y-%m-%d_%H%M%SZ)_claude_<task-slug>.md"

# Research / Decision
echo "$(date -u +%Y-%m-%d_%H%M%SZ)_<topic-slug>.md"

# Plan (no timestamp — plans are reference docs, not chronological events)
echo "<feature-slug>_plan_v<N>.md"
```

Task/topic slugs must be 3–6 words in kebab-case describing the **goal**, not
the method. `fix-auth-token-refresh`, not `edit-auth-service-file`.

## Frontmatter

Every file must start with YAML frontmatter. Use only the fields that apply.

```yaml
---
date: 2026-03-02T14:45:00Z        # ISO 8601 UTC — always include
type: activity                     # activity | research | decision | plan
status: complete                   # complete | in-progress | abandoned | success | failure | partial
agent: claude-sonnet-4-6          # model ID from your system prompt
branch: feature/branch-name        # current git branch
task_id: TICKET-123                # optional — issue tracker link
cost: $0.45                        # optional — per-session spend
tags: [auth, security]             # optional
files_modified:                    # optional — key files only, not exhaustive
  - src/auth/token.ts
related_plan: plans/oauth-integration_plan_v1.md  # optional
---
```

Use `status: abandoned` liberally — failed explorations are valuable context
that prevent future agents from re-exploring dead ends.

## Document Templates

### Activity

```markdown
---
date: <UTC ISO 8601>
type: activity
status: complete
agent: <model-id>
branch: <branch>
tags: []
files_modified: []
---

# <Task Title>

## Summary

One-paragraph TL;DR of what was accomplished.

## Context

What prompted this work. Link to issue or plan if applicable.

## Work Performed

Key actions taken, files touched, and reasoning for non-obvious choices.

## Outcome

Result, remaining issues, and follow-up tasks.
```

### Research

```markdown
---
date: <UTC ISO 8601>
type: research
status: complete
agent: <model-id>
tags: []
---

# <Research Topic>

## Summary

One-paragraph TL;DR of findings.

## Question

The specific question or problem being investigated.

## Findings

What was discovered. Include comparisons, benchmarks, or data where relevant.

## Recommendation

Suggested path forward. Link to a decision doc if one was created.
```

### Decision

```markdown
---
date: <UTC ISO 8601>
type: decision
status: complete
agent: <model-id>
tags: []
related_plan: plans/feature_plan_v1.md   # if applicable
---

# <Decision Title>

## Summary

One-sentence description of the decision made.

## Context

What situation or research led to this decision point.

## Options Considered

Brief description of each alternative evaluated.

## Decision

What was chosen and why.

## Consequences

Expected tradeoffs, risks, and what would trigger revisiting this decision.
```

### Plan

```markdown
---
date: <UTC ISO 8601>
type: plan
status: in-progress
agent: <model-id>
tags: []
---

# <Feature / Task Title>

## Goal

What this plan aims to achieve.

## Scope

What is and is not included.

## Steps

Ordered list of tasks with enough detail to execute independently.

## Open Questions

Anything that must be resolved before or during execution.
```

## Workflow

1. Run `date -u +%Y-%m-%d_%H%M%SZ` to get the current UTC timestamp.
2. Pick the document type and folder based on what you're documenting.
3. Construct the filename using the rules above.
4. Fill in frontmatter — generate `date` from the same timestamp command.
5. Write the document body using the appropriate template.
6. Write the file to the correct subfolder in `.agent-docs/`.
