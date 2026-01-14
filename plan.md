# Plan: Search Contacts

## Overview
Add client-side search filtering to the contacts page. Users can type to filter contacts by organisation or description.

## Technical Approach
- Load all contacts (increase limit) to enable client-side filtering
- Add search input with debounce (300ms)
- Filter contacts array before rendering
- Paginate filtered results

## Tasks

### Task 1: Add search state and input
- [x] Add `searchQuery` state to ContactsPage
- [x] Add Input component with search icon in header (between title and Add button)
- [x] Add clear button (X) when search has value

### Task 2: Implement filtering logic
- [x] Create `filteredContacts` computed from contacts array
- [x] Filter by `organisation` and `description` (case-insensitive)
- [x] Debounce not needed - instant filtering works well with useMemo

### Task 3: Update pagination for filtered results
- [x] Update `totalCount` to use filtered length
- [x] Reset to page 0 when search changes
- [x] Paginate filtered results instead of raw data

### Task 4: Add empty search state
- [x] Show "No contacts match your search" when filter yields 0 results
- [x] Different from "No contacts yet" (empty database)

### Task 5: Visual verification
- [x] Start dev server (`npm run dev`)
- [x] Login via Chrome plugin as `dev@example.com` / `DevPassword`
- [x] Test search with existing contacts
- [x] Test clear button
- [x] Test empty state

## Done Criteria
- [x] Search input visible on contacts page
- [x] Typing filters contacts in real-time
- [x] Clear button resets filter
- [x] "No results" message shows appropriately
- [x] Works for admin and regular users
