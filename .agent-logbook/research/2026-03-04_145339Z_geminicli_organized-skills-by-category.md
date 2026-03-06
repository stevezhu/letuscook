---
date: 2026-03-04T14:53:39Z
type: research
status: complete
agent: geminicli
models: [gemini-3-flash-preview]
branch: t2
tags: [skills, documentation, organization]
---

# Organized Agent Skills Taxonomy

## Summary

This report provides a categorized overview of the 80+ specialized AI agent skills available in the codebase. It organizes them into logical clusters (Development, Product, Growth, Sales, Workflow, and Meta-Operations) to improve discoverability and selection for various engineering and marketing tasks.

## Question

How can the extensive library of specialized agent skills be organized into a meaningful taxonomy to help users and agents identify the most appropriate tool for a given task?

## Findings

The current skill library covers a wide range of domains from core backend infrastructure (Convex) to specialized marketing strategies (CRO, SEO). The following taxonomy has been developed to organize these capabilities:

### 🏗️ Development & Engineering

_Core implementation, infrastructure, and technical problem-solving._

- **Backend (Convex):** `convex`, `convex-agents`, `convex-best-practices`, `convex-component-authoring`, `convex-cron-jobs`, `convex-file-storage`, `convex-functions`, `convex-http-actions`, `convex-migrations`, `convex-realtime`, `convex-schema-validator`, `convex-security-audit`, `convex-security-check`
- **Mobile (Expo/React Native):** `building-native-ui`, `expo-react-native-coder`, `expo-react-native-performance`, `uniwind`
- **Web & UI:** `frontend-design`, `native-data-fetching`, `vite`
- **Testing & Quality:** `maestro-e2e`, `systematic-debugging`, `test-driven-development`, `vitest`
- **Tools & Infra:** `pnpm`, `tsdown`, `turborepo`

### 🎨 Product & Design

_Strategy, architecture, and user experience._

- **Strategy:** `avoid-feature-creep`, `brainstorming`
- **UX & UI Design:** `web-design-guidelines`, `design-md`
- **Information Architecture:** `site-architecture`

### 📈 Growth & Marketing

_User acquisition, conversion optimization, and content strategy._

- **Conversion Rate Optimization (CRO):** `ab-test-setup`, `form-cro`, `onboarding-cro`, `page-cro`, `paywall-upgrade-cro`, `popup-cro`, `signup-flow-cro`
- **SEO:** `ai-seo`, `programmatic-seo`, `schema-markup`, `seo-audit`
- **Content & Copy:** `content-strategy`, `copy-editing`, `copywriting`, `social-content`
- **Outreach & Lifecycle:** `cold-email`, `email-sequence`
- **Ads & Strategy:** `ad-creative`, `paid-ads`, `marketing-ideas`, `marketing-psychology`, `free-tool-strategy`, `launch-strategy`, `product-marketing-context`, `referral-program`
- **Retention:** `churn-prevention`

### 💰 Sales & Revenue

_Direct revenue operations and sales support._

- `pricing-strategy`, `revops`, `sales-enablement`, `competitor-alternatives`

### 📋 Project Workflow & Management

_Planning, git operations, and team collaboration._

- **Planning & Execution:** `executing-plans`, `writing-plans`, `project-context`, `agent-logbook`
- **OpenSpec Workflow:** `openspec-apply-change`, `openspec-archive-change`, `openspec-explore`, `openspec-propose`
- **Git & PRs:** `using-git-worktrees`, `finishing-a-development-branch`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion`
- **Documentation:** `doc-coauthoring`

### 🤖 Meta-Agent & AI Operations

_Skills that manage other skills or agent behavior._

- **Skill Management:** `find-skills`, `skill-creator`, `writing-skills`, `using-superpowers`
- **Orchestration:** `dispatching-parallel-agents`, `subagent-driven-development`
- **Data Ingestion:** `mdrip`

## Recommendation

Maintain this taxonomy in a centralized location (like `AGENT_SKILLS.md` or as part of the `agent-logbook` research) and reference it when onboarding new developers or when agents are unsure which specialized skill to activate. This categorization should be updated whenever new skills are added or existing ones are refactored.

## References

- [Agent Logbook Skill Instructions](mdc:.rulesync/skills/agent-logbook/SKILL.md)
- [Available Skills List](mdc:.rulesync/skills/)
