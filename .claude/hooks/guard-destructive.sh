#!/usr/bin/env bash
# PreToolUse hook: blocks destructive Bash commands.
# Receives JSON on stdin with { tool_name, tool_input: { command } }.
# Exit 2 + stdout message = block the tool call.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)

if [ -z "$COMMAND" ]; then
  exit 0
fi

block() {
  echo "BLOCKED: $1"
  exit 2
}

# --- Git destructive commands ---

if echo "$COMMAND" | grep -qE '\bgit\s+push\b.*(\s--force\b|\s-f\b)'; then
  block "git push --force is not allowed. Use a regular push."
fi

if echo "$COMMAND" | grep -qE '\bgit\s+reset\s+--hard\b'; then
  block "git reset --hard is not allowed. Use git stash or create a backup branch first."
fi

if echo "$COMMAND" | grep -qE '\bgit\s+clean\b.*\s-[a-zA-Z]*f'; then
  block "git clean -f is not allowed. Remove files manually."
fi

if echo "$COMMAND" | grep -qE '\bgit\s+checkout\s+(\.|-- \.)'; then
  block "git checkout . is not allowed. Discard specific files instead."
fi

if echo "$COMMAND" | grep -qE '\bgit\s+restore\s+\.'; then
  block "git restore . is not allowed. Restore specific files instead."
fi

if echo "$COMMAND" | grep -qE '\bgit\s+branch\s+-D\b'; then
  block "git branch -D is not allowed. Use git branch -d for safe deletion."
fi

# --- Filesystem destructive commands ---

if echo "$COMMAND" | grep -qE '\brm\s+-[a-zA-Z]*r[a-zA-Z]*f|\brm\s+-[a-zA-Z]*f[a-zA-Z]*r'; then
  block "rm -rf is not allowed. Remove specific files or use the sandbox."
fi

# --- Skip hooks / bypass signing ---

if echo "$COMMAND" | grep -qE '\bgit\s+\w+.*\s--no-verify(\s|$)'; then
  block "git --no-verify is not allowed. Fix the hook issue instead."
fi

if echo "$COMMAND" | grep -qE '\bgit\s+\w+.*\s--no-gpg-sign(\s|$)'; then
  block "git --no-gpg-sign is not allowed."
fi

exit 0
