---
date: 2026-03-04T19:43:43Z
type: activity
status: success
agent: geminicli
models: [gemini-2.0-flash-thinking-exp-01-21]
branch: main
related_plan: plans/2026-03-04_194248Z_geminicli_claude-session-stats-script.md
---

# Add Claude Session Stats Script

## Summary

Created a Node.js script to aggregate token usage and models used for Claude sessions by parsing `.jsonl` files in `~/.claude/projects`.

## Context

The user wanted a way to see total tokens and models used for a given Claude session ID, which is stored in individual JSONL files per session/project.

## Work Performed

- Researched the structure of `~/.claude/projects` and the JSONL session logs.
- Developed an implementation plan in `.agent-logbook/plans/2026-03-04_194248Z_geminicli_claude-session-stats-script.md`.
- Implemented `claude-session-stats.js` in `.rulesync/skills/agent-logbook/scripts/`.
- Used ESM syntax as the project is configured with `"type": "module"`.
- Tested the script with session ID `060d3f6b-eea4-4a8c-8c42-77cbcf3213e2`.
- Documented usage in `SKILL.md`.
- Synced changes to `.claude`, `.cursor`, and `.gemini` using `rulesync generate`.

## Outcome

The script is now available and can be run via:
`node .claude/skills/agent-logbook/scripts/claude-session-stats.js <session-id>`

Example Output:
```
Claude Session Stats: 060d3f6b-eea4-4a8c-8c42-77cbcf3213e2
========================================
Project File: /Users/stevezhu/.claude/projects/-Users-stevezhu-Development-private-letuscook/060d3f6b-eea4-4a8c-8c42-77cbcf3213e2.jsonl
Models Used:  claude-opus-4-6
----------------------------------------
Total Input Tokens:          102
Total Output Tokens:         7,169
Total Cache Creation Input:  603,360
Total Cache Read Input:      4,244,512
----------------------------------------
Total Tokens:                4,855,143
========================================
```
