#!/usr/bin/env bash
# Validates .agent-logbook markdown frontmatter.
# Usage: bash validate-frontmatter.sh [path]
# Requires: yq, pnpm

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA="$SCRIPT_DIR/schema.json"
FILENAME_RE='^[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{6}Z_[a-z][a-z0-9-]*_[a-z][a-z0-9-]+\.md$'

target="${1:-.agent-logbook}"

if [[ ! -e "$target" ]]; then
  echo "Error: path not found: $target" >&2
  exit 2
fi

tmpfile="$(mktemp /tmp/validate-fm-XXXXXX.json)"
trap 'rm -f "$tmpfile"' EXIT

passed=0
failed=0

while IFS= read -r file; do
  filename="$(basename "$file")"
  errors=()

  if ! [[ "$filename" =~ $FILENAME_RE ]]; then
    errors+=("filename: must match YYYY-MM-DD_HHMMSSZ_agent_slug.md")
  fi

  yq -o=json --front-matter=extract '.' "$file" > "$tmpfile" 2>/dev/null || \
    errors+=("frontmatter: could not parse YAML")

  if [[ ${#errors[@]} -eq 0 ]]; then
    schema_out="$(pnpx --yes jsonschema -i "$tmpfile" -s "$SCHEMA" 2>&1)" || \
      errors+=("$schema_out")
  fi

  if [[ ${#errors[@]} -eq 0 ]]; then
    echo "PASS $file"
    ((passed++)) || true
  else
    echo "FAIL $file"
    for e in "${errors[@]}"; do echo "  $e"; done
    ((failed++)) || true
  fi
done < <(find "$target" -type f -name "*.md" ! -name "README.md" | grep -v '/templates/' | sort)

echo ""
echo "$passed passed, $failed failed"
exit $((failed > 0 ? 1 : 0))
