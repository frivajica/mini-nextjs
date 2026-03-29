# Next.js Authentication Guide

> This document explains how authentication works in this Next.js project.
> For comparison with Express/NestJS, see those projects' `AUTH_INFO.md`.

---

## Overview

This Next.js project uses **NextAuth.js v5** with JWT sessions and Redis-cached refresh tokens.

| Component        | Technology                              |
| ---------------- | --------------------------------------- |
| Auth Framework   | NextAuth.js v5 (Beta)                   |
| Session Strategy | JWT (stored in secure HTTPOnly cookies) |
| Token Storage    | Redis (for refresh token validation)    |
| Database         | PostgreSQL via Drizzle ORM              |
| Password Hashing | bcrypt                                  |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js App                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────┐       │
│  │  Client  │───▶│  NextAuth.js │───▶│    Redis    │       │
│  └──────────┘    └──────────────┘    │  (Sessions) │       │
│                          │            └─────────────┘       │
│                          │                   │              │
│                          ▼                   ▼              │
│                   ┌──────────────┐    ┌─────────────┐       │
│                   │   Drizzle   │    │ PostgreSQL  │       │
│                   │  (Adapter)  │    │  (Users)    │       │
│                   └──────────────┘    └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## Token Flow

### 1. Login

```
Client                    Next.js API                 Redis           Database
  │                          │                          │                │
  │  POST /api/auth         │                          │                │
  │  { email, password }    │                          │                │
  │─────────────────────────▶│                          │                │
  │                          │  Validate credentials    │                │
  │                          │──────────────────────────▶│                │
  │                          │  (bcrypt compare)         │                │
  │                          │◀──────────────────────────│                │
  │                          │                          │                │
  │                          │  INSERT refresh_token    │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │                          │  Cache in Redis          │                │
  │                          │  SETEX refresh:token    │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │  JWT Session Cookie     │                          │                │
  │◀─────────────────────────│                          │                │
  │                          │                          │                │
```

### 2. Accessing Protected Routes

```
Client                    Next.js API                 Redis           Database
  │                          │                          │                │
  │  GET /users             │                          │                │
  │  Cookie: JWT Session   │                          │                │
  │─────────────────────────▶│                          │                │
  │                          │  Verify JWT              │                │
  │                          │  (NextAuth)              │                │
  │                          │                          │                │
  │  { users: [...] }       │                          │                │
  │◀─────────────────────────│                          │                │
  │                          │                          │                │
```

### 3. Token Refresh (with Redis)

```
Client                    Next.js API                 Redis           Database
  │                          │                          │                │
  │  POST /api/auth          │                          │                │
  │  { action: "refresh",   │                          │                │
  │    refreshToken }       │                          │                │
  │─────────────────────────▶│                          │                │
  │                          │  Check Redis cache        │                │
  │                          │  GET refresh:token       │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │                          │  Return userId if found  │                │
  │                          │◀─────────────────────────│                │
  │                          │                          │                │
  │                          │  DELETE old refresh      │                │
  │                          │  token from DB          │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │                          │  INSERT new refresh     │                │
  │                          │  token                   │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │                          │  Update Redis cache      │                │
  │                          │  SETEX refresh:new      │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │  { refreshToken }       │                          │                │
  │◀─────────────────────────│                          │                │
  │                          │                          │                │
```

### 4. Logout

```
Client                    Next.js API                 Redis           Database
  │                          │                          │                │
  │  POST /api/auth          │                          │                │
  │  { action: "logout",    │                          │                │
  │    refreshToken }       │                          │                │
  │─────────────────────────▶│                          │                │
  │                          │  DELETE refresh_token    │                │
  │                          │  from DB                 │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │                          │  DELETE from Redis       │                │
  │                          │  DEL refresh:token      │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │  Clear session cookie    │                          │                │
  │◀─────────────────────────│                          │                │
  │                          │                          │                │
```

---

## Key Files

| File                                                                                  | Purpose                                                  |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| [src/lib/auth.ts](../src/lib/auth.ts)                                                 | NextAuth configuration, JWT callbacks                    |
| [src/app/api/auth/[...nextauth]/route.ts](../src/app/api/auth/[...nextauth]/route.ts) | NextAuth handler                                         |
| [src/app/api/auth/route.ts](../src/app/api/auth/route.ts)                             | Custom auth endpoints (register, login, refresh, logout) |
| [src/services/user.service.ts](../src/services/user.service.ts)                       | User CRUD, token management                              |
| [src/lib/redis.ts](../src/lib/redis.ts)                                               | Redis client                                             |
| [src/lib/schema.ts](../src/lib/schema.ts)                                             | Database schema                                          |
| [src/stores/auth.store.ts](../src/stores/auth.store.ts)                               | Zustand store for client auth state                      |

---

## Database Schema

### Users Table

```typescript
// src/lib/schema.ts
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("USER").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Refresh Tokens Table

```typescript
export const refreshTokens = pgTable("refresh_tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Security Features

1. **Password Hashing**: bcrypt with configurable rounds (default 10)
2. **JWT Sessions**: Stored in HTTPOnly cookies (secure, not accessible to JS)
3. **Redis Caching**: Fast token validation without DB hit on every refresh
4. **Token Rotation**: New refresh token on every refresh (old invalidated)
5. **Rate Limiting**: 10 requests per minute per IP on auth endpoints
6. **Input Validation**: Zod schemas for all inputs

---

## Comparison: Next.js vs Other Frameworks

### Authentication Comparison

| Feature          | Express   | NestJS      | Next.js (This) |
| ---------------- | --------- | ----------- | -------------- |
| Auth Framework   | Custom    | Passport.js | NextAuth.js    |
| Session Storage  | In-memory | PostgreSQL  | Redis + JWT    |
| Token Rotation   | DB-based  | DB-based    | Redis-cached   |
| Password Hashing | bcrypt    | bcrypt      | bcrypt         |
| Rate Limiting    | Manual    | Throttler   | Manual         |

### Why This Approach?

- **NextAuth.js**: Industry standard for Next.js, handles session complexity
- **Redis for tokens**: Fast validation, production-grade token rotation
- **JWT in cookies**: Secure, CSRF protected with proper headers

---

## API Endpoints

| Method | Endpoint          | Description                      | Auth        |
| ------ | ----------------- | -------------------------------- | ----------- |
| POST   | `/api/auth`       | Register, Login, Refresh, Logout | No          |
| GET    | `/api/users`      | List users                       | JWT         |
| GET    | `/api/users?id=X` | Get user by ID                   | JWT         |
| PATCH  | `/api/users`      | Update user (admin)              | JWT + Admin |
| DELETE | `/api/users?id=X` | Delete user (admin)              | JWT + Admin |
| GET    | `/api/health`     | Health check                     | No          |

### Auth Actions (POST /api/auth)

```typescript
// Register
{ action: "register", data: { email, name, password } }

// Login
{ action: "login", data: { email, password } }

// Refresh
{ action: "refresh", refreshToken: "..." }

// Logout
{ action: "logout", refreshToken: "..." }
```

---

## Environment Variables

| Variable          | Description                  |
| ----------------- | ---------------------------- |
| `DATABASE_URL`    | PostgreSQL connection string |
| `REDIS_URL`       | Redis connection string      |
| `NEXTAUTH_URL`    | Application URL              |
| `NEXTAUTH_SECRET` | Secret for JWT signing       |

---

## Testing Auth

```bash
# Register
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"register","data":{"email":"test@example.com","password":"password123","name":"Test User"}}'

# Login
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","data":{"email":"test@example.com","password":"password123"}}'

# Access protected route
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <refresh_token>"

# Refresh token
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"refresh","refreshToken":"<refresh_token>"}'

# Logout
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"logout","refreshToken":"<refresh_token>"}'
```
