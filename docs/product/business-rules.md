# Business Rules — Agentic Engineering Training (Next.js CRM)

> Last extracted: 2026-02-18
> Stack: Next.js 16 / TypeScript / Prisma 7 / SQLite (better-sqlite3)
> Total rules: 72 | Categories: 9

## How to Read This Document

Each business rule is documented with:

- **Rule**: A plain-language statement that any stakeholder can understand without reading code
- **Type**: Classification per IBM Business Rules Framework
  - **Constraint** — restricts what is allowed
  - **Derivation** — computes or infers a value
  - **Action Enabler** — triggers an action when conditions are met
  - **Fact** — asserts a structural truth about the domain
- **Source**: The file(s) and line number(s) where the rule is implemented
- **Enforcement**: Where the rule is enforced (Backend, Frontend, Database, or Multiple)
- **Example**: A concrete scenario illustrating the rule in action, using Given/When/Then format where appropriate

---

## Authentication

### AUTH-001: All Protected Endpoints Require a Bearer Token

| Field | Value |
|-------|-------|
| **Rule** | Every API endpoint — except signup, login, and health-check — requires a valid JWT Bearer token in the `Authorization` header. Requests without a token, with a malformed token, or with an expired token receive HTTP 401 "Not authenticated". |
| **Type** | Constraint |
| **Source** | `lib/api-utils.ts:29-46`, `lib/auth.ts:42-84` |
| **Enforcement** | Backend |

**Example:**
> Given an unauthenticated user,
> when they call `GET /api/v1/contacts`,
> then they receive HTTP 401 "Not authenticated".

---

### AUTH-002: Authorization Header Must Use Bearer Scheme

| Field | Value |
|-------|-------|
| **Rule** | The `Authorization` header must start with the exact prefix `"Bearer "` (case-sensitive, with trailing space). Any other format is rejected as unauthenticated. |
| **Type** | Constraint |
| **Source** | `lib/api-utils.ts:29-35` |
| **Enforcement** | Backend |

**Example:**
> Given a request with `Authorization: Token abc123`,
> when processed by the API,
> then it receives HTTP 401 because the scheme is not `Bearer `.

---

### AUTH-003: Inactive Users Cannot Authenticate

| Field | Value |
|-------|-------|
| **Rule** | Even if a user presents a cryptographically valid, unexpired JWT, they are denied access if their `isActive` flag is `false`. Active status is re-verified against the database on every authenticated request. |
| **Type** | Constraint |
| **Source** | `lib/auth.ts:57-59`, `lib/auth.ts:79-81` |
| **Enforcement** | Backend |

**Example:**
> Given a user deactivated by an admin after logging in,
> when they make any API request with their existing token,
> then they receive HTTP 401 — even though the token is cryptographically valid.

---

### AUTH-004: Password Minimum Length (8 Characters)

| Field | Value |
|-------|-------|
| **Rule** | Passwords must be at least 8 characters long. Failure returns HTTP 400 "Password must be at least 8 characters". Frontend forms also enforce this with inline error messages. |
| **Type** | Constraint |
| **Source** | `lib/api-utils.ts:74-76`, `app/(auth)/signup/page.tsx:88-91`, `components/admin/AddUserDialog.tsx:88-91`, `components/admin/EditUserDialog.tsx:112-114`, `app/(dashboard)/settings/page.tsx:163-166` |
| **Enforcement** | Multiple |

**Example:**
> Given a user signing up with a 7-character password,
> when they submit the form,
> then they see "Password must be at least 8 characters" before the request is sent.

---

### AUTH-005: Password Maximum Length (40 Characters)

| Field | Value |
|-------|-------|
| **Rule** | Passwords must be at most 40 characters long. Failure returns HTTP 400 "Password must be at most 40 characters". This constraint is enforced backend-only; no frontend form applies a `maxLength` constraint. |
| **Type** | Constraint |
| **Source** | `lib/api-utils.ts:77-79` |
| **Enforcement** | Backend |

**Example:**
> Given a user entering a 41-character password,
> when the form is submitted,
> then the frontend accepts it and the API rejects it with HTTP 400.

---

### AUTH-006: Passwords Are Bcrypt-Hashed with Cost Factor 10

| Field | Value |
|-------|-------|
| **Rule** | User passwords are never stored in plaintext. They are hashed using bcrypt with a cost factor of 10 before storage. Only the hash is persisted; the original password is discarded after hashing. |
| **Type** | Constraint |
| **Source** | `lib/auth.ts:15-17`, `prisma/seed.ts:16`, `prisma/schema.prisma:13` |
| **Enforcement** | Backend |

**Example:**
> Given a user sets the password `mypassword`,
> when the account is saved,
> then the database contains a bcrypt hash like `$2b$10$...` — never the string `mypassword`.

---

### AUTH-007: JWT Expires After 8 Days

| Field | Value |
|-------|-------|
| **Rule** | Access tokens expire 8 days after issuance. Users must log in again after expiry. The default is configurable via the `JWT_EXPIRES_IN` environment variable. |
| **Type** | Constraint |
| **Source** | `lib/auth.ts:6`, `.env:6` |
| **Enforcement** | Backend |

**Example:**
> Given a user who logged in 9 days ago,
> when they make any API request,
> then their token is rejected as expired and they receive HTTP 401.

---

### AUTH-008: JWT Payload Contains User ID and Email Only

| Field | Value |
|-------|-------|
| **Rule** | JWT access tokens encode exactly two domain claims: `sub` (user ID) and `email`. Role, superuser status, and active status are not embedded — they are re-checked from the database on every authenticated request. |
| **Type** | Fact |
| **Source** | `lib/auth.ts:8-13`, `lib/auth.ts:30-37` |
| **Enforcement** | Backend |

**Example:**
> Given a user logging in,
> when the token is issued,
> then it contains `{ sub: "uuid", email: "user@example.com" }` — no role or flags.

---

### AUTH-009: Login Accepts Form and JSON Bodies

| Field | Value |
|-------|-------|
| **Rule** | The login endpoint accepts credentials in two content types: `application/x-www-form-urlencoded` (OAuth2 form body, field `username`) and JSON (field `username` or `email`). Both are treated identically. |
| **Type** | Fact |
| **Source** | `app/api/v1/login/access-token/route.ts:13-21`, `lib/client/api.ts:63-76` |
| **Enforcement** | Multiple |

**Example:**
> Given a client submitting `username=alice@example.com&password=secret` as form data,
> when calling `POST /api/v1/login/access-token`,
> then authentication proceeds identically to a JSON body submission.

---

### AUTH-010: Anti-Enumeration Login Error

| Field | Value |
|-------|-------|
| **Rule** | All login failures — whether caused by a non-existent email, an inactive account, or a wrong password — return the same generic message "Incorrect email or password" (HTTP 400). Callers cannot determine whether an email address is registered. |
| **Type** | Constraint |
| **Source** | `app/api/v1/login/access-token/route.ts:27-29`, `lib/auth.ts:53-64` |
| **Enforcement** | Backend |

**Example:**
> Given an attacker trying to enumerate registered emails,
> when they submit `unknown@example.com` with any password,
> then they receive the same error as a valid email with a wrong password.

---

### AUTH-011: Token Stored in localStorage; Auto-Cleared on Invalidation

| Field | Value |
|-------|-------|
| **Rule** | On login, the access token is stored in `localStorage` under the key `access_token`. If a subsequent call to `GET /api/v1/users/me` fails (expired or invalidated token), the token is silently removed and the user is treated as logged out. |
| **Type** | Action Enabler |
| **Source** | `lib/client/useAuth.ts:8-11`, `lib/client/useAuth.ts:24-27`, `lib/client/useAuth.ts:49-56`, `lib/client/api.ts:43` |
| **Enforcement** | Frontend |

**Example:**
> Given a user with an expired token still in localStorage,
> when the app loads and fetches the current user,
> then the failed request clears the token and redirects to `/login`.

---

### AUTH-012: Logout Clears Token and Query Cache

| Field | Value |
|-------|-------|
| **Rule** | Logging out removes `access_token` from `localStorage`, clears the entire TanStack Query client cache, and redirects the user to `/login`. |
| **Type** | Action Enabler |
| **Source** | `lib/client/useAuth.ts:62-66` |
| **Enforcement** | Frontend |

**Example:**
> Given a logged-in user who clicks "Sign Out",
> when the logout action runs,
> then no cached data remains, the token is gone, and the user sees the login page.

---

### AUTH-013: Successful Signup Redirects to Login (No Auto-Login)

| Field | Value |
|-------|-------|
| **Rule** | After successful self-registration, the user is redirected to `/login` rather than being automatically authenticated. They must complete a separate login step. |
| **Type** | Action Enabler |
| **Source** | `lib/client/useAuth.ts:36-38` |
| **Enforcement** | Frontend |

**Example:**
> Given a new user who just completed the signup form,
> when their account is created,
> then they are sent to the login page — not the dashboard.

---

### AUTH-014: Authenticated Users Redirected Away From Auth Pages

| Field | Value |
|-------|-------|
| **Rule** | Any logged-in user who navigates to `/login` or `/signup` is immediately redirected to `/` (the dashboard). Authenticated users cannot view auth pages. |
| **Type** | Constraint |
| **Source** | `app/(auth)/layout.tsx:11-14` |
| **Enforcement** | Frontend |

**Example:**
> Given a logged-in user who types `/login` in the browser,
> when the auth layout renders,
> then they are redirected to `/` without seeing the login form.

---

### AUTH-015: Unauthenticated Users Redirected to Login

| Field | Value |
|-------|-------|
| **Rule** | Users without a valid `access_token` in localStorage who attempt to access any dashboard route are immediately redirected to `/login`. |
| **Type** | Constraint |
| **Source** | `app/(dashboard)/layout.tsx:18-22` |
| **Enforcement** | Frontend |

**Example:**
> Given a user with no access token,
> when they navigate to `/contacts`,
> then they are redirected to `/login` before any data is fetched.

---

## Authorization & Access Control

### AUTHZ-001: Only Superusers Can List All Users

| Field | Value |
|-------|-------|
| **Rule** | `GET /api/v1/users` is restricted to superusers. Regular authenticated users receive HTTP 403 "The user doesn't have enough privileges". The frontend also disables this query for non-superusers. |
| **Type** | Constraint |
| **Source** | `app/api/v1/users/route.ts:16-19`, `lib/api-utils.ts:48-59`, `app/(dashboard)/admin/page.tsx:37` |
| **Enforcement** | Multiple |

**Example:**
> Given a regular user,
> when they call `GET /api/v1/users`,
> then they receive HTTP 403.

---

### AUTHZ-002: Only Superusers Can Create Users via Admin Endpoint

| Field | Value |
|-------|-------|
| **Rule** | `POST /api/v1/users` (the admin user-creation endpoint) requires superuser status. Regular users cannot create other users through this path; self-registration via `POST /api/v1/users/signup` remains publicly available. |
| **Type** | Constraint |
| **Source** | `app/api/v1/users/route.ts:45-48` |
| **Enforcement** | Backend |

**Example:**
> Given a regular user calling `POST /api/v1/users` with valid credentials,
> when processed,
> then they receive HTTP 403.

---

### AUTHZ-003: Only Superusers Can Read Another User's Profile by ID

| Field | Value |
|-------|-------|
| **Rule** | `GET /api/v1/users/[userId]` returns HTTP 403 "The user doesn't have enough privileges" when a regular user requests a userId that is not their own. |
| **Type** | Constraint |
| **Source** | `app/api/v1/users/[userId]/route.ts:27-29` |
| **Enforcement** | Backend |

**Example:**
> Given Alice (regular user),
> when she calls `GET /api/v1/users/bob-id`,
> then she receives HTTP 403.

---

### AUTHZ-004: Only Superusers Can Update or Delete Any User by ID

| Field | Value |
|-------|-------|
| **Rule** | `PATCH /api/v1/users/[userId]` and `DELETE /api/v1/users/[userId]` are restricted to superusers. Regular users cannot modify or delete other accounts. |
| **Type** | Constraint |
| **Source** | `app/api/v1/users/[userId]/route.ts:50-53`, `app/api/v1/users/[userId]/route.ts:124-126` |
| **Enforcement** | Backend |

**Example:**
> Given a regular user,
> when they call `DELETE /api/v1/users/some-other-id`,
> then they receive HTTP 403.

---

### AUTHZ-005: Superusers Cannot Delete Themselves

| Field | Value |
|-------|-------|
| **Rule** | Superusers are prohibited from deleting their own account through any path — neither `DELETE /api/v1/users/me` nor `DELETE /api/v1/users/[userId]` with their own ID. Both return HTTP 403 "Super users are not allowed to delete themselves". The frontend hides/disables the delete option for superusers in both the admin table and the Settings page. |
| **Type** | Constraint |
| **Source** | `app/api/v1/users/me/route.ts:76-78`, `app/api/v1/users/[userId]/route.ts:131-133`, `app/(dashboard)/settings/page.tsx:231-244`, `app/(dashboard)/admin/page.tsx:140-148` |
| **Enforcement** | Multiple |

**Example:**
> Given a superuser who confirms account deletion from Settings,
> when the API call is made,
> then the API returns HTTP 403 and the account is not deleted.

---

### AUTHZ-006: Regular Users See Only Their Own Contacts

| Field | Value |
|-------|-------|
| **Rule** | `GET /api/v1/contacts` applies a visibility scope: superusers receive all contacts from all users; regular users receive only contacts where `ownerId` equals their own user ID. |
| **Type** | Constraint |
| **Source** | `app/api/v1/contacts/route.ts:16-18` |
| **Enforcement** | Backend |

**Example:**
> Given Alice with 3 contacts and Bob with 5,
> when Alice calls `GET /api/v1/contacts`,
> then she sees only her 3 contacts; a superuser sees all 8.

---

### AUTHZ-007: Contact Operations Require Ownership or Superuser Status

| Field | Value |
|-------|-------|
| **Rule** | Reading, updating, or deleting a specific contact requires the requesting user to be either the contact's owner or a superuser. Any other authenticated user receives HTTP 403 "Not enough permissions". |
| **Type** | Constraint |
| **Source** | `app/api/v1/contacts/[contactId]/route.ts:36-38`, `app/api/v1/contacts/[contactId]/route.ts:65-67`, `app/api/v1/contacts/[contactId]/route.ts:127-129` |
| **Enforcement** | Backend |

**Example:**
> Given Alice who does not own contact C-123,
> when she calls `DELETE /api/v1/contacts/C-123`,
> then she receives HTTP 403.

---

### AUTHZ-008: Only Superusers Can Set isActive and isSuperuser Flags

| Field | Value |
|-------|-------|
| **Rule** | The `isActive` and `isSuperuser` fields can only be modified via the superuser-only admin endpoint `PATCH /api/v1/users/[userId]`. Users cannot change these flags on their own profile through `PATCH /api/v1/users/me`. The admin UI exposes these controls only to superusers. |
| **Type** | Constraint |
| **Source** | `app/api/v1/users/[userId]/route.ts:101-107`, `app/api/v1/users/me/route.ts:32-53`, `components/admin/EditUserDialog.tsx:129-139` |
| **Enforcement** | Multiple |

**Example:**
> Given a regular user calling `PATCH /api/v1/users/me` with `{ "is_active": false }`,
> when processed,
> then the flag is silently ignored and their account remains active.

---

### AUTHZ-009: Admin Navigation Item Hidden for Regular Users

| Field | Value |
|-------|-------|
| **Rule** | The "Admin" sidebar navigation item is rendered only for users where `isSuperuser === true`. It is absent from the DOM entirely for regular users — not merely disabled. |
| **Type** | Constraint |
| **Source** | `components/layout/Sidebar.tsx:15-28` |
| **Enforcement** | Frontend |

**Example:**
> Given a regular user browsing the dashboard,
> when they inspect the sidebar,
> then no "Admin" link exists in the rendered HTML.

---

### AUTHZ-010: Admin Page Programmatically Redirects Non-Superusers

| Field | Value |
|-------|-------|
| **Rule** | If a non-superuser reaches `/admin` directly (e.g., by typing the URL), the page component immediately redirects them to `/`. This provides defense-in-depth beyond the hidden sidebar link. |
| **Type** | Constraint |
| **Source** | `app/(dashboard)/admin/page.tsx:41-44` |
| **Enforcement** | Frontend |

**Example:**
> Given a regular user who types `/admin` in the browser,
> when the admin page component mounts,
> then they are redirected to `/` before any admin content renders.

---

### AUTHZ-011: Superusers Can Promote/Demote Any User

| Field | Value |
|-------|-------|
| **Rule** | Superusers can modify any user's `isSuperuser` and `isActive` flags via `PATCH /api/v1/users/[userId]`. These toggles are also exposed in the Edit User dialog in the admin UI. |
| **Type** | Action Enabler |
| **Source** | `app/api/v1/users/[userId]/route.ts:101-107`, `components/admin/EditUserDialog.tsx:129-139` |
| **Enforcement** | Multiple |

**Example:**
> Given a superuser who edits another user via the admin panel,
> when they toggle the "Super user" or "Active" checkboxes,
> then the target user's privileges and access are updated immediately.

---

## Validation & Data Integrity

### VAL-001: Email and Password Are Required

| Field | Value |
|-------|-------|
| **Rule** | Email and password are both required for login, self-registration, and admin user creation. Omitting either returns HTTP 400 "Email and password are required". Frontend forms enforce both as required with inline messages. |
| **Type** | Constraint |
| **Source** | `app/api/v1/login/access-token/route.ts:23-25`, `app/api/v1/users/signup/route.ts:11-13`, `app/api/v1/users/route.ts:53-55`, `app/(auth)/login/page.tsx:52-73`, `app/(auth)/signup/page.tsx:68-93` |
| **Enforcement** | Multiple |

**Example:**
> Given a signup form submitted without a password,
> when the backend receives the request,
> then it returns HTTP 400 "Email and password are required".

---

### VAL-002: Email Must Be a Valid Format

| Field | Value |
|-------|-------|
| **Rule** | Email addresses must match the pattern `^[^\s@]+@[^\s@]+\.[^\s@]+$` (no whitespace, exactly one `@`, at least one `.` in domain). Backend error: "Invalid email format". Frontend error: "Invalid email address". |
| **Type** | Constraint |
| **Source** | `lib/api-utils.ts:68-71`, `app/(auth)/login/page.tsx:54-58`, `app/(auth)/signup/page.tsx:69-75`, `app/(dashboard)/settings/page.tsx:94-100`, `components/admin/AddUserDialog.tsx:68-74`, `components/admin/EditUserDialog.tsx:94-99` |
| **Enforcement** | Multiple |

**Example:**
> Given a user submitting `notanemail` as their email,
> when the form is validated on the frontend,
> then they see "Invalid email address" before the request is sent.

---

### VAL-003: Email Must Be Globally Unique

| Field | Value |
|-------|-------|
| **Rule** | No two user accounts may share the same email address. On creation: "The user with this email already exists" (HTTP 400). On update: "Email already registered" (HTTP 400). Enforced in database schema, application code, and surfaced in frontend via server errors. |
| **Type** | Constraint |
| **Source** | `prisma/schema.prisma:12`, `prisma/migrations/20260119223632_init/migration.sql:25`, `app/api/v1/users/signup/route.ts:25-31`, `app/api/v1/users/route.ts:67-73`, `app/api/v1/users/me/route.ts:40-47`, `app/api/v1/users/[userId]/route.ts:78-85` |
| **Enforcement** | Multiple |

**Example:**
> Given `alice@example.com` already exists,
> when a new signup form is submitted with that email,
> then the API returns HTTP 400 "The user with this email already exists".

---

### VAL-004: Organisation Is Required for Contacts (max 255 chars)

| Field | Value |
|-------|-------|
| **Rule** | Every contact must have an `organisation` value. Required on creation (error: "Organisation is required"). Cannot be set to an empty string on update (error: "Organisation cannot be empty"). Must not exceed 255 characters on create or update (error: "Organisation must be at most 255 characters"). |
| **Type** | Constraint |
| **Source** | `app/api/v1/contacts/route.ts:60-66`, `app/api/v1/contacts/[contactId]/route.ts:74-80`, `components/contacts/AddContactDialog.tsx:64-70`, `components/contacts/EditContactDialog.tsx:78-85`, `prisma/schema.prisma:26` |
| **Enforcement** | Multiple |

**Example:**
> Given a user submitting an organisation name of 260 characters,
> when the add contact form is submitted,
> then they see "Organisation must be at most 255 characters" and the contact is not created.

---

### VAL-005: Password Change Requires Current Password Verification

| Field | Value |
|-------|-------|
| **Rule** | When a user changes their password, they must provide their current password, which must pass bcrypt verification before any change is applied. An incorrect current password returns HTTP 400 "Incorrect password". Both `current_password` and `new_password` are required fields. |
| **Type** | Constraint |
| **Source** | `app/api/v1/users/me/password/route.ts:17-28`, `app/(dashboard)/settings/page.tsx:143-147` |
| **Enforcement** | Multiple |

**Example:**
> Given a user who submits a wrong current password,
> when the password change form is processed,
> then the API returns HTTP 400 "Incorrect password" and no change is made.

---

### VAL-006: New Password Must Differ From Current Password

| Field | Value |
|-------|-------|
| **Rule** | When changing a password, the new password must not be identical to the current password. Submitting the same value returns HTTP 400 "New password cannot be the same as the current one". |
| **Type** | Constraint |
| **Source** | `app/api/v1/users/me/password/route.ts:37-39` |
| **Enforcement** | Backend |

**Example:**
> Given a user submitting their existing password as the new password,
> when processed,
> then the API returns HTTP 400 "New password cannot be the same as the current one".

---

### VAL-007: Password Confirmation Must Match

| Field | Value |
|-------|-------|
| **Rule** | On signup and password change forms, the "Confirm Password" field must exactly match the "Password" field. A mismatch produces "Passwords do not match". This validation is frontend-only; the API does not receive a confirm field. |
| **Type** | Constraint |
| **Source** | `app/(auth)/signup/page.tsx:104-108`, `app/(dashboard)/settings/page.tsx:182-187` |
| **Enforcement** | Frontend |

**Example:**
> Given a user entering `password123` and confirming with `password456`,
> when they try to submit,
> then the form shows "Passwords do not match" and does not submit.

---

### VAL-008: Admin Edit-User Password Field Is Optional

| Field | Value |
|-------|-------|
| **Rule** | When an admin edits a user's profile via the Edit User dialog, the password field is optional. If left blank, the password is not changed. If provided, it must be at least 8 characters. The blank field is excluded from the update payload entirely. |
| **Type** | Constraint |
| **Source** | `components/admin/EditUserDialog.tsx:93-115`, `components/admin/EditUserDialog.tsx:63-65` |
| **Enforcement** | Frontend |

**Example:**
> Given an admin editing a user's email only,
> when they leave the password field blank and submit,
> then only the email is updated; the password remains unchanged.

---

## Data Model & Relationships

### DATA-001: User and Contact IDs Are UUID v4 (System-Generated)

| Field | Value |
|-------|-------|
| **Rule** | All user and contact records use system-generated UUID v4 primary keys. IDs are assigned by the database at creation time and cannot be supplied or overridden by callers. |
| **Type** | Constraint |
| **Source** | `prisma/schema.prisma:11`, `prisma/schema.prisma:25`, `prisma/migrations/20260119223632_init/migration.sql:3,14` |
| **Enforcement** | Database |

**Example:**
> Given a new contact being created,
> when it is saved,
> then it receives an ID like `"550e8400-e29b-41d4-a716-446655440000"` automatically.

---

### DATA-002: Full Name and Contact Description Are Optional

| Field | Value |
|-------|-------|
| **Rule** | User `fullName` and contact `description` are optional nullable fields. A user is identified solely by email; a contact is valid with only an `organisation` value. Both default to `null`. |
| **Type** | Fact |
| **Source** | `prisma/schema.prisma:14`, `prisma/schema.prisma:27`, `app/api/v1/users/signup/route.ts:39`, `app/api/v1/contacts/route.ts:71` |
| **Enforcement** | Multiple |

**Example:**
> Given a minimal contact submission with only `organisation: "Acme Corp"`,
> when it is saved,
> then the contact is valid with `description: null`.

---

### DATA-003: New Users Are Active and Non-Superuser by Default

| Field | Value |
|-------|-------|
| **Rule** | Every new user account — whether self-registered or admin-created — is assigned `isActive: true` and `isSuperuser: false`. Superuser status requires explicit elevation. Enforced in both the database schema (defaults) and application layer (hardcoded values on creation). |
| **Type** | Constraint |
| **Source** | `prisma/schema.prisma:15-16`, `app/api/v1/users/signup/route.ts:40-42`, `app/api/v1/users/route.ts:82-84` |
| **Enforcement** | Multiple |

**Example:**
> Given a user who self-registers and includes `"is_superuser": true` in the body,
> when their account is created,
> then `isSuperuser = false` regardless of what was submitted.

---

### DATA-004: Contacts Are Always Owned by Their Creator

| Field | Value |
|-------|-------|
| **Rule** | When a contact is created, `ownerId` is set from the authenticated user's session, not from the request body. Ownership cannot be overridden at creation time. Contact ownership is immutable after creation — there is no API mechanism to transfer it. |
| **Type** | Derivation |
| **Source** | `app/api/v1/contacts/route.ts:71-72`, `app/api/v1/contacts/[contactId]/route.ts:70-86` |
| **Enforcement** | Backend |

**Example:**
> Given Alice creating a contact with `{ "organisation": "Acme", "ownerId": "bob-id" }`,
> when the contact is saved,
> then the contact's `ownerId` is Alice's ID, not Bob's.

---

### DATA-005: Deleting a User Permanently Deletes All Their Contacts

| Field | Value |
|-------|-------|
| **Rule** | The `Contact.owner` relationship uses `onDelete: Cascade`. When a user is deleted, all contacts owned by that user are automatically and permanently deleted. Contacts cannot outlive their owner. |
| **Type** | Action Enabler |
| **Source** | `prisma/schema.prisma:29`, `prisma/migrations/20260119223632_init/migration.sql:21` |
| **Enforcement** | Database |

**Example:**
> Given Bob who owns 5 contacts,
> when an admin deletes Bob's account,
> then all 5 of Bob's contacts are also permanently deleted in the same transaction.

---

### DATA-006: All Records Track Creation and Modification Timestamps

| Field | Value |
|-------|-------|
| **Rule** | Every `User` and `Contact` record automatically records `createdAt` (set once at creation) and `updatedAt` (maintained by the ORM on every write). These fields are system-managed and not settable by callers. |
| **Type** | Derivation |
| **Source** | `prisma/schema.prisma:18-19`, `prisma/schema.prisma:30-31` |
| **Enforcement** | Multiple |

**Example:**
> Given a contact whose organisation is updated,
> when the change is saved,
> then `updatedAt` is automatically refreshed to the current timestamp.

---

### DATA-007: No Soft Delete — All Deletions Are Permanent

| Field | Value |
|-------|-------|
| **Rule** | Neither `User` nor `Contact` models have a `deletedAt`, `isDeleted`, or archive field. All deletions are immediate and irreversible at the application level. There is no recycle bin or recovery mechanism. |
| **Type** | Fact |
| **Source** | `prisma/schema.prisma:10-34` (absence) |
| **Enforcement** | Database |

**Example:**
> Given an admin who deletes a user account,
> when they later search for that user,
> then there is no way to recover them.

---

### DATA-008: List Results Are Ordered Newest First

| Field | Value |
|-------|-------|
| **Rule** | Both contact list and user list queries order results by `createdAt` descending — the most recently created records appear first. |
| **Type** | Fact |
| **Source** | `app/api/v1/contacts/route.ts:23`, `app/api/v1/users/route.ts:26` |
| **Enforcement** | Backend |

**Example:**
> Given contacts created at 9am, 10am, and 11am,
> when the contact list is fetched,
> then the 11am contact appears first.

---

### DATA-009: Contact List and Single Contact Embed Owner Subset

| Field | Value |
|-------|-------|
| **Rule** | Contact API responses always embed the owner's `id`, `email`, and `fullName`. No other user fields (password hash, active state, superuser flag, timestamps) are included in the owner sub-object. |
| **Type** | Fact |
| **Source** | `app/api/v1/contacts/route.ts:27-33`, `app/api/v1/contacts/[contactId]/route.ts:20-28` |
| **Enforcement** | Backend |

**Example:**
> Given a superuser fetching a contact,
> when the owner sub-object is included,
> then it contains only `{ id, email, fullName }`.

---

## Security

### SEC-001: Password Hash Never Returned in API Responses

| Field | Value |
|-------|-------|
| **Rule** | The `hashedPassword` field is stripped from every user object before it is returned in any API response, across all endpoints. This is enforced via the `excludePassword` utility applied at every response boundary. |
| **Type** | Constraint |
| **Source** | `lib/auth.ts:86-102` |
| **Enforcement** | Backend |

**Example:**
> Given a client fetching a user profile,
> when the response arrives,
> then no `hashedPassword` field appears in the JSON body.

---

### SEC-002: JWT Secret Has Insecure Dev Fallback

| Field | Value |
|-------|-------|
| **Rule** | If `JWT_SECRET` is not set in the environment, the system falls back to the hardcoded string `"TheKeyForDevModeNoIssueIfShared"`. This fallback is intended only for local development. Any deployed environment without this variable configured allows any attacker to forge valid tokens. |
| **Type** | Fact |
| **Source** | `lib/auth.ts:5` |
| **Enforcement** | Backend |

**Example:**
> Given a production deployment with `JWT_SECRET` not configured,
> when tokens are issued,
> then they use a publicly known secret, rendering the entire authentication system insecure.

---

### SEC-003: No Global Auth Middleware — Per-Handler Enforcement Only

| Field | Value |
|-------|-------|
| **Rule** | There is no `middleware.ts` at the project root. Authentication is enforced at the individual route handler level via `requireAuth` and `requireSuperuser` guards. Any new API route added without calling these guards will be publicly accessible. |
| **Type** | Fact |
| **Source** | Project root (file absent) |
| **Enforcement** | Backend |

**Example:**
> Given a developer who adds a new `GET /api/v1/sensitive/route.ts` and forgets to call `requireAuth`,
> when the route is called unauthenticated,
> then there is no global middleware to block it — it is publicly accessible.

---

### SEC-004: Token Stored in localStorage (XSS-Vulnerable)

| Field | Value |
|-------|-------|
| **Rule** | The JWT access token is stored in `localStorage`, not an `HttpOnly` cookie. This means any XSS vulnerability in the application can exfiltrate the token. No Content-Security-Policy headers are configured at the framework layer. |
| **Type** | Fact |
| **Source** | `lib/client/useAuth.ts:50`, `lib/client/api.ts:43`, `next.config.ts:3` (no security headers) |
| **Enforcement** | Frontend |

**Example:**
> Given an XSS vulnerability in the application,
> when malicious script executes,
> then it can call `localStorage.getItem("access_token")` and exfiltrate the JWT.

---

### SEC-005: No Token Revocation Mechanism

| Field | Value |
|-------|-------|
| **Rule** | Once a JWT is issued, it cannot be invalidated before its 8-day expiry. There is no token blacklist, no server-side session store, and no refresh token mechanism. Deactivating a user (`isActive: false`) blocks new requests but does not revoke tokens already in use. |
| **Type** | Fact |
| **Source** | `lib/auth.ts` (entirety — absence of revocation) |
| **Enforcement** | Backend |

**Example:**
> Given an admin who deactivates a user,
> when that user makes an API request within seconds using their existing token,
> then the request is blocked by the `isActive` check — but the token itself is still valid elsewhere.

---

## Registration & Onboarding

### REG-001: Self-Registration Is Open — No Invite or Verification Required

| Field | Value |
|-------|-------|
| **Rule** | Anyone can create an account via `POST /api/v1/users/signup` without an invitation code, admin approval, or email verification. New accounts are immediately active. |
| **Type** | Fact |
| **Source** | `app/api/v1/users/signup/route.ts:6`, `prisma/schema.prisma:10-22` (absence of verification fields) |
| **Enforcement** | Backend |

**Example:**
> Given a brand-new visitor,
> when they submit a valid email and password via the signup form,
> then their account is created and immediately active.

---

### REG-002: Self-Registered Users Are Never Superusers

| Field | Value |
|-------|-------|
| **Rule** | Users who self-register via the public signup endpoint are always assigned `isSuperuser: false`. This value is hardcoded and cannot be overridden by the caller — no signup payload field can produce a superuser account. |
| **Type** | Constraint |
| **Source** | `app/api/v1/users/signup/route.ts:40-42` |
| **Enforcement** | Backend |

**Example:**
> Given an attacker who submits `{ "is_superuser": true }` in the signup body,
> when the account is created,
> then `isSuperuser` is `false` regardless.

---

### REG-003: Admin-Created Users Default to Active; Superuser Flag Is Controllable

| Field | Value |
|-------|-------|
| **Rule** | When a superuser creates a user via the admin endpoint, `isActive` is always `true`. The `isSuperuser` flag defaults to `false` but can be set to `true` by explicitly passing `is_superuser: true`. |
| **Type** | Derivation |
| **Source** | `app/api/v1/users/route.ts:82-84`, `components/admin/AddUserDialog.tsx:33,108` |
| **Enforcement** | Multiple |

**Example:**
> Given a superuser creating a new user via the admin panel with the "Super user" checkbox checked,
> when the form is submitted,
> then the new user is created as both active and superuser.

---

### REG-004: System Bootstrapped with One Superuser via Seed

| Field | Value |
|-------|-------|
| **Rule** | The system is initialized with exactly one superuser account. Credentials are read from `FIRST_SUPERUSER_EMAIL` and `FIRST_SUPERUSER_PASSWORD` environment variables, with fallback dev defaults. Seeding is idempotent — re-running does not overwrite existing data. |
| **Type** | Action Enabler |
| **Source** | `prisma/seed.ts:14-28`, `.env:8-10` |
| **Enforcement** | Backend |

**Example:**
> Given a fresh database,
> when `npm run db:seed` is executed,
> then one superuser account exists and can immediately access the admin panel.

---

## API Behavior & Contracts

### API-001: All Endpoints Are Versioned Under /api/v1/

| Field | Value |
|-------|-------|
| **Rule** | All API endpoints are namespaced under the `/api/v1/` prefix. There is no unversioned API surface. |
| **Type** | Fact |
| **Source** | `app/api/v1/` (directory structure), `lib/client/api.ts:1` |
| **Enforcement** | Multiple |

**Example:**
> Given a client calling `/api/contacts`,
> when processed,
> then they receive a 404 — the correct path is `/api/v1/contacts`.

---

### API-002: All Error Responses Use `{ detail: string }` Format

| Field | Value |
|-------|-------|
| **Rule** | All API errors are returned as JSON `{ "detail": "<message>" }` with an appropriate HTTP status code. This is consistent with the FastAPI/OpenAPI convention. Clients parse `error.detail` to display error messages, falling back to "An error occurred" if parsing fails. |
| **Type** | Fact |
| **Source** | `lib/api-utils.ts:15-20`, `lib/client/api.ts:53-59` |
| **Enforcement** | Multiple |

**Example:**
> Given a validation error on email format,
> when the API responds,
> then the body is `{ "detail": "Invalid email format" }` with status 400.

---

### API-003: Successful Creation Returns HTTP 201

| Field | Value |
|-------|-------|
| **Rule** | Successful resource creation (`POST /api/v1/users/signup`, `POST /api/v1/users`, `POST /api/v1/contacts`) returns HTTP 201. All other successful responses return HTTP 200. |
| **Type** | Constraint |
| **Source** | `app/api/v1/users/signup/route.ts:45`, `app/api/v1/users/route.ts:87`, `app/api/v1/contacts/route.ts:85` |
| **Enforcement** | Backend |

**Example:**
> Given a successful new user creation,
> when the response arrives,
> then the HTTP status is 201 — not 200.

---

### API-004: Pagination Defaults to skip=0, limit=100 (Max 100)

| Field | Value |
|-------|-------|
| **Rule** | Paginated list endpoints accept `skip` (default 0) and `limit` (default 100) query parameters. The `limit` is hard-capped at 100 — any larger value is silently clamped. The client requests exactly 5 items per page. |
| **Type** | Constraint |
| **Source** | `lib/api-utils.ts:61-66`, `lib/client/api.ts:132-137`, `app/(dashboard)/admin/page.tsx:25`, `app/(dashboard)/contacts/page.tsx:22` |
| **Enforcement** | Multiple |

**Example:**
> Given a client requesting `?limit=1000`,
> when the query runs,
> then at most 100 records are returned with no error indicating truncation.

---

### API-005: List Responses Include Total Count Alongside Page Data

| Field | Value |
|-------|-------|
| **Rule** | All paginated list responses return both a `data` array (current page items) and a `count` integer (total matching records across all pages). Both are computed in a single parallel database transaction. The frontend uses `count` to compute the total number of pages. |
| **Type** | Derivation |
| **Source** | `app/api/v1/contacts/route.ts:20-37`, `app/api/v1/users/route.ts:23-30` |
| **Enforcement** | Backend |

**Example:**
> Given 47 total contacts and a request for page 2 (skip=5, limit=5),
> when the response is returned,
> then `{ data: [5 contacts], count: 47 }`.

---

### API-006: Health-Check Endpoint Is Publicly Accessible

| Field | Value |
|-------|-------|
| **Rule** | `GET /api/v1/health-check` requires no authentication and always returns HTTP 200 `{ "status": "ok" }`. |
| **Type** | Fact |
| **Source** | `app/api/v1/health-check/route.ts:3-5` |
| **Enforcement** | Backend |

**Example:**
> Given a monitoring system pinging the health-check endpoint,
> when the service is running,
> then it receives HTTP 200 with `{ "status": "ok" }` — no auth token required.

---

### API-007: Contact Ownership Is Immutable

| Field | Value |
|-------|-------|
| **Rule** | Contact ownership (`ownerId`) cannot be changed after creation. The update endpoint accepts `organisation` and `description` only. There is no API mechanism to transfer a contact to a different owner. |
| **Type** | Fact |
| **Source** | `app/api/v1/contacts/[contactId]/route.ts:70-86` (absence of ownerId in update payload) |
| **Enforcement** | Backend |

**Example:**
> Given Alice who owns contact C-123,
> when an admin attempts to reassign it to Bob by sending `{ "ownerId": "bob-id" }`,
> then the field is silently ignored and Alice remains the owner.

---

## Derived Values & Display Rules

### CALC-001: User Display Name Falls Back to Email, then "User"

| Field | Value |
|-------|-------|
| **Rule** | The navbar displays the user's display name with priority: `fullName` → `email` → literal string `"User"`. |
| **Type** | Derivation |
| **Source** | `components/layout/Navbar.tsx:33` |
| **Enforcement** | Frontend |

**Example:**
> Given a user with `fullName: null` and `email: "alice@example.com"`,
> when the navbar renders,
> then the button shows `"alice@example.com"`.

---

### CALC-002: Dashboard Greeting Uses Full Name If Set

| Field | Value |
|-------|-------|
| **Rule** | The dashboard greeting is: "Welcome back, {fullName}!" if `fullName` is set; "Welcome back!" with no name if not. |
| **Type** | Derivation |
| **Source** | `app/(dashboard)/page.tsx:14` |
| **Enforcement** | Frontend |

**Example:**
> Given a user with `fullName: null`,
> when they view the dashboard,
> then the greeting reads "Welcome back!" with no name appended.

---

### CALC-003: User Role Label Derived from isSuperuser

| Field | Value |
|-------|-------|
| **Rule** | A user's displayed role label is derived from `isSuperuser`: `true` → "Admin" (purple badge); `false` → "User" (grey badge). There are no other roles. |
| **Type** | Derivation |
| **Source** | `app/(dashboard)/admin/page.tsx:112-118` |
| **Enforcement** | Frontend |

**Example:**
> Given a superuser in the admin table,
> when the role badge renders,
> then it shows "Admin" in purple; a regular user shows "User" in grey.

---

### CALC-004: User Status Label Derived from isActive

| Field | Value |
|-------|-------|
| **Rule** | A user's displayed status is derived from `isActive`: `true` → "Active" (green badge); `false` → "Inactive" (red badge). |
| **Type** | Derivation |
| **Source** | `app/(dashboard)/admin/page.tsx:119-122` |
| **Enforcement** | Frontend |

**Example:**
> Given a deactivated user,
> when they appear in the admin table,
> then their status badge shows "Inactive" in red.

---

### CALC-005: Pagination Page Count Computed from Total Count

| Field | Value |
|-------|-------|
| **Rule** | Total page count is computed as `Math.ceil(totalCount / PAGE_SIZE)` where `PAGE_SIZE = 5`. The client uses the `count` field from the API response to drive pagination controls. |
| **Type** | Derivation |
| **Source** | `app/(dashboard)/admin/page.tsx:25,48`, `app/(dashboard)/contacts/page.tsx:22,36` |
| **Enforcement** | Frontend |

**Example:**
> Given 13 total contacts,
> when the contacts page renders,
> then pagination shows 3 pages (⌈13/5⌉ = 3).

---

### CALC-006: Null fullName and description Display as "-"

| Field | Value |
|-------|-------|
| **Rule** | Contact `description` and user `fullName` display as "-" in table cells when the value is `null` or empty. |
| **Type** | Derivation |
| **Source** | `app/(dashboard)/contacts/page.tsx:84-86`, `app/(dashboard)/admin/page.tsx:103` |
| **Enforcement** | Frontend |

**Example:**
> Given a contact with `description: null`,
> when displayed in the contacts table,
> then the description cell shows "-".

---

## Workflow & Interaction Rules

### WORK-001: All Destructive Actions Require Confirmation

| Field | Value |
|-------|-------|
| **Rule** | Deleting a user, deleting a contact, or deleting one's own account all require passing through an explicit confirmation dialog before proceeding. Each dialog includes a message that the action cannot be undone and explains what data will be removed. |
| **Type** | Action Enabler |
| **Source** | `components/admin/DeleteUserDialog.tsx:37-43`, `components/contacts/DeleteContactDialog.tsx:38-42`, `app/(dashboard)/settings/page.tsx:251-280` |
| **Enforcement** | Frontend |

**Example:**
> Given a superuser who clicks "Delete" on a user row,
> when the action is triggered,
> then a confirmation dialog appears showing the user's email and a warning before proceeding.

---

### WORK-002: Self-Account Deletion Triggers Automatic Logout

| Field | Value |
|-------|-------|
| **Rule** | After a user successfully deletes their own account, they are automatically logged out (token cleared, query cache wiped) and redirected to `/login`. |
| **Type** | Action Enabler |
| **Source** | `app/(dashboard)/settings/page.tsx:64-68` |
| **Enforcement** | Frontend |

**Example:**
> Given a regular user who confirms deletion of their own account,
> when the deletion succeeds,
> then their session is cleared and they are redirected to `/login` immediately.

---

### WORK-003: Superuser "Delete My Account" Button Is Hidden

| Field | Value |
|-------|-------|
| **Rule** | On the Settings Danger Zone, superusers see the text "Super users cannot delete their own account." instead of the delete button. Regular users see the delete button. |
| **Type** | Constraint |
| **Source** | `app/(dashboard)/settings/page.tsx:231-244` |
| **Enforcement** | Frontend |

**Example:**
> Given a superuser viewing their Settings page,
> when they scroll to the Danger Zone,
> then there is no "Delete My Account" button — only an explanatory message.

---

---

## Findings

Inconsistencies and policy gaps found during cross-reference analysis.

| # | Finding | Severity | Details |
|---|---------|----------|---------|
| 1 | JWT secret has hardcoded insecure dev fallback | HIGH | `lib/auth.ts:5` uses `"TheKeyForDevModeNoIssueIfShared"` when `JWT_SECRET` is absent. Any deployment without this environment variable configured allows arbitrary token forgery. |
| 2 | JWT token stored in localStorage (XSS-vulnerable) | HIGH | The access token is in `localStorage`, not an `HttpOnly` cookie. Any XSS vulnerability can exfiltrate the full token. No CSP headers are configured at the Next.js framework layer (`next.config.ts:3`). |
| 3 | No rate limiting on login or signup | HIGH | There is no rate limiting on `POST /api/v1/login/access-token` or `POST /api/v1/users/signup`. Combined with open registration, this exposes the system to credential stuffing and account enumeration at scale. |
| 4 | Password max length (40 chars) not enforced on frontend | MEDIUM | The backend enforces a 40-character maximum (`lib/api-utils.ts:77-79`), but no frontend form applies a `maxLength` constraint. Users can enter a 100-character password that only the API rejects. |
| 5 | No global auth middleware — per-handler enforcement only | MEDIUM | Dashboard route protection relies on client-side `useEffect` redirects (`app/(dashboard)/layout.tsx:18-22`). Server-rendered content could flash to unauthenticated users before client JS hydrates. New API routes added without `requireAuth` will be publicly accessible. |
| 6 | No token revocation or refresh mechanism | MEDIUM | Issued tokens are valid until their 8-day expiry with no way to invalidate them early. An attacker who steals a token has access for up to 8 days even after a password change or account deactivation (deactivation only blocks the `isActive` check). |
| 7 | `excludePassword` is manual, not structural | MEDIUM | `excludePassword` (`lib/auth.ts:86-102`) must be called on every code path returning user data. If any route forgets this call, the password hash is exposed. A Prisma `select` exclusion at the query level would be safer. |
| 8 | No email verification | MEDIUM | Accounts are immediately active with no email ownership verification. A user can register with any email address, including impersonating others. |
| 9 | Inconsistent duplicate-email error messages | LOW | Duplicate email at creation: "The user with this email already exists". At update: "Email already registered". Clients that parse error messages will need to handle both strings for the same constraint. |
| 10 | Pagination limit silently clamped without notification | LOW | `lib/api-utils.ts:65` clamps `limit` to 100 via `Math.min` without indicating truncation to the caller. A client requesting 500 records receives 100 with no warning — silent data loss is possible. |
| 11 | Contact update uses GET/PATCH-style semantics despite PUT route name | LOW | The route file is named `route.ts` and accepts `PUT`, but the update handler only modifies fields present in the request body (`!== undefined`) — PATCH semantics per HTTP spec. Omitted fields are preserved, not nulled. This is correct behavior but the HTTP method is semantically misleading. |
| 12 | No audit log | LOW | There is no audit trail for any action (user creation, deletion, login, privilege changes). Only `updatedAt` timestamps remain. Forensic analysis of incidents is not possible. |

---

## Coverage Summary

| Category | Count | Key Files Scanned |
|----------|-------|-------------------|
| Authentication | 15 | `lib/auth.ts`, `lib/api-utils.ts`, `app/api/v1/login/access-token/route.ts`, `app/(auth)/layout.tsx`, `app/(dashboard)/layout.tsx`, `lib/client/useAuth.ts`, `lib/client/api.ts` |
| Authorization | 11 | `app/api/v1/users/route.ts`, `app/api/v1/users/[userId]/route.ts`, `app/api/v1/contacts/route.ts`, `app/api/v1/contacts/[contactId]/route.ts`, `app/(dashboard)/admin/page.tsx`, `components/layout/Sidebar.tsx`, `components/admin/EditUserDialog.tsx` |
| Validation | 8 | `lib/api-utils.ts`, `app/api/v1/users/signup/route.ts`, `app/api/v1/users/me/password/route.ts`, `app/api/v1/contacts/route.ts`, `app/api/v1/contacts/[contactId]/route.ts`, `app/(auth)/signup/page.tsx`, `app/(dashboard)/settings/page.tsx`, `components/contacts/`, `components/admin/` |
| Data Model | 9 | `prisma/schema.prisma`, `prisma/migrations/20260119223632_init/migration.sql`, `app/api/v1/users/signup/route.ts`, `app/api/v1/contacts/route.ts`, `app/api/v1/contacts/[contactId]/route.ts` |
| Security | 5 | `lib/auth.ts`, `.env`, `next.config.ts`, `lib/client/useAuth.ts`, `lib/client/api.ts` |
| Registration | 4 | `app/api/v1/users/signup/route.ts`, `app/api/v1/users/route.ts`, `prisma/seed.ts`, `.env` |
| API Contract | 7 | `lib/api-utils.ts`, `lib/client/api.ts`, `app/api/v1/` (all route files) |
| Derived Values | 6 | `components/layout/Navbar.tsx`, `app/(dashboard)/page.tsx`, `app/(dashboard)/admin/page.tsx`, `app/(dashboard)/contacts/page.tsx` |
| Workflow | 3 | `components/admin/DeleteUserDialog.tsx`, `components/contacts/DeleteContactDialog.tsx`, `app/(dashboard)/settings/page.tsx` |
| **Total** | **68** | |
