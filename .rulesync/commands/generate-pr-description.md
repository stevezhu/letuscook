---
targets:
  - '*'
description: ''
---

<!-- Referenced from: https://forum.cursor.com/t/generate-pr-description-from-pr-diff/20735/10 -->

# Generate PR Description Command

## Overview

Analyze the git diff in pr-diff.txt and create a comprehensive PR description (max 300 words) highlighting:

- High-level architectural changes
- Key features, added/modified
- Performance improvements
- Breaking changes (if any)
- Business impact

Focus on the 'why' and 'what' rather than detailed code changes.

DO include critical portions of the code changes that should be noted by future editors.

## Writing Style: Use Concise Text

Keep descriptions brief and actionable. Avoid redundant details, unnecessary counts, and verbose descriptors. **However, preserve technical details and reasoning that explain the "why" behind changes** — especially for architectural decisions, bug fixes, or non-obvious implementations.

**What to remove:**

- Exact counts when unnecessary (e.g., "50+", "25+")
- Redundant adjectives (e.g., "production-ready", "comprehensive", "complete")
- Exhaustive lists of sub-items (e.g., "including forms, dialogs, charts...")
- Verbose phrases that can be simplified (e.g., "built on X primitives" → "with X")

**What to keep:**

- Technical reasoning (e.g., "to comply with Node.js spec-compliant import resolution")
- Implementation details that aren't obvious (e.g., "fallback arrays to single path patterns")
- Critical context for future maintainers (e.g., "that only validates path structure")
- Commands and specific technical decisions (e.g., `--allow-build=msw`)

**Examples:**

Remove fluff, keep substance:

- ✅ CORRECT: **Shadcn Components**: Added via `pnpm dlx shadcn@latest add --all --allow-build=msw`
- ❌ INCORRECT: **50+ Shadcn Components**: Complete implementation including forms, dialogs, charts (Recharts), navigation, data display, and layout components generated via `pnpm dlx shadcn@latest add --all --allow-build=msw`

Remove counts and redundant descriptors:

- ✅ CORRECT: **Component Library Architecture**: Created `@workspace/shadcn` package with Base UI primitives and Tailwind CSS styling
- ❌ INCORRECT: **Component Library Architecture**: Created `@workspace/shadcn` package containing 50+ production-ready UI components built on Base UI primitives with Tailwind CSS styling

Keep technical details and reasoning:

- ✅ CORRECT: **Import Resolution Fix**: Changed subpath imports from fallback arrays to single path patterns to comply with Node.js spec-compliant import resolution that only validates path structure
- ❌ INCORRECT: **Import Resolution Fix**: Changed subpath imports to single path patterns for spec-compliant resolution

**GitHub URLs**: Use raw URLs directly without markdown link syntax. GitHub automatically generates rich UI previews for raw URLs:

- ✅ CORRECT: `https://github.com/owner/repo/issues/123`
- ❌ INCORRECT: `[Issue #123](https://github.com/owner/repo/issues/123)`

**IMPORTANT**: Output ONLY the PR description markdown content that can be copied directly to GitHub/Azure DevOps. Do not include any AI commentary, tool execution details, or explanatory text. Start directly with the PR title and content.

After generating the PR description, clean up by deleting pr-diff.txt file.

## Manual Workflow

1. **Generate diff**: `git diff main > pr-diff.txt`
2. **Analyze with AI**: Use this prompt with the generated file
3. **Cleanup**: `rm pr-diff.txt` (or `del pr-diff.txt` on Windows)

## AI Prompt Template

```
Based on the git diff in pr-diff.txt, create a comprehensive PR description (max 300 words).

**CRITICAL**: Output ONLY the markdown PR description content. No AI commentary, no tool execution details, no explanatory text. Start immediately with the PR title and description that can be copied directly to GitHub/Azure DevOps.

Include these sections:

## Overview
Brief summary of what this PR accomplishes

## 🏗️ High-Level Architectural Changes
Focus on system design changes, new patterns, architectural decisions

## 🎯 Key Features
Major features added, modified, or removed

## 🚀 Performance & Operational Improvements
Resource optimization, monitoring enhancements, deployment improvements

## 🔄 Service Changes
How each service/component behavior changed

## 🎯 Business Impact
Reliability, operational excellence, developer experience improvements

## Technical Details
- Breaking changes: None/List them

Focus on architectural significance rather than implementation details.

---

*This PR description was automatically generated from git diff analysis*
```

## PowerShell Script Alternative

Create `generate-pr-description.ps1`:

```powershell
#!/usr/bin/env pwsh
param(
    [string]$BaseBranch = "main",
    [string]$OutputFile = "pr-diff.txt"
)

Write-Host "🔍 Generating diff against $BaseBranch..." -ForegroundColor Cyan
git diff $BaseBranch > $OutputFile

$fileCount = (git diff --name-only $BaseBranch | Measure-Object).Count
$stats = git diff --stat $BaseBranch

Write-Host "📊 Changes Summary:" -ForegroundColor Green
Write-Host "Files changed: $fileCount" -ForegroundColor Yellow
Write-Host $stats -ForegroundColor Gray

Write-Host "`n✅ Generated $OutputFile" -ForegroundColor Green
Write-Host "💡 Next: Ask AI to analyze the diff and generate PR description" -ForegroundColor Blue
Write-Host "🧹 Remember to delete $OutputFile after generating the description" -ForegroundColor Yellow
```

Usage: `./generate-pr-description.ps1 -BaseBranch origin/main`
