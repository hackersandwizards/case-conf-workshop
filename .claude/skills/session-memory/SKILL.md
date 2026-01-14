---
name: session-memory
description: Manages cross-session context via MEMORY.md. Reads on session start, updates during work, clears on command.
allowed-tools: Read, Write, Glob
---

# Session Memory Skill

Persistent knowledge management across Claude Code sessions.

## On Session Start

1. Read `MEMORY.md` from project root
2. Summarize key context for the user:
   - Current Context (where we left off)
   - Blocked / TODO items
   - Recent learnings relevant to current work

```bash
cat MEMORY.md
```

## During Work

Update appropriate sections when discoveries are made:

| Section | When to Update |
|---------|----------------|
| Codebase Insights | New patterns, gotchas discovered |
| Technical Decisions | Decisions made with reasoning |
| Learnings | What worked, what didn't |
| Current Context | Task progress, branch, next steps |
| Blocked / TODO | Issues encountered, deferred items |

To update, read MEMORY.md, modify the relevant section, write back.

## On Session End

Update "Current Context" with:
- Current branch and status
- What was accomplished
- Next steps for future session

## Commands

### /clear-memory

Reset MEMORY.md to empty template. **Only execute when user explicitly requests.**

```bash
cp .claude/skills/session-memory/template.md MEMORY.md
echo "Memory cleared. Starting fresh."
```

## Template Location

Empty template stored at: `.claude/skills/session-memory/template.md`

## Important Rules

- **Never clear memory automatically**
- Only clear when user says "clear memory" or invokes `/clear-memory`
- Always preserve existing content when updating sections
- Keep entries concise and actionable
