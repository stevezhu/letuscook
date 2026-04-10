---
date: 2026-04-10T22:00:00Z
type: activity
status: done
agent: claudecode
models: [claude-opus-4-6]
branch: feat/share-to-app
sessionId: 9f88de98-0c3d-4874-a587-b360d28c5c52
tags: [claude-code, permissions, hooks, devx]
filesModified:
  - .claude/settings.local.json
  - .claude/settings.json
  - .claude/hooks/guard-destructive.sh
---

# Clean up Claude Code permissions and add destructive command guard hook

## Summary

Cleaned up Claude Code permission allowlist from 69 entries to ~30 by removing redundant and one-off entries. Removed overly broad `Bash(bash:*)`, `Bash(python3:*)`, and `Bash(node:*)` permissions. Added a PreToolUse hook that blocks destructive commands before execution.

## Context

The `settings.local.json` had accumulated many one-off permission entries from past sessions (specific `find` paths, specific `pnpx @stzhu/skills agent-logbook` invocations) alongside redundant entries (e.g., `Bash(git add:*)` when `Bash(git:*)` was already present). The `Bash(bash:*)` permission was an escape hatch that effectively bypassed all other restrictions.

## Work Performed

1. **Permission cleanup**: Consolidated 69 allow entries to ~30 by:
   - Removing entries covered by broader wildcards (`git add` by `git:*`, all `pnpx @stzhu/skills` by `pnpx:*`, specific `ls` path by `ls:*`)
   - Removing commands that should use dedicated tools (`cat` → Read, `grep` → Grep, `echo` → Write, `curl` → WebFetch)
   - Removing one-off commands unlikely to be needed again (specific `find` paths, `brew --prefix tmux`, system binary Read paths)
   - Organized remaining entries into logical groups (shell basics, git, package managers, tmux/cmux, maestro MCP, WebFetch domains)

2. **Consolidated tmux/cmux**: Replaced 11 specific tmux/cmux subcommand entries with `Bash(tmux:*)` and `Bash(cmux:*)`.

3. **Removed broad execution permissions**: Removed `Bash(bash:*)`, `Bash(python3:*)`, and `Bash(node:*)` which could bypass all other restrictions via `bash -c`, `python3 -c`, or `node -e`.

4. **Created guard-destructive.sh hook**: A PreToolUse Bash hook that blocks:
   - `git push --force` / `-f`
   - `git reset --hard`
   - `git clean -f`
   - `git checkout .` / `git restore .`
   - `git branch -D`
   - `rm -rf`
   - `git ... --no-verify`
   - `git ... --no-gpg-sign`

5. **Fixed hook false positives**: Tightened `--no-verify`/`--no-gpg-sign` patterns to only match in `git` command context (not when the string appears in unrelated command arguments like summary text). Also removed `set -uo pipefail` in favor of explicit error handling to prevent silent failures.

6. **Moved hook to settings.json**: Moved from `settings.local.json` (gitignored) to `settings.json` (committed) for team-wide enforcement.

## Outcome

- Permissions are tighter and better organized
- Destructive commands are blocked at the hook level rather than relying on per-command permission granularity
- Hook is team-shared via `settings.json`

## Session Stats

```
claudecode Session Stats: 9f88de98-0c3d-4874-a587-b360d28c5c52
========================================
Models Used:  claude-opus-4-6
----------------------------------------
MAIN SESSION:
  Input Tokens         108
  Output Tokens        28,642
  Cache Creation Input 130,000
  Cache Read Input     3,537,708
----------------------------------------
TOTAL USAGE:
  Total Input Tokens   108
  Total Output Tokens  28,642
  Total Cache Creation 130,000
  Total Cache Read     3,537,708
----------------------------------------
GRAND TOTAL TOKENS:  3,696,458
========================================
```
