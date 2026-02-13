# MVP Product Requirements v2

Created by: Steve Zhu
Created time: February 5, 2026 5:08 PM
Last edited by: Steve Zhu
Last updated time: February 12, 2026 7:47 PM
Archived: No

Sources: [MVP Product Requirements](https://www.notion.so/MVP-Product-Requirements-2fe8b7bc8979801eaf10fb00bdce22f4?pvs=21) · [Mission/Philosophy](https://www.notion.so/Mission-Philosophy-2fe8b7bc897980c094ebc923b75ca1b7?pvs=21) · [Concepts to consider](https://www.notion.so/Concepts-to-consider-2fc8b7bc897980b2adfce1386c2fce4a?pvs=21) · [User stories](https://www.notion.so/User-stories-2fc8b7bc89798047bf1efc77ee476afb?pvs=21) · [Workflow](https://www.notion.so/Workflow-2fe8b7bc897980ff8fcbcd026b8f6fb8?pvs=21) · [Example use cases ](https://www.notion.so/Example-use-cases-2fe8b7bc897980ae83ffeaa173249c2c?pvs=21)

---

## Mission

**A personal assistant for the digital age.**

> "Capture now, process later."
> 

We are building the evolution from personal computing to **personal applications and personal databases**. AI should augment humans — not replace their judgment. We use AI where it genuinely helps and rely on time-tested software engineering everywhere else.

### Cost Philosophy

AI is one of the most expensive ways to accomplish a task. Companies that win in the AI age are the ones that master efficiency. Our approach:

- **Use AI sparingly.** It's an energy and monetary cost — only use it for places where AI is best for the job.
    - **Should use AI:** long jobs that can be automated or heavily text-based (e.g., converting an outline into an organized document)
    - **Should not use AI:** simple deterministic commands (e.g., moving a file to another folder) — these should just be commands
- **Automations are unlimited; LLM calls are rate-limited.** The AI creates automations for the user so recurring work runs cheaply forever.
- Don't just wrap an LLM — build real systems underneath it.
- Decision trees and deterministic logic should handle predictable paths; reserve LLMs for genuinely ambiguous tasks.

---

## Core Principles

1. **Effortless capture** — Input should be as fast as thinking. Just write it down, speak it, or send it.
2. **AI-organized, human-verified** — AI handles the heavy lifting of organization, but the user always has final say.
3. **Trust & accuracy** — Clearly distinguish between verified data and AI-generated guesses. Everything is reviewable and reversible.
4. **Personal-first** — A personal app, personal wiki, and personal database rolled into one.
5. **Efficiency-first AI** — Only use LLMs when they add real value. Automate deterministic tasks with traditional tooling.

---

## Key Terms & Definitions

- **Inbox Queue**
    
    The single entry point for all incoming data — notes, links, files, tasks, and reminders. Everything flows through here before being organized.
    
- **Stream of Consciousness**
    
    The primary input mode: timed, chat-log-style entries where users capture thoughts as they come, with no friction or formatting requirements.
    
- **Consumable Link**
    
    A link to content meant to be read once (e.g., a news article). Can be auto-processed into a digest summary and archived.
    
- **Functional Asset**
    
    A link to a permanent reference (e.g., an Amazon product page, a GitHub repo). Persists in the knowledge base as a lasting resource.
    
- **Event**
    
    A time-bound item that passes when over (e.g., a meeting, a concert). Contrast with *Task*.
    
- **Task**
    
    An action item that persists until completed, even past its deadline. Contrast with *Event*.
    
- **Write-before-review**
    
    AI writes changes first, then the user reviews and approves. Faster but requires trust.
    
- **Write-after-review**
    
    AI proposes changes, the user approves first, then the system applies them. Safer but slower.
    
- **Verified Data**
    
    Data directly input by the user or backed by a cited source. Treated as ground truth.
    
- **Inferred Data**
    
    Data generated or guessed by AI. Clearly labeled and subject to user review.
    
- **Edit History**
    
    The full log of all changes, including mistakes and reverted edits.
    
- **Update History**
    
    A curated log of only verified, correct changes. Think committed vs. staged.
    
- **Agent Skill**
    
    A reusable, encapsulated AI capability (e.g., "update a document and mark the source as done"). Skills can be composed into workflows.
    
- **GTD (Getting Things Done)**
    
    A productivity methodology focused on capturing, clarifying, organizing, and reviewing tasks. Our task system is GTD-inspired.
    
- **Elo-based Ranking**
    
    A pairwise comparison system (inspired by the Beli app) used to stack-rank tasks, items, or content by relative priority.
    
- **Digest**
    
    A periodic summary (daily/weekly) of new items, pending tasks, priority shifts, and proactive suggestions from the AI assistant.
    
- **Knowledge Graph**
    
    The Wikipedia-style structure where each concept gets its own page with interlinked references, forming a personal knowledge base.
    
- **Chat-as-Document**
    
    Chats are treated as first-class documents, not ephemeral threads. Users can quote, cite, and reference any part of a chat — the same way they would reference a note or article.
    
- **Decision Log**
    
    A structured record of *why* a decision was made, including the research, alternatives considered, and reasoning. AI proactively surfaces relevant past decisions during new research.
    

---

## User Stories

### Knowledge storage

*"I want to store general knowledge that can be updated and has history."*

- Example: My current home insurance is Lemonade with a given policy number.
- Need: Complete edit history *and* a separate update history (verified-only changes).
    - Edit history includes mistakes; update history only contains verified correct data.
    - Think PRs vs. commits, or staged vs. committed.

### Reminders & smart scheduling

*"I want to store reminders with smart prioritization."*

- Example: Need to file taxes by April 15 → remind me a week before so I have time to finish.
- Pull up historical data (e.g., how long it took last time) to inform scheduling.

### Custom personal applications

*"I want to create custom UI and applications for my own life."*

- Example: A timer to track focused work sessions.
- An app store of personal tools — removing the need for one-off external apps.
- Standardize information display the way Excel standardized spreadsheets.

### Life as a game

*"I want to record and gamify my life."*

- Track stats, skill trees, streaks, and personal KPIs.
- Fun events and learning challenges (e.g., learning finance through interactive quests).

### Real-world projects

*"I want to manage complex real-world projects end to end."*

- Example: Buying a home — organize a database of places viewed with personal notes and ratings.
- Example: Furnishing a home — track items, prices, decisions, and alternatives.

---

## Data Ingestion Workflow

### Asynchronous Flow (Default)

```
User Input → Inbox Queue → AI Processing → Review → Organized Knowledge
```

**Step 1: Publish to inbox queue**

All data enters a single inbox. Input types include:

- **Links** (with optional notes and metadata)
    - *Consumable links* — content to read once (e.g., news article). Can be auto-processed into a digest summary.
    - *Functional assets* — permanent references (e.g., Amazon product, GitHub repo). Persist in the knowledge base.
    - Links can be reclassified after processing (consumable → functional asset).
    - Record the **source** of the link (e.g., GitHub feed) as metadata.
- **Documents to file** — PDFs, images, receipts, etc.
- **Reminders and tasks**
    - Distinguish between *events* (time-bound, pass when over) and *tasks* (persist until completed, even past deadline).

**Step 2: AI agent processes the queue**

- Agent wakes up to organize, categorize, and merge incoming data.
- Configurable: **write-before-review** (AI writes, user reviews) or **write-after-review** (AI proposes, user approves first).
- Items can be sent back to the queue with notes if they have faulty data or need reprocessing.

**Step 3: User reviews and reorganizes**

- User has an inbox view showing items and their processing status.
- User can take over processing manually at any time, or flag items for manual handling at submission.

### Synchronous Flow

- User wants something processed immediately (e.g., "add this task right now").
- Data can be entered manually or via automated capture.
- AI works like an assistant — it'll work in a delayed manner (async) or you can tell it to do a task immediately (sync).

### Periodic Digest & Proactive Messaging

- Daily/weekly digest summarizing new items, pending tasks, and priority shifts.
- Proactive notifications based on user patterns and context.

---

## MVP Priorities

### P0 — Must Have (Launch Blockers)

- [ ]  **Stream-of-consciousness input**
    - Timed, chat-log-style entries (flow of consciousness)
    - Single text input with autocomplete — no friction, no separate fields
    - Support `@`-style inline tagging (e.g., `@location:home`, `@project:app`)
- [ ]  **Inbox queue & async processing pipeline**
    - All data published to a single inbox queue
    - Support for links (consumable vs. functional asset), documents, reminders, and tasks
    - Record source metadata for each item
    - User-visible inbox with processing status
    - Configurable write-before-review or write-after-review mode
    - **Tab saving (OneTab-style):** saving all open tabs also sends them to the inbox queue — it's data that needs processing. Not guaranteed user wants to save everything; can ask them to process synchronously and manually.
- [ ]  **Auto-organization of notes**
    - AI asynchronously categorizes and merges new entries with existing notes
    - Detect duplicate or related information and suggest merges
    - Each concept gets its own page (Wikipedia-style knowledge graph)
- [ ]  **Task management (GTD-inspired)**
    - Capture tasks directly from the stream
    - Distinguish between events (time-bound) and tasks (persist until done)
    - Auto-prioritize by importance and ease
    - Basic reminders and due dates
    - **Daily task refinement** — AI helps schedule and refine recurring daily tasks (e.g., "read Hacker News", "check Product Hunt")
    - **Auto-detect task completion** — AI infers whether a task was completed from user behavior (e.g., posting a link from Hacker News signals that reading task is done). If it can't detect, it asks.
    - **User-defined completion triggers** — users can define automation triggers that mark a task as complete (e.g., "if I paste a HN link, mark 'Read HN' as done")
- [ ]  **Speech-to-text input**
    - Voice capture as a first-class input method to generate notes and tasks
- [ ]  **AI review & approval queue (safe execution)**
    - All AI-generated edits go through a "pull request" flow for user approval
    - Show diffs of proposed changes before applying
    - **Every action representable as a diff or action JSON** — so execution can be previewed, processed, and reviewed before committing
    - Immutable activity log of all AI actions
    - Items can be sent back to queue with notes for reprocessing
    - **Mark autogenerated sections as good or bad** for review or regeneration — PR-style flow where you add comments, request an update, and review again until satisfied
- [ ]  **Data trust layer**
    - Label data as *verified* (direct user input / cited source) vs. *inferred* (AI-generated)
    - Separate edit history (includes mistakes) from update history (verified-only)
    - Users can mark sections as reviewed/verified
- [ ]  **General knowledge store with history**
    - Store personal facts and reference data (e.g., insurance policy, credit card info)
    - Full version history with ability to view and restore past states

### P1 — Should Have (Fast Follow)

- [ ]  **Smart reminders & proactive assistant**
    - Context-aware reminders (e.g., remind about travel credits when booking flights)
    - Historical data-informed scheduling (e.g., "this took 3 hours last year")
    - Daily digest with task review, priorities, and schedule adjustments — framed as a solution to **information fatigue** (too much information in today's world; AI parses and surfaces what matters)
    - Proactive suggestions based on user patterns
    - **Decision memory** — AI helps remember *why* you made certain decisions and the research involved. While doing new research, AI proactively surfaces relevant past decisions and reasoning so context is never lost.
    - **Journal and reminders to self** — personal journaling and self-direction (e.g., focus on execution instead of ideating)
    - **Auto-add references in priority order** from notes — prioritize like brain synapses: the more something is used, the more it's remembered
    - **Reminder lifecycle management** — decide when to stop or clean up reminders as they build up
- [ ]  **Link management (consumable vs. functional)**
    - Auto-classify links as consumable (read-once) or functional (persistent asset)
    - Allow reclassification after review
    - Auto-process consumable links into digest summaries
    - Save source/referrer metadata
- [ ]  **File auto-organization**
    - Send any file and AI auto-files it (automatic filing cabinet)
    - Replace manual folder management; AI-organized filesystem
- [ ]  **Document versioning pipeline**
    - Support brainstorm → organized doc → PRD transformation chain
    - Archived, immutable copies at each stage with reference links
- [ ]  **Priority ranking (Elo-based)**
    - Stack-rank tasks and items via pairwise comparison (inspired by Beli)
    - AI-assisted re-prioritization over time
- [ ]  **Smart notifications**
    - Device-aware (desktop vs. mobile, no duplicates)
    - Chat-style delivery
    - Auto-disable notifications the user consistently ignores
- [ ]  **Multilingual support**
    - Support multiple languages for input, AI processing, and organized output
- [ ]  **Source references & chat citations**
    - Add references (links to specific portions of the UI) so users know the source of a piece of information
    - Info pages styled like Wikipedia for traceability
    - **Chats as documents** — chats are treated as first-class documents, not ephemeral. Users can quote and make citations from any chat.
    - **Copy citation from highlight** — when highlighting text, a "copy citation" option appears in the popup menu, making it easy to record the sources of ideas
    - Record the source of every idea so provenance is always traceable
- [ ]  **AI-generated automations**
    - AI creates deterministic automations for recurring tasks instead of using LLM calls each time
    - Automations are unlimited; LLM calls are rate-limited
    - **Agent skills** — encapsulate repeatable capabilities as reusable skills (e.g., update a document and mark the referenced source portion as done)
- [ ]  **Commonly used file templates**
    - Store frequently used files (e.g., [ARCHITECTURE.md](http://ARCHITECTURE.md), .gitignore, .gitconfig) and let AI apply them automatically to new projects — or users can copy them manually
    - Similar to [Warp Drive](https://www.warp.dev/warp-drive)
    - Give users tips on what's easy to do yourself vs. what to use AI for (save tokens)
- [ ]  **Document tagging & shared workspaces**
    - Add tags to documents to surface them in shared locations (e.g., `@todo` tags aggregate into a shared todos workspace/UI)
    - Cross-document tag views for collaboration and organization

### P2 — Nice to Have (Future Iterations)

- [ ]  **Custom personal applications**
    - User-created mini-apps (e.g., timer, workout tracker, home-buying database)
    - Standardized information display framework
    - App store for sharing personal tools
- [ ]  **Gamification layer**
    - Life-as-a-game framing: stats, skill trees, streaks, XP for completing tasks
    - Rewards system — currency for productive actions, spend on "reward" activities
- [ ]  **Automated workflows (n8n-style)**
    - AI-generated automation pipelines users can review and run
    - Decision trees for predictable branching logic (cost-effective alternative to LLM calls)
    - Dashboard showing estimated cost per automation
- [ ]  **Health & habit tracking**
    - Food logging with macro targets and recipe suggestions
    - Workout recording and personal stats database
- [ ]  **Financial management**
    - Credit card bonus tracking and reminders
    - Price drop / back-in-stock notifications
- [ ]  **Real-world project management**
    - Structured databases for life projects (home buying, furniture, renovations)
    - Personal decision logs with comparisons and reasoning
- [ ]  **Integrations**
    - GitHub notifications, email, calendar (MCP)
    - Messenger apps (WhatsApp, Messenger)
    - Auto-connected data sources (local folders, cloud storage)
- [ ]  **Page archive API**
    - Create an API to archive pages — cached or shared snapshots between users using a hash

### P3 — Long-Term Vision

- [ ]  **Plugin marketplace & community**
    - Open plugin system for user-built extensions
    - Marketplace with quality ranking (success rate, reviews)
    - Platform-as-infrastructure — let others build products on top
- [ ]  **Wikipedia-style public data layer**
    - Shared public metadata; private user edits
    - API access to aggregated public data
- [ ]  **Decision agents & self-improving AI**
    - Branching decision trees that another AI can improve
    - Rate-limited for consistent cost
- [ ]  **Open source core**
    - Community-driven development as a distribution moat
- [ ]  **Moral/philosophical evaluation frameworks**
    - Upload a personal framework; evaluate decisions against it

---

## Key Concepts to Explore

---

## Example Use Cases

### Everyday reminders

- "Get packages later today" → captured instantly, auto-prioritized, reminder sent at the right time.

### Complex projects

- **Buying a home** — create a structured database of viewed properties with ratings, notes, photos, and comparisons.
- **Furnishing a home** — track items, prices, alternatives, and purchase decisions.

### Personal knowledge management

- Store insurance policies, credit card details, recipes, and personal preferences with full version history.
- AI proactively surfaces relevant knowledge when context matches (e.g., pull up tax prep notes in March).

---

## Open Questions

1. How do we handle **collaborative use cases** (e.g., corporate meetings, shared brainstorming) vs. purely personal use? What are the **enterprise capabilities** needed?
    - Think about how the product adapts for teams, organizations, and corporate workflows.
2. What is the **minimum confidence threshold** before AI auto-organizes vs. asks for user input?
3. How do we prevent the **"slop problem"** — irreversible AI-generated content that degrades the knowledge base?
4. What's the right **cost model** for AI processing so users understand and control spending?
5. How do we make the **onboarding experience** compelling enough that users trust the system with their data?
6. How do we **validate market demand** — trust that if we want this product and nothing exists, the opportunity is real?
7. How do we frame and solve **information fatigue** — what's the right level of AI summarization vs. giving users control over the firehose?
8. What's the right **UGC / distribution strategy** — test hooks via short-form content (TikTok/Instagram) before committing to a tagline?
9. How do we decide **when to stop reminders or clean up** when they start building up?

---

## References

- [MVP Product Requirements](https://www.notion.so/MVP-Product-Requirements-2fe8b7bc8979801eaf10fb00bdce22f4?pvs=21) (v1)
- [Stream of thought organized](https://www.notion.so/Stream-of-thought-organized-2fe8b7bc897980e6890ae7ae0e2e413f?pvs=21) (raw brainstorm)
- [Mission/Philosophy](https://www.notion.so/Mission-Philosophy-2fe8b7bc897980c094ebc923b75ca1b7?pvs=21) · [User stories](https://www.notion.so/User-stories-2fc8b7bc89798047bf1efc77ee476afb?pvs=21) · [Workflow](https://www.notion.so/Workflow-2fe8b7bc897980ff8fcbcd026b8f6fb8?pvs=21) · [Example use cases ](https://www.notion.so/Example-use-cases-2fe8b7bc897980ae83ffeaa173249c2c?pvs=21) · [Concepts to consider](https://www.notion.so/Concepts-to-consider-2fc8b7bc897980b2adfce1386c2fce4a?pvs=21)
- [Copilot Money — About](https://www.copilot.money/about) (mission inspiration)
- [GTD in 15 minutes](https://hamberg.no/gtd)
