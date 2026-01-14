# Session Memory

Cross-session knowledge base. Append learnings here. Clear when starting fresh.

## Codebase Insights
- Dashboard already has contacts count widget (warm-up task done)
- Contacts page uses server-side pagination (PAGE_SIZE = 5)
- React Query with `queryKey: ["contacts", page]` for caching
- Chakra UI 3 components (Table.Root, Menu.Root, etc.)
- Contacts model: `organisation`, `description`, `ownerId`

## Technical Decisions
- **Search approach**: Client-side filtering (load all, filter in browser)
  - Simpler than server-side, data already loaded
  - Trade-off: won't scale for large datasets
- **Git workflow**: Fork-based with feature branches
  - origin = fork, upstream = original repo
  - Feature branches off main, PR back to upstream

## Learnings
- Always consider git workflow before writing files
- Add visual review step before coding (understand current UI)
- Need cross-session memory file (this file!)

## Current Context
- **Branch**: `feature/search-contacts`
- **Step**: About to do Step 3 (Visual Review)
- **Next**: Explore contacts page UI, then implement search
- **Files created**: `user-story.md`, `plan.md`

## Blocked / TODO
- (none currently)

---
*To clear: delete content between section headers, keep structure.*
*Last updated: This session*
