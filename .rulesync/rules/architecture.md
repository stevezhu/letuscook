---
targets:
  - '*'
description: 'Architecture overview and technology stack for the agent-crm monorepo.'
root: false
globs:
  - '**/*'
cursor:
  alwaysApply: true
---

# Agent CRM Architecture Overview

## **Monorepo Structure**

The project is a **Turborepo** monorepo using **PNPM Workspaces**.

### **Applications (`apps/`)**

- **`assistant-web`**: The main web application (see **Web Architecture** section below).
- **`assistant-mobile`**: The mobile application (see **Mobile Architecture** section below).
- **`assistant-server`**: The backend server (see **Backend Architecture** section below).
- **`assistant-desktop`**: The desktop application (see **Desktop Architecture** section below).
- **`assistant-ext`**: The browser extension (see **Extension Architecture** section below).

### **Packages (`packages/`)**

- **`@workspace/shadcn`**: Shared UI component library.
  - **Stack**: Base UI, Tailwind CSS v4, Lucide React.
- **`@workspace/rn-reusables`**: Shared UI component library for mobile.
  - **Stack**: React Native Primitives, UniWind, Lucide React Native.
- **`@example/app`**: Shared web application logic and feature components.
  - **Stack**: React, TanStack Router, Storybook.

## **Core Technologies**

- **TypeScript** - Primary language (Strict mode).
- **PNPM** - Package manager (with Catalogs).
- **Turborepo** - Build system and task orchestration.

## **State Management**

**Guidelines for Web & Mobile:**

- Use **TanStack Query** for async operations, data fetching, and server state management. Do not create custom `useAsync` hooks.
- Use **TanStack Pacer** for debouncing and throttling. Do not create custom `useDebounce` hooks.

## **Web Architecture**

- **React 19** - UI library.
- **Vite** - Build tool.
- **TanStack Router** - Type-safe routing.
- **TanStack Query** - Data fetching and state management.
- **TanStack Pacer** - Debouncing and throttling utilities.
- **Tailwind CSS v4** - Utility-first CSS framework.
- **Shadcn** - UI component architecture (using Base UI).
- **Lucide React** - Icon library.

**UI Components**: Use `@workspace/shadcn` for all web UI components. Import from `@workspace/shadcn/src/components/*`.

## **Mobile Architecture**

- **React Native** - Mobile framework.
- **Expo** - Framework and platform for React Native.
- **Expo Router** - File-based routing for React Native.
- **TanStack Query** - Data fetching and state management.
- **TanStack Pacer** - Debouncing and throttling utilities.
- **UniWind** - Tailwind CSS for React Native.
- **Lucide React Native** - Icon library.

**UI Components**: Use `@workspace/rn-reusables` for all mobile UI components. Import from `@workspace/rn-reusables/src/components/*`.

## **Extension Architecture**

- **WXT** - Browser extension framework.
- **React** - UI library for extension pages and popups.
- **Vite** - Build tool (via WXT).
- **Tailwind CSS v4** - Utility-first CSS framework.
- **Lucide React** - Icon library.

**UI Components**: Use `@workspace/shadcn` for all extension UI components. Import from `@workspace/shadcn/src/components/*`.

## **Backend Architecture**

- **Hono** - Web framework for the Edges.
- **Cloudflare Workers** - Serverless execution environment.
- **Drizzle ORM** - TypeScript ORM for database operations.

## **Quality & Tooling**

- **TypeScript** - Static type checking.
- **oxlint** - Fast linter for correctness, performance, React, and Vitest rules.
- **oxfmt** - Fast formatter (import ordering, print width 80).
- **ESLint** - Linting (`@stzhu/eslint-config`).
- **Prettier** - Formatting.
- **Vitest** - Unit testing framework.
- **Jest + jest-expo** - Mobile testing framework.
- **Storybook** - UI component development and documentation.
- **Rulesync** - AI agent rule synchronization across tool targets.
- **GitHub Actions** - CI (build, lint, test) and PR title linting.
