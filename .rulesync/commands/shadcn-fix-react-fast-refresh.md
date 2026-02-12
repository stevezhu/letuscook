---
targets:
  - '*'
description: ''
---

# Fix React Fast Refresh Warnings in shadcn Components

## Problem

Component files are exporting both React components AND non-component values (like `cva` variants, types, or constants), which breaks React Fast Refresh.

## Solution

Extract non-component exports to organized directories:

- **Variants**: Extract to `src/variants/<componentName>.ts` (e.g., `badge.ts`, `button.ts`)
- **Hooks**: Extract to `src/hooks/<hook-name-in-dash-case>.ts` (e.g., `use-form-field.ts`, `use-sidebar.ts`)

## Step 1: Identify Files to Fix

Run the linter to find all React Fast Refresh warnings:

```bash
pnpm --filter @workspace/shadcn run lint
```

Look for warnings like:

```
warning  Fast refresh only works when a file only exports components. Use a new file to share constants or functions between components  react-refresh/only-export-components
```

Each warning will show you which file needs to be fixed and which line has the problematic export.

## Step 2: Fix Each File

### Example 1: badge.tsx (Extracting Variants)

**Step 1:** Create `packages/shadcn/src/variants/badge.ts`

```typescript
import { cva } from 'class-variance-authority';

export const badgeVariants = cva('...', {
  // ... variant code
});
```

**Step 2:** Update `badge.tsx` to import from variants directory:

```typescript
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@workspace/shadcn/lib/utils';
import { type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { badgeVariants } from '@workspace/shadcn/variants/badge';

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge };
```

### Example 2: form.tsx (Extracting Hooks)

**Step 1:** Create `packages/shadcn/src/hooks/use-form-field.ts`

```typescript
import * as React from 'react';
import { useFormContext, useFormState } from 'react-hook-form';
import type { FieldPath, FieldValues } from 'react-hook-form';

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

export const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

type FormItemContextValue = {
  id: string;
};

export const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

export const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};
```

**Step 2:** Update `form.tsx` to import from hooks directory:

```typescript
import {
  FormFieldContext,
  FormItemContext,
  useFormField,
} from '@workspace/shadcn/hooks/use-form-field';

// ... rest of component code

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
};
```

## Step 3: Apply the Pattern to All Files

For each file with warnings:

1. **Identify the non-component export** by checking the line number in the warning
2. **Determine the export type:**
   - If it's a `cva()` call → extract to `src/variants/<componentName>.ts`
   - If it's a custom hook (starts with `use`) → extract to `src/hooks/<hook-name-in-dash-case>.ts`
     - Example: `useFormField` → `use-form-field.ts`
     - Example: `useSidebar` → `use-sidebar.ts`
3. **Create the new file** in the appropriate directory
4. **Move the code** to the new file
5. **Update the component file:**
   - Import from `@workspace/shadcn/variants/...` or `@workspace/shadcn/hooks/...`
   - **Only export components** (remove non-component exports)
6. **Update imports in other files** that used the non-component exports:
   - Change from importing from the component file to importing directly from `@workspace/shadcn/variants/...` or `@workspace/shadcn/hooks/...`
7. **Test the change** - the file should no longer appear in linter warnings

<!-- TODO: test this step again since it was done manually this time -->

## Step 4: Fix Imports in Other Files

After extracting variants and hooks, you need to update imports across the codebase that reference the old locations.

### Find What Was Extracted

Use git to identify newly created variant and hook files:

```bash
# Show all new untracked files in the shadcn src directory
git ls-files --others --exclude-standard packages/shadcn/src/
```

For each new file, extract the export names to search for:

```bash
# Example: Get exported names from a variant file
grep "export" packages/shadcn/src/variants/badge.ts

# This will show something like: export const badgeVariants = ...
```

### Search for Old Imports

For each exported name found (e.g., `badgeVariants`, `useFormField`), search for files still importing from the old location:

```bash
# Example: Search for files importing badgeVariants from components
grep -r "badgeVariants.*from '@workspace/shadcn/components/badge'" packages/shadcn/src

# Or search more broadly for any variant/hook imports from components
grep -r "from '@workspace/shadcn/components/" packages/shadcn/src --include="*.tsx" --include="*.ts" | grep -E "(Variants|Style|use[A-Z])"
```

### Common Import Fixes

**Example 1: Variants imported from component files**

Before:

```typescript
import { buttonVariants } from '@workspace/shadcn/components/button';
```

After:

```typescript
import { buttonVariants } from '@workspace/shadcn/variants/button';
```

**Example 2: Split imports when both component and variant are needed**

Before:

```typescript
import { Button, buttonVariants } from '@workspace/shadcn/components/button';
```

After:

```typescript
import { Button } from '@workspace/shadcn/components/button';
import { buttonVariants } from '@workspace/shadcn/variants/button';
```

### Update Process

For each file found in the search above:

1. **Identify what's being imported** (variant or hook)
2. **Check if it exists** in the corresponding directory:
   - Variants: `packages/shadcn/src/variants/<componentName>.ts` (e.g., `badge.ts`)
   - Hooks: `packages/shadcn/src/hooks/<hook-name-in-dash-case>.ts` (e.g., `use-form-field.ts`)
3. **Update the import** to use the new location
4. **Split imports** if both component and non-component are imported together

### Verify Imports

After updating imports, run the linter to ensure there are no import errors:

```bash
pnpm -w run lint --filter @workspace/shadcn
```

## Step 5: Validation

After fixing all files, run the linter again to verify:

```bash
pnpm -w run lint --filter @workspace/shadcn
```

All "react-refresh/only-export-components" warnings should be resolved.
