---
targets:
  - '*'
root: false
description: >-
  Guidelines for creating and maintaining AI agent rules to ensure consistency and
  effectiveness across all AI development tools.
globs:
  - .rulesync/rules/*.md
cursor:
  alwaysApply: true
---

- **Required Rule Structure:**

  ```markdown
  ---
  root: false # true for overview files, false for detailed rules
  targets: ['*'] # * = all tools, or specific tools like ["cursor", "claudecode"]
  description: Clear, one-line description of what the rule enforces
  globs: ['path/to/files/*.ext', 'other/path/**/*'] # file patterns to match
  cursor: # cursor-specific parameters (optional)
    alwaysApply: true
    description: 'Rule description for Cursor'
  ---

  - **Main Points in Bold**
    - Sub-points with details
    - Examples and explanations
  ```

- **File References:**
  - Use `[filename](mdc:path/to/file)` ([filename](mdc:filename)) to reference files
  - Example: [prisma.mdc](mdc:./prisma.mdc) for rule references
  - Example: [schema.prisma](mdc:prisma/schema.prisma) for code references

- **Code Examples:**
  - Use language-specific code blocks with clear DO/DON'T annotations

  ```typescript
  // ✅ DO: Show good examples
  const goodExample = true;

  // ❌ DON'T: Show anti-patterns
  const badExample = false;
  ```

- **Rule Content Guidelines:**
  - Start with high-level overview
  - Include specific, actionable requirements
  - Show examples of correct implementation
  - Reference existing code when possible
  - Keep rules DRY by referencing other rules
  - Make rules tool-agnostic when possible, use tool-specific parameters for exceptions

- **Rule Maintenance:**
  - Update rules when new patterns emerge
  - Add examples from actual codebase
  - Remove outdated patterns
  - Cross-reference related rules

- **Best Practices:**
  - Use bullet points for clarity
  - Keep descriptions concise
  - Include both DO and DON'T examples
  - Reference actual code over theoretical examples
  - Use consistent formatting across rules
  - Leverage tool-specific parameters only when necessary
