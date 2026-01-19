# CRM - Contact Management Application

A full-stack contact relationship management application built with Next.js 16, Prisma 7, and Chakra UI.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Chakra UI 3, TanStack Query
- **Backend**: Next.js API Routes
- **Database**: SQLite, Prisma 7 ORM
- **Authentication**: JWT tokens with bcrypt password hashing

## Prerequisites

- Node.js 20+

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Migrations

```bash
npm run db:migrate
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Seed the Database

```bash
npm run db:seed
```

This creates test users and sample data:
- **Admin**: `dev@example.com` / `DevPassword`
- **User**: `alice@example.com` / `AlicePassword123`
- **User**: `bob@example.com` / `BobPassword123`

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with test data |
| `npm run db:reset` | Reset database (drop and recreate) |

## Project Structure

```
├── app/
│   ├── (auth)/           # Public auth pages (login, signup)
│   ├── (dashboard)/      # Protected pages (contacts, admin, settings)
│   ├── api/v1/           # API routes
│   │   ├── login/        # Authentication endpoints
│   │   ├── users/        # User management endpoints
│   │   └── contacts/     # Contact CRUD endpoints
│   ├── layout.tsx        # Root layout
│   └── providers.tsx     # Client providers (Chakra, React Query)
├── components/
│   ├── layout/           # Sidebar, Navbar
│   ├── contacts/         # Contact CRUD dialogs
│   ├── admin/            # User management dialogs
│   └── settings/         # Settings components
├── lib/
│   ├── db.ts             # Prisma client singleton
│   ├── auth.ts           # JWT & password utilities
│   ├── api-utils.ts      # API response helpers
│   └── client/           # Frontend API client & hooks
└── prisma/
    ├── schema.prisma     # Database schema
    ├── seed.ts           # Seed script
    └── migrations/       # Database migrations
```

## Features

### Authentication
- JWT-based authentication
- Login/Signup pages
- Protected routes
- Token stored in localStorage

### User Management (Admin)
- Create, edit, delete users
- Assign superuser role
- Activate/deactivate users

### Contact Management
- Create, edit, delete contacts
- Pagination
- Superusers see all contacts
- Regular users see only their own

### Settings
- Update profile (email, name)
- Change password
- Delete account (non-admins only)

## API Endpoints

### Authentication
- `POST /api/v1/login/access-token` - Login
- `POST /api/v1/login/test-token` - Verify token

### Users
- `GET /api/v1/users` - List users (admin only)
- `POST /api/v1/users` - Create user (admin only)
- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/me` - Update current user
- `PATCH /api/v1/users/me/password` - Change password
- `DELETE /api/v1/users/me` - Delete account
- `POST /api/v1/users/signup` - Register new user
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user (admin only)
- `DELETE /api/v1/users/:id` - Delete user (admin only)

### Contacts
- `GET /api/v1/contacts` - List contacts
- `POST /api/v1/contacts` - Create contact
- `GET /api/v1/contacts/:id` - Get contact
- `PUT /api/v1/contacts/:id` - Update contact
- `DELETE /api/v1/contacts/:id` - Delete contact

## Environment Variables

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Auth
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="8d"

# Seed (optional)
FIRST_SUPERUSER_EMAIL="dev@example.com"
FIRST_SUPERUSER_PASSWORD="DevPassword"
```

## Development Notes

- The app uses Prisma 7 with the `@prisma/adapter-better-sqlite3` driver adapter
- SQLite database is stored in `prisma/dev.db`
- Chakra UI 3 is used for the UI component library
- TanStack Query handles server state management
- React Hook Form handles form state and validation
