#!/usr/bin/env bash
# validate-agent-logbook — Validates .agent-logbook markdown frontmatter.
#
# Usage:
#   bash validate.sh [path] [--json] [--help]
#
# Requires: yq, pnpm (for pnpx jsonschema)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA="$SCRIPT_DIR/schema.json"
FILENAME_RE='^[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{6}Z_[a-z][a-z0-9-]*_[a-z][a-z0-9-]+\.md$'

# ---------------------------------------------------------------------------
# CLI args
# ---------------------------------------------------------------------------

show_help() {
  cat <<EOF
Usage: validate-agent-logbook [path] [options]

Validates .agent-logbook markdown documents against the frontmatter
schema and filename conventions.

Arguments:
  path    File or directory to validate (default: .agent-logbook/)

Options:
  --json  Output results as JSON array to stdout
  --help  Show this help message

Filename format:
  YYYY-MM-DD_HHMMSSZ_agent_slug.md

Required fields:
  date    ISO 8601 UTC — YYYY-MM-DDTHH:MM:SSZ
  type    activity | research | decision | plan
  status  complete | in-progress | abandoned | success | failure | partial
  agent   non-empty string
  branch  non-empty string

Exit codes:
  0  All files passed
  1  One or more validation failures
  2  Usage error (bad arguments, path not found)
EOF
}

json_mode=false
target=".agent-logbook"

for arg in "$@"; do
  case "$arg" in
    --help|-h) show_help; exit 0 ;;
    --json)    json_mode=true ;;
    --*)       echo "Unknown option: $arg" >&2; exit 2 ;;
    *)         target="$arg" ;;
  esac
done

if [[ ! -e "$target" ]]; then
  echo "Error: path not found: $target" >&2
  exit 2
fi

# ---------------------------------------------------------------------------
# Collect markdown files
# ---------------------------------------------------------------------------

collect_files() {
  local path="$1"
  if [[ -f "$path" ]]; then
    if [[ "$path" == *.md ]]; then echo "$path"; fi
    return
  fi
  find "$path" -type f -name "*.md" ! -name "README.md" \
    | grep -v '/templates/' \
    | sort
}

# ---------------------------------------------------------------------------
# Validate a single file
# ---------------------------------------------------------------------------

# Arrays to accumulate JSON results (bash 3 compat: use indexed arrays)
json_results=()
passed=0
failed=0

validate_file() {
  local file="$1"
  local filename
  filename="$(basename "$file")"
  local errors=()

  # Filename format
  if ! [[ "$filename" =~ $FILENAME_RE ]]; then
    errors+=("filename: must match YYYY-MM-DD_HHMMSSZ_agent_slug.md (got: $filename)")
  fi

  # Extract YAML frontmatter (lines between first and second ---)
  local frontmatter
  frontmatter="$(awk 'NR==1{if(/^---$/){found=1;next} else exit} found{if(/^---$/){exit} print}' "$file")"

  if [[ -z "$frontmatter" ]]; then
    errors+=("frontmatter: missing — file must begin with --- ... ---")
  else
    # Convert YAML to JSON
    local tmpfile
    tmpfile="$(mktemp /tmp/validate-frontmatter-XXXXXX.json)"
    trap 'rm -f "$tmpfile"' RETURN

    if ! echo "$frontmatter" | yq -o=json '.' > "$tmpfile" 2>/dev/null; then
      errors+=("frontmatter: could not parse YAML")
    else
      # Validate against schema
      local schema_out
      if ! schema_out="$(pnpx --yes jsonschema -i "$tmpfile" -s "$SCHEMA" 2>&1)"; then
        # Extract just the error lines (jsonschema prints them to stdout)
        while IFS= read -r line; do
          [[ -n "$line" ]] && errors+=("schema: $line")
        done <<< "$schema_out"
      fi
    fi
  fi

  # Accumulate result
  if [[ ${#errors[@]} -eq 0 ]]; then
    ((passed++)) || true
    if $json_mode; then
      json_results+=("{\"file\":$(printf '%s' "$file" | jq -R .),\"passed\":true,\"errors\":[]}")
    else
      printf '  \033[32m✓\033[0m %s\n' "$file"
    fi
  else
    ((failed++)) || true
    if $json_mode; then
      local err_json="[]"
      for e in "${errors[@]}"; do
        err_json="$(echo "$err_json" | jq --arg e "$e" '. + [$e]')"
      done
      json_results+=("{\"file\":$(printf '%s' "$file" | jq -R .),\"passed\":false,\"errors\":$err_json}")
    else
      printf '  \033[31m✗\033[0m %s\n' "$file"
      for e in "${errors[@]}"; do
        printf '    \033[2m%s\033[0m\n' "$e"
      done
    fi
  fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

mapfile -t files < <(collect_files "$target")

if [[ ${#files[@]} -eq 0 ]]; then
  if $json_mode; then
    echo '{"files":[],"passed":0,"failed":0}'
  else
    echo "No markdown files found in: $target"
  fi
  exit 0
fi

if ! $json_mode; then
  printf '\nValidating %d file(s) in %s\n\n' "${#files[@]}" "$target"
fi

for file in "${files[@]}"; do
  validate_file "$file"
done

if $json_mode; then
  # Join array elements with commas
  local_ifs="$IFS"
  IFS=','
  echo "{\"files\":[${json_results[*]}],\"passed\":$passed,\"failed\":$failed}"
  IFS="$local_ifs"
else
  printf '\n────────────────────────────────────────\n'
  if [[ $failed -eq 0 ]]; then
    printf '\033[32mAll %d file(s) passed.\033[0m\n' "$passed"
  else
    printf '\033[31m%d file(s) failed\033[0m, %d passed.\n' "$failed" "$passed"
  fi
fi

exit $((failed > 0 ? 1 : 0))
