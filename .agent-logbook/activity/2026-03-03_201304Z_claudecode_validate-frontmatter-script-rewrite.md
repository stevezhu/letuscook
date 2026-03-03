---
date: 2026-03-03T20:13:04Z
type: activity
status: complete
agent: claudecode
models: [claude-sonnet-4-6]
branch: t2
tags: [agent-logbook, validation, bash]
files_modified:
  - .rulesync/skills/agent-logbook/scripts/validate-frontmatter.sh
  - .rulesync/skills/agent-logbook/scripts/schema.json
  - .rulesync/skills/agent-logbook/SKILL.md
---

# Validate Frontmatter Script Rewrite

## Summary

Replaced the TypeScript `validate-frontmatter.ts` script with a simple bash
script (`validate-frontmatter.sh`) + `schema.json`, using `yq` for frontmatter
extraction and `pnpx ajv-cli` for JSON Schema validation.

## Context

Follow-up to the previous session
(`2026-03-03_184629Z_claudecode_agent-logbook-skill-improvements.md`), which
added the TypeScript validator. The TS approach was over-engineered: inline bun
specifiers, a fake npm package wrapper, and workspace entanglement. The goal was
to simplify to plain bash tooling with no package dependencies.

## Work Performed

1. **Removed the TypeScript script** and its aborted standalone-package
   iterations (`index.ts`, `package.json` in `scripts/validate-frontmatter/`).

2. **Tried `pnpx jsonschema`** — package has no binary, abandoned.

3. **Tried piping yq output directly to `pnpx <validator>`** — pnpm dlx runs
   in a temp working directory, so piped stdin and `/dev/stdin` both fail.

4. **Settled on `ajv-cli` with a temp dir**:
   - Loop through `.md` files; validate filename regex in bash.
   - Extract frontmatter as JSON via `yq -o=json --front-matter=extract '.' "$file"` into a temp dir.
   - Run one `pnpx ajv-cli validate -s "$SCHEMA" -d "$tmpdir/*.json"` call for all files at once.
   - `trap 'rm -rf "$tmpdir"' EXIT` for cleanup.

5. **Created `schema.json`** — JSON Schema draft-07 covering all required and
   optional frontmatter fields.

6. **Updated SKILL.md** to reflect the new `bash validate-frontmatter.sh`
   invocation.

7. **Ran `rulesync generate`** to sync to `.claude/`, `.cursor/`, `.gemini/`.

8. **Verified** against all 7 existing logbook entries — all pass, exit 0.

## Outcome

Script is ~35 lines of bash with no build step, no Node dependencies to manage,
and no workspace interaction. `pnpx ajv-cli` is fetched on demand by pnpm dlx.

### Key constraint discovered

`pnpx` (pnpm dlx) runs in an isolated temp directory. Piped stdin and process
substitution (`/dev/fd/N`) are not accessible to the subprocess, so a real temp
file is required to pass data to any `pnpx`-invoked tool.
