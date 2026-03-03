# .agent-docs

> [!IMPORTANT]
> **Do NOT edit this README when adding new files to the folders below.** This file defines the organizational standard, not an index of every document created.

A folder organization system and naming standard for tracking AI coding agent activity, research, and decisions in a git repository.

All timestamps are **UTC**. Append `Z` to all times in filenames and frontmatter to make this explicit. No local timezones — ever. This eliminates sorting ambiguity when multiple agents or contributors operate across timezones.

## Directory Structure Example (DO NOT EDIT THIS)

```
.agent-docs/
├── activity/
│   ├── 2026-03-02_091500Z_claude_auth-scaffolding.md
│   ├── 2026-03-02_103000Z_gpt4_db-schema-review.md
│   └── 2026-03-02_144500Z_claude_auth-testing.md
├── research/
│   ├── 2026-03-02_091500Z_eval-orm-libraries.md
│   └── 2026-02-25_140000Z_auth-provider-comparison.md
├── decisions/
│   ├── 2026-03-01_163000Z_adopt-drizzle-orm.md
│   └── 2026-02-26_090000Z_switch-to-redis-sessions.md
├── plans/
│   ├── oauth-integration_plan_v1.md
│   └── db-migration_plan_v2.md
├── templates/
│   ├── activity-template.md
│   ├── research-template.md
│   └── decision-template.md
└── README.md
```

### Folder Purposes

**`activity/`** — Session-level summaries of what an agent actually did: files changed, commands run, errors hit, reasoning applied. One file per task or session. This is the chronological record of execution.

**`research/`** — Exploratory work where no code changes necessarily resulted: evaluating libraries, reading documentation, comparing architectures, investigating bugs, gathering API specs.

**`decisions/`** — ADR-style (Architecture Decision Record) documents capturing _why_ a particular path was chosen. These have the longest shelf life and are the most valuable artifacts for future contributors and agent sessions.

**`plans/`** — Scoping documents, system prompts, and step-by-step specifications fed into an agent _before_ execution. Storing input alongside output closes the loop: plan → activity → decision.

**`templates/`** — Standard markdown boilerplates that enforce uniform structure across all agent outputs.

## Naming Convention

All filenames use `kebab-case` for cross-platform compatibility. Date-prefixed formats use ISO 8601 dates with 24-hour UTC time for guaranteed chronological sorting.

| Folder    | Format                                      | Example                                               |
| --------- | ------------------------------------------- | ----------------------------------------------------- |
| activity  | `YYYY-MM-DD_HHMMSSZ_[agent]_[task-slug].md` | `2026-03-02_144500Z_claude_fix-auth-token-refresh.md` |
| research  | `YYYY-MM-DD_HHMMSSZ_[topic-slug].md`        | `2026-03-02_091500Z_eval-orm-libraries.md`            |
| decisions | `YYYY-MM-DD_HHMMSSZ_[decision-slug].md`     | `2026-03-01_163000Z_adopt-drizzle-orm.md`             |
| plans     | `[feature-slug]_plan_v[N].md`               | `oauth-integration_plan_v1.md`                        |

**Design rationale:**

- Date-first for anything chronological so `ls` output is naturally sorted.
- `HHMMSS` with `Z` suffix guarantees second-level ordering regardless of agent or task name. This is essential when scripts automatically pipe agent output into the folder.
- Agent name is included in activity logs because that's where multi-agent attribution matters most. It's omitted from research and decisions to reduce noise.
- Plans use feature-first naming with version numbers because they're reference documents, not chronological events.
- Task slugs should be 3–6 words describing the _goal_, not the method (e.g., `fix-auth-token-refresh` not `edit-auth-service-file`).

## Frontmatter Standard

Every document must include YAML frontmatter. This makes files searchable with `grep`, `yq`, or any metadata-aware tooling.

```yaml
---
date: 2026-03-02T14:45:00Z
type: activity | research | decision | plan
status: complete | in-progress | abandoned | success | failure | partial
agent: claude-opus-4-6
branch: fix/auth-token-refresh
task_id: TICKET-123 # optional — links to issue tracker
cost: $0.45 # optional — useful for budgeting agent usage
tags: [auth, security, tokens]
files_modified: # optional — key files touched
  - src/auth/token.ts
  - src/middleware/refresh.ts
related_plan: plans/oauth-integration_plan_v1.md # optional — trace intent to execution
---
```

**Field notes:**

- `date` uses full ISO 8601 with `Z` for UTC. This is the machine-parseable canonical timestamp.
- `status: abandoned` is encouraged — dead ends are some of the most valuable context for future sessions. They prevent agents from re-exploring failed paths.
- `cost` tracks per-session agent spend. Over time this builds a useful dataset for budgeting and optimization.
- `files_modified` is a short list of key files, not an exhaustive diff. The git history has the full picture.
- `related_plan` links activity and decision docs back to the plan that initiated the work.

## Templates

### Activity Template

```markdown
---
date: YYYY-MM-DDTHH:MM:SSZ
type: activity
status: complete
agent: agent-name
branch: feature/branch-name
task_id: TICKET-XXX
cost: $0.00
tags: []
files_modified: []
---

# Task Title

## Summary

One-paragraph TL;DR of what was accomplished.

## Context

What prompted this work. Link to issue or plan if applicable.

## Work Performed

Key actions taken, files touched, and reasoning for non-obvious choices.

## Outcome

Result, remaining issues, and follow-up tasks.
```

### Research Template

```markdown
---
date: YYYY-MM-DDTHH:MM:SSZ
type: research
status: complete
agent: agent-name
tags: []
---

# Research Topic

## Summary

One-paragraph TL;DR of findings.

## Question

The specific question or problem being investigated.

## Findings

What was discovered. Include comparisons, benchmarks, or data where relevant.

## Recommendation

Suggested path forward based on findings. Link to a decision doc if one was created.
```

### Decision Template

```markdown
---
date: YYYY-MM-DDTHH:MM:SSZ
type: decision
status: complete
agent: agent-name
tags: []
related_plan: plans/feature_plan_v1.md
---

# Decision Title

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

## Conventions

**Track in git by default.** The `.agent-docs/` folder becomes a searchable knowledge base for both humans and future agent sessions. Only add it to `.gitignore` if the repo is public and you want to keep agent artifacts private.

**Link plans to activity docs.** Use the `related_plan` frontmatter field so you can trace intent → execution → decision.

**Use `abandoned` status liberally.** A failed exploration documented well is more valuable than no documentation at all.

**Scale with subdirectories when needed.** For high-volume repos, add year or month subdirectories: `activity/2026/03-02_144500Z_claude_fix-auth.md`.

**Generate filenames with scripts.** You **MUST** use this command to generate the correct UTC filename and frontmatter timestamp. Do not guess or use local time.

```bash
# Generate a UTC-timestamped activity filename
echo "$(date -u +%Y-%m-%d_%H%M%SZ)_claude_your-task-slug.md"
# Generate the frontmatter date
date -u +%Y-%m-%dT%H:%M:%SZ
```

## Scaffold Script

To initialize the folder structure in a new repo:

```bash
mkdir -p .agent-docs/{activity,research,decisions,plans,templates}
# Copy templates into .agent-docs/templates/
# Copy this README into .agent-docs/README.md
```
