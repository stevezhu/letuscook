# Skill Creator Conventions

## Workspace Directory

When using the `skill-creator` skill to run evals, store all workspace output in
`.skill-creator/` at the project root — **not** inside `.rulesync/skills/`.

```
.skill-creator/
└── agent-logbook-workspace/
    └── iteration-1/
        └── ...
```

The `.rulesync/skills/` directory is scanned by rulesync and must contain only
valid skills (directories with a `SKILL.md`). Placing eval workspaces there will
cause `rulesync generate` to error.

When the skill-creator instructions say to put the workspace "as a sibling to the
skill directory", interpret that as `.skill-creator/<skill-name>-workspace/`.
