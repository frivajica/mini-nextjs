# Next.js Authentication Guide

> This document explains how authentication works in this Next.js project.
> For comparison with Express/NestJS, see those projects' `AUTH_INFO.md`.

---

## Overview

This Next.js project uses **NextAuth.js v5** with JWT sessions and Redis-cached refresh tokens stored securely in httpOnly cookies.

| Component        | Technology                              |
| ---------------- | --------------------------------------- |
| Auth Framework   | NextAuth.js v5 (Beta)                   |
| Session Strategy | JWT (stored in secure HTTPOnly cookies) |
| Token Storage    | Redis + httpOnly cookies (secure)       |
| Database         | PostgreSQL via Drizzle ORM              |
| Password Hashing | bcrypt (12 rounds)                      |

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
│                   │  (Adapter)  │    │  (Users)   │       │
│                   └──────────────┘    └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Security Architecture

- **JWT Access Token**: Managed by NextAuth, stored in session cookie (HTTPOnly)
- **Refresh Token**: Stored in httpOnly cookie with SameSite=lax, secure in production
- **Redis**: Caches refresh token validation for fast lookups
- **API Routes**: Use NextAuth's `auth()` to verify JWT sessions

---

## API Routes (Split Design)

Auth functionality is split into separate route handlers:

| Endpoint                  | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `POST /api/auth/login`    | User login, sets httpOnly refresh cookie        |
| `POST /api/auth/register` | User registration, sets httpOnly refresh cookie |
| `POST /api/auth/refresh`  | Refresh access token using httpOnly cookie      |
| `POST /api/auth/logout`   | Revoke refresh token, clear httpOnly cookie     |
| `GET /api/auth/session`   | Get current session (handled by NextAuth)       |

---

## Token Flow

### 1. Login (Sets httpOnly Cookie)

```
Client                    Next.js API                 Redis           Database
  │                          │                          │                │
  │  POST /api/auth/login  │                          │                │
  │  { email, password }    │                          │                │
  │─────────────────────────▶│                          │                │
  │                          │  Rate limit check        │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │                          │  Validate credentials    │                │
  │                          │──────────────────────────▶│                │
  │                          │  (bcrypt compare)         │                │
  │                          │◀──────────────────────────│                │
  │                          │                          │                │
  │                          │  CREATE refresh_token     │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │                          │  Cache in Redis          │                │
  │                          │  SETEX refresh:token    │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │  httpOnly Cookie        │                          │                │
  │  (refresh_token)       │                          │                │
  │◀─────────────────────────│                          │                │
  │                          │                          │                │
```

### 2. Token Refresh (Atomic Rotation)

```
Client                    Next.js API                 Redis           Database
  │                          │                          │                │
  │  POST /api/auth/refresh │                          │                │
  │  Cookie: refresh_token  │                          │                │
  │─────────────────────────▶│                          │                │
  │                          │  Rate limit check        │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │                          │  Validate token          │                │
  │                          │  (Redis cache first)     │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │                          │  CREATE new token FIRST │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │                          │  REVOKE old token       │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │  New httpOnly Cookie   │                          │                │
  │◀─────────────────────────│                          │                │
  │                          │                          │                │
```

### 3. Logout (Clear Cookie)

```
Client                    Next.js API                 Redis           Database
  │                          │                          │                │
  │  POST /api/auth/logout │                          │                │
  │  Cookie: refresh_token  │                          │                │
  │─────────────────────────▶│                          │                │
  │                          │  Validate token          │                │
  │                          │  (verify ownership)      │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │                          │  REVOKE refresh_token    │                │
  │                          │  from DB                 │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │                          │  DELETE from Redis       │                │
  │                          │  DEL refresh:token      │                │
  │                          │─────────────────────────▶│                │
  │                          │                          │                │
  │  Clear Cookie           │                          │                │
  │◀─────────────────────────│                          │                │
  │                          │                          │                │
```

---

## Key Files

| File                                 | Purpose                        |
| ------------------------------------ | ------------------------------ |
| `src/lib/auth.ts`                    | NextAuth configuration, JWT    |
| `src/app/api/auth/login/route.ts`    | Login endpoint, sets cookie    |
| `src/app/api/auth/register/route.ts` | Register endpoint, sets cookie |
| `src/app/api/auth/refresh/route.ts`  | Token refresh, atomic rotation |
| `src/app/api/auth/logout/route.ts`   | Logout, clears cookie          |
| `src/services/user.service.ts`       | User CRUD, token management    |
| `src/lib/redis.ts`                   | Redis client + closeRedis()    |
| `src/lib/rate-limit.ts`              | Rate limiting + IP validation  |
| `src/lib/env.ts`                     | Environment validation         |
| `src/stores/auth.store.ts`           | Zustand store (user only)      |
| `src/middleware.ts`                  | Route protection middleware    |

---

## Database Schema

### Users Table

```typescript
// src/lib/schema.ts
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  password: text("password").notNull(),
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

1. **Password Hashing**: bcrypt with 12 rounds
2. **JWT Sessions**: Stored in HTTPOnly cookies (secure, not accessible to JS)
3. **Refresh Token Storage**: httpOnly cookies with SameSite=lax, secure in production
4. **Redis Caching**: Fast token validation without DB hit on every refresh
5. **Token Rotation**: Atomic rotation - create new first, then revoke old
6. **Rate Limiting**: 10 requests per minute per IP on all auth endpoints
7. **Input Validation**: Zod schemas for all inputs
8. **IP Spoofing Protection**: Validates x-forwarded-for against TRUSTED_PROXY_IP
9. **Refresh Token Validation**: Token ownership verified before revocation

---

## Environment Variables

| Variable           | Description                             |
| ------------------ | --------------------------------------- |
| `DATABASE_URL`     | PostgreSQL connection string (required) |
| `AUTH_SECRET`      | Secret for JWT signing (required)       |
| `REDIS_URL`        | Redis connection string (optional)      |
| `TRUSTED_PROXY_IP` | Trusted proxy IP for x-forwarded-for    |
| `NEXTAUTH_URL`     | Application URL (optional)              |

---

## Testing Auth

```bash
# Register (sets httpOnly cookie)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}' \
  -c cookies.txt

# Login (sets httpOnly cookie)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Refresh token (reads httpOnly cookie)
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt

# Logout (reads and clears httpOnly cookie)
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

┌─────────────────────────────────────────────────────────────┐
│ Next.js App │
├─────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────┐ ┌──────────────┐ ┌─────────────┐ │
│ │ Client │───▶│ NextAuth.js │───▶│ Redis │ │
│ └──────────┘ └──────────────┘ │ (Sessions) │ │
│ │ └─────────────┘ │
│ │ │ │
│ ▼ ▼ │
│ ┌──────────────┐ ┌─────────────┐ │
│ │ Drizzle │ │ PostgreSQL │ │
│ │ (Adapter) │ │ (Users) │ │
│ └──────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────┘

```

---

## Token Flow

### 1. Login

```

Client Next.js API Redis Database
│ │ │ │
│ POST /api/auth │ │ │
│ { email, password } │ │ │
│─────────────────────────▶│ │ │
│ │ Validate credentials │ │
│ │──────────────────────────▶│ │
│ │ (bcrypt compare) │ │
│ │◀──────────────────────────│ │
│ │ │ │
│ │ INSERT refresh_token │ │
│ │─────────────────────────▶│ │
│ │ │ │
│ │ Cache in Redis │ │
│ │ SETEX refresh:token │ │
│ │─────────────────────────▶│ │
│ │ │ │
│ JWT Session Cookie │ │ │
│◀─────────────────────────│ │ │
│ │ │ │

```

### 2. Accessing Protected Routes

```

Client Next.js API Redis Database
│ │ │ │
│ GET /users │ │ │
│ Cookie: JWT Session │ │ │
│─────────────────────────▶│ │ │
│ │ Verify JWT │ │
│ │ (NextAuth) │ │
│ │ │ │
│ { users: [...] } │ │ │
│◀─────────────────────────│ │ │
│ │ │ │

```

### 3. Token Refresh (with Redis)

```

Client Next.js API Redis Database
│ │ │ │
│ POST /api/auth │ │ │
│ { action: "refresh", │ │ │
│ refreshToken } │ │ │
│─────────────────────────▶│ │ │
│ │ Check Redis cache │ │
│ │ GET refresh:token │ │
│ │─────────────────────────▶│ │
│ │ │ │
│ │ Return userId if found │ │
│ │◀─────────────────────────│ │
│ │ │ │
│ │ DELETE old refresh │ │
│ │ token from DB │ │
│ │─────────────────────────▶│ │
│ │ │ │
│ │ INSERT new refresh │ │
│ │ token │ │
│ │─────────────────────────▶│ │
│ │ │ │
│ │ Update Redis cache │ │
│ │ SETEX refresh:new │ │
│ │─────────────────────────▶│ │
│ │ │ │
│ { refreshToken } │ │ │
│◀─────────────────────────│ │ │
│ │ │ │

```

### 4. Logout

```

Client Next.js API Redis Database
│ │ │ │
│ POST /api/auth │ │ │
│ { action: "logout", │ │ │
│ refreshToken } │ │ │
│─────────────────────────▶│ │ │
│ │ DELETE refresh_token │ │
│ │ from DB │ │
│ │─────────────────────────▶│ │
│ │ │ │
│ │ DELETE from Redis │ │
│ │ DEL refresh:token │ │
│ │─────────────────────────▶│ │
│ │ │ │
│ Clear session cookie │ │ │
│◀─────────────────────────│ │ │
│ │ │ │

````

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
````

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
