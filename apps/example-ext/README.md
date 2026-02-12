# example-ext

Boilerplate for a WXT-based browser extension.

## Prerequisites

- **Node.js**: >= 25
- **pnpm**: ^10.0.0

## Getting Started

### 1. Install Dependencies

From the repository root:

```bash
pnpm install
```

### 2. Development

Run the extension in development mode with hot reload:

```bash
# For Chrome (default)
pnpm dev

# For Firefox
pnpm dev:firefox
```

## Available Scripts

### Development

- `pnpm dev` - Start development mode for Chrome
- `pnpm dev:firefox` - Start development mode for Firefox

### Building

- `pnpm build` - Build production-ready extension for Chrome
- `pnpm build:firefox` - Build production-ready extension for Firefox
- `pnpm zip` - Create a zip file for Chrome Web Store submission
- `pnpm zip:firefox` - Create a zip file for Firefox Add-ons submission

### Code Quality

- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Run ESLint and auto-fix issues
- `pnpm test` - Run TypeScript type checking

## Tech Stack

- **Framework**: [WXT](https://wxt.dev/)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Shared UI**: @workspace/shadcn
