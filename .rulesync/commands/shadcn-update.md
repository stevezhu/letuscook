---
targets:
  - '*'
description: 'Update shadcn components to the latest version'
---

# Update shadcn Components

Update all shadcn/ui components in `packages/shadcn` to the latest version while preserving any custom modifications.

## Step 1: Update Components

Run the shadcn CLI to update all components:

```shell
pnpm --filter=@workspace/shadcn run shadcn:add-all
pnpm -w run lint:fix
```

Do not fix lint issues manually after running `lint:fix` here—they will be checked in Step 3.

This will overwrite all shadcn-generated component files with the latest versions.

## Step 2: Use Base Primitives (cmdk-base, vaul-base)

Remove the `cmdk` and `vaul` dependencies and rely on `cmdk-base` and `vaul-base` instead:

```shell
pnpm --filter=@workspace/shadcn remove cmdk vaul
```

Ensure `cmdk-base` and `vaul-base` remain in `packages/shadcn/package.json` dependencies. If the shadcn update added `cmdk` or `vaul` back, remove them again and keep only the `-base` variants.

Commit the changes from Steps 1 and 2 before continuing:

```shell
git add packages/shadcn/
git commit -m "chore(shadcn): update components, use cmdk-base and vaul-base"
```

## Step 3: Check for Remaining Custom Modifications

If the patch exists:

**1. Check the changes from the last update**

Review the saved diff that contains the custom modifications to re-apply

```shell
cat packages/shadcn/patches/src.diff
```

**2. Apply those changes**

From the repo root:

```shell
git apply packages/shadcn/patches/src.diff
```

Resolve any conflicts or apply failures and fix the tree so `packages/shadcn/src` matches the intended customizations.

**3. Overwrite `src.diff` with the diff of the changes made in this step**

After applying and any fixes, save the current customizations as the new baseline for the next update:

```shell
mkdir -p packages/shadcn/patches
git diff packages/shadcn/src > packages/shadcn/patches/src.diff
```

Run lint fix to resolve any issues from the applied changes:

```shell
pnpm -w run lint:fix
```

## Step 4: Verify

Run the full lint and type-check to ensure everything is working:

```shell
pnpm -w run lint
pnpm -w run test
```

Confirm:

- No new linter errors introduced
- No type errors
- Custom components and modifications are preserved
- Variant and hook extractions are intact
