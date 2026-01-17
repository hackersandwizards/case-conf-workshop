# Agentic Engineering Workshop

A 2-hour hands-on workshop simulating real software development with Claude Code.

---

## Warm-up (10 min)

Verify your setup works.

**Task:** Add a widget to the dashboard showing the number of contacts.

---

## The Pattern

The same pattern applies at every level:

- **Outer loop (SDLC):** Refinement → Planning → Implementation → Retrospective
- **Inner loop (RPIR):** Research → Plan → Implement → Reflect

The agent follows this pattern internally. You guide it explicitly.

---

## The SDLC Workflow

### Step 1: Refinement → `user-story.md`

- **Research:** Explore codebase - what exists? What's possible?
- **Plan:** Decide what to capture in the user story
- **Implement:** Claude writes `user-story.md`
- **Reflect:** Capture learnings (skill, subagent, or CLAUDE.md)

### Step 2: Planning → `plan.md`

- **Research:** Understand requirements from user story
- **Plan:** Structure the implementation approach
- **Implement:** Claude writes `plan.md` with tasks
- **Reflect:** Capture learnings (skill, subagent, or CLAUDE.md)

### Step 3: Implementation

For each task in plan.md:
- **Research:** Understand what's needed
- **Plan:** Agent creates internal todos
- **Implement:** Agent implements
- **Reflect:** Capture learnings (skill, subagent, or CLAUDE.md)

### Step 4: Retrospective

- **Research:** Review the entire feature development
- **Plan:** Decide what major learnings to capture
- **Implement:** Claude updates `CLAUDE.md` with key insights
- **Reflect:** Capture learnings (skill, subagent, or CLAUDE.md)

### Step 5: Iterate

- Close Claude and open a new session
- Pick a new feature
- Go through Steps 1-4 again
- Validate: Is the agent doing a better job?

---

## Example Features

Need inspiration? Here are some ideas, or come up with your own:

- **Search contacts** - Filter contacts by name or organization
- **Tags/categories** - Add labels to organize contacts
- **Export to CSV** - Download contacts as a spreadsheet
- **Dashboard stats** - Charts showing contact distribution
- **Activity timeline** - Track recent changes to contacts

---

## Tips

- Be specific about what you want
- Review changes before accepting
- Ask Claude questions when unsure
- Start small, iterate
