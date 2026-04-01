---
id: '6c43881e-c344-4bfd-be84-ae82c0e00dc8'
title: 'Epic Brief: Letuscook - Personal Assistant MVP'
createdAt: '2026-02-13T05:45:42.404Z'
updatedAt: '2026-02-19T02:07:21.103Z'
type: spec
---

# Epic Brief: Letuscook - Personal Assistant MVP

## Summary

Letuscook is a mobile-first personal assistant that solves information overload by providing a unified capture-and-process workflow. Users capture thoughts, tasks, and links instantly on-the-go throughout the day, then later review and organize them into a personal knowledge base with processor suggestions (AI in Phase 1; optionally a trusted human collaborator in the future). The system replaces scattered tools (note apps, task managers, bookmark managers, browser tabs) with a single source of truth that combines effortless capture with intelligent organization. Users can capture offline without logging in; sign-in is required to sync, organize, and search. Success means users can trust the system enough to abandon their old fragmented workflows and use this daily for 2+ weeks without reverting.

## Context & Problem

### Who's Affected

**Primary User (Phase 1):** The developer building this product, who experiences severe information overload from managing multiple projects, ideas, and responsibilities.

**Secondary Users (Future):** Power users and knowledge workers who struggle with similar challenges—people who consume large amounts of information daily (articles, links, ideas, tasks) and need a better way to process and organize it all.

### Current Pain Points

**Information Overload**

- Too much incoming data from multiple sources: web articles, social media, conversations, random thoughts, tasks, reminders
- No good system to process this firehose of information
- Valuable insights and tasks get lost in the noise

**Scattered Tools**

- Information lives in silos: Notion for notes, Obsidian for knowledge base, Apple Notes for quick captures, Todoist for tasks, Things for projects, bookmark managers for links, dozens of open browser tabs
- No single source of truth
- Context switching between apps wastes time and mental energy
- Difficult to find information when it's scattered across multiple systems

**Capture Friction**

- Current tools require too much upfront organization (choosing folders, tags, projects)
- This friction means ideas get lost before they're captured
- Mobile capture is especially painful—by the time you open the right app and navigate to the right place, the thought is gone

**Manual Organization Burden**

- Organizing captured information is tedious and time-consuming
- Users either spend hours organizing (unsustainable) or let it pile up into a graveyard (unusable)
- No assistance to suggest where things should go or how they relate to existing knowledge

### The Gap

Existing tools force users to choose between:

1. **Quick capture with no organization** (Apple Notes, voice memos) → becomes a graveyard
2. **Structured organization with high friction** (Notion, Obsidian) → ideas lost before capture

There's no tool that combines effortless capture with intelligent organization, especially on mobile where most spontaneous thoughts occur.

### Success Criteria

Phase 1 is successful when:

- The user captures 100+ items (notes, tasks, links) over 2 weeks
- The user reviews and organizes these items with processor suggestions (AI in Phase 1)
- The user can find any captured information within 30 seconds
- The user continues using the system daily without reverting to old tools (Notion, Todoist, browser tabs, etc.)
- The user feels less stressed about forgetting important information

### Out of Scope for Phase 1

- Speech-to-text input (deferred to Phase 2)
- Multi-platform support (web, browser extension come later)
- Fully automated organization without user review
- Advanced features: smart reminders, Elo-based prioritization, gamification
- Collaborative/team features
