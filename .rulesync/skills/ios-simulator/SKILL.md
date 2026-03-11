---
name: ios-simulator
description: Guidelines for interacting with the iOS simulator via tmux sessions.
metadata:
  tags: ios, simulator, tmux, logs, refresh, mobile
---

## When to use

Use this skill when you need to interact with an iOS simulator running via a `tmux` session, typically during development or debugging of a mobile application.

## How to use

### 1. Identify Target Session
The developer should already have the iOS simulator ready. You must ask for or identify the `tmux <target-session>` name (e.g., `dev`, `ios`, `server`).
- **Required Action:** If the `<target-session>` is not provided in the current context, you MUST prompt the developer to provide it before proceeding with any simulator-related commands.

### 2. Manual Refresh
To trigger a manual refresh of the application in the simulator:
```bash
tmux send-keys -t <target-session> r
```

### 3. Log Capture
To capture and inspect logs from the session:
```bash
tmux capture-pane -t <target-session> -p
```
- **Pro-tip:** You can pipe this to `tail` or `grep` to narrow down the information.
- **Example:** `tmux capture-pane -t ios -p | tail -n 50`

### 4. General Commands
- **Check Session:** `tmux ls` to verify the session exists.
- **Focus Session:** Remind the developer they can attach to the session manually with `tmux attach -t <target-session>`.
