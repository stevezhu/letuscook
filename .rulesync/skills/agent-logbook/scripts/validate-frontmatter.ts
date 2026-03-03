#!/usr/bin/env bun

// @ts-nocheck

/**
 * validate-frontmatter.ts — Validates agent-logbook markdown documents.
 *
 * Usage:
 *   bun run scripts/validate-frontmatter.ts [path] [--json] [--help]
 *
 * Outside a pnpm workspace, bun auto-installs deps on first run.
 * Inside a workspace (like this one), install once with:
 *   pnpm add -Dw gray-matter typebox
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

import { Type } from 'typebox@^0.34';
import { TypeCompiler } from 'typebox@^0.34/compiler';
import matter from 'gray-matter@^4';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const Frontmatter = Type.Object({
  date: Type.String({
    pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$',
  }),
  type: Type.Union([
    Type.Literal('activity'),
    Type.Literal('research'),
    Type.Literal('decision'),
    Type.Literal('plan'),
  ]),
  status: Type.Union([
    Type.Literal('complete'),
    Type.Literal('in-progress'),
    Type.Literal('abandoned'),
    Type.Literal('success'),
    Type.Literal('failure'),
    Type.Literal('partial'),
  ]),
  agent: Type.String({ minLength: 1 }),
  branch: Type.String({ minLength: 1 }),
  // Optional fields
  models: Type.Optional(Type.Array(Type.String(), { minItems: 1 })),
  task_id: Type.Optional(Type.String()),
  cost: Type.Optional(Type.String()),
  tags: Type.Optional(Type.Array(Type.String())),
  files_modified: Type.Optional(Type.Array(Type.String())),
  related_plan: Type.Optional(Type.String()),
});

const Validator = TypeCompiler.Compile(Frontmatter);

const FILENAME_RE =
  /^\d{4}-\d{2}-\d{2}_\d{6}Z_[a-z][a-z0-9-]*_[a-z][a-z0-9-]+\.md$/;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FieldError {
  field: string;
  message: string;
}

interface FileResult {
  file: string;
  passed: boolean;
  errors: FieldError[];
}

// ---------------------------------------------------------------------------
// Error formatting
//
// TypeBox union validation generates one error per branch — collapse them
// into a single human-readable message listing all allowed values.
// ---------------------------------------------------------------------------

function collapseErrors(
  rawErrors: Array<{
    path: string;
    message: string;
    schema: Record<string, unknown>;
  }>,
): FieldError[] {
  const byPath = new Map<string, typeof rawErrors>();
  for (const err of rawErrors) {
    const p = err.path || '/';
    const bucket = byPath.get(p);
    if (bucket) bucket.push(err);
    else byPath.set(p, [err]);
  }

  const out: FieldError[] = [];

  for (const [path, errs] of byPath) {
    const field = path.replace(/^\//, '') || 'frontmatter';
    const first = errs[0];

    // Union of literals — collect the `const` values from each branch error
    const literals = errs
      .map((e) => e.schema)
      .filter((s): s is { const: string } => typeof s.const === 'string');

    if (literals.length > 1) {
      const allowed = literals.map((s) => s.const).join(' | ');
      out.push({ field, message: `must be one of: ${allowed}` });
      continue;
    }

    // Pattern mismatch
    if (typeof first.schema.pattern === 'string') {
      out.push({
        field,
        message: `must match format ${first.schema.pattern}`,
      });
      continue;
    }

    out.push({ field, message: first.message });
  }

  return out;
}

// ---------------------------------------------------------------------------
// Validate a single file
// ---------------------------------------------------------------------------

function validateFile(filePath: string): FileResult {
  const errors: FieldError[] = [];
  const filename = basename(filePath);

  // Filename format
  if (!FILENAME_RE.test(filename)) {
    errors.push({
      field: 'filename',
      message: `must match YYYY-MM-DD_HHMMSSZ_agent_slug.md (got: ${filename})`,
    });
  }

  // Read file
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      file: filePath,
      passed: false,
      errors: [{ field: 'file', message: `could not read: ${msg}` }],
    };
  }

  // Parse frontmatter
  const { data } = matter(content);

  if (!data || Object.keys(data).length === 0) {
    errors.push({
      field: 'frontmatter',
      message: 'missing — file must begin with --- ... ---',
    });
    return { file: filePath, passed: errors.length === 0, errors };
  }

  // Schema validation
  const rawErrors = [...Validator.Errors(data)].map((e) => ({
    path: e.path,
    message: e.message,
    schema: e.schema as Record<string, unknown>,
  }));

  errors.push(...collapseErrors(rawErrors));

  return { file: filePath, passed: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Collect files
// ---------------------------------------------------------------------------

function collectFiles(target: string): string[] {
  const stat = statSync(target);
  if (stat.isFile()) return target.endsWith('.md') ? [target] : [];

  const out: string[] = [];

  function walk(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'templates') walk(full);
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.md') &&
        entry.name !== 'README.md'
      ) {
        out.push(full);
      }
    }
  }

  walk(target);
  return out.sort();
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const HELP = `\
Usage: bun run scripts/validate-frontmatter.ts [path] [options]

Validates .agent-logbook markdown documents against the frontmatter
schema and filename conventions.

Arguments:
  path    File or directory to validate (default: .agent-logbook/)

Options:
  --json  Output results as JSON to stdout
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
`;

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write(HELP);
    process.exit(0);
  }

  const jsonMode = args.includes('--json');
  const positional = args.filter((a) => !a.startsWith('--'));
  const target = positional[0] ?? '.agent-logbook';

  try {
    statSync(target);
  } catch {
    process.stderr.write(`Error: path not found: ${target}\n`);
    process.exit(2);
  }

  const files = collectFiles(target);

  if (files.length === 0) {
    if (jsonMode) {
      process.stdout.write(
        JSON.stringify({ files: [], passed: 0, failed: 0 }) + '\n',
      );
    } else {
      process.stdout.write(`No markdown files found in: ${target}\n`);
    }
    process.exit(0);
  }

  const results = files.map(validateFile);
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  if (jsonMode) {
    process.stdout.write(
      JSON.stringify({ files: results, passed, failed }, null, 2) + '\n',
    );
    process.exit(failed > 0 ? 1 : 0);
  }

  // Human-readable output
  const G = '\x1b[32m';
  const R = '\x1b[31m';
  const DIM = '\x1b[2m';
  const X = '\x1b[0m';

  for (const result of results) {
    process.stdout.write(`\n${DIM}${result.file}${X}\n`);
    if (result.passed) {
      process.stdout.write(`  ${G}✓ passed${X}\n`);
    } else {
      for (const err of result.errors) {
        process.stdout.write(`  ${R}✗ ${err.field}${X}: ${err.message}\n`);
      }
    }
  }

  process.stdout.write('\n────────────────────────────────────────\n');
  if (failed === 0) {
    process.stdout.write(`${G}All ${passed} file(s) passed.${X}\n`);
  } else {
    process.stdout.write(
      `${R}${failed} file(s) failed${X}, ${passed} passed.\n`,
    );
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
