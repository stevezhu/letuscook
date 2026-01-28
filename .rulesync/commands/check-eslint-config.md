---
targets:
  - '*'
description: ''
---

# Check ESLint Config Command

Check all ESLint configuration files in the monorepo to ensure they have the proper `tsconfigRootDir` setting in their `languageOptions.parserOptions`.

## Expected Pattern

For **ESM configs** (eslint.config.ts/mjs):

```typescript
{
  languageOptions: {
    parserOptions: { tsconfigRootDir: import.meta.dirname },
  },
}
```

For **CommonJS configs** (eslint.config.js/cjs):

```javascript
{
  languageOptions: {
    parserOptions: { tsconfigRootDir: __dirname },
  },
}
```

## Steps

1. Find all `eslint.config.{ts,js,mjs,cjs}` files in:
   - `apps/*/`
   - `packages/*/`

2. For each config file:
   - Check if it contains `tsconfigRootDir` in the parserOptions
   - Verify it uses the correct format:
     - `import.meta.dirname` for ESM (.ts, .mjs)
     - `__dirname` for CommonJS (.js, .cjs)

3. Report:
   - ✅ Configs that have the correct setting
   - ❌ Configs that are missing it or have the wrong format
   - Provide specific fixes for any issues found

## Why This Matters

Setting `tsconfigRootDir` ensures that TypeScript ESLint can properly resolve the tsconfig.json file relative to each workspace, which is critical for:

- Type-aware linting rules
- Proper TypeScript project references
- Accurate import resolution in monorepos
