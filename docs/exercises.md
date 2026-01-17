# Claude Code Workshop Exercises

A hands-on workshop for learning AI-assisted development with Claude Code. Exercises progress from basics through advanced features.

---

## Prerequisites

- Claude Code CLI installed and configured
- Node.js 18+, Python 3.10+
- Docker installed
- This repository cloned

## Difficulty Legend

🟢 Beginner | 🟡 Intermediate | 🟠 Advanced

---

## Exercise 1: Hello Claude Code 🟢

*Getting Started*

**Goal:** Start the CRM app and make your first change with Claude Code.

**Tasks:**

1. Open a terminal in this repository
2. Run `claude` to start an interactive session
3. Ask Claude Code to start the application in development mode
4. Ask how to log in to the application
5. Start a new session and ask to show the number of contacts on the dashboard
6. Verify the change works by adding a contact and checking the counter

**Reflection:** What did you notice about how Claude Code explores the codebase before making changes?

---

## Exercise 2: Project Init with /init 🟢

*Claude Code Fundamentals*

**Goal:** Bootstrap a project with Claude Code's project initialization.

**Tasks:**

1. Run `/init` in the project root
2. Review the generated CLAUDE.md file
3. Customize the architecture and conventions sections
4. Add project-specific build commands
5. Start a new Claude Code session and verify it uses the context

**Reflection:** How does CLAUDE.md differ from README.md in purpose?

---

## Exercise 3: Interactive vs Non-Interactive Mode 🟢

*Tooling Choice*

**Goal:** Compare Claude Code interactive mode with non-interactive scripted usage.

**Tasks:**

1. Run Claude Code interactively to add a UI element to the dashboard
2. Run a similar task non-interactively:
   ```bash
   claude -p "Add a welcome message to the dashboard"
   ```
3. Experiment with flags:
   ```bash
   claude -p --max-turns 10 --permission-mode acceptEdits "Add a footer to the page"
   ```
4. Compare the experience, control, and output between modes

**Reflection:** When would you choose non-interactive mode over interactive?

---

## Exercise 4: Plan vs Act 🟠

*Plan vs Act*

**Goal:** Build a Contact Insight Component using a multi-step planning approach.

**Tasks:**

1. Start Claude Code and ask to plan a Contact Insight Component that:
   - Analyzes contact information
   - Searches the web for relevant insights
   - Synthesizes findings into a summary
2. Review the proposed architecture
3. Refine requirements through conversation
4. Execute the implementation based on the plan
5. Test the feature manually

**Reflection:** When is planning valuable vs jumping straight to implementation?

---

## Exercise 5: Rules in Action 🟡

*Rules*

**Goal:** Experience how CLAUDE.md rules shape Claude Code behavior.

**Tasks:**

1. Ask Claude Code to add a "Navigation" section to README.md with bullet points
2. Observe the default formatting behavior
3. Reject/cancel the changes
4. Create a `CLAUDE.md` file with the rule:
   ```
   All bullet lists must start with an emoji that matches the content.
   ```
5. Start a new Claude Code session
6. Repeat the navigation section request
7. Observe how the output now includes emojis automatically

**Reflection:** What other formatting rules might be useful for your projects?

---

## Exercise 6: Testing Workflow Rules 🟡

*Rules*

**Goal:** Experience how rules can change AI workflow behavior.

**Tasks:**

1. Create/update `CLAUDE.md` with a rule:
   ```
   After completing any feature implementation, always ask the user
   if they would like you to write tests for the new functionality.
   ```
2. Start a new Claude Code session
3. Ask to add an edit icon button to the contacts table
4. Observe how Claude Code now asks about testing requirements

**Reflection:** How do workflow rules differ from code style rules?

---

## Exercise 7: Scoped Rules 🟡🟠

*Advanced Rules*

**Goal:** Create path-specific rules that apply only to certain directories.

**Tasks:**

1. Create `.claude/rules/` directory
2. Create `.claude/rules/api.md`:
   ```yaml
   ---
   paths:
     - "app/api/**/*.ts"
     - "lib/**/*.ts"
   ---

   # API Development Rules

   - All endpoints must validate input parameters
   - Use consistent error response format
   - Include JSDoc documentation comments
   ```
3. Create `.claude/rules/tests.md` for test-specific rules
4. Work on files in different paths and observe which rules activate
5. Notice how Claude Code mentions which rules are active

**Reflection:** When are scoped rules better than global rules?

---

## Exercise 8: Context7 MCP Installation 🟡

*MCP Basics*

**Goal:** Install and use an MCP server to access current documentation.

**Tasks:**

1. Add Context7 MCP server to Claude Code:
   ```bash
   claude mcp add-json context7 '{"type":"stdio","command":"npx","args":["-y","@upstash/context7-mcp"]}'
   ```
2. Verify installation:
   ```bash
   claude mcp list
   ```
3. Start a new Claude Code session
4. Ask Claude Code to get documentation for "Chakra UI Blockquote Component"
5. Ask it to add an interesting quote to the dashboard using that component
6. (Optional) Extend a Playwright test to verify the blockquote renders

**Reflection:** How does having access to current documentation change your development flow?

---

## Exercise 9: Context7 Non-Interactive Query 🟡

*MCP Basics*

**Goal:** Use Context7 with Claude Code CLI for scripted documentation access.

**Tasks:**

1. Verify Context7 is configured:
   ```bash
   claude mcp get context7
   ```
2. Run a non-interactive query to create documentation:
   ```bash
   claude -p --max-turns 10 --permission-mode acceptEdits \
     'Use Context7 to get FastAPI documentation about dependency injection.
      Create a markdown file called fastapi-di.md with sections:
      What is DI, Basic example, Parameters example, Best practices.'
   ```
3. Review the generated markdown file
4. Try other documentation queries

**Reflection:** What are good use cases for non-interactive MCP access?

---

## Exercise 10: Claude Code Slash Commands 🟡

*Workflows*

**Goal:** Create reusable slash commands for common workflows.

**Tasks:**

1. Study existing slash commands with `/help`
2. Create `.claude/commands/fix-issue.md`:
   ```markdown
   ---
   description: Fix a specific issue number
   ---

   Find issue #$ARGUMENTS in the repository.

   1. Understand the problem described
   2. Locate the relevant code
   3. Implement a fix
   4. Add appropriate tests
   5. Summarize what was changed
   ```
3. Test it: `/fix-issue 42`
4. Create another command for your common workflow
5. Iterate to improve reliability

**Reflection:** What workflows do you repeat often that could become commands?

---

## Exercise 11: Subagents 🟡🟠

*Claude Code Power Features*

**Goal:** Create specialized agents for specific tasks.

**Tasks:**

1. Run `/agents` to view the subagent interface
2. Create a new project-level agent named "code-reviewer"
3. Configure it:
   - Description: "Reviews code for quality, security, and style issues"
   - Tools: Read, Grep, Glob (read-only)
   - Model: Sonnet (faster for reviews)
4. Test it: "Use the code-reviewer subagent to analyze the contacts component"
5. Create a second agent: "test-generator"
6. Observe how results stay isolated from main conversation

**Reflection:** When should you use subagents vs direct prompts?

---

## Exercise 12: Build Minimal MCP Server 🟠

*MCP Server*

**Goal:** Create an MCP server for the CRM API.

**Tasks:**

1. Review the API routes in `app/api/v1/` to understand the CRM's endpoints
2. Design an MCP server that exposes key API operations:
   - List contacts
   - Create contact
   - Update contact
   - Delete contact
3. Implement the server using the MCP SDK
4. Register the server with Claude Code
5. Test the integration by asking Claude Code to use the CRM API through MCP

**Reflection:** When is an MCP server better than direct API calls or CLI tools?

---

## Exercise 13: Command Model Context 🟠

*MCP Server (adapted)*

**Goal:** Use CLI tools as an alternative to MCP servers.

**Tasks:**

1. Create/update `CLAUDE.md` with rules for using `gh` (GitHub CLI):
   ```markdown
   ## GitHub CLI Usage

   When working with GitHub issues and PRs, use the `gh` CLI tool.

   Common commands:
   - `gh issue list` - List open issues
   - `gh issue create --title "..." --body "..."` - Create issue
   - `gh pr create --title "..." --body "..."` - Create PR
   - `gh pr list` - List open PRs

   Always use non-interactive flags to avoid prompts.
   ```
2. Test by asking Claude Code to create a GitHub issue
3. Ask Claude Code to list open issues and pick one to work on
4. Compare to using an MCP server

**Reflection:** When is CLI-based context better than MCP servers?

---

## Exercise 14: Use the Browser 🟢

*Browser Use*

**Goal:** Let Claude Code add contacts to the CRM using browser automation.

**Tasks:**

1. Ensure the CRM application is running
2. Ask Claude Code: "Add some sample contacts to the CRM using the browser"
3. Approve the browser launch when prompted
4. Observe the visual interaction and screenshot-based understanding
5. Let it complete the multi-step task of filling forms and clicking buttons

**Reflection:** When is browser automation valuable vs API calls?

---

## Exercise 15: Master Context Management 🟡

*Context Management*

**Goal:** Learn all context provision techniques for effective AI assistance.

**Tasks:**

1. **File context**: Provide specific file paths in your prompts
   - "Look at `components/contacts/AddContactDialog.tsx` and improve the validation"
2. **Folder context**: Reference directories for broader context
   - "Review the `app/api/v1/` folder structure"
3. **Terminal context**: Reference recent command output
   - Run a failing test, then ask Claude to fix it based on the output
4. **Git context**: Mention commit hashes or recent changes
   - "What changed in the last 3 commits?"
5. **URL context**: Include documentation URLs
   - "Based on https://fastapi.tiangolo.com/..., update our API"
6. Combine multiple context types for a complex debugging scenario

**Reflection:** Which context types were most valuable for different tasks?

---

## Exercise 16: Context Visualization & Compaction 🟡

*Context Optimization*

**Goal:** Understand and optimize context window usage.

**Tasks:**

1. Have a long conversation with Claude Code (review multiple files, make several changes)
2. Run `/context` to see the context grid visualization
3. Observe context consumption by different message types
4. Run `/compact` to compress the conversation
5. Compare context usage before and after compaction
6. Run `/compact "Focus on the authentication changes"` with specific instructions
7. Start a fresh session and compare the experience

**Reflection:** When should you compact vs start a new session?

---

## Exercise 17: Dashboard Welcome Message with TDD 🟡

*TDD*

**Goal:** Learn TDD Red-Green-Refactor cycle with AI assistance.

**Note:** This exercise will guide Claude Code through setting up Playwright if not already configured.

**Tasks:**

1. Ask Claude Code to add a "Today's Date" feature using strict TDD with Playwright:
   ```
   Add a "Today's Date" display to the dashboard using Test-Driven Development.

   Follow TDD strictly:
   - RED: First write a failing Playwright test
   - GREEN: Add minimal code to make the test pass
   - REFACTOR: Improve the implementation

   Show me each phase clearly and verify the test fails before implementing.
   ```
2. **RED**: Verify the test actually fails
3. **GREEN**: Watch minimal code being added
4. **REFACTOR**: Observe improvements while tests stay green

**Reflection:** How does TDD change your development flow with AI?

---

## Exercise 18: Background Tasks 🟡

*Parallel Execution*

**Goal:** Run long operations in the background while continuing to work.

**Tasks:**

1. Ask Claude Code to run the full test suite
2. While tests are running, press `Ctrl+B` to background the task
3. Continue working: "While tests run, let's review the API documentation"
4. Run `/bashes` to see background task status
5. Ask Claude Code to run multiple operations in parallel:
   - "Run linting, type checking, and tests in parallel"
6. Continue other work while tasks complete

**Reflection:** When is backgrounding valuable vs waiting for completion?

---

## Exercise 19: Debugging with Rich Context 🟡🟠

*Prompt Engineering*

**Goal:** Master effective debugging with AI assistance.

**Tasks:**

1. Introduce a subtle bug in the contacts component (e.g., modify a data mapping)
2. Craft a debugging prompt with rich context:
   ```
   I'm seeing an issue with the contact list.

   Expected: Contacts should display with their organization name
   Actual: Organization shows as "undefined"

   Relevant files:
   - app/(dashboard)/contacts/page.tsx
   - components/contacts/EditContactDialog.tsx

   Error in console: [include any errors]

   Please investigate and fix.
   ```
3. Let Claude Code investigate using browser tools if needed
4. Fix the issue

**Reflection:** What context was most valuable for debugging?

---

## Exercise 20: Feature Implementation with Planning 🟡🟠

*Prompt Engineering*

**Goal:** Use planning mode for complex feature implementation.

**Tasks:**

1. Define a complex feature:
   ```
   I want to add a "Contact Statistics Dashboard" showing:
   - Total number of contacts
   - Contacts added this month
   - Most common organization types
   - A simple chart or visual representation
   ```
2. Ask Claude Code to plan the implementation first:
   - Analyze current dashboard structure
   - Review how other components work
   - Outline the implementation approach
   - Identify needed API endpoints
3. Review and refine the plan
4. Execute the implementation

**Reflection:** When is planning most valuable before implementation?

---

## Summary

You've completed 20 exercises covering:

- **Fundamentals**: Hello Claude Code, Project Init, Interactive/Non-Interactive modes
- **Rules & Configuration**: CLAUDE.md, Scoped Rules, Slash Commands
- **MCP & Integrations**: Context7, Custom MCP Servers, CLI Context
- **Context Management**: File/Folder/Git context, Visualization, Compaction
- **Advanced Features**: Subagents, Background Tasks, Plan Mode
- **Engineering Practices**: TDD, Debugging, Feature Planning

**Next Steps:**
- Explore the [Claude Code documentation](https://docs.anthropic.com/claude-code)
- Create custom commands and subagents for your team
- Integrate Claude Code into your CI/CD pipeline
- Share your CLAUDE.md configurations with your team
