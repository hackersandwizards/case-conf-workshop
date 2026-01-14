# CRM Development Guide

See [README.md](README.md) for setup and API docs.
See [exercises.md](exercises.md) for workshop workflow.

## Agile SDLC Workflow

### 1. Requirements
- Define feature in `user-story.md`
- Research codebase first (RPIR: Research → Plan → Implement → Reflect)

### 2. Design
- Create `plan.md` with tasks
- Define done criteria

### 3. Visual Review
- Start dev server (`npm run dev`)
- Use Chrome plugin to explore current UI state
- Login with test credentials (see Verify section)
- Screenshot/understand the area being modified
- Identify existing patterns and component placement

### 4. Code
- Follow pattern files below
- Small commits, one feature at a time

### 5. Test
- `npm run build` - type check
- `npm run lint` - code quality
- `npm run dev` - manual verification

### 6. Verify
- Test feature end-to-end in browser using Chrome plugin
- `npx prisma migrate dev` if schema changed

**Visual Verification (Chrome Plugin):**
1. Navigate to http://localhost:3000
2. Login with test credentials:
   - **Admin**: `dev@example.com` / `DevPassword`
   - **User**: `alice@example.com` / `AlicePassword123`
3. Verify the feature works visually
4. Test edge cases (empty states, errors, etc.)

### 7. Reflect
- What worked? What didn't?
- Update this file with learnings
- New session → next feature

## Git Workflow

**Remotes:**
- `origin` → your fork (push feature branches here)
- `upstream` → original repo (sync from here)

**Branch Strategy:**
```bash
# Create feature branch
git checkout -b feature/<feature-name> main

# Work on feature, commit changes
git add . && git commit -m "Add <feature>"

# Push to your fork
git push -u origin feature/<feature-name>

# Create PR from fork to upstream/main
```

**Sync with upstream:**
```bash
git fetch upstream
git checkout main
git merge upstream/main
```

## Pattern Files (Copy These)
| Task | Reference File |
|------|----------------|
| API endpoint | app/api/v1/contacts/route.ts |
| Page | app/(dashboard)/contacts/page.tsx |
| Dialog | components/contacts/AddContactDialog.tsx |
| Nav item | components/layout/Sidebar.tsx (navItems) |
| DB model | prisma/schema.prisma |

## Code Conventions
- API: requireAuth() → Prisma query → successResponse()
- State: React Query + invalidateQueries() on mutation
- Forms: React Hook Form + Chakra Field components
- Migration: npx prisma migrate dev --name <name>
