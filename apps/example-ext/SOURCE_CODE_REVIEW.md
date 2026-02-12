# Building for Firefox

## Prerequisites

- Node.js >= 25
- pnpm >= 10.0.0

## Build Steps

1. (Optional) Enable corepack:

   ```bash
   corepack enable
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build for Firefox:

   ```bash
   pnpm run --filter=nulltab-ext build:firefox
   ```

4. The built extension will be in `apps/nulltab-ext/.output/`
