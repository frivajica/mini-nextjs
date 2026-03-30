# mini-nextjs

Production-ready Next.js 16 learning project demonstrating secure authentication, Redis caching, PostgreSQL with Drizzle ORM, and React Query for server state management.

## Tech Stack

| Category  | Technology                              |
| --------- | --------------------------------------- |
| Framework | Next.js 16 (App Router)                 |
| Language  | TypeScript                              |
| Auth      | NextAuth.js v5 (JWT + httpOnly cookies) |
| Database  | PostgreSQL + Drizzle ORM                |
| Cache     | Redis (ioredis)                         |
| State     | Zustand (UI) + React Query (server)     |
| Forms     | React Hook Form + Zod                   |
| Styling   | Tailwind CSS                            |

## Quick Start

```bash
# Start infrastructure
docker compose up -d

# Install dependencies
yarn install

# Push schema to database
yarn db:push

# Start development
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) → redirects to `/login`

## Features

- **Authentication**: JWT sessions + refresh token rotation with httpOnly cookies
- **Security**: bcrypt passwords, rate limiting, input validation, CORS, proxy trust
- **API Routes**: RESTful endpoints with proper error handling
- **State Management**: Zustand for auth state, React Query for server data
- **Forms**: Type-safe forms with React Hook Form + Zod validation
- **Middleware**: Route protection via Next.js proxy (middleware.ts → proxy.ts)

## Documentation

| Document                               | Description                            |
| -------------------------------------- | -------------------------------------- |
| [docs/LEARN.md](docs/LEARN.md)         | Learning guide - study topics in order |
| [docs/AUTH_INFO.md](docs/AUTH_INFO.md) | Deep dive into auth architecture       |
| [AUDIT.md](AUDIT.md)                   | Security audit results and fixes       |

## Project Structure

```
src/
├── app/                    # App Router (pages, API routes)
│   ├── (auth)/            # Login, register pages
│   ├── (dashboard)/       # Protected pages
│   └── api/              # REST endpoints
├── components/ui/          # Reusable UI components
├── hooks/                  # React Query hooks
├── lib/                    # Core: auth, db, redis, env
├── services/              # Business logic
├── stores/                # Zustand stores
└── types/                 # TypeScript types
```

## Auth Flow

```
1. Login → POST /api/auth/login → Sets httpOnly refresh cookie
2. Access → NextAuth reads JWT cookie automatically
3. Refresh → POST /api/auth/refresh → Rotates tokens (atomic)
4. Logout → POST /api/auth/logout → Clears cookie + revokes token
```

## Scripts

```bash
yarn dev          # Development server
yarn build        # Production build
yarn start        # Production server
yarn db:push      # Push schema to PostgreSQL
yarn db:studio    # Open Drizzle Studio
yarn lint         # Run ESLint
```
