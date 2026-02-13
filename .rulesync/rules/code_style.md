---
targets:
  - '*'
root: false
description: Code style conventions and best practices for the project
globs:
  - '**/*.ts'
  - '**/*.tsx'
  - '**/*.js'
  - '**/*.jsx'
  - '**/package.json'
cursor:
  alwaysApply: false
---

# Code Style Conventions

## Import Style: Use Subpath Imports, Not TypeScript Compiler Paths

For internal package imports within the same package, use subpath imports defined in `package.json` rather than TypeScript compiler `paths` in `tsconfig.json`.

### Why?

- Subpath imports work at runtime without transpilation
- They work in both TypeScript and JavaScript
- They're standardized in Node.js (package.json `imports` field)
- No tooling configuration needed beyond package.json

### Examples

```json
// ✅ GOOD: package.json with subpath imports
{
  "name": "@crm/app",
  "imports": {
    "#*": "./src/*",
    "#components/*": "./src/components/*"
  }
}
```

```typescript
// ✅ GOOD: Using subpath imports with .js extensions
import { Button } from '#components/Button.js';
import { useAuth } from '#hooks/useAuth.js';
```

```json
// ❌ BAD: tsconfig.json with path aliases for internal imports
{
  "compilerOptions": {
    "paths": {
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"]
    }
  }
}
```

```typescript
// ❌ BAD: Using TypeScript path aliases
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
```

## File Extensions: Always Use .js in TypeScript Imports

TypeScript imports of local files must include the `.js` extension, even when importing `.ts` or `.tsx` files.

### Why?

- Required for ESM compatibility and Node.js module resolution
- TypeScript doesn't rewrite import paths during compilation
- Ensures runtime imports work correctly without additional tooling
- Aligns with modern JavaScript standards

### Examples

```typescript
// ✅ GOOD: Include .js extension
import { formatDate } from './utils/dates.js';
import { Button } from '#components/Button.js';
import type { User } from '../types/user.js';

// ❌ BAD: Missing extension
import { formatDate } from './utils/dates';
import { Button } from '#components/Button';
import type { User } from '../types/user';
```

### Notes

- Use `.js` even when importing from `.ts` or `.tsx` files
- Package imports (e.g., `from 'react'`) never need extensions
- Configure TypeScript with `"moduleResolution": "bundler"` or `"node16"` to support this
