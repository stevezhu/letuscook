---
name: setup-eslint
description: 'Setup ESLint for a new package or app in the monorepo'
targets: ['*']
---

# ESLint Setup for New Packages

This guide defines the baseline ESLint configuration every package in the monorepo must provide. Follow these steps whenever you scaffold a new package or app so linting stays consistent across the workspace.

## 1. Install Dependencies

Each package manages its own dev dependencies. Add the shared config and ESLint to the package manifest:

```
pnpm add -D @stzhu/eslint-config eslint
```

## 2. Create `eslint.config.ts`

Place the config file at the package root (`<package>/eslint.config.ts`). Use the shared flat configs and add package-specific tweaks if needed.

Common patterns:

- **React-only packages** (libraries, UI kits):

```
import react from '@stzhu/eslint-config/react';
import { defineConfig } from 'eslint/config';

export default defineConfig(react);
```

- **React apps with Tailwind / Storybook / TanStack integrations**:

```
import react from '@stzhu/eslint-config/react';
import storybook from '@stzhu/eslint-config/storybook';
import tailwind from '@stzhu/eslint-config/tailwind';
import pluginQuery from '@tanstack/eslint-plugin-query';
import pluginRouter from '@tanstack/eslint-plugin-router';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig(
  globalIgnores(['dist/']),
  react,
  tailwind,
  {
    settings: {
      'better-tailwindcss': {
        entryPoint: './src/main.css',
      },
    },
  },
  storybook,
  pluginRouter.configs['flat/recommended'],
  pluginQuery.configs['flat/recommended'],
);
```

After you paste the snippet, double-check the `entryPoint` value:

- Use the path to the primary Tailwind CSS (or global styles) file that the package actually builds. For Vite/React packages this is usually `src/main.css`.
- For Electron apps, point to the renderer entry (e.g. `src/renderer/src/assets/main.css`).
- If the package keeps styles elsewhere (such as `src/main.css`), update the path accordingly so the `better-tailwindcss` plugin resolves utilities correctly.

**Electron / desktop apps**: add `globalIgnores` for build artefacts like `out/` or `.vite/` directories.

The key rule: import only the mixins you need, keep overrides minimal, and always wrap with `defineConfig(...)`.

## 3. Update Package Scripts

Expose lint targets so `turbo` can orchestrate them. In the package `package.json` add:

```
"scripts": {
  "lint": "eslint .",
  "lint:fix": "eslint . --fix"
}
```

If the project already has scripts, make sure lint commands exist and align with these defaults.

## 4. Verify Turborepo Integration

The root `package.json` already defines `turbo run lint` and `turbo run lint:fix`. New packages must register their local scripts (Step 3) so Turbo can discover them automatically. No extra wiring is required.

## 5. Add Repository-Wide Ignores (optional)

When a package produces generated code, add the paths to `globalIgnores(...)` inside its ESLint config. Do **not** edit the root `.eslintignore`; flat configs manage ignores per package.

## 6. Validate

Run lint before committing:

```
pnpm turbo run lint --filter <package-name>
```

Or lint the package directly:

```
cd <package>
pnpm lint
```

Fix any issues with `pnpm lint:fix`.

## 7. Keep In Sync

When shared configs change (`@stzhu/eslint-config` upgrade), update all packages by bumping the version and running `pnpm install`. Ensure any custom overrides still apply cleanly.
