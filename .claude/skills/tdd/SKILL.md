---
description: Test-Driven Development workflow - write tests first, then implement
disable-model-invocation: true
argument-hint: <feature description>
---

# Test-Driven Development (TDD)

Build the following feature using strict TDD: $ARGUMENTS

## Phase 0: Research (Explore Subagent)

Use the Task tool with `subagent_type=Explore` to understand the codebase:

1. **Explore existing patterns** - Find similar features, APIs, and file structures
2. **Identify dependencies** - Understand what already exists that can be reused
3. **Gather context** - Collect information needed for planning

## Phase 1: Plan (Plan Subagent)

Use the Task tool with `subagent_type=Plan` to design the implementation:

1. **Design the approach** - Outline how to implement the feature
2. **Identify files** - List files to create or modify
3. **Get approval** - Present the plan to the user before proceeding

Do NOT proceed to writing tests until the plan is approved.

## Phase 2: RED (Write Failing Tests)

1. **Propose test cases** - List the test cases for user approval before writing
2. **Write test file** - Create tests that describe the expected behavior
3. **Run tests** - Execute `npm run test:run` and confirm they FAIL
4. **Show output** - Display the failing test results to the user

Do NOT write any implementation code until tests are written and failing.

## Phase 3: GREEN (Make Tests Pass)

1. **Write minimal implementation** - Only enough code to make tests pass
2. **Run tests** - Execute `npm run test:run` after each change
3. **Verify green** - All tests must pass
4. **No extras** - Don't add functionality not covered by tests

## Phase 4: REFACTOR (Improve Code Quality)

Use the Task tool with `subagent_type=tdd-refactoring-advisor` to get expert recommendations:

1. **Get refactoring recommendations** - The advisor analyzes the implementation and identifies code smells
2. **Review suggestions** - Present the advisor's recommendations to the user
3. **Apply approved changes** - Make the refactorings one at a time
4. **Verify after each change** - Run `npm run test:run` after every edit
5. **Keep green** - If tests fail, revert immediately

The advisor is read-only and provides guidance. You apply the actual code changes based on approved recommendations.

## Phase 5: Verify

Use the Task tool with `subagent_type=tdd-verifier` to thoroughly verify the implementation:

1. **Requirement traceability** - The verifier maps each requirement to test coverage
2. **Test execution** - Runs full test suite and coverage report
3. **Quality gates** - Checks linting and TypeScript compilation
4. **Edge case review** - Verifies boundary conditions and error handling
5. **Final verdict** - Outputs APPROVED or NEEDS_WORK with specific items

If NEEDS_WORK, address the identified gaps before proceeding to commit.

## Phase 6: Commit

1. **Stage changes** - Add the relevant files
2. **Write commit message** - Describe what was implemented
3. **Commit** - Create the commit with the changes

## Summary

After completing all phases, summarize:
- Research findings
- Plan overview
- Tests written
- Implementation created
- Refactoring done
- Verification results