---
name: ios-simulator
description: Essential guidelines for interacting with iOS simulators via tmux sessions. Use this skill whenever the user mentions 'ios logs', 'simulator refresh', 'mobile development', or 'tmux session', even if they don't explicitly ask for help with the simulator.
metadata:
  tags: ios, simulator, tmux, logs, refresh, mobile
---

## When to use

Use this skill when you need to interact with an iOS simulator running via a `tmux` session. This is critical for:

- Triggering fast refreshes in React Native/Expo apps.
- Capturing logs from background development servers.
- Debugging issues where the direct output is inaccessible.

## How to use

### 1. Identify Target Session (Mandatory)

Before running any commands, you MUST identify the `tmux <target-session>` (e.g., `dev`, `ios`).

- **Action:** If not provided, ask: "Which tmux session is the simulator/dev-server running in?"

### 2. Manual Refresh (React Native/Expo)

Trigger a manual refresh to see code changes reflected in the simulator:

```bash
tmux send-keys -t <target-session> r
```

### 3. Log Capture for Debugging

Capture logs to diagnose crashes or check network/console output:

```bash
tmux capture-pane -t <target-session> -p
```

- **Why:** This is necessary because `tmux` panes buffer output that might not be visible in the current view.
- **Example:** `tmux capture-pane -t ios -p | grep -i "error"` to find errors quickly.

### 4. Session Management

- **Verify:** Use `tmux ls` to confirm the session name if you are unsure.
- **Inform:** Remind the developer they can jump into the session themselves with `tmux attach -t <target-session>`.
