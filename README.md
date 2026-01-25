# CRM Training Application (Next.js + React)

A training CRM application built with Next.js 16, Prisma 7, and React with Chakra UI.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Chakra UI 3
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma 7 ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **State Management**: TanStack Query

## Features

- User authentication (login/signup)
- Contact management (CRUD)
- User administration (superuser only)
- Profile settings
- REST API for external clients

## Quick Start

Requirements:
- Node.js 20+

```bash
# Install dependencies
npm install

# Run migrations and generate Prisma client
npm run db:migrate && npx prisma generate

# Seed database with test data
npm run db:seed

# Start development server
npm run dev
```

Open http://localhost:3000

## Default Users

| Email | Password | Role |
|-------|----------|------|
| dev@example.com | DevPassword | Superuser |
| alice@example.com | AlicePassword123 | User |
| bob@example.com | BobPassword123 | User |

## Project Structure

```
app/
├── (auth)/               # Public auth pages (login, signup)
├── (dashboard)/          # Protected pages (contacts, admin, settings)
├── api/v1/               # REST API routes
│   ├── login/            # Authentication endpoints
│   ├── users/            # User management endpoints
│   └── contacts/         # Contact CRUD endpoints
├── layout.tsx            # Root layout
└── providers.tsx         # Client providers (Chakra, React Query)
components/
├── layout/               # Sidebar, Navbar
├── contacts/             # Contact CRUD dialogs
├── admin/                # User management dialogs
└── settings/             # Settings components
lib/
├── db.ts                 # Prisma client singleton
├── auth.ts               # JWT & password utilities
├── api-utils.ts          # API response helpers
└── client/               # Frontend API client & hooks
prisma/
├── schema.prisma         # Database schema
├── seed.ts               # Seed script
└── migrations/           # Database migrations
```

## REST API

Base URL: `/api/v1`

### Authentication

```bash
# Login (get bearer token)
POST /api/v1/login/access-token
Content-Type: application/json
{
  "username": "dev@example.com",
  "password": "DevPassword"
}

# Response
{
  "access_token": "...",
  "token_type": "Bearer"
}

# Test token validity
POST /api/v1/login/test-token
Authorization: Bearer <token>
```

### Users

```bash
# Get current user
GET /api/v1/users/me
Authorization: Bearer <token>

# Update profile
PATCH /api/v1/users/me
Authorization: Bearer <token>
{
  "email": "new@example.com",
  "full_name": "New Name"
}

# Change password
PATCH /api/v1/users/me/password
Authorization: Bearer <token>
{
  "current_password": "...",
  "new_password": "..."
}

# Signup (public)
POST /api/v1/users/signup
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "User Name"
}

# Admin: List users
GET /api/v1/users
Authorization: Bearer <token>  # requires superuser

# Admin: Create user
POST /api/v1/users
Authorization: Bearer <token>  # requires superuser

# Admin: Update user
PATCH /api/v1/users/{id}
Authorization: Bearer <token>  # requires superuser

# Admin: Delete user
DELETE /api/v1/users/{id}
Authorization: Bearer <token>  # requires superuser
```

### Contacts

```bash
# List contacts
GET /api/v1/contacts
Authorization: Bearer <token>

# Create contact
POST /api/v1/contacts
Authorization: Bearer <token>
{
  "organisation": "Company Name",
  "description": "Optional description"
}

# Get contact
GET /api/v1/contacts/{id}
Authorization: Bearer <token>

# Update contact
PUT /api/v1/contacts/{id}
Authorization: Bearer <token>

# Delete contact
DELETE /api/v1/contacts/{id}
Authorization: Bearer <token>
```

### Health Check

```bash
GET /api/v1/health-check
# Response: { "message": "OK" }
```

## Development Commands

```bash
# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Reset database
npm run db:reset

# Build for production
npm run build

# Run linter
npm run lint
```

## Environment Variables

Key variables in `.env`:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Auth
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="8d"

# First superuser (optional, used by seeder)
FIRST_SUPERUSER_EMAIL=dev@example.com
FIRST_SUPERUSER_PASSWORD=DevPassword
```

## License

This project is for training purposes.
